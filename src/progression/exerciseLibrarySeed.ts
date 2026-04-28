import { db } from '../db/database';
import type { Exercise } from '../db/models';

let isSeeding = false;

export async function seedExerciseLibrary() {
  if (isSeeding) return;
  isSeeding = true;

  try {
    const defaultExercises: Omit<Exercise, 'id' | 'createdAt'>[] = [
      // Chest
      { name: "Barbell Bench Press", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "shoulders"], category: "Barbell", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Incline Dumbbell Press", primaryMuscles: ["chest"], secondaryMuscles: ["shoulders", "triceps"], category: "Dumbbell", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Machine Chest Press", primaryMuscles: ["chest"], secondaryMuscles: ["triceps"], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Push Up", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "shoulders"], category: "Bodyweight", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Chest Fly", primaryMuscles: ["chest"], secondaryMuscles: ["shoulders"], category: "Dumbbell", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Cable Fly", primaryMuscles: ["chest"], secondaryMuscles: ["shoulders"], category: "Cable", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },

      // Quads
      { name: "Barbell Squat", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "hamstrings"], category: "Barbell", movementPattern: "Squat", difficulty: "Intermediate", isCustom: false },
      { name: "Leg Press", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "hamstrings"], category: "Machine", movementPattern: "Squat", difficulty: "Beginner", isCustom: false },
      { name: "Leg Extension", primaryMuscles: ["quads"], secondaryMuscles: [], category: "Machine", movementPattern: "Squat", difficulty: "Beginner", isCustom: false },
      { name: "Lunges", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "hamstrings"], category: "Dumbbell", movementPattern: "Squat", difficulty: "Beginner", isCustom: false },
      { name: "Hack Squat", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "hamstrings"], category: "Machine", movementPattern: "Squat", difficulty: "Intermediate", isCustom: false },

      // Back
      { name: "Deadlift", primaryMuscles: ["back"], secondaryMuscles: ["hamstrings", "glutes"], category: "Barbell", movementPattern: "Hinge", difficulty: "Advanced", isCustom: false },
      { name: "Barbell Row", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "shoulders"], category: "Barbell", movementPattern: "Pull", difficulty: "Intermediate", isCustom: false },
      { name: "Pull Up", primaryMuscles: ["back"], secondaryMuscles: ["biceps"], category: "Bodyweight", movementPattern: "Pull", difficulty: "Intermediate", isCustom: false },
      { name: "Lat Pulldown", primaryMuscles: ["back"], secondaryMuscles: ["biceps"], category: "Machine", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Seated Cable Row", primaryMuscles: ["back"], secondaryMuscles: ["biceps"], category: "Cable", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Dumbbell Row", primaryMuscles: ["back"], secondaryMuscles: ["biceps"], category: "Dumbbell", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "T-Bar Row", primaryMuscles: ["back"], secondaryMuscles: ["biceps"], category: "Barbell", movementPattern: "Pull", difficulty: "Intermediate", isCustom: false },

      // Shoulders
      { name: "Overhead Press", primaryMuscles: ["shoulders"], secondaryMuscles: ["triceps"], category: "Barbell", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Lateral Raise", primaryMuscles: ["shoulders"], secondaryMuscles: [], category: "Dumbbell", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Machine Shoulder Press", primaryMuscles: ["shoulders"], secondaryMuscles: ["triceps"], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Rear Delt Fly", primaryMuscles: ["shoulders"], secondaryMuscles: [], category: "Dumbbell", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Front Raise", primaryMuscles: ["shoulders"], secondaryMuscles: [], category: "Dumbbell", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Face Pull", primaryMuscles: ["shoulders"], secondaryMuscles: ["back"], category: "Cable", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },

      // Hamstrings
      { name: "Romanian Deadlift", primaryMuscles: ["hamstrings"], secondaryMuscles: ["glutes", "back"], category: "Barbell", movementPattern: "Hinge", difficulty: "Intermediate", isCustom: false },
      { name: "Leg Curl", primaryMuscles: ["hamstrings"], secondaryMuscles: [], category: "Machine", movementPattern: "Hinge", difficulty: "Beginner", isCustom: false },
      { name: "Seated Leg Curl", primaryMuscles: ["hamstrings"], secondaryMuscles: [], category: "Machine", movementPattern: "Hinge", difficulty: "Beginner", isCustom: false },
      { name: "Glute Ham Raise", primaryMuscles: ["hamstrings"], secondaryMuscles: ["glutes"], category: "Other", movementPattern: "Hinge", difficulty: "Advanced", isCustom: false },

      // Biceps
      { name: "Bicep Curl", primaryMuscles: ["biceps"], secondaryMuscles: [], category: "Dumbbell", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Hammer Curl", primaryMuscles: ["biceps"], secondaryMuscles: [], category: "Dumbbell", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Barbell Curl", primaryMuscles: ["biceps"], secondaryMuscles: [], category: "Barbell", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Preacher Curl", primaryMuscles: ["biceps"], secondaryMuscles: [], category: "Machine", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },

      // Triceps
      { name: "Tricep Extension", primaryMuscles: ["triceps"], secondaryMuscles: [], category: "Cable", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Skull Crusher", primaryMuscles: ["triceps"], secondaryMuscles: [], category: "Barbell", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Dips", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "shoulders"], category: "Bodyweight", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Close Grip Bench Press", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "shoulders"], category: "Barbell", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },

      // Core
      { name: "Plank", primaryMuscles: ["core"], secondaryMuscles: [], category: "Bodyweight", movementPattern: "Core", difficulty: "Beginner", isCustom: false },
      { name: "Hanging Leg Raise", primaryMuscles: ["core"], secondaryMuscles: [], category: "Bodyweight", movementPattern: "Core", difficulty: "Intermediate", isCustom: false },
      { name: "Cable Crunch", primaryMuscles: ["core"], secondaryMuscles: [], category: "Cable", movementPattern: "Core", difficulty: "Beginner", isCustom: false },
      { name: "Ab Wheel Rollout", primaryMuscles: ["core"], secondaryMuscles: [], category: "Other", movementPattern: "Core", difficulty: "Advanced", isCustom: false },

      // Calves
      { name: "Standing Calf Raise", primaryMuscles: ["calves"], secondaryMuscles: [], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Seated Calf Raise", primaryMuscles: ["calves"], secondaryMuscles: [], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },

      // Glutes
      { name: "Hip Thrust", primaryMuscles: ["glutes"], secondaryMuscles: ["hamstrings"], category: "Barbell", movementPattern: "Hinge", difficulty: "Intermediate", isCustom: false },
      { name: "Glute Bridge", primaryMuscles: ["glutes"], secondaryMuscles: ["hamstrings"], category: "Bodyweight", movementPattern: "Hinge", difficulty: "Beginner", isCustom: false },
    ];

    const existingExercises = await db.exerciseLibrary.toArray();
    const existingNames = new Set(existingExercises.map(ex => ex.name.toLowerCase()));
    const missingDefaults = defaultExercises
      .filter(ex => !existingNames.has(ex.name.toLowerCase()))
      .map(ex => ({
        ...ex,
        isCustom: false,
        createdAt: new Date().toISOString()
      }));

    if (missingDefaults.length > 0) {
      await db.exerciseLibrary.bulkAdd(missingDefaults);
    }
  } catch (error) {
    console.error("Seed failed", error);
  } finally {
    isSeeding = false;
  }
}
