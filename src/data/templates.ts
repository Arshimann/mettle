import type { SplitExercise } from '../types';

export type TemplateCategory = 'Popular' | 'Strength' | 'Physique' | 'Niche';

export interface Template {
  id: string;
  name: string;
  desc: string;
  cadence: string;
  category: TemplateCategory;
  days: { name: string; exercises: SplitExercise[] }[];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = ['Popular', 'Strength', 'Physique', 'Niche'];

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
    category: 'Popular',
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
    category: 'Popular',
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
    category: 'Popular',
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
    id: 'push-pull',
    name: 'Push / Pull',
    desc: 'Two-way split with legs folded in. Simple, flexible, four days.',
    cadence: '4 days',
    category: 'Popular',
    days: [
      {
        name: 'Push',
        exercises: [
          e('Squat', 4, '5–8'),
          e('Bench Press', 4, '6–10'),
          e('Overhead Press', 3, '8–12'),
          e('Leg Extension', 3, '12–15'),
          e('Triceps Pushdown', 3, '10–15'),
        ],
      },
      {
        name: 'Pull',
        exercises: [
          e('Deadlift', 3, '4–6'),
          e('Pull-Up', 4, '6–12'),
          e('Seated Cable Row', 3, '8–12'),
          e('Leg Curl', 3, '10–15'),
          e('Barbell Curl', 3, '10–15'),
        ],
      },
    ],
  },
  {
    id: 'phul',
    name: 'PHUL',
    desc: 'Power Hypertrophy Upper Lower — heavy days plus volume days.',
    cadence: '4 days',
    category: 'Strength',
    days: [
      {
        name: 'Upper Power',
        exercises: [
          e('Bench Press', 4, '3–5'),
          e('Barbell Row', 4, '3–5'),
          e('Overhead Press', 3, '5–8'),
          e('Weighted Pull-Up', 3, '5–8'),
        ],
      },
      {
        name: 'Lower Power',
        exercises: [
          e('Squat', 4, '3–5'),
          e('Deadlift', 3, '3–5'),
          e('Leg Press', 3, '8–10'),
          e('Standing Calf Raise', 4, '8–10'),
        ],
      },
      {
        name: 'Upper Hypertrophy',
        exercises: [
          e('Incline Dumbbell Press', 4, '8–12'),
          e('Seated Cable Row', 4, '8–12'),
          e('Lateral Raise', 3, '12–20'),
          e('Dumbbell Curl', 3, '10–15'),
          e('Skull Crusher', 3, '10–15'),
        ],
      },
      {
        name: 'Lower Hypertrophy',
        exercises: [
          e('Front Squat', 4, '8–12'),
          e('Romanian Deadlift', 3, '8–12'),
          e('Leg Extension', 3, '12–15'),
          e('Leg Curl', 3, '12–15'),
          e('Seated Calf Raise', 4, '12–20'),
        ],
      },
    ],
  },
  {
    id: 'big-three',
    name: 'Big 3 Focus',
    desc: 'Squat, bench, and deadlift each get their own heavy day.',
    cadence: '3 days',
    category: 'Strength',
    days: [
      {
        name: 'Squat Day',
        exercises: [
          e('Squat', 5, '3–5'),
          e('Leg Press', 3, '8–10'),
          e('Leg Curl', 3, '10–12'),
          e('Plank', 3, '45s'),
        ],
      },
      {
        name: 'Bench Day',
        exercises: [
          e('Bench Press', 5, '3–5'),
          e('Close-Grip Bench Press', 3, '6–8'),
          e('Overhead Press', 3, '6–8'),
          e('Face Pull', 3, '15–20'),
        ],
      },
      {
        name: 'Deadlift Day',
        exercises: [
          e('Deadlift', 5, '2–4'),
          e('Barbell Row', 3, '6–8'),
          e('Lat Pulldown', 3, '8–12'),
          e('Back Extension', 3, '10–15'),
        ],
      },
    ],
  },
  {
    id: 'arnold',
    name: 'Arnold Split',
    desc: 'Old-school volume: chest+back, shoulders+arms, legs.',
    cadence: '6 days',
    category: 'Physique',
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
  {
    id: 'bro-split',
    name: 'Bro Split',
    desc: 'One muscle a day, five days. The gym-culture classic.',
    cadence: '5 days',
    category: 'Physique',
    days: [
      {
        name: 'Chest',
        exercises: [
          e('Bench Press', 4, '6–10'),
          e('Incline Dumbbell Press', 3, '8–12'),
          e('Cable Crossover', 3, '12–15'),
          e('Dip', 3, '8–12'),
        ],
      },
      {
        name: 'Back',
        exercises: [
          e('Deadlift', 3, '4–6'),
          e('Pull-Up', 4, '6–12'),
          e('Seated Cable Row', 3, '8–12'),
          e('Lat Pulldown', 3, '10–12'),
        ],
      },
      {
        name: 'Shoulders',
        exercises: [
          e('Overhead Press', 4, '6–10'),
          e('Lateral Raise', 4, '12–20'),
          e('Rear Delt Fly', 3, '12–15'),
          e('Shrug', 3, '10–15'),
        ],
      },
      {
        name: 'Arms',
        exercises: [
          e('Barbell Curl', 4, '8–12'),
          e('Skull Crusher', 4, '8–12'),
          e('Hammer Curl', 3, '10–15'),
          e('Triceps Pushdown', 3, '10–15'),
        ],
      },
      {
        name: 'Legs',
        exercises: [
          e('Squat', 4, '6–10'),
          e('Leg Press', 3, '10–15'),
          e('Romanian Deadlift', 3, '8–12'),
          e('Leg Curl', 3, '10–15'),
          e('Standing Calf Raise', 4, '12–20'),
        ],
      },
    ],
  },
  {
    id: 'phat',
    name: 'PHAT',
    desc: 'Power days up front, hypertrophy volume the rest of the week.',
    cadence: '5 days',
    category: 'Physique',
    days: [
      {
        name: 'Upper Power',
        exercises: [
          e('Bench Press', 3, '3–5'),
          e('Barbell Row', 3, '3–5'),
          e('Overhead Press', 3, '5–8'),
          e('Weighted Pull-Up', 3, '5–8'),
        ],
      },
      {
        name: 'Lower Power',
        exercises: [
          e('Squat', 3, '3–5'),
          e('Deadlift', 3, '3–5'),
          e('Leg Press', 3, '8–10'),
          e('Standing Calf Raise', 3, '8–10'),
        ],
      },
      {
        name: 'Back & Shoulders',
        exercises: [
          e('Pull-Up', 4, '8–12'),
          e('Seated Cable Row', 3, '10–12'),
          e('Lateral Raise', 4, '12–20'),
          e('Face Pull', 3, '15–20'),
          e('Shrug', 3, '10–15'),
        ],
      },
      {
        name: 'Legs',
        exercises: [
          e('Front Squat', 4, '8–12'),
          e('Romanian Deadlift', 3, '8–12'),
          e('Leg Extension', 3, '12–15'),
          e('Leg Curl', 3, '12–15'),
          e('Seated Calf Raise', 4, '12–20'),
        ],
      },
      {
        name: 'Chest & Arms',
        exercises: [
          e('Incline Dumbbell Press', 4, '8–12'),
          e('Cable Crossover', 3, '12–15'),
          e('Barbell Curl', 3, '10–12'),
          e('Skull Crusher', 3, '10–12'),
          e('Hammer Curl', 3, '10–15'),
        ],
      },
    ],
  },
  {
    id: 'bitchsplit',
    name: 'Bitchsplit',
    desc: 'Glutes first, always. The lower-body-forward split half the gym actually runs.',
    cadence: '3–4 days',
    category: 'Niche',
    days: [
      {
        name: 'Glutes & Hamstrings',
        exercises: [
          e('Hip Thrust', 4, '8–12'),
          e('Romanian Deadlift', 3, '8–12'),
          e('Cable Kickback', 3, '12–15'),
          e('Leg Curl', 3, '10–15'),
          e('Hip Abduction', 3, '15–20'),
        ],
      },
      {
        name: 'Upper & Core',
        exercises: [
          e('Lat Pulldown', 3, '10–12'),
          e('Seated Cable Row', 3, '10–12'),
          e('Seated Dumbbell Press', 3, '10–12'),
          e('Lateral Raise', 3, '12–20'),
          e('Plank', 3, '45s'),
        ],
      },
      {
        name: 'Glutes & Quads',
        exercises: [
          e('Squat', 4, '6–10'),
          e('Bulgarian Split Squat', 3, '8–12'),
          e('Walking Lunge', 3, '10–12'),
          e('Glute Bridge', 3, '12–15'),
          e('Hip Abduction', 3, '15–20'),
        ],
      },
    ],
  },
  {
    id: 'minimalist',
    name: 'Minimalist 2-Day',
    desc: 'Busy week? Two focused sessions that keep everything moving.',
    cadence: '2 days',
    category: 'Niche',
    days: [
      {
        name: 'Day A',
        exercises: [
          e('Squat', 3, '5–8'),
          e('Bench Press', 3, '6–10'),
          e('Barbell Row', 3, '8–12'),
          e('Plank', 2, '45s'),
        ],
      },
      {
        name: 'Day B',
        exercises: [
          e('Deadlift', 3, '4–6'),
          e('Overhead Press', 3, '6–10'),
          e('Pull-Up', 3, '6–12'),
          e('Walking Lunge', 2, '10–12'),
        ],
      },
    ],
  },
  {
    id: 'aesthetics',
    name: 'Aesthetics',
    desc: 'Built for the look: wide delts, upper chest, back width, and arms. Volume goes where the eye goes.',
    cadence: '4–5 days',
    category: 'Physique',
    days: [
      {
        name: 'Delts & Arms',
        exercises: [
          e('Overhead Press', 4, '6–10'),
          e('Lateral Raise', 5, '12–20'),
          e('Rear Delt Fly', 4, '12–20'),
          e('Preacher Curl', 3, '10–14'),
          e('Overhead Triceps Extension', 3, '10–14'),
          e('Hammer Curl', 3, '10–14'),
        ],
      },
      {
        name: 'Back width',
        exercises: [
          e('Pull-Up', 4, '6–12'),
          e('Lat Pulldown', 3, '10–14'),
          e('Chest-Supported Row', 3, '10–14'),
          e('Straight-Arm Pulldown', 3, '12–15'),
          e('Face Pull', 4, '15–20'),
        ],
      },
      {
        name: 'Upper chest',
        exercises: [
          e('Incline Bench Press', 4, '6–10'),
          e('Incline Dumbbell Press', 3, '8–12'),
          e('Cable Crossover', 3, '12–15'),
          e('Lateral Raise', 3, '12–20'),
          e('Triceps Pushdown', 3, '10–15'),
        ],
      },
      {
        name: 'Legs (lean)',
        exercises: [
          e('Squat', 4, '6–10'),
          e('Romanian Deadlift', 3, '8–12'),
          e('Leg Extension', 3, '12–15'),
          e('Standing Calf Raise', 4, '10–15'),
          e('Hanging Leg Raise', 3, '10–15'),
        ],
      },
      {
        name: 'Shoulders & abs',
        exercises: [
          e('Arnold Press', 4, '8–12'),
          e('Cable Lateral Raise', 4, '12–20'),
          e('Upright Row', 3, '10–14'),
          e('Cable Crunch', 3, '12–15'),
          e('Russian Twist', 3, '20–30'),
        ],
      },
    ],
  },
];
