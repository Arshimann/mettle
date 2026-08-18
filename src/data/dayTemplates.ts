import type { SplitExercise } from '../types';

/**
 * Single-day presets. Unlike the whole-split templates in `templates.ts`,
 * these drop ONE day into a split you're already building — the common case
 * when you like your program but want a ready-made leg day.
 */
export interface DayTemplate {
  id: string;
  name: string;
  focus: string;
  exercises: SplitExercise[];
}

const e = (name: string, targetSets: number, targetReps: string): SplitExercise => ({
  name,
  targetSets,
  targetReps,
});

export const DAY_TEMPLATES: DayTemplate[] = [
  {
    id: 'push',
    name: 'Push',
    focus: 'Chest, shoulders, triceps',
    exercises: [
      e('Bench Press', 4, '6–10'),
      e('Overhead Press', 3, '8–12'),
      e('Incline Dumbbell Press', 3, '8–12'),
      e('Lateral Raise', 3, '12–20'),
      e('Triceps Pushdown', 3, '10–15'),
    ],
  },
  {
    id: 'pull',
    name: 'Pull',
    focus: 'Back, rear delts, biceps',
    exercises: [
      e('Pull-Up', 4, '6–12'),
      e('Barbell Row', 3, '8–12'),
      e('Lat Pulldown', 3, '10–14'),
      e('Face Pull', 3, '15–20'),
      e('Barbell Curl', 3, '8–12'),
    ],
  },
  {
    id: 'legs',
    name: 'Legs',
    focus: 'Quads, hamstrings, glutes, calves',
    exercises: [
      e('Squat', 4, '6–10'),
      e('Romanian Deadlift', 3, '8–12'),
      e('Leg Press', 3, '10–15'),
      e('Leg Curl', 3, '10–15'),
      e('Standing Calf Raise', 4, '10–15'),
    ],
  },
  {
    id: 'upper',
    name: 'Upper',
    focus: 'Everything above the waist',
    exercises: [
      e('Bench Press', 4, '6–10'),
      e('Barbell Row', 4, '8–12'),
      e('Overhead Press', 3, '8–12'),
      e('Lat Pulldown', 3, '10–14'),
      e('Lateral Raise', 3, '12–20'),
      e('Barbell Curl', 3, '10–14'),
    ],
  },
  {
    id: 'lower',
    name: 'Lower',
    focus: 'Legs and posterior chain',
    exercises: [
      e('Squat', 4, '6–10'),
      e('Romanian Deadlift', 3, '8–12'),
      e('Bulgarian Split Squat', 3, '10–12'),
      e('Leg Extension', 3, '12–15'),
      e('Seated Calf Raise', 4, '12–15'),
    ],
  },
  {
    id: 'full-body',
    name: 'Full body',
    focus: 'One session, everything covered',
    exercises: [
      e('Squat', 3, '6–10'),
      e('Bench Press', 3, '6–10'),
      e('Barbell Row', 3, '8–12'),
      e('Overhead Press', 2, '8–12'),
      e('Plank', 2, '45s'),
    ],
  },
  {
    id: 'arms',
    name: 'Arms',
    focus: 'Biceps, triceps, forearms',
    exercises: [
      e('Barbell Curl', 4, '8–12'),
      e('Close-Grip Bench Press', 3, '8–12'),
      e('Hammer Curl', 3, '10–14'),
      e('Overhead Triceps Extension', 3, '10–14'),
      e('Preacher Curl', 3, '10–14'),
      e('Triceps Pushdown', 3, '12–15'),
    ],
  },
  {
    id: 'chest-back',
    name: 'Chest & Back',
    focus: 'Classic push–pull pairing',
    exercises: [
      e('Bench Press', 4, '6–10'),
      e('Barbell Row', 4, '8–12'),
      e('Incline Dumbbell Press', 3, '8–12'),
      e('Lat Pulldown', 3, '10–14'),
      e('Cable Crossover', 3, '12–15'),
    ],
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    focus: 'All three delt heads',
    exercises: [
      e('Overhead Press', 4, '6–10'),
      e('Lateral Raise', 4, '12–20'),
      e('Rear Delt Fly', 4, '12–20'),
      e('Arnold Press', 3, '8–12'),
      e('Shrug', 3, '10–15'),
    ],
  },
  {
    id: 'core',
    name: 'Core',
    focus: 'Abs, obliques, lower back',
    exercises: [
      e('Hanging Leg Raise', 3, '10–15'),
      e('Cable Crunch', 3, '12–15'),
      e('Russian Twist', 3, '20–30'),
      e('Plank', 3, '45s'),
      e('Back Extension', 3, '12–15'),
    ],
  },
  {
    id: 'conditioning',
    name: 'Conditioning',
    focus: 'Cardio and engine work',
    exercises: [
      e('Rowing Machine', 1, '15 min'),
      e('Stationary Bike', 1, '20 min'),
      e('Jump Rope', 3, '3 min'),
    ],
  },
];
