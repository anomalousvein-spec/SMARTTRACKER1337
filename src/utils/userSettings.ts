import type { ExperienceLevel, UserSettings } from '../db/models';

export const GLOBAL_USER_SETTINGS_ID: UserSettings['id'] = 'global';

const DEFAULT_EXPERIENCE_LEVEL: ExperienceLevel = 'intermediate';
const DEFAULT_UNIT: UserSettings['unit'] = 'lbs';

function readStorage(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(key);
}

export function getLegacyExperienceLevel(): ExperienceLevel {
  const stored = readStorage('experience_level');
  return isExperienceLevel(stored) ? stored : DEFAULT_EXPERIENCE_LEVEL;
}

export function getLegacyUnit(): UserSettings['unit'] {
  const storedUnit = readStorage('user_unit') ?? readStorage('preferred_unit');
  return storedUnit === 'kg' ? 'kg' : DEFAULT_UNIT;
}

export function createDefaultUserSettings(
  overrides: Partial<Omit<UserSettings, 'id'>> = {}
): UserSettings {
  return {
    id: GLOBAL_USER_SETTINGS_ID,
    experienceLevel: getLegacyExperienceLevel(),
    unit: getLegacyUnit(),
    currentProgramWeek: 1,
    lastUsedWeek: 1,
    deloadFrequency: 6,
    ...overrides,
  };
}

export function persistLegacyUserSettings(settings: Pick<UserSettings, 'experienceLevel' | 'unit'>) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('experience_level', settings.experienceLevel);
  localStorage.setItem('user_unit', settings.unit);
}

function isExperienceLevel(value: string | null): value is ExperienceLevel {
  return value === 'beginner' || value === 'novice' || value === 'intermediate' || value === 'advanced';
}
