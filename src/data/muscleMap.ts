import type { MuscleGroup } from './exercises';

/**
 * Muscle regions — one level finer than MuscleGroup, which is the level real
 * training questions live at ("my front delts get four times the work my side
 * delts do" is invisible at group level).
 *
 * Rather than hand-maintaining a 112-entry table that goes stale the moment
 * someone adds a custom exercise, regions are resolved by ordered pattern
 * rules with a small override table for the handful the rules misread. That
 * covers custom movements and a friend's imported ones for free.
 */
export type MuscleRegion =
  | 'upper-chest' | 'mid-chest' | 'lower-chest'
  | 'front-delt' | 'side-delt' | 'rear-delt'
  | 'lats' | 'traps' | 'rhomboids' | 'lower-back'
  | 'quads' | 'hams' | 'glutes' | 'calves' | 'adductors'
  | 'biceps' | 'triceps' | 'forearms'
  | 'abs' | 'obliques';

/** Fractional credit per region: 1 primary, 0.5 secondary, 0.25 stabiliser. */
export type RegionWeights = Partial<Record<MuscleRegion, number>>;

export interface RegionDef {
  id: MuscleRegion;
  label: string;
  group: MuscleGroup;
  /** Evidence-informed weekly hard-set band, fractional credit included. */
  target: [min: number, max: number];
  /** Drives the advice: a small muscle never needs "another session". */
  size: 'large' | 'medium' | 'small';
}

/**
 * Targets deliberately differ by region size. Front delts sit low because they
 * collect credit from every press — that's exactly what surfaces the classic
 * over-pressed / under-side-raised imbalance.
 */
export const REGIONS: Record<MuscleRegion, RegionDef> = {
  'upper-chest': { id: 'upper-chest', label: 'Upper chest', group: 'Chest', target: [4, 10], size: 'medium' },
  'mid-chest': { id: 'mid-chest', label: 'Mid chest', group: 'Chest', target: [8, 16], size: 'large' },
  'lower-chest': { id: 'lower-chest', label: 'Lower chest', group: 'Chest', target: [3, 8], size: 'small' },
  'front-delt': { id: 'front-delt', label: 'Front delts', group: 'Shoulders', target: [4, 12], size: 'medium' },
  'side-delt': { id: 'side-delt', label: 'Side delts', group: 'Shoulders', target: [6, 14], size: 'medium' },
  'rear-delt': { id: 'rear-delt', label: 'Rear delts', group: 'Shoulders', target: [6, 12], size: 'small' },
  lats: { id: 'lats', label: 'Lats', group: 'Back', target: [8, 18], size: 'large' },
  traps: { id: 'traps', label: 'Traps', group: 'Back', target: [4, 12], size: 'medium' },
  rhomboids: { id: 'rhomboids', label: 'Mid back', group: 'Back', target: [4, 10], size: 'small' },
  'lower-back': { id: 'lower-back', label: 'Lower back', group: 'Back', target: [3, 8], size: 'small' },
  quads: { id: 'quads', label: 'Quads', group: 'Legs', target: [8, 18], size: 'large' },
  hams: { id: 'hams', label: 'Hamstrings', group: 'Legs', target: [6, 14], size: 'medium' },
  glutes: { id: 'glutes', label: 'Glutes', group: 'Legs', target: [6, 14], size: 'medium' },
  calves: { id: 'calves', label: 'Calves', group: 'Legs', target: [6, 12], size: 'small' },
  adductors: { id: 'adductors', label: 'Adductors', group: 'Legs', target: [3, 8], size: 'small' },
  biceps: { id: 'biceps', label: 'Biceps', group: 'Arms', target: [6, 14], size: 'medium' },
  triceps: { id: 'triceps', label: 'Triceps', group: 'Arms', target: [6, 14], size: 'medium' },
  forearms: { id: 'forearms', label: 'Forearms', group: 'Arms', target: [3, 8], size: 'small' },
  abs: { id: 'abs', label: 'Abs', group: 'Core', target: [4, 12], size: 'medium' },
  obliques: { id: 'obliques', label: 'Obliques', group: 'Core', target: [3, 8], size: 'small' },
};

export const REGION_ORDER: MuscleRegion[] = [
  'upper-chest', 'mid-chest', 'lower-chest',
  'lats', 'rhomboids', 'traps', 'lower-back',
  'front-delt', 'side-delt', 'rear-delt',
  'quads', 'hams', 'glutes', 'calves', 'adductors',
  'biceps', 'triceps', 'forearms',
  'abs', 'obliques',
];

interface RegionRule {
  test: RegExp;
  /** Disambiguates shared words — "press" means different things per group. */
  group?: MuscleGroup | MuscleGroup[];
  regions: RegionWeights;
}

