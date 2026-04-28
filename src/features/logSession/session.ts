import type { ExerciseSession, PostSessionDebrief, PreSessionCheckIn, Session } from '../../db/models';
import { validateWorkoutSet } from '../../utils/validation';
import { normalizeExerciseName } from '../../utils/normalization';

export interface DerivedReadiness {
  sleep: number;
  energy: number;
  soreness: number;
}

export function deriveReadinessScores(checkIn: PreSessionCheckIn): DerivedReadiness {
  const sleepMap: Record<PreSessionCheckIn['recovery'], number> = {
    poor: 5.5,
    okay: 7.5,
    good: 9,
  };
  const energyMap: Record<PreSessionCheckIn['energy'], number> = {
    low: 4,
    medium: 7,
    high: 9,
  };
  const sorenessMap: Record<PreSessionCheckIn['bodyStatus'], number> = {
    fresh: 2,
    normal_soreness: 5,
    pain_or_strain: 8,
  };

  return {
    sleep: sleepMap[checkIn.recovery],
    energy: energyMap[checkIn.energy],
    soreness: sorenessMap[checkIn.bodyStatus],
  };
}

export function createDefaultPreSessionCheckIn(): PreSessionCheckIn {
  return {
    recovery: 'okay',
    energy: 'medium',
    bodyStatus: 'normal_soreness',
    goal: 'standard',
    timeAvailable: 'normal',
  };
}

export function createDefaultPostSessionDebrief(): PostSessionDebrief {
  return {
    sessionDifficulty: 'on_plan',
    planFit: 'about_right',
    bodyResponse: 'felt_good',
    confidenceNextTime: 'repeat',
  };
}

export function validateCheckIn(input: PreSessionCheckIn) {
  const errors: string[] = [];

  if (!input.recovery) errors.push('Select a recovery check-in.');
  if (!input.energy) errors.push('Select an energy check-in.');
  if (!input.bodyStatus) errors.push('Select a body-status check-in.');
  if (!input.goal) errors.push('Select a goal for today.');
  if (!input.timeAvailable) errors.push('Select your session window.');

  return { valid: errors.length === 0, errors };
}

export function ensureDefaultCheckIn(input: PreSessionCheckIn | undefined): PreSessionCheckIn {
  if (!input) {
    return createDefaultPreSessionCheckIn();
  }
  return {
    recovery: input.recovery || 'okay',
    energy: input.energy || 'medium',
    bodyStatus: input.bodyStatus || 'normal_soreness',
    goal: input.goal || 'standard',
    timeAvailable: input.timeAvailable || 'normal',
  };
}

export function validateDebrief(input: PostSessionDebrief) {
  const errors: string[] = [];

  if (!input.sessionDifficulty) errors.push('Select how the session played out.');
  if (!input.planFit) errors.push('Select whether the plan fit the day.');
  if (!input.bodyResponse) errors.push('Select how your body responded.');
  if (!input.confidenceNextTime) errors.push('Select what should happen next time.');

  return { valid: errors.length === 0, errors };
}

export function normalizeExercisesForSave(exercises: ExerciseSession[]) {
  return exercises
    .filter((exercise) => exercise.exerciseName.trim() !== '')
    .map((exercise) => ({
      ...exercise,
      exerciseName: normalizeExerciseName(exercise.exerciseName),
      sets: exercise.sets.filter((set) => set.weight > 0 || set.reps > 0),
    }))
    .filter((exercise) => exercise.sets.length > 0);
}

export function validateExercisesForSave(exercises: ExerciseSession[]) {
  const errors: string[] = [];

  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      const validation = validateWorkoutSet(set.weight, set.reps, set.rpe);
      if (!validation.valid) {
        errors.push(`Invalid set data in ${exercise.exerciseName}:\n${validation.errors.join('\n')}`);
        return { valid: false, errors };
      }
    }
  }

  return { valid: true, errors };
}

export function buildSession(input: {
  exercises: ExerciseSession[];
  preSessionCheckIn: PreSessionCheckIn;
  postSessionDebrief: PostSessionDebrief;
  notes: string;
  programWeek: number;
}): Session {
  const readiness = deriveReadinessScores(input.preSessionCheckIn);

  return {
    date: new Date().toISOString(),
    exercises: input.exercises,
    soreness: readiness.soreness,
    sleep: readiness.sleep,
    energy: readiness.energy,
    preSessionCheckIn: input.preSessionCheckIn,
    postSessionDebrief: input.postSessionDebrief,
    notes: input.notes.trim(),
    programWeek: input.programWeek,
  };
}
