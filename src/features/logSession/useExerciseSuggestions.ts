import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { ExerciseSession } from '../../db/models';
import { calculateNextSuggestion, type Suggestion } from '../../progression/engine';

export function getTrackedExerciseNames(exercises: ExerciseSession[]) {
  const seenNames = new Set<string>();

  return exercises
    .map((exercise) => exercise.exerciseName.toLowerCase().trim())
    .filter((exerciseName) => {
      if (exerciseName.length === 0 || seenNames.has(exerciseName)) {
        return false;
      }

      seenNames.add(exerciseName);
      return true;
    });
}

export function useExerciseSuggestions(
  exercises: ExerciseSession[],
  readiness: {
    sleep: number;
    energy: number;
    soreness: number;
    bodyStatus: 'fresh' | 'normal_soreness' | 'pain_or_strain';
    goal: 'push' | 'standard' | 'light';
    timeAvailable: 'short' | 'normal' | 'long';
  },
  programWeek: number
) {
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});
  const debounceTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const exerciseNames = useMemo(() => getTrackedExerciseNames(exercises), [exercises]);
  const deferredExerciseNames = useDeferredValue(exerciseNames);
  const exerciseNameSignature = deferredExerciseNames.join('|');

  useEffect(() => {
    const updateSuggestion = async (exerciseName: string) => {
      const suggestion = await calculateNextSuggestion(exerciseName, programWeek, readiness);
      setSuggestions((previous) => ({ ...previous, [exerciseName]: suggestion }));
    };

    const activeNames = new Set(deferredExerciseNames);

    Object.keys(debounceTimer.current).forEach((exerciseName) => {
      if (!activeNames.has(exerciseName)) {
        clearTimeout(debounceTimer.current[exerciseName]);
        delete debounceTimer.current[exerciseName];
      }
    });

    deferredExerciseNames.forEach((exerciseName) => {
      if (debounceTimer.current[exerciseName]) {
        clearTimeout(debounceTimer.current[exerciseName]);
      }

      debounceTimer.current[exerciseName] = setTimeout(() => {
        updateSuggestion(exerciseName);
      }, 500);
    });

    return () => {
      Object.values(debounceTimer.current).forEach((timer) => clearTimeout(timer));
    };
  }, [
    exerciseNameSignature,
    deferredExerciseNames,
    programWeek,
    readiness.sleep,
    readiness.energy,
    readiness.soreness,
    readiness.bodyStatus,
    readiness.goal,
    readiness.timeAvailable,
  ]);

  return suggestions;
}
