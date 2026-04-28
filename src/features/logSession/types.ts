import type { ExerciseSession, PostSessionDebrief, PreSessionCheckIn } from '../../db/models';

export interface PrefillExercise {
  exerciseId?: string;
  exerciseName: string;
  suggestedSets: number;
  suggestedWeight: number;
  suggestedReps: number;
  note?: string;
}

export interface WorkoutSetUI {
  weight: string;
  reps: string;
  rpe: string;
}

export interface ExerciseSessionUI {
  exerciseId?: string;
  exerciseName: string;
  sets: WorkoutSetUI[];
}

export interface WorkoutDraft {
  exercises: ExerciseSession[];
  preSessionCheckIn?: PreSessionCheckIn;
  postSessionDebrief?: PostSessionDebrief;
  notes?: string;
  programWeek?: number;
  timestamp?: number;
}

export interface WorkoutDraftUI {
  exercises: ExerciseSessionUI[];
  preSessionCheckIn?: PreSessionCheckIn;
  postSessionDebrief?: PostSessionDebrief;
  notes?: string;
  programWeek?: number;
  timestamp?: number;
}
