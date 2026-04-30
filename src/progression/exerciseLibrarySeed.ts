import { db } from '../db/database';
import type { Exercise } from '../db/models';

let isSeeding = false;

export async function seedExerciseLibrary() {
  if (isSeeding) return;
  isSeeding = true;

  try {
    const defaultExercises: Omit<Exercise, 'id' | 'createdAt'>[] = [
      // Chest
      { name: "Barbell Bench Press", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front delts"], category: "Barbell", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Dumbbell Bench Press", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front delts"], category: "Dumbbell", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Incline Dumbbell Press", primaryMuscles: ["chest"], secondaryMuscles: ["front delts", "triceps"], category: "Dumbbell", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Incline Smith Machine Press", primaryMuscles: ["chest"], secondaryMuscles: ["front delts", "triceps"], category: "Machine", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Flat Smith Machine Press", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front delts"], category: "Machine", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Machine Chest Press", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front delts"], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Push Up", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front delts"], category: "Bodyweight", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Chest Fly", primaryMuscles: ["chest"], secondaryMuscles: ["front delts"], category: "Dumbbell", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Cable Fly", primaryMuscles: ["chest"], secondaryMuscles: ["front delts"], category: "Cable", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Assisted Dip", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front delts"], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Pec Deck", primaryMuscles: ["chest"], secondaryMuscles: ["front delts"], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Hammer Strength Chest Press", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front delts"], category: "Machine", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Dumbbell Incline Fly", primaryMuscles: ["chest"], secondaryMuscles: ["front delts"], category: "Dumbbell", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Smith Machine Decline Press", primaryMuscles: ["chest"], secondaryMuscles: ["triceps", "front delts"], category: "Machine", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },

      // Quads
      { name: "Barbell Squat", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "hamstrings", "core"], category: "Barbell", movementPattern: "Squat", difficulty: "Intermediate", isCustom: false },
      { name: "Smith Machine Squat", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "hamstrings"], category: "Machine", movementPattern: "Squat", difficulty: "Intermediate", isCustom: false },
      { name: "Leg Press", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "hamstrings"], category: "Machine", movementPattern: "Squat", difficulty: "Beginner", isCustom: false },
      { name: "Leg Extension", primaryMuscles: ["quads"], secondaryMuscles: [], category: "Machine", movementPattern: "Squat", difficulty: "Beginner", isCustom: false },
      { name: "Lunges", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "hamstrings"], category: "Dumbbell", movementPattern: "Squat", difficulty: "Beginner", isCustom: false },
      { name: "Hack Squat", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "hamstrings"], category: "Machine", movementPattern: "Squat", difficulty: "Intermediate", isCustom: false },
      { name: "Dumbbell Bulgarian Split Squat", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "hamstrings"], category: "Dumbbell", movementPattern: "Squat", difficulty: "Intermediate", isCustom: false },
      { name: "Smith Machine Bulgarian Split Squat", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "hamstrings"], category: "Machine", movementPattern: "Squat", difficulty: "Intermediate", isCustom: false },
      { name: "Goblet Squat", primaryMuscles: ["quads"], secondaryMuscles: ["glutes", "hamstrings", "core"], category: "Dumbbell", movementPattern: "Squat", difficulty: "Beginner", isCustom: false },
      { name: "Adductor Machine", primaryMuscles: ["quads"], secondaryMuscles: [], category: "Machine", movementPattern: "Squat", difficulty: "Beginner", isCustom: false },

      // Back
      { name: "Deadlift", primaryMuscles: ["back"], secondaryMuscles: ["hamstrings", "glutes", "core", "traps"], category: "Barbell", movementPattern: "Hinge", difficulty: "Advanced", isCustom: false },
      { name: "Barbell Row", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "rear delts", "traps"], category: "Barbell", movementPattern: "Pull", difficulty: "Intermediate", isCustom: false },
      { name: "Machine Row", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "rear delts"], category: "Machine", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Pull Up", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "rear delts"], category: "Bodyweight", movementPattern: "Pull", difficulty: "Intermediate", isCustom: false },
      { name: "Assisted Pull-up", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "rear delts"], category: "Machine", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Lat Pulldown", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "rear delts"], category: "Machine", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Lat Pulldown (Machine)", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "rear delts"], category: "Machine", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Seated Cable Row", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "rear delts"], category: "Cable", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Dumbbell Row", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "rear delts"], category: "Dumbbell", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "T-Bar Row", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "rear delts", "traps"], category: "Barbell", movementPattern: "Pull", difficulty: "Intermediate", isCustom: false },
      { name: "Dumbbell Pullover", primaryMuscles: ["back"], secondaryMuscles: ["chest", "triceps"], category: "Dumbbell", movementPattern: "Pull", difficulty: "Intermediate", isCustom: false },
      { name: "Back Extension (Machine)", primaryMuscles: ["back"], secondaryMuscles: ["hamstrings", "glutes"], category: "Machine", movementPattern: "Hinge", difficulty: "Beginner", isCustom: false },
      { name: "V-Bar Pulldown", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "rear delts"], category: "Machine", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Single Arm Lat Pulldown", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "rear delts"], category: "Cable", movementPattern: "Pull", difficulty: "Intermediate", isCustom: false },
      { name: "Chest Supported Row", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "rear delts"], category: "Machine", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Cable Straight Arm Pulldown", primaryMuscles: ["back"], secondaryMuscles: ["triceps", "rear delts"], category: "Cable", movementPattern: "Pull", difficulty: "Intermediate", isCustom: false },

      // Shoulders
      { name: "Overhead Press", primaryMuscles: ["front delts"], secondaryMuscles: ["triceps", "traps"], category: "Barbell", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Machine Shoulder Press", primaryMuscles: ["front delts"], secondaryMuscles: ["triceps"], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Front Raise", primaryMuscles: ["front delts"], secondaryMuscles: [], category: "Dumbbell", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Lateral Raise", primaryMuscles: ["shoulders"], secondaryMuscles: ["front delts"], category: "Dumbbell", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Cable Lateral Raise", primaryMuscles: ["shoulders"], secondaryMuscles: ["front delts"], category: "Cable", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Cable Upright Row", primaryMuscles: ["shoulders"], secondaryMuscles: ["traps", "biceps"], category: "Cable", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Rear Delt Fly", primaryMuscles: ["rear delts"], secondaryMuscles: ["shoulders", "traps"], category: "Dumbbell", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Cable Reverse Fly", primaryMuscles: ["rear delts"], secondaryMuscles: ["shoulders", "traps"], category: "Cable", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Face Pull", primaryMuscles: ["rear delts"], secondaryMuscles: ["shoulders", "traps"], category: "Cable", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Cable Face Pull", primaryMuscles: ["rear delts"], secondaryMuscles: ["shoulders", "traps"], category: "Cable", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Dumbbell Shoulder Press", primaryMuscles: ["front delts"], secondaryMuscles: ["triceps"], category: "Dumbbell", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Smith Machine Shoulder Press", primaryMuscles: ["front delts"], secondaryMuscles: ["triceps"], category: "Machine", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Machine Lateral Raise", primaryMuscles: ["shoulders"], secondaryMuscles: ["front delts"], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Dumbbell Shrug", primaryMuscles: ["traps"], secondaryMuscles: ["back"], category: "Dumbbell", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Cable Shrug", primaryMuscles: ["traps"], secondaryMuscles: ["back"], category: "Cable", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },

      // Hamstrings
      { name: "Romanian Deadlift", primaryMuscles: ["hamstrings"], secondaryMuscles: ["glutes", "back", "core"], category: "Barbell", movementPattern: "Hinge", difficulty: "Intermediate", isCustom: false },
      { name: "Dumbbell Romanian Deadlift", primaryMuscles: ["hamstrings"], secondaryMuscles: ["glutes", "back", "core"], category: "Dumbbell", movementPattern: "Hinge", difficulty: "Beginner", isCustom: false },
      { name: "Smith Machine Good Morning", primaryMuscles: ["hamstrings"], secondaryMuscles: ["back", "glutes", "core"], category: "Machine", movementPattern: "Hinge", difficulty: "Intermediate", isCustom: false },
      { name: "Leg Curl", primaryMuscles: ["hamstrings"], secondaryMuscles: [], category: "Machine", movementPattern: "Hinge", difficulty: "Beginner", isCustom: false },
      { name: "Seated Leg Curl", primaryMuscles: ["hamstrings"], secondaryMuscles: [], category: "Machine", movementPattern: "Hinge", difficulty: "Beginner", isCustom: false },
      { name: "Glute Ham Raise", primaryMuscles: ["hamstrings"], secondaryMuscles: ["glutes"], category: "Other", movementPattern: "Hinge", difficulty: "Advanced", isCustom: false },
      { name: "Lying Leg Curl", primaryMuscles: ["hamstrings"], secondaryMuscles: [], category: "Machine", movementPattern: "Hinge", difficulty: "Beginner", isCustom: false },

      // Biceps
      { name: "Bicep Curl", primaryMuscles: ["biceps"], secondaryMuscles: [], category: "Dumbbell", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Dumbbell Curl (Flat Bench)", primaryMuscles: ["biceps"], secondaryMuscles: [], category: "Dumbbell", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Hammer Curl", primaryMuscles: ["biceps"], secondaryMuscles: [], category: "Dumbbell", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Barbell Curl", primaryMuscles: ["biceps"], secondaryMuscles: [], category: "Barbell", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Preacher Curl", primaryMuscles: ["biceps"], secondaryMuscles: [], category: "Machine", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Cable Bicep Curl", primaryMuscles: ["biceps"], secondaryMuscles: [], category: "Cable", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Cable Hammer Curl", primaryMuscles: ["biceps"], secondaryMuscles: [], category: "Cable", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },
      { name: "Incline Dumbbell Curl", primaryMuscles: ["biceps"], secondaryMuscles: [], category: "Dumbbell", movementPattern: "Pull", difficulty: "Intermediate", isCustom: false },
      { name: "Concentration Curl", primaryMuscles: ["biceps"], secondaryMuscles: [], category: "Dumbbell", movementPattern: "Pull", difficulty: "Beginner", isCustom: false },

      // Triceps
      { name: "Tricep Extension", primaryMuscles: ["triceps"], secondaryMuscles: [], category: "Cable", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Tricep Extension Machine", primaryMuscles: ["triceps"], secondaryMuscles: [], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Skull Crusher", primaryMuscles: ["triceps"], secondaryMuscles: [], category: "Barbell", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Smith Machine Skullcrusher", primaryMuscles: ["triceps"], secondaryMuscles: [], category: "Machine", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Dips", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "front delts"], category: "Bodyweight", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Tricep Dip Machine", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "front delts"], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Close Grip Bench Press", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "front delts"], category: "Barbell", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Cable Tricep Pushdown (Rope)", primaryMuscles: ["triceps"], secondaryMuscles: [], category: "Cable", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Cable Tricep Pushdown (Bar)", primaryMuscles: ["triceps"], secondaryMuscles: [], category: "Cable", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Cable Overhead Extension", primaryMuscles: ["triceps"], secondaryMuscles: [], category: "Cable", movementPattern: "Push", difficulty: "Intermediate", isCustom: false },
      { name: "Dumbbell Kickback", primaryMuscles: ["triceps"], secondaryMuscles: [], category: "Dumbbell", movementPattern: "Push", difficulty: "Beginner", isCustom: false },

      // Core
      { name: "Plank", primaryMuscles: ["core"], secondaryMuscles: [], category: "Bodyweight", movementPattern: "Core", difficulty: "Beginner", isCustom: false },
      { name: "Hanging Leg Raise", primaryMuscles: ["core"], secondaryMuscles: [], category: "Bodyweight", movementPattern: "Core", difficulty: "Intermediate", isCustom: false },
      { name: "Captain’s Chair Leg Raise", primaryMuscles: ["core"], secondaryMuscles: [], category: "Bodyweight", movementPattern: "Core", difficulty: "Intermediate", isCustom: false },
      { name: "Cable Crunch", primaryMuscles: ["core"], secondaryMuscles: [], category: "Cable", movementPattern: "Core", difficulty: "Beginner", isCustom: false },
      { name: "Ab Wheel Rollout", primaryMuscles: ["core"], secondaryMuscles: [], category: "Other", movementPattern: "Core", difficulty: "Advanced", isCustom: false },
      { name: "Torso Twist Machine", primaryMuscles: ["core"], secondaryMuscles: [], category: "Machine", movementPattern: "Core", difficulty: "Beginner", isCustom: false },
      { name: "Machine Crunch", primaryMuscles: ["core"], secondaryMuscles: [], category: "Machine", movementPattern: "Core", difficulty: "Beginner", isCustom: false },
      { name: "Cable Woodchopper", primaryMuscles: ["core"], secondaryMuscles: [], category: "Cable", movementPattern: "Core", difficulty: "Intermediate", isCustom: false },

      // Calves
      { name: "Standing Calf Raise", primaryMuscles: ["calves"], secondaryMuscles: [], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Seated Calf Raise", primaryMuscles: ["calves"], secondaryMuscles: [], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Calf Press Machine", primaryMuscles: ["calves"], secondaryMuscles: [], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },
      { name: "Calf Press on Leg Press", primaryMuscles: ["calves"], secondaryMuscles: ["quads"], category: "Machine", movementPattern: "Push", difficulty: "Beginner", isCustom: false },

      // Glutes
      { name: "Hip Thrust", primaryMuscles: ["glutes"], secondaryMuscles: ["hamstrings", "core"], category: "Barbell", movementPattern: "Hinge", difficulty: "Intermediate", isCustom: false },
      { name: "Glute Bridge", primaryMuscles: ["glutes"], secondaryMuscles: ["hamstrings"], category: "Bodyweight", movementPattern: "Hinge", difficulty: "Beginner", isCustom: false },
      { name: "Hyperextension", primaryMuscles: ["glutes"], secondaryMuscles: ["back", "hamstrings"], category: "Other", movementPattern: "Hinge", difficulty: "Beginner", isCustom: false },
      { name: "Abductor Machine", primaryMuscles: ["glutes"], secondaryMuscles: [], category: "Machine", movementPattern: "Squat", difficulty: "Beginner", isCustom: false },
      { name: "Cable Pull Through", primaryMuscles: ["glutes"], secondaryMuscles: ["hamstrings"], category: "Cable", movementPattern: "Hinge", difficulty: "Intermediate", isCustom: false },
      { name: "Cable Glute Kickback", primaryMuscles: ["glutes"], secondaryMuscles: [], category: "Cable", movementPattern: "Hinge", difficulty: "Beginner", isCustom: false },
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
