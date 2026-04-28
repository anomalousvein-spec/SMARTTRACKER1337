import type { ExperienceLevel } from '../db/models';

export const BASELINE_SETS = 3;
export const BASELINE_REPS = 8;
export const BASELINE_WEIGHT_LBS = 135;
export const BASELINE_WEIGHT_KG = 60;

export const LEVEL_CONFIGS: Record<ExperienceLevel, {
  incrementMult: number;
  setCap: number;
  plateauSessions: number | null;
  volumeEase: number;
  rpeThresholdOffset: number;
}> = {
  beginner: { incrementMult: 1.0, setCap: 5, plateauSessions: null, volumeEase: 1.2, rpeThresholdOffset: -1.0 },
  novice: { incrementMult: 1.0, setCap: 5, plateauSessions: 4, volumeEase: 1.1, rpeThresholdOffset: -0.5 },
  intermediate: { incrementMult: 1.0, setCap: 5, plateauSessions: 3, volumeEase: 1.0, rpeThresholdOffset: 0.0 },
  advanced: { incrementMult: 0.5, setCap: 8, plateauSessions: 3, volumeEase: 0.8, rpeThresholdOffset: 0.5 },
};

export const SWAP_MAPPING: Record<string, string[]> = {
  'bench press': ['machine chest press', 'incline dumbbell press'],
  'squat': ['leg press', 'leg extension'],
  'deadlift': ['seated leg curl', 'back extension'],
  'overhead press': ['lateral raise', 'machine shoulder press'],
  'barbell row': ['seated cable row', 'chest supported row'],
};
