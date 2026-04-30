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
  "barbell bench press": ["dumbbell bench press", "machine chest press", "hammer strength chest press", "pec deck"],
  "dumbbell bench press": ["barbell bench press", "machine chest press", "pec deck"],
  "incline dumbbell press": ["incline smith machine press", "dumbbell bench press"],
  "barbell squat": ["smith machine squat", "leg press", "hack squat", "goblet squat"],
  "lat pulldown": ["v-bar pulldown", "single arm lat pulldown", "pull up"],
  "dumbbell row": ["barbell row", "machine row", "chest supported row", "seated cable row"],
  "overhead press": ["dumbbell shoulder press", "smith machine shoulder press", "machine shoulder press"],
  "lateral raise": ["cable lateral raise", "machine lateral raise"],
  "leg curl": ["seated leg curl", "lying leg curl"],
  "bicep curl": ["barbell curl", "cable bicep curl", "hammer curl"],
  "tricep extension": ["cable tricep pushdown (rope)", "cable tricep pushdown (bar)", "cable overhead extension"],
};
