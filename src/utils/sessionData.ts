import type { ExerciseSession, Session, TrainingSession } from '../db/models';
import { calculateE1RM } from '../progression/engine';
import { calculateAnalysisData, type WeeklyData } from './analysis';
import { formatMonthYear } from './formatters';
import { normalizeExerciseName } from '../utils/normalization';

export interface SessionMonthGroup {
  monthYear: string;
  sessions: Session[];
}

export interface ExerciseHistoryPoint {
  date: string;
  ex: ExerciseSession;
  peakE1RM: number;
  totalVolume: number;
}

export function calculateTrainingStreak(sessions: Session[]) {
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let lastDate = new Date(today);
  lastDate.setDate(lastDate.getDate() + 1);

  for (const session of sessions) {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      continue;
    }

    if (diffDays === 1) {
      currentStreak += 1;
      lastDate = sessionDate;
      continue;
    }

    break;
  }

  return currentStreak;
}

export function deriveDashboardLevel(sessionCount: number) {
  if (sessionCount > 50) return 'Elite';
  if (sessionCount > 25) return 'Pro';
  if (sessionCount > 10) return 'Intermediate';
  return 'Beginner';
}

export function getSuggestedExerciseNames(
  sessions: Session[],
  limit = 3,
  fallback: string[] = ['bench press'],
  currentProgramWeek?: number,
  trainingSessions: TrainingSession[] = []
) {
  const exerciseStats = new Map<string, {
    count: number;
    lastSeen: number;
    displayName: string;
    recentSessionCount: number;
    currentWeekCount: number;
    templateCount: number;
    score: number;
  }>();

  const newestSessionTime = sessions[0] ? new Date(sessions[0].date).getTime() : 0;
  const recentWindowStart = newestSessionTime ? newestSessionTime - (1000 * 60 * 60 * 24 * 14) : 0;

  sessions.forEach((session) => {
    const sessionTime = new Date(session.date).getTime();
    const isInRecentWindow = sessionTime >= recentWindowStart;
    const isCurrentProgramWeek = currentProgramWeek !== undefined && session.programWeek === currentProgramWeek;

    session.exercises.forEach((exercise) => {
      const normalizedName = normalizeExerciseName(exercise.exerciseName);
      const current = exerciseStats.get(normalizedName);
      const scoreDelta =
        (isCurrentProgramWeek ? 100 : 0) +
        (isInRecentWindow ? 10 : 0) +
        1;

      if (current) {
        current.count += 1;
        current.lastSeen = Math.max(current.lastSeen, sessionTime);
        current.recentSessionCount += isInRecentWindow ? 1 : 0;
        current.currentWeekCount += isCurrentProgramWeek ? 1 : 0;
        current.score += scoreDelta;
        return;
      }

      exerciseStats.set(normalizedName, {
        count: 1,
        lastSeen: sessionTime,
        displayName: exercise.exerciseName,
        recentSessionCount: isInRecentWindow ? 1 : 0,
        currentWeekCount: isCurrentProgramWeek ? 1 : 0,
        templateCount: 0,
        score: scoreDelta,
      });
    });
  });

  trainingSessions.forEach((trainingSession) => {
    trainingSession.exercises.forEach((exercise) => {
      const normalizedName = normalizeExerciseName(exercise.exerciseName);
      const current = exerciseStats.get(normalizedName);

      if (current) {
        current.templateCount += 1;
        current.score += 5;
        return;
      }

      exerciseStats.set(normalizedName, {
        count: 0,
        lastSeen: 0,
        displayName: exercise.exerciseName,
        recentSessionCount: 0,
        currentWeekCount: 0,
        templateCount: 1,
        score: 5,
      });
    });
  });

  const rankedExerciseNames = Array.from(exerciseStats.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.currentWeekCount !== a.currentWeekCount) return b.currentWeekCount - a.currentWeekCount;
      if (b.templateCount !== a.templateCount) return b.templateCount - a.templateCount;
      if (b.recentSessionCount !== a.recentSessionCount) return b.recentSessionCount - a.recentSessionCount;
      if (b.lastSeen !== a.lastSeen) return b.lastSeen - a.lastSeen;
      if (b.count !== a.count) return b.count - a.count;
      return a.displayName.localeCompare(b.displayName);
    })
    .map((entry) => entry.displayName);

  return rankedExerciseNames.length > 0 ? rankedExerciseNames.slice(0, limit) : fallback;
}

export function getWeeklyAnalysisSeries(sessions: Session[], filterEx?: string): WeeklyData[] {
  const map = calculateAnalysisData(sessions, filterEx);
  return Array.from(map.values()).sort((a, b) => a.week - b.week);
}

export function groupSessionsByMonth(sessions: Session[]): SessionMonthGroup[] {
  const groups = new Map<string, Session[]>();

  sessions.forEach((session) => {
    const monthYear = formatMonthYear(session.date);

    if (!groups.has(monthYear)) {
      groups.set(monthYear, []);
    }

    const group = groups.get(monthYear);
    if (group) {
      group.push(session);
    }
  });

  return Array.from(groups.entries()).map(([monthYear, monthSessions]) => ({
    monthYear,
    sessions: monthSessions,
  }));
}

export function buildExerciseHistoryPoints(history: Session[], exerciseName: string): ExerciseHistoryPoint[] {
  return history
    .map((session) => {
      const exercise = session.exercises.find(
        (entry) => normalizeExerciseName(entry.exerciseName) === normalizeExerciseName(exerciseName)
      );

      if (!exercise) {
        return null;
      }

      const peakE1RM = Math.max(...exercise.sets.map((set) => calculateE1RM(set.weight, set.reps)), 0);
      const totalVolume = exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);

      return {
        date: session.date,
        ex: exercise,
        peakE1RM,
        totalVolume,
      };
    })
    .filter((entry): entry is ExerciseHistoryPoint => entry !== null);
}

export function estimateProgramWeek(firstDate: string | number | Date, sessionDate: string | number | Date) {
  const firstTimestamp = new Date(firstDate).getTime();
  const sessionTimestamp = new Date(sessionDate).getTime();
  const diffDays = Math.floor((sessionTimestamp - firstTimestamp) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}