/** Ordered most-specific → most-generic. First match wins. */
const RULES: RegionRule[] = [
  // --- shoulders ---
  { test: /lateral raise|side raise/, regions: { 'side-delt': 1, traps: 0.25 } },
  { test: /rear delt|reverse (fly|pec)|face pull/, regions: { 'rear-delt': 1, rhomboids: 0.5, traps: 0.5 } },
  { test: /front raise/, regions: { 'front-delt': 1 } },
  { test: /upright row/, regions: { 'side-delt': 1, traps: 0.5, biceps: 0.25 } },
  { test: /shrug/, regions: { traps: 1, forearms: 0.25 } },
  { test: /arnold|behind-the-neck|overhead press|military/, regions: { 'front-delt': 1, 'side-delt': 0.5, triceps: 0.5, 'upper-chest': 0.25 } },
  { test: /press/, group: 'Shoulders', regions: { 'front-delt': 1, 'side-delt': 0.5, triceps: 0.5 } },
  // --- chest ---
  { test: /incline/, group: 'Chest', regions: { 'upper-chest': 1, 'front-delt': 0.5, triceps: 0.5 } },
  { test: /decline/, group: 'Chest', regions: { 'lower-chest': 1, 'mid-chest': 0.5, triceps: 0.5 } },
  { test: /fly|crossover|pec deck/, regions: { 'mid-chest': 1, 'upper-chest': 0.5, 'front-delt': 0.25 } },
  { test: /pullover/, regions: { lats: 1, 'mid-chest': 0.5, triceps: 0.25 } },
  { test: /close-grip/, regions: { triceps: 1, 'mid-chest': 0.5, 'front-delt': 0.25 } },
  { test: /press|bench|push-?up/, group: 'Chest', regions: { 'mid-chest': 1, 'front-delt': 0.5, triceps: 0.5 } },
  // --- back ---
  { test: /pulldown|pull-?up|chin-?up/, regions: { lats: 1, biceps: 0.5, rhomboids: 0.5, forearms: 0.25 } },
  { test: /straight-arm/, regions: { lats: 1, triceps: 0.25 } },
  { test: /romanian|good morning|nordic|glute ham/, regions: { hams: 1, glutes: 0.5, 'lower-back': 0.5 } },
  { test: /deadlift|rack pull/, regions: { 'lower-back': 1, hams: 1, glutes: 0.5, traps: 0.5, lats: 0.5, forearms: 0.5 } },
  { test: /row/, group: ['Back', 'Chest'], regions: { lats: 1, rhomboids: 1, 'rear-delt': 0.5, biceps: 0.5, traps: 0.25 } },
  // --- legs ---
  { test: /calf/, regions: { calves: 1 } },
  { test: /leg curl|hamstring/, regions: { hams: 1 } },
  { test: /leg extension|sissy/, regions: { quads: 1 } },
  { test: /hip thrust|glute bridge|kickback|pull-through/, regions: { glutes: 1, hams: 0.5 } },
  { test: /abduction/, regions: { glutes: 1, adductors: 0.25 } },
  { test: /adduction/, regions: { adductors: 1 } },
  { test: /front squat|hack squat/, regions: { quads: 1, glutes: 0.5, abs: 0.25 } },
  { test: /sumo/, regions: { glutes: 1, adductors: 0.5, hams: 0.5, 'lower-back': 0.5, traps: 0.25 } },
  { test: /lunge|split squat|step-?up|pistol/, regions: { quads: 1, glutes: 1, hams: 0.5, adductors: 0.25 } },
  { test: /squat|leg press/, regions: { quads: 1, glutes: 0.5, hams: 0.25, 'lower-back': 0.25 } },
  // --- arms ---
  { test: /hammer|reverse curl/, regions: { biceps: 1, forearms: 1 } },
  { test: /wrist curl/, regions: { forearms: 1 } },
  { test: /curl/, regions: { biceps: 1, forearms: 0.25 } },
  { test: /pushdown|skull|triceps|kickback|dip/, regions: { triceps: 1, 'front-delt': 0.25 } },
  // --- core ---
  { test: /oblique|russian twist|side (plank|bend)|woodchop/, regions: { obliques: 1, abs: 0.5 } },
  { test: /back extension|hyperextension/, regions: { 'lower-back': 1, glutes: 0.5, hams: 0.5 } },
  { test: /farmer|carry/, regions: { forearms: 1, traps: 1, obliques: 0.5 } },
  { test: /plank|crunch|sit-?up|leg raise|knee raise|ab wheel|dead bug|hollow/, regions: { abs: 1, obliques: 0.5 } },
];

