import { db } from '../db/database';
import type { Exercise } from '../db/models';

export async function getAllExercises(): Promise<Exercise[]> {
  return db.exerciseLibrary.toArray();
}

export async function findExerciseByName(exerciseName: string): Promise<Exercise | undefined> {
  return db.exerciseLibrary.where('name').equalsIgnoreCase(exerciseName).first();
}

export async function exerciseNameExists(exerciseName: string): Promise<boolean> {
  const normalizedName = exerciseName.trim();
  if (!normalizedName) return false;

  const existing = await findExerciseByName(normalizedName);
  return Boolean(existing);
}

export async function findExercisesByMovementPattern(
  pattern: string,
  excludeName?: string,
  limit = 3
): Promise<Exercise[]> {
  return db.exerciseLibrary
    .where('movementPattern')
    .equals(pattern)
    .filter((exercise) => exercise.name.toLowerCase() !== excludeName?.toLowerCase())
    .limit(limit)
    .toArray();
}

export async function findExerciseVariations(
  primaryMuscle: string,
  currentExercise: Exercise,
  limit = 3
): Promise<Exercise[]> {
  const normalizedCurrentName = currentExercise.name.toLowerCase();

  const candidates = await db.exerciseLibrary
    .where('primaryMuscles')
    .equalsIgnoreCase(primaryMuscle)
    .filter((exercise) => exercise.name.toLowerCase() !== normalizedCurrentName)
    .toArray();

  const ranked = candidates.sort((a, b) => {
    const aScore =
      Number(a.category !== currentExercise.category) * 2 +
      Number(a.movementPattern !== currentExercise.movementPattern);
    const bScore =
      Number(b.category !== currentExercise.category) * 2 +
      Number(b.movementPattern !== currentExercise.movementPattern);

    return bScore - aScore;
  });

  return ranked.slice(0, limit);
}

export async function createCustomExercise(exercise: Exercise): Promise<Exercise | undefined> {
  const id = await db.exerciseLibrary.add(exercise);
  return db.exerciseLibrary.get(id);
}
