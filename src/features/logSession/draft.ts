import type { ExerciseSession } from '../../db/models';
import type { PrefillExercise, WorkoutDraft } from './types';

export const WORKOUT_DRAFT_KEY = 'workout_draft';

export function readWorkoutDraft(): WorkoutDraft | null {
  try {
    const draft = localStorage.getItem(WORKOUT_DRAFT_KEY);
    if (!draft) return null;
    return JSON.parse(draft) as WorkoutDraft;
  } catch (error) {
    console.error('Failed to parse workout draft', error);
    return null;
  }
}

export function writeWorkoutDraft(draft: WorkoutDraft) {
  localStorage.setItem(WORKOUT_DRAFT_KEY, JSON.stringify(draft));
}

export function clearWorkoutDraft() {
  localStorage.removeItem(WORKOUT_DRAFT_KEY);
}

export function formatDraftTimestamp(timestamp?: number) {
  if (!timestamp) return null;

  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function createExercisesFromPrefill(prefill: PrefillExercise | PrefillExercise[]): ExerciseSession[] {
  const items = Array.isArray(prefill) ? prefill : [prefill];
  return items.map((item) => ({
    exerciseId: item.exerciseId,
    exerciseName: item.exerciseName,
    sets: Array.from({ length: item.suggestedSets || 3 }, () => ({
      weight: item.suggestedWeight || 0,
      reps: item.suggestedReps || 8,
      rpe: 8,
    })),
  }));
}

export function getInitialExercises(prefill?: PrefillExercise | PrefillExercise[]): ExerciseSession[] {
  if (prefill) return createExercisesFromPrefill(prefill);
  return readWorkoutDraft()?.exercises ?? [];
}

export function getInitialSoreness(hasPrefill: boolean): number {
  if (hasPrefill) return 3;
  const draft = readWorkoutDraft();
  if (!draft?.preSessionCheckIn) return 3;

  return draft.preSessionCheckIn.bodyStatus === 'fresh'
    ? 2
    : draft.preSessionCheckIn.bodyStatus === 'pain_or_strain'
      ? 8
      : 5;
}

export function getInitialNotes(prefillNote?: string, hasPrefill: boolean = false): string {
  if (prefillNote) return prefillNote;
  if (hasPrefill) return '';
  return readWorkoutDraft()?.notes ?? '';
}
