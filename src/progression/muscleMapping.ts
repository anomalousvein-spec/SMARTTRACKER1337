/**
 * Maps exercises to primary and secondary muscle groups.
 *
 * DESIGN NOTE: The 'primary' keys here MUST match the keys used in
 * training settings for volume caps (MEV/MAV/MRV).
 */
export const MUSCLE_MAPPING: Record<string, { primary: string; secondary?: string[] }> = {
  // Chest
  'bench press': { primary: 'chest', secondary: ['triceps', 'front delts'] },
  'barbell bench press': { primary: 'chest', secondary: ['triceps', 'front delts'] },
  'dumbbell bench press': { primary: 'chest', secondary: ['triceps', 'front delts'] },
  'flat smith machine press': { primary: 'chest', secondary: ['triceps', 'front delts'] },
  'incline dumbbell press': { primary: 'chest', secondary: ['front delts', 'triceps'] },
  'incline smith machine press': { primary: 'chest', secondary: ['front delts', 'triceps'] },
  'push up': { primary: 'chest', secondary: ['triceps', 'front delts'] },
  'machine chest press': { primary: 'chest', secondary: ['triceps', 'front delts'] },
  'chest fly': { primary: 'chest', secondary: ['front delts'] },
  'cable fly': { primary: 'chest', secondary: ['front delts'] },
  'assisted dip': { primary: 'chest', secondary: ['triceps', 'front delts'] },
  'pec deck': { primary: 'chest', secondary: ['front delts'] },
  'hammer strength chest press': { primary: 'chest', secondary: ['triceps', 'front delts'] },
  'dumbbell incline fly': { primary: 'chest', secondary: ['front delts'] },
  'smith machine decline press': { primary: 'chest', secondary: ['triceps', 'front delts'] },

  // Quads
  'squat': { primary: 'quads', secondary: ['glutes', 'hamstrings', 'core'] },
  'barbell squat': { primary: 'quads', secondary: ['glutes', 'hamstrings', 'core'] },
  'smith machine squat': { primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  'leg extension': { primary: 'quads' },
  'leg press': { primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  'lunges': { primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  'hack squat': { primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  'dumbbell bulgarian split squat': { primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  'smith machine bulgarian split squat': { primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  'goblet squat': { primary: 'quads', secondary: ['glutes', 'hamstrings', 'core'] },
  'adductor machine': { primary: 'quads' },

  // Back
  'deadlift': { primary: 'back', secondary: ['hamstrings', 'glutes', 'core', 'traps'] },
  'barbell row': { primary: 'back', secondary: ['biceps', 'rear delts', 'traps'] },
  'machine row': { primary: 'back', secondary: ['biceps', 'rear delts'] },
  'pull up': { primary: 'back', secondary: ['biceps', 'rear delts'] },
  'assisted pull-up': { primary: 'back', secondary: ['biceps', 'rear delts'] },
  'lat pulldown': { primary: 'back', secondary: ['biceps', 'rear delts'] },
  'lat pulldown (machine)': { primary: 'back', secondary: ['biceps', 'rear delts'] },
  'seated cable row': { primary: 'back', secondary: ['biceps', 'rear delts'] },
  'dumbbell row': { primary: 'back', secondary: ['biceps', 'rear delts'] },
  't-bar row': { primary: 'back', secondary: ['biceps', 'rear delts', 'traps'] },
  'dumbbell pullover': { primary: 'back', secondary: ['chest', 'triceps'] },
  'back extension (machine)': { primary: 'back', secondary: ['hamstrings', 'glutes'] },
  'v-bar pulldown': { primary: 'back', secondary: ['biceps', 'rear delts'] },
  'single arm lat pulldown': { primary: 'back', secondary: ['biceps', 'rear delts'] },
  'chest supported row': { primary: 'back', secondary: ['biceps', 'rear delts'] },
  'cable straight arm pulldown': { primary: 'back', secondary: ['triceps', 'rear delts'] },

  // Shoulders
  'overhead press': { primary: 'front delts', secondary: ['triceps', 'traps'] },
  'machine shoulder press': { primary: 'front delts', secondary: ['triceps'] },
  'front raise': { primary: 'front delts' },
  'lateral raise': { primary: 'shoulders', secondary: ['front delts'] },
  'cable lateral raise': { primary: 'shoulders', secondary: ['front delts'] },
  'cable upright row': { primary: 'shoulders', secondary: ['traps', 'biceps'] },
  'rear delt fly': { primary: 'rear delts', secondary: ['shoulders', 'traps'] },
  'cable reverse fly': { primary: 'rear delts', secondary: ['shoulders', 'traps'] },
  'face pull': { primary: 'rear delts', secondary: ['shoulders', 'traps'] },
  'cable face pull': { primary: 'rear delts', secondary: ['shoulders', 'traps'] },
  'dumbbell shoulder press': { primary: 'front delts', secondary: ['triceps'] },
  'smith machine shoulder press': { primary: 'front delts', secondary: ['triceps'] },
  'machine lateral raise': { primary: 'shoulders', secondary: ['front delts'] },
  'dumbbell shrug': { primary: 'traps', secondary: ['back'] },
  'cable shrug': { primary: 'traps', secondary: ['back'] },

  // Hamstrings
  'romanian deadlift': { primary: 'hamstrings', secondary: ['glutes', 'back', 'core'] },
  'dumbbell romanian deadlift': { primary: 'hamstrings', secondary: ['glutes', 'back', 'core'] },
  'smith machine good morning': { primary: 'hamstrings', secondary: ['back', 'glutes', 'core'] },
  'leg curl': { primary: 'hamstrings' },
  'seated leg curl': { primary: 'hamstrings' },
  'glute ham raise': { primary: 'hamstrings', secondary: ['glutes'] },
  'lying leg curl': { primary: 'hamstrings' },

  // Arms
  'bicep curl': { primary: 'biceps' },
  'dumbbell curl': { primary: 'biceps' },
  'dumbbell curl (flat bench)': { primary: 'biceps' },
  'hammer curl': { primary: 'biceps' },
  'barbell curl': { primary: 'biceps' },
  'preacher curl': { primary: 'biceps' },
  'cable bicep curl': { primary: 'biceps' },
  'cable hammer curl': { primary: 'biceps' },
  'incline dumbbell curl': { primary: 'biceps' },
  'concentration curl': { primary: 'biceps' },
  'tricep extension': { primary: 'triceps' },
  'tricep extension machine': { primary: 'triceps' },
  'skull crusher': { primary: 'triceps' },
  'smith machine skullcrusher': { primary: 'triceps' },
  'dips': { primary: 'triceps', secondary: ['chest', 'front delts'] },
  'tricep dip machine': { primary: 'triceps', secondary: ['chest', 'front delts'] },
  'close grip bench press': { primary: 'triceps', secondary: ['chest', 'front delts'] },
  'cable tricep pushdown (rope)': { primary: 'triceps' },
  'cable tricep pushdown (bar)': { primary: 'triceps' },
  'cable overhead extension': { primary: 'triceps' },
  'dumbbell kickback': { primary: 'triceps' },

  // Core
  'plank': { primary: 'core' },
  'hanging leg raise': { primary: 'core' },
  'captain’s chair leg raise': { primary: 'core' },
  'cable crunch': { primary: 'core' },
  'ab wheel rollout': { primary: 'core' },
  'torso twist machine': { primary: 'core' },
  'machine crunch': { primary: 'core' },
  'cable woodchopper': { primary: 'core' },

  // Calves
  'standing calf raise': { primary: 'calves' },
  'seated calf raise': { primary: 'calves' },
  'calf press machine': { primary: 'calves' },
  'calf press on leg press': { primary: 'calves', secondary: ['quads'] },

  // Glutes
  'hip thrust': { primary: 'glutes', secondary: ['hamstrings', 'core'] },
  'glute bridge': { primary: 'glutes', secondary: ['hamstrings'] },
  'hyperextension': { primary: 'glutes', secondary: ['back', 'hamstrings'] },
  'abductor machine': { primary: 'glutes' },
  'cable pull through': { primary: 'glutes', secondary: ['hamstrings'] },
  'cable glute kickback': { primary: 'glutes' },
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
    if (normalized.includes('shoulder') || normalized.includes('overhead')) return 'front delts';
    return 'chest';
  }
  if (normalized.includes('curl')) return 'biceps';
  if (normalized.includes('extension')) return 'triceps';
  if (normalized.includes('lateral')) return 'shoulders';
  if (normalized.includes('rear delt') || normalized.includes('reverse fly')) return 'rear delts';
  if (normalized.includes('face pull')) return 'rear delts';

  return 'unknown';
}

export function getSecondaryMuscles(exerciseName: string): string[] {
  const normalized = normalizeExerciseName(exerciseName);
  return MUSCLE_MAPPING[normalized]?.secondary ?? [];
}
