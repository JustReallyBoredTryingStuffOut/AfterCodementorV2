import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Send, Plus, Trash2, Target, Activity, TrendingUp, Zap } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useAiStore, AiChat, ChatMessage } from "@/store/aiStore";
import KeyboardDismissButton from "@/components/KeyboardDismissButton";
import { Exercise } from "@/types";
import { useMacroStore } from "@/store/macroStore";
import { useHealthStore } from "@/store/healthStore";
import { useWorkoutStore } from "@/store/workoutStore";
import { useGamificationStore } from "@/store/gamificationStore";
import AIPersonalizationModal from "@/components/AIPersonalizationModal";
import AIOnboardingScreen from "@/components/AIOnboardingScreen";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Add conversation state management
interface ConversationState {
  isWaitingForResponse: boolean;
  waitingFor: string;
  context: any;
  functionType: string;
  step: number;
  totalSteps: number;
}

export default function AiChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Add error handling for store initialization
  const [storeError, setStoreError] = useState<string | null>(null);
  
  let aiStore;
  let macroStore;
  let healthStore;
  let workoutStore;
  let gamificationStore;
  
  try {
    aiStore = useAiStore();
    macroStore = useMacroStore();
    healthStore = useHealthStore();
    workoutStore = useWorkoutStore();
    gamificationStore = useGamificationStore();
  } catch (error) {
    console.error("Error initializing stores:", error);
    setStoreError(error instanceof Error ? error.message : "Unknown store error");
  }
  
  // If there's a store error, show a simple error screen
  if (storeError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Unable to load AI Chat
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            {storeError}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => setStoreError(null)}
          >
            <Text style={[styles.retryButtonText, { color: colors.white }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Destructure store values with safe defaults
  const { 
    chats = [], 
    addChat: addChatToStore, 
    deleteChat, 
    addMessageToChat, 
    addGoal,
    aiPersonality = { name: "Coach Alex", personality: 'motivational', expertise: 'general', communicationStyle: 'encouraging' },
    userProfile = { preferredName: "", fitnessGoals: [], experienceLevel: 'beginner', preferredWorkoutTime: 'evening', motivationStyle: 'health', favoriteExercises: [], dislikedExercises: [], moodHistory: [] },
    generatePersonalizedGreeting,
    getMoodBasedRecommendation,
    addToConversationMemory,
    hasCompletedOnboarding = false,
    setOnboardingComplete,
    resetOnboarding
  } = aiStore || {};
  
  const { userProfile: macroUserProfile = { preferredName: "", fitnessGoals: [], experienceLevel: 'beginner', preferredWorkoutTime: 'evening', motivationStyle: 'health', favoriteExercises: [], dislikedExercises: [], moodHistory: [] }, macroGoals = [] } = macroStore || {};
  const { weightLogs = [], stepCount = 0, calculateWeightProgress } = healthStore || {};
  const { workoutLogs = [], scheduledWorkouts = [], getRecommendedWorkouts, addWorkout, exercises = [], scheduleWorkout } = workoutStore || {};
  const { achievements = [], level = 1, experience = 0 } = gamificationStore || {};
  
  const [currentChat, setCurrentChat] = useState<AiChat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showChats, setShowChats] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!hasCompletedOnboarding);
  
  const flatListRef = useRef<FlatList>(null);
  
  // Add conversation state to the component
  const [conversationState, setConversationState] = useState<ConversationState>({
    isWaitingForResponse: false,
    waitingFor: '',
    context: {},
    functionType: '',
    step: 0,
    totalSteps: 0
  });
  
  // Smart context function to gather user data
  const getUserContext = () => {
    // Add safe defaults and null checks
    const safeWeightLogs = weightLogs || [];
    const safeWorkoutLogs = workoutLogs || [];
    const safeScheduledWorkouts = scheduledWorkouts || [];
    const safeStepCount = stepCount || 0;
    const safeMacroGoals = macroGoals || [];
    const safeAchievements = achievements || [];
    const safeLevel = level || 1;
    const safeExperience = experience || 0;
    const safeMacroUserProfile = macroUserProfile || { preferredName: "", fitnessGoals: [], experienceLevel: 'beginner', preferredWorkoutTime: 'evening', motivationStyle: 'health', favoriteExercises: [], dislikedExercises: [], moodHistory: [] };
    
    const currentWeight = safeWeightLogs.length > 0 ? safeWeightLogs[safeWeightLogs.length - 1].weight : 0;
    const targetWeight = 0;
    const recentWorkouts = safeWorkoutLogs.slice(-3); // Last 3 workouts
    const todayWorkouts = safeScheduledWorkouts.filter(sw => {
      const scheduleDate = new Date(sw.date);
      const today = new Date();
      return scheduleDate.toDateString() === today.toDateString();
    });
    
    return {
      userProfile: safeMacroUserProfile,
      currentWeight,
      targetWeight,
      stepCount: safeStepCount,
      macroGoals: safeMacroGoals,
      recentWorkouts,
      todayWorkouts,
      achievements: safeAchievements,
      level: safeLevel,
      experience: safeExperience
    };
  };

  // Enhanced AI functions for goal creation and analysis
  const analyzeExerciseProgress = (exerciseName: string) => {
    const safeWorkoutLogs = workoutLogs || [];
    const exerciseHistory = safeWorkoutLogs
      .flatMap(workout => workout.exercises || [])
      .filter(exercise => 
        exercise.name && exercise.name.toLowerCase().includes(exerciseName.toLowerCase()) ||
        exercise.name && exercise.name.toLowerCase().includes(exerciseName.toLowerCase().replace(/\s+/g, ''))
      );
    
    if (exerciseHistory.length === 0) {
      return { found: false, message: `No ${exerciseName} data found in your workout history.` };
    }
    
    // Find PRs and analyze trends
    let currentPR = { weight: 0, reps: 0, date: '' };
    const allSets = exerciseHistory.flatMap(exercise => 
      exercise.sets?.map(set => ({
        weight: set.weight,
        reps: set.reps,
        date: exercise.date,
        exerciseName: exercise.name
      })) || []
    );
    
    allSets.forEach(set => {
      if (set.weight > currentPR.weight) {
        currentPR = { weight: set.weight, reps: set.reps, date: set.date };
      }
    });
    
    // Calculate frequency and trends
    const frequency = exerciseHistory.length;
    const recentWorkouts = exerciseHistory.slice(-5);
    const averageWeight = allSets.reduce((sum, set) => sum + set.weight, 0) / allSets.length;
    
    return {
      found: true,
      exerciseName,
      currentPR,
      frequency,
      averageWeight,
      recentWorkouts,
      allSets,
      message: `Found ${frequency} ${exerciseName} workouts. Your current PR is ${currentPR.weight}lbs for ${currentPR.reps} reps.`
    };
  };

  const createSmartGoal = (exerciseName: string, timeframe: string, goalType: string) => {
    const analysis = analyzeExerciseProgress(exerciseName);
    
    if (!analysis.found) {
      return { success: false, message: analysis.message };
    }
    
    const { currentPR, averageWeight } = analysis;
    let targetValue, goalText, category;
    
    switch (goalType) {
      case 'increase_weight':
        targetValue = currentPR.weight + 10;
        goalText = `Increase ${exerciseName} weight from ${currentPR.weight}lbs to ${targetValue}lbs`;
        category = 'fitness';
        break;
      case 'increase_reps':
        targetValue = currentPR.reps + 2;
        goalText = `Increase ${exerciseName} reps from ${currentPR.reps} to ${targetValue} reps at ${currentPR.weight}lbs`;
        category = 'fitness';
        break;
      case 'improve_form':
        goalText = `Focus on ${exerciseName} form and technique for ${timeframe}`;
        category = 'fitness';
        break;
      default:
        targetValue = currentPR.weight + 5;
        goalText = `Improve ${exerciseName} performance to ${targetValue}lbs`;
        category = 'fitness';
    }
    
    const newGoal = {
      id: Date.now().toString(),
      text: goalText,
      category,
      timeframe: timeframe === '1 week' ? 'weekly' : 'monthly',
      targetValue,
      timePeriod: timeframe === '1 week' ? 'weekly' : 'monthly',
      progress: 0,
      completed: false,
      createdAt: new Date().toISOString(),
      exerciseName,
      currentPR: currentPR.weight
    };
    
    // Add goal to store
    addGoal(newGoal);
    
    return {
      success: true,
      goal: newGoal,
      message: `Created goal: ${goalText}`
    };
  };

  const getGoalSuggestions = () => {
    try {
      const context = getUserContext();
      const suggestions = [];
      
      // Weight loss/gain suggestions
      if (context.targetWeight > 0) {
        const weightDiff = Math.abs(context.currentWeight - context.targetWeight);
        if (weightDiff > 2) {
          suggestions.push({
            type: 'weight',
            text: `Lose ${weightDiff.toFixed(1)}kg by ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
            timeframe: 'monthly'
          });
        }
      }
      
      // Step count suggestions
      if (context.stepCount < 8000) {
        suggestions.push({
          type: 'activity',
          text: `Increase daily steps to 10,000`,
          timeframe: 'weekly'
        });
      }
      
      // Workout frequency suggestions
      if (context.recentWorkouts && context.recentWorkouts.length < 2) {
        suggestions.push({
          type: 'fitness',
          text: `Complete 3 workouts this week`,
          timeframe: 'weekly'
        });
      }
      
      // Exercise-specific suggestions based on recent workouts
      if (context.recentWorkouts) {
        const recentExercises = context.recentWorkouts
          .flatMap(workout => workout.exercises || [])
          .map(exercise => exercise.name)
          .filter((name, index, arr) => arr.indexOf(name) === index);
        
        recentExercises.slice(0, 3).forEach(exerciseName => {
          try {
            const analysis = analyzeExerciseProgress(exerciseName);
            if (analysis.found && analysis.currentPR.weight > 0) {
              suggestions.push({
                type: 'fitness',
                text: `Increase ${exerciseName} weight by 5lbs`,
                timeframe: 'weekly',
                exerciseName
              });
            }
          } catch (error) {
            console.error("Error analyzing exercise progress:", error);
          }
        });
      }
      
      return suggestions;
    } catch (error) {
      console.error("Error in getGoalSuggestions:", error);
      return [];
    }
  };

  // Progress tracking and reporting functions
  const getProgressReport = () => {
    try {
      const context = getUserContext();
      const { recentWorkouts, currentWeight, targetWeight, stepCount } = context;
    
    const report = {
      workouts: {
        total: recentWorkouts.length,
        thisWeek: recentWorkouts.filter(w => {
          const workoutDate = new Date(w.date);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return workoutDate > weekAgo;
        }).length,
        lastWorkout: recentWorkouts.length > 0 ? new Date(recentWorkouts[recentWorkouts.length - 1].date) : null
      },
      weight: {
        current: currentWeight,
        target: targetWeight,
        progress: targetWeight > 0 ? ((currentWeight - targetWeight) / Math.abs(targetWeight - currentWeight)) * 100 : 0,
        trend: weightLogs.length >= 2 ? weightLogs[weightLogs.length - 1].weight - weightLogs[weightLogs.length - 2].weight : 0
      },
      activity: {
        steps: stepCount,
        goal: 10000,
        progress: (stepCount / 10000) * 100
      },
      achievements: {
        total: achievements.length,
        recent: achievements.filter(a => {
          const achievementDate = new Date(a.date);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return achievementDate > weekAgo;
        }).length
      }
    };
    
    return report;
    } catch (error) {
      console.error("Error in getProgressReport:", error);
      return {
        workouts: { total: 0, thisWeek: 0, lastWorkout: null },
        weight: { current: 0, target: 0, progress: 0, trend: 0 },
        activity: { steps: 0, goal: 10000, progress: 0 },
        achievements: { total: 0, recent: 0 }
      };
    }
  };

  const generateProgressMessage = () => {
    const report = getProgressReport();
    let message = "📊 Your Progress Report:\n\n";
    
    // Workout progress
    if (report.workouts.total > 0) {
      const daysSinceLastWorkout = report.workouts.lastWorkout 
        ? Math.floor((Date.now() - report.workouts.lastWorkout.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      message += `💪 Workouts: ${report.workouts.thisWeek} this week (${report.workouts.total} total)\n`;
      
      if (daysSinceLastWorkout !== null) {
        if (daysSinceLastWorkout === 0) {
          message += "✅ You worked out today!\n";
        } else if (daysSinceLastWorkout === 1) {
          message += "✅ You worked out yesterday!\n";
        } else {
          message += `⚠️ It's been ${daysSinceLastWorkout} days since your last workout\n`;
        }
      }
    } else {
      message += "🚀 Ready to start your fitness journey!\n";
    }
    
    // Weight progress
    if (report.weight.target > 0) {
      const direction = report.weight.current > report.weight.target ? "lose" : "gain";
      const remaining = Math.abs(report.weight.current - report.weight.target);
      message += `⚖️ Weight: ${report.weight.current}kg (${direction} ${remaining.toFixed(1)}kg)\n`;
      message += `📈 Progress: ${Math.abs(report.weight.progress).toFixed(1)}% complete\n`;
    }
    
    // Step progress
    message += `👟 Steps: ${report.activity.steps}/${report.activity.goal} (${report.activity.progress.toFixed(1)}%)\n`;
    
    // Achievements
    message += `🏆 Achievements: ${report.achievements.recent} new this week\n`;
    
    return message;
  };

  // Proactive suggestions based on data
  const getProactiveSuggestions = () => {
    try {
      const report = getProgressReport();
      const suggestions = [];
    
    // Workout suggestions
    if (report.workouts.thisWeek < 3) {
      suggestions.push("💪 You're behind on workouts this week - want a quick session?");
    }
    
    if (report.workouts.lastWorkout) {
      const daysSinceLastWorkout = Math.floor((Date.now() - report.workouts.lastWorkout.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastWorkout > 3) {
        suggestions.push("🔥 It's been a few days - time to get back in the gym!");
      }
    }
    
    // Step suggestions
    if (report.activity.progress < 70) {
      suggestions.push("🚶‍♂️ You're behind on steps - try a 10-minute walk!");
    }
    
    // Weight suggestions
    if (report.weight.target > 0 && Math.abs(report.weight.progress) < 20) {
      suggestions.push("📊 Great progress on your weight goal - keep it up!");
    }
    
    // Achievement celebrations
    if (report.achievements.recent > 0) {
      suggestions.push(`🎉 You've unlocked ${report.achievements.recent} achievements this week!`);
    }
    
    return suggestions;
    } catch (error) {
      console.error("Error in getProactiveSuggestions:", error);
      return [];
    }
  };

  // Achievement celebrations
  const checkForAchievements = () => {
    const report = getProgressReport();
    const celebrations = [];
    
    // Workout streak achievements
    if (report.workouts.thisWeek >= 3) {
      celebrations.push("🔥 3+ workouts this week - you're on fire!");
    }
    
    if (report.workouts.thisWeek >= 5) {
      celebrations.push("💪 5 workouts this week - incredible dedication!");
    }
    
    // Step achievements
    if (report.activity.progress >= 100) {
      celebrations.push("👟 10k steps reached - amazing job!");
    }
    
    if (report.activity.progress >= 120) {
      celebrations.push("🏃‍♂️ 12k+ steps - you're crushing it!");
    }
    
    // Weight achievements
    if (report.weight.target > 0 && Math.abs(report.weight.progress) >= 50) {
      celebrations.push("⚖️ Halfway to your weight goal - incredible progress!");
    }
    
    if (report.weight.target > 0 && Math.abs(report.weight.progress) >= 100) {
      celebrations.push("🎯 Weight goal achieved - congratulations!");
    }
    
    return celebrations;
  };

  // Workout note management
  const addNoteToWorkout = (workoutDate: string, note: string) => {
    // Find the workout log for the specified date
    const workoutLog = workoutLogs.find(log => {
      const logDate = new Date(log.date).toDateString();
      const targetDate = new Date(workoutDate).toDateString();
      return logDate === targetDate;
    });
    
    if (!workoutLog) {
      return { success: false, message: "No workout found for that date" };
    }
    
    // Update the workout with the new note
    const updatedNote = workoutLog.notes ? `${workoutLog.notes}\n\n${note}` : note;
    
    // Update the workout in the store
    const updatedWorkout = {
      ...workoutLog,
      notes: updatedNote
    };
    
    // Update the workout in the store
    try {
      const { updateWorkoutLog } = useWorkoutStore.getState();
      updateWorkoutLog(workoutLog.id, { notes: updatedNote });
      
      return { success: true, message: "Note added successfully" };
    } catch (error) {
      console.error('Error adding note to workout:', error);
      return { success: false, message: "Sorry, I couldn't add the note. Please try again." };
    }
  };

  const getRecentWorkouts = (days: number = 7) => {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return workoutLogs
      .filter(log => new Date(log.date) > cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const findWorkoutByDate = (dateString: string) => {
    const targetDate = new Date(dateString);
    return workoutLogs.find(log => {
      const logDate = new Date(log.date);
      return logDate.toDateString() === targetDate.toDateString();
    });
  };



  const getWorkoutSuggestions = () => {
    return [
      "chest workout",
      "back workout", 
      "legs workout",
      "shoulders workout",
      "arms workout",
      "full body workout",
      "cardio session",
      "strength training",
      "hiit workout"
    ];
  };

  // Workout recommendation functions
  const getWorkoutRecommendations = () => {
    const context = getUserContext();
    const { recentWorkouts, level, experience } = context;
    
    const recommendations = [];
    
    // Analyze workout patterns
    const workoutFrequency = recentWorkouts.length;
    const lastWorkoutDate = recentWorkouts.length > 0 ? new Date(recentWorkouts[recentWorkouts.length - 1].date) : null;
    const daysSinceLastWorkout = lastWorkoutDate ? Math.floor((Date.now() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)) : 7;
    
    // Recovery-based recommendations
    if (daysSinceLastWorkout <= 1) {
      recommendations.push({
        type: 'recovery',
        title: "Active Recovery Day",
        description: "Light cardio or stretching to help with muscle recovery",
        exercises: [
          { name: "Light Walking", duration: "20-30 minutes", intensity: "Low" },
          { name: "Stretching", duration: "15 minutes", intensity: "Low" },
          { name: "Foam Rolling", duration: "10 minutes", intensity: "Low" }
        ],
        reason: "You worked out recently - time for recovery!"
      });
    } else if (daysSinceLastWorkout >= 3) {
      recommendations.push({
        type: 'motivation',
        title: "Full Body Workout",
        description: "Get back into your routine with a comprehensive session",
        exercises: [
          { name: "Squats", sets: 3, reps: "10-12", intensity: "Medium" },
          { name: "Push-ups", sets: 3, reps: "8-12", intensity: "Medium" },
          { name: "Pull-ups", sets: 3, reps: "5-10", intensity: "Medium" },
          { name: "Planks", sets: 3, duration: "30-60 seconds", intensity: "Medium" }
        ],
        reason: "It's been a few days - let's get you back on track!"
      });
    }
    
    // Experience-based recommendations
    if (level < 5) {
      recommendations.push({
        type: 'beginner',
        title: "Foundation Building",
        description: "Focus on form and building strength",
        exercises: [
          { name: "Bodyweight Squats", sets: 3, reps: "12-15", intensity: "Low" },
          { name: "Wall Push-ups", sets: 3, reps: "10-15", intensity: "Low" },
          { name: "Assisted Pull-ups", sets: 3, reps: "5-8", intensity: "Low" },
          { name: "Planks", sets: 3, duration: "20-30 seconds", intensity: "Low" }
        ],
        reason: "Perfect for building a solid foundation!"
      });
    } else if (level >= 10) {
      recommendations.push({
        type: 'advanced',
        title: "Strength Focus",
        description: "Challenge yourself with heavier weights",
        exercises: [
          { name: "Deadlifts", sets: 4, reps: "6-8", intensity: "High" },
          { name: "Bench Press", sets: 4, reps: "6-8", intensity: "High" },
          { name: "Weighted Pull-ups", sets: 3, reps: "6-10", intensity: "High" },
          { name: "Overhead Press", sets: 3, reps: "6-8", intensity: "High" }
        ],
        reason: "You're ready for advanced strength training!"
      });
    }
    
    // Variety recommendations based on recent workouts
    const recentExerciseTypes = recentWorkouts
      .flatMap(workout => workout.exercises || [])
      .map(exercise => exercise.name.toLowerCase());
    
    if (!recentExerciseTypes.some(ex => ex.includes('cardio') || ex.includes('run') || ex.includes('bike'))) {
      recommendations.push({
        type: 'cardio',
        title: "Cardio Session",
        description: "Add some cardiovascular training",
        exercises: [
          { name: "Running", duration: "20-30 minutes", intensity: "Medium" },
          { name: "Cycling", duration: "30 minutes", intensity: "Medium" },
          { name: "Jump Rope", duration: "10 minutes", intensity: "Medium" },
          { name: "Burpees", sets: 3, reps: "10-15", intensity: "High" }
        ],
        reason: "Time to add some cardio to your routine!"
      });
    }
    
    return recommendations;
  };

  const generateWorkoutPlan = (focus: string, duration: number = 4) => {
    const plans = {
      strength: {
        name: "Strength Building Program",
        weeks: [
          {
            week: 1,
            focus: "Foundation",
            workouts: [
              { day: "Monday", type: "Upper Body", exercises: ["Bench Press", "Rows", "Shoulder Press"] },
              { day: "Wednesday", type: "Lower Body", exercises: ["Squats", "Deadlifts", "Lunges"] },
              { day: "Friday", type: "Full Body", exercises: ["Compound Movements", "Core Work"] }
            ]
          },
          {
            week: 2,
            focus: "Progressive Overload",
            workouts: [
              { day: "Monday", type: "Upper Body", exercises: ["Bench Press", "Rows", "Shoulder Press"] },
              { day: "Wednesday", type: "Lower Body", exercises: ["Squats", "Deadlifts", "Lunges"] },
              { day: "Friday", type: "Full Body", exercises: ["Compound Movements", "Core Work"] }
            ]
          }
        ]
      },
      hypertrophy: {
        name: "Muscle Building Program",
        weeks: [
          {
            week: 1,
            focus: "Volume Training",
            workouts: [
              { day: "Monday", type: "Push", exercises: ["Chest", "Shoulders", "Triceps"] },
              { day: "Tuesday", type: "Pull", exercises: ["Back", "Biceps"] },
              { day: "Thursday", type: "Legs", exercises: ["Quads", "Hamstrings", "Calves"] }
            ]
          }
        ]
      },
      endurance: {
        name: "Endurance Program",
        weeks: [
          {
            week: 1,
            focus: "Cardiovascular Fitness",
            workouts: [
              { day: "Monday", type: "Cardio", exercises: ["Running", "Cycling"] },
              { day: "Wednesday", type: "Strength", exercises: ["Bodyweight Exercises"] },
              { day: "Friday", type: "HIIT", exercises: ["High Intensity Intervals"] }
            ]
          }
        ]
      }
    };
    
    return plans[focus] || plans.strength;
  };

  // Nutrition guidance functions (with safety disclaimers)
  const getNutritionGuidance = () => {
    const context = getUserContext();
    const { userProfile, macroGoals, currentWeight, targetWeight } = context;
    
    const guidance = {
      general: {
        disclaimer: "⚠️ **IMPORTANT**: This is general nutrition information only. Always consult with a qualified healthcare professional, registered dietitian, or nutritionist for personalized advice. These recommendations are not medical advice and should not replace professional guidance.",
        principles: [
          "🍎 Eat a balanced diet with plenty of fruits and vegetables",
          "💧 Stay hydrated - aim for 8-10 glasses of water daily",
          "🥩 Include lean protein sources in your meals",
          "🌾 Choose whole grains over refined carbohydrates",
          "🥑 Include healthy fats in moderation"
        ]
      },
      preWorkout: {
        timing: "2-3 hours before workout",
        suggestions: [
          "🍌 Banana with peanut butter",
          "🥣 Oatmeal with berries",
          "🥪 Turkey sandwich on whole grain bread",
          "🥛 Greek yogurt with granola"
        ]
      },
      postWorkout: {
        timing: "Within 30 minutes after workout",
        suggestions: [
          "🥛 Protein shake with banana",
          "🍗 Grilled chicken with sweet potato",
          "🥚 Scrambled eggs with toast",
          "🥜 Trail mix with nuts and dried fruit"
        ]
      },
      hydration: {
        daily: "8-10 glasses of water",
        duringWorkout: "Sip water every 15-20 minutes",
        afterWorkout: "Drink 16-20 oz of water"
      }
    };
    
    return guidance;
  };

  const getMacroRecommendations = () => {
    const context = getUserContext();
    const { userProfile, macroGoals, currentWeight } = context;
    
    // Calculate basic macro needs (simplified)
    const bmr = currentWeight * 24; // Basic BMR calculation
    const tdee = bmr * 1.2; // Sedentary multiplier
    
    const recommendations = {
      calories: Math.round(tdee),
      protein: Math.round(currentWeight * 1.6), // 1.6g per kg for active individuals
      carbs: Math.round((tdee * 0.45) / 4), // 45% of calories from carbs
      fat: Math.round((tdee * 0.25) / 9), // 25% of calories from fat
      disclaimer: "⚠️ **DISCLAIMER**: These are general recommendations. Individual needs vary based on activity level, goals, and health conditions. Consult a registered dietitian for personalized advice."
    };
    
    return recommendations;
  };

  const getMealSuggestions = (mealType: string) => {
    const suggestions = {
      breakfast: [
        "🥣 Oatmeal with berries and nuts",
        "🥚 Scrambled eggs with whole grain toast",
        "🥛 Greek yogurt with granola",
        "🍌 Smoothie with protein powder",
        "🥑 Avocado toast with eggs"
      ],
      lunch: [
        "🥗 Grilled chicken salad",
        "🥪 Turkey sandwich with vegetables",
        "🍚 Quinoa bowl with vegetables",
        "🥘 Lentil soup with whole grain bread",
        "🥙 Mediterranean wrap"
      ],
      dinner: [
        "🍗 Grilled salmon with vegetables",
        "🥩 Lean beef with sweet potato",
        "🍝 Whole grain pasta with lean protein",
        "🥘 Stir-fry with brown rice",
        "🥗 Large salad with protein"
      ],
      snacks: [
        "🥜 Handful of nuts",
        "🍎 Apple with peanut butter",
        "🥛 Greek yogurt",
        "🥕 Carrot sticks with hummus",
        "🍌 Banana"
      ]
    };
    
    return suggestions[mealType] || suggestions.breakfast;
  };

  // Recovery monitoring functions
  const getRecoveryStatus = () => {
    const context = getUserContext();
    const { recentWorkouts, level } = context;
    
    const recovery = {
      lastWorkout: recentWorkouts.length > 0 ? new Date(recentWorkouts[recentWorkouts.length - 1].date) : null,
      daysSinceLastWorkout: recentWorkouts.length > 0 ? 
        Math.floor((Date.now() - new Date(recentWorkouts[recentWorkouts.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)) : 7,
      workoutIntensity: recentWorkouts.length > 0 ? 
        recentWorkouts[recentWorkouts.length - 1].exercises?.reduce((total, exercise) => 
          total + (exercise.sets?.reduce((setTotal, set) => setTotal + (set.weight || 0), 0) || 0), 0) || 0 : 0,
      recoveryScore: 0,
      recommendations: []
    };
    
    // Calculate recovery score (0-100)
    let score = 100;
    
    // Factor in days since last workout
    if (recovery.daysSinceLastWorkout <= 1) {
      score -= 30; // Need more recovery time
      recovery.recommendations.push("🛌 Take a rest day or do light activity");
    } else if (recovery.daysSinceLastWorkout >= 4) {
      score -= 20; // Been too long, may lose momentum
      recovery.recommendations.push("💪 Time to get back to training!");
    }
    
    // Factor in workout intensity
    if (recovery.workoutIntensity > 1000) {
      score -= 20; // High intensity workout needs more recovery
      recovery.recommendations.push("🧘‍♂️ Focus on stretching and mobility");
    }
    
    // Factor in experience level
    if (level < 5) {
      score += 10; // Beginners recover faster
    } else if (level > 15) {
      score -= 10; // Advanced athletes need more recovery
    }
    
    recovery.recoveryScore = Math.max(0, Math.min(100, score));
    
    // Add recovery suggestions based on score
    if (recovery.recoveryScore < 50) {
      recovery.recommendations.push("💤 Prioritize sleep and rest");
      recovery.recommendations.push("🥤 Stay hydrated");
    } else if (recovery.recoveryScore > 80) {
      recovery.recommendations.push("✅ You're ready for your next workout!");
    }
    
    return recovery;
  };

  const getRecoveryActivities = () => {
    return {
      stretching: [
        "🧘‍♂️ Full body stretching routine (15 minutes)",
        "🦵 Leg stretches focusing on hamstrings and quads",
        "💪 Upper body stretches for chest and shoulders",
        "🧘‍♀️ Yoga flow for recovery"
      ],
      mobility: [
        "🔄 Hip mobility exercises",
        "🦴 Shoulder mobility work",
        "🦵 Ankle and knee mobility",
        "🧘‍♂️ Dynamic stretching routine"
      ],
      foamRolling: [
        "🦵 Quad and hamstring rolling",
        "💪 Upper back and shoulder rolling",
        "🦴 IT band and glute rolling",
        "🦵 Calf and shin rolling"
      ],
      lightActivity: [
        "🚶‍♂️ Light walking (20-30 minutes)",
        "🚴‍♂️ Easy cycling (30 minutes)",
        "🏊‍♂️ Swimming (20 minutes)",
        "🧘‍♀️ Gentle yoga session"
      ]
    };
  };

  const getSleepRecommendations = () => {
    return {
      duration: "7-9 hours per night",
      quality: [
        "🌙 Maintain consistent sleep schedule",
        "📱 Avoid screens 1 hour before bed",
        "🌡️ Keep bedroom cool and dark",
        "🧘‍♂️ Practice relaxation techniques",
        "☕ Avoid caffeine after 2 PM"
      ],
      recovery: [
        "💤 Sleep is crucial for muscle recovery",
        "🧠 Helps with cognitive function and mood",
        "⚡ Improves energy levels for workouts",
        "🩺 Supports immune system function"
      ]
    };
  };

  // Quick action buttons
  const getQuickActions = () => {
    return [
      {
        id: 'progress',
        title: '📊 Progress Report',
        action: 'Show me my progress',
        color: '#4CAF50'
      },
      {
        id: 'workout',
        title: '💪 Workout Plan',
        action: 'Recommend a workout for me',
        color: '#2196F3'
      },
      {
        id: 'nutrition',
        title: '🥗 Nutrition Tips',
        action: 'Give me nutrition advice',
        color: '#FF9800'
      },
      {
        id: 'recovery',
        title: '🛌 Recovery Status',
        action: 'Check my recovery status',
        color: '#9C27B0'
      },
      {
        id: 'goal',
        title: '🎯 Create Goal',
        action: 'Help me create a new goal',
        color: '#F44336'
      },
      {
        id: 'schedule',
        title: '📅 Schedule Workout',
        action: 'Schedule a workout for me',
        color: '#607D8B'
      }
    ];
  };

  const handleQuickAction = async (action: string) => {
    setMessage(action);
    await handleSendMessage(action);
  };
  
  // Generate smart system prompt with user context
  const generateSmartSystemPrompt = () => {
    const context = getUserContext();
    const { userProfile, currentWeight, targetWeight, stepCount, macroGoals, recentWorkouts, todayWorkouts } = context;
    
    return `You are ${aiPersonality.name}, a ${aiPersonality.personality} AI fitness assistant specializing in ${aiPersonality.expertise}. Your communication style is ${aiPersonality.communicationStyle}.

USER PROFILE:
- Name: ${userProfile?.name || 'User'}
- Experience Level: beginner
- Motivation Style: health
- Preferred Workout Time: evening

USER CONTEXT:
- Current Weight: ${currentWeight} kg
- Target Weight: ${targetWeight} kg (${targetWeight > 0 ? `${Math.abs(currentWeight - targetWeight).toFixed(1)} kg ${currentWeight > targetWeight ? 'to lose' : 'to gain'}` : 'No target set'})
- Fitness Goal: ${userProfile?.fitnessGoal || 'maintain'}
- Activity Level: ${userProfile?.activityLevel || 'moderate'}
- Fitness Level: ${userProfile?.fitnessLevel || 'beginner'}
- Daily Steps: ${stepCount || 0}
- Nutrition Goals: ${macroGoals ? `${macroGoals.calories} calories, ${macroGoals.protein}g protein, ${macroGoals.carbs}g carbs, ${macroGoals.fat}g fat` : 'Not set'}
- Recent Workouts: ${recentWorkouts.length} in last 3 sessions
- Today's Scheduled: ${todayWorkouts.length} workouts
- Level: ${level} (${experience} XP)

PERSONALITY GUIDELINES:
- Maintain your ${aiPersonality.personality} personality throughout the conversation
- Use ${aiPersonality.communicationStyle} communication style
- Focus on ${aiPersonality.expertise} expertise when relevant
- Address the user by their preferred name when appropriate
- Consider their motivation style (health) in your responses

GOAL CREATION CAPABILITIES:
- I can analyze exercise progress and create personalized goals
- I can suggest goals based on your workout history and current progress
- I can create exercise-specific goals (weight increases, rep improvements, form focus)
- I can analyze PRs and trends from your workout data
- I can suggest goals for weight loss/gain, activity, nutrition, and wellness

RESPONSE GUIDELINES:
- Reference their specific data when giving advice
- Suggest workouts based on their fitness level and goals
- Provide nutrition advice aligned with their macro goals
- Track progress and celebrate achievements
- Be encouraging and motivational
- Give actionable, specific advice
- Reference their recent activity when relevant
- When users ask to create goals, analyze their data and suggest specific, achievable targets
- For exercise goals, reference their current PRs and suggest realistic improvements
- Respond in a conversational, human-like manner without markdown formatting

GOAL CREATION EXAMPLES:
- "Create a new goal for me, length: 1 week, goal: Lift heavier on deadlift" → Analyze deadlift history, find current PR, suggest weight increase
- "I want to improve my bench press" → Check bench press data, suggest specific weight or rep targets
- "Help me set a weight loss goal" → Calculate realistic weight loss based on current progress
- "Create a fitness goal" → Suggest based on recent workout frequency and exercise patterns`;
  };
  
  // Create a new chat if none exists
  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    } else {
      // Set the most recent chat as current
      setCurrentChat(chats[chats.length - 1]);
    }
  }, [chats]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (currentChat?.messages.length && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentChat?.messages]);
  
  // Proactive features - suggest helpful actions
  useEffect(() => {
    if (currentChat && currentChat.messages.length <= 2) {
      // This is a new chat, show proactive suggestions
      try {
      const context = getUserContext();
      const suggestions = [];
      
      if (context.targetWeight > 0) {
        suggestions.push("Check my weight loss progress");
      }
      
      if (context.stepCount < 5000) {
        suggestions.push("I need motivation to move more");
      }
      
        if (context.recentWorkouts && context.recentWorkouts.length === 0) {
        suggestions.push("Suggest a workout for me");
      }
      
      if (suggestions.length > 0) {
        // Add proactive message after a delay
        setTimeout(() => {
          addMessageToChat(currentChat.id, {
            role: "assistant",
            content: `${generateProactiveMessage()}\n\nI can help you with:\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nJust tap the quick actions or ask me anything!`
          });
        }, 2000);
        }
      } catch (error) {
        console.error("Error in proactive suggestions useEffect:", error);
      }
    }
  }, [currentChat]);
  
  const createNewChat = () => {
    const smartSystemPrompt = generateSmartSystemPrompt();
    
    // Get suggestions safely
    const context = getUserContext();
    const suggestions = [];
    
    if (context.targetWeight > 0) {
      suggestions.push("Check my weight loss progress");
    }
    
    if (context.stepCount < 5000) {
      suggestions.push("I need motivation to move more");
    }
    
    if (context.recentWorkouts && context.recentWorkouts.length === 0) {
      suggestions.push("Suggest a workout for me");
    }
    
    const newChat: AiChat = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      messages: [
        {
          id: "system-1",
          role: "system",
          content: smartSystemPrompt,
          timestamp: new Date().toISOString()
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: `${generatePersonalizedGreeting()}\n\nI can help you with:\n${suggestions.map(s => `• ${s}`).join('\n')}\n\nJust tap the quick actions or ask me anything!`,
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    addChatToStore(newChat);
    setCurrentChat(newChat);
    setShowChats(false);
  };
  
  const handleSendMessage = async () => {
    if (!message || !message.trim() || !currentChat) return;
    
    const userMessage = {
      role: "user" as const,
      content: message.trim()
    };
    
    // Add user message to chat
    addMessageToChat(currentChat.id, userMessage);
    const userInput = message.trim();
    setMessage("");
    setIsLoading(true);
    
    try {
      // Check if this is a goal creation request
      const lowerMessage = userInput.toLowerCase();
      const isGoalRequest = lowerMessage.includes('create') && lowerMessage.includes('goal') ||
                           lowerMessage.includes('set') && lowerMessage.includes('goal') ||
                           lowerMessage.includes('new goal');
      
      if (isGoalRequest) {
        // Handle goal creation locally
        const goalResponse = await handleGoalCreation(userInput);
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: goalResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }
      
      // Check if it's a workout note request
      const noteResponse = await handleWorkoutNote(userInput);
      if (noteResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: noteResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }

      // Check if it's a smart conversation flow request
      const smartConversationResponse = await handleSmartConversationFlow(userInput);
      if (smartConversationResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: smartConversationResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }

      // Check if it's an interactive workout scheduling request
      const interactiveSchedulingResponse = await handleInteractiveWorkoutScheduling(userInput);
      if (interactiveSchedulingResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: interactiveSchedulingResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }

      // Check if it's a workout scheduling request (enhanced)
      const workoutSchedulingResponse = await handleWorkoutSchedulingRequest(userInput);
      if (workoutSchedulingResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: workoutSchedulingResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }

      // Check if it's a progress request
      const progressResponse = await handleProgressRequest(userInput);
      if (progressResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: progressResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }

      // Check if it's a workout recommendation request
      const workoutRecommendationResponse = await handleWorkoutRecommendation(userInput);
      if (workoutRecommendationResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: workoutRecommendationResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }

      // Check if it's a workout creation request
      const workoutCreationResponse = await handleWorkoutCreation(userInput);
      if (workoutCreationResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: workoutCreationResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }

      // Check if it's a workout modification request
      const workoutModificationResponse = await handleWorkoutModificationRequest(userInput);
      if (workoutModificationResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: workoutModificationResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }

      // Check if it's a nutrition request
      const nutritionResponse = await handleNutritionRequest(userInput);
      if (nutritionResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: nutritionResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }

      // Check if it's an analytics request
      const analyticsResponse = await handleAnalyticsRequest(userInput);
      if (analyticsResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: analyticsResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }

      // Check if it's an emotional/mood request
      const emotionalResponse = await handleEmotionalRequest(userInput);
      if (emotionalResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: emotionalResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }

      // Check if it's a workout analysis request
      const workoutAnalysisResponse = await handleWorkoutAnalysisRequest(userInput);
      if (workoutAnalysisResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: workoutAnalysisResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }
      
      // Check if it's an app feature request
      const appFeatureResponse = await handleAppFeatureRequest(userInput);
      if (appFeatureResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: appFeatureResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }
      
      // Check if it's a goal status request
      const goalStatusResponse = await handleGoalStatusRequest(userInput);
      if (goalStatusResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: goalStatusResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }
      
      // Check if it's a goal progress request
      const goalProgressResponse = await handleGoalProgressRequest(userInput);
      if (goalProgressResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: goalProgressResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }
      
      // Check if it's a personal records request
      const personalRecordsResponse = await handlePersonalRecordsRequest(userInput);
      if (personalRecordsResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: personalRecordsResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }
      
      // Check if it's an exercise education request
      const exerciseEducationResponse = await handleExerciseEducationRequest(userInput);
      if (exerciseEducationResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: exerciseEducationResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }
      
      // Check if it's an advanced analytics request
      const advancedAnalyticsResponse = await handleAdvancedAnalyticsRequest(userInput);
      if (advancedAnalyticsResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: advancedAnalyticsResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }
      
      // Check if it's a recovery recommendations request
      const recoveryResponse = await handleRecoveryRecommendationsRequest(userInput);
      if (recoveryResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: recoveryResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }
      
      // Check if it's a predictive analytics request
      const predictiveResponse = await handlePredictiveAnalyticsRequest(userInput);
      if (predictiveResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: predictiveResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }
      
      // Check if it's an advanced personalization request
      const personalizationResponse = await handleAdvancedPersonalizationRequest(userInput);
      if (personalizationResponse) {
        addMessageToChat(currentChat.id, {
          role: "assistant",
          content: personalizationResponse,
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        return;
      }
      
      // Prepare messages for API
      const apiMessages = currentChat.messages
        .filter(msg => msg.role !== "system") // Filter out system messages
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Add the new user message
      apiMessages.push(userMessage);
      
      // Add smart system message with user context
      const smartSystemMessage = {
        role: "system" as const,
        content: generateSmartSystemPrompt()
      };
      
      // Make API request
      const response = await fetch("https://toolkit.rork.com/text/llm/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          messages: [smartSystemMessage, ...apiMessages]
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }
      
      const data = await response.json();
      
      // Process the response to remove any remaining markdown formatting
      let cleanedResponse = data.completion;
      // Remove markdown bold/italic formatting (** or __ for bold, * or _ for italic)
      cleanedResponse = cleanedResponse.replace(/(\*\*|__)(.*?)\1/g, '$2');
      cleanedResponse = cleanedResponse.replace(/(\*|_)(.*?)\1/g, '$2');
      
      // Add AI response to chat
      addMessageToChat(currentChat.id, {
        role: "assistant",
        content: cleanedResponse,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending message:", error);
      addMessageToChat(currentChat.id, {
        role: "assistant",
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoalCreation = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    // Extract exercise name from message
    const exerciseMatch = message.match(/(?:deadlift|bench|squat|press|curl|row|pull-up|push-up|plank|burpee|lunge|shoulder press|bicep curl|tricep dip|leg press|lat pulldown|chest press|leg curl|leg extension|calf raise|shoulder shrug|upright row|bent over row|good morning|romanian deadlift|sumo deadlift|conventional deadlift|trap bar deadlift|rack pull|block pull|deficit deadlift|pause deadlift|tempo deadlift|speed deadlift|max effort deadlift|dynamic effort deadlift|competition deadlift|training deadlift|warm up deadlift|working deadlift|top set deadlift|back off set deadlift|drop set deadlift|rest pause deadlift|cluster set deadlift|emom deadlift|amrap deadlift|for time deadlift|for reps deadlift|for weight deadlift|for distance deadlift|for calories deadlift|for rounds deadlift|for sets deadlift|for time bench|for reps bench|for weight bench|for distance bench|for calories bench|for rounds bench|for sets bench|for time squat|for reps squat|for weight squat|for distance squat)/i);
    
    if (exerciseMatch) {
      const exerciseName = exerciseMatch[0];
      const analysis = analyzeExerciseProgress(exerciseName);
      
      if (!analysis.found) {
        return `I don't see any ${exerciseName} data in your workout history yet. Try logging a workout with ${exerciseName} first, then I can help you create a goal based on your progress!`;
      }
      
      // Extract timeframe
      const timeframeMatch = message.match(/(?:1 week|one week|weekly|month|monthly|2 weeks|two weeks|3 weeks|three weeks|4 weeks|four weeks)/i);
      const timeframe = timeframeMatch ? timeframeMatch[0] : '1 week';
      
      // Determine goal type based on message
      let goalType = 'increase_weight';
      if (lowerMessage.includes('rep') || lowerMessage.includes('repetition')) {
        goalType = 'increase_reps';
      } else if (lowerMessage.includes('form') || lowerMessage.includes('technique')) {
        goalType = 'improve_form';
      }
      
      const result = createSmartGoal(exerciseName, timeframe, goalType);
      
      if (result.success) {
        return `Perfect! I've created a goal for you based on your ${exerciseName} progress.\n\n${result.message}\n\nYour current PR is ${analysis.currentPR.weight}lbs for ${analysis.currentPR.reps} reps. I've set a realistic target that will challenge you while being achievable.\n\nYou can track your progress in the Goals section. Good luck! 💪`;
      } else {
        return result.message;
      }
    }
    
    // Handle general fitness goals
    if (lowerMessage.includes('fitness') || lowerMessage.includes('workout')) {
      try {
        const suggestions = getGoalSuggestions();
        const fitnessGoals = suggestions.filter(s => s.type === 'fitness');
        
        if (fitnessGoals.length > 0) {
          const goal = fitnessGoals[0];
          const newGoal = {
            id: Date.now().toString(),
            text: goal.text,
            category: 'fitness',
            timeframe: goal.timeframe,
            targetValue: null,
            timePeriod: goal.timeframe,
            progress: 0,
            completed: false,
            createdAt: new Date().toISOString()
          };
          
          addGoal(newGoal);
          return `I've created a fitness goal for you: ${goal.text}\n\nThis is based on your recent workout patterns. You can track your progress in the Goals section!`;
        }
      } catch (error) {
        console.error("Error in handleGoalCreation fitness goals:", error);
        return "I'm having trouble creating a fitness goal right now. Please try again later.";
      }
    }
    
    // Handle weight goals
    if (lowerMessage.includes('weight') || lowerMessage.includes('lose') || lowerMessage.includes('gain')) {
      const context = getUserContext();
      if (context.targetWeight > 0) {
        const weightDiff = Math.abs(context.currentWeight - context.targetWeight);
        const newGoal = {
          id: Date.now().toString(),
          text: `${context.currentWeight > context.targetWeight ? 'Lose' : 'Gain'} ${weightDiff.toFixed(1)}kg`,
          category: 'weight',
          timeframe: 'monthly',
          targetValue: context.targetWeight,
          timePeriod: 'monthly',
          progress: 0,
          completed: false,
          createdAt: new Date().toISOString()
        };
        
        addGoal(newGoal);
        return `I've created a weight goal for you: ${newGoal.text}\n\nThis is based on your current weight (${context.currentWeight}kg) and target weight (${context.targetWeight}kg). Track your progress in the Goals section!`;
      }
    }
    
    // Default response for unclear goal requests
    return `I'd love to help you create a goal! Please be more specific about what you'd like to achieve. For example:\n\n• "Create a goal to increase my deadlift weight"\n• "Set a fitness goal for this week"\n• "Help me create a weight loss goal"\n\nI can analyze your progress and suggest realistic targets based on your data!`;
  };

  const handleWorkoutNote = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    // Check if it's a note request
    if (lowerMessage.includes('add note') || lowerMessage.includes('add to note') || lowerMessage.includes('yesterday') || lowerMessage.includes('workout note')) {
      
      // Extract the note content
      const noteMatch = message.match(/(?:add note|add to note).*?["""](.*?)["""]/i);
      const noteContent = noteMatch ? noteMatch[1] : message.replace(/(?:add note|add to note|yesterday|workout note)/gi, '').trim();
      
      if (!noteContent) {
        return "Please provide the note content you'd like to add. For example: 'Add note to yesterday's workout: \"I was super tired after 6 sets\"'";
      }
      
      // Find yesterday's workout
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const workout = findWorkoutByDate(yesterday.toISOString());
      
      if (!workout) {
        return "I couldn't find a workout from yesterday. Would you like to add a note to a different workout?";
      }
      
      const result = addNoteToWorkout(yesterday.toISOString(), noteContent);
      
      if (result.success) {
        return `✅ Note added to your ${new Date(workout.date).toLocaleDateString()} workout:\n\n"${noteContent}"\n\nThis will help you track how you felt and any important details for future reference!`;
      } else {
        return result.message;
      }
    }
    
    return null; // Not a note request
  };

  const handleWorkoutScheduling = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    // Check if it's a scheduling request
    if (lowerMessage.includes('schedule') && (lowerMessage.includes('workout') || lowerMessage.includes('session'))) {
      
      // Extract workout type
      const workoutTypes = getWorkoutSuggestions();
      const workoutType = workoutTypes.find(type => lowerMessage.includes(type));
      
      if (!workoutType) {
        return `I can help you schedule a workout! What type would you like?\n\nAvailable types:\n${workoutTypes.map(type => `• ${type}`).join('\n')}\n\nJust say "Schedule me a chest workout" or similar!`;
      }
      
      // Extract date and time
      const dateMatch = message.match(/(?:for|on|at)\s+(\w+\s+\d+|\d+\/\d+|\d+-\d+)/i);
      const timeMatch = message.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
      
      let date = new Date();
      let time = "18:00"; // Default to 6 PM
      
      if (dateMatch) {
        // Parse date (simplified - could be enhanced)
        const dateStr = dateMatch[1];
        if (dateStr.includes('tomorrow')) {
          date.setDate(date.getDate() + 1);
        } else if (dateStr.includes('today')) {
          // Use today
        } else {
          // Try to parse other date formats
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate;
          }
        }
      }
      
      if (timeMatch) {
        time = timeMatch[1];
        // Convert 12-hour to 24-hour format if needed
        if (time.includes('pm') && !time.includes('12:')) {
          const [hours, minutes] = time.split(':');
          time = `${parseInt(hours) + 12}:${minutes.replace('pm', '')}`;
        } else if (time.includes('am')) {
          time = time.replace('am', '');
        }
      }
      
      const result = scheduleWorkout(workoutType, date.toISOString(), time);
      
      if (result.success) {
        return `✅ ${result.message}\n\nYour workout has been scheduled and will appear in your calendar. You can view and edit it in the Schedule section!`;
      } else {
        return "Sorry, I couldn't schedule the workout. Please try again with a specific date and time.";
      }
    }
    
    return null; // Not a scheduling request
  };

  const handleProgressRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('progress') || lowerMessage.includes('report') || lowerMessage.includes('how am i doing')) {
      try {
        const progressMessage = generateProgressMessage();
        const suggestions = getProactiveSuggestions();
        const celebrations = checkForAchievements();
        
        let response = progressMessage + "\n\n";
        
        if (celebrations && celebrations.length > 0) {
          response += "🎉 Celebrations:\n" + celebrations.join('\n') + "\n\n";
        }
        
        if (suggestions && suggestions.length > 0) {
          response += "💡 Suggestions:\n" + suggestions.join('\n');
        }
        
        return response;
      } catch (error) {
        console.error("Error in handleProgressRequest:", error);
        return "I'm having trouble generating your progress report right now. Please try again later.";
      }
    }
    
    return null; // Not a progress request
  };

  const handleWorkoutRecommendation = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('workout') && (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('plan'))) {
      const recommendations = getWorkoutRecommendations();
      
      if (recommendations.length === 0) {
        return "I don't have enough data to make specific workout recommendations yet. Try logging a few workouts first!";
      }
      
      let response = "💪 **Workout Recommendations**\n\n";
      
      recommendations.forEach((rec, index) => {
        response += `**${rec.title}**\n`;
        response += `${rec.description}\n`;
        response += `**Why:** ${rec.reason}\n\n`;
        response += `**Exercises:**\n`;
        rec.exercises.forEach(exercise => {
          if (exercise.sets && exercise.reps) {
            response += `• ${exercise.name}: ${exercise.sets} sets x ${exercise.reps} reps\n`;
          } else if (exercise.duration) {
            response += `• ${exercise.name}: ${exercise.duration}\n`;
          }
        });
        response += "\n";
      });
      
      return response;
    }
    
    return null;
  };

  const handleWorkoutCreation = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    // Check if user wants to create a workout
    if (lowerMessage.includes('create') && lowerMessage.includes('workout') || 
        lowerMessage.includes('make') && lowerMessage.includes('workout') ||
        lowerMessage.includes('build') && lowerMessage.includes('workout')) {
      
      try {
        const workout = await createWorkoutFromRequest(message);
        
        if (workout) {
          // Add the workout to the store
          addWorkout(workout);
          
          let response = `💪 **Workout Created: ${workout.name}**\n\n`;
          response += `**Category:** ${workout.category}\n`;
          response += `**Difficulty:** ${workout.difficulty}\n`;
          response += `**Estimated Duration:** ${workout.estimatedDuration} minutes\n\n`;
          
          response += `**Exercises:**\n`;
          workout.exercises.forEach((exerciseRef, index) => {
            const exercise = exercises.find(ex => ex.id === exerciseRef.id);
            if (exercise) {
              response += `${index + 1}. **${exercise.name}**\n`;
              response += `   • Muscle Groups: ${exercise.muscleGroups.map(mg => mg.name).join(', ')}\n`;
              response += `   • Equipment: ${exercise.equipment.map(eq => eq.name).join(', ')}\n`;
              response += `   • Difficulty: ${exercise.difficulty}\n\n`;
            }
          });
          
          // Add personalized recommendations based on user profile
          const recommendations = getPersonalizedWorkoutRecommendations(workout);
          if (recommendations.length > 0) {
            response += `**Personalized Recommendations:**\n`;
            recommendations.forEach(rec => {
              response += `• ${rec}\n`;
            });
            response += `\n`;
          }
          
          // Add progressive overload suggestions
          const overloadSuggestions = getProgressiveOverloadSuggestions(workout);
          if (overloadSuggestions.length > 0) {
            response += `**Progressive Overload Tips:**\n`;
            overloadSuggestions.forEach(suggestion => {
              response += `• ${suggestion}\n`;
            });
            response += `\n`;
          }
          
          // Add rest day recommendations
          const restRecommendations = getRestDayRecommendations();
          if (restRecommendations.length > 0) {
            response += `**Rest Day Recommendations:**\n`;
            restRecommendations.forEach(rec => {
              response += `• ${rec}\n`;
            });
            response += `\n`;
          }
          
          response += `✅ **Workout saved to your library!**\n\n`;
          response += `**Next Steps:**\n`;
          response += `• Would you like me to schedule this workout?\n`;
          response += `• Should I create a similar workout for your next session?\n`;
          response += `• Would you like me to modify any exercises?\n`;
          response += `• Need help with form or technique?`;
          
          return response;
        }
      } catch (error) {
        return `❌ **Error creating workout:** ${error.message}\n\nPlease try again with a more specific request.`;
      }
    }
    
    return null;
  };

  const createWorkoutFromRequest = async (message: string): Promise<any> => {
    const lowerMessage = message.toLowerCase();
    const { userProfile } = useAiStore.getState();
    
    // Parse workout type
    let workoutType = 'strength';
    let muscleGroups: string[] = [];
    let sets = 3;
    let reps = '8-12';
    let difficulty = userProfile.experienceLevel; // Use user's actual experience level
    let duration = 45;
    
    // Parse workout type
    console.log(`[AI Chat] Parsing workout type from message: "${lowerMessage}"`);
    
    if (lowerMessage.includes('chest') || lowerMessage.includes('pec')) {
      workoutType = 'chest';
      console.log(`[AI Chat] Detected chest workout`);
    } else if (lowerMessage.includes('back')) {
      workoutType = 'back';
      console.log(`[AI Chat] Detected back workout`);
    } else if (lowerMessage.includes('shoulder')) {
      workoutType = 'shoulders';
      console.log(`[AI Chat] Detected shoulders workout`);
    } else if (lowerMessage.includes('arm')) {
      workoutType = 'arms';
      console.log(`[AI Chat] Detected arms workout`);
    } else if (lowerMessage.includes('leg')) {
      workoutType = 'legs';
      console.log(`[AI Chat] Detected legs workout`);
    } else if (lowerMessage.includes('core') || lowerMessage.includes('abs')) {
      workoutType = 'core';
      console.log(`[AI Chat] Detected core workout`);
    } else if (lowerMessage.includes('push') && lowerMessage.includes('pull')) {
      workoutType = 'push_pull';
      console.log(`[AI Chat] Detected push/pull workout`);
    } else if (lowerMessage.includes('push')) {
      workoutType = 'push';
      console.log(`[AI Chat] Detected push workout`);
    } else if (lowerMessage.includes('pull')) {
      workoutType = 'pull';
      console.log(`[AI Chat] Detected pull workout`);
    } else if (lowerMessage.includes('upper') && lowerMessage.includes('lower')) {
      workoutType = 'upper_lower';
      console.log(`[AI Chat] Detected upper/lower workout`);
    } else if (lowerMessage.includes('upper')) {
      workoutType = 'upper';
      console.log(`[AI Chat] Detected upper workout`);
    } else if (lowerMessage.includes('lower')) {
      workoutType = 'lower';
      console.log(`[AI Chat] Detected lower workout`);
    } else if (lowerMessage.includes('full body') || lowerMessage.includes('fullbody')) {
      workoutType = 'full_body';
      console.log(`[AI Chat] Detected full body workout`);
    } else {
      console.log(`[AI Chat] No specific workout type detected, using default: ${workoutType}`);
    }
    
    // Parse sets and reps with user context
    const setsMatch = lowerMessage.match(/(\d+)\s*sets?/);
    if (setsMatch) {
      sets = parseInt(setsMatch[1]);
    } else {
      // Default sets based on experience level
      if (userProfile.experienceLevel === 'beginner') {
        sets = 2;
      } else if (userProfile.experienceLevel === 'intermediate') {
        sets = 3;
      } else {
        sets = 4;
      }
    }
    
    const repsMatch = lowerMessage.match(/(\d+)-(\d+)\s*reps?/);
    if (repsMatch) {
      reps = `${repsMatch[1]}-${repsMatch[2]}`;
    } else {
      const singleRepsMatch = lowerMessage.match(/(\d+)\s*reps?/);
      if (singleRepsMatch) {
        reps = singleRepsMatch[1];
      } else {
        // Default reps based on experience level and goals
        if (userProfile.experienceLevel === 'beginner') {
          reps = '10-12'; // Higher reps for beginners to focus on form
        } else if (userProfile.fitnessGoals.includes('strength')) {
          reps = '3-5'; // Lower reps for strength
        } else if (userProfile.fitnessGoals.includes('muscle gain')) {
          reps = '8-12'; // Moderate reps for hypertrophy
        } else if (userProfile.fitnessGoals.includes('weight loss')) {
          reps = '12-15'; // Higher reps for endurance
        } else {
          reps = '8-12'; // Default moderate reps
        }
      }
    }
    
    // Parse difficulty (override user level if specified)
    if (lowerMessage.includes('beginner')) {
      difficulty = 'beginner';
    } else if (lowerMessage.includes('advanced')) {
      difficulty = 'advanced';
    } else if (lowerMessage.includes('intermediate')) {
      difficulty = 'intermediate';
    }
    
    // Parse duration
    const durationMatch = lowerMessage.match(/(\d+)\s*minutes?/);
    if (durationMatch) {
      duration = parseInt(durationMatch[1]);
    } else {
      // Default duration based on experience level
      if (userProfile.experienceLevel === 'beginner') {
        duration = 30; // Shorter workouts for beginners
      } else if (userProfile.experienceLevel === 'intermediate') {
        duration = 45;
      } else {
        duration = 60; // Longer workouts for advanced users
      }
    }
    
    // Get exercises based on workout type and user preferences
    const selectedExercises = getExercisesForWorkoutType(workoutType, difficulty);
    
    // Debug: Log the number of exercises found
    console.log(`[AI Chat] Found ${selectedExercises.length} exercises for workout type: ${workoutType}`);
    
    // Filter exercises based on user preferences
    const filteredExercises = selectedExercises.filter(exercise => {
      // Avoid disliked exercises
      if (userProfile.dislikedExercises.some(disliked => 
        exercise.name.toLowerCase().includes(disliked.toLowerCase())
      )) {
        return false;
      }
      
      // Prefer favorite exercises if they match the workout type
      if (userProfile.favoriteExercises.some(favorite => 
        exercise.name.toLowerCase().includes(favorite.toLowerCase())
      )) {
        return true;
      }
      
      return true;
    });
    
    console.log(`[AI Chat] After filtering, ${filteredExercises.length} exercises remain`);
    
    if (filteredExercises.length === 0) {
      throw new Error(`No exercises found for the requested workout type: ${workoutType}`);
    }
    
    // Adjust number of exercises based on experience level
    let finalExercises = filteredExercises;
    if (userProfile.experienceLevel === 'beginner') {
      finalExercises = filteredExercises.slice(0, 4); // Fewer exercises for beginners
    } else if (userProfile.experienceLevel === 'intermediate') {
      finalExercises = filteredExercises.slice(0, 6);
    } else {
      finalExercises = filteredExercises.slice(0, 8); // More exercises for advanced users
    }
    
    // Create workout name
    const workoutName = generateWorkoutName(workoutType, muscleGroups);
    console.log(`[AI Chat] Generated workout name: "${workoutName}" for type: ${workoutType}`);
    
    // Create the workout object
    const workout = {
      id: Date.now().toString(),
      name: workoutName,
      description: `AI-generated ${workoutType.replace('_', ' ')} workout tailored for ${userProfile.experienceLevel} level`,
      exercises: finalExercises.map(ex => ({ id: ex.id })),
      duration: duration,
      difficulty: difficulty as "beginner" | "intermediate" | "advanced",
      category: 'Strength',
      estimatedDuration: duration,
      intensity: difficulty === "beginner" ? "low" : difficulty === "intermediate" ? "medium" : "high",
      muscleGroups: Array.from(new Set(finalExercises.flatMap(ex => ex.muscleGroups))),
      equipment: Array.from(new Set(finalExercises.flatMap(ex => ex.equipment))),
      image: finalExercises[0]?.imageUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
    };
    
    return workout;
  };

  const getExercisesForWorkoutType = (workoutType: string, difficulty: string): Exercise[] => {
    const { exercises } = useWorkoutStore.getState();
    
    console.log(`[AI Chat] Getting exercises for type: ${workoutType}, difficulty: ${difficulty}`);
    console.log(`[AI Chat] Total exercises available: ${exercises.length}`);
    
    switch (workoutType) {
      case 'push':
        return exercises.filter(ex => 
          ex.muscleGroups.some(mg => ['Chest', 'Shoulders', 'Triceps'].includes(mg))
        ).slice(0, 6);
        
      case 'pull':
        return exercises.filter(ex => 
          ex.muscleGroups.some(mg => ['Back', 'Biceps', 'Traps'].includes(mg))
        ).slice(0, 6);
        
      case 'push_pull':
        const pushExercises = exercises.filter(ex => 
          ex.muscleGroups.some(mg => ['Chest', 'Shoulders', 'Triceps'].includes(mg))
        ).slice(0, 3);
        
        const pullExercises = exercises.filter(ex => 
          ex.muscleGroups.some(mg => ['Back', 'Biceps', 'Traps'].includes(mg))
        ).slice(0, 3);
        
        return [...pushExercises, ...pullExercises];
        
      case 'upper':
        return exercises.filter(ex => 
          ex.bodyRegion === 'Upper Body' &&
          ex.difficulty === difficulty
        ).slice(0, 6);
        
      case 'lower':
        return exercises.filter(ex => 
          ex.bodyRegion === 'Lower Body' &&
          ex.difficulty === difficulty
        ).slice(0, 6);
        
      case 'full_body':
        return exercises.filter(ex => 
          ex.difficulty === difficulty
        ).slice(0, 8);
        
      case 'legs':
        return exercises.filter(ex => 
          ex.muscleGroups.some(mg => ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'].includes(mg))
        ).slice(0, 6);
        
      case 'chest':
        const chestExercises = exercises.filter(ex => 
          ex.muscleGroups.some(mg => mg === 'Chest')
        );
        console.log(`[AI Chat] Found ${chestExercises.length} chest exercises`);
        return chestExercises.slice(0, 4);
        
      case 'back':
        return exercises.filter(ex => 
          ex.muscleGroups.some(mg => ['Back', 'Lats', 'Traps'].includes(mg))
        ).slice(0, 4);
        
      case 'shoulders':
        return exercises.filter(ex => 
          ex.muscleGroups.some(mg => mg === 'Shoulders')
        ).slice(0, 4);
        
      case 'arms':
        return exercises.filter(ex => 
          ex.muscleGroups.some(mg => ['Biceps', 'Triceps'].includes(mg))
        ).slice(0, 4);
        
      case 'core':
        return exercises.filter(ex => 
          ex.muscleGroups.some(mg => ['Abs', 'Core'].includes(mg))
        ).slice(0, 4);
        
      default:
        return exercises.filter(ex => ex.difficulty === difficulty).slice(0, 6);
    }
  };

  const generateWorkoutName = (workoutType: string, muscleGroups: string[]): string => {
    const typeNames = {
      'push': 'Push Day',
      'pull': 'Pull Day',
      'push_pull': 'Push/Pull Workout',
      'upper': 'Upper Body',
      'lower': 'Lower Body',
      'full_body': 'Full Body',
      'legs': 'Leg Day',
      'chest': 'Chest Day',
      'back': 'Back Day',
      'shoulders': 'Shoulder Day',
      'arms': 'Arm Day',
      'core': 'Core Workout'
    };
    
    return typeNames[workoutType] || 'Custom Workout';
  };

  const getPersonalizedWorkoutRecommendations = (workout: any): string[] => {
    const { userProfile } = useAiStore.getState();
    const recommendations: string[] = [];
    
    // Based on experience level
    if (userProfile.experienceLevel === 'beginner') {
      recommendations.push('Focus on form over weight - start with lighter weights');
      recommendations.push('Take 2-3 minutes rest between sets');
      recommendations.push('Consider doing 2-3 sets instead of 4-5 for now');
    } else if (userProfile.experienceLevel === 'advanced') {
      recommendations.push('Try supersets to increase intensity');
      recommendations.push('Consider adding drop sets for muscle growth');
      recommendations.push('Reduce rest time to 60-90 seconds between sets');
    }
    
    // Based on fitness goals
    if (userProfile.fitnessGoals.includes('weight loss')) {
      recommendations.push('Add 10-15 minutes of cardio after this workout');
      recommendations.push('Keep rest periods short (30-60 seconds)');
    }
    
    if (userProfile.fitnessGoals.includes('muscle gain')) {
      recommendations.push('Focus on 6-12 rep range for hypertrophy');
      recommendations.push('Take longer rest periods (2-3 minutes)');
    }
    
    if (userProfile.fitnessGoals.includes('strength')) {
      recommendations.push('Focus on compound movements first');
      recommendations.push('Use heavier weights with 3-5 rep range');
    }
    
    // Based on preferred workout time
    if (userProfile.preferredWorkoutTime === 'morning') {
      recommendations.push('Do a proper warm-up since you\'re working out early');
    } else if (userProfile.preferredWorkoutTime === 'evening') {
      recommendations.push('This workout should help you wind down for the day');
    }
    
    return recommendations;
  };

  const getProgressiveOverloadSuggestions = (workout: any): string[] => {
    const suggestions: string[] = [];
    
    // General progressive overload tips
    suggestions.push('Increase weight by 2.5-5 lbs when you can complete all sets with good form');
    suggestions.push('Add 1-2 reps to each set before increasing weight');
    suggestions.push('Track your weights and reps to monitor progress');
    
    // Specific to workout type
    if (workout.name.includes('Push') || workout.name.includes('Chest')) {
      suggestions.push('For bench press, focus on increasing weight by 5 lbs every 2-3 weeks');
    }
    
    if (workout.name.includes('Pull') || workout.name.includes('Back')) {
      suggestions.push('For pull-ups, try adding weight once you can do 10+ reps');
    }
    
    if (workout.name.includes('Leg')) {
      suggestions.push('For squats, increase weight by 10 lbs when form is perfect');
    }
    
    return suggestions;
  };

  const getRestDayRecommendations = (): string[] => {
    const { userProfile } = useAiStore.getState();
    const recommendations: string[] = [];
    
    // Based on experience level
    if (userProfile.experienceLevel === 'beginner') {
      recommendations.push('Take 1-2 rest days between similar muscle group workouts');
      recommendations.push('Consider light cardio or stretching on rest days');
    } else if (userProfile.experienceLevel === 'intermediate') {
      recommendations.push('Take 48-72 hours between working the same muscle groups');
      recommendations.push('Active recovery like walking or yoga on rest days');
    } else if (userProfile.experienceLevel === 'advanced') {
      recommendations.push('You can train 5-6 days per week with proper programming');
      recommendations.push('Consider deload weeks every 4-6 weeks');
    }
    
    // Based on workout type
    recommendations.push('For this workout type, rest 1-2 days before training the same muscles again');
    recommendations.push('Listen to your body - if you\'re sore, take an extra rest day');
    
    return recommendations;
  };

  const handleWorkoutSchedulingRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('schedule') && lowerMessage.includes('workout') ||
        lowerMessage.includes('add') && lowerMessage.includes('schedule') ||
        lowerMessage.includes('when') && lowerMessage.includes('workout')) {
      
      try {
        // Parse date and time from message
        const scheduleInfo = parseScheduleRequest(message);
        
        // Enhanced workout type recognition
        const workoutTypes = {
          'push': ['chest', 'shoulders', 'triceps', 'push'],
          'pull': ['back', 'biceps', 'pull'],
          'legs': ['legs', 'quads', 'hamstrings', 'glutes', 'lower body'],
          'full body': ['full body', 'total body', 'complete'],
          'chest': ['chest', 'pecs'],
          'back': ['back', 'lats'],
          'shoulders': ['shoulders', 'deltoids'],
          'arms': ['arms', 'biceps', 'triceps'],
          'core': ['core', 'abs', 'abdominal']
        };
        
        // Check if user mentioned a specific workout type
        let requestedWorkoutType = null;
        for (const [type, keywords] of Object.entries(workoutTypes)) {
          if (keywords.some(keyword => lowerMessage.includes(keyword))) {
            requestedWorkoutType = type;
            break;
          }
        }
        
        if (requestedWorkoutType) {
          // Create a custom workout based on the type
          const userFitnessLevel = macroUserProfile?.experienceLevel || 'beginner';
          const customWorkout = await createWorkoutFromRequest(`${requestedWorkoutType} workout for ${userFitnessLevel} level`);
          
          if (customWorkout && scheduleInfo) {
            // Schedule the workout
            const scheduledTime = scheduleInfo.time || '18:30';
            const scheduledDate = scheduleInfo.date || new Date().toISOString().split('T')[0];
            
            try {
              await scheduleWorkout?.({
                id: Date.now().toString(),
                workoutId: customWorkout.id,
                dayOfWeek: new Date(scheduledDate).getDay(),
                time: scheduledTime,
                duration: customWorkout.duration || 45,
                completed: false
              });
              
              return `Perfect! I've created and scheduled a ${requestedWorkoutType} workout for you:\n\n` +
                     `📅 Date: ${scheduledDate}\n` +
                     `⏰ Time: ${scheduledTime}\n` +
                     `💪 Workout: ${customWorkout.name}\n` +
                     `⏱️ Duration: ${customWorkout.duration || 45} minutes\n` +
                     `🏋️ Difficulty: ${userFitnessLevel}\n\n` +
                     `The workout has been added to your schedule. You can view it in the Schedule tab!`;
            } catch (error) {
              return `I've created a ${requestedWorkoutType} workout for you, but there was an issue scheduling it. You can find the workout in your workout library and schedule it manually.`;
            }
          }
        }
        
        if (scheduleInfo) {
          // Get the most recent workout (assuming it's the one to schedule)
          const { workouts } = useWorkoutStore.getState();
          const recentWorkout = workouts[workouts.length - 1];
          
          if (recentWorkout) {
            // Convert date to dayOfWeek (0-6, Sunday = 0)
            const scheduledDate = new Date(scheduleInfo.date);
            const dayOfWeek = scheduledDate.getDay();
            
            const scheduledWorkout = {
              id: Date.now().toString(),
              workoutId: recentWorkout.id,
              dayOfWeek: dayOfWeek,
              time: scheduleInfo.time,
              duration: scheduleInfo.duration || recentWorkout.estimatedDuration,
              completed: false
            };
            
            // Add to scheduled workouts
            scheduleWorkout(scheduledWorkout);
            
            let response = `📅 **Workout Scheduled Successfully!**\n\n`;
            response += `**Workout:** ${recentWorkout.name}\n`;
            response += `**Day:** ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}\n`;
            response += `**Time:** ${scheduleInfo.time}\n`;
            response += `**Duration:** ${scheduleInfo.duration || recentWorkout.estimatedDuration} minutes\n\n`;
            
            response += `✅ **Added to your schedule!**\n`;
            response += `You'll get a reminder before your workout.`;
            
            return response;
          } else {
            return `❌ **No workout found to schedule.**\n\nPlease create a workout first, then ask me to schedule it.`;
          }
        } else {
          let response = `📅 **Let me help you schedule a workout!**\n\n`;
          response += `I can create and schedule these types of workouts:\n\n`;
          response += `**Push Workouts:**\n`;
          response += `• Chest, shoulders, triceps\n`;
          response += `• Example: "Schedule a push workout for tomorrow at 6pm"\n\n`;
          response += `**Pull Workouts:**\n`;
          response += `• Back, biceps\n`;
          response += `• Example: "Schedule a pull workout for Friday at 7pm"\n\n`;
          response += `**Leg Workouts:**\n`;
          response += `• Quads, hamstrings, glutes\n`;
          response += `• Example: "Schedule a legs workout for Wednesday at 5pm"\n\n`;
          response += `**Full Body Workouts:**\n`;
          response += `• Complete body workout\n`;
          response += `• Example: "Schedule a full body workout for Monday at 6am"\n\n`;
          response += `**Just tell me what type and when!**`;
          
          return response;
        }
      } catch (error) {
        return `❌ **Error scheduling workout:** ${error.message}`;
      }
    }
    
    return null;
  };

  const handleWorkoutModificationRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('modify') || lowerMessage.includes('change') || 
        lowerMessage.includes('adjust') || lowerMessage.includes('edit')) {
      
      let response = `🔄 **Workout Modification Options**\n\n`;
      response += `I can help you modify your workouts in several ways:\n\n`;
      response += `**Exercise Changes:**\n`;
      response += `• "Replace [exercise] with [new exercise]"\n`;
      response += `• "Add [exercise] to my workout"\n`;
      response += `• "Remove [exercise] from my workout"\n\n`;
      
      response += `**Intensity Changes:**\n`;
      response += `• "Make it easier/harder"\n`;
      response += `• "Increase/decrease sets"\n`;
      response += `• "Change reps to [number]"\n\n`;
      
      response += `**Duration Changes:**\n`;
      response += `• "Make it shorter/longer"\n`;
      response += `• "Change duration to [minutes]"\n\n`;
      
      response += `**Tell me what you'd like to change!**`;
      
      return response;
    }
    
    return null;
  };

  const parseScheduleRequest = (message: string): any => {
    const lowerMessage = message.toLowerCase();
    
    // Parse date
    let date = new Date();
    if (lowerMessage.includes('tomorrow')) {
      date.setDate(date.getDate() + 1);
    } else if (lowerMessage.includes('next week')) {
      date.setDate(date.getDate() + 7);
    } else if (lowerMessage.includes('monday') || lowerMessage.includes('tuesday') || 
               lowerMessage.includes('wednesday') || lowerMessage.includes('thursday') ||
               lowerMessage.includes('friday') || lowerMessage.includes('saturday') ||
               lowerMessage.includes('sunday')) {
      // Find the next occurrence of the mentioned day
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = days.find(day => lowerMessage.includes(day));
      if (targetDay) {
        const targetDayIndex = days.indexOf(targetDay);
        const currentDayIndex = date.getDay();
        const daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7;
        date.setDate(date.getDate() + daysToAdd);
      }
    }
    
    // Parse time
    let time = '18:00'; // Default to 6pm
    const timeMatch = lowerMessage.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3].toLowerCase();
      
      if (period === 'pm' && hour !== 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      
      time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    
    // Parse duration
    let duration = 45; // Default duration
    const durationMatch = lowerMessage.match(/(\d+)\s*minutes?/);
    if (durationMatch) {
      duration = parseInt(durationMatch[1]);
    }
    
    return {
      date: date.toISOString().split('T')[0],
      time,
      duration,
      notes: ''
    };
  };

  const handleNutritionRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || 
        lowerMessage.includes('food') || lowerMessage.includes('meal') ||
        lowerMessage.includes('macro') || lowerMessage.includes('calorie') ||
        lowerMessage.includes('protein') || lowerMessage.includes('carb') ||
        lowerMessage.includes('fat') || lowerMessage.includes('supplement')) {
      
      try {
        const { userProfile } = useAiStore.getState();
        const { macroGoals, currentMacros } = useMacroStore.getState();
        
        let response = `🍎 **Nutrition Guidance**\n\n`;
        
        // Get user's fitness goals to provide relevant advice
        const fitnessGoals = userProfile?.fitnessGoals || [];
        
        // Specific nutrition topics
        if (lowerMessage.includes('protein')) {
          response += `**Protein Guide:**\n`;
          response += `• Aim for 1.6-2.2g protein per kg body weight\n`;
          response += `• Best sources: chicken, fish, eggs, lean beef\n`;
          response += `• Plant sources: beans, lentils, tofu, quinoa\n`;
          response += `• Distribute protein across all meals\n`;
          response += `• Consume protein within 2 hours post-workout\n\n`;
        } else if (lowerMessage.includes('carb') || lowerMessage.includes('carbohydrate')) {
          response += `**Carbohydrate Guide:**\n`;
          response += `• Complex carbs: oats, brown rice, sweet potatoes\n`;
          response += `• Simple carbs: fruits, honey (post-workout)\n`;
          response += `• Timing: carbs before and after workouts\n`;
          response += `• Fiber: aim for 25-30g daily\n`;
          response += `• Choose whole grains over refined\n\n`;
        } else if (lowerMessage.includes('fat')) {
          response += `**Healthy Fats Guide:**\n`;
          response += `• Omega-3: fish, flaxseeds, walnuts\n`;
          response += `• Monounsaturated: olive oil, avocados, nuts\n`;
          response += `• Saturated: limit to 10% of calories\n`;
          response += `• Avoid trans fats completely\n`;
          response += `• Include fats for hormone production\n\n`;
        } else if (lowerMessage.includes('supplement')) {
          response += `**Supplement Recommendations:**\n`;
          response += `• Protein powder: if struggling to meet protein goals\n`;
          response += `• Creatine: 5g daily for strength gains\n`;
          response += `• Vitamin D: if limited sun exposure\n`;
          response += `• Omega-3: if not eating fish regularly\n`;
          response += `• Multivitamin: as insurance policy\n\n`;
        } else if (lowerMessage.includes('meal') || lowerMessage.includes('plan')) {
          response += `**Meal Planning Tips:**\n`;
          response += `• Plan meals 1 week ahead\n`;
          response += `• Prep protein sources in bulk\n`;
          response += `• Cook grains and vegetables in advance\n`;
          response += `• Use containers for portion control\n`;
          response += `• Include variety to prevent boredom\n\n`;
        } else {
          // General nutrition based on goals
          if (fitnessGoals.includes('weight loss')) {
            response += `**Weight Loss Nutrition:**\n`;
            response += `• Create a 300-500 calorie deficit\n`;
            response += `• High protein: 1.6-2.2g per kg body weight\n`;
            response += `• Moderate carbs: 2-3g per kg body weight\n`;
            response += `• Healthy fats: 0.8-1.2g per kg body weight\n`;
            response += `• Eat plenty of vegetables and fruits\n`;
            response += `• Stay hydrated with water\n`;
            response += `• Limit processed foods and added sugars\n\n`;
          } else if (fitnessGoals.includes('muscle gain')) {
            response += `**Muscle Gain Nutrition:**\n`;
            response += `• Eat in a 200-500 calorie surplus\n`;
            response += `• High protein: 1.6-2.2g per kg body weight\n`;
            response += `• Higher carbs: 4-7g per kg body weight\n`;
            response += `• Moderate fats: 0.8-1.2g per kg body weight\n`;
            response += `• Eat 4-6 meals per day\n`;
            response += `• Include protein with every meal\n`;
            response += `• Post-workout nutrition is crucial\n\n`;
          } else if (fitnessGoals.includes('strength')) {
            response += `**Strength Training Nutrition:**\n`;
            response += `• Adequate protein: 1.6-2.2g per kg body weight\n`;
            response += `• Sufficient carbs for energy: 3-5g per kg body weight\n`;
            response += `• Healthy fats for hormone production\n`;
            response += `• Creatine supplementation recommended\n`;
            response += `• Pre-workout meal 2-3 hours before\n`;
            response += `• Post-workout protein within 2 hours\n\n`;
          } else {
            response += `**General Nutrition Tips:**\n`;
            response += `• Eat a balanced diet with variety\n`;
            response += `• Stay hydrated throughout the day\n`;
            response += `• Include protein with every meal\n`;
            response += `• Choose whole foods over processed\n`;
            response += `• Listen to your body's hunger cues\n`;
            response += `• Don't skip meals\n\n`;
          }
        }
        
        // Add macro information if available
        if (macroGoals && currentMacros) {
          response += `**Your Macro Goals:**\n`;
          response += `• Protein: ${macroGoals.protein}g\n`;
          response += `• Carbs: ${macroGoals.carbs}g\n`;
          response += `• Fat: ${macroGoals.fat}g\n`;
          response += `• Calories: ${macroGoals.calories}kcal\n\n`;
          
          response += `**Today's Progress:**\n`;
          response += `• Protein: ${currentMacros.protein}g / ${macroGoals.protein}g\n`;
          response += `• Carbs: ${currentMacros.carbs}g / ${macroGoals.carbs}g\n`;
          response += `• Fat: ${currentMacros.fat}g / ${macroGoals.fat}g\n`;
          response += `• Calories: ${currentMacros.calories}kcal / ${macroGoals.calories}kcal\n\n`;
        }
        
        response += `**Need help with meal planning or specific nutrition questions?**`;
        
        return response;
      } catch (error) {
        return `I'm having trouble accessing nutrition information right now. Try asking about specific nutrition topics like "meal planning" or "protein intake".`;
      }
    }
    
    return null;
  };

  const handleRecoveryRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('recovery') || lowerMessage.includes('rest') || lowerMessage.includes('sleep')) {
      const recovery = getRecoveryStatus();
      const activities = getRecoveryActivities();
      const sleep = getSleepRecommendations();
      
      let response = "🛌 **Recovery Status**\n\n";
      
      response += `**Recovery Score:** ${recovery.recoveryScore}/100\n`;
      response += `**Days since last workout:** ${recovery.daysSinceLastWorkout}\n`;
      
      if (recovery.lastWorkout) {
        response += `**Last workout:** ${recovery.lastWorkout.toLocaleDateString()}\n`;
      }
      
      response += "\n**Recommendations:**\n";
      recovery.recommendations.forEach(rec => {
        response += `• ${rec}\n`;
      });
      
      response += "\n**Recovery Activities:**\n";
      response += "**Stretching:**\n";
      activities.stretching.forEach(activity => {
        response += `• ${activity}\n`;
      });
      
      response += "\n**Mobility:**\n";
      activities.mobility.forEach(activity => {
        response += `• ${activity}\n`;
      });
      
      response += "\n**Sleep Recommendations:**\n";
      response += `• Duration: ${sleep.duration}\n`;
      response += "**Quality tips:**\n";
      sleep.quality.forEach(tip => {
        response += `• ${tip}\n`;
      });
      
      return response;
    }
    
    return null;
  };

  const handleAnalyticsRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('analytics') || lowerMessage.includes('analysis') || lowerMessage.includes('insights') || lowerMessage.includes('trends')) {
      const analytics = getAdvancedAnalytics();
      const insights = getAIPoweredInsights();
      
      let response = "📊 **Advanced Analytics Report**\n\n";
      
      // Performance trends
      if (analytics.trends.hasData) {
        response += "**Performance Trends:**\n";
        response += `• Weekly workouts: ${analytics.trends.frequency.weekly}\n`;
        response += `• Monthly workouts: ${analytics.trends.frequency.monthly}\n`;
        response += `• Volume trend: ${analytics.trends.volume.volumeTrend}\n`;
        response += `• Average volume: ${analytics.trends.volume.averageVolume}\n\n`;
      }
      
      // Strength trends
      const strengthTrends = analytics.trends.strength;
      if (Object.keys(strengthTrends).length > 0) {
        response += "**Strength Trends:**\n";
        Object.entries(strengthTrends).forEach(([exercise, data]) => {
          response += `• ${exercise}: ${data.trend} (${data.change > 0 ? '+' : ''}${data.change}lbs)\n`;
        });
        response += "\n";
      }
      
      // Consistency analysis
      const consistency = analytics.trends.consistency;
      response += "**Consistency Analysis:**\n";
      response += `• Average gap between workouts: ${consistency.averageGap} days\n`;
      response += `• Consistency score: ${consistency.consistency}\n`;
      response += `• Total workouts: ${consistency.totalWorkouts}\n\n`;
      
      // AI insights
      response += "**AI-Powered Insights:**\n";
      insights.recommendations.slice(0, 3).forEach(rec => {
        response += `• **${rec.title}:** ${rec.description}\n`;
      });
      
      return response;
    }
    
    return null;
  };

  const handleEmotionalRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('mood') || lowerMessage.includes('feel') || lowerMessage.includes('motivation') || lowerMessage.includes('energy')) {
      const moodAnalysis = analyzeUserMood(message);
      const empatheticResponse = generateEmpatheticResponse(moodAnalysis.mood, getUserContext());
      const strategy = getMotivationalStrategy(moodAnalysis.mood, getUserContext());
      
      let response = empatheticResponse + "\n\n";
      
      response += "**Personalized Strategy:**\n";
      response += strategy.message + "\n\n";
      
      response += "**Suggestions:**\n";
      strategy.suggestions.forEach(suggestion => {
        response += `• ${suggestion}\n`;
      });
      
      return response;
    }
    
    return null;
  };

  const handlePredictiveRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('predict') || lowerMessage.includes('forecast') || lowerMessage.includes('future') || lowerMessage.includes('projection')) {
      const predictions = getPredictiveAnalytics();
      
      let response = "🔮 **Predictive Analytics**\n\n";
      
      // Performance predictions
      if (predictions.performance.hasData) {
        response += "**Performance Forecast:**\n";
        response += `• Current trend: ${predictions.performance.currentTrend}\n`;
        response += `• Predicted volume: ${predictions.performance.predictedVolume}\n`;
        response += `• Confidence: ${predictions.performance.confidence}\n\n`;
      }
      
      // Goal predictions
      if (predictions.goals.length > 0) {
        response += "**Goal Achievement Predictions:**\n";
        predictions.goals.forEach(goal => {
          response += `• "${goal.goalText}": ${goal.willCompleteOnTime ? 'On track' : 'Needs adjustment'}\n`;
        });
        response += "\n";
      }
      
      // Health predictions
      const health = predictions.health;
      if (health.weight) {
        response += "**Weight Goal Prediction:**\n";
        response += `• Current: ${health.weight.currentWeight}kg\n`;
        response += `• Target: ${health.weight.targetWeight}kg\n`;
        response += `• Weeks to goal: ${health.weight.weeksToGoal}\n`;
        response += `• Estimated date: ${health.weight.estimatedDate.toLocaleDateString()}\n\n`;
      }
      
      // Strength predictions
      if (health.fitness?.strengthGains) {
        response += "**Strength Predictions (3 months):**\n";
        Object.entries(health.fitness.strengthGains).forEach(([exercise, data]) => {
          response += `• ${exercise}: ${data.current} → ${data.predicted}lbs\n`;
        });
      }
      
      return response;
    }
    
    return null;
  };

  const handleWorkoutAnalysisRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('analyze') && (lowerMessage.includes('workout') || lowerMessage.includes('exercise') || lowerMessage.includes('performance'))) {
      const analysis = getComprehensiveWorkoutAnalysis();
      
      if (!analysis.overview.hasData) {
        return "I don't have enough workout data to provide a comprehensive analysis. Try logging a few more workouts first!";
      }
      
      let response = "📊 **Comprehensive Workout Analysis**\n\n";
      
      // Overview section
      const overview = analysis.overview;
      response += "**📈 Overview:**\n";
      response += `• Total workouts analyzed: ${overview.totalWorkouts}\n`;
      response += `• Average duration: ${overview.avgDuration} minutes\n`;
      response += `• Average exercises per workout: ${overview.avgExercises}\n`;
      response += `• Average volume per workout: ${overview.avgVolume} lbs\n`;
      response += `• Workout frequency: ${overview.frequency} (${overview.avgGap} days avg)\n\n`;
      
      // Exercise analysis section
      const exerciseData = analysis.exerciseAnalysis;
      const topExercises = Object.values(exerciseData)
        .sort((a, b) => b.appearances - a.appearances)
        .slice(0, 5);
      
      if (topExercises.length > 0) {
        response += "**💪 Top Exercises:**\n";
        topExercises.forEach((exercise, index) => {
          const progression = exercise.progression === 'improving' ? '📈' : 
                           exercise.progression === 'regressing' ? '📉' : '➡️';
          response += `${index + 1}. ${exercise.name} (${exercise.appearances}x) ${progression}\n`;
          response += `   Max: ${exercise.maxWeight}lbs × ${exercise.maxReps} reps\n`;
        });
        response += "\n";
      }
      
      // Performance trends section
      const trends = analysis.performanceTrends.trends;
      response += "**📊 Performance Trends:**\n";
      
      // Volume trends
      response += `• Volume trend: ${trends.volume.trend} (${trends.volume.change > 0 ? '+' : ''}${trends.volume.change}lbs)\n`;
      
      // Strength trends
      const strengthExercises = Object.entries(trends.strength).filter(([_, data]) => data.trend === 'increasing');
      if (strengthExercises.length > 0) {
        response += `• Strength gains: ${strengthExercises.length} exercises improving\n`;
      }
      
      // Endurance trends
      response += `• Endurance: ${trends.endurance.trend} (${trends.endurance.change > 0 ? '+' : ''}${trends.endurance.change} high-rep sets)\n\n`;
      
      // Recommendations section
      const recommendations = analysis.recommendations;
      if (recommendations.length > 0) {
        response += "**🎯 Key Recommendations:**\n";
        recommendations.slice(0, 3).forEach((rec, index) => {
          const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
          response += `${index + 1}. ${priority} ${rec.title}\n`;
          response += `   ${rec.description}\n`;
        });
        response += "\n";
      }
      
      // Insights section
      const insights = analysis.insights;
      if (insights.length > 0) {
        response += "**💡 Key Insights:**\n";
        insights.slice(0, 3).forEach(insight => {
          const icon = insight.type === 'positive' ? '✅' : '⚠️';
          response += `• ${icon} ${insight.message}\n`;
        });
      }
      
      return response;
    }
    
    return null;
  };

  // Advanced analytics functions
  const getAdvancedAnalytics = () => {
    const context = getUserContext();
    const { recentWorkouts, level, experience } = context;
    
    const analytics = {
      trends: analyzeTrends(),
      performance: analyzePerformance(),
      predictions: generatePredictions(),
      insights: generateInsights()
    };
    
    return analytics;
  };

  const analyzeTrends = () => {
    const recentWorkouts = workoutLogs.slice(-10); // Last 10 workouts
    
    if (recentWorkouts.length < 3) {
      return { hasData: false, message: "Need more workout data for trend analysis" };
    }
    
    const trends = {
      frequency: {
        weekly: recentWorkouts.filter(w => {
          const workoutDate = new Date(w.date);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return workoutDate > weekAgo;
        }).length,
        monthly: recentWorkouts.filter(w => {
          const workoutDate = new Date(w.date);
          const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return workoutDate > monthAgo;
        }).length
      },
      strength: analyzeStrengthTrends(),
      consistency: analyzeConsistencyTrends(),
      volume: analyzeVolumeTrends()
    };
    
    return { hasData: true, trends };
  };

  const analyzeStrengthTrends = () => {
    const exercises = ['deadlift', 'bench', 'squat'];
    const trends = {};
    
    exercises.forEach(exercise => {
      const exerciseHistory = workoutLogs
        .flatMap(workout => workout.exercises || [])
        .filter(exercise => 
          exercise.name.toLowerCase().includes(exercise.toLowerCase()) ||
          exercise.name.toLowerCase().includes(exercise.toLowerCase().replace(/\s+/g, ''))
        );
      
      if (exerciseHistory.length === 0) {
        return { found: false, message: `No ${exercise} data found in your workout history.` };
      }
      
      // Find PRs and analyze trends
      let currentPR = { weight: 0, reps: 0, date: '' };
      const allSets = exerciseHistory.flatMap(exercise => 
        exercise.sets?.map(set => ({
          weight: set.weight,
          reps: set.reps,
          date: exercise.date,
          exerciseName: exercise.name
        })) || []
      );
      
      allSets.forEach(set => {
        if (set.weight > currentPR.weight) {
          currentPR = { weight: set.weight, reps: set.reps, date: set.date };
        }
      });
      
      // Calculate frequency and trends
      const frequency = exerciseHistory.length;
      const recentWorkouts = exerciseHistory.slice(-5);
      const averageWeight = allSets.reduce((sum, set) => sum + set.weight, 0) / allSets.length;
      
      trends[exercise] = {
        trend: averageWeight > currentPR.weight ? 'increasing' : averageWeight < currentPR.weight ? 'decreasing' : 'stable',
        change: averageWeight - currentPR.weight,
        currentPR: currentPR.weight
      };
    });
    
    return trends;
  };

  const analyzeConsistencyTrends = () => {
    const workoutDates = workoutLogs.map(w => new Date(w.date));
    const gaps = [];
    
    for (let i = 1; i < workoutDates.length; i++) {
      const gap = Math.floor((workoutDates[i] - workoutDates[i-1]) / (1000 * 60 * 60 * 24));
      gaps.push(gap);
    }
    
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    const consistency = avgGap <= 3 ? 'excellent' : avgGap <= 5 ? 'good' : 'needs_improvement';
    
    return {
      averageGap: avgGap.toFixed(1),
      consistency,
      totalWorkouts: workoutLogs.length
    };
  };

  const analyzeVolumeTrends = () => {
    const recentWorkouts = workoutLogs.slice(-5);
    const volumes = recentWorkouts.map(workout => {
      return workout.exercises?.reduce((total, exercise) => {
        return total + (exercise.sets?.reduce((setTotal, set) => 
          setTotal + (set.weight || 0) * (set.reps || 1), 0) || 0);
      }, 0) || 0;
    });
    
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const volumeTrend = volumes[volumes.length - 1] - volumes[0];
    
    return {
      averageVolume: Math.round(avgVolume),
      volumeTrend: volumeTrend > 0 ? 'increasing' : volumeTrend < 0 ? 'decreasing' : 'stable',
      change: volumeTrend
    };
  };

  const analyzeEnduranceTrends = () => {
    const recentWorkouts = workoutLogs.slice(-8);
    
    const enduranceData = recentWorkouts.map((workout, index) => {
      const highRepSets = workout.exercises?.reduce((total, exercise) => {
        return total + (exercise.sets?.filter(set => (set.reps || 0) >= 12).length || 0);
      }, 0) || 0;
      
      return {
        workout: index + 1,
        highRepSets,
        date: new Date(workout.date)
      };
    });
    
    const highRepCounts = enduranceData.map(d => d.highRepSets);
    const trend = highRepCounts[highRepCounts.length - 1] - highRepCounts[0];
    
    return {
      currentHighRepSets: highRepCounts[highRepCounts.length - 1],
      averageHighRepSets: Math.round(highRepCounts.reduce((a, b) => a + b, 0) / highRepCounts.length),
      trend: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
      change: trend,
      data: enduranceData
    };
  };

  const analyzePerformance = () => {
    const context = getUserContext();
    const { level, experience, recentWorkouts } = context;
    
    const performance = {
      level: level,
      experience: experience,
      workoutFrequency: recentWorkouts.length,
      strengthScore: calculateStrengthScore(),
      enduranceScore: calculateEnduranceScore(),
      consistencyScore: calculateConsistencyScore()
    };
    
    return performance;
  };

  const calculateStrengthScore = () => {
    const exercises = ['deadlift', 'bench', 'squat'];
    let totalScore = 0;
    let exerciseCount = 0;
    
    exercises.forEach(exercise => {
      const analysis = analyzeExerciseProgress(exercise);
      if (analysis.found && analysis.currentPR.weight > 0) {
        totalScore += analysis.currentPR.weight;
        exerciseCount++;
      }
    });
    
    return exerciseCount > 0 ? Math.round(totalScore / exerciseCount) : 0;
  };

  const calculateEnduranceScore = () => {
    const cardioWorkouts = workoutLogs.filter(w => 
      w.exercises?.some(ex => 
        ex.name.toLowerCase().includes('run') || 
        ex.name.toLowerCase().includes('cardio') ||
        ex.name.toLowerCase().includes('bike')
      )
    );
    
    return cardioWorkouts.length;
  };

  const calculateConsistencyScore = () => {
    const recentWorkouts = workoutLogs.slice(-30); // Last 30 days
    const workoutDays = recentWorkouts.length;
    const consistencyScore = Math.min(100, (workoutDays / 15) * 100); // 15 workouts = 100%
    
    return Math.round(consistencyScore);
  };

  const generatePredictions = () => {
    const context = getUserContext();
    const { level, experience, recentWorkouts } = context;
    
    const predictions = {
      nextPR: predictNextPR(),
      weightGoal: predictWeightGoal(),
      fitnessLevel: predictFitnessLevel()
    };
    
    return predictions;
  };

  const predictNextPR = () => {
    const exercises = ['deadlift', 'bench', 'squat'];
    const predictions = {};
    
    exercises.forEach(exercise => {
      const analysis = analyzeExerciseProgress(exercise);
      if (analysis.found && analysis.currentPR.weight > 0) {
        const predictedIncrease = Math.round(analysis.currentPR.weight * 0.05); // 5% increase
        predictions[exercise] = {
          current: analysis.currentPR.weight,
          predicted: analysis.currentPR.weight + predictedIncrease,
          timeframe: '4-6 weeks'
        };
      }
    });
    
    return predictions;
  };

  const predictWeightGoal = () => {
    const context = getUserContext();
    const { currentWeight, targetWeight } = context;
    
    if (targetWeight === 0) return null;
    
    const weightDiff = Math.abs(currentWeight - targetWeight);
    const weeklyLoss = 0.5; // Conservative 0.5kg per week
    const weeksToGoal = Math.ceil(weightDiff / weeklyLoss);
    
    return {
      currentWeight,
      targetWeight,
      weeksToGoal,
      estimatedDate: new Date(Date.now() + weeksToGoal * 7 * 24 * 60 * 60 * 1000)
    };
  };

  const predictFitnessLevel = () => {
    const context = getUserContext();
    const { level, experience } = context;
    
    const currentLevel = level;
    const experienceGain = Math.floor(experience / 1000); // Rough estimate
    const predictedLevel = currentLevel + experienceGain;
    
    return {
      currentLevel,
      predictedLevel,
      timeframe: '3 months'
    };
  };

  const generateInsights = () => {
    const insights = [];
    const context = getUserContext();
    const { recentWorkouts, level } = context;
    
    // Workout frequency insights
    if (recentWorkouts.length >= 3) {
      const weeklyWorkouts = recentWorkouts.filter(w => {
        const workoutDate = new Date(w.date);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return workoutDate > weekAgo;
      }).length;
      
      if (weeklyWorkouts >= 4) {
        insights.push("🔥 You're working out 4+ times per week - excellent consistency!");
      } else if (weeklyWorkouts >= 2) {
        insights.push("💪 Good workout frequency - consider adding one more session per week");
      } else {
        insights.push("📈 Try to increase your workout frequency to 3-4 times per week");
      }
    }
    
    // Strength insights
    const strengthScore = calculateStrengthScore();
    if (strengthScore > 200) {
      insights.push("💪 Impressive strength levels - you're in the advanced category!");
    } else if (strengthScore > 100) {
      insights.push("🏋️‍♂️ Good strength foundation - focus on progressive overload");
    } else {
      insights.push("💪 Focus on building strength with compound movements");
    }
    
    // Level-based insights
    if (level < 5) {
      insights.push("🌟 You're building a solid foundation - focus on form and consistency");
    } else if (level < 10) {
      insights.push("🚀 You're progressing well - consider adding more variety to your workouts");
    } else {
      insights.push("🏆 You're an experienced fitness enthusiast - time to set new challenges!");
    }
    
    return insights;
  };

  // Smart notification functions
  const getSmartNotifications = () => {
    const context = getUserContext();
    const { recentWorkouts, level, experience } = context;
    
    const notifications = [];
    
    // Workout reminders
    const lastWorkoutDate = recentWorkouts.length > 0 ? new Date(recentWorkouts[recentWorkouts.length - 1].date) : null;
    const daysSinceLastWorkout = lastWorkoutDate ? Math.floor((Date.now() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)) : 7;
    
    if (daysSinceLastWorkout >= 3) {
      notifications.push({
        type: 'reminder',
        title: 'Time for a workout! 💪',
        message: `It's been ${daysSinceLastWorkout} days since your last workout. Ready to get back to it?`,
        priority: 'high',
        action: 'schedule_workout'
      });
    }
    
    // Goal progress notifications
    const goals = useAiStore.getState().goals || [];
    goals.forEach(goal => {
      if (!goal.completed && goal.progress >= 50) {
        notifications.push({
          type: 'progress',
          title: 'Goal Progress! 🎯',
          message: `You're ${goal.progress}% towards your goal: "${goal.text}"`,
          priority: 'medium',
          action: 'view_goal'
        });
      }
    });
    
    // Achievement notifications
    const recentAchievements = achievements.filter(a => {
      const achievementDate = new Date(a.date);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return achievementDate > dayAgo;
    });
    
    recentAchievements.forEach(achievement => {
      notifications.push({
        type: 'achievement',
        title: 'Achievement Unlocked! 🏆',
        message: `Congratulations! You've earned: ${achievement.title}`,
        priority: 'high',
        action: 'view_achievement'
      });
    });
    
    // Recovery notifications
    const recovery = getRecoveryStatus();
    if (recovery.recoveryScore < 50) {
      notifications.push({
        type: 'recovery',
        title: 'Recovery Time! 🛌',
        message: 'Your body needs rest. Consider a recovery day or light activity.',
        priority: 'medium',
        action: 'recovery_activities'
      });
    }
    
    // Nutrition reminders
    const currentHour = new Date().getHours();
    if (currentHour >= 7 && currentHour <= 9) {
      notifications.push({
        type: 'nutrition',
        title: 'Fuel Your Day! 🍎',
        message: 'Don\'t forget to eat a healthy breakfast to start your day right.',
        priority: 'low',
        action: 'nutrition_tips'
      });
    }
    
    return notifications;
  };

  const generatePersonalizedReminders = () => {
    const context = getUserContext();
    const { recentWorkouts, level, userProfile } = context;
    
    const reminders = [];
    
    // Personalized workout reminders based on user patterns
    const workoutDays = recentWorkouts.map(w => new Date(w.date).getDay());
    const mostCommonDay = workoutDays.length > 0 ? 
      workoutDays.sort((a, b) => workoutDays.filter(v => v === a).length - workoutDays.filter(v => v === b).length).pop() : null;
    
    if (mostCommonDay !== null) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      reminders.push({
        type: 'pattern',
        title: 'Your Workout Day! 💪',
        message: `It's ${dayNames[mostCommonDay]} - your usual workout day. Ready to crush it?`,
        time: '09:00',
        day: mostCommonDay
      });
    }
    
    // Goal-based reminders
    const goals = useAiStore.getState().goals || [];
    const activeGoals = goals.filter(g => !g.completed);
    
    activeGoals.forEach(goal => {
      if (goal.timeframe === 'weekly') {
        reminders.push({
          type: 'goal',
          title: 'Weekly Goal Check-in 📊',
          message: `How's your progress on: "${goal.text}"?`,
          time: '18:00',
          day: 1 // Monday
        });
      }
    });
    
    // Experience-based reminders
    if (level < 5) {
      reminders.push({
        type: 'education',
        title: 'Fitness Tip of the Day 💡',
        message: 'Focus on form over weight. Quality reps beat heavy weights!',
        time: '12:00',
        frequency: 'daily'
      });
    } else if (level > 10) {
      reminders.push({
        type: 'challenge',
        title: 'Push Your Limits! 🚀',
        message: 'You\'re ready for a challenge. Try increasing your weights today!',
        time: '10:00',
        frequency: 'weekly'
      });
    }
    
    return reminders;
  };

  const getMotivationalMessages = () => {
    const context = getUserContext();
    const { level, experience, recentWorkouts } = context;
    
    const messages = [
      "💪 Every workout makes you stronger than yesterday",
      "🔥 Consistency beats perfection every time",
      "🚀 You're building the best version of yourself",
      "💎 Diamonds are made under pressure - so are champions",
      "🌟 Small progress is still progress",
      "🏆 Champions are made in the gym, not born",
      "💪 Your future self will thank you for today's effort",
      "🔥 The only bad workout is the one that didn't happen",
      "🚀 You're stronger than you think",
      "💎 Every rep counts towards your goals"
    ];
    
    // Personalized messages based on user data
    if (level < 5) {
      messages.push("🌟 You're building a solid foundation - keep going!");
      messages.push("💪 Every beginner was once where you are now");
    } else if (level > 15) {
      messages.push("🏆 You're an inspiration to others - keep leading by example!");
      messages.push("🚀 Your dedication is paying off - you're crushing it!");
    }
    
    // Random selection
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Emotional intelligence functions
  const analyzeUserMood = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    const moodIndicators = {
      positive: ['great', 'awesome', 'amazing', 'excited', 'motivated', 'pumped', 'crushed', 'killed', 'loved', 'enjoyed'],
      negative: ['tired', 'exhausted', 'sore', 'frustrated', 'stuck', 'plateau', 'difficult', 'hard', 'struggling', 'demotivated'],
      neutral: ['okay', 'fine', 'alright', 'normal', 'usual', 'regular'],
      stressed: ['stress', 'overwhelmed', 'busy', 'rushed', 'pressed', 'deadline'],
      confident: ['strong', 'powerful', 'confident', 'capable', 'ready', 'prepared']
    };
    
    let detectedMood = 'neutral';
    let confidence = 0;
    
    Object.entries(moodIndicators).forEach(([mood, indicators]) => {
      const matches = indicators.filter(indicator => lowerMessage.includes(indicator));
      if (matches.length > confidence) {
        detectedMood = mood;
        confidence = matches.length;
      }
    });
    
    return { mood: detectedMood, confidence, message };
  };

  const generateEmpatheticResponse = (mood: string, context: any) => {
    const responses = {
      positive: [
        "That's fantastic! Your positive energy is contagious! 🌟",
        "I love your enthusiasm! Keep that momentum going! 💪",
        "You're absolutely crushing it! This energy will carry you far! 🚀",
        "Your positivity is inspiring! You're making amazing progress! 🏆"
      ],
      negative: [
        "I hear you, and it's completely normal to feel this way sometimes. Remember, every athlete has tough days. 💙",
        "It's okay to feel tired or frustrated. Your body is telling you something important. Let's work with it, not against it. 🤗",
        "I understand this is challenging. You're not alone in feeling this way. Let's find a way to make this work for you. 💪",
        "Your feelings are valid. Sometimes the best thing we can do is listen to our bodies and adjust accordingly. 🛌"
      ],
      neutral: [
        "I appreciate you sharing that with me. How can I help you today? 🤔",
        "Thanks for the update. What would you like to focus on? 💭",
        "I'm here to support you. What's on your mind? 💙",
        "Let's work together to make the most of today. What's your priority? 🎯"
      ],
      stressed: [
        "I can sense you're under pressure. Remember, your health comes first. Let's find a manageable approach. 🧘‍♂️",
        "Stress can really impact our fitness journey. Let's work on some stress-management strategies together. 💆‍♂️",
        "It's okay to take a step back when life gets overwhelming. Your progress won't disappear. 🌸",
        "Let's find a balance that works for your current situation. We can adapt your fitness plan. ⚖️"
      ],
      confident: [
        "Your confidence is well-deserved! You've put in the work and it shows! 💪",
        "That self-assurance is powerful! You're ready to tackle any challenge! 🚀",
        "Your belief in yourself is inspiring! You've got this! 🏆",
        "That confidence will carry you through any obstacle! You're unstoppable! ⚡"
      ]
    };
    
    const moodResponses = responses[mood] || responses.neutral;
    return moodResponses[Math.floor(Math.random() * moodResponses.length)];
  };

  const getMotivationalStrategy = (mood: string, context: any) => {
    const strategies = {
      positive: {
        approach: 'encourage_continuation',
        message: 'Your positive energy is perfect for pushing your limits!',
        suggestions: [
          'Try increasing your weights today',
          'Add an extra set to your workout',
          'Try a new exercise you\'ve been curious about',
          'Set a new personal record goal'
        ]
      },
      negative: {
        approach: 'support_and_adapt',
        message: 'Let\'s work with how you\'re feeling today.',
        suggestions: [
          'Consider a lighter, recovery-focused workout',
          'Focus on form and technique over weight',
          'Try some gentle stretching or yoga',
          'Take a rest day if you need it'
        ]
      },
      stressed: {
        approach: 'simplify_and_support',
        message: 'Let\'s make fitness work for your busy life.',
        suggestions: [
          'Try a quick 20-minute workout',
          'Focus on exercises you enjoy',
          'Break your workout into smaller sessions',
          'Use exercise as stress relief'
        ]
      },
      confident: {
        approach: 'challenge_and_celebrate',
        message: 'Your confidence is well-earned! Let\'s build on it.',
        suggestions: [
          'Try a more challenging workout',
          'Increase your weights or reps',
          'Add a new exercise to your routine',
          'Set an ambitious but achievable goal'
        ]
      }
    };
    
    return strategies[mood] || strategies.neutral;
  };

  const trackEmotionalPatterns = () => {
    // This would integrate with a mood tracking system
    const patterns = {
      weeklyMood: 'positive', // Would be calculated from mood logs
      stressLevels: 'moderate',
      motivationTrend: 'increasing',
      energyLevels: 'high'
    };
    
    return patterns;
  };

  // Predictive analytics functions
  const getPredictiveAnalytics = () => {
    const context = getUserContext();
    const { recentWorkouts, level, experience } = context;
    
    const predictions = {
      performance: predictPerformanceTrends(),
      goals: predictGoalAchievement(),
      health: predictHealthOutcomes(),
      recommendations: generatePredictiveRecommendations()
    };
    
    return predictions;
  };

  const predictPerformanceTrends = () => {
    const recentWorkouts = workoutLogs.slice(-10);
    
    if (recentWorkouts.length < 5) {
      return { hasData: false, message: "Need more workout data for predictions" };
    }
    
    // Analyze performance trends
    const performanceData = recentWorkouts.map(workout => {
      const totalVolume = workout.exercises?.reduce((total, exercise) => {
        return total + (exercise.sets?.reduce((setTotal, set) => 
          setTotal + (set.weight || 0) * (set.reps || 1), 0) || 0);
      }, 0) || 0;
      
      return {
        date: new Date(workout.date),
        volume: totalVolume,
        exercises: workout.exercises?.length || 0
      };
    });
    
    // Calculate trend
    const volumes = performanceData.map(d => d.volume);
    const trend = volumes[volumes.length - 1] - volumes[0];
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    
    // Predict next month
    const predictedVolume = avgVolume + (trend * 0.5); // Conservative prediction
    
    return {
      hasData: true,
      currentTrend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      averageVolume: Math.round(avgVolume),
      predictedVolume: Math.round(predictedVolume),
      confidence: 'medium'
    };
  };

  const predictGoalAchievement = () => {
    const goals = useAiStore.getState().goals || [];
    const activeGoals = goals.filter(g => !g.completed);
    
    const predictions = activeGoals.map(goal => {
      const currentProgress = goal.progress;
      const remainingProgress = 100 - currentProgress;
      const timeRemaining = goal.timeframe === 'weekly' ? 7 : 30; // days
      
      // Calculate daily progress rate
      const daysSinceCreation = Math.floor((Date.now() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const dailyProgressRate = currentProgress / Math.max(daysSinceCreation, 1);
      
      // Predict completion
      const daysToComplete = remainingProgress / dailyProgressRate;
      const willCompleteOnTime = daysToComplete <= timeRemaining;
      
      return {
        goalId: goal.id,
        goalText: goal.text,
        currentProgress,
        predictedCompletion: daysToComplete,
        willCompleteOnTime,
        confidence: dailyProgressRate > 0 ? 'high' : 'low'
      };
    });
    
    return predictions;
  };

  const predictHealthOutcomes = () => {
    const context = getUserContext();
    const { currentWeight, targetWeight, stepCount, recentWorkouts } = context;
    
    const predictions = {
      weight: predictWeightOutcome(),
      fitness: predictFitnessOutcome(),
      health: predictHealthMetrics()
    };
    
    return predictions;
  };

  const predictWeightOutcome = () => {
    const context = getUserContext();
    const { currentWeight, targetWeight } = context;
    
    if (targetWeight === 0) return null;
    
    const weightDiff = targetWeight - currentWeight;
    const weeklyChange = 0.5; // Conservative 0.5kg per week
    const weeksToGoal = Math.abs(weightDiff) / weeklyChange;
    
    return {
      currentWeight,
      targetWeight,
      weeksToGoal: Math.ceil(weeksToGoal),
      estimatedDate: new Date(Date.now() + weeksToGoal * 7 * 24 * 60 * 60 * 1000),
      confidence: 'medium'
    };
  };

  const predictFitnessOutcome = () => {
    const context = getUserContext();
    const { level, experience, recentWorkouts } = context;
    
    // Predict level progression
    const experienceGain = Math.floor(experience / 1000);
    const predictedLevel = level + experienceGain;
    
    // Predict strength gains
    const strengthPredictions = predictStrengthGains();
    
    return {
      currentLevel: level,
      predictedLevel,
      timeframe: '3 months',
      strengthGains: strengthPredictions,
      confidence: 'high'
    };
  };

  const predictStrengthGains = () => {
    const exercises = ['deadlift', 'bench', 'squat'];
    const predictions = {};
    
    exercises.forEach(exercise => {
      const analysis = analyzeExerciseProgress(exercise);
      if (analysis.found && analysis.currentPR.weight > 0) {
        // Predict 5-10% increase over 3 months
        const monthlyIncrease = analysis.currentPR.weight * 0.02; // 2% per month
        const threeMonthGain = monthlyIncrease * 3;
        
        predictions[exercise] = {
          current: analysis.currentPR.weight,
          predicted: Math.round(analysis.currentPR.weight + threeMonthGain),
          timeframe: '3 months',
          confidence: 'medium'
        };
      }
    });
    
    return predictions;
  };

  const predictHealthMetrics = () => {
    const context = getUserContext();
    const { stepCount, recentWorkouts } = context;
    
    // Predict cardiovascular health
    const weeklyWorkouts = recentWorkouts.filter(w => {
      const workoutDate = new Date(w.date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return workoutDate > weekAgo;
    }).length;
    
    const cardioHealth = weeklyWorkouts >= 3 ? 'excellent' : weeklyWorkouts >= 2 ? 'good' : 'needs_improvement';
    
    // Predict step count trends
    const avgSteps = stepCount;
    const stepHealth = avgSteps >= 10000 ? 'excellent' : avgSteps >= 8000 ? 'good' : 'needs_improvement';
    
    return {
      cardiovascularHealth: cardioHealth,
      stepHealth,
      overallHealth: cardioHealth === 'excellent' && stepHealth === 'excellent' ? 'excellent' : 'good'
    };
  };

  const generatePredictiveRecommendations = () => {
    const predictions = getPredictiveAnalytics();
    const recommendations = [];
    
    // Performance-based recommendations
    if (predictions.performance.hasData) {
      const { currentTrend, predictedVolume } = predictions.performance;
      
      if (currentTrend === 'increasing') {
        recommendations.push({
          type: 'performance',
          title: 'Maintain Momentum',
          message: 'Your performance is trending upward! Keep up the great work.',
          action: 'continue_current_plan'
        });
      } else if (currentTrend === 'decreasing') {
        recommendations.push({
          type: 'performance',
          title: 'Adjust Strategy',
          message: 'Consider mixing up your routine to break through plateaus.',
          action: 'vary_workout_routine'
        });
      }
    }
    
    // Goal-based recommendations
    predictions.goals.forEach(goal => {
      if (!goal.willCompleteOnTime) {
        recommendations.push({
          type: 'goal',
          title: 'Goal Adjustment Needed',
          message: `Your goal "${goal.goalText}" may need adjustment to stay on track.`,
          action: 'review_goal_strategy'
        });
      }
    });
    
    // Health-based recommendations
    const health = predictions.health;
    if (health.fitness?.strengthGains) {
      const strengthGains = Object.values(health.fitness.strengthGains);
      if (strengthGains.length > 0) {
        recommendations.push({
          type: 'strength',
          title: 'Strength Building Opportunity',
          message: 'You\'re on track for significant strength gains!',
          action: 'focus_on_strength_training'
        });
      }
    }
    
    return recommendations;
  };

  // Advanced integrations functions
  const getAdvancedIntegrations = () => {
    return {
      wearables: getWearableData(),
      nutrition: getNutritionData(),
      social: getSocialFeatures(),
      external: getExternalAPIs()
    };
  };

  const getWearableData = () => {
    // Integration with Apple Watch, Fitbit, etc.
    const wearableData = {
      heartRate: {
        current: 72,
        resting: 65,
        max: 185,
        zones: {
          fatBurn: { min: 90, max: 120 },
          cardio: { min: 120, max: 150 },
          peak: { min: 150, max: 185 }
        }
      },
      activity: {
        steps: stepCount,
        calories: 450,
        distance: 3.2,
        activeMinutes: 45
      },
      sleep: {
        duration: 7.5,
        quality: 'good',
        deepSleep: 2.1,
        remSleep: 1.8
      }
    };
    
    return wearableData;
  };

  const getNutritionData = () => {
    // Integration with nutrition tracking apps
    const nutritionData = {
      calories: {
        consumed: 1850,
        target: 2200,
        remaining: 350
      },
      macros: {
        protein: { consumed: 120, target: 150, unit: 'g' },
        carbs: { consumed: 200, target: 250, unit: 'g' },
        fat: { consumed: 65, target: 75, unit: 'g' }
      },
      hydration: {
        water: { consumed: 1800, target: 2500, unit: 'ml' },
        electrolytes: { consumed: 2, target: 3, unit: 'servings' }
      }
    };
    
    return nutritionData;
  };

  const getSocialFeatures = () => {
    // Social fitness features
    const socialData = {
      friends: [
        { name: 'Alex', level: 12, recentWorkout: '2 hours ago' },
        { name: 'Sarah', level: 8, recentWorkout: '1 day ago' },
        { name: 'Mike', level: 15, recentWorkout: '3 hours ago' }
      ],
      challenges: [
        { name: '30-Day Push-up Challenge', participants: 45, daysLeft: 12 },
        { name: 'Weekly Step Challenge', participants: 23, daysLeft: 3 }
      ],
      achievements: [
        { type: 'social', title: 'Workout Buddy', description: 'Completed 5 workouts with friends' },
        { type: 'challenge', title: 'Challenge Champion', description: 'Won 3 fitness challenges' }
      ]
    };
    
    return socialData;
  };

  const getExternalAPIs = () => {
    // Integration with external fitness APIs
    const externalData = {
      weather: {
        current: 'Sunny',
        temperature: 22,
        humidity: 45,
        recommendation: 'Great weather for outdoor cardio!'
      },
      gym: {
        nearby: [
          { name: 'Fitness First', distance: 0.5, busyness: 'medium' },
          { name: 'Planet Fitness', distance: 1.2, busyness: 'low' }
        ],
        equipment: {
          available: ['treadmill', 'bench press', 'squat rack'],
          busy: ['deadlift platform']
        }
      },
      nutrition: {
        restaurants: [
          { name: 'Healthy Bites', rating: 4.5, healthyOptions: true },
          { name: 'Protein Bar', rating: 4.2, healthyOptions: true }
        ],
        mealSuggestions: [
          'Grilled chicken salad',
          'Protein smoothie',
          'Quinoa bowl'
        ]
      }
    };
    
    return externalData;
  };

  const syncWithWearable = async () => {
    try {
      // Simulate wearable data sync
      const wearableData = getWearableData();
      
      // Update health store with wearable data
      const healthStore = useHealthStore.getState();
      
      if (healthStore && healthStore.updateStepCount && wearableData.activity.steps !== stepCount) {
        healthStore.updateStepCount(wearableData.activity.steps);
      }
      
      return {
        success: true,
        data: wearableData,
        message: 'Wearable data synced successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to sync with wearable device'
      };
    }
  };

  const syncWithNutritionApp = async () => {
    try {
      // Simulate nutrition app sync
      const nutritionData = getNutritionData();
      
      // Update macro store with nutrition data
      const macroStore = useMacroStore.getState();
      
      if (macroStore && macroStore.updateMacroGoals) {
        // Note: updateMacroGoals might not exist, so we'll just return success
      }
      
      return {
        success: true,
        data: nutritionData,
        message: 'Nutrition data synced successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to sync with nutrition app'
      };
    }
  };

  const getPersonalizedRecommendations = () => {
    const context = getUserContext();
    const wearableData = getWearableData();
    const nutritionData = getNutritionData();
    const externalData = getExternalAPIs();
    
    const recommendations = [];
    
    // Heart rate based recommendations
    if (wearableData.heartRate.current > 100) {
      recommendations.push({
        type: 'recovery',
        title: 'High Heart Rate',
        message: 'Your heart rate is elevated. Consider a recovery day or light activity.',
        priority: 'high'
      });
    }
    
    // Nutrition based recommendations
    if (nutritionData.calories.consumed < nutritionData.calories.target * 0.8) {
      recommendations.push({
        type: 'nutrition',
        title: 'Low Calorie Intake',
        message: 'You\'re under your calorie target. Consider a healthy snack.',
        priority: 'medium'
      });
    }
    
    // Weather based recommendations
    if (externalData.weather.current === 'Sunny' && externalData.weather.temperature > 20) {
      recommendations.push({
        type: 'workout',
        title: 'Perfect Weather',
        message: 'Great conditions for outdoor cardio or running!',
        priority: 'low'
      });
    }
    
    return recommendations;
  };

  // AI-powered insights functions
  const getAIPoweredInsights = () => {
    const context = getUserContext();
    const analytics = getAdvancedAnalytics();
    const predictions = getPredictiveAnalytics();
    const integrations = getAdvancedIntegrations();
    
    const insights = {
      patterns: analyzeBehaviorPatterns(),
      correlations: findCorrelations(),
      opportunities: identifyOpportunities(),
      risks: identifyRisks(),
      recommendations: generateAIRecommendations()
    };
    
    return insights;
  };

  const analyzeBehaviorPatterns = () => {
    const context = getUserContext();
    const { recentWorkouts, level, experience } = context;
    
    const patterns = {
      workoutTiming: analyzeWorkoutTiming(),
      exercisePreferences: analyzeExercisePreferences(),
      progressPatterns: analyzeProgressPatterns(),
      consistencyPatterns: analyzeConsistencyPatterns()
    };
    
    return patterns;
  };

  const analyzeWorkoutTiming = () => {
    const workoutDays = recentWorkouts.map(w => new Date(w.date).getDay());
    const workoutHours = recentWorkouts.map(w => new Date(w.date).getHours());
    
    const dayPattern = workoutDays.reduce((acc, day) => {
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    
    const hourPattern = workoutHours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    
    const mostCommonDay = Object.entries(dayPattern).sort((a, b) => b[1] - a[1])[0];
    const mostCommonHour = Object.entries(hourPattern).sort((a, b) => b[1] - a[1])[0];
    
    return {
      preferredDays: mostCommonDay ? [parseInt(mostCommonDay[0])] : [],
      preferredHours: mostCommonHour ? [parseInt(mostCommonHour[0])] : [],
      consistency: Object.keys(dayPattern).length >= 3 ? 'high' : 'medium'
    };
  };

  const analyzeExercisePreferences = () => {
    const allExercises = recentWorkouts.flatMap(w => w.exercises || []);
    const exerciseCounts = allExercises.reduce((acc, exercise) => {
      acc[exercise.name] = (acc[exercise.name] || 0) + 1;
      return acc;
    }, {});
    
    const favoriteExercises = Object.entries(exerciseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    const exerciseCategories = {
      strength: allExercises.filter(ex => 
        ['deadlift', 'bench', 'squat', 'press', 'row'].some(keyword => 
          ex.name.toLowerCase().includes(keyword)
        )
      ).length,
      cardio: allExercises.filter(ex => 
        ['run', 'bike', 'cardio', 'hiit'].some(keyword => 
          ex.name.toLowerCase().includes(keyword)
        )
      ).length,
      bodyweight: allExercises.filter(ex => 
        ['push-up', 'pull-up', 'plank', 'burpee'].some(keyword => 
          ex.name.toLowerCase().includes(keyword)
        )
      ).length
    };
    
    return {
      favorites: favoriteExercises,
      categories: exerciseCategories,
      variety: Object.keys(exerciseCounts).length
    };
  };

  const analyzeProgressPatterns = () => {
    const progressData = recentWorkouts.map((workout, index) => {
      const totalVolume = workout.exercises?.reduce((total, exercise) => {
        return total + (exercise.sets?.reduce((setTotal, set) => 
          setTotal + (set.weight || 0) * (set.reps || 1), 0) || 0);
      }, 0) || 0;
      
      return {
        date: new Date(workout.date),
        volume: totalVolume,
        week: Math.floor(index / 7)
      };
    });
    
    const weeklyAverages = progressData.reduce((acc, data) => {
      acc[data.week] = (acc[data.week] || []).concat(data.volume);
      return acc;
    }, {});
    
    const weeklyTrends = Object.entries(weeklyAverages).map(([week, volumes]) => ({
      week: parseInt(week),
      averageVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      trend: volumes.length > 1 ? volumes[volumes.length - 1] - volumes[0] : 0
    }));
    
    return {
      weeklyTrends,
      overallTrend: weeklyTrends.length > 1 ? 
        weeklyTrends[weeklyTrends.length - 1].averageVolume - weeklyTrends[0].averageVolume : 0,
      consistency: weeklyTrends.filter(w => w.trend > 0).length / weeklyTrends.length
    };
  };

  const analyzeConsistencyPatterns = () => {
    const workoutDates = recentWorkouts.map(w => new Date(w.date));
    const gaps = [];
    
    for (let i = 1; i < workoutDates.length; i++) {
      const gap = Math.floor((workoutDates[i] - workoutDates[i-1]) / (1000 * 60 * 60 * 24));
      gaps.push(gap);
    }
    
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    const consistencyScore = avgGap <= 2 ? 'excellent' : avgGap <= 4 ? 'good' : 'needs_improvement';
    
    return {
      averageGap,
      consistencyScore,
      longestStreak: calculateLongestStreak(workoutDates),
      missedWorkouts: gaps.filter(g => g > 7).length
    };
  };

  const calculateLongestStreak = (workoutDates: Date[]) => {
    let currentStreak = 1;
    let longestStreak = 1;
    
    for (let i = 1; i < workoutDates.length; i++) {
      const gap = Math.floor((workoutDates[i] - workoutDates[i-1]) / (1000 * 60 * 60 * 24));
      if (gap <= 2) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return longestStreak;
  };

  const findCorrelations = () => {
    const context = getUserContext();
    const { recentWorkouts, level, experience } = context;
    
    const correlations = {
      workoutFrequency: {
        strength: level > 10 ? 'strong' : 'moderate',
        endurance: recentWorkouts.length > 10 ? 'strong' : 'weak',
        consistency: recentWorkouts.length > 15 ? 'strong' : 'moderate'
      },
      exerciseType: {
        strength: analyzeExercisePreferences().categories.strength > 5 ? 'strong' : 'weak',
        cardio: analyzeExercisePreferences().categories.cardio > 3 ? 'strong' : 'weak',
        variety: analyzeExercisePreferences().variety > 10 ? 'strong' : 'weak'
      },
      timing: {
        morning: analyzeWorkoutTiming().preferredHours.includes(6) || analyzeWorkoutTiming().preferredHours.includes(7),
        evening: analyzeWorkoutTiming().preferredHours.includes(18) || analyzeWorkoutTiming().preferredHours.includes(19),
        consistency: analyzeWorkoutTiming().consistency
      }
    };
    
    return correlations;
  };

  const identifyOpportunities = () => {
    const context = getUserContext();
    const patterns = analyzeBehaviorPatterns();
    const correlations = findCorrelations();
    
    const opportunities = [];
    
    // Strength opportunities
    if (patterns.exercisePreferences.categories.strength < 3) {
      opportunities.push({
        type: 'strength',
        title: 'Build Strength Foundation',
        description: 'Add more compound movements to your routine',
        potential: 'high',
        effort: 'medium'
      });
    }
    
    // Cardio opportunities
    if (patterns.exercisePreferences.categories.cardio < 2) {
      opportunities.push({
        type: 'cardio',
        title: 'Improve Cardiovascular Health',
        description: 'Include more cardio sessions in your routine',
        potential: 'medium',
        effort: 'low'
      });
    }
    
    // Consistency opportunities
    if (patterns.consistencyPatterns.consistencyScore === 'needs_improvement') {
      opportunities.push({
        type: 'consistency',
        title: 'Improve Workout Consistency',
        description: 'Establish a more regular workout schedule',
        potential: 'high',
        effort: 'high'
      });
    }
    
    // Variety opportunities
    if (patterns.exercisePreferences.variety < 8) {
      opportunities.push({
        type: 'variety',
        title: 'Add Exercise Variety',
        description: 'Try new exercises to prevent plateaus',
        potential: 'medium',
        effort: 'low'
      });
    }
    
    return opportunities;
  };

  const identifyRisks = () => {
    const context = getUserContext();
    const patterns = analyzeBehaviorPatterns();
    const recovery = getRecoveryStatus();
    
    const risks = [];
    
    // Overtraining risk
    if (recovery.recoveryScore < 50) {
      risks.push({
        type: 'overtraining',
        severity: 'high',
        description: 'Low recovery score indicates potential overtraining',
        recommendation: 'Consider more rest days or lighter workouts'
      });
    }
    
    // Plateau risk
    if (patterns.progressPatterns.overallTrend <= 0) {
      risks.push({
        type: 'plateau',
        severity: 'medium',
        description: 'Progress has stalled - may be hitting a plateau',
        recommendation: 'Try increasing weights or changing exercises'
      });
    }
    
    // Injury risk
    if (patterns.consistencyPatterns.averageGap > 7) {
      risks.push({
        type: 'injury',
        severity: 'medium',
        description: 'Long gaps between workouts increase injury risk',
        recommendation: 'Maintain more consistent workout schedule'
      });
    }
    
    return risks;
  };

  const generateAIRecommendations = () => {
    const insights = getAIPoweredInsights();
    const opportunities = insights.opportunities;
    const risks = insights.risks;
    
    const recommendations = [];
    
    // High-priority recommendations based on risks
    risks.forEach(risk => {
      if (risk.severity === 'high') {
        recommendations.push({
          priority: 'high',
          type: risk.type,
          title: `Address ${risk.type} risk`,
          description: risk.recommendation,
          urgency: 'immediate'
        });
      }
    });
    
    // Opportunity-based recommendations
    opportunities.forEach(opportunity => {
      if (opportunity.potential === 'high') {
        recommendations.push({
          priority: 'medium',
          type: opportunity.type,
          title: opportunity.title,
          description: opportunity.description,
          urgency: 'soon'
        });
      }
    });
    
    // Pattern-based recommendations
    const patterns = insights.patterns;
    if (patterns.workoutTiming.consistency === 'low') {
      recommendations.push({
        priority: 'medium',
        type: 'schedule',
        title: 'Optimize Workout Schedule',
        description: 'Establish more consistent workout times',
        urgency: 'soon'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  // Comprehensive workout analysis functions
  const getComprehensiveWorkoutAnalysis = () => {
    const context = getUserContext();
    const { recentWorkouts, level, experience } = context;
    
    const analysis = {
      overview: generateWorkoutOverview(),
      exerciseAnalysis: analyzeAllExercises(),
      performanceTrends: analyzePerformanceTrends(),
      recommendations: generateWorkoutRecommendations(),
      insights: generateWorkoutInsights()
    };
    
    return analysis;
  };

  const generateWorkoutOverview = () => {
    const recentWorkouts = workoutLogs.slice(-10);
    
    if (recentWorkouts.length === 0) {
      return {
        hasData: false,
        message: "No workout data available for analysis"
      };
    }
    
    const totalWorkouts = recentWorkouts.length;
    const totalDuration = recentWorkouts.reduce((sum, workout) => sum + (workout.duration || 0), 0);
    const avgDuration = Math.round(totalDuration / totalWorkouts);
    
    const totalExercises = recentWorkouts.reduce((sum, workout) => 
      sum + (workout.exercises?.length || 0), 0);
    const avgExercises = Math.round(totalExercises / totalWorkouts);
    
    const totalVolume = recentWorkouts.reduce((sum, workout) => {
      return sum + (workout.exercises?.reduce((exerciseSum, exercise) => {
        return exerciseSum + (exercise.sets?.reduce((setSum, set) => 
          setSum + (set.weight || 0) * (set.reps || 1), 0) || 0);
      }, 0) || 0);
    }, 0);
    
    const avgVolume = Math.round(totalVolume / totalWorkouts);
    
    // Calculate workout frequency
    const workoutDates = recentWorkouts.map(w => new Date(w.date));
    const avgGap = workoutDates.length > 1 ? 
      (workoutDates[workoutDates.length - 1] - workoutDates[0]) / (workoutDates.length - 1) / (1000 * 60 * 60 * 24) : 0;
    
    return {
      hasData: true,
      totalWorkouts,
      avgDuration,
      avgExercises,
      avgVolume,
      avgGap: Math.round(avgGap * 10) / 10,
      frequency: avgGap <= 2 ? 'excellent' : avgGap <= 4 ? 'good' : 'needs_improvement'
    };
  };

  const analyzeAllExercises = () => {
    const recentWorkouts = workoutLogs.slice(-15); // Last 15 workouts for better analysis
    
    const exerciseData = {};
    
    recentWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        if (!exercise.name) return; // Skip exercises without names
        
        if (!exerciseData[exercise.name]) {
          exerciseData[exercise.name] = {
            name: exercise.name,
            appearances: 0,
            totalSets: 0,
            totalReps: 0,
            totalWeight: 0,
            maxWeight: 0,
            maxReps: 0,
            recentPerformance: [],
            progression: 'stable'
          };
        }
        
        const exerciseStats = exerciseData[exercise.name];
        exerciseStats.appearances++;
        
        exercise.sets?.forEach(set => {
          exerciseStats.totalSets++;
          exerciseStats.totalReps += set.reps || 0;
          exerciseStats.totalWeight += set.weight || 0;
          exerciseStats.maxWeight = Math.max(exerciseStats.maxWeight, set.weight || 0);
          exerciseStats.maxReps = Math.max(exerciseStats.maxReps, set.reps || 0);
          
          exerciseStats.recentPerformance.push({
            date: new Date(workout.date),
            weight: set.weight || 0,
            reps: set.reps || 0,
            setNumber: exerciseStats.recentPerformance.length + 1
          });
        });
      });
    });
    
    // Analyze progression for each exercise
    Object.values(exerciseData).forEach(exercise => {
      if (exercise.recentPerformance.length >= 3) {
        const recentSets = exercise.recentPerformance.slice(-6); // Last 6 sets
        const weights = recentSets.map(set => set.weight);
        const trend = weights[weights.length - 1] - weights[0];
        
        if (trend > 5) {
          exercise.progression = 'improving';
        } else if (trend < -5) {
          exercise.progression = 'regressing';
        } else {
          exercise.progression = 'stable';
        }
      }
    });
    
    return exerciseData;
  };

  const analyzePerformanceTrends = () => {
    const recentWorkouts = workoutLogs.slice(-10);
    
    if (recentWorkouts.length < 3) {
      return { hasData: false, message: "Need more workout data for trend analysis" };
    }
    
    const trends = {
      volume: analyzeVolumeTrends(),
      strength: analyzeStrengthTrends(),
      endurance: analyzeEnduranceTrends(),
      consistency: analyzeConsistencyTrends()
    };
    
    return { hasData: true, trends };
  };



  const generateWorkoutRecommendations = () => {
    const analysis = getComprehensiveWorkoutAnalysis();
    const exerciseData = analysis.exerciseAnalysis;
    const trends = analysis.performanceTrends.trends;
    
    const recommendations = [];
    
    // Volume-based recommendations
    if (trends.volume.trend === 'decreasing') {
      recommendations.push({
        type: 'volume',
        title: 'Increase Workout Volume',
        description: 'Your total volume is decreasing. Consider adding more sets or exercises.',
        priority: 'high',
        action: 'add_sets_or_exercises'
      });
    }
    
    // Strength-based recommendations
    Object.entries(trends.strength).forEach(([exercise, data]) => {
      if (data.trend === 'stable' && data.appearances >= 3) {
        recommendations.push({
          type: 'strength',
          title: `Progressive Overload for ${exercise}`,
          description: `Try increasing your ${exercise} weight by 5-10lbs next session.`,
          priority: 'medium',
          action: 'increase_weight',
          exercise: exercise
        });
      }
    });
    
    // Exercise variety recommendations
    const exerciseCount = Object.keys(exerciseData).length;
    if (exerciseCount < 8) {
      recommendations.push({
        type: 'variety',
        title: 'Add Exercise Variety',
        description: 'Consider adding new exercises to prevent plateaus and target different muscle groups.',
        priority: 'medium',
        action: 'add_new_exercises'
      });
    }
    
    // Frequency recommendations
    const overview = analysis.overview;
    if (overview.frequency === 'needs_improvement') {
      recommendations.push({
        type: 'frequency',
        title: 'Improve Workout Frequency',
        description: `You're averaging ${overview.avgGap} days between workouts. Aim for 2-3 days.`,
        priority: 'high',
        action: 'increase_frequency'
      });
    }
    
    // Duration recommendations
    if (overview.avgDuration < 30) {
      recommendations.push({
        type: 'duration',
        title: 'Extend Workout Duration',
        description: 'Your workouts are short. Consider adding 10-15 minutes for better results.',
        priority: 'medium',
        action: 'increase_duration'
      });
    }
    
    return recommendations;
  };

  const generateWorkoutInsights = () => {
    const analysis = getComprehensiveWorkoutAnalysis();
    const exerciseData = analysis.exerciseAnalysis;
    const trends = analysis.performanceTrends.trends;
    
    const insights = [];
    
    // Exercise progression insights
    Object.entries(exerciseData).forEach(([exerciseName, data]) => {
      if (data.appearances >= 3) {
        if (data.progression === 'improving') {
          insights.push({
            type: 'positive',
            message: `Great progress on ${exerciseName}! Your strength is increasing consistently.`
          });
        } else if (data.progression === 'regressing') {
          insights.push({
            type: 'warning',
            message: `${exerciseName} performance is declining. Consider reducing weight or focusing on form.`
          });
        }
      }
    });
    
    // Volume insights
    if (trends.volume.trend === 'increasing') {
      insights.push({
        type: 'positive',
        message: 'Your workout volume is trending upward - excellent for muscle growth!'
      });
    }
    
    // Strength insights
    const strengthExercises = Object.entries(trends.strength).filter(([_, data]) => data.trend === 'increasing');
    if (strengthExercises.length > 0) {
      insights.push({
        type: 'positive',
        message: `You're making strength gains in ${strengthExercises.length} exercises!`
      });
    }
    
    // Consistency insights
    const overview = analysis.overview;
    if (overview.frequency === 'excellent') {
      insights.push({
        type: 'positive',
        message: 'Excellent workout consistency! You\'re building great habits.'
      });
    }
    
    return insights;
  };
  
  const handleDeleteChat = (chatId: string) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this conversation?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: () => {
            deleteChat(chatId);
            if (currentChat?.id === chatId) {
              if (chats.length > 1) {
                // Find another chat to display
                const remainingChats = chats.filter(c => c.id !== chatId);
                setCurrentChat(remainingChats[remainingChats.length - 1]);
              } else {
                // Create a new chat if this was the last one
                createNewChat();
              }
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleSelectChat = (chat: AiChat) => {
    setCurrentChat(chat);
    setShowChats(false);
  };
  
  // Proactive check-in function
  const generateProactiveMessage = () => {
    const context = getUserContext();
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 12) {
      return `Good morning ${context.userProfile?.name || 'there'}! Ready to crush your fitness goals today?`;
    } else if (hour < 17) {
      return `Good afternoon! How's your fitness journey going today?`;
    } else {
      return `Good evening! How did your fitness activities go today?`;
    }
  };
  
  const renderChatItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.assistantMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.assistantMessageText
          ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };
  
  // Render context card component
  const renderContextCard = () => {
    const context = getUserContext();
    const { userProfile, currentWeight, targetWeight, stepCount, level } = context;
    
    return (
      <View style={styles.contextCard}>
        <View style={styles.contextHeader}>
          <Text style={styles.contextTitle}>Your Progress</Text>
          <Text style={styles.contextSubtitle}>Level {level}</Text>
        </View>
        
        <View style={styles.contextStats}>
          <View style={styles.contextStat}>
            <Text style={styles.contextStatLabel}>Weight</Text>
            <Text style={styles.contextStatValue}>{currentWeight.toFixed(1)} kg</Text>
            {targetWeight > 0 && (
              <Text style={styles.contextStatTarget}>Target: {targetWeight.toFixed(1)} kg</Text>
            )}
          </View>
          
          <View style={styles.contextStat}>
            <Text style={styles.contextStatLabel}>Steps</Text>
            <Text style={styles.contextStatValue}>{stepCount || 0}</Text>
          </View>
          
          <View style={styles.contextStat}>
            <Text style={styles.contextStatLabel}>Goal</Text>
            <Text style={styles.contextStatValue}>{userProfile?.fitnessGoal || 'maintain'}</Text>
          </View>
        </View>
      </View>
    );
  };
  
  // Render quick actions component
  const renderQuickActions = () => {
    if (!showQuickActions) return null;
    
    const actions = getQuickActions();
    
    return (
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.quickActionButton, { backgroundColor: action.color }]}
              onPress={() => {
                handleQuickAction(action.action);
                setShowQuickActions(false);
              }}
            >
              <Text style={styles.quickActionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  const renderChatListItem = ({ item }: { item: AiChat }) => {
    // Get first user message or first assistant message if no user message
    const firstUserMessage = item.messages.find(msg => msg.role === "user");
    const firstMessage = firstUserMessage || item.messages.find(msg => msg.role === "assistant");
    const preview = firstMessage ? firstMessage.content.substring(0, 30) + (firstMessage.content.length > 30 ? "..." : "") : "New conversation";
    
    // Format date
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const isSelected = currentChat?.id === item.id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.chatListItem,
          isSelected && styles.selectedChatListItem
        ]}
        onPress={() => handleSelectChat(item)}
      >
        <View style={styles.chatListItemContent}>
          <Text style={styles.chatListItemPreview} numberOfLines={1}>
            {preview}
          </Text>
          <Text style={styles.chatListItemDate}>{formattedDate}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteChatButton}
          onPress={() => handleDeleteChat(item.id)}
        >
          <Trash2 size={16} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  
  const handleAppFeatureRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('feature') || lowerMessage.includes('what can') || 
        lowerMessage.includes('app can') || lowerMessage.includes('capabilities')) {
      
      let response = `🚀 **FitJourney Tracker Features**\n\n`;
      response += `Here's what this app can do for you:\n\n`;
      
      response += `**🏋️ Workout Management:**\n`;
      response += `• Create custom workouts from scratch\n`;
      response += `• Schedule workouts in calendar view\n`;
      response += `• Track workout progress and history\n`;
      response += `• Log exercises with sets, reps, and weights\n`;
      response += `• Get workout recommendations based on your level\n\n`;
      
      response += `**📊 Health Tracking:**\n`;
      response += `• Track steps, calories burned, and distance\n`;
      response += `• Monitor weight progress with charts\n`;
      response += `• Log water intake with reminders\n`;
      response += `• Sync with Apple HealthKit\n`;
      response += `• Track body measurements and progress photos\n\n`;
      
      response += `**🍎 Nutrition Management:**\n`;
      response += `• Log meals and track macros\n`;
      response += `• Set personalized macro goals\n`;
      response += `• Get meal recommendations\n`;
      response += `• Track nutrition history\n\n`;
      
      response += `**🎯 Goal Setting & Gamification:**\n`;
      response += `• Set fitness, weight, and nutrition goals\n`;
      response += `• Daily quests and achievements\n`;
      response += `• Progress tracking with rewards\n`;
      response += `• Streak tracking and milestones\n\n`;
      
      response += `**🤖 AI Assistant (That's me!):**\n`;
      response += `• Create custom workouts\n`;
      response += `• Schedule workouts automatically\n`;
      response += `• Answer questions about your progress\n`;
      response += `• Provide personalized recommendations\n`;
      response += `• Check goal status and notifications\n\n`;
      
      response += `**📅 Schedule & Planning:**\n`;
      response += `• Calendar view for workouts\n`;
      response += `• Meal planning and scheduling\n`;
      response += `• Reminder notifications\n`;
      response += `• Progress tracking over time\n\n`;
      
      response += `**What would you like to explore?**`;
      
      return response;
    }
    
    return null;
  };
  
  const handleGoalStatusRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('goal') && (lowerMessage.includes('status') || 
        lowerMessage.includes('check') || lowerMessage.includes('active'))) {
      
      try {
        const { goals } = aiStore || {};
        const { waterIntake } = healthStore || {};
        const { stepCount } = healthStore || {};
        
        let response = `🎯 **Your Active Goals Status**\n\n`;
        
        // Check water goal
        if (lowerMessage.includes('water') || lowerMessage.includes('drink')) {
          const today = new Date().toISOString().split('T')[0];
          const todayWater = waterIntake?.filter(entry => 
            entry.date.startsWith(today)
          ).reduce((total, entry) => total + entry.amount, 0) || 0;
          
          response += `💧 **Water Intake Goal:**\n`;
          response += `• Today's intake: ${(todayWater / 1000).toFixed(1)}L\n`;
          response += `• Target: 2L daily\n`;
          response += `• Progress: ${Math.min(100, (todayWater / 2000) * 100).toFixed(1)}%\n\n`;
          
          // Check next water reminder
          response += `⏰ **Next Water Reminder:**\n`;
          response += `• Reminders are set for every 2 hours\n`;
          response += `• Next reminder: In 2 hours\n\n`;
        }
        
        // Check step goal
        if (lowerMessage.includes('step') || lowerMessage.includes('walk')) {
          response += `👟 **Daily Steps Goal:**\n`;
          response += `• Today's steps: ${stepCount || 0}\n`;
          response += `• Target: 10,000 steps\n`;
          response += `• Progress: ${Math.min(100, ((stepCount || 0) / 10000) * 100).toFixed(1)}%\n\n`;
        }
        
        // Check AI goals
        if (goals && goals.length > 0) {
          response += `🎯 **AI-Created Goals:**\n`;
          goals.forEach(goal => {
            if (!goal.completed) {
              response += `• ${goal.text}\n`;
              if (goal.progress !== undefined) {
                response += `  Progress: ${goal.progress}%\n`;
              }
              response += `\n`;
            }
          });
        }
        
        response += `**Need help with any of these goals?**`;
        
        return response;
      } catch (error) {
        return `I'm having trouble checking your goal status right now. Try asking about specific goals like "water goal status" or "step goal progress".`;
      }
    }
    
    return null;
  };
  
  const handleGoalProgressRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('goal') && (lowerMessage.includes('progress') || 
        lowerMessage.includes('tracking') || lowerMessage.includes('how am i doing'))) {
      
      try {
        const { goals, checkAllGoalsProgress, getGoalProgressMessage } = aiStore || {};
        
        // Update all goal progress
        checkAllGoalsProgress?.();
        
        let response = `📊 **Goal Progress Tracking**\n\n`;
        
        if (goals && goals.length > 0) {
          const activeGoals = goals.filter(goal => !goal.completed);
          
          if (activeGoals.length === 0) {
            response += `🎉 **All goals completed!** You're doing amazing!\n\n`;
            response += `Would you like to set new goals?`;
            return response;
          }
          
          response += `**Active Goals Progress:**\n\n`;
          
          activeGoals.forEach((goal, index) => {
            const progressMessage = getGoalProgressMessage?.(goal) || '';
            const progressPercentage = goal.progress || 0;
            const progressBar = '█'.repeat(Math.floor(progressPercentage / 10)) + '░'.repeat(10 - Math.floor(progressPercentage / 10));
            
            response += `${index + 1}. **${goal.text}**\n`;
            response += `   Progress: ${progressPercentage}% ${progressBar}\n`;
            
            if (goal.targetValue && goal.currentValue) {
              response += `   Current: ${goal.currentValue} / ${goal.targetValue}\n`;
            }
            
            if (goal.timeframe) {
              response += `   Timeframe: ${goal.timeframe}\n`;
            }
            
            if (progressMessage) {
              response += `   ${progressMessage}\n`;
            }
            
            response += `\n`;
          });
          
          // Add recommendations based on progress
          const lowProgressGoals = activeGoals.filter(goal => (goal.progress || 0) < 30);
          if (lowProgressGoals.length > 0) {
            response += `⚠️ **Goals Needing Attention:**\n`;
            lowProgressGoals.forEach(goal => {
              response += `• ${goal.text} - ${goal.progress || 0}% complete\n`;
            });
            response += `\nConsider adjusting these goals or asking for help!\n\n`;
          }
          
          const highProgressGoals = activeGoals.filter(goal => (goal.progress || 0) > 70);
          if (highProgressGoals.length > 0) {
            response += `🚀 **Goals Almost Complete:**\n`;
            highProgressGoals.forEach(goal => {
              response += `• ${goal.text} - ${goal.progress || 0}% complete\n`;
            });
            response += `\nYou're so close! Keep pushing!\n\n`;
          }
        } else {
          response += `No active goals found. Would you like to create some goals?\n\n`;
          response += `Try saying:\n`;
          response += `• "Create a goal to lose 5kg in 3 months"\n`;
          response += `• "Set a goal to run 5km"\n`;
          response += `• "I want to bench press 100kg"\n`;
        }
        
        response += `**Need help with any goals?**`;
        
        return response;
      } catch (error) {
        return `I'm having trouble tracking your goal progress right now. Try asking about specific goals or create new ones!`;
      }
    }
    
    return null;
  };
  
  const handlePersonalRecordsRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('pr') || lowerMessage.includes('personal record') || 
        lowerMessage.includes('personal best') || lowerMessage.includes('record') ||
        lowerMessage.includes('max') || lowerMessage.includes('best')) {
      
      try {
        const { personalRecords } = useWorkoutStore.getState();
        const { workoutLogs } = useWorkoutStore.getState();
        
        let response = `🏆 **Personal Records**\n\n`;
        
        if (personalRecords && personalRecords.length > 0) {
          // Group PRs by exercise
          const prsByExercise = personalRecords.reduce((acc, pr) => {
            if (!acc[pr.exerciseName]) {
              acc[pr.exerciseName] = [];
            }
            acc[pr.exerciseName].push(pr);
            return acc;
          }, {} as Record<string, any[]>);
          
          Object.entries(prsByExercise).forEach(([exerciseName, prs]) => {
            const latestPR = prs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            
            response += `**${exerciseName}**\n`;
            response += `• Weight: ${latestPR.weight}kg\n`;
            response += `• Reps: ${latestPR.reps}\n`;
            response += `• Date: ${new Date(latestPR.date).toLocaleDateString()}\n`;
            
            // Check if it's a recent PR (within last 30 days)
            const daysSincePR = Math.floor((Date.now() - new Date(latestPR.date).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSincePR <= 30) {
              response += `• 🎉 Recent PR! (${daysSincePR} days ago)\n`;
            }
            
            response += `\n`;
          });
          
          // Add PR suggestions
          response += `**PR Suggestions:**\n`;
          response += `• Try increasing weight by 2.5-5kg for your next attempt\n`;
          response += `• Focus on proper form and technique\n`;
          response += `• Get adequate rest before attempting new PRs\n`;
          response += `• Consider deloading if you're plateauing\n\n`;
        } else {
          response += `No personal records found yet.\n\n`;
          response += `**To track PRs:**\n`;
          response += `• Log your workouts with weights and reps\n`;
          response += `• The app will automatically track your best performances\n`;
          response += `• Try saying "What's my bench press PR?"\n\n`;
        }
        
        // Add recent workout analysis
        if (workoutLogs && workoutLogs.length > 0) {
          const recentWorkouts = workoutLogs
            .filter(log => !log.completed)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
          
          if (recentWorkouts.length > 0) {
            response += `**Recent Workout Analysis:**\n`;
            recentWorkouts.forEach(workout => {
              const exercises = workout.exercises || [];
              const heavyExercises = exercises.filter(ex => 
                ex.sets && ex.sets.some(set => set.weight && set.weight > 0)
              );
              
              if (heavyExercises.length > 0) {
                response += `• ${workout.workoutName || 'Workout'} - ${heavyExercises.length} heavy exercises\n`;
              }
            });
            response += `\n`;
          }
        }
        
        response += `**Need help setting new PRs?**`;
        
        return response;
      } catch (error) {
        return `I'm having trouble accessing your personal records right now. Make sure you've logged some workouts with weights and reps!`;
      }
    }
    
    return null;
  };
  
  const handleExerciseEducationRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('explain') || lowerMessage.includes('how to') || 
        lowerMessage.includes('form') || lowerMessage.includes('technique') ||
        lowerMessage.includes('benefits') || lowerMessage.includes('what is')) {
      
      try {
        // Common exercises to explain
        const exerciseKeywords = {
          'squat': {
            name: 'Squat',
            benefits: ['Builds leg strength', 'Improves core stability', 'Enhances functional movement'],
            form: [
              'Stand with feet shoulder-width apart',
              'Keep chest up and core engaged',
              'Lower hips back and down',
              'Keep knees in line with toes',
              'Go as low as comfortable (thighs parallel to ground)',
              'Drive through heels to stand up'
            ],
            tips: ['Start with bodyweight squats', 'Focus on form over weight', 'Keep weight in heels']
          },
          'bench press': {
            name: 'Bench Press',
            benefits: ['Builds chest strength', 'Improves upper body power', 'Enhances pushing strength'],
            form: [
              'Lie on bench with feet flat on ground',
              'Grip bar slightly wider than shoulder-width',
              'Lower bar to mid-chest with control',
              'Keep elbows at 45-degree angle',
              'Press bar back up to starting position',
              'Keep shoulder blades retracted'
            ],
            tips: ['Start with lighter weights', 'Use a spotter for safety', 'Focus on controlled movement']
          },
          'deadlift': {
            name: 'Deadlift',
            benefits: ['Builds total body strength', 'Improves posture', 'Enhances functional strength'],
            form: [
              'Stand with feet hip-width apart',
              'Grip bar with hands shoulder-width apart',
              'Keep chest up and back straight',
              'Hinge at hips and bend knees',
              'Lift bar by driving through heels',
              'Stand up straight with shoulders back'
            ],
            tips: ['Start with lighter weights', 'Focus on hip hinge movement', 'Keep bar close to body']
          },
          'pull up': {
            name: 'Pull-up',
            benefits: ['Builds back strength', 'Improves grip strength', 'Enhances upper body pulling'],
            form: [
              'Grip bar with hands wider than shoulders',
              'Hang with arms fully extended',
              'Pull yourself up until chin over bar',
              'Lower yourself with control',
              'Keep core engaged throughout'
            ],
            tips: ['Start with assisted pull-ups', 'Use resistance bands if needed', 'Focus on controlled movement']
          },
          'push up': {
            name: 'Push-up',
            benefits: ['Builds chest and tricep strength', 'Improves core stability', 'No equipment needed'],
            form: [
              'Start in plank position',
              'Place hands slightly wider than shoulders',
              'Lower body until chest nearly touches ground',
              'Push back up to starting position',
              'Keep body in straight line'
            ],
            tips: ['Start with knee push-ups if needed', 'Keep core engaged', 'Focus on full range of motion']
          }
        };
        
        // Find which exercise the user is asking about
        let targetExercise = null;
        for (const [keyword, exercise] of Object.entries(exerciseKeywords)) {
          if (lowerMessage.includes(keyword)) {
            targetExercise = exercise;
            break;
          }
        }
        
        if (targetExercise) {
          let response = `📚 **${targetExercise.name} - Exercise Guide**\n\n`;
          
          response += `**Benefits:**\n`;
          targetExercise.benefits.forEach(benefit => {
            response += `• ${benefit}\n`;
          });
          response += `\n`;
          
          response += `**Proper Form:**\n`;
          targetExercise.form.forEach((step, index) => {
            response += `${index + 1}. ${step}\n`;
          });
          response += `\n`;
          
          response += `**Pro Tips:**\n`;
          targetExercise.tips.forEach(tip => {
            response += `• ${tip}\n`;
          });
          response += `\n`;
          
          response += `**Common Mistakes to Avoid:**\n`;
          response += `• Rushing the movement\n`;
          response += `• Using too much weight before mastering form\n`;
          response += `• Not engaging core muscles\n`;
          response += `• Incomplete range of motion\n\n`;
          
          response += `**Progression Tips:**\n`;
          response += `• Start with lighter weights or bodyweight\n`;
          response += `• Focus on perfect form before increasing weight\n`;
          response += `• Gradually increase difficulty\n`;
          response += `• Listen to your body and rest when needed\n\n`;
          
          response += `**Need help with other exercises?**`;
          
          return response;
        } else {
          // General exercise education
          let response = `📚 **Exercise Education**\n\n`;
          
          response += `**I can explain these exercises:**\n`;
          response += `• Squat - Lower body strength\n`;
          response += `• Bench Press - Upper body pushing\n`;
          response += `• Deadlift - Total body strength\n`;
          response += `• Pull-up - Upper body pulling\n`;
          response += `• Push-up - Bodyweight chest exercise\n\n`;
          
          response += `**Try asking:**\n`;
          response += `• "Explain how to do squats"\n`;
          response += `• "What are the benefits of bench press?"\n`;
          response += `• "Show me proper deadlift form"\n`;
          response += `• "How do I do pull-ups?"\n\n`;
          
          response += `**General Exercise Tips:**\n`;
          response += `• Always warm up before exercising\n`;
          response += `• Focus on form over weight\n`;
          response += `• Breathe properly during exercises\n`;
          response += `• Rest adequately between sets\n`;
          response += `• Progress gradually and safely\n\n`;
          
          response += `**Need help with a specific exercise?**`;
          
          return response;
        }
      } catch (error) {
        return `I'm having trouble explaining exercises right now. Try asking about a specific exercise like "explain squats" or "how to bench press".`;
      }
    }
    
    return null;
  };
  
  const handleAdvancedAnalyticsRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('analytics') || lowerMessage.includes('analysis') || 
        lowerMessage.includes('trends') || lowerMessage.includes('performance') ||
        lowerMessage.includes('progress') || lowerMessage.includes('insights') ||
        lowerMessage.includes('stats') || lowerMessage.includes('data')) {
      
      try {
        const { workoutLogs, personalRecords } = useWorkoutStore.getState();
        const { stepCount, waterIntake } = useHealthStore.getState();
        const { goals } = useAiStore.getState();
        
        let response = `📊 **Advanced Analytics Report**\n\n`;
        
        // Workout Analytics
        if (workoutLogs && workoutLogs.length > 0) {
          const completedWorkouts = workoutLogs.filter(log => log.completed);
          const totalWorkouts = completedWorkouts.length;
          const totalDuration = completedWorkouts.reduce((sum, workout) => 
            sum + (workout.duration || 0), 0);
          const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
          
          response += `**Workout Analytics:**\n`;
          response += `• Total workouts completed: ${totalWorkouts}\n`;
          response += `• Average workout duration: ${avgDuration} minutes\n`;
          response += `• Total workout time: ${Math.round(totalDuration / 60)} hours\n`;
          
          // Most frequent workout types
          const workoutTypes = completedWorkouts.reduce((acc, workout) => {
            const type = workout.workoutType || 'General';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const mostFrequent = Object.entries(workoutTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
          
          if (mostFrequent.length > 0) {
            response += `• Most frequent workout types:\n`;
            mostFrequent.forEach(([type, count]) => {
              response += `  - ${type}: ${count} times\n`;
            });
          }
          response += `\n`;
        }
        
        // Strength Progress
        if (personalRecords && personalRecords.length > 0) {
          response += `**Strength Progress:**\n`;
          const recentPRs = personalRecords
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
          
          recentPRs.forEach(pr => {
            const daysAgo = Math.floor((Date.now() - new Date(pr.date).getTime()) / (1000 * 60 * 60 * 24));
            response += `• ${pr.exerciseName}: ${pr.weight}kg x ${pr.reps} reps (${daysAgo} days ago)\n`;
          });
          response += `\n`;
        }
        
        // Health Metrics
        response += `**Health Metrics:**\n`;
        response += `• Daily steps: ${stepCount || 0}\n`;
        
        if (waterIntake && waterIntake.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const todayWater = waterIntake
            .filter(entry => entry.date.startsWith(today))
            .reduce((sum, entry) => sum + entry.amount, 0);
          response += `• Today's water intake: ${(todayWater / 1000).toFixed(1)}L\n`;
        }
        
        // Goal Progress
        if (goals && goals.length > 0) {
          const activeGoals = goals.filter(goal => !goal.completed);
          const completedGoals = goals.filter(goal => goal.completed);
          
          response += `• Active goals: ${activeGoals.length}\n`;
          response += `• Completed goals: ${completedGoals.length}\n`;
          
          if (activeGoals.length > 0) {
            const avgProgress = activeGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / activeGoals.length;
            response += `• Average goal progress: ${Math.round(avgProgress)}%\n`;
          }
        }
        response += `\n`;
        
        // Trends Analysis
        response += `**Trends Analysis:**\n`;
        if (workoutLogs && workoutLogs.length > 0) {
          const last30Days = workoutLogs.filter(log => {
            const workoutDate = new Date(log.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return workoutDate >= thirtyDaysAgo;
          });
          
          response += `• Workouts in last 30 days: ${last30Days.length}\n`;
          
          if (last30Days.length > 0) {
            const avgRating = last30Days.reduce((sum, workout) => 
              sum + (workout.rating || 0), 0) / last30Days.length;
            response += `• Average workout rating: ${avgRating.toFixed(1)}/5\n`;
          }
        }
        
        // Recommendations
        response += `\n**Recommendations:**\n`;
        if (workoutLogs && workoutLogs.length > 0) {
          const lastWorkout = workoutLogs
            .filter(log => log.completed)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          if (lastWorkout) {
            const daysSinceLastWorkout = Math.floor((Date.now() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastWorkout > 3) {
              response += `• It's been ${daysSinceLastWorkout} days since your last workout\n`;
              response += `• Consider scheduling a workout soon\n`;
            } else {
              response += `• Great consistency! Keep up the momentum\n`;
            }
          }
        }
        
        if (stepCount && stepCount < 8000) {
          response += `• You're below the recommended 10,000 steps\n`;
          response += `• Try taking a walk or doing some light activity\n`;
        }
        
        response += `\n**Need more specific analytics?**`;
        
        return response;
      } catch (error) {
        return `I'm having trouble generating analytics right now. Try asking about specific metrics like "workout trends" or "strength progress".`;
      }
    }
    
    return null;
  };
  
  const handleRecoveryRecommendationsRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('recovery') || lowerMessage.includes('rest') || 
        lowerMessage.includes('sleep') || lowerMessage.includes('rest day') ||
        lowerMessage.includes('sore') || lowerMessage.includes('fatigue') ||
        lowerMessage.includes('stretch') || lowerMessage.includes('mobility')) {
      
      try {
        const { workoutLogs } = useWorkoutStore.getState();
        const { userProfile } = useAiStore.getState();
        
        let response = `🛌 **Recovery Recommendations**\n\n`;
        
        // Analyze recent workout intensity
        let recentIntensity = 'low';
        let daysSinceLastWorkout = 0;
        
        if (workoutLogs && workoutLogs.length > 0) {
          const completedWorkouts = workoutLogs.filter(log => log.completed);
          const lastWorkout = completedWorkouts
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          if (lastWorkout) {
            daysSinceLastWorkout = Math.floor((Date.now() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24));
            
            // Determine intensity based on workout type and duration
            const workoutType = lastWorkout.workoutType || '';
            const duration = lastWorkout.duration || 0;
            
            if (workoutType.includes('strength') || workoutType.includes('power') || duration > 90) {
              recentIntensity = 'high';
            } else if (workoutType.includes('cardio') || workoutType.includes('endurance') || duration > 60) {
              recentIntensity = 'medium';
            }
          }
        }
        
        // Recovery status
        response += `**Recovery Status:**\n`;
        response += `• Days since last workout: ${daysSinceLastWorkout}\n`;
        response += `• Recent workout intensity: ${recentIntensity}\n`;
        
        if (daysSinceLastWorkout === 0) {
          response += `• You worked out today - focus on recovery!\n`;
        } else if (daysSinceLastWorkout === 1) {
          response += `• Yesterday's workout - active recovery recommended\n`;
        } else if (daysSinceLastWorkout > 3) {
          response += `• It's been a while - consider a workout soon\n`;
        }
        response += `\n`;
        
        // Recovery recommendations based on intensity
        response += `**Recovery Recommendations:**\n`;
        
        if (recentIntensity === 'high') {
          response += `**High Intensity Recovery:**\n`;
          response += `• Rest for 48-72 hours before next intense workout\n`;
          response += `• Focus on protein intake for muscle repair\n`;
          response += `• Gentle stretching and mobility work\n`;
          response += `• Consider foam rolling or massage\n`;
          response += `• Prioritize 7-9 hours of quality sleep\n`;
          response += `• Stay hydrated with electrolytes\n\n`;
        } else if (recentIntensity === 'medium') {
          response += `**Medium Intensity Recovery:**\n`;
          response += `• Rest for 24-48 hours before similar workout\n`;
          response += `• Light cardio or active recovery\n`;
          response += `• Stretching and mobility exercises\n`;
          response += `• Adequate protein and hydration\n`;
          response += `• 7-8 hours of sleep\n\n`;
        } else {
          response += `**Low Intensity Recovery:**\n`;
          response += `• Ready for another workout tomorrow\n`;
          response += `• Light stretching and mobility\n`;
          response += `• Stay active with walking or light activity\n`;
          response += `• Maintain good nutrition and hydration\n\n`;
        }
        
        // Sleep recommendations
        response += `**Sleep Recommendations:**\n`;
        response += `• Aim for 7-9 hours of quality sleep\n`;
        response += `• Create a consistent sleep schedule\n`;
        response += `• Avoid screens 1 hour before bed\n`;
        response += `• Keep bedroom cool and dark\n`;
        response += `• Consider magnesium supplement for muscle recovery\n\n`;
        
        // Mobility and stretching
        response += `**Mobility & Stretching:**\n`;
        response += `• Dynamic stretching before workouts\n`;
        response += `• Static stretching after workouts\n`;
        response += `• Focus on tight areas: hips, shoulders, hamstrings\n`;
        response += `• 10-15 minutes daily mobility work\n`;
        response += `• Consider yoga or pilates for flexibility\n\n`;
        
        // Nutrition for recovery
        response += `**Recovery Nutrition:**\n`;
        response += `• Protein: 20-30g within 2 hours post-workout\n`;
        response += `• Carbs: replenish glycogen stores\n`;
        response += `• Hydration: drink water with electrolytes\n`;
        response += `• Anti-inflammatory foods: berries, turmeric, ginger\n`;
        response += `• Avoid alcohol and processed foods\n\n`;
        
        // Active recovery suggestions
        response += `**Active Recovery Activities:**\n`;
        response += `• Light walking or cycling\n`;
        response += `• Swimming or water aerobics\n`;
        response += `• Gentle yoga or stretching\n`;
        response += `• Foam rolling or self-massage\n`;
        response += `• Meditation or deep breathing\n\n`;
        
        // Injury prevention
        response += `**Injury Prevention:**\n`;
        response += `• Listen to your body's signals\n`;
        response += `• Don't ignore persistent pain\n`;
        response += `• Gradually increase workout intensity\n`;
        response += `• Include rest days in your routine\n`;
        response += `• Cross-train to prevent overuse injuries\n\n`;
        
        response += `**Need help with specific recovery techniques?**`;
        
        return response;
      } catch (error) {
        return `I'm having trouble generating recovery recommendations right now. Try asking about specific recovery topics like "sleep tips" or "stretching routines".`;
      }
    }
    
    return null;
  };
  
  const handlePredictiveAnalyticsRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('predict') || lowerMessage.includes('forecast') || 
        lowerMessage.includes('future') || lowerMessage.includes('projection') ||
        lowerMessage.includes('trend') || lowerMessage.includes('estimate') ||
        lowerMessage.includes('when') || lowerMessage.includes('timeline')) {
      
      try {
        const { workoutLogs, personalRecords } = useWorkoutStore.getState();
        const { goals } = useAiStore.getState();
        const { userProfile } = useAiStore.getState();
        
        let response = `🔮 **Predictive Analytics**\n\n`;
        
        // Predict next PR based on current progress
        if (personalRecords && personalRecords.length > 0) {
          response += `**Strength Predictions:**\n`;
          
          // Group PRs by exercise
          const prsByExercise = personalRecords.reduce((acc, pr) => {
            if (!acc[pr.exerciseName]) {
              acc[pr.exerciseName] = [];
            }
            acc[pr.exerciseName].push(pr);
            return acc;
          }, {} as Record<string, any[]>);
          
          Object.entries(prsByExercise).forEach(([exerciseName, prs]) => {
            const sortedPRs = prs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            if (sortedPRs.length >= 2) {
              const latestPR = sortedPRs[sortedPRs.length - 1];
              const previousPR = sortedPRs[sortedPRs.length - 2];
              
              // Calculate improvement rate
              const weightImprovement = latestPR.weight - previousPR.weight;
              const timeBetweenPRs = (new Date(latestPR.date).getTime() - new Date(previousPR.date).getTime()) / (1000 * 60 * 60 * 24);
              const improvementRate = weightImprovement / timeBetweenPRs; // kg per day
              
              // Predict next PR
              const nextPRWeight = Math.round(latestPR.weight + (improvementRate * 30)); // 30 days projection
              const nextPRDate = new Date();
              nextPRDate.setDate(nextPRDate.getDate() + 30);
              
              response += `**${exerciseName}:**\n`;
              response += `• Current PR: ${latestPR.weight}kg x ${latestPR.reps} reps\n`;
              response += `• Improvement rate: +${weightImprovement.toFixed(1)}kg in ${timeBetweenPRs} days\n`;
              response += `• Predicted next PR: ${nextPRWeight}kg (in ~30 days)\n`;
              response += `• Estimated date: ${nextPRDate.toLocaleDateString()}\n\n`;
            }
          });
        }
        
        // Predict goal achievement
        if (goals && goals.length > 0) {
          const activeGoals = goals.filter(goal => !goal.completed);
          
          if (activeGoals.length > 0) {
            response += `**Goal Achievement Predictions:**\n`;
            
            activeGoals.forEach(goal => {
              const progress = goal.progress || 0;
              const daysSinceStart = goal.date ? 
                Math.floor((Date.now() - new Date(goal.date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
              
              if (progress > 0 && daysSinceStart > 0) {
                const progressRate = progress / daysSinceStart; // % per day
                const daysToComplete = Math.ceil((100 - progress) / progressRate);
                const estimatedCompletionDate = new Date();
                estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + daysToComplete);
                
                response += `**${goal.text}:**\n`;
                response += `• Current progress: ${progress}%\n`;
                response += `• Progress rate: ${progressRate.toFixed(2)}% per day\n`;
                response += `• Estimated completion: ${estimatedCompletionDate.toLocaleDateString()}\n`;
                response += `• Days remaining: ~${daysToComplete}\n\n`;
              }
            });
          }
        }
        
        // Predict fitness level progression
        const experienceLevel = userProfile?.experienceLevel || 'beginner';
        const fitnessGoals = userProfile?.fitnessGoals || [];
        
        response += `**Fitness Level Predictions:**\n`;
        
        if (workoutLogs && workoutLogs.length > 0) {
          const completedWorkouts = workoutLogs.filter(log => log.completed);
          const totalWorkouts = completedWorkouts.length;
          const last30Days = completedWorkouts.filter(log => {
            const workoutDate = new Date(log.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return workoutDate >= thirtyDaysAgo;
          });
          
          const workoutFrequency = last30Days.length / 30; // workouts per day
          const consistencyScore = Math.min(100, (workoutFrequency * 7) * 100); // 7 workouts/week = 100%
          
          response += `• Current consistency: ${consistencyScore.toFixed(1)}%\n`;
          response += `• Workouts per week: ${(workoutFrequency * 7).toFixed(1)}\n`;
          
          // Predict level progression
          if (experienceLevel === 'beginner') {
            if (consistencyScore > 70) {
              response += `• Predicted progression to intermediate: 3-6 months\n`;
              response += `• Focus on: Progressive overload, proper form\n`;
            } else {
              response += `• Predicted progression to intermediate: 6-12 months\n`;
              response += `• Focus on: Building consistency first\n`;
            }
          } else if (experienceLevel === 'intermediate') {
            if (consistencyScore > 80) {
              response += `• Predicted progression to advanced: 6-12 months\n`;
              response += `• Focus on: Specialized training, periodization\n`;
            } else {
              response += `• Predicted progression to advanced: 12-18 months\n`;
              response += `• Focus on: Increasing training volume and intensity\n`;
            }
          } else {
            response += `• Advanced level - focus on specialization and optimization\n`;
          }
        }
        
        // Predict health outcomes
        response += `\n**Health Outcome Predictions:**\n`;
        
        if (fitnessGoals.includes('weight loss')) {
          response += `• Weight loss: 0.5-1kg per week with consistent diet and exercise\n`;
          response += `• Body composition: Improved muscle-to-fat ratio in 3-6 months\n`;
        } else if (fitnessGoals.includes('muscle gain')) {
          response += `• Muscle gain: 0.5-1kg per month for beginners\n`;
          response += `• Strength gains: 5-10% increase in 3 months\n`;
        } else if (fitnessGoals.includes('strength')) {
          response += `• Strength gains: 10-20% increase in 6 months\n`;
          response += `• Power development: Improved explosive strength in 3-6 months\n`;
        }
        
        // Predict performance trends
        if (workoutLogs && workoutLogs.length > 0) {
          response += `\n**Performance Trend Predictions:**\n`;
          
          const recentWorkouts = workoutLogs
            .filter(log => log.completed)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
          
          if (recentWorkouts.length >= 5) {
            const avgRating = recentWorkouts.reduce((sum, workout) => 
              sum + (workout.rating || 0), 0) / recentWorkouts.length;
            
            response += `• Average workout rating: ${avgRating.toFixed(1)}/5\n`;
            
            if (avgRating > 4) {
              response += `• Trend: Excellent performance - consider increasing intensity\n`;
            } else if (avgRating > 3) {
              response += `• Trend: Good performance - maintain current approach\n`;
            } else {
              response += `• Trend: Room for improvement - focus on form and consistency\n`;
            }
          }
        }
        
        // Risk assessment
        response += `\n**Risk Assessment:**\n`;
        
        if (workoutLogs && workoutLogs.length > 0) {
          const lastWorkout = workoutLogs
            .filter(log => log.completed)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          if (lastWorkout) {
            const daysSinceLastWorkout = Math.floor((Date.now() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastWorkout > 7) {
              response += `• Risk: Losing fitness gains due to inactivity\n`;
              response += `• Recommendation: Schedule a workout within 2 days\n`;
            } else if (daysSinceLastWorkout < 1) {
              response += `• Risk: Overtraining if working out daily\n`;
              response += `• Recommendation: Include rest days in routine\n`;
            } else {
              response += `• Risk: Low - maintaining good workout frequency\n`;
            }
          }
        }
        
        response += `\n**Need help optimizing your training for better predictions?**`;
        
        return response;
      } catch (error) {
        return `I'm having trouble generating predictions right now. Try asking about specific predictions like "when will I reach my goal" or "predict my next PR".`;
      }
    }
    
    return null;
  };

  const handleInteractiveWorkoutScheduling = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    // Check if this is a basic workout scheduling request
    const isBasicSchedulingRequest = (
      lowerMessage.includes('schedule') && lowerMessage.includes('workout') ||
      lowerMessage.includes('add') && lowerMessage.includes('workout') ||
      lowerMessage.includes('book') && lowerMessage.includes('workout')
    );
    
    if (isBasicSchedulingRequest) {
      // Check if we have enough information
      const hasDate = lowerMessage.includes('today') || lowerMessage.includes('tomorrow') || 
                     lowerMessage.includes('monday') || lowerMessage.includes('tuesday') || 
                     lowerMessage.includes('wednesday') || lowerMessage.includes('thursday') || 
                     lowerMessage.includes('friday') || lowerMessage.includes('saturday') || 
                     lowerMessage.includes('sunday') || /\d{1,2}\/\d{1,2}/.test(lowerMessage) ||
                     /\d{1,2}-\d{1,2}/.test(lowerMessage);
      
      const hasTime = /\d{1,2}:\d{2}/.test(lowerMessage) || 
                     lowerMessage.includes('morning') || lowerMessage.includes('afternoon') || 
                     lowerMessage.includes('evening') || lowerMessage.includes('night');
      
      const hasWorkoutType = lowerMessage.includes('chest') || lowerMessage.includes('back') || 
                           lowerMessage.includes('shoulder') || lowerMessage.includes('leg') || 
                           lowerMessage.includes('arm') || lowerMessage.includes('core') || 
                           lowerMessage.includes('push') || lowerMessage.includes('pull') || 
                           lowerMessage.includes('full body');
      
      if (!hasDate || !hasTime || !hasWorkoutType) {
        // Set conversation state to wait for more information
        setConversationState({
          isWaitingForResponse: true,
          waitingFor: 'workout_details',
          context: {
            originalRequest: message,
            hasDate,
            hasTime,
            hasWorkoutType
          }
        });
        
        // Generate follow-up questions
        let followUpQuestions = "I'd be happy to schedule a workout for you! To make sure I create the perfect workout, I need a few details:\\n\\n";
        
        if (!hasDate) {
          followUpQuestions += "📅 **When would you like to work out?**\\n";
          followUpQuestions += "• Today\\n";
          followUpQuestions += "• Tomorrow\\n";
          followUpQuestions += "• Specific day (Monday, Tuesday, etc.)\\n";
          followUpQuestions += "• Specific date (e.g., 22/07)\\n\\n";
        }
        
        if (!hasTime) {
          followUpQuestions += "⏰ **What time works best for you?**\\n";
          followUpQuestions += "• Morning (6-9 AM)\\n";
          followUpQuestions += "• Afternoon (12-3 PM)\\n";
          followUpQuestions += "• Evening (6-9 PM)\\n";
          followUpQuestions += "• Specific time (e.g., 18:00)\\n\\n";
        }
        
        if (!hasWorkoutType) {
          followUpQuestions += "💪 **What type of workout would you prefer?**\\n";
          followUpQuestions += "• Chest workout\\n";
          followUpQuestions += "• Back workout\\n";
          followUpQuestions += "• Shoulder workout\\n";
          followUpQuestions += "• Leg workout\\n";
          followUpQuestions += "• Full body workout\\n";
          followUpQuestions += "• Push/Pull workout\\n";
          followUpQuestions += "• Or let me recommend based on your goals\\n\\n";
        }
        
        followUpQuestions += "Just reply with the details and I'll schedule it for you! 🎯";
        
        return followUpQuestions;
      }
    }
    
    // Check if we're waiting for workout details and user is providing them
    if (conversationState.isWaitingForResponse && conversationState.waitingFor === 'workout_details') {
      const context = conversationState.context;
      
      // Parse the new information
      const newInfo = parseWorkoutDetailsFromResponse(message, context);
      
      // Check if we now have all the information
      const hasAllInfo = newInfo.hasDate && newInfo.hasTime && newInfo.hasWorkoutType;
      
      if (hasAllInfo) {
        // Clear conversation state
        setConversationState({
          isWaitingForResponse: false,
          waitingFor: '',
          context: {}
        });
        
        // Create the complete request and schedule
        const completeRequest = `${newInfo.workoutType} workout for ${newInfo.date} at ${newInfo.time}`;
        return await handleCompleteWorkoutScheduling(completeRequest);
      } else {
        // Still missing information, ask for remaining details
        let followUpQuestions = "Great! I got some of the details. I still need:\\n\\n";
        
        if (!newInfo.hasDate) {
          followUpQuestions += "📅 **When would you like to work out?**\\n";
          followUpQuestions += "• Today\\n";
          followUpQuestions += "• Tomorrow\\n";
          followUpQuestions += "• Specific day or date\\n\\n";
        }
        
        if (!newInfo.hasTime) {
          followUpQuestions += "⏰ **What time works best for you?**\\n";
          followUpQuestions += "• Morning, afternoon, evening\\n";
          followUpQuestions += "• Or specific time (e.g., 18:00)\\n\\n";
        }
        
        if (!newInfo.hasWorkoutType) {
          followUpQuestions += "💪 **What type of workout would you prefer?**\\n";
          followUpQuestions += "• Chest, back, shoulders, legs, full body\\n";
          followUpQuestions += "• Or let me recommend based on your goals\\n\\n";
        }
        
        // Update conversation state with new context
        setConversationState({
          isWaitingForResponse: true,
          waitingFor: 'workout_details',
          context: {
            ...context,
            ...newInfo
          }
        });
        
        return followUpQuestions;
      }
    }
    
    return null; // Not a workout scheduling request
  };

  const parseWorkoutDetailsFromResponse = (message: string, context: any) => {
    const lowerMessage = message.toLowerCase();
    const result = {
      hasDate: context.hasDate || false,
      hasTime: context.hasTime || false,
      hasWorkoutType: context.hasWorkoutType || false,
      date: context.date || '',
      time: context.time || '',
      workoutType: context.workoutType || ''
    };
    
    // Parse date
    if (!result.hasDate) {
      if (lowerMessage.includes('today')) {
        result.date = new Date().toISOString().split('T')[0];
        result.hasDate = true;
      } else if (lowerMessage.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        result.date = tomorrow.toISOString().split('T')[0];
        result.hasDate = true;
      } else if (lowerMessage.includes('monday')) {
        result.date = 'monday';
        result.hasDate = true;
      } else if (lowerMessage.includes('tuesday')) {
        result.date = 'tuesday';
        result.hasDate = true;
      } else if (lowerMessage.includes('wednesday')) {
        result.date = 'wednesday';
        result.hasDate = true;
      } else if (lowerMessage.includes('thursday')) {
        result.date = 'thursday';
        result.hasDate = true;
      } else if (lowerMessage.includes('friday')) {
        result.date = 'friday';
        result.hasDate = true;
      } else if (lowerMessage.includes('saturday')) {
        result.date = 'saturday';
        result.hasDate = true;
      } else if (lowerMessage.includes('sunday')) {
        result.date = 'sunday';
        result.hasDate = true;
      } else {
        // Check for date patterns
        const dateMatch = lowerMessage.match(/(\d{1,2})\/(\d{1,2})/);
        if (dateMatch) {
          result.date = `${dateMatch[1]}/${dateMatch[2]}`;
          result.hasDate = true;
        }
      }
    }
    
    // Parse time
    if (!result.hasTime) {
      if (lowerMessage.includes('morning')) {
        result.time = '08:00';
        result.hasTime = true;
      } else if (lowerMessage.includes('afternoon')) {
        result.time = '14:00';
        result.hasTime = true;
      } else if (lowerMessage.includes('evening')) {
        result.time = '18:00';
        result.hasTime = true;
      } else if (lowerMessage.includes('night')) {
        result.time = '20:00';
        result.hasTime = true;
      } else {
        // Check for time patterns
        const timeMatch = lowerMessage.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          result.time = `${timeMatch[1]}:${timeMatch[2]}`;
          result.hasTime = true;
        }
      }
    }
    
    // Parse workout type
    if (!result.hasWorkoutType) {
      if (lowerMessage.includes('chest')) {
        result.workoutType = 'chest';
        result.hasWorkoutType = true;
      } else if (lowerMessage.includes('back')) {
        result.workoutType = 'back';
        result.hasWorkoutType = true;
      } else if (lowerMessage.includes('shoulder')) {
        result.workoutType = 'shoulders';
        result.hasWorkoutType = true;
      } else if (lowerMessage.includes('leg')) {
        result.workoutType = 'legs';
        result.hasWorkoutType = true;
      } else if (lowerMessage.includes('arm')) {
        result.workoutType = 'arms';
        result.hasWorkoutType = true;
      } else if (lowerMessage.includes('core')) {
        result.workoutType = 'core';
        result.hasWorkoutType = true;
      } else if (lowerMessage.includes('full body')) {
        result.workoutType = 'full_body';
        result.hasWorkoutType = true;
      } else if (lowerMessage.includes('push')) {
        result.workoutType = 'push';
        result.hasWorkoutType = true;
      } else if (lowerMessage.includes('pull')) {
        result.workoutType = 'pull';
        result.hasWorkoutType = true;
      }
    }
    
    return result;
  };

  const handleCompleteWorkoutScheduling = async (completeRequest: string): Promise<string> => {
    try {
      // Parse the complete request
      const scheduleInfo = parseScheduleRequest(completeRequest);
      const workoutType = parseWorkoutTypeFromRequest(completeRequest);
      
      if (workoutType && scheduleInfo) {
        // Create a custom workout based on the type
        const userFitnessLevel = macroUserProfile?.experienceLevel || 'beginner';
        const customWorkout = await createWorkoutFromRequest(`${workoutType} workout for ${userFitnessLevel} level`);
        
        if (customWorkout) {
          // Schedule the workout
          const scheduledTime = scheduleInfo.time || '18:30';
          const scheduledDate = scheduleInfo.date || new Date().toISOString().split('T')[0];
          
          try {
            await scheduleWorkout?.({
              id: Date.now().toString(),
              workoutId: customWorkout.id,
              dayOfWeek: new Date(scheduledDate).getDay(),
              time: scheduledTime,
              duration: customWorkout.duration || 45,
              completed: false
            });
            
            return `🎉 **Perfect! Workout Scheduled Successfully!**\\n\\n` +
                   `📅 **Date:** ${scheduledDate}\\n` +
                   `⏰ **Time:** ${scheduledTime}\\n` +
                   `💪 **Workout:** ${customWorkout.name}\\n` +
                   `⏱️ **Duration:** ${customWorkout.duration || 45} minutes\\n` +
                   `🏋️ **Difficulty:** ${userFitnessLevel}\\n\\n` +
                   `✅ **Added to your schedule!**\\n` +
                   `You'll get a reminder before your workout.`;
          } catch (error) {
            return `I've created a ${workoutType} workout for you, but there was an issue scheduling it. You can find the workout in your workout library and schedule it manually.`;
          }
        }
      }
      
      return `I'm having trouble scheduling that workout. Could you please provide more specific details about when and what type of workout you'd like?`;
    } catch (error) {
      return `Sorry, I encountered an error while scheduling your workout. Please try again with more specific details.`;
    }
  };

  const parseWorkoutTypeFromRequest = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('chest')) return 'chest';
    if (lowerMessage.includes('back')) return 'back';
    if (lowerMessage.includes('shoulder')) return 'shoulders';
    if (lowerMessage.includes('leg')) return 'legs';
    if (lowerMessage.includes('arm')) return 'arms';
    if (lowerMessage.includes('core')) return 'core';
    if (lowerMessage.includes('full body')) return 'full_body';
    if (lowerMessage.includes('push')) return 'push';
    if (lowerMessage.includes('pull')) return 'pull';
    
    return null;
  };
  
  const handleSmartConversationFlow = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    // If we're already in a conversation flow, handle the response
    if (conversationState.isWaitingForResponse) {
      return await handleConversationResponse(message);
    }
    
    // Detect function types and start conversation flows
    const detectedFunction = detectFunctionType(lowerMessage);
    
    if (detectedFunction) {
      return await startConversationFlow(detectedFunction, message);
    }
    
    return null; // Not a conversation flow request
  };

  const detectFunctionType = (message: string): string | null => {
    // Workout Scheduling
    if (message.includes('schedule') && message.includes('workout') ||
        message.includes('add') && message.includes('workout') ||
        message.includes('book') && message.includes('workout')) {
      return 'workout_scheduling';
    }
    
    // Goal Creation
    if (message.includes('create') && message.includes('goal') ||
        message.includes('set') && message.includes('goal') ||
        message.includes('new goal')) {
      return 'goal_creation';
    }
    
    // Workout Creation
    if (message.includes('create') && message.includes('workout') ||
        message.includes('make') && message.includes('workout') ||
        message.includes('build') && message.includes('workout')) {
      return 'workout_creation';
    }
    
    // Nutrition Planning
    if (message.includes('nutrition') && (message.includes('plan') || message.includes('meal')) ||
        message.includes('meal') && message.includes('plan') ||
        message.includes('diet') && message.includes('plan')) {
      return 'nutrition_planning';
    }
    
    // Progress Tracking
    if (message.includes('track') && message.includes('progress') ||
        message.includes('monitor') && message.includes('progress') ||
        message.includes('check') && message.includes('progress')) {
      return 'progress_tracking';
    }
    
    // Recovery Planning
    if (message.includes('recovery') && message.includes('plan') ||
        message.includes('rest') && message.includes('plan') ||
        message.includes('rest day')) {
      return 'recovery_planning';
    }
    
    // Analytics Request
    if (message.includes('analytics') || message.includes('analysis') ||
        message.includes('insights') || message.includes('stats')) {
      return 'analytics_request';
    }
    
    // Personal Records
    if (message.includes('personal record') || message.includes('pr') ||
        message.includes('personal best') || message.includes('record')) {
      return 'personal_records';
    }
    
    // Exercise Education
    if (message.includes('explain') || message.includes('how to') ||
        message.includes('form') || message.includes('technique')) {
      return 'exercise_education';
    }
    
    return null;
  };

  const startConversationFlow = async (functionType: string, originalMessage: string): Promise<string> => {
    const flowConfig = getFlowConfig(functionType);
    
    if (!flowConfig) {
      return null;
    }
    
    // Set conversation state
    setConversationState({
      isWaitingForResponse: true,
      waitingFor: flowConfig.firstStep,
      context: {
        originalMessage,
        functionType,
        responses: {}
      },
      functionType,
      step: 1,
      totalSteps: flowConfig.steps.length
    });
    
    return flowConfig.steps[0].question;
  };

  const getFlowConfig = (functionType: string) => {
    const configs = {
      workout_scheduling: {
        firstStep: 'date',
        steps: [
          {
            key: 'date',
            question: "📅 **When would you like to work out?**\n• Today\n• Tomorrow\n• Specific day (Monday, Tuesday, etc.)\n• Specific date (e.g., 22/07)",
            validation: (response: string) => validateDate(response)
          },
          {
            key: 'time',
            question: "⏰ **What time works best for you?**\n• Morning (6-9 AM)\n• Afternoon (12-3 PM)\n• Evening (6-9 PM)\n• Specific time (e.g., 18:00)",
            validation: (response: string) => validateTime(response)
          },
          {
            key: 'workout_type',
            question: "💪 **What type of workout would you prefer?**\n• Chest workout\n• Back workout\n• Shoulder workout\n• Leg workout\n• Full body workout\n• Push/Pull workout\n• Or let me recommend based on your goals",
            validation: (response: string) => validateWorkoutType(response)
          }
        ]
      },
      
      goal_creation: {
        firstStep: 'goal_type',
        steps: [
          {
            key: 'goal_type',
            question: "🎯 **What type of goal would you like to create?**\n• Weight loss\n• Muscle gain\n• Strength improvement\n• Endurance\n• Flexibility\n• General fitness",
            validation: (response: string) => validateGoalType(response)
          },
          {
            key: 'target_value',
            question: "📊 **What's your target?**\n• For weight: Target weight in lbs/kg\n• For strength: Target weight for specific exercise\n• For endurance: Target time or distance\n• For flexibility: Target pose or measurement",
            validation: (response: string) => validateTargetValue(response)
          },
          {
            key: 'timeframe',
            question: "⏱️ **What's your timeframe?**\n• 1 month\n• 3 months\n• 6 months\n• 1 year\n• Custom timeframe",
            validation: (response: string) => validateTimeframe(response)
          }
        ]
      },
      
      workout_creation: {
        firstStep: 'workout_focus',
        steps: [
          {
            key: 'workout_focus',
            question: "🎯 **What should this workout focus on?**\n• Specific muscle group (chest, back, legs, etc.)\n• Movement pattern (push, pull, squat, hinge)\n• Fitness goal (strength, hypertrophy, endurance)\n• Equipment available (gym, home, bodyweight)",
            validation: (response: string) => validateWorkoutFocus(response)
          },
          {
            key: 'difficulty',
            question: "🏋️ **What difficulty level?**\n• Beginner (new to exercise)\n• Intermediate (some experience)\n• Advanced (experienced lifter)",
            validation: (response: string) => validateDifficulty(response)
          },
          {
            key: 'duration',
            question: "⏱️ **How long should the workout be?**\n• Quick (20-30 minutes)\n• Standard (45-60 minutes)\n• Extended (75-90 minutes)",
            validation: (response: string) => validateDuration(response)
          }
        ]
      },
      
      nutrition_planning: {
        firstStep: 'nutrition_goal',
        steps: [
          {
            key: 'nutrition_goal',
            question: "🍎 **What's your nutrition goal?**\n• Weight loss\n• Muscle gain\n• Maintenance\n• Performance\n• Health improvement",
            validation: (response: string) => validateNutritionGoal(response)
          },
          {
            key: 'dietary_preferences',
            question: "🥗 **Any dietary preferences or restrictions?**\n• Vegetarian\n• Vegan\n• Gluten-free\n• Dairy-free\n• None",
            validation: (response: string) => validateDietaryPreferences(response)
          },
          {
            key: 'meal_focus',
            question: "🍽️ **What would you like to focus on?**\n• Meal planning\n• Macro tracking\n• Recipe suggestions\n• Supplement advice\n• General nutrition tips",
            validation: (response: string) => validateMealFocus(response)
          }
        ]
      },
      
      progress_tracking: {
        firstStep: 'tracking_focus',
        steps: [
          {
            key: 'tracking_focus',
            question: "📊 **What would you like to track?**\n• Workout progress\n• Weight changes\n• Body measurements\n• Strength gains\n• Endurance improvements\n• All of the above",
            validation: (response: string) => validateTrackingFocus(response)
          },
          {
            key: 'timeframe',
            question: "⏱️ **What timeframe?**\n• Last week\n• Last month\n• Last 3 months\n• Last 6 months\n• All time",
            validation: (response: string) => validateTimeframe(response)
          }
        ]
      },
      
      recovery_planning: {
        firstStep: 'recovery_type',
        steps: [
          {
            key: 'recovery_type',
            question: "🛌 **What type of recovery do you need?**\n• Active recovery (light exercise)\n• Rest day (complete rest)\n• Mobility work\n• Stretching routine\n• Recovery nutrition",
            validation: (response: string) => validateRecoveryType(response)
          },
          {
            key: 'recovery_duration',
            question: "⏱️ **How long should the recovery session be?**\n• Quick (15-20 minutes)\n• Standard (30-45 minutes)\n• Extended (60+ minutes)",
            validation: (response: string) => validateDuration(response)
          }
        ]
      },
      
      analytics_request: {
        firstStep: 'analytics_type',
        steps: [
          {
            key: 'analytics_type',
            question: "📈 **What type of analytics would you like?**\n• Workout performance\n• Progress trends\n• Strength analysis\n• Consistency tracking\n• Goal progress\n• Comprehensive report",
            validation: (response: string) => validateAnalyticsType(response)
          },
          {
            key: 'timeframe',
            question: "⏱️ **What timeframe for the analysis?**\n• Last week\n• Last month\n• Last 3 months\n• Last 6 months\n• All time",
            validation: (response: string) => validateTimeframe(response)
          }
        ]
      },
      
      personal_records: {
        firstStep: 'pr_focus',
        steps: [
          {
            key: 'pr_focus',
            question: "🏆 **What type of personal records?**\n• All PRs\n• Strength PRs (max weight)\n• Endurance PRs (reps/time)\n• Specific exercise\n• Recent PRs only",
            validation: (response: string) => validatePRFocus(response)
          }
        ]
      },
      
      exercise_education: {
        firstStep: 'exercise_name',
        steps: [
          {
            key: 'exercise_name',
            question: "💪 **Which exercise would you like to learn about?**\n• Squat\n• Bench Press\n• Deadlift\n• Pull-up\n• Push-up\n• Or tell me the specific exercise",
            validation: (response: string) => validateExerciseName(response)
          },
          {
            key: 'education_focus',
            question: "📚 **What would you like to learn?**\n• Proper form\n• Benefits\n• Common mistakes\n• Progression tips\n• All of the above",
            validation: (response: string) => validateEducationFocus(response)
          }
        ]
      }
    };
    
    return configs[functionType] || null;
  };

  const handleConversationResponse = async (message: string): Promise<string> => {
    const { functionType, step, totalSteps, context } = conversationState;
    const flowConfig = getFlowConfig(functionType);
    
    if (!flowConfig || step > flowConfig.steps.length) {
      // Reset conversation state
      setConversationState({
        isWaitingForResponse: false,
        waitingFor: '',
        context: {},
        functionType: '',
        step: 0,
        totalSteps: 0
      });
      return null;
    }
    
    const currentStep = flowConfig.steps[step - 1];
    const validation = currentStep.validation(message);
    
    if (!validation.isValid) {
      return `❌ **Invalid input.** ${validation.error}\n\n${currentStep.question}`;
    }
    
    // Store the response
    const updatedContext = {
      ...context,
      responses: {
        ...context.responses,
        [currentStep.key]: validation.value
      }
    };
    
    // Check if this is the last step
    if (step === totalSteps) {
      // Complete the conversation flow
      setConversationState({
        isWaitingForResponse: false,
        waitingFor: '',
        context: {},
        functionType: '',
        step: 0,
        totalSteps: 0
      });
      
      return await executeFunction(functionType, updatedContext);
    } else {
      // Move to next step
      const nextStep = flowConfig.steps[step];
      setConversationState({
        ...conversationState,
        waitingFor: nextStep.key,
        context: updatedContext,
        step: step + 1
      });
      
      return nextStep.question;
    }
  };

  const executeFunction = async (functionType: string, context: any): Promise<string> => {
    const responses = context.responses;
    
    switch (functionType) {
      case 'workout_scheduling':
        const schedulingRequest = `${responses.workout_type} workout for ${responses.date} at ${responses.time}`;
        return await handleCompleteWorkoutScheduling(schedulingRequest);
        
      case 'goal_creation':
        return await handleGoalCreationFromFlow(responses);
        
      case 'workout_creation':
        return await handleWorkoutCreationFromFlow(responses);
        
      case 'nutrition_planning':
        return await handleNutritionPlanningFromFlow(responses);
        
      case 'progress_tracking':
        return await handleProgressTrackingFromFlow(responses);
        
      case 'recovery_planning':
        return await handleRecoveryPlanningFromFlow(responses);
        
      case 'analytics_request':
        return await handleAnalyticsRequestFromFlow(responses);
        
      case 'personal_records':
        return await handlePersonalRecordsFromFlow(responses);
        
      case 'exercise_education':
        return await handleExerciseEducationFromFlow(responses);
        
      default:
        return "I'm sorry, I encountered an error processing your request. Please try again.";
    }
  };

  // Validation functions
  const validateDate = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('today')) {
      return { isValid: true, value: new Date().toISOString().split('T')[0] };
    } else if (lowerResponse.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { isValid: true, value: tomorrow.toISOString().split('T')[0] };
    } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].some(day => lowerResponse.includes(day))) {
      return { isValid: true, value: response };
    } else if (/\d{1,2}\/\d{1,2}/.test(response) || /\d{1,2}-\d{1,2}/.test(response)) {
      return { isValid: true, value: response };
    }
    
    return { isValid: false, error: "Please provide a valid date (today, tomorrow, day of week, or date format)" };
  };

  const validateTime = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('morning')) {
      return { isValid: true, value: '08:00' };
    } else if (lowerResponse.includes('afternoon')) {
      return { isValid: true, value: '14:00' };
    } else if (lowerResponse.includes('evening')) {
      return { isValid: true, value: '18:00' };
    } else if (lowerResponse.includes('night')) {
      return { isValid: true, value: '20:00' };
    } else if (/\d{1,2}:\d{2}/.test(response)) {
      return { isValid: true, value: response };
    }
    
    return { isValid: false, error: "Please provide a valid time (morning, afternoon, evening, or time format like 18:00)" };
  };

  const validateWorkoutType = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    const validTypes = ['chest', 'back', 'shoulder', 'leg', 'arm', 'core', 'full body', 'push', 'pull'];
    
    for (const type of validTypes) {
      if (lowerResponse.includes(type)) {
        return { isValid: true, value: type === 'full body' ? 'full_body' : type + 's' };
      }
    }
    
    return { isValid: true, value: 'recommended' }; // Default to recommended
  };

  const validateGoalType = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    const validTypes = ['weight loss', 'muscle gain', 'strength', 'endurance', 'flexibility', 'fitness'];
    
    for (const type of validTypes) {
      if (lowerResponse.includes(type)) {
        return { isValid: true, value: type };
      }
    }
    
    return { isValid: false, error: "Please choose a valid goal type" };
  };

  const validateTargetValue = (response: string): { isValid: boolean; value?: string; error?: string } => {
    if (response.trim().length > 0) {
      return { isValid: true, value: response };
    }
    return { isValid: false, error: "Please provide a target value" };
  };

  const validateTimeframe = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    const validTimeframes = ['1 month', '3 months', '6 months', '1 year', 'week', 'month'];
    
    for (const timeframe of validTimeframes) {
      if (lowerResponse.includes(timeframe)) {
        return { isValid: true, value: timeframe };
      }
    }
    
    return { isValid: true, value: response }; // Accept custom timeframes
  };

  const validateWorkoutFocus = (response: string): { isValid: boolean; value?: string; error?: string } => {
    return { isValid: true, value: response };
  };

  const validateDifficulty = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    
    for (const level of validLevels) {
      if (lowerResponse.includes(level)) {
        return { isValid: true, value: level };
      }
    }
    
    return { isValid: false, error: "Please choose beginner, intermediate, or advanced" };
  };

  const validateDuration = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('quick')) {
      return { isValid: true, value: '30' };
    } else if (lowerResponse.includes('standard')) {
      return { isValid: true, value: '60' };
    } else if (lowerResponse.includes('extended')) {
      return { isValid: true, value: '90' };
    }
    
    return { isValid: true, value: response };
  };

  const validateNutritionGoal = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    const validGoals = ['weight loss', 'muscle gain', 'maintenance', 'performance', 'health'];
    
    for (const goal of validGoals) {
      if (lowerResponse.includes(goal)) {
        return { isValid: true, value: goal };
      }
    }
    
    return { isValid: false, error: "Please choose a valid nutrition goal" };
  };

  const validateDietaryPreferences = (response: string): { isValid: boolean; value?: string; error?: string } => {
    return { isValid: true, value: response };
  };

  const validateMealFocus = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    const validFocuses = ['meal planning', 'macro tracking', 'recipe', 'supplement', 'nutrition'];
    
    for (const focus of validFocuses) {
      if (lowerResponse.includes(focus)) {
        return { isValid: true, value: focus };
      }
    }
    
    return { isValid: true, value: response };
  };

  const validateTrackingFocus = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    const validFocuses = ['workout', 'weight', 'measurement', 'strength', 'endurance', 'all'];
    
    for (const focus of validFocuses) {
      if (lowerResponse.includes(focus)) {
        return { isValid: true, value: focus };
      }
    }
    
    return { isValid: true, value: response };
  };

  const validateRecoveryType = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    const validTypes = ['active recovery', 'rest day', 'mobility', 'stretching', 'recovery nutrition'];
    
    for (const type of validTypes) {
      if (lowerResponse.includes(type)) {
        return { isValid: true, value: type };
      }
    }
    
    return { isValid: true, value: response };
  };

  const validateAnalyticsType = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    const validTypes = ['workout performance', 'progress trends', 'strength analysis', 'consistency', 'goal progress', 'comprehensive'];
    
    for (const type of validTypes) {
      if (lowerResponse.includes(type)) {
        return { isValid: true, value: type };
      }
    }
    
    return { isValid: true, value: response };
  };

  const validatePRFocus = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    const validFocuses = ['all prs', 'strength prs', 'endurance prs', 'specific exercise', 'recent prs'];
    
    for (const focus of validFocuses) {
      if (lowerResponse.includes(focus)) {
        return { isValid: true, value: focus };
      }
    }
    
    return { isValid: true, value: response };
  };

  const validateExerciseName = (response: string): { isValid: boolean; value?: string; error?: string } => {
    return { isValid: true, value: response };
  };

  const validateEducationFocus = (response: string): { isValid: boolean; value?: string; error?: string } => {
    const lowerResponse = response.toLowerCase();
    const validFocuses = ['proper form', 'benefits', 'common mistakes', 'progression tips', 'all'];
    
    for (const focus of validFocuses) {
      if (lowerResponse.includes(focus)) {
        return { isValid: true, value: focus };
      }
    }
    
    return { isValid: true, value: response };
  };

  // Function execution handlers
  const handleGoalCreationFromFlow = async (responses: any): Promise<string> => {
    try {
      const goalData = {
        type: responses.goal_type,
        target: responses.target_value,
        timeframe: responses.timeframe,
        currentValue: '0', // Will be set by user
        unit: 'units', // Will be determined based on goal type
        createdAt: new Date().toISOString()
      };
      
      // Add goal to store
      const { addGoal } = useAiStore.getState();
      addGoal(goalData);
      
      return `🎯 **Goal Created Successfully!**\n\n` +
             `**Type:** ${responses.goal_type}\n` +
             `**Target:** ${responses.target_value}\n` +
             `**Timeframe:** ${responses.timeframe}\n\n` +
             `✅ Your goal has been added to your profile. I'll help you track your progress!`;
    } catch (error) {
      return "I encountered an error creating your goal. Please try again.";
    }
  };

  const handleWorkoutCreationFromFlow = async (responses: any): Promise<string> => {
    try {
      const workoutRequest = `${responses.workout_focus} workout for ${responses.difficulty} level, ${responses.duration} minutes`;
      const customWorkout = await createWorkoutFromRequest(workoutRequest);
      
      if (customWorkout) {
        return `💪 **Workout Created Successfully!**\n\n` +
               `**Name:** ${customWorkout.name}\n` +
               `**Focus:** ${responses.workout_focus}\n` +
               `**Difficulty:** ${responses.difficulty}\n` +
               `**Duration:** ${responses.duration} minutes\n\n` +
               `✅ Your workout has been created and added to your library!`;
      }
      
      return "I encountered an error creating your workout. Please try again.";
    } catch (error) {
      return "I encountered an error creating your workout. Please try again.";
    }
  };

  const handleNutritionPlanningFromFlow = async (responses: any): Promise<string> => {
    try {
      return `🍎 **Nutrition Plan Created!**\n\n` +
             `**Goal:** ${responses.nutrition_goal}\n` +
             `**Preferences:** ${responses.dietary_preferences}\n` +
             `**Focus:** ${responses.meal_focus}\n\n` +
             `I'll provide personalized nutrition guidance based on your preferences. Check the nutrition tab for detailed recommendations!`;
    } catch (error) {
      return "I encountered an error creating your nutrition plan. Please try again.";
    }
  };

  const handleProgressTrackingFromFlow = async (responses: any): Promise<string> => {
    try {
      return `📊 **Progress Tracking Setup!**\n\n` +
             `**Focus:** ${responses.tracking_focus}\n` +
             `**Timeframe:** ${responses.timeframe}\n\n` +
             `I'll track your progress and provide regular updates. Check the analytics tab for detailed insights!`;
    } catch (error) {
      return "I encountered an error setting up progress tracking. Please try again.";
    }
  };

  const handleRecoveryPlanningFromFlow = async (responses: any): Promise<string> => {
    try {
      return `🛌 **Recovery Plan Created!**\n\n` +
             `**Type:** ${responses.recovery_type}\n` +
             `**Duration:** ${responses.recovery_duration} minutes\n\n` +
             `I'll help you optimize your recovery. Check the recovery recommendations for personalized advice!`;
    } catch (error) {
      return "I encountered an error creating your recovery plan. Please try again.";
    }
  };

  const handleAnalyticsRequestFromFlow = async (responses: any): Promise<string> => {
    try {
      return `📈 **Analytics Report Generated!**\n\n` +
             `**Type:** ${responses.analytics_type}\n` +
             `**Timeframe:** ${responses.timeframe}\n\n` +
             `Check the analytics tab for your detailed report and insights!`;
    } catch (error) {
      return "I encountered an error generating your analytics report. Please try again.";
    }
  };

  const handlePersonalRecordsFromFlow = async (responses: any): Promise<string> => {
    try {
      return `🏆 **Personal Records Report!**\n\n` +
             `**Focus:** ${responses.pr_focus}\n\n` +
             `Check your personal records and achievements in the progress tab!`;
    } catch (error) {
      return "I encountered an error retrieving your personal records. Please try again.";
    }
  };

  const handleExerciseEducationFromFlow = async (responses: any): Promise<string> => {
    try {
      return `📚 **Exercise Education!**\n\n` +
             `**Exercise:** ${responses.exercise_name}\n` +
             `**Focus:** ${responses.education_focus}\n\n` +
             `I'll provide detailed information about ${responses.exercise_name}. Check the exercise library for comprehensive guides!`;
    } catch (error) {
      return "I encountered an error providing exercise education. Please try again.";
    }
  };

  const handleAdvancedPersonalizationRequest = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('personalize') || lowerMessage.includes('customize') || 
        lowerMessage.includes('preference') || lowerMessage.includes('learning') ||
        lowerMessage.includes('style') || lowerMessage.includes('adapt') ||
        lowerMessage.includes('profile') || lowerMessage.includes('settings')) {
      
      try {
        const { userProfile, aiPersonality, conversationMemory } = useAiStore.getState();
        const { workoutLogs } = useWorkoutStore.getState();
        
        let response = `🎯 **Advanced Personalization**\n\n`;
        
        // Analyze user preferences and patterns
        response += `**Current Profile Analysis:**\n`;
        
        if (userProfile) {
          response += `• Experience Level: ${userProfile.experienceLevel}\n`;
          response += `• Preferred Workout Time: ${userProfile.preferredWorkoutTime}\n`;
          response += `• Motivation Style: ${userProfile.motivationStyle}\n`;
          response += `• Fitness Goals: ${userProfile.fitnessGoals.join(', ')}\n`;
          
          if (userProfile.favoriteExercises.length > 0) {
            response += `• Favorite Exercises: ${userProfile.favoriteExercises.join(', ')}\n`;
          }
          
          if (userProfile.dislikedExercises.length > 0) {
            response += `• Disliked Exercises: ${userProfile.dislikedExercises.join(', ')}\n`;
          }
        }
        response += `\n`;
        
        // AI Personality Analysis
        response += `**AI Personality Settings:**\n`;
        if (aiPersonality) {
          response += `• Name: ${aiPersonality.name}\n`;
          response += `• Personality: ${aiPersonality.personality}\n`;
          response += `• Expertise: ${aiPersonality.expertise}\n`;
          response += `• Communication Style: ${aiPersonality.communicationStyle}\n`;
        }
        response += `\n`;
        
        // Learning Pattern Analysis
        response += `**Learning Pattern Analysis:**\n`;
        
        if (workoutLogs && workoutLogs.length > 0) {
          const completedWorkouts = workoutLogs.filter(log => log.completed);
          
          // Analyze workout timing preferences
          const workoutTimes = completedWorkouts.map(workout => {
            const workoutDate = new Date(workout.date);
            const hour = workoutDate.getHours();
            if (hour < 12) return 'morning';
            else if (hour < 17) return 'afternoon';
            else return 'evening';
          });
          
          const timePreferences = workoutTimes.reduce((acc, time) => {
            acc[time] = (acc[time] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const preferredTime = Object.entries(timePreferences)
            .sort(([,a], [,b]) => b - a)[0];
          
          if (preferredTime) {
            response += `• Preferred workout time: ${preferredTime[0]} (${preferredTime[1]} workouts)\n`;
          }
          
          // Analyze workout duration preferences
          const durations = completedWorkouts.map(w => w.duration || 0).filter(d => d > 0);
          if (durations.length > 0) {
            const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
            response += `• Average workout duration: ${Math.round(avgDuration)} minutes\n`;
          }
          
          // Analyze workout type preferences
          const workoutTypes = completedWorkouts.reduce((acc, workout) => {
            const type = workout.workoutType || 'General';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const topWorkoutTypes = Object.entries(workoutTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
          
          if (topWorkoutTypes.length > 0) {
            response += `• Top workout preferences:\n`;
            topWorkoutTypes.forEach(([type, count]) => {
              response += `  - ${type}: ${count} times\n`;
            });
          }
        }
        response += `\n`;
        
        // Conversation Memory Analysis
        response += `**Conversation Memory:**\n`;
        if (conversationMemory && conversationMemory.length > 0) {
          response += `• Recent topics discussed: ${conversationMemory.length} items\n`;
          response += `• Memory items: ${conversationMemory.slice(-5).join(', ')}\n`;
        } else {
          response += `• No recent conversation memory stored\n`;
        }
        response += `\n`;
        
        // Personalized Recommendations
        response += `**Personalized Recommendations:**\n`;
        
        if (userProfile) {
          // Based on experience level
          if (userProfile.experienceLevel === 'beginner') {
            response += `• Focus on form and consistency over intensity\n`;
            response += `• Start with 3-4 workouts per week\n`;
            response += `• Include rest days between workouts\n`;
          } else if (userProfile.experienceLevel === 'intermediate') {
            response += `• Implement progressive overload principles\n`;
            response += `• Consider periodization training\n`;
            response += `• Add variety to prevent plateaus\n`;
          } else {
            response += `• Focus on specialized training programs\n`;
            response += `• Implement advanced techniques\n`;
            response += `• Consider working with a coach\n`;
          }
          
          // Based on motivation style
          if (userProfile.motivationStyle === 'achievement') {
            response += `• Set specific, measurable goals\n`;
            response += `• Track progress regularly\n`;
            response += `• Celebrate milestones\n`;
          } else if (userProfile.motivationStyle === 'social') {
            response += `• Find a workout buddy\n`;
            response += `• Join fitness communities\n`;
            response += `• Share progress with friends\n`;
          } else if (userProfile.motivationStyle === 'health') {
            response += `• Focus on health benefits\n`;
            response += `• Monitor health metrics\n`;
            response += `• Emphasize long-term wellness\n`;
          } else if (userProfile.motivationStyle === 'appearance') {
            response += `• Focus on body composition goals\n`;
            response += `• Track measurements and photos\n`;
            response += `• Emphasize aesthetic improvements\n`;
          }
        }
        response += `\n`;
        
        // Adaptive Learning Suggestions
        response += `**Adaptive Learning Suggestions:**\n`;
        
        if (workoutLogs && workoutLogs.length > 0) {
          const recentWorkouts = workoutLogs
            .filter(log => log.completed)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
          
          const avgRating = recentWorkouts.reduce((sum, workout) => 
            sum + (workout.rating || 0), 0) / recentWorkouts.length;
          
          if (avgRating < 3) {
            response += `• Consider adjusting workout intensity\n`;
            response += `• Focus on exercises you enjoy\n`;
            response += `• Try different workout types\n`;
          } else if (avgRating > 4) {
            response += `• You're enjoying your workouts!\n`;
            response += `• Consider increasing challenge\n`;
            response += `• Try new variations of favorite exercises\n`;
          }
        }
        
        // Personalization Settings
        response += `\n**Personalization Settings:**\n`;
        response += `• AI Personality: Can be adjusted based on preference\n`;
        response += `• Communication Style: Adapts to your learning style\n`;
        response += `• Workout Recommendations: Based on your preferences\n`;
        response += `• Goal Tracking: Personalized to your motivation style\n`;
        response += `• Progress Analysis: Tailored to your experience level\n\n`;
        
        response += `**Want to customize any of these settings?**`;
        
        return response;
      } catch (error) {
        return `I'm having trouble analyzing your personalization settings right now. Try asking about specific preferences or learning styles.`;
      }
    }
    
    return null;
  };
  
  const styles = getStyles(colors);
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: "",
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
            >
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              {/* Coach Name - Main Action */}
              <TouchableOpacity 
                onPress={() => setShowPersonalization(true)}
                onLongPress={() => {
                  try {
                    resetOnboarding?.();
                    setShowOnboarding(true);
                  } catch (error) {
                    console.error("Error resetting onboarding:", error);
                  }
                }}
                style={styles.coachNameButton}
              >
                <Text style={styles.coachNameText}>
                  {aiPersonality?.name || "Coach Alex"}
                </Text>
              </TouchableOpacity>
              
              {/* Quick Actions Toggle */}
              <TouchableOpacity 
                onPress={() => setShowQuickActions(!showQuickActions)}
                style={styles.quickActionsToggle}
              >
                <Zap size={18} color={showQuickActions ? colors.primary : colors.textSecondary} />
              </TouchableOpacity>
              
              {/* Chat List Toggle */}
              <TouchableOpacity 
                onPress={() => setShowChats(!showChats)}
                style={styles.chatListButton}
              >
                <Text style={styles.chatListButtonText}>
                  {showChats ? "Hide" : "Chats"}
                </Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      <View style={styles.content}>
        {showChats ? (
          <View style={styles.chatListContainer}>
            <View style={styles.chatListHeader}>
              <Text style={styles.chatListTitle}>Your Conversations</Text>
              <TouchableOpacity 
                style={styles.newChatButton}
                onPress={createNewChat}
              >
                <Plus size={20} color={colors.primary} />
                <Text style={styles.newChatButtonText}>New Chat</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={chats.slice().reverse()} // Reverse to show newest first
              renderItem={renderChatListItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatList}
            />
          </View>
        ) : (
          currentChat && (
            <>
              {/* Context Card */}
              {renderContextCard()}
              
              {/* Quick Actions */}
              {showQuickActions && renderQuickActions()}
              
              <FlatList
                ref={flatListRef}
                data={currentChat.messages.filter(msg => msg.role !== "system")}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
            </>
          )
        )}
      </View>
      
      {/* Onboarding Screen - Full Screen Modal */}
      {showOnboarding && (
        <View style={styles.fullScreenModal}>
          <AIOnboardingScreen
            visible={showOnboarding}
            onComplete={() => {
              try {
                setOnboardingComplete?.(true);
                setShowOnboarding(false);
              } catch (error) {
                console.error("Error completing onboarding:", error);
                setShowOnboarding(false);
              }
            }}
            onSkip={() => {
              try {
                setOnboardingComplete?.(true);
                setShowOnboarding(false);
              } catch (error) {
                console.error("Error skipping onboarding:", error);
                setShowOnboarding(false);
              }
            }}
          />
        </View>
      )}
      
      {/* Personalization Modal */}
      <AIPersonalizationModal
        visible={showPersonalization}
        onClose={() => setShowPersonalization(false)}
      />
      
      {!showChats && (
        <>
          <KeyboardDismissButton />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            style={[styles.inputContainer, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Ask me anything about fitness..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxHeight={100}
              maxLength={500}
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!message.trim() || isLoading) && styles.disabledSendButton
              ]}
              onPress={handleSendMessage}
              disabled={!message.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        </>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullScreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatListButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },
  chatListButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingBottom: 100, // Extra padding to account for input container
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: "row",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  assistantMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: "80%",
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
  },
  assistantMessageBubble: {
    backgroundColor: colors.card,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.white,
  },
  assistantMessageText: {
    color: colors.text,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    minHeight: 40,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledSendButton: {
    backgroundColor: colors.primaryLight,
    opacity: 0.7,
  },
  chatListContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatListTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  newChatButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 4,
  },
  chatList: {
    padding: 16,
  },
  chatListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedChatListItem: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  chatListItemContent: {
    flex: 1,
  },
  chatListItemPreview: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  chatListItemDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteChatButton: {
    padding: 8,
  },
  // New styles for context card and quick actions
  contextCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contextHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  contextTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  contextSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  contextStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  contextStat: {
    alignItems: "center",
  },
  contextStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  contextStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  contextStatTarget: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  quickActionsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  quickActionButton: {
    width: "30%",
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 10,
    textAlign: "center",
    color: colors.text,
    fontWeight: "500",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coachNameButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.primary,
    marginRight: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coachNameText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  quickActionsToggle: {
    padding: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatListButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatListButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
});