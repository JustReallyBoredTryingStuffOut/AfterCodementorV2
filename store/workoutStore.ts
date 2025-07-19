import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Exercise, Workout, WorkoutLog, ExerciseLog, WorkoutSet, ScheduledWorkout, WorkoutRating, WorkoutMedia, TimerSettings, BodyRegion, MuscleGroup, EquipmentType, PersonalRecord } from "@/types";
import { exercises } from "@/mocks/exercises";
import { workouts } from "@/mocks/workouts";
import { validateAllWorkouts, validateWorkout, filterWorkoutsForUser } from "@/utils/workoutValidation";
import { useMacroStore } from "./macroStore";
import { useGamificationStore } from "./gamificationStore";

interface WorkoutState {
  exercises: Exercise[];
  workouts: Workout[];
  workoutLogs: WorkoutLog[];
  scheduledWorkouts: ScheduledWorkout[];
  activeWorkout: WorkoutLog | null;
  personalRecords: PersonalRecord[];
  activeTimer: {
    isRunning: boolean;
    startTime: number;
    elapsedTime: number;
    restDuration: number;
    isResting: boolean;
  };
  timerSettings: TimerSettings;
  workoutRecommendationsEnabled: boolean;
  aiRecommendationsExplained: boolean;
  longWorkoutNotificationsEnabled: boolean;
  longWorkoutThreshold: number; // in minutes
  
  // Actions
  addExercise: (exercise: Exercise) => void;
  updateExercise: (exercise: Exercise) => void;
  removeExercise: (id: string) => void;
  
  addWorkout: (workout: Workout) => void;
  updateWorkout: (workout: Workout) => void;
  removeWorkout: (id: string) => void;
  
  startWorkout: (workoutId: string) => void;
  completeWorkout: () => void;
  cancelWorkout: () => void;
  rateWorkout: (rating: WorkoutRating) => void;
  addWorkoutMedia: (media: WorkoutMedia) => void;
  
  logSet: (exerciseIndex: number, setData: WorkoutSet) => void;
  updateSetNote: (exerciseIndex: number, setIndex: number, note: string) => void;
  updateSetWeight: (exerciseIndex: number, setIndex: number, weight: number) => void;
  updateSetReps: (exerciseIndex: number, setIndex: number, reps: number) => void;
  updateSetCompleted: (exerciseIndex: number, setIndex: number, completed: boolean) => void;
  updateExerciseNote: (exerciseIndex: number, note: string) => void;
  updateWorkoutNote: (note: string) => void;
  
  // New actions for exercise reordering and completion
  reorderExercises: (fromIndex: number, toIndex: number) => void;
  markExerciseCompleted: (exerciseIndex: number, completed: boolean) => void;
  isExerciseCompleted: (exerciseIndex: number) => boolean;
  areAllSetsCompleted: (exerciseIndex: number) => boolean;
  startExerciseRestTimer: (duration?: number) => void;
  
  // New action to get previous set data for an exercise
  getPreviousSetData: (exerciseId: string) => { weight: number; reps: number } | null;
  
  // New action to get exercise history
  getRecentExerciseHistory: (exerciseId: string, limit?: number) => Array<{
    date: string;
    workoutId: string;
    workoutName: string;
    sets: WorkoutSet[];
    maxWeight: number;
    maxReps: number;
  }>;
  
  scheduleWorkout: (scheduledWorkout: ScheduledWorkout) => void;
  updateScheduledWorkout: (scheduledWorkout: ScheduledWorkout) => void;
  removeScheduledWorkout: (id: string) => void;
  
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  startRestTimer: (duration: number) => void;
  skipRestTimer: () => void;
  setTimerSettings: (settings: Partial<TimerSettings>) => void;
  
  // New actions for workout recommendations and duration tracking
  toggleWorkoutRecommendations: (enabled: boolean) => void;
  setAiRecommendationsExplained: (explained: boolean) => void;
  toggleLongWorkoutNotifications: (enabled: boolean) => void;
  setLongWorkoutThreshold: (minutes: number) => void;
  getWorkoutDuration: () => number; // Returns current workout duration in minutes
  getAverageWorkoutDuration: (workoutId: string) => number; // Returns average duration for a specific workout
  getRecommendedWorkouts: (count?: number, moodPreference?: string) => Workout[];
  
  // New actions for one-time vs recurring workouts
  getScheduledWorkoutsForDate: (date: Date) => ScheduledWorkout[];
  getRecurringWorkoutsForDay: (dayOfWeek: number) => ScheduledWorkout[];

  // New actions for editing completed workout logs
  updateWorkoutLog: (workoutLogId: string, updates: Partial<WorkoutLog>) => void;
  updateWorkoutLogExercise: (workoutLogId: string, exerciseIndex: number, updates: Partial<ExerciseLog>) => void;
  updateWorkoutLogSet: (workoutLogId: string, exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => void;
  addWorkoutLogSet: (workoutLogId: string, exerciseIndex: number, setData: WorkoutSet) => void;
  removeWorkoutLogSet: (workoutLogId: string, exerciseIndex: number, setIndex: number) => void;
  getWorkoutLog: (workoutLogId: string) => WorkoutLog | null;
}

// List of major lifts for special PR celebrations
const MAJOR_LIFTS = [
  "Squat", 
  "Bench Press", 
  "Deadlift", 
  "Overhead Press", 
  "Barbell Row",
  "Power Clean",
  "Front Squat",
  "Hip Thrust"
];

// Sample workout logs for testing
// No sample workout logs - users start with clean slate

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      exercises: exercises,
      workouts: workouts,
      workoutLogs: [], // Start with empty workout logs - no sample data
      scheduledWorkouts: [],
      activeWorkout: null,
      personalRecords: [],
      activeTimer: {
        isRunning: false,
        startTime: 0,
        elapsedTime: 0,
        restDuration: 60, // Default rest time in seconds
        isResting: false,
      },
      timerSettings: {
        restTime: 60,
        setRestTime: 60,
        workoutRestTime: 60,
        soundEnabled: true,
        vibrationEnabled: true,
        autoStartRest: false,
        defaultSetCount: 3,
      },
      workoutRecommendationsEnabled: false, // Disabled by default
      aiRecommendationsExplained: false, // Track if we've explained AI recommendations
      longWorkoutNotificationsEnabled: true,
      longWorkoutThreshold: 90, // 90 minutes default threshold
      
      addExercise: (exercise) => set((state) => ({
        exercises: [...state.exercises, exercise]
      })),
      
