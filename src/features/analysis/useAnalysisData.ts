import { useEffect, useMemo, useState } from 'react';
import { getUserSettings, updateUserSettings } from '../../progression/settings';
import { getAllExerciseCoachStates, getGlobalCoachState } from '../../repositories/coachStateRepository';
import { getSessionsOldestFirst } from '../../repositories/sessionRepository';
import { getVolumeInsights } from '../../utils/analysis';
import { getWeeklyAnalysisSeries } from '../../utils/sessionData';
import type { AnalysisChartData, AnalysisChartOptions, AnalysisTooltipItem, AnalysisViewModel } from './types';
import type { GlobalCoachState, Session } from '../../db/models';

const DEFAULT_ANALYSIS_STATE: AnalysisViewModel = {
  sessions: [],
  loading: true,
  filterEx: 'All',
  currentWeek: 1,
  unit: 'lbs',
  exerciseNames: ['All'],
  analysisData: [],
  chartData: {
    labels: [],
    datasets: [],
  },
  chartOptions: {},
  insight: 'Continue logging sessions to unlock progress insights.',
  coachStates: [],
  globalCoachState: {
    id: 'global',
    recoveryTrend: 0,
    fatigueTrend: 0,
    lastUpdated: new Date(0).toISOString(),
  },
  refreshCoachMemory: async () => {},
};

function buildAnalysisData(sessions: Session[], filterEx: string) {
  return getWeeklyAnalysisSeries(sessions, filterEx === 'All' ? undefined : filterEx);
}

function buildChartData(analysisData: AnalysisViewModel['analysisData'], currentWeek: number): AnalysisChartData {
  return {
    labels: analysisData.map((entry) => `W${entry.week}`),
    datasets: [
      {
        type: 'bar',
        label: 'Total Volume',
        data: analysisData.map((entry) => entry.totalVolume),
        backgroundColor: analysisData.map((entry) =>
          entry.week === currentWeek ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.4)'
        ),
        borderColor: analysisData.map((entry) =>
          entry.week === currentWeek ? 'rgb(59, 130, 246)' : 'rgba(59, 130, 246, 0.4)'
        ),
        borderWidth: 2,
        borderRadius: 10,
        yAxisID: 'y',
        barThickness: 20,
      },
      {
        type: 'line',
        label: 'Avg Weight',
        data: analysisData.map((entry) => entry.avgWeight),
        borderColor: analysisData.map((entry) =>
          entry.week === currentWeek ? 'rgb(16, 185, 129)' : 'rgba(16, 185, 129, 0.4)'
        ),
        backgroundColor: analysisData.map((entry) =>
          entry.week === currentWeek ? 'rgb(16, 185, 129)' : 'rgba(16, 185, 129, 0.4)'
        ),
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 3,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };
}

function buildChartOptions(
  analysisData: AnalysisViewModel['analysisData'],
  unit: AnalysisViewModel['unit']
): AnalysisChartOptions {
  const maxVolume = Math.max(...analysisData.map((entry) => entry.totalVolume), 100);
  const maxIntensity = Math.max(...analysisData.map((entry) => entry.avgWeight), 100);

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        padding: 16,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 12, weight: 'bold' },
        cornerRadius: 16,
        displayColors: false,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: (context: AnalysisTooltipItem) => {
            const value = context.raw as number;
            const label = context.dataset.label;
            return `${label}: ${value.toLocaleString()}${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { weight: 'bold', size: 10 }, padding: 8 },
      },
      y: {
        display: false,
        suggestedMax: maxVolume * 1.3,
      },
      y1: {
        display: false,
        grid: { drawOnChartArea: false },
        suggestedMin: 0,
        suggestedMax: maxIntensity * 1.1,
      },
    },
  };
}

export function useAnalysisData() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEx, setFilterEx] = useState('All');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [unit, setUnit] = useState<AnalysisViewModel['unit']>('lbs');
  const [coachStates, setCoachStates] = useState<AnalysisViewModel['coachStates']>([]);
  const [globalCoachState, setGlobalCoachState] = useState<GlobalCoachState>(DEFAULT_ANALYSIS_STATE.globalCoachState);

  const refreshCoachMemory = async () => {
    const [nextCoachStates, nextGlobalCoachState] = await Promise.all([
      getAllExerciseCoachStates(),
      getGlobalCoachState(),
    ]);

    setCoachStates(nextCoachStates);
    setGlobalCoachState(nextGlobalCoachState);
  };

  useEffect(() => {
    let isActive = true;

    async function load() {
      try {
        const [sessionData, settings, nextCoachStates, nextGlobalCoachState] = await Promise.all([
          getSessionsOldestFirst(),
          getUserSettings(),
          getAllExerciseCoachStates(),
          getGlobalCoachState(),
        ]);
        if (!isActive) return;

        setSessions(sessionData);
        setCurrentWeek(settings.currentProgramWeek || 1);
        setUnit(settings.unit);
        setCoachStates(nextCoachStates);
        setGlobalCoachState(nextGlobalCoachState);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isActive = false;
    };
  }, []);

  const exerciseNames = useMemo(() => {
    const distinctNames = Array.from(
      new Set(
        sessions.flatMap((session) => session.exercises.map((exercise) => exercise.exerciseName))
      )
    ).sort((a, b) => a.localeCompare(b));

    return ['All', ...distinctNames];
  }, [sessions]);
  const analysisData = useMemo(() => buildAnalysisData(sessions, filterEx), [sessions, filterEx]);
  const chartData = useMemo(() => buildChartData(analysisData, currentWeek), [analysisData, currentWeek]);
  const chartOptions = useMemo(() => buildChartOptions(analysisData, unit), [analysisData, unit]);
  const insight = useMemo(() => getVolumeInsights(analysisData, filterEx), [analysisData, filterEx]);

  const handleWeekChange = async (delta: number) => {
    const nextWeek = Math.max(1, currentWeek + delta);
    setCurrentWeek(nextWeek);
    await updateUserSettings({ currentProgramWeek: nextWeek });
  };

  return {
    ...DEFAULT_ANALYSIS_STATE,
    sessions,
    loading,
    filterEx,
    currentWeek,
    unit,
    exerciseNames,
    analysisData,
    chartData,
    chartOptions,
    insight,
    coachStates,
    globalCoachState,
    refreshCoachMemory,
    setFilterEx,
    handleWeekChange,
  };
}
