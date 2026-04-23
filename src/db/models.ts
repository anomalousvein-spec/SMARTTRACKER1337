export type ExperienceLevel = 'beginner' | 'novice' | 'intermediate' | 'advanced';

export type CoachRecovery = 'poor' | 'okay' | 'good';
export type CoachEnergy = 'low' | 'medium' | 'high';
export type CoachBodyStatus = 'fresh' | 'normal_soreness' | 'pain_or_strain';
export type CoachGoal = 'push' | 'standard' | 'light';
export type CoachTimeAvailable = 'short' | 'normal' | 'long';
export type CoachSessionDifficulty = 'undershot' | 'on_plan' | 'pushed_hard';
export type CoachPlanFit = 'too_easy' | 'about_right' | 'too_much';
export type CoachBodyResponse = 'felt_good' | 'fatigued' | 'pain_or_strain';
export type CoachConfidenceNextTime = 'progress' | 'repeat' | 'swap';

export interface PreSessionCheckIn {
  recovery: CoachRecovery;
  energy: CoachEnergy;
  bodyStatus: CoachBodyStatus;
  goal: CoachGoal;
  timeAvailable: CoachTimeAvailable;
}

export interface PostSessionDebrief {
  sessionDifficulty: CoachSessionDifficulty;
  planFit: CoachPlanFit;
  bodyResponse: CoachBodyResponse;
  confidenceNextTime: CoachConfidenceNextTime;
}

export interface WorkoutSet {
  weight: number;   // in user's chosen unit (kg or lbs)
  reps: number;
  rpe: number;      // 1-10
}

export interface ExerciseSession {
  exerciseId?: string;   // Reference to Exercise Library
  exerciseName: string;  // normalized, e.g. "bench press"
  sets: WorkoutSet[];
}

export interface Session {
  id?: number;           // Dexie auto-increment
  date: string;         // ISO string
  exercises: ExerciseSession[];
  soreness: number;     // 1-10 (global per session)
  notes?: string;
  sleep?: number;        // hours
  energy?: number;       // 1-10
  preSessionCheckIn?: PreSessionCheckIn;
  postSessionDebrief?: PostSessionDebrief;
  exerciseNames?: string[]; // Internal index field
  programWeek?: number;     // e.g. 1, 2, 3...
}

export interface Exercise {
  id?: string;                    // Dexie auto-increment or UUID
  name: string;                   // e.g. "Barbell Bench Press"
  primaryMuscles: string[];       // e.g. ["chest"]
  secondaryMuscles: string[];     // e.g. ["triceps", "front delts"]
  category: string;               // "Barbell" | "Dumbbell" | "Machine" | "Cable" | "Bodyweight" | "Other"
  movementPattern: string;        // "Push" | "Pull" | "Squat" | "Hinge" | "Carry" | "Core"
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description?: string;           // form cues, setup notes
  isCustom: boolean;              // true for user-created
  isFavorite?: boolean;
  createdAt: string;
}

export interface ExerciseSettings {
  exerciseName: string;
  minReps: number;      // default 6
  maxReps: number;      // default 10
  weightIncrement: number; // 5 for lbs, 2.5 for kg
}

export interface TrainingSessionExercise {
  exerciseId?: string;
  exerciseName: string;
  targetSets: number;
  targetRepsRange: [number, number]; // [min, max]
}

export interface TrainingSession {
  id?: number;
  name: string;
  exercises: TrainingSessionExercise[];
}

export interface UserSettings {
  id: 'global';
  experienceLevel: ExperienceLevel;
  unit: 'lbs' | 'kg';
  currentProgramWeek: number; // The week the user is currently on globally
  lastUsedWeek: number;
  deloadFrequency: 4 | 6 | 8 | "off";       // The week number used in the last session log
}

export interface ExerciseCoachState {
  id: string;                 // "exercise:<normalized exercise name>"
  exerciseName: string;
  confidenceBias: number;     // -2 to +2
  toleranceBias: number;      // -2 to +2
  painPenalty: number;        // 0 to 3
  swapPreference: number;     // 0 to 3
  lastUpdated: string;
}

export interface GlobalCoachState {
  id: 'global';
  recoveryTrend: number;      // -2 to +2
  fatigueTrend: number;       // -2 to +2
  lastUpdated: string;
}
