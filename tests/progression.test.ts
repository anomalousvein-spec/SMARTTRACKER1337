import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../src/db/database';
import { calculateNextSuggestion, getVolumeStatus } from '../src/progression/engine';
import { Session, UserSettings } from '../src/db/models';

function withExerciseIndex(session: Session, exerciseNames: string[]): Session {
  return { ...session, exerciseNames };
}

describe('Progression Engine', () => {
  beforeEach(async () => {
    await db.sessions.clear();
    await db.exerciseSettings.clear();
    await db.userSettings.clear();
    vi.clearAllMocks();
  });

  it('returns baseline for no history', async () => {
    const suggestion = await calculateNextSuggestion('bench press');
    expect(suggestion.suggestedWeight).toBe(135);
    expect(suggestion.reason).toContain('No history - start conservative');
  });

  it('handles high soreness (Priority 1)', async () => {
    const session: Session = {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      soreness: 8,
      exercises: [
        {
          exerciseName: 'bench press',
          sets: [{ weight: 100, reps: 8, rpe: 8 }]
        }
      ]
    };
    await db.sessions.add(withExerciseIndex(session, ['bench press']));

    const suggestion = await calculateNextSuggestion('bench press');
    expect(suggestion.suggestedWeight).toBe(80);
    expect(suggestion.suggestedSets).toBe(1);
    expect(suggestion.reason).toContain('High soreness');
  });

  it('triggers programmed deload on week 6 (active recovery)', async () => {
    const session: Session = {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      soreness: 2,
      exercises: [
        {
          exerciseName: 'bench press',
          sets: [{ weight: 100, reps: 8, rpe: 8 }]
        }
      ]
    };
    await db.sessions.add(withExerciseIndex(session, ['bench press']));
    await db.userSettings.put({ id: 'global', currentProgramWeek: 6, deloadFrequency: 6, experienceLevel: 'intermediate', unit: 'lbs' } as UserSettings);

    const suggestion = await calculateNextSuggestion('bench press');
    expect(suggestion.suggestedWeight).toBe(95);
    expect(suggestion.reason).toContain('active recovery');
  });

  it('triggers aggressive programmed deload when fatigue is present', async () => {
    const session: Session = {
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      soreness: 7, // Fatigue marker
      exercises: [
        {
          exerciseName: 'bench press',
          sets: [{ weight: 100, reps: 8, rpe: 8 }]
        }
      ]
    };
    await db.sessions.add(withExerciseIndex(session, ['bench press']));
    await db.userSettings.put({ id: 'global', currentProgramWeek: 6, deloadFrequency: 6, experienceLevel: 'intermediate', unit: 'lbs' } as UserSettings);

    const suggestion = await calculateNextSuggestion('bench press');
    expect(suggestion.suggestedWeight).toBe(85);
    expect(suggestion.reason).toContain('fatigue markers present');
  });

  it('clamps volume when projected weekly volume exceeds MRV', async () => {
    // Fill up volume for 'chest' (bench press)
    // Intermediate MRV is ~21-22 sets
    const pastSession: Session = {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      soreness: 2,
      exercises: [
        {
          exerciseName: 'bench press',
          sets: Array.from({ length: 20 }, () => ({ weight: 100, reps: 8, rpe: 7 }))
        }
      ]
    };
    await db.sessions.add(withExerciseIndex(pastSession, ['bench press']));

    const suggestion = await calculateNextSuggestion('bench press');
    expect(suggestion.reason).toContain('near MRV');
    expect(suggestion.reason).toContain('capping volume');
  });

  it('handles Readiness Gate: low sleep (Priority 0.5)', async () => {
    const session: Session = {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      soreness: 2,
      exercises: [
        {
          exerciseName: 'bench press',
          sets: [{ weight: 100, reps: 8, rpe: 7 }]
        }
      ]
    };
    await db.sessions.add(withExerciseIndex(session, ['bench press']));

    // Pass low sleep readiness
    const suggestion = await calculateNextSuggestion('bench press', undefined, { sleep: 5, energy: 8 });
    expect(suggestion.suggestedSets).toBeLessThanOrEqual(2);
    expect(suggestion.reason).toContain('Low sleep or energy');
    expect(suggestion.suggestedRPE).toBeDefined();
  });

  it('handles aggressive progression: low RPE (Priority 4)', async () => {
    const session: Session = {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      soreness: 2,
      exercises: [
        {
          exerciseName: 'bench press',
          sets: [
            { weight: 100, reps: 10, rpe: 4 },
            { weight: 100, reps: 10, rpe: 4 }
          ]
        }
      ]
    };
    await db.sessions.add(withExerciseIndex(session, ['bench press']));

    const suggestion = await calculateNextSuggestion('bench press');
    expect(suggestion.suggestedWeight).toBeGreaterThan(100);
    expect(suggestion.reason).toContain('Strong performance');
  });

  it('uses the override week for deload decisions', async () => {
    const session: Session = {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      soreness: 2,
      exercises: [
        {
          exerciseName: 'bench press',
          sets: [{ weight: 100, reps: 8, rpe: 8 }]
        }
      ]
    };
    await db.sessions.add(withExerciseIndex(session, ['bench press']));
    await db.userSettings.put({ id: 'global', currentProgramWeek: 5, deloadFrequency: 6, experienceLevel: 'intermediate', unit: 'lbs' } as UserSettings);

    const suggestion = await calculateNextSuggestion('bench press', 6);
    expect(suggestion.reason).toContain('Programmed deload week (Week 6)');
  });

  it('tracks current and projected weekly volume separately', async () => {
    const pastSession: Session = {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      soreness: 2,
      exercises: [
        {
          exerciseName: 'bench press',
          sets: [
            { weight: 100, reps: 8, rpe: 7 },
            { weight: 100, reps: 8, rpe: 7 },
            { weight: 100, reps: 8, rpe: 7 }
          ]
        }
      ]
    };
    await db.sessions.add(withExerciseIndex(pastSession, ['bench press']));

    const suggestion = await calculateNextSuggestion('bench press');
    expect(suggestion.currentWeeklySets).toBe(3);
    expect(suggestion.projectedWeeklySets).toBeGreaterThanOrEqual(suggestion.currentWeeklySets);
  });
});

