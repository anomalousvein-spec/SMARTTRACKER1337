import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { ExerciseSession } from '../../db/models';
import { calculateNextSuggestion, type Suggestion } from '../../progression/engine';
import { normalizeExerciseName } from '../../utils/normalization';

export function getTrackedExerciseNames(exercises: ExerciseSession[]) {
  const seenNames = new Set<string>();

  return exercises
    .map((exercise) => normalizeExerciseName(exercise.exerciseName))
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

      const timerId = setTimeout(() => {
        void (async () => {
          const suggestion = await calculateNextSuggestion(exerciseName, programWeek, readiness);
          setSuggestions((previous) => ({ ...previous, [exerciseName]: suggestion }));
        })();
      }, 500);
      
      debounceTimer.current[exerciseName] = timerId;
    });

    return () => {
      // Cleanup: clear all pending timers on unmount or re-render
      const currentTimers = { ...debounceTimer.current };
      Object.keys(currentTimers).forEach((exerciseName) => {
        if (currentTimers[exerciseName]) {
          clearTimeout(currentTimers[exerciseName]);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- readiness object changes frequently; individual properties are tracked in dependency array
  }, [
    exerciseNameSignature,
    deferredExerciseNames,
    programWeek,
    readiness.bodyStatus,
    readiness.energy,
    readiness.goal,
    readiness.sleep,
    readiness.soreness,
    readiness.timeAvailable,
  ]);

  return suggestions;
}
