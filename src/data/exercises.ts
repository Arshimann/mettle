export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Legs'
  | 'Arms'
  | 'Core'
  | 'Cardio';

export interface LibraryExercise {
  name: string;
  group: MuscleGroup;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Legs',
  'Arms',
  'Core',
  'Cardio',
];

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Chest
  { name: 'Bench Press', group: 'Chest' },
  { name: 'Incline Bench Press', group: 'Chest' },
  { name: 'Incline Dumbbell Press', group: 'Chest' },
  { name: 'Dumbbell Bench Press', group: 'Chest' },
  { name: 'Chest Fly', group: 'Chest' },
  { name: 'Cable Crossover', group: 'Chest' },
  { name: 'Dip', group: 'Chest' },
  { name: 'Push-Up', group: 'Chest' },
  { name: 'Dumbbell Pullover', group: 'Chest' },
  // Back
  { name: 'Deadlift', group: 'Back' },
  { name: 'Pull-Up', group: 'Back' },
  { name: 'Chin-Up', group: 'Back' },
  { name: 'Lat Pulldown', group: 'Back' },
  { name: 'Barbell Row', group: 'Back' },
  { name: 'Dumbbell Row', group: 'Back' },
  { name: 'Seated Cable Row', group: 'Back' },
  { name: 'T-Bar Row', group: 'Back' },
  { name: 'Face Pull', group: 'Back' },
  { name: 'Rack Pull', group: 'Back' },
  // Shoulders
  { name: 'Overhead Press', group: 'Shoulders' },
  { name: 'Seated Dumbbell Press', group: 'Shoulders' },
  { name: 'Arnold Press', group: 'Shoulders' },
  { name: 'Lateral Raise', group: 'Shoulders' },
  { name: 'Front Raise', group: 'Shoulders' },
  { name: 'Rear Delt Fly', group: 'Shoulders' },
  { name: 'Upright Row', group: 'Shoulders' },
  { name: 'Shrug', group: 'Shoulders' },
  // Legs
  { name: 'Squat', group: 'Legs' },
  { name: 'Front Squat', group: 'Legs' },
  { name: 'Romanian Deadlift', group: 'Legs' },
  { name: 'Leg Press', group: 'Legs' },
  { name: 'Bulgarian Split Squat', group: 'Legs' },
  { name: 'Lunge', group: 'Legs' },
  { name: 'Leg Extension', group: 'Legs' },
  { name: 'Leg Curl', group: 'Legs' },
  { name: 'Hip Thrust', group: 'Legs' },
  { name: 'Standing Calf Raise', group: 'Legs' },
  { name: 'Seated Calf Raise', group: 'Legs' },
  { name: 'Calf Raise', group: 'Legs' },
  // Arms
  { name: 'Barbell Curl', group: 'Arms' },
  { name: 'Dumbbell Curl', group: 'Arms' },
  { name: 'Hammer Curl', group: 'Arms' },
  { name: 'Preacher Curl', group: 'Arms' },
  { name: 'Cable Curl', group: 'Arms' },
  { name: 'Triceps Pushdown', group: 'Arms' },
  { name: 'Skull Crusher', group: 'Arms' },
  { name: 'Overhead Triceps Extension', group: 'Arms' },
  { name: 'Close-Grip Bench Press', group: 'Arms' },
  { name: 'Dips (Triceps)', group: 'Arms' },
  // Core
  { name: 'Plank', group: 'Core' },
  { name: 'Hanging Leg Raise', group: 'Core' },
  { name: 'Cable Crunch', group: 'Core' },
  { name: 'Ab Wheel', group: 'Core' },
  { name: 'Russian Twist', group: 'Core' },
  { name: 'Sit-Up', group: 'Core' },
  // Cardio
  { name: 'Treadmill', group: 'Cardio' },
  { name: 'Stationary Bike', group: 'Cardio' },
  { name: 'Rowing Machine', group: 'Cardio' },
  { name: 'Stair Climber', group: 'Cardio' },
  { name: 'Elliptical', group: 'Cardio' },
  { name: 'Jump Rope', group: 'Cardio' },
];
