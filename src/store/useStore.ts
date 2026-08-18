import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SCHEMA_VERSION, STORAGE_KEY } from '../config';
import { appStorage } from '../lib/storage';
import { uid } from '../lib/id';
import { todayStr } from '../lib/date';
import { parseNum, toKg, toKm } from '../lib/units';
import { DEFAULT_THEME, normalizeTheme, type ThemeMode } from '../theme/themes';
import { STYLE_DEFS } from '../data/trainingStyles';
import type { CustomRoutine, CustomStretch } from '../data/stretches';
import { EXERCISE_LIBRARY } from '../data/exercises';
import type {
  ActiveSession,
  ApplyMode,
  BodyWeightEntry,
  CustomExercise,
  DisplayToggles,
  Goal,
  HistoryEntry,
  PlaybookProgress,
  PR,
  Profile,
  SavedSplit,
  Settings,
  SplitDay,
  SplitExercise,
  StallReason,
  Supplement,
  TabToggles,
  TrainingStyle,
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
  playbook: PlaybookProgress;
  customStretches: CustomStretch[];
  customRoutines: CustomRoutine[];
  customExercises: CustomExercise[];
  activeSession: ActiveSession | null;
}

export interface EndSessionResult {
  entry: HistoryEntry;
  prHits: string[]; // exercise names that set a new PR
}

interface AppActions {
  // settings
  setTheme: (theme: ThemeMode) => void;
  setUnits: (units: Settings['units']) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  toggleDisplay: (key: keyof DisplayToggles) => void;
  toggleTab: (key: keyof TabToggles) => void;
  setTrainingStyle: (style: TrainingStyle) => void;
  completeOnboarding: () => void;
  // profile
  setProfile: (patch: Partial<Profile>) => void;
  // split
  addDay: (name: string, exercises?: SplitExercise[]) => void;
  updateDay: (id: string, patch: Partial<Omit<SplitDay, 'id'>>) => void;
  removeDay: (id: string) => void;
  setDays: (days: SplitDay[]) => void;
  /** 'replace' swaps your whole split; 'append' keeps it and adds these days. */
  applyTemplate: (days: { name: string; exercises: SplitExercise[] }[], mode?: ApplyMode) => void;
  // saved splits
  saveCurrentSplit: (name: string) => void;
  deleteSavedSplit: (id: string) => void;
  applySavedSplit: (id: string, mode?: ApplyMode) => void;
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
  /** Latch a goal as reached. No-op once already complete. */
  completeGoal: (id: string) => void;

  /** Persist any newly-earned achievements; returns the ids unlocked just now. */
  unlockAchievements: (earnedIds: string[]) => string[];

  /** Attach why each stalled lift stalled to a saved workout. */
  setStallReasons: (entryId: string, reasons: Record<string, StallReason>) => void;
  // playbook
  markArticleRead: (id: string) => void;
  skipAheadSection: (sectionId: string, level: number) => void;
  setLastOpenedArticle: (id: string | null) => void;
  // supplements
  addSupplement: (s: Omit<Supplement, 'id'>) => void;
  removeSupplement: (id: string) => void;
  toggleSupplementTaken: (id: string) => void;
  // custom stretches & routines
  addCustomStretch: (s: Omit<CustomStretch, 'id'>) => void;
  removeCustomStretch: (id: string) => void;
  addCustomRoutine: (r: Omit<CustomRoutine, 'id'>) => void;
  removeCustomRoutine: (id: string) => void;
  // custom exercises
  addCustomExercise: (e: Omit<CustomExercise, 'id'>) => void;
  removeCustomExercise: (id: string) => void;
  // data
  exportData: () => string;
  importData: (json: string) => boolean;
  resetData: () => void;
}

export type Store = AppData & AppActions;

/** Sanity ceiling for logged numbers (4 digits) — the UI already clamps typed
 *  input; this guards every commit path (imports, fast-fill, future callers). */
const cap = (n: number, max = 9999) => Math.min(Math.max(0, n), max);

