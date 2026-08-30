import type { MuscleGroup } from './exercises';

/**
 * Which movements load which joints hardest.
 *
 * This is training-load guidance, not medical advice, and every string here has
 * to survive that distinction: describe the mechanics of the movement, never the
 * person's condition. "Loads the shoulder overhead, at end range" is a fact
 * about a press. "Bad for your shoulder" is a diagnosis we are in no position
 * to make.
 *
 * Resolution copies src/data/muscleMap.ts — ordered pattern rules, first match
 * wins, with a small override table. A lookup keyed on exercise name would be
 * dead the first time someone adds a custom movement, which is exactly the
 * population this feature exists for.
 */

export type InjuryArea =
  | 'shoulder'
  | 'lower-back'
  | 'knee'
  | 'elbow'
  | 'wrist'
  | 'hip'
  | 'neck';

export interface InjuryDef {
  id: InjuryArea;
  label: string;
  /** Shown under the chip so the list explains itself. */
  hint: string;
}

export const INJURY_AREAS: InjuryDef[] = [
  { id: 'shoulder', label: 'Shoulder', hint: 'Overhead pressing, deep chest stretch' },
  { id: 'lower-back', label: 'Lower back', hint: 'Hinging and loaded spinal work' },
  { id: 'knee', label: 'Knee', hint: 'Deep squatting, open-chain extension' },
  { id: 'elbow', label: 'Elbow', hint: 'Stretched-position triceps and curls' },
  { id: 'wrist', label: 'Wrist', hint: 'Front rack, pressing, gripping' },
  { id: 'hip', label: 'Hip', hint: 'Deep flexion and hinging' },
  { id: 'neck', label: 'Neck', hint: 'Shrugging and heavy carries' },
];

/** 0 negligible · 1 moderate · 2 high. Fractions are fine and used. */
export type StrainScores = Partial<Record<InjuryArea, number>>;

export interface StrainRule {
  test: RegExp;
  group?: MuscleGroup | MuscleGroup[];
  scores: StrainScores;
  /** One clause, lowercase, no full stop. Rendered after the exercise name. */
  reason: string;
}

/** Ordered most-specific to most-generic. First match wins. */
export const STRAIN_RULES: StrainRule[] = [
  // --- shoulder ---
  { test: /behind-the-neck|upright row/, scores: { shoulder: 2, neck: 0.5 }, reason: 'forces internal rotation under load' },
  { test: /arnold|overhead press|military|landmine press/, scores: { shoulder: 1.5, 'lower-back': 0.5, elbow: 0.5 }, reason: 'loads the shoulder overhead, at end range' },
  { test: /machine shoulder press|seated dumbbell press/, scores: { shoulder: 1, elbow: 0.5 }, reason: 'overhead, but supported' },
  { test: /dip/, scores: { shoulder: 1.5, elbow: 1 }, reason: 'deep stretch at the bottom' },
  { test: /straight-arm/, scores: { shoulder: 0.75 }, reason: 'long lever overhead' },
  { test: /lateral raise|front raise/, scores: { shoulder: 1 }, reason: 'long lever at the top' },
  { test: /face pull|rear delt|reverse (fly|pec)/, scores: { shoulder: 0.25 }, reason: 'short range, light load' },
  { test: /shrug|farmer|carry/, scores: { neck: 1, wrist: 0.5, 'lower-back': 0.25 }, reason: 'loads the traps and grip under a static hold' },
  // --- chest / pressing ---
  { test: /incline|decline|floor press/, group: 'Chest', scores: { shoulder: 0.75, wrist: 0.5, elbow: 0.25 }, reason: 'pressing through a fixed bar path' },
  { test: /pec deck|chest fly|crossover/, scores: { shoulder: 1.25 }, reason: 'stretches the shoulder at the bottom' },
  { test: /push-?up/, scores: { wrist: 1, shoulder: 0.5 }, reason: 'loads an extended wrist' },
  { test: /close-grip/, scores: { elbow: 1, wrist: 0.75 }, reason: 'narrow grip stacks the elbow and wrist' },
  { test: /bench|press/, group: 'Chest', scores: { shoulder: 1, wrist: 0.5 }, reason: 'pressing through a fixed bar path' },
  // --- back / hinge ---
  { test: /good morning|nordic/, scores: { 'lower-back': 2, hip: 1, knee: 0.5 }, reason: 'long lever on the spine' },
  { test: /deadlift|rack pull|pendlay|bent-over|barbell row|t-bar row|meadows/, scores: { 'lower-back': 2, hip: 1, wrist: 0.25 }, reason: 'loads the spine under a hinge' },
  { test: /romanian/, scores: { 'lower-back': 1.25, hip: 1 }, reason: 'hinges under load, knees fixed' },
  { test: /back extension|hyperextension/, scores: { 'lower-back': 1.5 }, reason: 'spinal extension against resistance' },
  { test: /chest-supported|seated cable row|machine row/, scores: { 'lower-back': 0.25 }, reason: 'rowing with the torso supported' },
  { test: /pulldown|pull-?up|chin-?up/, scores: { shoulder: 0.5, elbow: 0.5 }, reason: 'hangs from an overhead grip' },
];

