import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SCHEMA_VERSION, STORAGE_KEY } from '../config';
import { appStorage } from '../lib/storage';
import { uid } from '../lib/id';
import { todayStr } from '../lib/date';
import { toKg } from '../lib/units';
import { DEFAULT_THEME, type ThemeId } from '../theme/themes';
import type {
  ActiveSession,
  BodyWeightEntry,
  DisplayToggles,
  Goal,
  HistoryEntry,
  PR,
  Profile,
  SavedSplit,
  Settings,
  SplitDay,
  SplitExercise,
  Supplement,
} from '../types';

interface AppData {
  settings: Settings;
  profile: Profile;
  split: SplitDay[];
  savedSplits: SavedSplit[];
  history: HistoryEntry[];
  prs: PR[];
  bodyWeight: BodyWeightEntry[];
  goals: Goal[];
  supplements: Supplement[];
  supplementsTaken: { date: string | null; ids: string[] };
  achievements: { id: string; unlockedAt: string }[];
  activeSession: ActiveSession | null;
}

export interface EndSessionResult {
  entry: HistoryEntry;
  prHits: string[]; // exercise names that set a new PR
}

interface AppActions {
  // settings
  setTheme: (theme: ThemeId) => void;
  setUnits: (units: Settings['units']) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  toggleDisplay: (key: keyof DisplayToggles) => void;
  completeOnboarding: () => void;
  // profile
  setProfile: (patch: Partial<Profile>) => void;
  // split
  addDay: (name: string, exercises?: SplitExercise[]) => void;
  updateDay: (id: string, patch: Partial<Omit<SplitDay, 'id'>>) => void;
  removeDay: (id: string) => void;
  setDays: (days: SplitDay[]) => void;
  applyTemplate: (days: { name: string; exercises: SplitExercise[] }[]) => void;
  // saved splits
  saveCurrentSplit: (name: string) => void;
  deleteSavedSplit: (id: string) => void;
  applySavedSplit: (id: string) => void;
  // session
  startSession: (day: SplitDay) => void;
  updateSession: (updater: (s: ActiveSession) => ActiveSession) => void;
  cancelSession: () => void;
  endSession: (meta?: { rating?: number; note?: string }) => EndSessionResult | null;
  // prs
  addPR: (pr: Omit<PR, 'id'>) => void;
  removePR: (id: string) => void;
  // body weight
  addBodyWeight: (entry: Omit<BodyWeightEntry, 'id'>) => void;
  removeBodyWeight: (id: string) => void;
  // goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  removeGoal: (id: string) => void;
  // supplements
  addSupplement: (s: Omit<Supplement, 'id'>) => void;
  removeSupplement: (id: string) => void;
  toggleSupplementTaken: (id: string) => void;
  // data
  exportData: () => string;
  importData: (json: string) => boolean;
  resetData: () => void;
}

export type Store = AppData & AppActions;

