// Pure data-model definitions: defaults, seed content, small helpers.
// No DOM, no IndexedDB — safe to unit test.

export const EQUIPMENT = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'];

export const DEFAULT_INCREMENTS = {
  barbell: 2.5,
  dumbbell: 2,
  machine: 5,
  cable: 2.5,
  bodyweight: 2.5,   // step used only when adding load to a bodyweight move (base load = 0 kg)
};

export const HABITS = ['yogaAM', 'meditationAM', 'yogaPM', 'meditationPM', 'creatine', 'dogWalk'];

export const DEFAULT_SETTINGS = {
  stepTarget: 8000,
  weeklyTargets: {
    gym: 4,               // gym sessions with 1 climbing session…
    gymWithTwoClimbs: 3,  // …drops to 3 once 2 climbing sessions are logged
    climbing: 1,
    swim: 1,
  },
  restTimerSec: 90,
  increments: { ...DEFAULT_INCREMENTS },
  theme: 'system',        // 'system' | 'light' | 'dark'
  lastBackupAt: null,     // epoch ms
};

/** Merge stored settings over defaults (forward-compatible when new keys appear). */
export function withDefaults(stored) {
  const s = stored || {};
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    weeklyTargets: { ...DEFAULT_SETTINGS.weeklyTargets, ...(s.weeklyTargets || {}) },
    increments: { ...DEFAULT_SETTINGS.increments, ...(s.increments || {}) },
  };
}

/** Increment for an exercise: its own override, else the equipment default. */
export function incrementFor(exercise, settings) {
  if (exercise?.increment > 0) return exercise.increment;
  return withDefaults(settings).increments[exercise?.equipment] ?? 2.5;
}

// ---- Seed: exercises + "Upper" template ------------------------------------

export const SEED_EXERCISES = [
  { id: 'pull-ups', name: 'Pull-ups', equipment: 'bodyweight', increment: null },
  { id: 'semi-incline-db-press', name: 'Semi-incline dumbbell press', equipment: 'dumbbell', increment: null },
  { id: 'one-arm-db-row', name: 'One-arm dumbbell row', equipment: 'dumbbell', increment: null },
  { id: 'machine-fly', name: 'Machine fly', equipment: 'machine', increment: null },
  { id: 'db-curl', name: 'Dumbbell curl', equipment: 'dumbbell', increment: null },
  { id: 'parallel-bar-dips', name: 'Parallel-bar dips', equipment: 'bodyweight', increment: null },
];

export const SEED_TEMPLATES = [
  {
    id: 'upper',
    name: 'Upper',
    exercises: [
      { exerciseId: 'pull-ups', sets: 3, reps: 5, load: 0 },
      { exerciseId: 'semi-incline-db-press', sets: 3, reps: 12, load: 17.5 },
      { exerciseId: 'one-arm-db-row', sets: 3, reps: 12, load: 22 },
      { exerciseId: 'machine-fly', sets: 3, reps: 15, load: 48 },
      { exerciseId: 'db-curl', sets: 3, reps: 12, load: 10 },
      { exerciseId: 'parallel-bar-dips', sets: 3, reps: 5, load: 0 },
    ],
  },
];
