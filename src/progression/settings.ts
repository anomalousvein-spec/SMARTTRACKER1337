import { db } from '../db/database';
import { normalizeExerciseName } from '../utils/normalization';
import type { ExerciseSettings, TrainingSession, UserSettings } from '../db/models';
import {
  createDefaultUserSettings,
  getLegacyExperienceLevel,
  getLegacyUnit,
  GLOBAL_USER_SETTINGS_ID,
  persistLegacyUserSettings,
} from '../utils/userSettings';

const DEFAULT_SETTINGS: Omit<ExerciseSettings, 'exerciseName'> = {
  minReps: 6,
  maxReps: 10,
  weightIncrement: 5, // Default lbs
};


export const VOLUME_CAPS_BY_LEVEL = {
  beginner:     { mev: 6,  mav: 8,  mrv: 12 },
  novice:       { mev: 8,  mav: 12, mrv: 16 },
  intermediate: { mev: 10, mav: 16, mrv: 22 },
  advanced:     { mev: 15, mav: 22, mrv: 30 },
} as const;


export const MUSCLE_LANDMARKS = {
  chest:     { mev: 10, mav: 12, mrv: 22 },
  back:      { mev: 10, mav: 14, mrv: 25 },
  quads:     { mev: 8,  mav: 12, mrv: 20 },
  hamstrings:{ mev: 6,  mav: 10, mrv: 20 },
  glutes:    { mev: 0,  mav: 4,  mrv: 16 },
  core:      { mev: 0,  mav: 16, mrv: 25 },
  calves:    { mev: 8,  mav: 12, mrv: 20 },
  triceps:   { mev: 6,  mav: 10, mrv: 18 },
  biceps:    { mev: 8,  mav: 14, mrv: 26 },
  'rear delts': { mev: 8,  mav: 16, mrv: 26 },
  'front delts': { mev: 0,  mav: 6,  mrv: 12 },
  traps:     { mev: 0,  mav: 12, mrv: 26 },
};

export type TrainingLevel = keyof typeof VOLUME_CAPS_BY_LEVEL;

export async function getSettings(exerciseName: string): Promise<ExerciseSettings> {
  try {
    const normalizedName = normalizeExerciseName(exerciseName);
    const settings = await db.exerciseSettings.get(normalizedName);
    if (settings) {
      return settings;
    }
    const userSettings = await getUserSettings();
    const defaultWeightIncrement = userSettings.unit === 'kg' ? 2.5 : 5;
    return {
      exerciseName: normalizedName,
      ...DEFAULT_SETTINGS,
      weightIncrement: defaultWeightIncrement,
    };
  } catch (error) {
    console.error(`Failed to get settings for ${exerciseName}:`, error);
    return {
      exerciseName: normalizeExerciseName(exerciseName),
      ...DEFAULT_SETTINGS,
    };
  }
}

export async function updateExerciseSettings(
  exerciseName: string,
  newSettings: Partial<Omit<ExerciseSettings, 'exerciseName'>>
): Promise<void> {
  try {
    const normalizedName = normalizeExerciseName(exerciseName);
    const current = await getSettings(normalizedName);
    const updated: ExerciseSettings = {
      ...current,
      ...newSettings,
      exerciseName: normalizedName,
    };
    await db.exerciseSettings.put(updated);
  } catch (error) {
    console.error(`Failed to update settings for ${exerciseName}:`, error);
    throw error;
  }
}

// Training Sessions (Splits)
export async function getAllTrainingSessions(): Promise<TrainingSession[]> {
  return db.trainingSessions.toArray();
}

export async function saveTrainingSession(session: TrainingSession): Promise<void> {
  await db.trainingSessions.put(session);
}

export async function deleteTrainingSession(id: number): Promise<void> {
  await db.trainingSessions.delete(id);
}

// Global User Settings
export async function getUserSettings(): Promise<UserSettings> {
  const settings = await db.userSettings.get(GLOBAL_USER_SETTINGS_ID);
  if (settings) return settings;

  const defaults = createDefaultUserSettings();
  await db.userSettings.put(defaults);
  persistLegacyUserSettings(defaults);
  return defaults;
}

export async function getExperienceLevelSetting() {
  try {
    const settings = await db.userSettings.get(GLOBAL_USER_SETTINGS_ID);
    if (settings) return settings.experienceLevel;

    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('experience_level');
      if (stored) {
        const experienceLevel = getLegacyExperienceLevel();
        const unit = getLegacyUnit();
        await db.userSettings.put(createDefaultUserSettings({ experienceLevel, unit }));
        return experienceLevel;
      }
    }
  } catch (error) {
    console.error('getExperienceLevelSetting failed', error);
  }

  return 'intermediate';
}

export async function updateUserSettings(newSettings: Partial<Omit<UserSettings, 'id'>>): Promise<void> {
  const current = await getUserSettings();
  const updated: UserSettings = { ...current, ...newSettings, id: GLOBAL_USER_SETTINGS_ID };
  await db.userSettings.put(updated);
  persistLegacyUserSettings(updated);
}
