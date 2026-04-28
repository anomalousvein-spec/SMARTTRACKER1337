/**
 * Maps exercises to primary and secondary muscle groups.
 *
 * DESIGN NOTE: The 'primary' keys here MUST match the keys used in
 * training settings for volume caps (MEV/MAV/MRV).
 */
export const MUSCLE_MAPPING: Record<string, { primary: string; secondary?: string[] }> = {
  // Chest
  'bench press': { primary: 'chest', secondary: ['triceps', 'shoulders'] },
  'barbell bench press': { primary: 'chest', secondary: ['triceps', 'shoulders'] },
  'incline dumbbell press': { primary: 'chest', secondary: ['shoulders', 'triceps'] },
  'push up': { primary: 'chest', secondary: ['triceps', 'shoulders'] },
  'machine chest press': { primary: 'chest', secondary: ['triceps'] },
  'chest fly': { primary: 'chest', secondary: ['shoulders'] },
  'cable fly': { primary: 'chest', secondary: ['shoulders'] },

  // Quads
  'squat': { primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  'barbell squat': { primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  'leg extension': { primary: 'quads' },
  'leg press': { primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  'lunges': { primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  'hack squat': { primary: 'quads', secondary: ['glutes', 'hamstrings'] },

  // Back
  'barbell row': { primary: 'back', secondary: ['biceps', 'shoulders'] },
  'deadlift': { primary: 'back', secondary: ['hamstrings', 'glutes'] },
  'pull up': { primary: 'back', secondary: ['biceps'] },
  'lat pulldown': { primary: 'back', secondary: ['biceps'] },
  'seated cable row': { primary: 'back', secondary: ['biceps'] },
  'dumbbell row': { primary: 'back', secondary: ['biceps'] },
  't-bar row': { primary: 'back', secondary: ['biceps'] },

  // Shoulders (Consolidated key for MRV matching)
  'overhead press': { primary: 'shoulders', secondary: ['triceps'] },
  'lateral raise': { primary: 'shoulders' },
  'machine shoulder press': { primary: 'shoulders', secondary: ['triceps'] },
  'rear delt fly': { primary: 'shoulders' },
  'front raise': { primary: 'shoulders' },
  'face pull': { primary: 'shoulders', secondary: ['back'] },

  // Hamstrings
  'romanian deadlift': { primary: 'hamstrings', secondary: ['glutes', 'back'] },
  'leg curl': { primary: 'hamstrings' },
  'seated leg curl': { primary: 'hamstrings' },
  'glute ham raise': { primary: 'hamstrings', secondary: ['glutes'] },

  // Arms
  'bicep curl': { primary: 'biceps' },
  'hammer curl': { primary: 'biceps' },
  'barbell curl': { primary: 'biceps' },
  'preacher curl': { primary: 'biceps' },
  'tricep extension': { primary: 'triceps' },
  'skull crusher': { primary: 'triceps' },
  'dips': { primary: 'triceps', secondary: ['chest', 'shoulders'] },
  'close grip bench press': { primary: 'triceps', secondary: ['chest', 'shoulders'] },

  // Core
  'plank': { primary: 'core' },
  'hanging leg raise': { primary: 'core' },
  'cable crunch': { primary: 'core' },
  'ab wheel rollout': { primary: 'core' },

  // Calves
  'standing calf raise': { primary: 'calves' },
  'seated calf raise': { primary: 'calves' },

  // Glutes
  'hip thrust': { primary: 'glutes', secondary: ['hamstrings'] },
  'glute bridge': { primary: 'glutes', secondary: ['hamstrings'] },
};

import { normalizeExerciseName } from '../utils/normalization';

export function getPrimaryMuscle(exerciseName: string): string {
  const normalized = normalizeExerciseName(exerciseName);
  if (MUSCLE_MAPPING[normalized]) {
    return MUSCLE_MAPPING[normalized].primary;
  }

  if (normalized.includes('bench')) return 'chest';
  if (normalized.includes('squat')) return 'quads';
  if (normalized.includes('calf')) return 'calves';
  if (normalized.includes('plank') || normalized.includes('crunch') || normalized.includes('ab wheel') || normalized.includes('leg raise')) return 'core';
  if (normalized.includes('hip thrust') || normalized.includes('glute bridge')) return 'glutes';
  if (normalized.includes('deadlift')) {
    if (normalized.includes('romanian')) return 'hamstrings';
    return 'back';
  }
  if (normalized.includes('row')) return 'back';
  if (normalized.includes('press')) {
    if (normalized.includes('shoulder') || normalized.includes('overhead')) return 'shoulders';
    return 'chest';
  }
  if (normalized.includes('curl')) return 'biceps';
  if (normalized.includes('extension')) return 'triceps';

  return 'unknown';
}

export function getSecondaryMuscles(exerciseName: string): string[] {
  const normalized = normalizeExerciseName(exerciseName);
  return MUSCLE_MAPPING[normalized]?.secondary || [];
}
