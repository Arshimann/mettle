import { create } from 'zustand';
import type { HistoryEntry } from '../types';
import type {
  FriendRequestRow,
  FriendSummary,
  MyShared,
  PresenceInfo,
  SharedPrivacy,
} from '../types/social';
import * as social from '../lib/social';
import { joinPresence, leavePresence, presenceJoined } from '../lib/presence';
import { usePhysique } from './usePhysique';
import { useNotifications, notifyFriendTraining } from './useNotifications';

/**
 * Social state — NOT persisted. Fetched fresh per sign-in so offline devices
 * never show stale friend data as if it were live. All heavy content
 * (friend profiles, workouts, comments) is fetched on demand by the screens;
 * this store holds only the roster, requests, presence, and my identity.
 */

interface SocialState {
  userId: string | null;
  ready: boolean;
  loading: boolean;
  error: string | null;
  myShared: MyShared | null;
  friends: FriendSummary[];
  requestsIn: FriendRequestRow[];
  requestsOut: FriendRequestRow[];
  presence: Record<string, PresenceInfo>;

  init: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
  teardown: () => void;
  /** Lazily join the shared presence channel (first Friends-tab visit). */
  ensurePresence: () => void;
  /** Re-upload my snapshot (streak/PRs/customs) — cheap, fire-and-forget. */
  republish: () => void;
  /** Publish a just-finished workout + refreshed snapshot. */
  publishFinishedWorkout: (entry: HistoryEntry, prHits: string[]) => void;
  /** Wipe everything I've published (reset data). */
  wipePublished: () => void;

  setDisplayName: (name: string) => Promise<social.SocialResult>;
  setAvatar: (file: File) => Promise<social.SocialResult<string>>;
  setPrivacyFlag: (key: keyof SharedPrivacy, value: boolean) => Promise<void>;
  sendRequest: (toId: string) => Promise<social.SocialResult>;
  accept: (requestId: string) => Promise<void>;
  declineOrCancel: (requestId: string) => Promise<void>;
  unfriend: (friendId: string) => Promise<void>;
}

export const useSocial = create<SocialState>((set, get) => ({
  userId: null,
  ready: false,
  loading: false,
  error: null,
  myShared: null,
  friends: [],
  requestsIn: [],
  requestsOut: [],
  presence: {},

  init: async (userId) => {
    set({ userId, loading: true, error: null });
    const res = await social.ensureSharedProfile(userId);
    if (!res.ok || !res.data) {
      set({ loading: false, ready: true, error: res.message ?? 'Could not load your profile' });
      return;
    }
    set({ myShared: res.data });
    await get().refresh();
    set({ ready: true, loading: false });
    // The bell should work app-wide, not only after visiting Friends.
    useNotifications.getState().init(userId);
    get().ensurePresence();
    // Fresh snapshot + workout backfill, off the critical path.
    void social.publishSharedProfile(userId, res.data.privacy);
    void social.backfillWorkouts(userId, res.data.privacy);
  },

  refresh: async () => {
    const { userId } = get();
    if (!userId) return;
    const [friends, requests] = await Promise.all([
      social.fetchFriends(userId),
      social.fetchRequests(userId),
    ]);
    set({
      friends: friends.ok && friends.data ? friends.data : get().friends,
      requestsIn: requests.ok && requests.data ? requests.data.incoming : get().requestsIn,
      requestsOut: requests.ok && requests.data ? requests.data.outgoing : get().requestsOut,
      error: friends.ok && requests.ok ? null : (friends.message ?? requests.message ?? null),
    });
  },

  teardown: () => {
    leavePresence();
    usePhysique.getState().teardown();
    useNotifications.getState().teardown();
    set({
      userId: null,
      ready: false,
      loading: false,
      error: null,
      myShared: null,
      friends: [],
      requestsIn: [],
      requestsOut: [],
      presence: {},
    });
  },

  ensurePresence: () => {
    const { userId } = get();
    if (!userId || presenceJoined()) return;
    joinPresence(
      userId,
      (roster) => set({ presence: roster }),
      (diffs) => diffs.forEach((d) => notifyFriendTraining(d.userId)),
    );
  },

  republish: () => {
    const { userId, myShared } = get();
    if (!userId || !myShared) return;
    void social.publishSharedProfile(userId, myShared.privacy);
  },

  publishFinishedWorkout: (entry, prHits) => {
    const { userId, myShared } = get();
    if (!userId || !myShared) return;
    if (myShared.privacy.shareWorkouts) void social.publishWorkout(userId, entry, prHits);
    void social.publishSharedProfile(userId, myShared.privacy);
  },

  wipePublished: () => {
    const { userId } = get();
    if (!userId) return;
    void social.unpublishAll(userId);
  },

  setDisplayName: async (name) => {
    const { userId } = get();
    if (!userId) return { ok: false, message: 'Not signed in' };
    const res = await social.updateDisplayName(userId, name);
    if (res.ok) {
      set((s) => (s.myShared ? { myShared: { ...s.myShared, displayName: name.trim() } } : {}));
    }
    return res;
  },

  setAvatar: async (file) => {
    const { userId } = get();
    if (!userId) return { ok: false, message: 'Not signed in' };
    const res = await social.uploadAvatar(userId, file);
    if (res.ok && res.data) {
      const url = res.data;
      set((s) => (s.myShared ? { myShared: { ...s.myShared, avatarUrl: url } } : {}));
    }
    return res;
  },

  setPrivacyFlag: async (key, value) => {
    const { userId, myShared } = get();
    if (!userId || !myShared) return;
    const privacy = { ...myShared.privacy, [key]: value };
    set({ myShared: { ...myShared, privacy } });
    await social.updatePrivacy(userId, privacy);
    // Republish so newly-private fields empty out (or newly-public ones fill in),
    // and reconcile published workout rows against the new flag.
    await social.publishSharedProfile(userId, privacy);
    if (key === 'shareWorkouts') await social.backfillWorkouts(userId, privacy);
  },

  sendRequest: async (toId) => {
    const { userId } = get();
    if (!userId) return { ok: false, message: 'Not signed in' };
    const res = await social.sendFriendRequest(userId, toId);
    if (res.ok) await get().refresh();
    return res;
  },

  accept: async (requestId) => {
    const res = await social.acceptFriendRequest(requestId);
    if (res.ok) await get().refresh();
    else set({ error: res.message ?? null });
  },

  declineOrCancel: async (requestId) => {
    await social.deleteFriendRequest(requestId);
    await get().refresh();
  },

  unfriend: async (friendId) => {
    const { userId } = get();
    if (!userId) return;
    await social.removeFriend(userId, friendId);
    await get().refresh();
  },
}));