describe('Progression Engine - Edge Cases', () => {
  beforeEach(async () => {
    await db.sessions.clear();
    await db.exerciseSettings.clear();
    await db.userSettings.clear();
  });

  it('prioritizes regression over standard progression', async () => {
    const sessions = [
      {
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        soreness: 2,
        exercises: [{ exerciseName: 'bench press', sets: Array.from({length: 3}, () => ({weight: 100, reps: 10, rpe: 8}))}]
      },
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        soreness: 2,
        exercises: [{ exerciseName: 'bench press', sets: Array.from({length: 3}, () => ({weight: 100, reps: 8, rpe: 8}))}]
      }
    ];
    for (const s of sessions) {
      await db.sessions.add(withExerciseIndex(s, ['bench press']));
    }

    const suggestion = await calculateNextSuggestion('bench press');
    expect(suggestion.suggestedWeight).toBe(90);
    expect(suggestion.reason).toContain('Performance declining');
  });

  it('detects plateau with rising RPE', async () => {
    const sessions = [
      {
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        soreness: 2,
        exercises: [{ exerciseName: 'bench press', sets: [{ weight: 100, reps: 8, rpe: 7 }] }]
      },
      {
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        soreness: 2,
        exercises: [{ exerciseName: 'bench press', sets: [{ weight: 100, reps: 8, rpe: 8 }] }]
      },
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        soreness: 2,
        exercises: [{ exerciseName: 'bench press', sets: [{ weight: 100, reps: 8, rpe: 9 }] }]
      }
    ];
    for (const s of sessions) {
      await db.sessions.add(withExerciseIndex(s, ['bench press']));
    }

    const suggestion = await calculateNextSuggestion('bench press');
    expect(suggestion.plateauFlag).toBe(true);
    expect(suggestion.reason).toContain('Plateau detected');
  });
});

describe('Progression volume status', () => {
  it('classifies weekly volume against MEV, MAV, and MRV', () => {
    const caps = { mev: 10, mav: 16, mrv: 22 };

    expect(getVolumeStatus(8, caps)).toBe('under-stimulated');
    expect(getVolumeStatus(12, caps)).toBe('optimal stimulus');
    expect(getVolumeStatus(16, caps)).toBe('near recovery limit');
    expect(getVolumeStatus(23, caps)).toBe('over-reached');
  });
});
