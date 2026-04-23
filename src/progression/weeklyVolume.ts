import { Exercise } from '../db/models';
import { getPrimaryMuscle, getSecondaryMuscles } from './muscleMapping';
import { getAllExercises } from '../repositories/exerciseLibraryRepository';
import { getSessionsInDateRange } from '../repositories/sessionRepository';

export async function calculateWeeklyVolume(
  muscleGroup: string,
  currentDate: Date = new Date(),
  prefetchedLibraryMap?: Map<string, Exercise>
): Promise<number> {
  const oneWeekAgo = new Date(currentDate);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const sessions = await getSessionsInDateRange(oneWeekAgo.toISOString(), currentDate.toISOString());

  let libraryMap = prefetchedLibraryMap;
  if (!libraryMap) {
    const library = await getAllExercises();
    libraryMap = new Map(library.map(ex => [ex.name.toLowerCase(), ex]));
  }

  let total = 0;

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const nameNormalized = ex.exerciseName.toLowerCase();
      const libraryEx = libraryMap.get(nameNormalized);

      if (libraryEx) {
        if (libraryEx.primaryMuscles.includes(muscleGroup)) {
          total += ex.sets.length;
        } else if (libraryEx.secondaryMuscles.includes(muscleGroup)) {
          total += ex.sets.length * 0.5;
        }
      } else {
        // Fallback to static mapping if not in library
        if (getPrimaryMuscle(ex.exerciseName) === muscleGroup) {
          total += ex.sets.length;
        } else if (getSecondaryMuscles(ex.exerciseName).includes(muscleGroup)) {
          total += ex.sets.length * 0.5;
        }
      }
    }
  }

  return Math.round(total * 10) / 10;
}
