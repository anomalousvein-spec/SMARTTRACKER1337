import { useEffect, useMemo, useState } from 'react';
import { calculateNextSuggestion } from '../../progression/engine';
import { getUserSettings } from '../../progression/settings';
import { getExerciseHistoryByName } from '../../repositories/sessionRepository';
import type { Session } from '../../db/models';
import type { ExerciseDetailViewModel, ExerciseHistoryEntry } from './types';
import { buildExerciseHistoryPoints } from '../../utils/sessionData';
import { formatMonthDay } from '../../utils/formatters';

function buildChartData(
  relevantExSessions: ExerciseHistoryEntry[],
  unit: ExerciseDetailViewModel['unit'],
  isDarkMode: boolean
): ExerciseDetailViewModel['chartData'] {
  return {
    labels: relevantExSessions.map((session) => formatMonthDay(session.date)),
    datasets: [
      {
        type: 'line',
        label: `Est. 1RM (${unit})`,
        data: relevantExSessions.map((session) => session.peakE1RM),
        borderColor: '#3b82f6',
        borderWidth: 3,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 4,
        tension: 0.4,
        yAxisID: 'y1',
      },
      {
        type: 'bar',
        label: `Total Volume (${unit})`,
        data: relevantExSessions.map((session) => session.totalVolume),
        backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
        borderRadius: 8,
        yAxisID: 'y',
      },
    ],
  };
}

function buildChartOptions(isDarkMode: boolean): ExerciseDetailViewModel['chartOptions'] {
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: false,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: false,
        position: 'right',
      },
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { size: 10, weight: 'bold' } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
        titleColor: isDarkMode ? '#ffffff' : '#0f172a',
        bodyColor: isDarkMode ? '#94a3b8' : '#64748b',
        borderColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 16,
        usePointStyle: true,
      },
    },
  };
}

export function useExerciseDetail(name?: string) {
  const [history, setHistory] = useState<Session[]>([]);
  const [suggestion, setSuggestion] = useState<ExerciseDetailViewModel['suggestion']>(null);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState<ExerciseDetailViewModel['unit']>('lbs');

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      if (!name) {
        if (isActive) {
          setLoading(false);
        }
        return;
      }

      try {
        const [exerciseHistory, nextSuggestion, settings] = await Promise.all([
          getExerciseHistoryByName(name),
          calculateNextSuggestion(name),
          getUserSettings(),
        ]);

        if (!isActive) return;

        setHistory(exerciseHistory);
        setSuggestion(nextSuggestion);
        setUnit(settings.unit);
      } catch (error) {
        console.error('Failed to load exercise detail:', error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isActive = false;
    };
  }, [name]);

  const exerciseName = name ?? '';
  const relevantExSessions = useMemo(
    () => (exerciseName ? buildExerciseHistoryPoints(history, exerciseName) : []),
    [history, exerciseName]
  );
  const bestE1RM = useMemo(
    () => Math.max(...relevantExSessions.map((session) => session.peakE1RM), 0),
    [relevantExSessions]
  );
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const chartData = useMemo(
    () => buildChartData(relevantExSessions, unit, isDarkMode),
    [relevantExSessions, unit, isDarkMode]
  );
  const chartOptions = useMemo(() => buildChartOptions(isDarkMode), [isDarkMode]);

  return {
    exerciseName,
    history,
    relevantExSessions,
    suggestion,
    loading,
    unit,
    bestE1RM,
    chartData,
    chartOptions,
  };
}
