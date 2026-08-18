import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  fetchNotificationsSince,
  subscribeNotifications,
  type AppNotification,
} from '../lib/notifications';

/**
 * Notification state. Not persisted into the synced blob — the "seen" mark is
 * device-local on purpose: reading notifications on your phone shouldn't
 * silently clear the badge on your tablet. It lives in raw localStorage, the
 * same precedent sync.ts sets with its updatedAt key.
 */

const SEEN_KEY = 'mettle.notif.seenAt';
const READ_KEY = 'mettle.notif.read';
const POLL_LIVE_MS = 90_000;
const POLL_FALLBACK_MS = 30_000;

const readSeen = (): string => {
  try {
    // First run: only surface things from here on, not a year of backlog.
    return localStorage.getItem(SEEN_KEY) ?? new Date(Date.now() - 7 * 86400000).toISOString();
  } catch {
    return new Date(Date.now() - 7 * 86400000).toISOString();
  }
};
const writeSeen = (iso: string) => {
  try {
    localStorage.setItem(SEEN_KEY, iso);
  } catch {
    /* ignore */
  }
};
const readReadIds = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
};
const writeReadIds = (ids: Set<string>) => {
  try {
    // FIFO cap — this only exists to stop a reload resurrecting old badges.
    localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    /* ignore */
  }
};

interface NotificationsState {
  items: AppNotification[];
  unread: number;
  loading: boolean;
  live: boolean;
  init: (userId: string) => void;
  teardown: () => void;
  refresh: () => Promise<void>;
  markAllSeen: () => void;
  pushLocal: (n: AppNotification) => void;
}

let userId: string | null = null;
let unsubscribe: (() => void) | null = null;
let poll: ReturnType<typeof setInterval> | null = null;
let onVisible: (() => void) | null = null;

export const useNotifications = create<NotificationsState>((set, get) => ({
  items: [],
  unread: 0,
  loading: false,
  live: false,

  init: (id) => {
    if (!supabase || userId === id) return;
    get().teardown();
    userId = id;

    void get().refresh();

    unsubscribe = subscribeNotifications(
      id,
      () => void get().refresh(),
      (live) => {
        set({ live });
        // Without a live channel, poll harder so the bell isn't stale.
        if (poll) clearInterval(poll);
        poll = setInterval(() => void get().refresh(), live ? POLL_LIVE_MS : POLL_FALLBACK_MS);
      },
    );

    onVisible = () => {
      if (document.visibilityState === 'visible') void get().refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
  },

  teardown: () => {
    unsubscribe?.();
    unsubscribe = null;
    if (poll) clearInterval(poll);
    poll = null;
    if (onVisible) document.removeEventListener('visibilitychange', onVisible);
    onVisible = null;
    userId = null;
    set({ items: [], unread: 0, live: false, loading: false });
  },

  /** Idempotent merge. Never advances the watermark, so a background fetch
   *  can't silently eat something you haven't seen. */
  refresh: async () => {
    if (!userId) return;
    set({ loading: true });
    const res = await fetchNotificationsSince(userId, readSeen());
    const readIds = readReadIds();
    set((s) => {
      const byId = new Map(s.items.map((n) => [n.id, n]));
      for (const n of res.data) {
        const existing = byId.get(n.id);
        byId.set(n.id, { ...n, read: existing?.read ?? readIds.has(n.id) });
      }
      const items = [...byId.values()]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 50);
      return { items, unread: items.filter((n) => !n.read).length, loading: false };
    });
  },

  markAllSeen: () => {
    const ids = readReadIds();
    get().items.forEach((n) => ids.add(n.id));
    writeReadIds(ids);
    writeSeen(new Date().toISOString());
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })), unread: 0 }));
  },

  /** Transient items (a friend starting a session) that have no row to fetch. */
  pushLocal: (n) => {
    set((s) => {
      if (s.items.some((x) => x.id === n.id)) return s;
      const items = [n, ...s.items].slice(0, 50);
      return { items, unread: items.filter((x) => !x.read).length };
    });
  },
}));

/**
 * Called from the presence roster diff. The caller resolves the friend and
 * passes it in — this module deliberately doesn't import the social store, so
 * there's no import cycle between the two.
 */
export function notifyFriendTraining(friend: {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}): void {
  const hour = new Date().toISOString().slice(0, 13);
  useNotifications.getState().pushLocal({
    id: `training:${friend.userId}:${hour}`,
    kind: 'friend-training',
    createdAt: new Date().toISOString(),
    actorId: friend.userId,
    actorName: friend.displayName,
    actorAvatar: friend.avatarUrl,
    read: false,
  });
}
