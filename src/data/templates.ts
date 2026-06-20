import type { SplitExercise } from '../types';

export interface Template {
  id: string;
  name: string;
  desc: string;
  cadence: string;
  days: { name: string; exercises: SplitExercise[] }[];
}

const e = (name: string, targetSets: number, targetReps: string): SplitExercise => ({
  name,
  targetSets,
  targetReps,
});

export const TEMPLATES: Template[] = [
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    desc: 'The classic hypertrophy split. Run it 3 or 6 days a week.',
    cadence: '3–6 days',
    days: [
      {
        name: 'Push',
        exercises: [
          e('Bench Press', 4, '6–10'),
          e('Overhead Press', 3, '8–12'),
          e('Incline Dumbbell Press', 3, '8–12'),
          e('Lateral Raise', 3, '12–20'),
          e('Triceps Pushdown', 3, '10–15'),
        ],
      },
      {
        name: 'Pull',
        exercises: [
          e('Deadlift', 3, '4–6'),
          e('Pull-Up', 4, '6–12'),
          e('Barbell Row', 3, '8–12'),
          e('Face Pull', 3, '15–20'),
          e('Barbell Curl', 3, '10–15'),
        ],
      },
      {
        name: 'Legs',
        exercises: [
          e('Squat', 4, '5–8'),
          e('Romanian Deadlift', 3, '8–12'),
          e('Leg Press', 3, '10–15'),
          e('Leg Curl', 3, '10–15'),
          e('Standing Calf Raise', 4, '12–20'),
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    desc: 'Balanced four-day split. Great for strength and size.',
    cadence: '4 days',
    days: [
      {
        name: 'Upper',
        exercises: [
          e('Bench Press', 4, '6–10'),
          e('Barbell Row', 4, '6–10'),
          e('Overhead Press', 3, '8–12'),
          e('Lat Pulldown', 3, '10–12'),
          e('Dumbbell Curl', 3, '10–15'),
        ],
      },
      {
        name: 'Lower',
        exercises: [
          e('Squat', 4, '5–8'),
          e('Romanian Deadlift', 3, '8–12'),
          e('Leg Press', 3, '10–15'),
          e('Leg Curl', 3, '10–15'),
          e('Calf Raise', 4, '12–20'),
        ],
      },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body',
    desc: 'Hit everything each session. Perfect for 3 days a week.',
    cadence: '3 days',
    days: [
      {
        name: 'Full Body A',
        exercises: [
          e('Squat', 4, '5–8'),
          e('Bench Press', 4, '6–10'),
          e('Barbell Row', 3, '8–12'),
          e('Overhead Press', 3, '8–12'),
          e('Plank', 3, '45s'),
        ],
      },
      {
        name: 'Full Body B',
        exercises: [
          e('Deadlift', 3, '4–6'),
          e('Incline Dumbbell Press', 4, '8–12'),
          e('Pull-Up', 4, '6–12'),
          e('Leg Press', 3, '10–15'),
          e('Lateral Raise', 3, '12–20'),
        ],
      },
    ],
  },
  {
    id: 'arnold',
    name: 'Arnold Split',
    desc: 'Old-school volume: chest+back, shoulders+arms, legs.',
    cadence: '6 days',
    days: [
      {
        name: 'Chest & Back',
        exercises: [
          e('Bench Press', 4, '8–12'),
          e('Incline Dumbbell Press', 3, '8–12'),
          e('Barbell Row', 4, '8–12'),
          e('Pull-Up', 3, '8–12'),
          e('Dumbbell Pullover', 3, '10–15'),
        ],
      },
      {
        name: 'Shoulders & Arms',
        exercises: [
          e('Overhead Press', 4, '8–12'),
          e('Lateral Raise', 4, '12–20'),
          e('Barbell Curl', 3, '10–12'),
          e('Skull Crusher', 3, '10–12'),
          e('Hammer Curl', 3, '10–15'),
        ],
      },
      {
        name: 'Legs',
        exercises: [
          e('Squat', 5, '8–12'),
          e('Romanian Deadlift', 4, '8–12'),
          e('Leg Extension', 3, '12–15'),
          e('Leg Curl', 3, '12–15'),
          e('Standing Calf Raise', 4, '15–20'),
        ],
      },
    ],
  },
];