const initialData: AppData = {
  settings: {
    theme: DEFAULT_THEME,
    units: 'kg',
    onboarded: false,
    preferredRest: 120,
    restChime: true,
    haptics: true,
    display: {
      stats: true,
      dayCards: true,
      lastWorkout: true,
      streak: true,
      weeklyRecap: true,
      didYouKnow: true,
    },
  },
  profile: { height: null, age: null, sex: null, activity: 'moderate' },
  split: [],
  savedSplits: [],
  history: [],
  prs: [],
  bodyWeight: [],
  goals: [],
  supplements: [],
  supplementsTaken: { date: null, ids: [] },
  achievements: [],
  activeSession: null,
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialData,

      // ---- settings ----
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      setUnits: (units) => set((s) => ({ settings: { ...s.settings, units } })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      toggleDisplay: (key) =>
        set((s) => ({
          settings: { ...s.settings, display: { ...s.settings.display, [key]: !s.settings.display[key] } },
        })),
      completeOnboarding: () => set((s) => ({ settings: { ...s.settings, onboarded: true } })),

      // ---- profile ----
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      // ---- split ----
      addDay: (name, exercises = []) =>
        set((s) => ({ split: [...s.split, { id: uid(), name, exercises }] })),
      updateDay: (id, patch) =>
        set((s) => ({ split: s.split.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      removeDay: (id) => set((s) => ({ split: s.split.filter((d) => d.id !== id) })),
      setDays: (days) => set({ split: days }),
      applyTemplate: (days) =>
        set({ split: days.map((d) => ({ id: uid(), name: d.name, exercises: d.exercises })) }),

      // ---- saved splits ----
      saveCurrentSplit: (name) =>
        set((s) => ({
          savedSplits: [
            ...s.savedSplits,
            {
              id: uid(),
              name,
              savedAt: new Date().toISOString(),
              days: s.split.map((d) => ({ name: d.name, exercises: d.exercises })),
            },
          ],
        })),
      deleteSavedSplit: (id) => set((s) => ({ savedSplits: s.savedSplits.filter((x) => x.id !== id) })),
      applySavedSplit: (id) =>
        set((s) => {
          const found = s.savedSplits.find((x) => x.id === id);
          if (!found) return {};
          return { split: found.days.map((d) => ({ id: uid(), name: d.name, exercises: d.exercises })) };
        }),

      // ---- session ----
      startSession: (day) =>
        set({
          activeSession: {
            dayId: day.id,
            dayName: day.name,
            startedAt: Date.now(),
            exercises: day.exercises.map((e) => ({
              name: e.name,
              sets: [{ weight: '', reps: '', done: false }],
            })),
            restEndsAt: null,
            restDuration: null,
          },
        }),
      updateSession: (updater) =>
        set((s) => (s.activeSession ? { activeSession: updater(s.activeSession) } : {})),
      cancelSession: () => set({ activeSession: null }),
      endSession: (meta) => {
        const s = get();
        const sess = s.activeSession;
        if (!sess) return null;
        const units = s.settings.units;

        const exercises = sess.exercises
          .map((ex) => ({
            name: ex.name,
            sets: ex.sets
              .filter((set) => set.done && set.weight !== '' && set.reps !== '')
              .map((set) => ({
                weight: toKg(set.weight, units),
                reps: Number(set.reps) || 0,
                toFailure: set.toFailure,
                rpe: set.rpe,
              })),
          }))
          .filter((ex) => ex.sets.length > 0);

        if (exercises.length === 0) {
          set({ activeSession: null });
          return null;
        }

        const entry: HistoryEntry = {
          id: uid(),
          date: todayStr(),
          dayId: sess.dayId,
          dayName: sess.dayName,
          exercises,
          durationSec: Math.round((Date.now() - sess.startedAt) / 1000),
          rating: meta?.rating,
          note: meta?.note,
        };

        // PR detection: heaviest set per exercise beats stored PR weight.
        const prs = [...s.prs];
        const prHits: string[] = [];
        for (const ex of exercises) {
          const heaviest = ex.sets.reduce((m, set) => (set.weight > m.weight ? set : m), ex.sets[0]);
          const idx = prs.findIndex((p) => p.exercise.toLowerCase() === ex.name.toLowerCase());
          if (idx === -1) {
            prs.push({ id: uid(), exercise: ex.name, weight: heaviest.weight, reps: heaviest.reps, date: entry.date });
            prHits.push(ex.name);
          } else if (heaviest.weight > prs[idx].weight) {
            prs[idx] = { ...prs[idx], weight: heaviest.weight, reps: heaviest.reps, date: entry.date };
            prHits.push(ex.name);
          }
        }

        set({ history: [entry, ...s.history], prs, activeSession: null });
        return { entry, prHits };
      },

      // ---- prs ----
      addPR: (pr) => set((s) => ({ prs: [{ ...pr, id: uid() }, ...s.prs] })),
      removePR: (id) => set((s) => ({ prs: s.prs.filter((p) => p.id !== id) })),

      // ---- body weight ----
      addBodyWeight: (entry) => set((s) => ({ bodyWeight: [...s.bodyWeight, { ...entry, id: uid() }] })),
      removeBodyWeight: (id) => set((s) => ({ bodyWeight: s.bodyWeight.filter((b) => b.id !== id) })),

      // ---- goals ----
      addGoal: (goal) =>
        set((s) => ({ goals: [...s.goals, { ...goal, id: uid(), createdAt: new Date().toISOString() }] })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      // ---- supplements ----
      addSupplement: (sup) => set((s) => ({ supplements: [...s.supplements, { ...sup, id: uid() }] })),
      removeSupplement: (id) => set((s) => ({ supplements: s.supplements.filter((x) => x.id !== id) })),
      toggleSupplementTaken: (id) =>
        set((s) => {
          const today = todayStr();
          const base = s.supplementsTaken.date === today ? s.supplementsTaken.ids : [];
          const ids = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
          return { supplementsTaken: { date: today, ids } };
        }),

      // ---- data portability ----
      exportData: () => {
        const s = get();
        const payload: AppData = {
          settings: s.settings,
          profile: s.profile,
          split: s.split,
          savedSplits: s.savedSplits,
          history: s.history,
          prs: s.prs,
          bodyWeight: s.bodyWeight,
          goals: s.goals,
          supplements: s.supplements,
          supplementsTaken: s.supplementsTaken,
          achievements: s.achievements,
          activeSession: s.activeSession,
        };
        return JSON.stringify({ app: 'mettle', version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data: payload }, null, 2);
      },
      importData: (json) => {
        try {
          const parsed = JSON.parse(json);
          const data = (parsed?.data ?? parsed) as Partial<AppData>;
          if (!data || typeof data !== 'object') return false;
          set((s) => ({
            ...s,
            ...data,
            settings: { ...s.settings, ...(data.settings ?? {}) },
            profile: { ...s.profile, ...(data.profile ?? {}) },
          }));
          return true;
        } catch {
          return false;
        }
      },
      resetData: () =>
        set((s) => ({
          split: [],
          savedSplits: [],
          history: [],
          prs: [],
          bodyWeight: [],
          goals: [],
          supplements: [],
          supplementsTaken: { date: null, ids: [] },
          achievements: [],
          activeSession: null,
          // keep settings + profile
          settings: s.settings,
          profile: s.profile,
        })),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => appStorage),
      partialize: (s) => ({
        settings: s.settings,
        profile: s.profile,
        split: s.split,
        savedSplits: s.savedSplits,
        history: s.history,
        prs: s.prs,
        bodyWeight: s.bodyWeight,
        goals: s.goals,
        supplements: s.supplements,
        supplementsTaken: s.supplementsTaken,
        achievements: s.achievements,
        activeSession: s.activeSession,
      }),
    },
  ),
);
