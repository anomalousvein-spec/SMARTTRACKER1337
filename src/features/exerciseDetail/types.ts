import type { ChartData, ChartOptions } from 'chart.js';
import type { Session, UserSettings } from '../../db/models';
import type { Suggestion } from '../../progression/engine';
import type { ExerciseHistoryPoint } from '../../utils/sessionData';

export type ExerciseHistoryEntry = ExerciseHistoryPoint;

export interface ExerciseDetailViewModel {
  exerciseName: string;
  history: Session[];
  relevantExSessions: ExerciseHistoryEntry[];
  suggestion: Suggestion | null;
  loading: boolean;
  unit: UserSettings['unit'];
  bestE1RM: number;
  chartData: ChartData<'bar' | 'line'>;
  chartOptions: ChartOptions<'bar' | 'line'>;
}