// --- legs ---
STRAIN_RULES.push(
  { test: /leg extension|sissy/, scores: { knee: 1.5 }, reason: 'open-chain load across the knee' },
  { test: /hack squat|front squat|zercher/, scores: { knee: 1.5, wrist: 0.75, 'lower-back': 0.75, hip: 0.75 }, reason: 'deep knee flexion, upright torso' },
  { test: /pistol|bulgarian|split squat|lunge|step-?up/, scores: { knee: 1.5, hip: 0.75 }, reason: 'loads one knee at a time through depth' },
  { test: /leg press/, scores: { knee: 1, hip: 0.75, 'lower-back': 0.5 }, reason: 'deep knee and hip flexion, back supported' },
  { test: /squat/, scores: { knee: 1.5, 'lower-back': 1, hip: 1 }, reason: 'loads the knee and spine through depth' },
  { test: /leg curl|hamstring/, scores: { knee: 0.5 }, reason: 'flexes the knee against resistance' },
  { test: /hip thrust|glute bridge|pull-through|kickback/, scores: { hip: 0.5, 'lower-back': 0.5, knee: 0.25 }, reason: 'hip extension with the spine braced' },
  { test: /abduction|adduction/, scores: { hip: 0.75 }, reason: 'loads the hip through its outer range' },
  { test: /calf/, scores: {}, reason: '' },
  // --- arms ---
  { test: /skull|overhead triceps|jm press/, scores: { elbow: 1.5, shoulder: 0.5 }, reason: 'stretched-position elbow load' },
  { test: /wrist curl|reverse curl/, scores: { wrist: 1.5, elbow: 0.5 }, reason: 'loads the wrist directly' },
  { test: /hammer|preacher|spider|concentration/, scores: { elbow: 0.75 }, reason: 'elbow flexion under a fixed angle' },
  { test: /pushdown/, scores: { elbow: 0.5 }, reason: 'elbow extension, short lever' },
  { test: /curl/, scores: { elbow: 0.75, wrist: 0.5 }, reason: 'elbow flexion under load' },
  // --- core ---
  { test: /russian twist|woodchop|oblique/, scores: { 'lower-back': 1 }, reason: 'loaded rotation through the spine' },
  { test: /ab wheel|hanging leg raise|hanging knee raise/, scores: { 'lower-back': 0.75, shoulder: 0.5 }, reason: 'resists spinal extension from a hang' },
  { test: /sit-?up|crunch/, scores: { 'lower-back': 0.5, neck: 0.5 }, reason: 'repeated spinal flexion' },
);

/** Only for the handful the patterns genuinely misread. Keyed lowercased. */
export const STRAIN_OVERRIDES: Record<string, { scores: StrainScores; reason: string }> = {
  'face pull': { scores: { shoulder: 0.2 }, reason: 'short range, light load' },
  plank: { scores: { shoulder: 0.5 }, reason: 'static hold through the shoulder' },
  'dead bug': { scores: {}, reason: '' },
  'glute ham raise': { scores: { knee: 1, 'lower-back': 0.75 }, reason: 'knee flexion under bodyweight' },
  'sumo deadlift': { scores: { 'lower-back': 1.5, hip: 1.25 }, reason: 'hinges from a wide, deep hip position' },
};
