import type { Session } from '../db/models';

export interface WeeklyData {
  week: number;
  totalVolume: number;
  avgWeight: number;
  totalSets: number;
  totalReps: number;
  bestWeight: number;
  percentChange?: number;
}

/**
 * Calculates volume (tonnage) for sessions grouped by programWeek.
 * Volume Formula: Weight * Reps * Sets (summed per exercise session)
 */
export function calculateAnalysisData(sessions: Session[], filterExercise?: string): Map<number, WeeklyData> {
  const weeklyMap = new Map<number, WeeklyData>();

  // Filter sessions that have a programWeek
  const validSessions = sessions.filter(s => s.programWeek !== undefined);

  validSessions.forEach(session => {
    const week = session.programWeek;
    if (week === undefined) return;

    // Filter exercises if specified
    const exercisesToAnalyze = filterExercise
      ? session.exercises.filter(ex => ex.exerciseName.toLowerCase() === filterExercise.toLowerCase())
      : session.exercises;

    if (exercisesToAnalyze.length === 0) return;

    if (!weeklyMap.has(week)) {
      weeklyMap.set(week, {
        week,
        totalVolume: 0,
        avgWeight: 0,
        totalSets: 0,
        totalReps: 0,
        bestWeight: 0
      });
    }

    const data = weeklyMap.get(week);
    if (!data) return;

    exercisesToAnalyze.forEach(ex => {
      ex.sets.forEach(set => {
        const volume = set.weight * set.reps;
        data.totalVolume += volume;
        data.totalSets += 1;
        data.totalReps += set.reps;
        if (set.weight > data.bestWeight) data.bestWeight = set.weight;
      });
    });
  });

  // Second pass: Finalize averages and percentages
  const sortedWeeks = Array.from(weeklyMap.keys()).sort((a, b) => a - b);

  sortedWeeks.forEach((week, index) => {
    const data = weeklyMap.get(week);
    if (!data) return;

    // Calculate Average Weight (Volume / Total Reps)
    if (data.totalReps > 0) {
      data.avgWeight = Math.round(data.totalVolume / data.totalReps);
    }

    // Calculate % change from previous week
    if (index > 0) {
      const prevWeek = sortedWeeks[index - 1];
      const prevData = weeklyMap.get(prevWeek);
      if (prevData && prevData.totalVolume > 0) {
        data.percentChange = Math.round(((data.totalVolume - prevData.totalVolume) / prevData.totalVolume) * 100);
      }
    }
  });

  return weeklyMap;
}

export function getVolumeInsights(weeklyData: WeeklyData[], exerciseName?: string): string {
  if (weeklyData.length < 2) return "Continue logging sessions to unlock progress insights.";

  const last = weeklyData[weeklyData.length - 1];
  const percent = last.percentChange ?? 0;
  const context = exerciseName && exerciseName !== 'All' ? `${exerciseName}` : 'overall';

  if (percent > 20) {
    return `Incredible! Your ${context} volume skyrocketed by ${percent}%. You're hitting a peak stimulus. Ensure recovery is prioritized.`;
  } else if (percent > 5) {
    return `Solid progression. ${context} volume increased by ${percent}%. This is the gold standard for sustainable growth.`;
  } else if (percent >= 0) {
    return `Holding steady. ${context} volume is consistent with last week. Focus on adding one rep per set to unlock more volume.`;
  } else if (percent > -10) {
    return `Deliberate deload? ${context} volume dipped slightly (${Math.abs(percent)}%). This is normal for recovery cycles.`;
  } else if (percent > -25) {
    return `Warning: Significant volume drop in ${context} (${Math.abs(percent)}%). Check if you've missed sessions or if fatigue is accumulating.`;
  } else {
    return `Regression Detected. ${context} volume crashed by ${Math.abs(percent)}%. This often signals extreme fatigue or a major break in consistency.`;
  }
}
