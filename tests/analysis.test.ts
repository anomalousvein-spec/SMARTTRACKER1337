import { describe, it, expect } from 'vitest';
import { calculateAnalysisData, getVolumeInsights, WeeklyData } from '../src/utils/analysis';
import { Session } from '../src/db/models';

describe('Analysis Logic', () => {
  const mockSessions: Session[] = [
    {
      id: 1,
      date: '2024-01-01T10:00:00Z',
      programWeek: 1,
      soreness: 2,
      exercises: [
        {
          exerciseName: 'bench press',
          sets: [{ weight: 100, reps: 10, rpe: 7 }] // Volume: 1000
        }
      ]
    },
    {
      id: 2,
      date: '2024-01-08T10:00:00Z',
      programWeek: 2,
      soreness: 2,
      exercises: [
        {
          exerciseName: 'bench press',
          sets: [{ weight: 110, reps: 10, rpe: 8 }] // Volume: 1100 (+10%)
        }
      ]
    }
  ];

  it('calculates tonnage volume correctly', () => {
    const data = calculateAnalysisData(mockSessions);
    const week1 = data.get(1);
    const week2 = data.get(2);

    expect(week1?.totalVolume).toBe(1000);
    expect(week2?.totalVolume).toBe(1100);
  });

  it('calculates week-over-week percentage change', () => {
    const data = calculateAnalysisData(mockSessions);
    const week2 = data.get(2);
    expect(week2?.percentChange).toBe(10);
  });

  it('filters analysis by exercise name', () => {
    const sessionsWithMultiEx: Session[] = [
      ...mockSessions,
      {
        id: 3,
        date: '2024-01-15T10:00:00Z',
        programWeek: 3,
        soreness: 2,
        exercises: [
          { exerciseName: 'bench press', sets: [{ weight: 120, reps: 10, rpe: 8 }] }, // 1200
          { exerciseName: 'squat', sets: [{ weight: 200, reps: 10, rpe: 8 }] }
        ]
      }
    ];

    const benchData = calculateAnalysisData(sessionsWithMultiEx, 'bench press');
    const week3 = benchData.get(3);
    expect(week3?.totalVolume).toBe(1200);
  });

  it('generates correct natural language insights', () => {
    const weeklyData: WeeklyData[] = [
      { week: 1, totalVolume: 1000, avgWeight: 100, totalSets: 1, totalReps: 10, bestWeight: 100 },
      { week: 2, totalVolume: 1300, avgWeight: 110, totalSets: 1, totalReps: 12, bestWeight: 110, percentChange: 30 }
    ];

    const insight = getVolumeInsights(weeklyData, 'bench press');
    expect(insight).toContain('skyrocketed by 30%');
    expect(insight).toContain('bench press');
  });

  it('detects severe regression in insights', () => {
    const weeklyData: WeeklyData[] = [
      { week: 1, totalVolume: 1000, avgWeight: 100, totalSets: 1, totalReps: 10, bestWeight: 100 },
      { week: 2, totalVolume: 700, avgWeight: 90, totalSets: 1, totalReps: 8, bestWeight: 90, percentChange: -30 }
    ];

    const insight = getVolumeInsights(weeklyData);
    expect(insight).toContain('Regression Detected');
  });
});
