import Dexie, { Table } from 'dexie';
import { normalizeExerciseName } from '../utils/normalization';
import {
  Session,
  ExerciseSettings,
  TrainingSession,
  UserSettings,
  Exercise,
  ExerciseSession,
  ExerciseCoachState,
  GlobalCoachState,
} from './models';

export class WorkoutDatabase extends Dexie {
  sessions!: Table<Session>;
  exerciseSettings!: Table<ExerciseSettings>;
  trainingSessions!: Table<TrainingSession>;
  userSettings!: Table<UserSettings>;
  exerciseLibrary!: Table<Exercise>;
  coachStates!: Table<ExerciseCoachState | GlobalCoachState>;

  constructor() {
    super('WorkoutDatabase');

    this.version(1).stores({
      sessions: '++id, date',
      exerciseSettings: 'exerciseName',
    });

    this.version(2)
      .stores({
        sessions: '++id, date, *exerciseNames',
        exerciseSettings: 'exerciseName',
        trainingSessions: '++id, name',
        userSettings: 'id',
        exerciseLibrary: '++id, name, *primaryMuscles, category, movementPattern',
      })
      .upgrade((tx) => {
        // Backfill exerciseNames for existing rows
        return tx
          .table('sessions')
          .toCollection()
          .modify((session) => {
            session.exerciseNames =
              session.exercises?.map((e: ExerciseSession) => normalizeExerciseName(e.exerciseName)) ?? [];
          });
      });

    this.version(3)
      .stores({
        sessions: '++id, date, *exerciseNames, programWeek',
        exerciseSettings: 'exerciseName',
        trainingSessions: '++id, name',
        userSettings: 'id',
        exerciseLibrary: '++id, name, *primaryMuscles, category, movementPattern',
      })
      .upgrade(async (tx) => {
        // Initialize UserSettings if missing global fields
        const settings = await tx.table('userSettings').get('global');
        if (settings && settings.currentProgramWeek === undefined) {
          await tx.table('userSettings').update('global', {
            currentProgramWeek: 1,
            lastUsedWeek: 1,
            deloadFrequency: 6,
          });
        }
      });

    this.version(4).stores({
      sessions: '++id, date, *exerciseNames, programWeek',
      exerciseSettings: 'exerciseName',
      trainingSessions: '++id, name',
      userSettings: 'id',
      exerciseLibrary: '++id, name, *primaryMuscles, category, movementPattern',
    });

    this.version(5).stores({
      sessions: '++id, date, *exerciseNames, programWeek',
      exerciseSettings: 'exerciseName',
      trainingSessions: '++id, name',
      userSettings: 'id',
      exerciseLibrary: '++id, name, *primaryMuscles, category, movementPattern',
      coachStates: 'id, exerciseName',
    });
  }
}

export const db = new WorkoutDatabase();
