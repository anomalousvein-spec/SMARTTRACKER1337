import { useEffect, useState } from 'react';
import { calculateNextSuggestion } from '../../progression/engine';
import { getAllTrainingSessions, getUserSettings } from '../../progression/settings';
import { getVolumeInsights } from '../../utils/analysis';
import {
  calculateTrainingStreak,
  deriveDashboardLevel,
  getSuggestedExerciseNames,
  getWeeklyAnalysisSeries,
} from '../../utils/sessionData';
import { getSessionsNewestFirst } from '../../repositories/sessionRepository';
import type { DashboardLevel, DashboardSession, DashboardViewModel, ExerciseSuggestion } from './types';
import { selectCoachFocus } from './coachFocus';

const DEFAULT_DASHBOARD_STATE: DashboardViewModel = {
  suggestions: [],
  coachFocus: selectCoachFocus([], 'Continue logging sessions to unlock progress insights.'),
  trainingSessions: [],
  globalWeeklyData: [],
  globalInsight: 'Continue logging sessions to unlock progress insights.',
  loading: true,
  streak: 0,
  userLevel: 'Beginner',
  unit: 'lbs',
};

async function buildExerciseSuggestions(
  sessions: DashboardSession[],
  trainingSessions: Awaited<ReturnType<typeof getAllTrainingSessions>>,
  currentProgramWeek?: number
) {
  const namesToQuery = getSuggestedExerciseNames(sessions, 3, ['bench press'], currentProgramWeek, trainingSessions);

  return Promise.all(
    namesToQuery.map(async (name): Promise<ExerciseSuggestion> => {
      const suggestion = await calculateNextSuggestion(name);
      const weeklyHistory = getWeeklyAnalysisSeries(sessions, name).slice(-6);

      return {
        ...suggestion,
        exerciseName: name,
        weeklyHistory,
      };
    })
  );
}

async function loadDashboardViewModel(): Promise<DashboardViewModel> {
  const [sessions, settings, trainingSessions] = await Promise.all([
    getSessionsNewestFirst(),
    getUserSettings(),
    getAllTrainingSessions(),
  ]);

  const globalWeeklyData = getWeeklyAnalysisSeries(sessions);
  const globalInsight = getVolumeInsights(globalWeeklyData);
  const suggestions = await buildExerciseSuggestions(sessions, trainingSessions, settings.currentProgramWeek);

  return {
    suggestions,
    coachFocus: selectCoachFocus(suggestions, globalInsight),
    trainingSessions,
    globalWeeklyData,
    globalInsight,
    loading: false,
    streak: calculateTrainingStreak(sessions),
    userLevel: deriveDashboardLevel(sessions.length) as DashboardLevel,
    unit: settings.unit,
  };
}

export function useDashboardData() {
  const [state, setState] = useState<DashboardViewModel>(DEFAULT_DASHBOARD_STATE);

  useEffect(() => {
    let isActive = true;

    async function load() {
      try {
        const nextState = await loadDashboardViewModel();
        if (isActive) {
          setState(nextState);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        if (isActive) {
          setState((current) => ({ ...current, loading: false }));
        }
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, []);

  return state;
}
