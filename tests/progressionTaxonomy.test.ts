import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../src/db/database';
import type { Exercise, Session } from '../src/db/models';
import { calculateNextSuggestion } from '../src/progression/engine';
import { calculateWeeklyVolume } from '../src/progression/weeklyVolume';
import { getExerciseCoachState, getGlobalCoachState } from '../src/repositories/coachStateRepository';
import { deleteSessionById, saveWorkoutSession } from '../src/repositories/sessionRepository';

function buildSession(date: string, exerciseName: string, setCount: number, weight = 100): Session {
  return {
    date,
    soreness: 2,
    exercises: [
      {
        exerciseName,
        sets: Array.from({ length: setCount }, () => ({ weight, reps: 8, rpe: 7 })),
      },
    ],
  };
}

function daysAgoIso(daysAgo: number) {
  return new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000)).toISOString();
}

describe('progression taxonomy coverage', () => {
  beforeEach(async () => {
    await db.sessions.clear();
    await db.exerciseLibrary.clear();
    await db.exerciseSettings.clear();
    await db.userSettings.clear();
    await db.coachStates.clear();
  });

  it('rolls up weekly volume with primary and secondary weighting from library metadata', async () => {
    const library = [
      {
        name: 'Barbell Squat',
        primaryMuscles: ['quads'],
        secondaryMuscles: ['glutes', 'hamstrings'],
        category: 'Barbell',
        movementPattern: 'Squat',
        difficulty: 'Intermediate',
        isCustom: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        name: 'Hip Thrust',
        primaryMuscles: ['glutes'],
        secondaryMuscles: ['hamstrings'],
        category: 'Barbell',
        movementPattern: 'Hinge',
        difficulty: 'Intermediate',
        isCustom: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ] satisfies Exercise[];

    const libraryMap = new Map(library.map((exercise) => [exercise.name.toLowerCase(), exercise]));

    await db.sessions.bulkAdd([
      {
        date: '2024-01-08T10:00:00Z',
        soreness: 2,
        exercises: [
          { exerciseName: 'Barbell Squat', sets: Array.from({ length: 4 }, () => ({ weight: 225, reps: 5, rpe: 8 })) },
          { exerciseName: 'Hip Thrust', sets: Array.from({ length: 2 }, () => ({ weight: 185, reps: 8, rpe: 7 })) },
        ],
      } satisfies Session,
    ]);

    const now = new Date('2024-01-10T12:00:00Z');
    await expect(calculateWeeklyVolume('quads', now, libraryMap)).resolves.toBe(4);
    await expect(calculateWeeklyVolume('glutes', now, libraryMap)).resolves.toBe(4);
    await expect(calculateWeeklyVolume('hamstrings', now, libraryMap)).resolves.toBe(3);
  });

  it('uses fallback mappings for weighted secondary volume when library metadata is missing', async () => {
    await db.sessions.add({
      date: '2024-01-10T10:00:00Z',
      soreness: 2,
      exercises: [
        { exerciseName: 'Romanian Deadlift', sets: Array.from({ length: 4 }, () => ({ weight: 225, reps: 8, rpe: 8 })) },
      ],
    } satisfies Session);

    const now = new Date('2024-01-10T12:00:00Z');
    await expect(calculateWeeklyVolume('hamstrings', now, new Map())).resolves.toBe(4);
    await expect(calculateWeeklyVolume('glutes', now, new Map())).resolves.toBe(2);
    await expect(calculateWeeklyVolume('back', now, new Map())).resolves.toBe(2);
  });

  it.each([
    ['hip thrust', 15, 'glutes'],
    ['plank', 13, 'core'],
    ['standing calf raise', 17, 'calves'],
  ])('caps weekly volume near MRV for %s', async (exerciseName, existingSets, muscleName) => {
    const session = buildSession(daysAgoIso(1), exerciseName, existingSets, exerciseName === 'plank' ? 0 : 100);
    // Use saveWorkoutSession to ensure exerciseNames index is populated
    await saveWorkoutSession(session);

    const suggestion = await calculateNextSuggestion(exerciseName);

    expect(suggestion.reason).toContain(`Weekly ${muscleName} volume near MRV`);
    expect(suggestion.reason).toContain('capping volume');
    expect(suggestion.projectedWeeklySets).toBeLessThanOrEqual(suggestion.caps.mrv);
  });

  it('rebuilds coach memory correctly after deleting a session', async () => {
    const earlySession: Session = {
      date: '2024-01-01T10:00:00Z',
      soreness: 4,
      exercises: [{ exerciseName: 'Romanian Deadlift', sets: [{ weight: 185, reps: 8, rpe: 8 }] }],
      preSessionCheckIn: {
        recovery: 'poor',
        energy: 'low',
        bodyStatus: 'normal_soreness',
        goal: 'standard',
        timeAvailable: 'normal',
      },
      postSessionDebrief: {
        sessionDifficulty: 'pushed_hard',
        planFit: 'too_much',
        bodyResponse: 'fatigued',
        confidenceNextTime: 'repeat',
      },
    };

    const laterSession: Session = {
      date: '2024-01-03T10:00:00Z',
      soreness: 2,
      exercises: [{ exerciseName: 'Romanian Deadlift', sets: [{ weight: 195, reps: 8, rpe: 7 }] }],
      preSessionCheckIn: {
        recovery: 'good',
        energy: 'high',
        bodyStatus: 'fresh',
        goal: 'push',
        timeAvailable: 'normal',
      },
      postSessionDebrief: {
        sessionDifficulty: 'on_plan',
        planFit: 'too_easy',
        bodyResponse: 'felt_good',
        confidenceNextTime: 'progress',
      },
    };

    const earlyId = Number(await saveWorkoutSession(earlySession));
    await saveWorkoutSession(laterSession);
    await deleteSessionById(earlyId);

    const rebuiltExerciseState = await getExerciseCoachState('Romanian Deadlift');
    const rebuiltGlobalState = await getGlobalCoachState();

    await db.sessions.clear();
    await db.coachStates.clear();
    await saveWorkoutSession(laterSession);

    const expectedExerciseState = await getExerciseCoachState('Romanian Deadlift');
    const expectedGlobalState = await getGlobalCoachState();

    expect(rebuiltExerciseState).toEqual(expectedExerciseState);
    expect(rebuiltGlobalState).toEqual(expectedGlobalState);
  });
});