      updateExercise: (exercise) => set((state) => ({
        exercises: state.exercises.map(ex => ex.id === exercise.id ? exercise : ex)
      })),
      
      removeExercise: (id) => set((state) => ({
        exercises: state.exercises.filter(ex => ex.id !== id)
      })),
      
      addWorkout: (workout) => {
        const { exercises } = get();
        const validatedWorkout = validateWorkout(workout, exercises);
        set((state) => ({
          workouts: [...state.workouts, validatedWorkout]
        }));
      },
      
      updateWorkout: (workout) => set((state) => ({
        workouts: state.workouts.map(w => w.id === workout.id ? workout : w)
      })),
      
      removeWorkout: (id) => set((state) => ({
        workouts: state.workouts.filter(w => w.id !== id)
      })),
      
      startWorkout: (workoutId) => {
        const { workouts } = get();
        const workout = workouts.find(w => w.id === workoutId);
        
        if (!workout) return;
        
        const newWorkoutLog: WorkoutLog = {
          id: Date.now().toString(),
          workoutId,
          date: new Date().toISOString(),
          duration: 0,
          startTime: new Date().toISOString(), // Track when workout started
          endTime: "", // Will be set when workout is completed
          exercises: workout.exercises
            .filter(exercise => exercise && exercise.id) // Filter out null/undefined exercises
            .map(exercise => ({
              id: Date.now().toString() + Math.random().toString(),
              exerciseId: exercise.id,
              sets: [],
              notes: "",
              completed: false, // Add completed flag for each exercise
            })),
          notes: "",
          completed: false,
          rating: null,
          media: [],
        };
        
        set({ 
          activeWorkout: newWorkoutLog,
          activeTimer: {
            isRunning: false,
            startTime: 0,
            elapsedTime: 0,
            restDuration: 60,
            isResting: false,
          }
        });
      },
      
      completeWorkout: () => {
        const { activeWorkout, workoutLogs } = get();
        
        if (!activeWorkout) return;
        
        const endTime = new Date().toISOString();
        const startTime = new Date(activeWorkout.startTime || activeWorkout.date);
        const endTimeDate = new Date(endTime);
        
        // Calculate duration in minutes
        const durationMs = endTimeDate.getTime() - startTime.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);
        
        const completedWorkout = {
          ...activeWorkout,
          completed: true,
          duration: durationMinutes,
          endTime: endTime
        };
        
        set({
          workoutLogs: [...workoutLogs, completedWorkout],
          activeWorkout: null,
        });
        
        // Update gamification after workout completion
        const gamificationStore = useGamificationStore.getState();
        
