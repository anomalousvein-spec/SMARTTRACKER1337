import { toTitleCase } from '../../utils/formatters';
import type { ExerciseSuggestion } from './types';

export type CoachFocusKind =
  | 'deload'
  | 'pain'
  | 'readiness'
  | 'rebuild'
  | 'light-day'
  | 'time-cap'
  | 'overreached'
  | 'near-limit'
  | 'plateau'
  | 'regression'
  | 'progression'
  | 'peaking'
  | 'technique'
  | 'under-stimulated'
  | 'default';

export interface CoachFocus {
  kind: CoachFocusKind;
  priority: number;
  label: string;
  headline: string;
  reason: string;
  action: string;
  accent: string;
  dot: string;
  ctaLabel: string;
  ctaTarget: 'log' | 'exercise' | 'analysis';
  exerciseName?: string;
  tags: string[];
}

function buildFocusFromSuggestion(suggestion: ExerciseSuggestion): CoachFocus {
  const reasonLower = suggestion.reason.toLowerCase();

  // --- Volume Logic ---
  const volumeOverreached =
    suggestion.currentWeeklySets > suggestion.caps.mrv ||
    suggestion.projectedWeeklySets > suggestion.caps.mrv;
  const volumeNearLimit =
    suggestion.currentWeeklySets >= suggestion.caps.mav ||
    suggestion.projectedWeeklySets >= suggestion.caps.mav;

  // --- Detection Logic ---
  const isDeload = reasonLower.includes('programmed deload week');

  const isPainManaged =
    reasonLower.includes('pain or strain flagged') ||
    reasonLower.includes('pain watch') ||
    (reasonLower.includes('variation change') && reasonLower.includes('conservative'));

  const isReadinessPoor =
    suggestion.isReadinessPoor === true ||
    reasonLower.includes('low sleep or energy') ||
    reasonLower.includes('low-readiness');

  const isRebuildDay =
    reasonLower.includes('reduce demand and rebuild quality') ||
    reasonLower.includes('less well-tolerated recently');

  const isLightDay = reasonLower.includes('light-day goal selected');
  const isTimeCapped = reasonLower.includes('short session window');
  const isRegression = reasonLower.includes('performance declining');
    const isTechniqueFocus =
    reasonLower.includes('focus on execution') ||
    reasonLower.includes('quality-first exposure') ||
    reasonLower.includes('consolidate gains') ||
    reasonLower.includes('build capacity before loading') ||
    reasonLower.includes('quality threshold approached');

  const isPeaking =
    reasonLower.includes('peaking phase') ||
    reasonLower.includes('intensity climb') ||
    reasonLower.includes('accelerate') ||
    reasonLower.includes('momentum window');

  const isAggressiveProgression =
    reasonLower.includes('strong performance') ||
    reasonLower.includes('recovering fast') ||
    reasonLower.includes('recovery trend looks strong');

  // --- Priority Hierarchy ---

  // 1. Deload Weeks (Highest)
  if (isDeload) {
    const hasFatigue = reasonLower.includes('fatigue markers present');
    return {
      kind: 'deload', priority: 1, label: hasFatigue ? 'Recovery Priority' : 'Light Week',
      headline: hasFatigue ? 'Deload Recommended' : 'Light Week Favored',
      reason: hasFatigue
        ? `${toTitleCase(suggestion.exerciseName)} is at a programmed recovery checkpoint with fatigue markers in play.`
        : `${toTitleCase(suggestion.exerciseName)} has hit a programmed recovery checkpoint, but fatigue looks manageable.`,
      action: hasFatigue ? 'Reduce load and keep volume light this week.' : 'Keep the session in, but avoid pushing hard.',
      accent: 'text-amber-200', dot: 'bg-amber-400', ctaLabel: 'Open Session', ctaTarget: 'log', exerciseName: suggestion.exerciseName, tags: ['Recovery', 'Deload'],
    };
  }

  // 1.5 Peaking Phase
  if (isPeaking) {
    return {
      kind: 'peaking', priority: 1.5, label: 'Peaking Phase', headline: 'Peak Performance',
      reason: `${toTitleCase(suggestion.exerciseName)} is entering a peaking phase where intensity is prioritized over volume.`,
      action: 'Focus on high-quality, heavy singles or doubles. Keep recovery high.',
      accent: 'text-purple-200', dot: 'bg-purple-400', ctaLabel: 'Start Peak', ctaTarget: 'log', exerciseName: suggestion.exerciseName, tags: ['Peaking', 'Intensity'],
    };
  }

  // 2. Pain Management
  if (isPainManaged) {
    return {
      kind: 'pain', priority: 2, label: 'Protective Call', headline: 'Protect This Pattern',
      reason: `${toTitleCase(suggestion.exerciseName)} is being held back because your latest check-in or debrief flagged pain, strain, or a likely variation change.`,
      action: 'Keep the lift submaximal, and swap the variation if irritation stays present.',
      accent: 'text-amber-200', dot: 'bg-amber-400', ctaLabel: 'Review Lift', ctaTarget: 'exercise', exerciseName: suggestion.exerciseName, tags: ['Pain', 'Protection'],
    };
  }

  // 3. Low Readiness/Recovery
  if (isReadinessPoor) {
    return {
      kind: 'readiness', priority: 3, label: 'Recovery First', headline: 'Recovery First Today',
      reason: `${toTitleCase(suggestion.exerciseName)} is being capped because the pre-session coach check-in points to a low-readiness day.`,
      action: `Keep volume controlled${suggestion.suggestedRPE !== undefined ? ` and aim around RPE ${suggestion.suggestedRPE.toFixed(1)}` : ''}.`,
      accent: 'text-amber-200', dot: 'bg-amber-400', ctaLabel: 'Open Session', ctaTarget: 'log', exerciseName: suggestion.exerciseName, tags: ['Recovery', 'Readiness'],
    };
  }

  // 4. Rebuild Adjustments
  if (isRebuildDay) {
    return {
      kind: 'rebuild', priority: 4, label: 'Coach Adjustment', headline: 'Rebuild Quality',
      reason: `${toTitleCase(suggestion.exerciseName)} is being softened because your last debrief said the session overshot what the day could support.`,
      action: 'Reduce demand slightly and make this a quality-first exposure.',
      accent: 'text-yellow-200', dot: 'bg-yellow-400', ctaLabel: 'Open Session', ctaTarget: 'log', exerciseName: suggestion.exerciseName, tags: ['Feedback', 'Recovery'],
    };
  }

  // 5. Light Day Goals
  if (isLightDay) {
    return {
      kind: 'light-day', priority: 5, label: 'Light Intent', headline: 'Keep Today Light',
      reason: `${toTitleCase(suggestion.exerciseName)} is being held in maintenance mode because you chose a lighter training day.`,
      action: 'Keep quality high and avoid chasing extra fatigue.',
      accent: 'text-sky-200', dot: 'bg-sky-400', ctaLabel: 'Open Session', ctaTarget: 'log', exerciseName: suggestion.exerciseName, tags: ['Goal', 'Recovery'],
    };
  }

  // 6. Time Constraints
  if (isTimeCapped) {
    return {
      kind: 'time-cap', priority: 6, label: 'Time Constraint', headline: 'Minimum Effective Work',
      reason: `${toTitleCase(suggestion.exerciseName)} is being trimmed to fit the shorter session window you selected.`,
      action: 'Hit the key work first and leave accessories for another day.',
      accent: 'text-sky-200', dot: 'bg-sky-400', ctaLabel: 'Open Session', ctaTarget: 'log', exerciseName: suggestion.exerciseName, tags: ['Time', 'Focus'],
    };
  }

  // 7. Volume Overreached
  if (volumeOverreached) {
    return {
      kind: 'overreached', priority: 7, label: 'Volume Check', headline: 'Volume Too High',
      reason: `${toTitleCase(suggestion.exerciseName)} is already beyond recoverable weekly volume for ${suggestion.primaryMuscle}.`,
      action: 'Reduce sets or shift focus to another area.',
      accent: 'text-red-200', dot: 'bg-red-400', ctaLabel: 'Review Lift', ctaTarget: 'exercise', exerciseName: suggestion.exerciseName, tags: ['Volume', 'Recovery'],
    };
  }

  // 8. Volume Near Limit
  if (volumeNearLimit) {
    return {
      kind: 'near-limit', priority: 8, label: 'Volume Control', headline: 'Hold Volume',
      reason: `${toTitleCase(suggestion.exerciseName)} is near the top of its productive weekly volume range.`,
      action: 'Keep sets steady and focus on quality.',
      accent: 'text-orange-200', dot: 'bg-orange-400', ctaLabel: 'Open Session', ctaTarget: 'log', exerciseName: suggestion.exerciseName, tags: ['Volume'],
    };
  }

  // 9. Plateau Detection
  if (suggestion.plateauFlag) {
    return {
      kind: 'plateau', priority: 9, label: 'Plateau Signal', headline: 'Progress Has Stalled',
      reason: `${toTitleCase(suggestion.exerciseName)} has been flat across recent sessions while effort has climbed.`,
      action: 'Keep the muscle target, but swap the variation next session.',
      accent: 'text-orange-200', dot: 'bg-orange-400', ctaLabel: 'Review Lift', ctaTarget: 'exercise', exerciseName: suggestion.exerciseName, tags: ['Plateau', 'Variation'],
    };
  }

  // 10. Regression/Reset Needed
  if (isRegression) {
    return {
      kind: 'regression', priority: 10, label: 'Reset Window', headline: 'Rebuild This Lift',
      reason: `${toTitleCase(suggestion.exerciseName)} has dipped enough to justify a short reset.`,
      action: 'Reduce load, return to baseline sets, and build back up.',
      accent: 'text-yellow-200', dot: 'bg-yellow-400', ctaLabel: 'Open Session', ctaTarget: 'log', exerciseName: suggestion.exerciseName, tags: ['Reset'],
    };
  }

  // 10.5 Technique Focus
  if (isTechniqueFocus) {
    return {
      kind: 'technique', priority: 10.5, label: 'Quality Check', headline: 'Focus on Execution',
      reason: `${toTitleCase(suggestion.exerciseName)} needs a quality reset to ensure long-term progress and safety.`,
      action: 'Slow down the tempo and prioritize perfect form over adding weight today.',
      accent: 'text-indigo-200', dot: 'bg-indigo-400', ctaLabel: 'Open Session', ctaTarget: 'log', exerciseName: suggestion.exerciseName, tags: ['Technique', 'Form'],
    };
  }

  // 11. Aggressive Progression
  if (isAggressiveProgression) {
    return {
      kind: 'progression', priority: 11, label: 'Momentum Window', headline: 'Push Progression',
      reason: `${toTitleCase(suggestion.exerciseName)} is showing strong performance with room to progress.`,
      action: 'Increase load, and only add volume if execution stays sharp.',
      accent: 'text-emerald-200', dot: 'bg-emerald-400', ctaLabel: 'Start Lift', ctaTarget: 'log', exerciseName: suggestion.exerciseName, tags: ['Progression'],
    };
  }

  // 12. Under-stimulated Volume
  if (suggestion.currentWeeklySets < suggestion.caps.mev) {
    return {
      kind: 'under-stimulated', priority: 12, label: 'Volume Opportunity', headline: 'Room To Do More',
      reason: `${toTitleCase(suggestion.exerciseName)} is still below minimum productive weekly volume for ${suggestion.primaryMuscle}.`,
      action: 'Add a small amount of quality volume if recovery feels good.',
      accent: 'text-sky-200', dot: 'bg-sky-400', ctaLabel: 'Open Session', ctaTarget: 'log', exerciseName: suggestion.exerciseName, tags: ['Volume', 'Opportunity'],
    };
  }

  // 13. Default / On-Track (Lowest)
  return {
    kind: 'default', priority: 13, label: 'System Read', headline: 'Stay On Track',
    reason: `${toTitleCase(suggestion.exerciseName)} is in a productive range and progression is moving normally.`,
    action: 'Follow the target and build reps with quality.',
    accent: 'text-blue-200', dot: 'bg-blue-400', ctaLabel: 'Start Lift', ctaTarget: 'log', exerciseName: suggestion.exerciseName, tags: ['Progression'],
  };
}

export function selectCoachFocus(
  suggestions: ExerciseSuggestion[],
  globalInsight: string
): CoachFocus {
  if (suggestions.length === 0) {
    return {
      kind: 'default',
      priority: 9,
      label: 'System Read',
      headline: 'Start Building Data',
      reason: globalInsight,
      action: 'Log a session to unlock progression coaching.',
      accent: 'text-blue-200',
      dot: 'bg-blue-400',
      ctaLabel: 'Start Logging',
      ctaTarget: 'log',
      tags: ['Setup'],
    };
  }

  const ranked = suggestions
    .map(buildFocusFromSuggestion)
    .sort((a, b) => a.priority - b.priority || a.headline.localeCompare(b.headline));

  return ranked[0];
}
