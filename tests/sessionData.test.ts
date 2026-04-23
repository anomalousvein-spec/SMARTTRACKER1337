import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session, TrainingSession } from '../src/db/models';
import {
  buildExerciseHistoryPoints,
  calculateTrainingStreak,
  deriveDashboardLevel,
  estimateProgramWeek,
  getSuggestedExerciseNames,
  getWeeklyAnalysisSeries,
  groupSessionsByMonth,
} from '../src/utils/sessionData';

describe('sessionData utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const sessions: Session[] = [
    {
      id: 1,
      date: '2024-01-15T10:00:00Z',
      soreness: 3,
      programWeek: 3,
      exercises: [
        {
          exerciseName: 'squat',
          sets: [{ weight: 200, reps: 5, rpe: 8 }],
        },
        {
          exerciseName: 'bench press',
          sets: [{ weight: 110, reps: 8, rpe: 7 }],
        },
      ],
    },
    {
      id: 2,
      date: '2024-01-08T10:00:00Z',
      soreness: 2,
      programWeek: 2,
      exercises: [
        {
          exerciseName: 'bench press',
          sets: [{ weight: 105, reps: 8, rpe: 7 }],
        },
      ],
    },
    {
      id: 3,
      date: '2023-12-30T10:00:00Z',
      soreness: 4,
      programWeek: 1,
      exercises: [
        {
          exerciseName: 'deadlift',
          sets: [{ weight: 225, reps: 5, rpe: 8 }],
        },
      ],
    },
  ];

  it('calculates consecutive-day training streak from newest-first sessions', () => {
    const streakSessions: Session[] = [
      { date: '2024-01-10T10:00:00Z', soreness: 2, exercises: [] },
      { date: '2024-01-09T10:00:00Z', soreness: 2, exercises: [] },
      { date: '2024-01-08T10:00:00Z', soreness: 2, exercises: [] },
      { date: '2024-01-06T10:00:00Z', soreness: 2, exercises: [] },
    ];

    const streak = calculateTrainingStreak(streakSessions);
    expect(streak).toBe(3);
  });

  it('ignores multiple sessions on the same day when calculating streaks', () => {
    const streakSessions: Session[] = [
      { date: '2024-01-10T18:00:00Z', soreness: 2, exercises: [] },
      { date: '2024-01-10T08:00:00Z', soreness: 2, exercises: [] },
      { date: '2024-01-09T10:00:00Z', soreness: 2, exercises: [] },
      { date: '2024-01-08T10:00:00Z', soreness: 2, exercises: [] },
    ];

    expect(calculateTrainingStreak(streakSessions)).toBe(3);
  });

  it('derives dashboard level from session count thresholds', () => {
    expect(deriveDashboardLevel(5)).toBe('Beginner');
    expect(deriveDashboardLevel(11)).toBe('Intermediate');
    expect(deriveDashboardLevel(26)).toBe('Pro');
    expect(deriveDashboardLevel(51)).toBe('Elite');
  });

  it('returns relevant suggested exercise names with fallback', () => {
    const trainingSessions: TrainingSession[] = [
      {
        name: 'Current Split',
        exercises: [
          { exerciseName: 'bench press', targetSets: 3, targetRepsRange: [6, 10] },
          { exerciseName: 'pull up', targetSets: 3, targetRepsRange: [6, 10] },
        ],
      },
    ];

    expect(getSuggestedExerciseNames(sessions, 2, ['pull up'], 3, trainingSessions)).toEqual(['bench press', 'squat']);
    expect(getSuggestedExerciseNames([], 3, ['pull up'])).toEqual(['pull up']);
  });

  it('builds a sorted weekly analysis series', () => {
    const weeklyData = getWeeklyAnalysisSeries([...sessions].reverse());
    expect(weeklyData.map((entry) => entry.week)).toEqual([1, 2, 3]);
  });

  it('groups sessions by month/year in encounter order', () => {
    const groups = groupSessionsByMonth(sessions);
    expect(groups).toHaveLength(2);
    expect(groups[0].monthYear).toBe('January 2024');
    expect(groups[0].sessions).toHaveLength(2);
    expect(groups[1].monthYear).toBe('December 2023');
  });

  it('builds exercise history points with peak e1rm and total volume', () => {
    const historyPoints = buildExerciseHistoryPoints(sessions, 'bench press');

    expect(historyPoints).toHaveLength(2);
    expect(historyPoints[0].totalVolume).toBe(880);
    expect(historyPoints[1].totalVolume).toBe(840);
    expect(historyPoints[0].peakE1RM).toBeGreaterThan(historyPoints[0].ex.sets[0].weight);
  });

  it('estimates program week from first session date', () => {
    expect(estimateProgramWeek('2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z')).toBe(1);
    expect(estimateProgramWeek('2024-01-01T00:00:00Z', '2024-01-15T00:00:00Z')).toBe(3);
  });
});
