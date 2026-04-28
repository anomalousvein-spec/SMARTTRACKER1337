import { describe, it, expect } from 'vitest';
import { normalizeExerciseName } from '../src/utils/normalization';

describe('normalizeExerciseName', () => {
  it('should trim whitespace', () => {
    expect(normalizeExerciseName('  bench press  ')).toBe('bench press');
  });

  it('should convert to lowercase', () => {
    expect(normalizeExerciseName('Bench Press')).toBe('bench press');
  });

  it('should handle both trimming and lowercase', () => {
    expect(normalizeExerciseName('  SQUAT  ')).toBe('squat');
  });

  it('should return empty string for empty input', () => {
    expect(normalizeExerciseName('')).toBe('');
  });

  it('should return empty string for whitespace-only input', () => {
    expect(normalizeExerciseName('   ')).toBe('');
  });

  it('should handle mixed casing and extra internal spaces (if any, though we only trim)', () => {
    expect(normalizeExerciseName('  DeadLift  ')).toBe('deadlift');
  });
});