const initialData: AppData = {
  settings: {
    theme: DEFAULT_THEME,
    units: 'kg',
    onboarded: false,
    preferredRest: 120,
    autoRest: true,
    defaultTargetSets: 3,
    defaultTargetReps: '8–12',
    restChime: true,
    haptics: true,
    soundFx: true,
    trainingStyle: null,
    lastSeenVersion: '',
    tabs: { split: true, stretch: true, recovery: false, progress: true, learn: false, friends: true },
    display: {
      stats: true,
      dayCards: true,
      lastWorkout: true,
      streak: true,
      weeklyRecap: true,
      didYouKnow: true,
      todaysLesson: true,
      dailyWatch: true,
      upNext: true,
    },
  },
  profile: { height: null, age: null, sex: 'male', activity: 'moderate' },
  split: [],
  savedSplits: [],
  history: [],
  prs: [],
  bodyWeight: [],
  goals: [],
  supplements: [],
  supplementsTaken: { date: null, ids: [] },
  achievements: [],
  playbook: { read: {}, unlocked: {}, lastOpened: null },
  customStretches: [],
  customRoutines: [],
  customExercises: [],
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
      toggleTab: (key) =>
        set((s) => ({
          settings: { ...s.settings, tabs: { ...s.settings.tabs, [key]: !s.settings.tabs[key] } },
        })),
      setTrainingStyle: (style) =>
        set((s) => {
          const def = STYLE_DEFS[style];
          return {
            settings: {
              ...s.settings,
              trainingStyle: style,
              tabs: { ...def.tabs },
              preferredRest: def.preferredRest,
            },
          };
        }),
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
      applyTemplate: (days, mode = 'replace') =>
        set((s) => {
          const fresh = days.map((d) => ({ id: uid(), name: d.name, exercises: d.exercises }));
          return { split: mode === 'append' ? [...s.split, ...fresh] : fresh };
        }),

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
      applySavedSplit: (id, mode = 'replace') =>
        set((s) => {
          const found = s.savedSplits.find((x) => x.id === id);
          if (!found) return {};
          const fresh = found.days.map((d) => ({ id: uid(), name: d.name, exercises: d.exercises }));
          return { split: mode === 'append' ? [...s.split, ...fresh] : fresh };
        }),

      // ---- session ----
      startSession: (day) =>
        set({
          activeSession: {
            dayId: day.id,
            dayName: day.name,
            startedAt: Date.now(),
            // Seed one row per planned set so the logger opens ready to fill.
            exercises: day.exercises.map((e) => ({
              name: e.name,
              targetReps: e.targetReps,
              sets: Array.from({ length: Math.max(1, e.targetSets ?? 1) }, () => ({
                weight: '',
                reps: '',
                done: false,
              })),
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
              // A set counts if it's done and carries either weight×reps or (cardio) minutes.
              .filter(
                (set) =>
                  set.done &&
                  ((set.weight !== '' && set.reps !== '') || (set.duration ?? '').trim() !== ''),
              )
              .map((set) => {
                const mins = (set.duration ?? '').trim() ? parseNum(set.duration!) : NaN;
                if (!isNaN(mins) && mins > 0) {
                  const km = (set.distance ?? '').trim() ? cap(toKm(set.distance!, units), 999) : 0;
                  return {
                    weight: 0,
                    reps: 0,
                    durationMin: cap(Math.round(mins * 10) / 10),
                    ...(km > 0 ? { distanceKm: km } : {}),
                  };
                }
                return {
                  weight: cap(toKg(set.weight, units)),
                  reps: cap(Number(set.reps) || 0),
                  toFailure: set.toFailure,
                  rpe: set.rpe,
                };
              }),
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
          // Clock time the session began — the date alone can't tell an early
          // morning session from a late night one.
          startedAt: sess.startedAt,
          rating: meta?.rating,
          note: meta?.note,
        };

        // PR detection: heaviest set per exercise beats stored PR weight.
        // Cardio sets (weight 0, minutes logged) never create or update PRs.
        const prs = [...s.prs];
        const prHits: string[] = [];
        for (const ex of exercises) {
          const liftSets = ex.sets.filter((set) => set.weight > 0);
          if (liftSets.length === 0) continue;
          const heaviest = liftSets.reduce((m, set) => (set.weight > m.weight ? set : m), liftSets[0]);
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
      addPR: (pr) =>
        set((s) => ({ prs: [{ ...pr, weight: cap(pr.weight), reps: cap(pr.reps), id: uid() }, ...s.prs] })),
      removePR: (id) => set((s) => ({ prs: s.prs.filter((p) => p.id !== id) })),

      // ---- body weight ----
      addBodyWeight: (entry) =>
        set((s) => ({ bodyWeight: [...s.bodyWeight, { ...entry, weight: cap(entry.weight), id: uid() }] })),
      removeBodyWeight: (id) => set((s) => ({ bodyWeight: s.bodyWeight.filter((b) => b.id !== id) })),

      // ---- goals ----
      addGoal: (goal) =>
        set((s) => ({ goals: [...s.goals, { ...goal, id: uid(), createdAt: new Date().toISOString() }] })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      completeGoal: (id) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id && !g.completedAt ? { ...g, completedAt: new Date().toISOString() } : g,
          ),
        })),

      setStallReasons: (entryId, reasons) =>
        set((s) => ({
          history: s.history.map((h) =>
            h.id === entryId ? { ...h, stallReasons: { ...h.stallReasons, ...reasons } } : h,
          ),
        })),

      // ---- playbook ----
      markArticleRead: (id) =>
        set((s) =>
          s.playbook.read[id]
            ? {}
            : { playbook: { ...s.playbook, read: { ...s.playbook.read, [id]: new Date().toISOString() } } },
        ),
      skipAheadSection: (sectionId, level) =>
        set((s) => ({
          playbook: {
            ...s.playbook,
            unlocked: { ...s.playbook.unlocked, [sectionId]: Math.max(level, s.playbook.unlocked[sectionId] ?? 1) },
          },
        })),
      setLastOpenedArticle: (id) => set((s) => ({ playbook: { ...s.playbook, lastOpened: id } })),

      // ---- achievements ----
      unlockAchievements: (earnedIds) => {
        const known = new Set(get().achievements.map((a) => a.id));
        const fresh = earnedIds.filter((id) => !known.has(id));
        if (fresh.length === 0) return [];
        const unlockedAt = new Date().toISOString();
        set((s) => ({ achievements: [...s.achievements, ...fresh.map((id) => ({ id, unlockedAt }))] }));
        return fresh;
      },

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

      // ---- custom stretches & routines ----
      addCustomStretch: (cs) =>
        set((s) => ({ customStretches: [...s.customStretches, { ...cs, id: uid() }] })),
      removeCustomStretch: (id) =>
        set((s) => ({ customStretches: s.customStretches.filter((x) => x.id !== id) })),
      addCustomRoutine: (r) =>
        set((s) => ({ customRoutines: [...s.customRoutines, { ...r, id: uid() }] })),
      removeCustomRoutine: (id) =>
        set((s) => ({ customRoutines: s.customRoutines.filter((x) => x.id !== id) })),

      // ---- custom exercises ----
      addCustomExercise: (e) =>
        set((s) => {
          const name = e.name.trim();
          const lower = name.toLowerCase();
          // De-dupe against the built-in library and existing customs.
          if (!name || EXERCISE_LIBRARY.some((x) => x.name.toLowerCase() === lower)) return {};
          if (s.customExercises.some((x) => x.name.toLowerCase() === lower)) return {};
          return { customExercises: [...s.customExercises, { ...e, name, id: uid() }] };
        }),
      removeCustomExercise: (id) =>
        set((s) => ({ customExercises: s.customExercises.filter((x) => x.id !== id) })),

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
        playbook: s.playbook,
          customStretches: s.customStretches,
          customRoutines: s.customRoutines,
          customExercises: s.customExercises,
          activeSession: s.activeSession,
        };
        return JSON.stringify({ app: 'mettle', version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data: payload }, null, 2);
      },
      importData: (json) => {
        try {
          const parsed = JSON.parse(json);
          const data = (parsed?.data ?? parsed) as Partial<AppData>;
          if (!data || typeof data !== 'object') return false;
          set((s) => {
            const settings = { ...s.settings, ...(data.settings ?? {}) };
            // Imported blobs (manual backups, cloud sync from an old build) can
            // carry retired theme ids — importData bypasses the persist migration.
            settings.theme = normalizeTheme(settings.theme);
            return { ...s, ...data, settings, profile: { ...s.profile, ...(data.profile ?? {}) } };
          });
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
          playbook: { read: {}, unlocked: {}, lastOpened: null },
          customStretches: [],
          customRoutines: [],
          customExercises: [],
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
      // v1 → v2: the four-theme system collapsed into one signature look with
      // dark/light modes. Old picks map to the nearest scene.
      migrate: (persisted, version) => {
        if (version < 2) {
          const p = persisted as Partial<AppData> | undefined;
          if (p?.settings) p.settings.theme = normalizeTheme(p.settings.theme);
        }
        return persisted as AppData;
      },
      // Deep-merge persisted state over defaults so settings added in later
      // versions (tabs, trainingStyle, display.upNext, …) always have a value.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppData>;
        const ps = (p.settings ?? {}) as Partial<Settings>;
        const profile = { ...current.profile, ...(p.profile ?? {}) };
        // Older installs stored sex:null, which silently blocked calorie targets.
        // Default it so TDEE always resolves once height + age are set.
        if (profile.sex == null) profile.sex = 'male';
        return {
          ...current,
          ...p,
          settings: {
            ...current.settings,
            ...ps,
            tabs: { ...current.settings.tabs, ...(ps.tabs ?? {}) },
            display: { ...current.settings.display, ...(ps.display ?? {}) },
          },
          profile,
          // Nested objects need the same explicit spread tabs/display get, or a
          // persisted blob would replace the default wholesale.
          playbook: {
            ...current.playbook,
            ...(p.playbook ?? {}),
            read: { ...(p.playbook?.read ?? {}) },
            unlocked: { ...(p.playbook?.unlocked ?? {}) },
          },
        };
      },
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
        playbook: s.playbook,
        customStretches: s.customStretches,
        customRoutines: s.customRoutines,
        customExercises: s.customExercises,
        activeSession: s.activeSession,
      }),
    },
  ),
);
