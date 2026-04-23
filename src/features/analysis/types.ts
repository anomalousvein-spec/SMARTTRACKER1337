import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import type { WeeklyData } from '../../utils/analysis';
import type { ExerciseCoachState, GlobalCoachState, Session, UserSettings } from '../../db/models';

export type AnalysisChartData = ChartData<'bar' | 'line'>;
export type AnalysisChartOptions = ChartOptions<'bar' | 'line'>;
export type AnalysisTooltipItem = TooltipItem<'bar' | 'line'>;
export type AnalysisUnit = UserSettings['unit'];

export interface AnalysisViewModel {
  sessions: Session[];
  loading: boolean;
  filterEx: string;
  currentWeek: number;
  unit: AnalysisUnit;
  exerciseNames: string[];
  analysisData: WeeklyData[];
  chartData: AnalysisChartData;
  chartOptions: AnalysisChartOptions;
  insight: string;
  coachStates: ExerciseCoachState[];
  globalCoachState: GlobalCoachState;
  refreshCoachMemory: () => Promise<void>;
}
