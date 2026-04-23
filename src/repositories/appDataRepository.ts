import { db } from '../db/database';
import type { Exercise, ExerciseSettings, Session, TrainingSession, UserSettings } from '../db/models';

export interface BackupData {
  sessions: Session[];
  settings: ExerciseSettings[];
  training: TrainingSession[];
  library: Exercise[];
  userSettings: UserSettings[];
  exportDate: string;
}

export async function exportAppData(): Promise<BackupData> {
  const [sessions, settings, training, library, userSettings] = await Promise.all([
    db.sessions.toArray(),
    db.exerciseSettings.toArray(),
    db.trainingSessions.toArray(),
    db.exerciseLibrary.toArray(),
    db.userSettings.toArray(),
  ]);

  return {
    sessions,
    settings,
    training,
    library,
    userSettings,
    exportDate: new Date().toISOString(),
  };
}

export async function restoreAppData(data: Partial<BackupData>): Promise<void> {
  await db.transaction(
    'rw',
    [db.sessions, db.exerciseSettings, db.trainingSessions, db.userSettings, db.exerciseLibrary],
    async () => {
      await db.sessions.clear();
      await db.exerciseSettings.clear();
      await db.trainingSessions.clear();
      await db.userSettings.clear();
      await db.exerciseLibrary.clear();

      await db.sessions.bulkPut(data.sessions || []);
      await db.exerciseSettings.bulkPut(data.settings || []);
      await db.trainingSessions.bulkPut(data.training || []);
      await db.userSettings.bulkPut(data.userSettings || []);
      await db.exerciseLibrary.bulkPut(data.library || []);
    }
  );
}
