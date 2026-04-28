/**
 * Normalizes an exercise name for consistent storage and lookup.
 * Trims whitespace and converts to lowercase.
 */
export function normalizeExerciseName(exerciseName: string): string {
  return exerciseName.toLowerCase().trim();
}
