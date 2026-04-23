import { db } from '../db/database';
import type { Session } from '../db/models';
import { GLOBAL_USER_SETTINGS_ID } from '../utils/userSettings';
import { getUserSettings } from '../progression/settings';
import { rebuildCoachStateFromHistory, updateCoachStateFromSession } from './coachStateRepository';

function normalizeExerciseName(exerciseName: string) {
  return exerciseName.toLowerCase().trim();
}

export async function getSessionsNewestFirst(): Promise<Session[]> {
  return db.sessions.orderBy('date').reverse().toArray();
}

export async function getSessionsOldestFirst(): Promise<Session[]> {
  return db.sessions.orderBy('date').toArray();
}

export async function getSessionsInDateRange(startIso: string, endIso: string): Promise<Session[]> {
  return db.sessions.where('date').between(startIso, endIso, true, false).toArray();
}

export async function getExerciseHistoryByName(exerciseName: string): Promise<Session[]> {
  return db.sessions.where('exerciseNames').equals(normalizeExerciseName(exerciseName)).sortBy('date');
}

export async function deleteSessionById(id: number): Promise<void> {
  await db.sessions.delete(id);
  await rebuildCoachStateFromHistory();
}

export async function updateSessionProgramWeek(id: number, week: number): Promise<void> {
  await db.sessions.update(id, { programWeek: week });
}

export async function saveWorkoutSession(session: Session): Promise<string> {
  const sessionWithIndex: Session = {
    ...session,
    exerciseNames: session.exercises.map((exercise) => normalizeExerciseName(exercise.exerciseName)),
  };
  const id = (await db.sessions.put(sessionWithIndex)) as string;

  await updateCoachStateFromSession(sessionWithIndex);

  if (session.programWeek) {
    const currentSettings = await getUserSettings();
    await db.userSettings.put({
      ...currentSettings,
      id: GLOBAL_USER_SETTINGS_ID,
      lastUsedWeek: session.programWeek,
    });
  }

  return id;
}
