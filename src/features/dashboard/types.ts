import type { Suggestion } from '../../progression/engine';
import type { TrainingSession, Session, UserSettings } from '../../db/models';
import type { WeeklyData } from '../../utils/analysis';
import type { CoachFocus } from './coachFocus';

export type DashboardLevel = 'Beginner' | 'Intermediate' | 'Pro' | 'Elite';

export interface ExerciseSuggestion extends Suggestion {
  exerciseName: string;
  weeklyHistory: WeeklyData[];
}

export interface DashboardViewModel {
  suggestions: ExerciseSuggestion[];
  coachFocus: CoachFocus;
  trainingSessions: TrainingSession[];
  globalWeeklyData: WeeklyData[];
  globalInsight: string;
  loading: boolean;
  streak: number;
  userLevel: DashboardLevel;
  unit: UserSettings['unit'];
}

export type DashboardSession = Session;