/** Only for the few the rules genuinely misread. Keyed by lowercased name. */
const OVERRIDES: Record<string, RegionWeights> = {
  dip: { 'lower-chest': 1, triceps: 1, 'front-delt': 0.5 },
  'chest dip': { 'lower-chest': 1, triceps: 0.5, 'front-delt': 0.5 },
  'triceps dip': { triceps: 1, 'front-delt': 0.25 },
  'landmine press': { 'front-delt': 1, 'upper-chest': 0.5, triceps: 0.5 },
  't-bar row': { lats: 1, rhomboids: 1, traps: 0.5, biceps: 0.5 },
  'ab wheel': { abs: 1, lats: 0.5, 'lower-back': 0.25 },
  'good morning': { hams: 1, 'lower-back': 1, glutes: 0.5 },
  'bulgarian split squat': { quads: 1, glutes: 1, hams: 0.5, adductors: 0.25 },
};

/** Regions a group spreads over when no rule matches — the honest fallback. */
const GROUP_FALLBACK: Record<MuscleGroup, MuscleRegion[]> = {
  Chest: ['mid-chest', 'upper-chest'],
  Back: ['lats', 'rhomboids'],
  Shoulders: ['front-delt', 'side-delt', 'rear-delt'],
  Legs: ['quads', 'hams', 'glutes'],
  Arms: ['biceps', 'triceps'],
  Core: ['abs', 'obliques'],
  Cardio: [],
};

export type ResolutionSource = 'override' | 'pattern' | 'group' | 'none';

export interface RegionResolution {
  regions: RegionWeights;
  via: ResolutionSource;
}

function matchesGroup(rule: RegionRule, group?: MuscleGroup): boolean {
  if (!rule.group) return true;
  if (!group) return false;
  return Array.isArray(rule.group) ? rule.group.includes(group) : rule.group === group;
}

export function resolveRegions(name: string, group?: MuscleGroup): RegionResolution {
  const lower = name.trim().toLowerCase();
  if (group === 'Cardio') return { regions: {}, via: 'none' };

  const override = OVERRIDES[lower];
  if (override) return { regions: override, via: 'override' };

  for (const rule of RULES) {
    if (rule.test.test(lower) && matchesGroup(rule, group)) {
      return { regions: rule.regions, via: 'pattern' };
    }
  }

  // Nothing matched: spread half-credit across the group's main regions rather
  // than inventing a primary we can't justify.
  if (group) {
    const fallback = GROUP_FALLBACK[group];
    if (fallback.length > 0) {
      return { regions: Object.fromEntries(fallback.map((r) => [r, 0.5])), via: 'group' };
    }
  }
  return { regions: {}, via: 'none' };
}

const cache = new Map<string, RegionWeights>();

/** Memoised resolver for the hot path (every set of every session). */
export function regionsFor(name: string, group?: MuscleGroup): RegionWeights {
  const key = `${name.toLowerCase()}|${group ?? ''}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { regions } = resolveRegions(name, group);
  cache.set(key, regions);
  return regions;
}

/** Movements whose PRIMARY target is this region — powers the "fix it" chips. */
export const FIX_EXERCISES: Record<MuscleRegion, string[]> = {
  'upper-chest': ['Incline Dumbbell Press', 'Incline Bench Press'],
  'mid-chest': ['Bench Press', 'Cable Crossover'],
  'lower-chest': ['Decline Bench Press', 'Dip'],
  'front-delt': ['Overhead Press', 'Front Raise'],
  'side-delt': ['Lateral Raise', 'Cable Lateral Raise'],
  'rear-delt': ['Rear Delt Fly', 'Face Pull'],
  lats: ['Pull-Up', 'Lat Pulldown'],
  traps: ['Shrug', 'Upright Row'],
  rhomboids: ['Chest-Supported Row', 'Seated Cable Row'],
  'lower-back': ['Back Extension', 'Romanian Deadlift'],
  quads: ['Squat', 'Leg Extension'],
  hams: ['Romanian Deadlift', 'Leg Curl'],
  glutes: ['Hip Thrust', 'Bulgarian Split Squat'],
  calves: ['Standing Calf Raise', 'Seated Calf Raise'],
  adductors: ['Sumo Deadlift', 'Bulgarian Split Squat'],
  biceps: ['Barbell Curl', 'Hammer Curl'],
  triceps: ['Triceps Pushdown', 'Overhead Triceps Extension'],
  forearms: ['Wrist Curl', 'Farmer Carry'],
  abs: ['Hanging Leg Raise', 'Cable Crunch'],
  obliques: ['Russian Twist', 'Plank'],
};