        // Only update gamification if it's enabled
        if (gamificationStore.gamificationEnabled) {
          // Update streak
          gamificationStore.updateStreak();
          
          // Check achievements
          gamificationStore.checkAchievements();
          
          // Update challenge progress for workout challenges
          const workoutChallenges = gamificationStore.challenges.filter(
            c => c.category === "workout" && !c.completed
          );
          
          workoutChallenges.forEach(challenge => {
            gamificationStore.updateChallengeProgress(challenge.id, challenge.progress + 1);
          });
          
          // Complete daily workout quest if it exists
          const dailyWorkoutQuest = gamificationStore.dailyQuests.find(
            q => q.category === "workout" && !q.completed && 
            new Date(q.date).toDateString() === new Date().toDateString()
          );
          
          if (dailyWorkoutQuest) {
            gamificationStore.completeDailyQuest(dailyWorkoutQuest.id);
          }
        }
      },
      
      cancelWorkout: () => set({ activeWorkout: null }),
      
      rateWorkout: (rating) => set((state) => {
        if (!state.activeWorkout) return state;
        
        return {
          activeWorkout: {
            ...state.activeWorkout,
            rating
          }
        };
      }),
      
      addWorkoutMedia: (media) => set((state) => {
        if (!state.activeWorkout) return state;
        
        return {
          activeWorkout: {
            ...state.activeWorkout,
            media: [...(state.activeWorkout.media || []), media]
          }
        };
      }),
      
      logSet: (exerciseIndex, setData) => set((state) => {
        if (!state.activeWorkout) return state;
        
        const updatedExercises = [...state.activeWorkout.exercises];
        
        if (exerciseIndex >= 0 && exerciseIndex < updatedExercises.length) {
          updatedExercises[exerciseIndex] = {
            ...updatedExercises[exerciseIndex],
            sets: [...updatedExercises[exerciseIndex].sets, setData],
          };
          
          // Check for personal record
          const exerciseId = updatedExercises[exerciseIndex].exerciseId;
          const weight = setData.weight || 0;
          const reps = setData.reps || 0;
          
          // Only check for PR if both weight and reps are greater than 0
          if (weight > 0 && reps > 0) {
            const pr = get().checkForPersonalRecord(exerciseId, weight, reps);
            
            // If PR was detected, it's already been added to the state
          }
        }
        
        return {
          activeWorkout: {
            ...state.activeWorkout,
            exercises: updatedExercises,
          }
        };
      }),
      
      updateSetNote: (exerciseIndex, setIndex, note) => set((state) => {
        if (!state.activeWorkout) return state;
        
        const updatedExercises = [...state.activeWorkout.exercises];
        
        if (exerciseIndex >= 0 && exerciseIndex < updatedExercises.length) {
          const exercise = updatedExercises[exerciseIndex];
          
          if (setIndex >= 0 && setIndex < exercise.sets.length) {
            const updatedSets = [...exercise.sets];
            updatedSets[setIndex] = {
              ...updatedSets[setIndex],
              notes: note,
            };
            
            updatedExercises[exerciseIndex] = {
              ...exercise,
              sets: updatedSets,
            };
          }
        }
        
        return {
          activeWorkout: {
            ...state.activeWorkout,
            exercises: updatedExercises,
          }
        };
      }),
      
      updateSetWeight: (exerciseIndex, setIndex, weight) => set((state) => {
        if (!state.activeWorkout) return state;
        
        const updatedExercises = [...state.activeWorkout.exercises];
        
        if (exerciseIndex >= 0 && exerciseIndex < updatedExercises.length) {
          const exercise = updatedExercises[exerciseIndex];
          
          if (setIndex >= 0 && setIndex < exercise.sets.length) {
            const updatedSets = [...exercise.sets];
            const oldWeight = updatedSets[setIndex].weight || 0;
            const reps = updatedSets[setIndex].reps || 0;
            
            updatedSets[setIndex] = {
              ...updatedSets[setIndex],
              weight,
            };
            
            updatedExercises[exerciseIndex] = {
              ...exercise,
              sets: updatedSets,
            };
            
            // Check for personal record if weight increased and reps > 0
            if (weight > oldWeight && reps > 0) {
              const exerciseId = exercise.exerciseId;
              get().checkForPersonalRecord(exerciseId, weight, reps);
            }
          }
        }
        
        return {
          activeWorkout: {
            ...state.activeWorkout,
            exercises: updatedExercises,
          }
        };
      }),
      
      updateSetReps: (exerciseIndex, setIndex, reps) => set((state) => {
        if (!state.activeWorkout) return state;
        
        const updatedExercises = [...state.activeWorkout.exercises];
        
        if (exerciseIndex >= 0 && exerciseIndex < updatedExercises.length) {
          const exercise = updatedExercises[exerciseIndex];
          
          if (setIndex >= 0 && setIndex < exercise.sets.length) {
            const updatedSets = [...exercise.sets];
            const oldReps = updatedSets[setIndex].reps || 0;
            const weight = updatedSets[setIndex].weight || 0;
            
            updatedSets[setIndex] = {
              ...updatedSets[setIndex],
              reps,
            };
            
            updatedExercises[exerciseIndex] = {
              ...exercise,
              sets: updatedSets,
            };
            
            // Check for personal record if reps increased and weight > 0
            if (reps > oldReps && weight > 0) {
              const exerciseId = exercise.exerciseId;
              get().checkForPersonalRecord(exerciseId, weight, reps);
            }
          }
        }
        
        return {
          activeWorkout: {
            ...state.activeWorkout,
            exercises: updatedExercises,
          }
        };
      }),
      
      updateSetCompleted: (exerciseIndex, setIndex, completed) => set((state) => {
        if (!state.activeWorkout) return state;
        
        const updatedExercises = [...state.activeWorkout.exercises];
        
        if (exerciseIndex >= 0 && exerciseIndex < updatedExercises.length) {
          const exercise = updatedExercises[exerciseIndex];
          
          if (setIndex >= 0 && setIndex < exercise.sets.length) {
            const updatedSets = [...exercise.sets];
            updatedSets[setIndex] = {
              ...updatedSets[setIndex],
              completed,
            };
            
            updatedExercises[exerciseIndex] = {
              ...exercise,
              sets: updatedSets,
            };
          }
        }
        
        return {
          activeWorkout: {
            ...state.activeWorkout,
            exercises: updatedExercises,
          }
        };
      }),
      
      updateExerciseNote: (exerciseIndex, note) => set((state) => {
        if (!state.activeWorkout) return state;
        
        const updatedExercises = [...state.activeWorkout.exercises];
        
        if (exerciseIndex >= 0 && exerciseIndex < updatedExercises.length) {
          updatedExercises[exerciseIndex] = {
            ...updatedExercises[exerciseIndex],
            notes: note,
          };
        }
        
        return {
          activeWorkout: {
            ...state.activeWorkout,
            exercises: updatedExercises,
          }
        };
      }),
      
      updateWorkoutNote: (note) => set((state) => {
        if (!state.activeWorkout) return state;
        
        return {
          activeWorkout: {
            ...state.activeWorkout,
            notes: note,
          }
        };
      }),
      
      // New functions for exercise reordering and completion
      reorderExercises: (fromIndex, toIndex) => set((state) => {
        if (!state.activeWorkout) return state;
        
        const updatedExercises = [...state.activeWorkout.exercises];
        
        // Remove the exercise from the original position
        const [movedExercise] = updatedExercises.splice(fromIndex, 1);
        
        // Insert the exercise at the new position
        updatedExercises.splice(toIndex, 0, movedExercise);
        
        return {
          activeWorkout: {
            ...state.activeWorkout,
            exercises: updatedExercises,
          }
        };
      }),
      
      markExerciseCompleted: (exerciseIndex, completed) => set((state) => {
        if (!state.activeWorkout) return state;
        
        const updatedExercises = [...state.activeWorkout.exercises];
        
        if (exerciseIndex >= 0 && exerciseIndex < updatedExercises.length) {
          updatedExercises[exerciseIndex] = {
            ...updatedExercises[exerciseIndex],
            completed,
          };
        }
        
        return {
          activeWorkout: {
            ...state.activeWorkout,
            exercises: updatedExercises,
          }
        };
      }),
      
      isExerciseCompleted: (exerciseIndex) => {
        const { activeWorkout } = get();
        
        if (!activeWorkout || exerciseIndex < 0 || exerciseIndex >= activeWorkout.exercises.length) {
          return false;
        }
        
        return activeWorkout.exercises[exerciseIndex].completed || false;
      },
      
      areAllSetsCompleted: (exerciseIndex) => {
        const { activeWorkout } = get();
        
        if (!activeWorkout || exerciseIndex < 0 || exerciseIndex >= activeWorkout.exercises.length) {
          return false;
        }
        
        const exercise = activeWorkout.exercises[exerciseIndex];
        
        // If there are no sets, return false
        if (exercise.sets.length === 0) {
          return false;
        }
        
        // Check if all sets have both weight and reps filled in
        return exercise.sets.every(set => 
          (set.weight > 0 || set.weight === 0) && 
          (set.reps > 0 || set.reps === 0)
        );
      },
      
      startExerciseRestTimer: (duration) => {
        const { timerSettings } = get();
        const restDuration = duration || timerSettings.defaultRestTime;
        
        // Use the existing startRestTimer function with the specified duration
        get().startRestTimer(restDuration);
      },
      
      // New function to get previous set data for an exercise
      getPreviousSetData: (exerciseId) => {
        const { workoutLogs } = get();
        
        // Find the most recent completed workout that contains this exercise
        const recentWorkouts = [...workoutLogs]
          .filter(log => log.completed)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        for (const workout of recentWorkouts) {
          // Find the exercise in this workout
          const exerciseLog = workout.exercises.find(ex => ex.exerciseId === exerciseId);
          
          if (exerciseLog && exerciseLog.sets.length > 0) {
            // Find the set with the highest weight and reps
            const bestSet = [...exerciseLog.sets]
              .sort((a, b) => {
                // Sort by weight first, then by reps
                if (a.weight !== b.weight) {
                  return b.weight - a.weight;
                }
                return b.reps - a.reps;
              })[0];
            
            return {
              weight: bestSet.weight,
              reps: bestSet.reps
            };
          }
        }
        
        return null;
      },
      
      // New function to get exercise history
      getRecentExerciseHistory: (exerciseId, limit = 5) => {
        const { workoutLogs, workouts } = get();
        
        // Find all completed workouts that contain this exercise
        const relevantWorkouts = workoutLogs
          .filter(log => log.completed)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const history = [];
        
        for (const workout of relevantWorkouts) {
          // Find the exercise in this workout
          const exerciseLog = workout.exercises.find(ex => ex.exerciseId === exerciseId);
          
          if (exerciseLog && exerciseLog.sets.length > 0) {
            // Find the workout name
            const workoutData = workouts.find(w => w.id === workout.workoutId);
            const workoutName = workoutData ? workoutData.name : "Unknown Workout";
            
            // Find the max weight and reps
            let maxWeight = 0;
            let maxReps = 0;
            
            exerciseLog.sets.forEach(set => {
              if (set.weight > maxWeight) {
                maxWeight = set.weight;
              }
              if (set.reps > maxReps) {
                maxReps = set.reps;
              }
            });
            
            history.push({
              date: workout.date,
              workoutId: workout.workoutId,
              workoutName,
              sets: exerciseLog.sets,
              maxWeight,
              maxReps
            });
            
            // Limit the number of history items
            if (history.length >= limit) {
              break;
            }
          }
        }
        
        return history;
      },
      
      scheduleWorkout: (scheduledWorkout) => set((state) => ({
        scheduledWorkouts: [...state.scheduledWorkouts, scheduledWorkout]
      })),
      
      updateScheduledWorkout: (scheduledWorkout) => set((state) => ({
        scheduledWorkouts: state.scheduledWorkouts.map(sw => 
          sw.id === scheduledWorkout.id ? scheduledWorkout : sw
        )
      })),
      
      removeScheduledWorkout: (id) => set((state) => ({
        scheduledWorkouts: state.scheduledWorkouts.filter(sw => sw.id !== id)
      })),
      
      // New function to delete workout logs
      deleteWorkoutLog: (id) => set((state) => ({
        workoutLogs: state.workoutLogs.filter(log => log.id !== id)
      })),
      
      startTimer: () => set((state) => ({
        activeTimer: {
          ...state.activeTimer,
          isRunning: true,
          startTime: Date.now() - state.activeTimer.elapsedTime,
        }
      })),
      
      pauseTimer: () => set((state) => ({
        activeTimer: {
          ...state.activeTimer,
          isRunning: false,
          elapsedTime: Date.now() - state.activeTimer.startTime,
        }
      })),
      
      resetTimer: () => set((state) => ({
        activeTimer: {
          ...state.activeTimer,
          isRunning: false,
          startTime: 0,
          elapsedTime: 0,
          isResting: false,
        }
      })),
      
      startRestTimer: (duration) => set((state) => ({
        activeTimer: {
          ...state.activeTimer,
          isRunning: true,
          startTime: Date.now(),
          elapsedTime: 0,
          restDuration: duration,
          isResting: true,
        }
      })),
      
      skipRestTimer: () => set((state) => ({
        activeTimer: {
          ...state.activeTimer,
          isRunning: false,
          isResting: false,
        }
      })),
      
      setTimerSettings: (settings) => set((state) => ({
        timerSettings: {
          ...state.timerSettings,
          ...settings,
        }
      })),
      
      // New functions for workout recommendations and duration tracking
      toggleWorkoutRecommendations: (enabled) => set({ workoutRecommendationsEnabled: enabled }),
      
      setAiRecommendationsExplained: (explained) => set({ aiRecommendationsExplained: explained }),
      
      toggleLongWorkoutNotifications: (enabled) => set({ longWorkoutNotificationsEnabled: enabled }),
      
      setLongWorkoutThreshold: (minutes) => set({ longWorkoutThreshold: minutes }),
      
      getWorkoutDuration: () => {
        const { activeWorkout } = get();
        
        if (!activeWorkout || !activeWorkout.startTime) return 0;
        
        const startTime = new Date(activeWorkout.startTime);
        const now = new Date();
        
        // Calculate duration in minutes
        return Math.floor((now.getTime() - startTime.getTime()) / 60000);
      },
      
      getAverageWorkoutDuration: (workoutId) => {
        const { workoutLogs } = get();
        
        // Filter logs for the specific workout
        const relevantLogs = workoutLogs.filter(
          log => log.workoutId === workoutId && log.completed && log.duration
        );
        
        if (relevantLogs.length === 0) return 0;
        
        // Calculate average duration
        const totalDuration = relevantLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
        return Math.floor(totalDuration / relevantLogs.length);
      },
      
      getRecommendedWorkouts: (count = 3, moodPreference) => {
        const { workouts, workoutLogs, workoutRecommendationsEnabled } = get();
        const { userProfile } = useMacroStore.getState();
        
        // If mood preference is provided, use mood-based recommendations
        if (moodPreference) {
          return get().getMoodBasedWorkouts("", moodPreference, count);
        }
        
        // Use the new smart filtering utility for better personalization
        const userProfileForFiltering = {
          fitnessLevel: userProfile.fitnessLevel || 'beginner',
          fitnessGoal: userProfile.fitnessGoal || 'maintain',
          activityLevel: userProfile.activityLevel || 'moderate',
          weight: userProfile.weight || 70,
        };
        
        // Filter workouts using the new utility
        let filteredWorkouts = filterWorkoutsForUser({
          workouts,
          userProfile: userProfileForFiltering,
        });
        
        if (!workoutRecommendationsEnabled || workoutLogs.length === 0) {
          // If recommendations are disabled or no workout history,
          // return filtered workouts based on user's profile
          return [...filteredWorkouts]
            .sort(() => 0.5 - Math.random())
            .slice(0, count);
        }
        
        // Get recently completed workouts
        const recentWorkouts = [...workoutLogs]
          .filter(log => log.completed && log.rating)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        
        if (recentWorkouts.length === 0) {
          // If no completed workouts with ratings, return filtered workouts
          return [...filteredWorkouts]
            .sort(() => 0.5 - Math.random())
            .slice(0, count);
        }
        
        // Calculate average rating for each workout
        const workoutRatings: Record<string, { count: number; totalRating: number }> = {};
        
        recentWorkouts.forEach(log => {
          if (!workoutRatings[log.workoutId]) {
            workoutRatings[log.workoutId] = { count: 0, totalRating: 0 };
          }
          workoutRatings[log.workoutId].count++;
          workoutRatings[log.workoutId].totalRating += log.rating || 0;
        });
        
        // Calculate average ratings
        const averageRatings: Record<string, number> = {};
        Object.keys(workoutRatings).forEach(workoutId => {
          const { count, totalRating } = workoutRatings[workoutId];
          averageRatings[workoutId] = totalRating / count;
        });
        
        // Get user's favorite workout categories based on ratings
        const categoryRatings: Record<string, number> = {};
        Object.keys(averageRatings).forEach(workoutId => {
          const workout = workouts.find(w => w.id === workoutId);
          if (workout) {
            if (!categoryRatings[workout.category]) {
              categoryRatings[workout.category] = 0;
            }
            categoryRatings[workout.category] += averageRatings[workoutId];
          }
        });
        
        // Get top 3 favorite categories
        const favoriteCategories = Object.keys(categoryRatings)
          .sort((a, b) => categoryRatings[b] - categoryRatings[a])
          .slice(0, 3);
        
        // Get recently done workout IDs to avoid repetition
        const recentWorkoutIds = new Set(
          recentWorkouts.map(log => log.workoutId)
        );
        
        // Filter and prioritize workouts
        let recommendedWorkouts = filteredWorkouts.filter(workout => {
          // Skip recently done workouts
          if (recentWorkoutIds.has(workout.id)) return false;
          
          // Check if it's in a favorite category
          const isInFavoriteCategory = favoriteCategories.includes(workout.category);
          
          // Prioritize workouts that match user's preferences
          return isInFavoriteCategory;
        });
        
        // If we don't have enough recommendations, add some filtered workouts
        if (recommendedWorkouts.length < count) {
          const remainingCount = count - recommendedWorkouts.length;
          const otherWorkouts = filteredWorkouts
            .filter(w => {
              // Skip recently done workouts and already recommended ones
              if (recentWorkoutIds.has(w.id) || recommendedWorkouts.includes(w)) return false;
              return true;
            })
            .sort(() => 0.5 - Math.random())
            .slice(0, remainingCount);
          
          recommendedWorkouts = [...recommendedWorkouts, ...otherWorkouts];
        }
        
        // If we still don't have enough, just return filtered workouts
        if (recommendedWorkouts.length < count) {
          return [...filteredWorkouts]
            .sort(() => 0.5 - Math.random())
            .slice(0, count);
        }
        
        return recommendedWorkouts.slice(0, count);
      },
      
      isWorkoutRunningTooLong: () => {
        const { activeWorkout, longWorkoutThreshold, longWorkoutNotificationsEnabled } = get();
        
        if (!activeWorkout || !activeWorkout.startTime || !longWorkoutNotificationsEnabled) {
          return false;
        }
        
        const startTime = new Date(activeWorkout.startTime);
        const now = new Date();
        
        // Calculate duration in minutes
        const durationMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
        
        return durationMinutes >= longWorkoutThreshold;
      },
      
      // New functions for filtering exercises
      getBodyRegions: () => {
        return [
          { name: 'upper_body', image: null },
          { name: 'lower_body', image: null },
          { name: 'core', image: null },
          { name: 'back', image: null },
        ];
      },
      
      getMuscleGroups: (bodyRegion) => {
        const { exercises } = get();
        const muscleGroupsMap = new Map<string, MuscleGroup>();
        
        exercises.forEach(exercise => {
          if (!bodyRegion || exercise.muscleGroups.some(group => group.bodyRegion.name === bodyRegion.name)) {
            exercise.muscleGroups.forEach(group => {
              if (!muscleGroupsMap.has(group.name)) {
                muscleGroupsMap.set(group.name, group);
              }
            });
          }
        });
        
        return Array.from(muscleGroupsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      },
      
      getEquipmentTypes: () => {
        const { exercises } = get();
        const equipmentTypesMap = new Map<string, EquipmentType>();
        
        exercises.forEach(exercise => {
          exercise.equipment.forEach(equipment => {
            if (!equipmentTypesMap.has(equipment.name)) {
              equipmentTypesMap.set(equipment.name, equipment);
            }
          });
        });
        
        return Array.from(equipmentTypesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      },
      
      getExercisesByMuscleGroup: (muscleGroup) => {
        const { exercises } = get();
        
        return exercises.filter(exercise => 
          exercise.muscleGroups.some(group => group.name === muscleGroup.name)
        );
      },
      
      getExercisesByBodyRegion: (bodyRegion) => {
        const { exercises } = get();
        
        return exercises.filter(exercise => 
          exercise.muscleGroups.some(group => group.bodyRegion.name === bodyRegion.name)
        );
      },
      
      getExercisesByEquipment: (equipment) => {
        const { exercises } = get();
        
        return exercises.filter(exercise => 
          exercise.equipment.some(eq => eq.name === equipment.name)
        );
      },
      
      getFilteredExercises: (filters) => {
        const { exercises } = get();
        
        return exercises.filter(exercise => {
          // Filter by body region
          if (filters.bodyRegion && !exercise.muscleGroups.some(group => group.bodyRegion.name === filters.bodyRegion?.name)) {
            return false;
          }
          
          // Filter by muscle group
          if (filters.muscleGroup && !exercise.muscleGroups.some(group => group.name === filters.muscleGroup?.name)) {
            return false;
          }
          
          // Filter by equipment
          if (filters.equipment && !exercise.equipment.some(eq => eq.name === filters.equipment?.name)) {
            return false;
          }
          
          // Filter by difficulty
          if (filters.difficulty && exercise.difficulty !== filters.difficulty) {
            return false;
          }
          
          // Filter by search query
          if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            const nameMatch = exercise.name.toLowerCase().includes(query);
            const descriptionMatch = exercise.description.toLowerCase().includes(query);
            const muscleGroupMatch = exercise.muscleGroups.some(group => 
              group.name.toLowerCase().includes(query)
            );
            
            if (!nameMatch && !descriptionMatch && !muscleGroupMatch) {
              return false;
            }
          }
          
          return true;
        });
      },
      
      // New functions for mood-based workout recommendations
      getMoodBasedWorkouts: (mood, preference, count = 3) => {
        const { workouts } = get();
        const { userProfile } = useMacroStore.getState();
        
        // Use the new smart filtering utility for better personalization
        const userProfileForFiltering = {
          fitnessLevel: userProfile.fitnessLevel || 'beginner',
          fitnessGoal: userProfile.fitnessGoal || 'maintain',
          activityLevel: userProfile.activityLevel || 'moderate',
          weight: userProfile.weight || 70,
        };
        
        // Filter workouts using the new utility first
        let filteredWorkouts = filterWorkoutsForUser({
          workouts,
          userProfile: userProfileForFiltering,
        });
        
        // Then apply mood-based filtering
        switch (preference) {
          case "shorter":
            // For tired or not great users who want shorter workouts
            // Check both estimatedDuration and duration properties, prioritizing shorter workouts
            filteredWorkouts = filteredWorkouts
              .filter(w => {
                // Get the workout duration (use estimatedDuration if available, otherwise use duration)
                const workoutDuration = w.estimatedDuration || w.duration || 60;
                // Only include workouts that are 30 minutes or less
                return workoutDuration <= 30;
              })
              .sort((a, b) => {
                // Sort by duration (shortest first)
                const durationA = a.estimatedDuration || a.duration || 60;
                const durationB = b.estimatedDuration || b.duration || 60;
                return durationA - durationB;
              });
            break;
            
          case "light":
            // For users not feeling great who want light workouts
            filteredWorkouts = filteredWorkouts
              .filter(w => 
                w.intensity === "low" || 
                w.category === "mobility" || 
                w.category === "recovery"
              );
            break;
            
          case "rest":
            // For users who need a rest day - return a small subset of recovery workouts
            filteredWorkouts = filteredWorkouts
              .filter(w => 
                w.category === "mobility" || 
                w.category === "recovery" || 
                w.name.toLowerCase().includes("stretch")
              )
              .slice(0, count);
            break;
            
          case "energetic":
            // For users feeling energetic who want challenging workouts
            filteredWorkouts = filteredWorkouts
              .filter(w => 
                w.intensity === "high" || 
                w.category === "hiit" || 
                w.category === "strength"
              )
              .sort((a, b) => {
                // Sort by duration (longer first for energetic users)
                const durationA = a.estimatedDuration || a.duration || 60;
                const durationB = b.estimatedDuration || b.duration || 60;
                return durationB - durationA;
              });
            break;
            
          default:
            // For general mood, just use the filtered workouts
            break;
        }
        
        // If we don't have enough workouts after mood filtering, add some from the original filtered list
        if (filteredWorkouts.length < count) {
          const additionalWorkouts = filterWorkoutsForUser({
            workouts,
            userProfile: userProfileForFiltering,
          })
            .filter(w => {
              // Skip already included workouts
              if (filteredWorkouts.includes(w)) return false;
              
              return true;
            })
            .sort(() => 0.5 - Math.random())
            .slice(0, count - filteredWorkouts.length);
          
          filteredWorkouts = [...filteredWorkouts, ...additionalWorkouts];
        }
        
        // Randomize the order a bit to avoid always showing the same workouts
        // But keep the first few sorted by our criteria (especially important for shorter workouts)
        const priorityWorkouts = filteredWorkouts.slice(0, Math.min(2, filteredWorkouts.length));
        const remainingWorkouts = filteredWorkouts.slice(Math.min(2, filteredWorkouts.length))
          .sort(() => 0.5 - Math.random());
        
        return [...priorityWorkouts, ...remainingWorkouts].slice(0, count);
      },
      
      getRestDayActivities: () => {
        return [
          "Light stretching for 10-15 minutes",
          "Gentle yoga flow",
          "Walking outdoors for 20-30 minutes",
          "Foam rolling session",
          "Meditation for recovery",
          "Light mobility exercises",
          "Active recovery with swimming",
          "Deep breathing exercises",
          "Gentle cycling",
          "Tai Chi practice"
        ];
      },
      
      // New functions for PR tracking
      checkForPersonalRecord: (exerciseId, weight, reps) => {
        const { personalRecords, exercises, workoutLogs } = get();
        const exercise = exercises.find(e => e.id === exerciseId);
        if (!exercise) return null;

        // Count previous completed attempts for this exercise
        const previousAttempts = workoutLogs.filter(log => log.completed && log.exercises.some(ex => ex.exerciseId === exerciseId && ex.sets.length > 0));
        if (previousAttempts.length < 4) {
          // Require at least 4 previous attempts before setting a PR
          return null;
        }
        
        // Find previous PR for this exercise
        const previousPR = personalRecords.find(pr => pr.exerciseId === exerciseId);
        // Calculate estimated 1RM using Epley formula: 1RM = weight * (1 + reps/30)
        const estimatedOneRepMax = weight * (1 + reps/30);
        // Check if this is a new PR
        let isNewPR = false;
        if (!previousPR) {
          isNewPR = true;
        } else if (estimatedOneRepMax > previousPR.estimatedOneRepMax) {
          isNewPR = true;
        }
        if (isNewPR) {
          const newPR: PersonalRecord = {
            id: Date.now().toString(),
            exerciseId,
            exerciseName: exercise.name,
            weight,
            reps,
            estimatedOneRepMax,
            date: new Date().toISOString(),
            previousBest: previousPR ? previousPR.weight : 0,
            improvement: previousPR ? weight - previousPR.weight : weight,
          };
          set(state => ({
            personalRecords: [
              ...state.personalRecords.filter(pr => pr.exerciseId !== exerciseId),
              newPR
            ]
          }));
          // Update gamification if enabled
          const gamificationStore = useGamificationStore.getState();
          if (gamificationStore.gamificationEnabled) {
            const prAchievement = gamificationStore.achievements.find(a => a.id === "special-first-pr" && !a.completed);
            if (prAchievement) {
              gamificationStore.updateAchievementProgress(prAchievement.id, 1);
              gamificationStore.unlockAchievement(prAchievement.id);
            }
            if (get().isMajorLift(exerciseId)) {
              gamificationStore.addPoints(25);
            } else {
              gamificationStore.addPoints(10);
            }
          }
          return newPR;
        }
        return null;
      },
      
      getPersonalRecordMessage: (pr) => {
        const { exercises } = get();
        const exercise = exercises.find(e => e.id === pr.exerciseId);
        
        if (!exercise) return "New personal record!";
        
        const isMajor = get().isMajorLift(pr.exerciseId);
        const { userProfile } = useMacroStore.getState();
        
        // Determine user's generation based on birth year
        let generation = "default";
        if (userProfile.age) {
          const birthYear = new Date().getFullYear() - userProfile.age;
          
          if (birthYear >= 1997 && birthYear <= 2012) {
            generation = "gen_z";
          } else if (birthYear >= 1981 && birthYear <= 1996) {
            generation = "millennial";
          } else if (birthYear >= 1965 && birthYear <= 1980) {
            generation = "gen_x";
          } else if (birthYear >= 1946 && birthYear <= 1964) {
            generation = "boomer";
          }
        }
        
        // Get gender-specific messages
        const gender = userProfile.gender || "neutral";
        
        // Messages for major lifts
        const majorMessages = {
          male: {
            default: [
              "Incredible strength gains! You're getting stronger every day!",
              "That's some serious weight you're moving now!",
              "Your hard work is paying off in a big way!",
              "You're reaching new heights of strength!"
            ],
            gen_z: [
              "Absolutely cracked! Your strength is no cap!",
              "Slay king! That's some serious weight!",
              "You're built different! Keep crushing it!",
              "Main character energy right there!"
            ],
            millennial: [
              "Beast mode activated! Crushing those goals!",
              "This is the way! Strength level: legendary!",
              "Gains for days! You're killing it!",
              "That PR is straight fire! Keep grinding!"
            ],
            gen_x: [
              "Impressive strength gains! You've still got it!",
              "Showing these youngsters how it's done!",
              "Age is just a number when you're this strong!",
              "That's what I call real strength!"
            ],
            boomer: [
              "Outstanding progress! Defying expectations!",
              "That's how it's done! Wisdom and strength combined!",
              "Proving that strength has no age limit!",
              "Remarkable achievement! Keep it up!"
            ]
          },
          female: {
            default: [
              "Incredible strength gains! You're getting stronger every day!",
              "That's some serious weight you're moving now!",
              "Your hard work is paying off in a big way!",
              "You're reaching new heights of strength!"
            ],
            gen_z: [
              "Absolutely cracked! Your strength is no cap!",
              "Slay queen! That's some serious weight!",
              "You're built different! Keep crushing it!",
              "Main character energy right there!"
            ],
            millennial: [
              "Beast mode activated! Crushing those goals!",
              "This is the way! Strength level: legendary!",
              "Gains for days! You're killing it!",
              "That PR is straight fire! Keep grinding!"
            ],
            gen_x: [
              "Impressive strength gains! You've still got it!",
              "Showing these youngsters how it's done!",
              "Age is just a number when you're this strong!",
              "That's what I call real strength!"
            ],
            boomer: [
              "Outstanding progress! Defying expectations!",
              "That's how it's done! Wisdom and strength combined!",
              "Proving that strength has no age limit!",
              "Remarkable achievement! Keep it up!"
            ]
          },
          neutral: {
            default: [
              "Incredible strength gains! You're getting stronger every day!",
              "That's some serious weight you're moving now!",
              "Your hard work is paying off in a big way!",
              "You're reaching new heights of strength!"
            ],
            gen_z: [
              "Absolutely cracked! Your strength is no cap!",
              "Slay! That's some serious weight!",
              "You're built different! Keep crushing it!",
              "Main character energy right there!"
            ],
            millennial: [
              "Beast mode activated! Crushing those goals!",
              "This is the way! Strength level: legendary!",
              "Gains for days! You're killing it!",
              "That PR is straight fire! Keep grinding!"
            ],
            gen_x: [
              "Impressive strength gains! You've still got it!",
              "Showing these youngsters how it's done!",
              "Age is just a number when you're this strong!",
              "That's what I call real strength!"
            ],
            boomer: [
              "Outstanding progress! Defying expectations!",
              "That's how it's done! Wisdom and strength combined!",
              "Proving that strength has no age limit!",
              "Remarkable achievement! Keep it up!"
            ]
          }
        };
        
        // Messages for minor lifts
        const minorMessages = {
          male: [
            "New personal record! Keep up the good work!",
            "You're making great progress!",
            "Getting stronger every workout!",
            "Nice job on the new PR!"
          ],
          female: [
            "New personal record! Keep up the good work!",
            "You're making great progress!",
            "Getting stronger every workout!",
            "Nice job on the new PR!"
          ],
          neutral: [
            "New personal record! Keep up the good work!",
            "You're making great progress!",
            "Getting stronger every workout!",
            "Nice job on the new PR!"
          ]
        };
        
        if (isMajor) {
          // For major lifts, use generation and gender specific messages
          const genderMessages = majorMessages[gender as keyof typeof majorMessages] || majorMessages.neutral;
          const genMessages = genderMessages[generation as keyof typeof genderMessages] || genderMessages.default;
          
          // Pick a random message from the appropriate array
          return genMessages[Math.floor(Math.random() * genMessages.length)];
        } else {
          // For minor lifts, use simpler messages
          const messages = minorMessages[gender as keyof typeof minorMessages] || minorMessages.neutral;
          return messages[Math.floor(Math.random() * messages.length)];
        }
      },
      
      isMajorLift: (exerciseId) => {
        const { exercises } = get();
        const exercise = exercises.find(e => e.id === exerciseId);
        
        if (!exercise) return false;
        
        // Check if the exercise name contains any of the major lift names
        return MAJOR_LIFTS.some(liftName => 
          exercise.name.toLowerCase().includes(liftName.toLowerCase())
        );
      },
      
      getExercisePR: (exerciseId) => {
        const { personalRecords } = get();
        return personalRecords.find(pr => pr.exerciseId === exerciseId) || null;
      },
      
      getAllPersonalRecords: () => {
        return get().personalRecords;
      },
      
      getRecentPersonalRecords: (count = 5) => {
        const { personalRecords } = get();
        
        // Sort by date (newest first) and take the specified count
        return [...personalRecords]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, count);
      },
      
      // New functions for workout history and calendar view
      getWorkoutsForDate: (date: Date) => {
        const { workoutLogs } = get();
        
        return workoutLogs.filter(log => {
          const logDate = new Date(log.date);
          return (
            logDate.getDate() === date.getDate() &&
            logDate.getMonth() === date.getMonth() &&
            logDate.getFullYear() === date.getFullYear() &&
            log.completed
          );
        });
      },
      
      getWorkoutsForDateRange: (startDate: Date, endDate: Date) => {
        const { workoutLogs } = get();
        
        return workoutLogs.filter(log => {
          const logDate = new Date(log.date);
          return (
            logDate >= startDate &&
            logDate <= endDate &&
            log.completed
          );
        });
      },
      
      getMuscleGroupsForDate: (date: Date) => {
        const { workoutLogs, workouts, exercises } = get();
        const logs = get().getWorkoutsForDate(date);
        const muscleGroups = new Set<string>();
        
        logs.forEach(log => {
          const workout = workouts.find(w => w.id === log.workoutId);
          if (workout) {
            workout.exercises.forEach(exercise => {
              const ex = exercises.find(e => e.id === exercise.id);
              if (ex) {
                ex.muscleGroups.forEach(group => muscleGroups.add(group.name));
              }
            });
          }
        });
        
        return Array.from(muscleGroups);
      },
      
      copyWorkoutToCustom: (workoutLogId: string) => {
        const { workoutLogs, workouts, addWorkout } = get();
        
        // Find the workout log
        const log = workoutLogs.find(l => l.id === workoutLogId);
        if (!log) return "";
        
        // Find the original workout
        const originalWorkout = workouts.find(w => w.id === log.workoutId);
        if (!originalWorkout) return "";
        
        // Create a new custom workout based on the completed workout
        const newWorkoutId = Date.now().toString();
        const newWorkout: Workout = {
          id: newWorkoutId,
          name: `${originalWorkout.name} (Custom)`,
          description: `Custom workout based on ${originalWorkout.name} completed on ${new Date(log.date).toLocaleDateString()}`,
          category: originalWorkout.category,
          difficulty: originalWorkout.difficulty,
          intensity: originalWorkout.intensity,
          estimatedDuration: log.duration || originalWorkout.estimatedDuration,
          exercises: originalWorkout.exercises.map(ex => ({
            id: ex.id,
            sets: ex.sets,
            reps: ex.reps,
            restTime: ex.restTime,
          })),
          imageUrl: originalWorkout.imageUrl,
          isCustom: true,
          createdAt: new Date().toISOString(),
        };
        
        // Add the new workout to the store
        addWorkout(newWorkout);
        
        return newWorkoutId;
      },
      
      getWorkoutsByMuscleGroup: (muscleGroup: string) => {
        const { workouts, exercises } = get();
        
        return workouts.filter(workout => {
          // Check if any exercise in the workout targets the specified muscle group
          return workout.exercises.some(workoutExercise => {
            const exercise = exercises.find(e => e.id === workoutExercise.id);
            return exercise && exercise.muscleGroups.some(group => group.name === muscleGroup);
          });
        });
      },
      
      // New functions for one-time vs recurring workouts
      getScheduledWorkoutsForDate: (date: Date) => {
        const { scheduledWorkouts } = get();
        
        return scheduledWorkouts.filter(sw => {
          // Check one-time workouts for exact date match
          if (sw.scheduleType === 'one-time' && sw.scheduledDate) {
            const scheduledDate = new Date(sw.scheduledDate);
            return (
              scheduledDate.getDate() === date.getDate() &&
              scheduledDate.getMonth() === date.getMonth() &&
              scheduledDate.getFullYear() === date.getFullYear()
            );
          }
          
          // Check recurring workouts for day of week match
          if (sw.scheduleType === 'recurring' && sw.dayOfWeek !== undefined) {
            // Check if this recurring workout has an end date
            if (sw.recurrenceEndDate) {
              const endDate = new Date(sw.recurrenceEndDate);
              // If the current date is after the end date, don't include this workout
              if (date > endDate) return false;
            }
            
            // Check if the day of week matches
            return sw.dayOfWeek === date.getDay();
          }
          
          return false;
        });
      },
      
      getRecurringWorkoutsForDay: (dayOfWeek: number) => {
        const { scheduledWorkouts } = get();
        
        return scheduledWorkouts.filter(sw => 
          sw.scheduleType === 'recurring' && 
          sw.dayOfWeek === dayOfWeek &&
          // Check if the recurring workout is still valid (hasn't ended)
          (!sw.recurrenceEndDate || new Date(sw.recurrenceEndDate) >= new Date())
        );
      },

      // New actions for editing completed workout logs
      updateWorkoutLog: (workoutLogId: string, updates: Partial<WorkoutLog>) => {
        set((state) => ({
          workoutLogs: state.workoutLogs.map(log => 
            log.id === workoutLogId ? { ...log, ...updates } : log
          )
        }));
      },

      updateWorkoutLogExercise: (workoutLogId: string, exerciseIndex: number, updates: Partial<ExerciseLog>) => {
        set((state) => ({
          workoutLogs: state.workoutLogs.map(log => 
            log.id === workoutLogId 
              ? {
                  ...log,
                  exercises: log.exercises.map((exercise, index) => 
                    index === exerciseIndex ? { ...exercise, ...updates } : exercise
                  )
                }
              : log
          )
        }));
      },

      updateWorkoutLogSet: (workoutLogId: string, exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => {
        set((state) => ({
          workoutLogs: state.workoutLogs.map(log => 
            log.id === workoutLogId 
              ? {
                  ...log,
                  exercises: log.exercises.map((exercise, exIndex) => 
                    exIndex === exerciseIndex 
                      ? {
                          ...exercise,
                          sets: exercise.sets.map((set, sIndex) => 
                            sIndex === setIndex ? { ...set, ...updates } : set
                          )
                        }
                      : exercise
                  )
                }
              : log
          )
        }));
      },

      addWorkoutLogSet: (workoutLogId: string, exerciseIndex: number, setData: WorkoutSet) => {
        set((state) => ({
          workoutLogs: state.workoutLogs.map(log => 
            log.id === workoutLogId 
              ? {
                  ...log,
                  exercises: log.exercises.map((exercise, index) => 
                    index === exerciseIndex 
                      ? { ...exercise, sets: [...exercise.sets, setData] }
                      : exercise
                  )
                }
              : log
          )
        }));
      },

      removeWorkoutLogSet: (workoutLogId: string, exerciseIndex: number, setIndex: number) => {
        set((state) => ({
          workoutLogs: state.workoutLogs.map(log => 
            log.id === workoutLogId 
              ? {
                  ...log,
                  exercises: log.exercises.map((exercise, exIndex) => 
                    exIndex === exerciseIndex 
                      ? {
                          ...exercise,
                          sets: exercise.sets.filter((_, sIndex) => sIndex !== setIndex)
                        }
                      : exercise
                  )
                }
              : log
          )
        }));
      },

      getWorkoutLog: (workoutLogId: string) => {
        const { workoutLogs } = get();
        return workoutLogs.find(log => log.id === workoutLogId) || null;
      },

      clearAllWorkoutLogs: () => {
        set((state) => ({
          workoutLogs: [],
          personalRecords: [], // Also clear personal records since they depend on workout logs
          activeWorkout: null // Clear any active workout
        }));
      },
    }),
    {
      name: "workout-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);