import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../src/db/database';
import type { Exercise, ExerciseSettings, Session, TrainingSession, UserSettings } from '../src/db/models';
import {
  deleteSessionById,
  getSessionsInDateRange,
  getSessionsNewestFirst,
  getSessionsOldestFirst,
  updateSessionProgramWeek,
} from '../src/repositories/sessionRepository';
import {
  createCustomExercise,
  findExerciseByName,
  findExercisesByMovementPattern,
  getAllExercises,
} from '../src/repositories/exerciseLibraryRepository';
import { exportAppData, restoreAppData } from '../src/repositories/appDataRepository';

describe('repository layer', () => {
  beforeEach(async () => {
    await db.sessions.clear();
    await db.exerciseSettings.clear();
    await db.trainingSessions.clear();
    await db.userSettings.clear();
    await db.exerciseLibrary.clear();
  });

  it('returns sessions in newest-first and oldest-first order', async () => {
    const sessions: Session[] = [
      { date: '2024-01-02T10:00:00Z', soreness: 2, exercises: [] },
      { date: '2024-01-01T10:00:00Z', soreness: 2, exercises: [] },
      { date: '2024-01-03T10:00:00Z', soreness: 2, exercises: [] },
    ];

    for (const session of sessions) {
      await db.sessions.add(session as Session);
    }

    expect((await getSessionsNewestFirst()).map((session) => session.date)).toEqual([
      '2024-01-03T10:00:00Z',
      '2024-01-02T10:00:00Z',
      '2024-01-01T10:00:00Z',
    ]);

    expect((await getSessionsOldestFirst()).map((session) => session.date)).toEqual([
      '2024-01-01T10:00:00Z',
      '2024-01-02T10:00:00Z',
      '2024-01-03T10:00:00Z',
    ]);
  });

  it('filters sessions by date range and updates/deletes sessions', async () => {
    const sessionIds = await Promise.all([
      db.sessions.add({ date: '2024-01-01T10:00:00Z', soreness: 2, exercises: [] } as Session),
      db.sessions.add({ date: '2024-01-05T10:00:00Z', soreness: 2, exercises: [] } as Session),
      db.sessions.add({ date: '2024-01-10T10:00:00Z', soreness: 2, exercises: [] } as Session),
    ]);

    const ranged = await getSessionsInDateRange('2024-01-02T00:00:00Z', '2024-01-10T00:00:00Z');
    expect(ranged.map((session) => session.date)).toEqual(['2024-01-05T10:00:00Z']);

    await updateSessionProgramWeek(sessionIds[1] as number, 4);
    expect((await db.sessions.get(sessionIds[1]))?.programWeek).toBe(4);

    await deleteSessionById(sessionIds[0] as number);
    expect(await db.sessions.count()).toBe(2);
  });

  it('creates and queries exercises through the exercise library repository', async () => {
    const exercises: Exercise[] = [
      {
        name: 'Barbell Bench Press',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps'],
        category: 'Barbell',
        movementPattern: 'Push',
        difficulty: 'Intermediate',
        isCustom: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        name: 'Machine Chest Press',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps'],
        category: 'Machine',
        movementPattern: 'Push',
        difficulty: 'Beginner',
        isCustom: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    for (const exercise of exercises) {
      await db.exerciseLibrary.add(exercise);
    }

    const created = await createCustomExercise({
      name: 'Custom Push-Up',
      primaryMuscles: ['chest'],
      secondaryMuscles: ['triceps'],
      category: 'Bodyweight',
      movementPattern: 'Push',
      difficulty: 'Beginner',
      isCustom: true,
      createdAt: '2024-01-02T00:00:00Z',
    });

    expect(created?.name).toBe('Custom Push-Up');
    expect((await getAllExercises()).map((exercise) => exercise.name)).toContain('Custom Push-Up');
    expect((await findExerciseByName('barbell bench press'))?.name).toBe('Barbell Bench Press');

    const pushMatches = await findExercisesByMovementPattern('Push', 'Barbell Bench Press', 2);
    expect(pushMatches).toHaveLength(2);
    expect(pushMatches.some((exercise) => exercise.name === 'Barbell Bench Press')).toBe(false);
  });

  it('exports and restores app data as a snapshot', async () => {
    const session: Session = {
      id: 1,
      date: '2024-01-01T10:00:00Z',
      soreness: 3,
      exercises: [{ exerciseName: 'bench press', sets: [{ weight: 100, reps: 8, rpe: 7 }] }],
      exerciseNames: ['bench press'],
      programWeek: 1,
    };
    const setting: ExerciseSettings = { exerciseName: 'bench press', minReps: 6, maxReps: 10, weightIncrement: 5 };
    const training: TrainingSession = {
      id: 1,
      name: 'Push Day',
      exercises: [{ exerciseName: 'bench press', targetSets: 3, targetRepsRange: [6, 10] }],
    };
    const library: Exercise = {
      id: 'bench',
      name: 'Bench Press',
      primaryMuscles: ['chest'],
      secondaryMuscles: ['triceps'],
      category: 'Barbell',
      movementPattern: 'Push',
      difficulty: 'Intermediate',
      isCustom: false,
      createdAt: '2024-01-01T00:00:00Z',
    };
    const userSettings: UserSettings = {
      id: 'global',
      experienceLevel: 'intermediate',
      unit: 'lbs',
      currentProgramWeek: 2,
      lastUsedWeek: 2,
      deloadFrequency: 6,
    };

    await db.sessions.put(session);
    await db.exerciseSettings.put(setting);
    await db.trainingSessions.put(training);
    await db.exerciseLibrary.put(library);
    await db.userSettings.put(userSettings);

    const backup = await exportAppData();
    expect(backup.sessions).toHaveLength(1);
    expect(backup.library[0].name).toBe('Bench Press');

    await db.sessions.put({
      id: 99,
      date: '2024-02-01T10:00:00Z',
      soreness: 1,
      exercises: [],
      exerciseNames: [],
    });

    await restoreAppData({
      sessions: backup.sessions,
      settings: backup.settings,
      training: backup.training,
      library: backup.library,
      userSettings: backup.userSettings,
    });

    expect(await db.sessions.count()).toBe(1);
    expect((await db.sessions.toArray())[0].id).toBe(1);
    expect((await db.exerciseLibrary.toArray())[0].name).toBe('Bench Press');
  });
});
