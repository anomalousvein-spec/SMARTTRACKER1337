import { describe, expect, it } from 'vitest';
import { selectCoachFocus } from '../src/features/dashboard/coachFocus';
import type { ExerciseSuggestion } from '../src/features/dashboard/types';

function createSuggestion(overrides: Partial<ExerciseSuggestion> = {}): ExerciseSuggestion {
  return {
    exerciseName: 'bench press',
    suggestedWeight: 100,
    suggestedReps: 8,
    suggestedSets: 3,
    reason: 'Standard progression - build reps toward range ceiling',
    plateauFlag: false,
    primaryMuscle: 'chest',
    currentWeeklySets: 10,
    projectedWeeklySets: 13,
    caps: { mev: 10, mav: 16, mrv: 22 },
    allTimeBestWeight: 110,
    allTimeBestE1RM: 130,
    weeklyHistory: [],
    ...overrides,
  };
}

describe('selectCoachFocus', () => {
  it('prioritizes readiness over plateau signals', () => {
    const focus = selectCoachFocus(
      [
        createSuggestion({
          exerciseName: 'bench press',
          plateauFlag: true,
          reason: 'Plateau detected - performance stagnant despite high effort',
        }),
        createSuggestion({
          exerciseName: 'squat',
          isReadinessPoor: true,
          suggestedRPE: 7.5,
          reason: 'Low sleep or energy - reduced volume to protect recovery and quality',
        }),
      ],
      'Global insight'
    );

    expect(focus.kind).toBe('readiness');
    expect(focus.headline).toBe('Recovery First Today');
    expect(focus.exerciseName).toBe('squat');
  });

  it('handles case-insensitive pain watch detection', () => {
    const focus = selectCoachFocus(
      [
        createSuggestion({
          exerciseName: 'bench press',
          reason: 'PAIN WATCH - protect this pattern',
        }),
      ],
      'Global insight'
    );

    expect(focus.kind).toBe('pain');
    expect(focus.headline).toBe('Protect This Pattern');
  });

  it('triggers pain management for variation change AND conservative keywords', () => {
    const focus = selectCoachFocus(
      [
        createSuggestion({
          exerciseName: 'bench press',
          reason: 'Last session debrief favored a variation change - keep this lift conservative if you repeat it',
        }),
      ],
      'Global insight'
    );

    expect(focus.kind).toBe('pain');
    expect(focus.headline).toBe('Protect This Pattern');
  });

  it('does NOT trigger pain management for variation change WITHOUT conservative keyword', () => {
    const focus = selectCoachFocus(
      [
        createSuggestion({
          exerciseName: 'bench press',
          reason: 'Time for a variation change to avoid boredom',
        }),
      ],
      'Global insight'
    );

    // Should fall back to something else, like progression or default
    expect(focus.kind).not.toBe('pain');
  });

  it('handles readiness fallback string matching', () => {
    const focus = selectCoachFocus(
      [
        createSuggestion({
          exerciseName: 'deadlift',
          reason: 'Pre-session check-in shows low-readiness',
        }),
      ],
      'Global insight'
    );

    expect(focus.kind).toBe('readiness');
    expect(focus.headline).toBe('Recovery First Today');
  });

  it('detects new aggressive progression signal: Recovery trend looks strong', () => {
    const focus = selectCoachFocus(
      [
        createSuggestion({
          exerciseName: 'overhead press',
          reason: 'Recovery trend looks strong and the stimulus is being well-tolerated - add volume',
        }),
      ],
      'Global insight'
    );

    expect(focus.kind).toBe('progression');
    expect(focus.headline).toBe('Push Progression');
  });

  it('maintains priority hierarchy: Deload > Pain > Readiness', () => {
    const focus = selectCoachFocus(
      [
        createSuggestion({
          exerciseName: 'squat',
          reason: 'Programmed deload week (Week 6) - fatigue markers present',
        }),
        createSuggestion({
          exerciseName: 'bench press',
          reason: 'Pain watch',
        }),
        createSuggestion({
          exerciseName: 'deadlift',
          isReadinessPoor: true,
          reason: 'Low sleep or energy',
        }),
      ],
      'Global insight'
    );

    expect(focus.kind).toBe('deload');
    expect(focus.exerciseName).toBe('squat');
  });

  it('returns setup guidance when no suggestions exist', () => {
    const focus = selectCoachFocus([], 'Continue logging sessions to unlock progress insights.');

    expect(focus.kind).toBe('default');
    expect(focus.headline).toBe('Start Building Data');
    expect(focus.ctaTarget).toBe('log');
  });
});
