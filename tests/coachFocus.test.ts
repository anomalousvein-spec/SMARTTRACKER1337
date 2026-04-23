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

  it('returns setup guidance when no suggestions exist', () => {
    const focus = selectCoachFocus([], 'Continue logging sessions to unlock progress insights.');

    expect(focus.kind).toBe('default');
    expect(focus.headline).toBe('Start Building Data');
    expect(focus.ctaTarget).toBe('log');
  });
});
