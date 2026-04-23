import { describe, expect, it } from 'vitest';
import type { ExerciseSession } from '../src/db/models';
import { getTrackedExerciseNames } from '../src/features/logSession/useExerciseSuggestions';

describe('Log Session suggestion tracking', () => {
  it('normalizes names and removes blanks', () => {
    const exercises: ExerciseSession[] = [
      { exerciseName: ' Bench Press ', sets: [{ weight: 135, reps: 5, rpe: 8 }] },
      { exerciseName: '', sets: [{ weight: 0, reps: 0, rpe: 7 }] },
      { exerciseName: 'ROW', sets: [{ weight: 95, reps: 10, rpe: 8 }] },
    ];

    expect(getTrackedExerciseNames(exercises)).toEqual(['bench press', 'row']);
  });

  it('deduplicates repeated exercise names while preserving first-seen order', () => {
    const exercises: ExerciseSession[] = [
      { exerciseName: 'Squat', sets: [{ weight: 225, reps: 5, rpe: 8 }] },
      { exerciseName: ' squat ', sets: [{ weight: 185, reps: 8, rpe: 7 }] },
      { exerciseName: 'Bench Press', sets: [{ weight: 155, reps: 5, rpe: 8 }] },
      { exerciseName: 'bench press', sets: [{ weight: 135, reps: 8, rpe: 7 }] },
      { exerciseName: 'Deadlift', sets: [{ weight: 275, reps: 3, rpe: 8 }] },
    ];

    expect(getTrackedExerciseNames(exercises)).toEqual(['squat', 'bench press', 'deadlift']);
  });
});
