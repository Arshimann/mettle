import { create } from 'zustand';
import * as api from '../lib/physique';
import type { PhysiquePost, PhysiqueReaction, PhysiqueVisibility } from '../lib/physique';
import { useSocial } from './useSocial';

/**
 * Physique board state. Not persisted — like useSocial, it's fetched fresh per
 * sign-in so an offline device never shows stale photos as if they were live.
 * Nothing physique-related ever enters the synced blob.
 */
interface PhysiqueState {
  myPosts: PhysiquePost[];
  board: PhysiquePost[];
  reactions: PhysiqueReaction[];
  loadingMine: boolean;
  loadingBoard: boolean;
  error: string | null;

  loadMine: (userId: string) => Promise<void>;
  loadBoard: () => Promise<void>;
  post: (
    userId: string,
    file: File,
    meta: Parameters<typeof api.createPost>[2],
  ) => Promise<{ ok: boolean; message?: string }>;
  setVisibility: (postId: string, v: PhysiqueVisibility) => Promise<void>;
  remove: (post: PhysiquePost) => Promise<void>;
  react: (postId: string, reactorId: string, emoji: string | null) => Promise<void>;
  teardown: () => void;
}

export const usePhysique = create<PhysiqueState>((set, get) => ({
  myPosts: [],
  board: [],
  reactions: [],
  loadingMine: false,
  loadingBoard: false,
  error: null,

  loadMine: async (userId) => {
    set({ loadingMine: true });
    const res = await api.fetchMyPosts(userId);
    set({
      loadingMine: false,
      myPosts: res.ok && res.data ? res.data : get().myPosts,
      error: res.ok ? null : (res.message ?? null),
    });
  },

  loadBoard: async () => {
    const friendIds = useSocial.getState().friends.map((f) => f.userId);
    set({ loadingBoard: true });
    const res = await api.fetchBoard(friendIds);
    const posts = res.ok && res.data ? res.data : [];
    set({ loadingBoard: false, board: posts, error: res.ok ? null : (res.message ?? null) });
    if (posts.length > 0) {
      const r = await api.fetchPhysiqueReactions(posts.map((p) => p.id));
      if (r.ok && r.data) set({ reactions: r.data });
    }
  },

  post: async (userId, file, meta) => {
    const res = await api.createPost(userId, file, meta);
    if (res.ok && res.data) set((s) => ({ myPosts: [res.data!, ...s.myPosts] }));
    return { ok: res.ok, message: res.message };
  },

  setVisibility: async (postId, v) => {
    // Optimistic — the switch should feel instant.
    set((s) => ({ myPosts: s.myPosts.map((p) => (p.id === postId ? { ...p, visibility: v } : p)) }));
    const res = await api.setPostVisibility(postId, v);
    if (!res.ok) set({ error: res.message ?? 'Could not change visibility' });
  },

  remove: async (post) => {
    const res = await api.deletePost(post);
    if (res.ok) {
      set((s) => ({
        myPosts: s.myPosts.filter((p) => p.id !== post.id),
        board: s.board.filter((p) => p.id !== post.id),
      }));
    } else set({ error: res.message ?? 'Could not delete' });
  },

  react: async (postId, reactorId, emoji) => {
    await (emoji
      ? api.setPhysiqueReaction(postId, reactorId, emoji)
      : api.clearPhysiqueReaction(postId, reactorId));
    const ids = get().board.map((p) => p.id);
    const r = await api.fetchPhysiqueReactions(ids);
    if (r.ok && r.data) set({ reactions: r.data });
  },

  teardown: () => {
    api.clearSignedUrls();
    set({ myPosts: [], board: [], reactions: [], error: null });
  },
}));
