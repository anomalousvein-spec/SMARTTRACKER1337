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
  const volumeOverreached =
    suggestion.currentWeeklySets > suggestion.caps.mrv ||
    suggestion.projectedWeeklySets > suggestion.caps.mrv;
  const volumeNearLimit =
    suggestion.currentWeeklySets >= suggestion.caps.mav ||
    suggestion.projectedWeeklySets >= suggestion.caps.mav;
  const isDeload = suggestion.reason.includes('Programmed deload week');
  const isPainManaged =
    suggestion.reason.includes('Pain or strain flagged') ||
    suggestion.reason.includes('pain watch') ||
    suggestion.reason.includes('variation change - keep this lift conservative');
  const isRebuildDay =
    suggestion.reason.includes('reduce demand and rebuild quality') ||
    suggestion.reason.includes('less well-tolerated recently');
  const isLightDay = suggestion.reason.includes('Light-day goal selected');
  const isTimeCapped = suggestion.reason.includes('Short session window');
  const isRegression = suggestion.reason.includes('Performance declining');
  const isAggressiveProgression =
    suggestion.reason.includes('Strong performance') ||
    suggestion.reason.includes('Recovering fast');

  if (isDeload) {
    const hasFatigue = suggestion.reason.includes('fatigue markers present');
    return {
      kind: 'deload',
      priority: 1,
      label: hasFatigue ? 'Recovery Priority' : 'Light Week',
      headline: hasFatigue ? 'Deload Recommended' : 'Light Week Favored',
      reason: hasFatigue
        ? `${toTitleCase(suggestion.exerciseName)} is at a programmed recovery checkpoint with fatigue markers in play.`
        : `${toTitleCase(suggestion.exerciseName)} has hit a programmed recovery checkpoint, but fatigue looks manageable.`,
      action: hasFatigue
        ? 'Reduce load and keep volume light this week.'
        : 'Keep the session in, but avoid pushing hard.',
      accent: 'text-amber-200',
      dot: 'bg-amber-400',
      ctaLabel: 'Open Session',
      ctaTarget: 'log',
      exerciseName: suggestion.exerciseName,
      tags: ['Recovery', 'Deload'],
    };
  }

  if (isPainManaged) {
    return {
      kind: 'pain',
      priority: 2,
      label: 'Protective Call',
      headline: 'Protect This Pattern',
      reason: `${toTitleCase(suggestion.exerciseName)} is being held back because your latest check-in or debrief flagged pain, strain, or a likely variation change.`,
      action: 'Keep the lift submaximal, and swap the variation if irritation stays present.',
      accent: 'text-amber-200',
      dot: 'bg-amber-400',
      ctaLabel: 'Review Lift',
      ctaTarget: 'exercise',
      exerciseName: suggestion.exerciseName,
      tags: ['Pain', 'Protection'],
    };
  }

  if (suggestion.isReadinessPoor) {
    return {
      kind: 'readiness',
      priority: 3,
      label: 'Recovery First',
      headline: 'Recovery First Today',
      reason: `${toTitleCase(suggestion.exerciseName)} is being capped because the pre-session coach check-in points to a low-readiness day.`,
      action: `Keep volume controlled${suggestion.suggestedRPE !== undefined ? ` and aim around RPE ${suggestion.suggestedRPE.toFixed(1)}` : ''}.`,
      accent: 'text-amber-200',
      dot: 'bg-amber-400',
      ctaLabel: 'Open Session',
      ctaTarget: 'log',
      exerciseName: suggestion.exerciseName,
      tags: ['Recovery', 'Readiness'],
    };
  }

  if (isRebuildDay) {
    return {
      kind: 'rebuild',
      priority: 4,
      label: 'Coach Adjustment',
      headline: 'Rebuild Quality',
      reason: `${toTitleCase(suggestion.exerciseName)} is being softened because your last debrief said the session overshot what the day could support.`,
      action: 'Reduce demand slightly and make this a quality-first exposure.',
      accent: 'text-yellow-200',
      dot: 'bg-yellow-400',
      ctaLabel: 'Open Session',
      ctaTarget: 'log',
      exerciseName: suggestion.exerciseName,
      tags: ['Feedback', 'Recovery'],
    };
  }

  if (isLightDay) {
    return {
      kind: 'light-day',
      priority: 5,
      label: 'Light Intent',
      headline: 'Keep Today Light',
      reason: `${toTitleCase(suggestion.exerciseName)} is being held in maintenance mode because you chose a lighter training day.`,
      action: 'Keep quality high and avoid chasing extra fatigue.',
      accent: 'text-sky-200',
      dot: 'bg-sky-400',
      ctaLabel: 'Open Session',
      ctaTarget: 'log',
      exerciseName: suggestion.exerciseName,
      tags: ['Goal', 'Recovery'],
    };
  }

  if (isTimeCapped) {
    return {
      kind: 'time-cap',
      priority: 6,
      label: 'Time Constraint',
      headline: 'Minimum Effective Work',
      reason: `${toTitleCase(suggestion.exerciseName)} is being trimmed to fit the shorter session window you selected.`,
      action: 'Hit the key work first and leave accessories for another day.',
      accent: 'text-sky-200',
      dot: 'bg-sky-400',
      ctaLabel: 'Open Session',
      ctaTarget: 'log',
      exerciseName: suggestion.exerciseName,
      tags: ['Time', 'Focus'],
    };
  }

  if (volumeOverreached) {
    return {
      kind: 'overreached',
      priority: 7,
      label: 'Volume Check',
      headline: 'Volume Too High',
      reason: `${toTitleCase(suggestion.exerciseName)} is already beyond recoverable weekly volume for ${suggestion.primaryMuscle}.`,
      action: 'Reduce sets or shift focus to another area.',
      accent: 'text-red-200',
      dot: 'bg-red-400',
      ctaLabel: 'Review Lift',
      ctaTarget: 'exercise',
      exerciseName: suggestion.exerciseName,
      tags: ['Volume', 'Recovery'],
    };
  }

  if (volumeNearLimit) {
    return {
      kind: 'near-limit',
      priority: 8,
      label: 'Volume Control',
      headline: 'Hold Volume',
      reason: `${toTitleCase(suggestion.exerciseName)} is near the top of its productive weekly volume range.`,
      action: 'Keep sets steady and focus on quality.',
      accent: 'text-orange-200',
      dot: 'bg-orange-400',
      ctaLabel: 'Open Session',
      ctaTarget: 'log',
      exerciseName: suggestion.exerciseName,
      tags: ['Volume'],
    };
  }

  if (suggestion.plateauFlag) {
    return {
      kind: 'plateau',
      priority: 9,
      label: 'Plateau Signal',
      headline: 'Progress Has Stalled',
      reason: `${toTitleCase(suggestion.exerciseName)} has been flat across recent sessions while effort has climbed.`,
      action: 'Keep the muscle target, but swap the variation next session.',
      accent: 'text-orange-200',
      dot: 'bg-orange-400',
      ctaLabel: 'Review Lift',
      ctaTarget: 'exercise',
      exerciseName: suggestion.exerciseName,
      tags: ['Plateau', 'Variation'],
    };
  }

  if (isRegression) {
    return {
      kind: 'regression',
      priority: 10,
      label: 'Reset Window',
      headline: 'Rebuild This Lift',
      reason: `${toTitleCase(suggestion.exerciseName)} has dipped enough to justify a short reset.`,
      action: 'Reduce load, return to baseline sets, and build back up.',
      accent: 'text-yellow-200',
      dot: 'bg-yellow-400',
      ctaLabel: 'Open Session',
      ctaTarget: 'log',
      exerciseName: suggestion.exerciseName,
      tags: ['Reset'],
    };
  }

  if (isAggressiveProgression) {
    return {
      kind: 'progression',
      priority: 11,
      label: 'Momentum Window',
      headline: 'Push Progression',
      reason: `${toTitleCase(suggestion.exerciseName)} is showing strong performance with room to progress.`,
      action: 'Increase load, and only add volume if execution stays sharp.',
      accent: 'text-emerald-200',
      dot: 'bg-emerald-400',
      ctaLabel: 'Start Lift',
      ctaTarget: 'log',
      exerciseName: suggestion.exerciseName,
      tags: ['Progression'],
    };
  }

  if (suggestion.currentWeeklySets < suggestion.caps.mev) {
    return {
      kind: 'under-stimulated',
      priority: 12,
      label: 'Volume Opportunity',
      headline: 'Room To Do More',
      reason: `${toTitleCase(suggestion.exerciseName)} is still below minimum productive weekly volume for ${suggestion.primaryMuscle}.`,
      action: 'Add a small amount of quality volume if recovery feels good.',
      accent: 'text-sky-200',
      dot: 'bg-sky-400',
      ctaLabel: 'Open Session',
      ctaTarget: 'log',
      exerciseName: suggestion.exerciseName,
      tags: ['Volume', 'Opportunity'],
    };
  }

  return {
    kind: 'default',
    priority: 13,
    label: 'System Read',
    headline: 'Stay On Track',
    reason: `${toTitleCase(suggestion.exerciseName)} is in a productive range and progression is moving normally.`,
    action: 'Follow the target and build reps with quality.',
    accent: 'text-blue-200',
    dot: 'bg-blue-400',
    ctaLabel: 'Start Lift',
    ctaTarget: 'log',
    exerciseName: suggestion.exerciseName,
    tags: ['Progression'],
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
