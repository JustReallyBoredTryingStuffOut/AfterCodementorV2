import { Workout, WorkoutExercise, Exercise } from "@/types";

/**
 * Validates that a workout exercise has the correct format
 */
export function validateWorkoutExercise(exercise: any, exercises: Exercise[]): WorkoutExercise | null {
  // Check if it's already a proper WorkoutExercise
  if (exercise && typeof exercise === 'object' && 'id' in exercise && 'sets' in exercise && 'reps' in exercise) {
    return exercise as WorkoutExercise;
  }

  // Check if it's an Exercise object that needs conversion
  if (exercise && typeof exercise === 'object' && 'id' in exercise && 'name' in exercise) {
    console.warn(`Exercise "${exercise.name}" needs to be converted to WorkoutExercise format`);
    return {
      id: exercise.id,
      sets: 3, // Default values
      reps: 12,
      restTime: 60
    };
  }

  // Check if it's a find() result that needs conversion
  if (exercise && typeof exercise === 'object' && exercise.id) {
    console.warn(`Exercise with ID "${exercise.id}" needs to be converted to WorkoutExercise format`);
    return {
      id: exercise.id,
      sets: 3, // Default values
      reps: 12,
      restTime: 60
    };
  }

  console.error('Invalid exercise format:', exercise);
  return null;
}

/**
 * Validates and fixes a workout's exercises array
 */
export function validateWorkout(workout: Workout, exercises: Exercise[]): Workout {
  if (!workout.exercises || !Array.isArray(workout.exercises)) {
    console.error(`Workout "${workout.name}" has no exercises array`);
    return workout;
  }

  const validatedExercises: WorkoutExercise[] = [];
  let hasIssues = false;

  for (let i = 0; i < workout.exercises.length; i++) {
    const exercise = workout.exercises[i];
    const validated = validateWorkoutExercise(exercise, exercises);
    
    if (validated) {
      validatedExercises.push(validated);
    } else {
      hasIssues = true;
      console.error(`Workout "${workout.name}" has invalid exercise at index ${i}:`, exercise);
    }
  }

  if (hasIssues) {
    console.warn(`Workout "${workout.name}" had ${workout.exercises.length - validatedExercises.length} invalid exercises`);
  }

  return {
    ...workout,
    exercises: validatedExercises
  };
}

/**
 * Validates all workouts in a workouts array
 */
export function validateAllWorkouts(workouts: Workout[], exercises: Exercise[]): Workout[] {
  console.log(`Validating ${workouts.length} workouts...`);
  
  const validatedWorkouts = workouts.map(workout => validateWorkout(workout, exercises));
  
  // Count issues
  const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);
  const validExercises = validatedWorkouts.reduce((sum, w) => sum + w.exercises.length, 0);
  
  if (totalExercises !== validExercises) {
    console.warn(`Fixed ${totalExercises - validExercises} invalid exercises across all workouts`);
  } else {
    console.log('All workouts are valid! ✅');
  }
  
  return validatedWorkouts;
}

/**
 * Creates a properly formatted WorkoutExercise from an exercise
 */
export function createWorkoutExercise(
  exercise: Exercise | string | any, 
  sets: number = 3, 
  reps: number = 12, 
  restTime: number = 60,
  duration?: number
): WorkoutExercise {
  let exerciseId: string;
  
  if (typeof exercise === 'string') {
    exerciseId = exercise;
  } else if (exercise && typeof exercise === 'object' && exercise.id) {
    exerciseId = exercise.id;
  } else {
    throw new Error('Invalid exercise provided to createWorkoutExercise');
  }
  
  return {
    id: exerciseId,
    sets,
    reps,
    restTime,
    ...(duration && { duration })
  };
}

/**
 * Helper function to safely find an exercise and create a WorkoutExercise
 */
export function findAndCreateWorkoutExercise(
  exercises: Exercise[],
  exerciseName: string,
  fallbackIndex: number = 0,
  sets: number = 3,
  reps: number = 12,
  restTime: number = 60,
  duration?: number
): WorkoutExercise {
  const exercise = exercises.find(e => e.name === exerciseName) || exercises[fallbackIndex];
  
  if (!exercise) {
    throw new Error(`Exercise "${exerciseName}" not found and no fallback available`);
  }
  
  return createWorkoutExercise(exercise, sets, reps, restTime, duration);
} 

/**
 * Filter workouts based on user profile (fitness level, goal, activity level)
 * @param workouts - Array of workouts
 * @param userProfile - UserProfile object
 * @returns Filtered workouts array
 */
export function filterWorkoutsForUser({
  workouts,
  userProfile,
}: {
  workouts: any[];
  userProfile: {
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    fitnessGoal: 'lose' | 'maintain' | 'gain';
    activityLevel: string;
    weight: number;
  };
}) {
  return workouts.filter(w => {
    // Filter by fitness level
    if (w.difficulty && w.difficulty !== userProfile.fitnessLevel) return false;
    // Filter by goal (if workout has goal tags)
    if (w.goal && w.goal !== userProfile.fitnessGoal) return false;
    // Optionally, filter by activity level (e.g., duration)
    if (w.minActivityLevel && w.minActivityLevel !== userProfile.activityLevel) return false;
    return true;
  });
} 