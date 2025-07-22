import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Platform,
  Image,
  Switch,
  Modal,
  Pressable,
  TextInput,
  Keyboard
} from "react-native";
import { useRouter } from "expo-router";
import { 
  Play, 
  Plus, 
  Clock, 
  Calendar, 
  Activity, 
  Camera, 
  MessageSquare, 
  Target, 
  Volume2, 
  VolumeX, 
  Zap, 
  X,
  Edit,
  Check,
  Heart,
  RefreshCw,
  Lightbulb,
  Award,
  Trophy,
  ArrowLeft,
  BarChart3
} from "lucide-react-native";
import * as Speech from 'expo-speech';
import { useTheme } from "@/context/ThemeContext";
import { useWorkoutStore } from "@/store/workoutStore";
import { useMacroStore } from "@/store/macroStore";
import { useHealthStore } from "@/store/healthStore";
import { useAiStore, Goal, UserMood } from "@/store/aiStore";
import { useGamificationStore } from "@/store/gamificationStore";
import WorkoutCard from "@/components/WorkoutCard";
import MacroProgress from "@/components/MacroProgress";
import StepCounter from "@/components/StepCounter";
import WeightTracker from "@/components/WeightTracker";
import CaloriesTracker from "@/components/CaloriesTracker";

import Button from "@/components/Button";
import GoalPrompt from "@/components/GoalPrompt";
import MoodSelector from "@/components/MoodSelector";
import StreakTracker from "@/components/StreakTracker";
import LevelProgress from "@/components/LevelProgress";
import DailyQuests from "@/components/DailyQuests";
import ChallengeCard from "@/components/ChallengeCard";
import AchievementModal from "@/components/AchievementModal";
import { APP_NAME } from "@/app/_layout";
import { calculateWeightProgress as calculateSmartWeightProgress } from "@/utils/dateUtils";

// Voice configuration for a more natural female voice
const voiceConfig = {
  language: 'en-US',
  pitch: 1.0,
  rate: 0.9,
};

// Helper function to speak with the default voice
const speakWithDefaultVoice = (text: string) => {
  if (Platform.OS === 'web') return;
  
  Speech.speak(text, voiceConfig);
};

// Daily fitness tips
const DAILY_FITNESS_TIPS = [
  "Consistency is key. Even a 10-minute workout is better than no workout.",
  "Stay hydrated! Drink water before, during, and after your workouts.",
  "Rest days are essential for muscle recovery and growth.",
  "Focus on proper form rather than lifting heavier weights.",
  "Progressive overload is crucial for continued strength gains.",
  "Mix cardio and strength training for optimal fitness results.",
  "Protein intake is important for muscle repair after workouts.",
  "Sleep 7-9 hours for optimal recovery and performance.",
  "Warm up properly to prevent injuries and improve performance.",
  "Track your progress to stay motivated and see how far you've come.",
  "Compound exercises give you more bang for your buck.",
  "Don't forget to stretch after your workouts to improve flexibility.",
  "Your mental attitude affects your physical performance.",
  "Nutrition is just as important as exercise for reaching your fitness goals.",
  "Listen to your body. Push yourself, but know when to back off.",
  "Vary your workouts to prevent plateaus and keep things interesting.",
  "Set specific, measurable, achievable, relevant, and time-bound (SMART) goals.",
  "Focus on the mind-muscle connection during exercises.",
  "Breathing properly can improve your performance and reduce fatigue.",
  "Recovery nutrition within 30 minutes post-workout can enhance results.",
  "Stay consistent with your workout schedule for best results.",
  "Quality over quantity - focus on effective exercises rather than long workouts.",
  "Include mobility work in your routine to improve range of motion.",
  "Proper posture during exercises prevents injuries and maximizes results.",
  "Challenge yourself with new exercises or increased intensity regularly.",
  "Balance is key - work all muscle groups for overall strength and aesthetics.",
  "Visualization can improve performance - imagine successful reps before lifting.",
  "Tracking macros can help optimize your nutrition for your specific goals.",
  "Don't compare your journey to others - focus on your own progress.",
  "Celebrate small victories along the way to stay motivated."
];

// Comprehensive goal examples
const GOAL_EXAMPLES = [
  "Drink 2L of water daily",
  "Walk 10,000 steps every day this week",
  "Complete 50 pushups by the end of the week",
  "Lose 0.5kg this week",
  "Go to the gym 3 times this week",
  "Meditate for 10 minutes daily",
  "Run 5km three times this week",
  "Do yoga for 20 minutes every morning",
  "Stretch for 15 minutes after each workout",
  "Eat 5 servings of vegetables daily",
  "Track all meals in the app every day",
  "Get 8 hours of sleep each night",
  "Take 10,000 steps daily for a month",
  "Complete 100 squats by end of week",
  "Reduce sugar intake to under 25g daily",
  "Increase protein intake to 120g daily",
  "Drink green tea instead of coffee",
  "Try a new workout class weekly",
  "Meal prep lunches for the entire week",
  "Do 3 HIIT workouts this week",
  "Increase deadlift weight by 5kg",
  "Practice mindful eating at every meal",
  "Take progress photos weekly",
  "Cycle to work 3 days this week",
  "Climb stairs instead of using elevator",
  "Drink 3L of water daily for hydration",
  "Complete 200 crunches by weekend",
  "Walk at least 8,000 steps every day",
  "Stretch for 10 minutes before bed",
  "Limit screen time to 1 hour before sleep",
  "Add a vegetable to every meal",
  "Do 20 minutes of cardio 4 times this week",
  "Practice deep breathing for 5 minutes daily",
  "Increase water intake by 500ml daily",
  "Try one new healthy recipe each week",
  "Do 15 minutes of mobility work daily",
  "Reach 12,000 steps three times this week",
  "Cut out added sugars for the week",
  "Drink a glass of water before each meal",
  "Complete 3 strength training sessions",
  "Increase daily fiber intake to 30g",
  "Take the stairs instead of elevator daily",
  "Meditate for 5 minutes every morning",
  "Stretch for 10 minutes before bedtime",
  "Track macros for all meals this week",
  "Try intermittent fasting for 5 days",
  "Do 100 kettlebell swings daily",
  "Complete 20 pull-ups by end of week",
  "Increase bench press by 2.5kg",
  "Walk or bike for all trips under 2km",
  "Reduce sodium intake to under 2000mg daily",
  "Practice proper posture throughout day",
  "Increase daily step count by 1000 steps",
  "Do 50 bodyweight squats every morning",
  "Try a new vegetable or fruit each day",
  "Complete 30-day plank challenge",
  "Drink herbal tea instead of coffee",
  "Reduce processed food consumption by 50%",
  "Increase daily protein to 1.5g per kg bodyweight",
  "Practice yoga for 15 minutes daily",
  "Maintain calorie deficit of 300 kcal daily",
  "Complete 10,000 steps before noon",
  "Drink 500ml water immediately after waking"
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    workouts, 
    workoutLogs, 
    activeWorkout, 
    startWorkout,
    getRecommendedWorkouts,
    workoutRecommendationsEnabled,
    aiRecommendationsExplained,
    toggleWorkoutRecommendations,
    getMoodBasedWorkouts,
    getRestDayActivities,
    scheduledWorkouts
  } = useWorkoutStore();
  const { macroGoals, calculateDailyMacros, userProfile } = useMacroStore();
  const { weightLogs } = useHealthStore();
  const { 
    goals, 
    addGoal,
    updateGoal,
    weeklyPrompt, 
    monthlyPrompt,
    lastPromptDate, 
    updateLastPromptDate,
    shouldShowGoalPrompt,
    shouldShowMoodPrompt,
    updateLastMoodPromptDate,
    setUserMood,
    userMood,
    userName,
    getLatestWorkoutAnalysis,
    analyzeWorkoutDurations,
    getPromptForTimeframe,
    getMoodBasedWorkoutAdvice,
    scheduleGoalReminder,
    cancelGoalReminder
  } = useAiStore();
  
  const {
    gamificationEnabled,
    initializeAchievements,
    checkAchievements,
    updateStreak,
    showCelebration,
    celebrationAchievement,
    clearCelebration,
    getActiveDailyQuests,
    challenges,
    streak,
    getStreakInfo,
    checkAndAutoCompleteQuests
  } = useGamificationStore();
  
  const [showGoalPrompt, setShowGoalPrompt] = useState(false);
  const [isSettingGoal, setIsSettingGoal] = useState(false);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [showWorkoutAnalysis, setShowWorkoutAnalysis] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editedGoalText, setEditedGoalText] = useState("");
  const [showRestDayActivities, setShowRestDayActivities] = useState(false);
  const [dailyTip, setDailyTip] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"weekly" | "monthly">("weekly");
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [moodSelectorDelayed, setMoodSelectorDelayed] = useState(false);
  
  // Get recommended workouts based on mood if available
  const recommendedWorkouts = userMood?.preference 
    ? getMoodBasedWorkouts(userMood.mood, userMood.preference, 4) // Increased from 2 to 4
    : getRecommendedWorkouts(4); // Increased from 2 to 4
  
  // Get mood-based workout advice
  const moodBasedAdvice = getMoodBasedWorkoutAdvice();
  
  // Get active daily quests - only if gamification is enabled
  const activeQuests = gamificationEnabled ? getActiveDailyQuests() : [];
  
  // Get active challenges - only if gamification is enabled
  const activeChallenge = gamificationEnabled 
    ? challenges.find(c => !c.completed && new Date(c.endDate) > new Date())
    : null;
  
  // Get streak info - only if gamification is enabled
  const streakInfo = gamificationEnabled ? getStreakInfo() : { currentStreak: 0, nextMilestone: 0, daysToNextReward: 0 };
  
  // Initialize daily tip
  useEffect(() => {
    // Get a tip based on the day of the year to ensure it changes daily
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const tipIndex = dayOfYear % DAILY_FITNESS_TIPS.length;
    setDailyTip(DAILY_FITNESS_TIPS[tipIndex]);
  }, []);
  
  // Initialize gamification if enabled
  useEffect(() => {
    if (gamificationEnabled) {
      initializeAchievements();
      // Check for automatic quest completion when app loads
      checkAndAutoCompleteQuests();
    }
  }, [gamificationEnabled]);
  
  // Update achievements when workout logs change (only if gamification is enabled)
  useEffect(() => {
    if (gamificationEnabled && workoutLogs.length > 0) {
      updateStreak();
      checkAchievements();
    }
  }, [workoutLogs, gamificationEnabled]);
  
  // Periodically check for automatic quest completion
  useEffect(() => {
    if (gamificationEnabled) {
      // Check every 5 minutes for automatic quest completion
      const interval = setInterval(() => {
        checkAndAutoCompleteQuests();
      }, 5 * 60 * 1000); // 5 minutes
      
      return () => clearInterval(interval);
    }
  }, [gamificationEnabled, checkAndAutoCompleteQuests]);
  
  // Get a new random tip
  const getNewTip = () => {
    const currentTip = dailyTip;
    let newTip = currentTip;
    
    // Make sure we don't get the same tip twice
    while (newTip === currentTip) {
      const randomIndex = Math.floor(Math.random() * DAILY_FITNESS_TIPS.length);
      newTip = DAILY_FITNESS_TIPS[randomIndex];
    }
    
    setDailyTip(newTip);
    
    // Speak the tip if voice is enabled
    if (voiceEnabled && Platform.OS !== 'web') {
      speakWithDefaultVoice(`Fitness tip: ${newTip}`);
    }
  };
  
  // Check if we should show the weekly goal prompt
  useEffect(() => {
    if (!initialCheckDone) {
      setInitialCheckDone(true);
      
      // Check if we should show the goal prompt
      if (shouldShowGoalPrompt()) {
        setShowGoalPrompt(true);
      } else {
        // If no goal prompt, check if we should show the mood selector
        // But delay it to avoid immediate popup
        setTimeout(() => {
          setMoodSelectorDelayed(true);
        }, 30000); // Increased delay to 30 seconds
      }
    }
  }, [initialCheckDone]);
  
  // Check if we should show the mood selector after delay
  useEffect(() => {
    if (moodSelectorDelayed) {
      checkMoodSelector();
    }
  }, [moodSelectorDelayed]);
  
  // Function to check if we should show the mood selector
  const checkMoodSelector = () => {
    if (shouldShowMoodPrompt()) {
      // Update the last mood prompt date
      updateLastMoodPromptDate(new Date().toISOString());
      
      // Show the mood selector
      setShowMoodSelector(true);
    }
  };
  
  // When goal prompt is closed, check if we should show the mood selector
  useEffect(() => {
    if (!showGoalPrompt && initialCheckDone) {
      // Delay showing the mood selector to avoid immediate transition
      setTimeout(() => {
        setMoodSelectorDelayed(true);
      }, 30000); // Increased delay to 30 seconds
    }
  }, [showGoalPrompt]);
  
  // Welcome message with voice
  useEffect(() => {
    if (!welcomeShown && userName) {
      setWelcomeShown(true);
      
      const welcomeMessage = userName 
        ? `Welcome back, ${userName}! Ready for a great workout today?` 
        : "Welcome! Ready for a great workout today?";
      
      if (voiceEnabled && Platform.OS !== 'web') {
        speakWithDefaultVoice(welcomeMessage);
      }
    }
  }, [userName, voiceEnabled, welcomeShown]);
  
  // Get today's date in ISO format
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate today's macros
  const todayMacros = calculateDailyMacros(today);
  
  // Get recent workouts (last 3)
  const recentWorkouts = workoutLogs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
  
  // Get active goals
  const activeGoals = goals ? goals.filter(goal => !goal.completed).slice(0, 3) : [];
  
  // Get latest workout analysis
  const latestAnalysis = getLatestWorkoutAnalysis();
  
  // Get rest day activities
  const restDayActivities = getRestDayActivities();
  
  const handleStartWorkout = (workoutId: string) => {
    startWorkout(workoutId);
    router.push("/active-workout");
  };
  
  const handleSubmitGoal = async (goalText: string, timeframe: "weekly" | "monthly", targetDate?: string) => {
    setIsSettingGoal(true);
    
    try {
      // Determine goal category based on text
      const category = detectGoalCategory(goalText);
      
      // Extract target value if present
      const targetValue = extractTargetValue(goalText);
      
      // Extract time period if present
      const timePeriod = extractTimePeriod(goalText);
      
      // Create a new goal
      const newGoal: Goal = {
        id: Date.now().toString(),
        text: goalText,
        date: new Date().toISOString(),
        completed: false,
        category,
        timeframe,
        targetDate,
        progress: 0,
        milestones: [],
        lastChecked: new Date().toISOString(),
        targetValue,
        timePeriod: timePeriod || (timeframe === 'weekly' ? 'weekly' : 'monthly'),
        reminderSchedule: category === 'water' ? 'hourly' : 'daily',
        currentValue: 0
      };
      
      // Add the goal
      addGoal(newGoal);
      
      // Update the last prompt date
      updateLastPromptDate(new Date().toISOString());
      
      // Close the prompt
      setShowGoalPrompt(false);
      
      // Speak confirmation if voice is enabled
      if (voiceEnabled && Platform.OS !== 'web') {
        speakWithDefaultVoice(`${timeframe === "weekly" ? "Weekly" : "Monthly"} goal set successfully! I'll help you achieve it.`);
      }
      
      // Schedule default reminders based on goal category
      if (category === 'water') {
        // For water goals, schedule hourly reminders by default
        try {
          if (typeof scheduleGoalReminder === 'function') {
            scheduleGoalReminder(newGoal.id, 'hourly');
          }
        } catch (error) {
          console.error("Error scheduling water goal reminder:", error);
        }
      } else {
        // For other goals, schedule daily reminders
        try {
          if (typeof scheduleGoalReminder === 'function') {
            scheduleGoalReminder(newGoal.id, 'daily');
          }
        } catch (error) {
          console.error("Error scheduling daily goal reminder:", error);
        }
      }
      
      // Show confirmation
      Alert.alert(
        `${timeframe === "weekly" ? "Weekly" : "Monthly"} Goal Set`,
        "Your goal has been set. Would you like me to analyze it and provide recommendations?",
        [
          {
            text: "Not Now",
            style: "cancel"
          },
          {
            text: "Yes, Please",
            onPress: () => router.push("/goals")
          }
        ]
      );
      
    } catch (error) {
      console.error("Error setting goal:", error);
      Alert.alert("Error", "Failed to set goal. Please try again.");
    } finally {
      setIsSettingGoal(false);
    }
  };
  
  // Detect goal category based on text
  const detectGoalCategory = (goalText: string): string => {
    const text = goalText.toLowerCase();
    
    if (text.includes('water') || text.includes('hydrate') || text.includes('drink') || text.includes('liter') || text.includes('l of water')) {
      return 'water';
    } else if (text.includes('step') || text.includes('walk') || text.includes('walking') || text.includes('run') || text.includes('running')) {
      return 'steps';
    } else if (text.includes('workout') || text.includes('exercise') || text.includes('train') || text.includes('pushup') || text.includes('push-up') || text.includes('pull-up') || text.includes('pullup') || text.includes('squat') || text.includes('gym')) {
      return 'workout';
    } else if (text.includes('weight') || text.includes('kg') || text.includes('pound') || text.includes('lb') || text.includes('lose') || text.includes('gain')) {
      return 'weight';
    } else if (text.includes('eat') || text.includes('food') || text.includes('meal') || text.includes('diet') || text.includes('nutrition') || text.includes('calorie') || text.includes('protein') || text.includes('carb') || text.includes('fat')) {
      return 'nutrition';
    } else if (text.includes('sleep') || text.includes('rest') || text.includes('recovery') || text.includes('stress') || text.includes('meditate') || text.includes('meditation')) {
      return 'health';
    }
    
    return 'other';
  };
  
  // Extract numeric target from goal text
  const extractTargetValue = (goalText: string): number | null => {
    // Look for patterns like "X kg", "X pounds", "X steps", "X liters", etc.
    const matches = goalText.match(/(\d+(\.\d+)?)\s*(kg|pounds|lbs|steps|liters|l|minutes|min|reps|times)/i);
    
    if (matches && matches[1]) {
      return parseFloat(matches[1]);
    }
    
    // Look for just numbers
    const numericMatches = goalText.match(/(\d+(\.\d+)?)/);
    if (numericMatches && numericMatches[1]) {
      return parseFloat(numericMatches[1]);
    }
    
    return null;
  };
  
  // Extract time period from goal text (daily, weekly, etc.)
  const extractTimePeriod = (goalText: string): string => {
    const text = goalText.toLowerCase();
    
    if (text.includes('daily') || text.includes('day') || text.includes('every day')) {
      return 'daily';
    } else if (text.includes('weekly') || text.includes('week') || text.includes('every week')) {
      return 'weekly';
    } else if (text.includes('monthly') || text.includes('month') || text.includes('every month')) {
      return 'monthly';
    }
    
    // Default to the goal's timeframe
    return '';
  };
  
  const handleEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditedGoalText(goal.text);
  };
  
  const handleSaveGoalEdit = () => {
    if (!editingGoalId) return;
    
    if (!editedGoalText.trim()) {
      Alert.alert("Error", "Goal text cannot be empty");
      return;
    }
    
    updateGoal(editingGoalId, { text: editedGoalText });
    setEditingGoalId(null);
    setEditedGoalText("");
  };
  
  const handleCancelGoalEdit = () => {
    setEditingGoalId(null);
    setEditedGoalText("");
  };
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  
  // Get personalized greeting
  const greeting = userName ? `${getGreeting()}, ${userName}!` : getGreeting() + "!";
  
  // Get motivation message based on mood
  const getMotivationMessage = () => {
    if (!userMood) return `Ready for your ${APP_NAME} workout?`;
    
    const today = new Date().toDateString();
    const moodDate = new Date(userMood.date).toDateString();
    
    // If mood is not from today, return default message
    if (today !== moodDate) return `Ready for your ${APP_NAME} workout?`;
    
    // If user selected rest preference, return rest message
    if (userMood.preference === "rest") {
      return "Taking a rest day is a smart choice. Recovery is essential for progress.";
    }
    
    switch (userMood.mood) {
      case "great":
        return userMood.preference === "challenging" 
          ? "Let's challenge yourself with an intense workout today!" 
          : "Let's make the most of that energy!";
      case "good":
        return userMood.preference === "challenging"
          ? "Ready to push your limits today?"
          : "Let's make today even better with a workout!";
      case "okay":
        return userMood.preference === "energizing"
          ? "An energizing workout might boost your mood!"
          : "A workout might be just what you need today!";
      case "tired":
        return userMood.preference === "shorter"
          ? "A short, effective workout is on the menu today."
          : "Even a short workout can boost your energy!";
      case "bad":
        return userMood.preference === "light"
          ? "A light workout can help improve your mood today."
          : "Exercise can help improve your mood. Start small today!";
      default:
        return `Ready for your ${APP_NAME} workout?`;
    }
  };
  
  // Check if user has a scheduled workout today
  const hasWorkoutToday = scheduledWorkouts.some(workout => {
    const workoutDate = new Date(workout.date);
    const today = new Date();
    return workoutDate.toDateString() === today.toDateString();
  });

  // Navigate to daily quests screen
  const navigateToDailyQuests = () => {
    router.push("/daily-quests");
  };
  
  const handleMoodSelected = (mood: string, emoji: string, preference?: string) => {
    const moodData: UserMood = {
      mood,
      emoji,
      date: new Date().toISOString(),
      preference
    };
    
    setUserMood(moodData);
    setShowMoodSelector(false);
    
    // If user selected "rest" preference, show rest day activities
    if (preference === "rest") {
      setShowRestDayActivities(true);
    }
    
    // Speak response if voice is enabled
    if (voiceEnabled && Platform.OS !== 'web') {
      let response = "";
      
      if (preference === "rest") {
        response = "Rest days are important for recovery. I'll suggest some light activities you can do instead.";
      } else if (preference === "shorter" && mood === "tired") {
        response = "I understand you're tired. I'll recommend shorter, effective workouts to match your energy level today.";
      } else if (preference === "light" && mood === "bad") {
        response = "I'm sorry you're not feeling great. Light exercise can help improve your mood. I'll suggest some gentle options.";
      } else if (preference === "challenging" && (mood === "great" || mood === "good")) {
        response = "You're feeling great! I'll suggest some challenging workouts to match your energy today.";
      } else {
        switch (mood) {
          case "great":
            response = "That's awesome! Let's keep that energy going with a great workout!";
            break;
          case "good":
            response = "Good to hear! A workout will make your day even better.";
            break;
          case "okay":
            response = "A workout might be just what you need to turn your day around!";
            break;
          case "tired":
            response = "I understand. Maybe a lighter workout today would be good for you.";
            break;
          case "bad":
            response = "I'm sorry to hear that. Exercise can help boost your mood. Let's start with something gentle.";
            break;
          default:
            response = "Thanks for sharing how you're feeling. Let's find a workout that matches your energy today.";
        }
      }
      
      speakWithDefaultVoice(response);
    }
  };
  
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    
    if (!voiceEnabled && Platform.OS !== 'web') {
      speakWithDefaultVoice("Voice assistant enabled. I'm here to help with your fitness journey.");
    }
  };
  
  const handleAnalyzeWorkouts = () => {
    // Analyze workout durations
    const analysis = analyzeWorkoutDurations(workoutLogs);
    
    // Show analysis modal
    setShowWorkoutAnalysis(true);
    
    // Speak analysis if voice is enabled
    if (voiceEnabled && Platform.OS !== 'web' && analysis.recommendations.timeOptimization.length > 0) {
      speakWithDefaultVoice(`Based on your workout history, here's a tip: ${analysis.recommendations.timeOptimization[0]}`);
    }
  };
  
  // Get smart progress tracking based on onboarding data
  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 0;
  const startWeight = userProfile?.weight || 0; // Use onboarding weight as baseline
  
  const smartProgress = calculateSmartWeightProgress({
    startWeight: startWeight || 0,
    currentWeight: currentWeight || 0,
    goal: userProfile?.fitnessGoal || 'maintain',
    targetWeight: 0, // Will be calculated if needed
  });
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.greetingContainer}>
            <Text style={[styles.greeting, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
              {greeting}
            </Text>
            <Text style={[styles.subGreeting, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
              {getMotivationMessage()}
            </Text>
          </View>
          
          {userMood && new Date(userMood.date).toDateString() === new Date().toDateString() && (
            <TouchableOpacity 
              style={[styles.moodBadge, { backgroundColor: colors.card }]}
              onPress={() => setShowMoodSelector(true)}
            >
              <Text style={styles.moodEmoji}>{userMood.emoji}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.voiceButton, { backgroundColor: colors.card }]}
            onPress={toggleVoice}
          >
            {voiceEnabled ? (
              <Volume2 size={20} color={colors.primary} />
            ) : (
              <VolumeX size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
        
        {!userMood || new Date(userMood.date).toDateString() !== new Date().toDateString() ? (
          <TouchableOpacity 
            style={[styles.moodPrompt, { backgroundColor: colors.card }]}
            onPress={() => setShowMoodSelector(true)}
          >
            <Text style={[styles.moodPromptText, { color: colors.text }]}>How are you feeling today?</Text>
            <Text style={styles.moodPromptEmoji}>😊 😴 💪</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      
      {activeWorkout ? (
        <TouchableOpacity 
          style={[styles.activeWorkoutCard, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/active-workout")}
          activeOpacity={0.7}
        >
          <View style={styles.activeWorkoutContent}>
            <Text style={styles.activeWorkoutLabel}>WORKOUT IN PROGRESS</Text>
            <Text style={styles.activeWorkoutTitle} numberOfLines={1} ellipsizeMode="tail">
              {workouts.find(w => w.id === activeWorkout.workoutId)?.name || "Current Workout"}
            </Text>
            <View style={styles.activeWorkoutStats}>
              <View style={styles.activeWorkoutStat}>
                <Clock size={16} color="#FFFFFF" />
                <Text style={styles.activeWorkoutStatText}>Continue</Text>
              </View>
            </View>
          </View>
          <View style={styles.activeWorkoutAction}>
            <Play size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={[styles.emptyStateCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            No active workout
          </Text>
        </View>
      )}
      
      {/* Gamification Section - Only show if enabled */}
      {gamificationEnabled && (
        <View style={styles.gamificationContainer}>
          <View style={styles.gamificationRow}>
            <View style={styles.gamificationItem}>
              <StreakTracker compact />
            </View>
            <View style={styles.gamificationItem}>
              <LevelProgress compact />
            </View>
          </View>
          
          {activeQuests.length > 0 && (
            <DailyQuests 
              compact 
              limit={2} 
              onPress={navigateToDailyQuests}
            />
          )}
          
          {activeChallenge && (
            <TouchableOpacity onPress={() => router.push("/challenges")}>
              <ChallengeCard challenge={activeChallenge} compact />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.achievementsButton, { backgroundColor: colors.card }]}
            onPress={() => router.push("/achievements")}
          >
            <Trophy size={20} color={colors.primary} />
            <Text style={[styles.achievementsButtonText, { color: colors.text }]}>
              View All Achievements
            </Text>
            <View style={[styles.achievementsBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.achievementsBadgeText}>New</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.quickAccessContainer}>
        <View style={styles.stepsWeightContainer}>
          <StepCounter compact />
          <WeightTracker 
            compact 
            onAddWeight={() => router.push("/weight-log")}
          />
        </View>
        <CaloriesTracker compact />
        
        {/* Health Data Viewer Button */}
        <TouchableOpacity 
          style={[styles.dataViewerButton, { backgroundColor: colors.card }]}
          onPress={() => router.push("/health-data-viewer")}
        >
          <View style={styles.dataViewerContent}>
            <BarChart3 size={20} color={colors.primary} />
            <Text style={[styles.dataViewerText, { color: colors.text }]}>
              View Health Data
            </Text>
          </View>
          <Text style={[styles.dataViewerSubtext, { color: colors.textSecondary }]}>
            Steps, Calories, History
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Mood-based Advice Banner */}
      {moodBasedAdvice && (
        <View style={[styles.moodAdviceBanner, { backgroundColor: colors.card }]}>
          <View style={[styles.moodAdviceIcon, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
            <Heart size={20} color={colors.primary} />
          </View>
          <Text style={[styles.moodAdviceText, { color: colors.text }]} numberOfLines={3} ellipsizeMode="tail">
            {moodBasedAdvice}
          </Text>
        </View>
      )}
      
      {/* Rest Day Activities (shown only when user selects rest preference) */}
      {userMood?.preference === "rest" && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Rest Day Activities</Text>
          </View>
          
          <View style={[styles.restDayCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.restDayTitle, { color: colors.text }]}>
              Recovery is an essential part of fitness progress
            </Text>
            <Text style={[styles.restDaySubtitle, { color: colors.textSecondary }]}>
              Here are some light activities you can do on your rest day:
            </Text>
            
            <View style={styles.restActivitiesList}>
              {restDayActivities.slice(0, 4).map((activity, index) => (
                <View key={index} style={styles.restActivity}>
                  <View style={[styles.restActivityBullet, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
                    <Text style={[styles.restActivityBulletText, { color: colors.primary }]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.restActivityText, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
                    {activity}
                  </Text>
                </View>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.seeMoreButton}
              onPress={() => setShowRestDayActivities(true)}
            >
              <Text style={[styles.seeMoreText, { color: colors.primary }]}>See More Activities</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Workout Recommendations Section - Only show if not on rest day */}
      {userMood?.preference !== "rest" && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended For You</Text>
            <View style={styles.recommendationToggle}>
              <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>AI Recommendations</Text>
              <Switch
                value={workoutRecommendationsEnabled}
                onValueChange={(value) => toggleWorkoutRecommendations(value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
          
          {workoutRecommendationsEnabled ? (
            <>
              {/* Show personalized recommendation info */}
              <View style={[styles.personalizationCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.personalizationTitle, { color: colors.text }]}>
                  Personalized for {userProfile.name || 'you'}
                </Text>
                <Text style={[styles.personalizationText, { color: colors.textSecondary }]}>
                  {userProfile.fitnessGoal === 'lose' 
                    ? "Weight loss focused workouts with cardio emphasis"
                    : userProfile.fitnessGoal === 'gain'
                    ? "Strength training workouts for muscle building"
                    : "Balanced workouts for weight maintenance"
                  }
                </Text>
                <Text style={[styles.personalizationText, { color: colors.textSecondary }]}>
                  {userProfile.fitnessLevel === 'beginner'
                    ? "Beginner-friendly exercises for safe progression"
                    : userProfile.fitnessLevel === 'intermediate'
                    ? "Progressive challenges to build strength"
                    : "Advanced techniques to maximize results"
                  }
                </Text>
              </View>
              
              {recommendedWorkouts.map((workout, index) => (
                <WorkoutCard 
                  key={`${workout.id}-${index}`} 
                  workout={{...workout, isRecommended: true}}
                  onPress={() => handleStartWorkout(workout.id)}
                />
              ))}
              
              {latestAnalysis && latestAnalysis.recommendations.exerciseRecommendations.length > 0 && (
                <View style={[styles.analysisCard, { backgroundColor: colors.card }]}>
                  <View style={styles.analysisHeader}>
                    <Zap size={20} color={colors.primary} />
                    <Text style={[styles.analysisTitle, { color: colors.text }]}>AI Insights</Text>
                  </View>
                  
                  <Text style={[styles.analysisText, { color: colors.textSecondary }]}>
                    {latestAnalysis.recommendations.exerciseRecommendations[0]}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={[styles.disabledCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.disabledText, { color: colors.textSecondary }]}>
                Enable AI recommendations to see personalized workout suggestions based on your fitness level and goals.
              </Text>
              <TouchableOpacity 
                style={[styles.enableButton, { backgroundColor: colors.primary }]}
                onPress={() => toggleWorkoutRecommendations(true)}
              >
                <Text style={[styles.enableButtonText, { color: colors.white }]}>Enable Recommendations</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      
      {/* Daily Fitness Tip */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Fitness Tip</Text>
          <TouchableOpacity onPress={getNewTip}>
            <RefreshCw size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.tipCard, { backgroundColor: colors.card }]}>
          <View style={[styles.tipIconContainer, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
            <Lightbulb size={24} color={colors.primary} />
          </View>
          <Text style={[styles.tipText, { color: colors.text }]} numberOfLines={4} ellipsizeMode="tail">
            {dailyTip}
          </Text>
        </View>
      </View>
      
      {/* Goals Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Goals</Text>
          <TouchableOpacity onPress={() => router.push("/goals")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {activeGoals.length > 0 ? (
          activeGoals.map((goal) => (
            <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.card }]}>
              {editingGoalId === goal.id ? (
                // Editing mode
                <View style={styles.goalEditContainer}>
                  <TextInput
                    style={[styles.goalEditInput, { backgroundColor: colors.background, color: colors.text }]}
                    value={editedGoalText}
                    onChangeText={setEditedGoalText}
                    multiline
                    autoFocus
                  />
                  <View style={styles.goalEditActions}>
                    <TouchableOpacity 
                      style={[styles.goalEditCancel, { backgroundColor: "rgba(255, 59, 48, 0.1)" }]}
                      onPress={handleCancelGoalEdit}
                    >
                      <X size={20} color={colors.error} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.goalEditSave, { backgroundColor: "rgba(80, 200, 120, 0.1)" }]}
                      onPress={handleSaveGoalEdit}
                    >
                      <Check size={20} color={colors.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Display mode
                <>
                  <View style={[styles.goalIcon, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
                    {goal.timeframe === "monthly" ? (
                      <Calendar size={20} color={colors.primary} />
                    ) : (
                      <Target size={20} color={colors.primary} />
                    )}
                  </View>
                  <View style={styles.goalContent}>
                    <View style={styles.goalHeader}>
                      <Text style={[styles.goalText, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
                        {goal.text}
                      </Text>
                      {goal.timeframe && (
                        <View style={[styles.goalTimeframeBadge, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
                          <Text style={[styles.goalTimeframeText, { color: colors.primary }]}>
                            {goal.timeframe === "weekly" ? "Weekly" : "Monthly"}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.goalDate, { color: colors.textSecondary }]}>
                      Set on {new Date(goal.date).toLocaleDateString()}
                    </Text>
                    
                    {goal.targetDate && (
                      <Text style={[styles.goalTargetDate, { color: colors.primary }]}>
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </Text>
                    )}
                    
                    {/* Progress bar for goal */}
                    {goal.progress !== undefined && goal.progress > 0 && (
                      <View style={styles.goalProgressContainer}>
                        <View 
                          style={[
                            styles.goalProgressBar, 
                            { backgroundColor: colors.border }
                          ]}
                        >
                          <View 
                            style={[
                              styles.goalProgressFill, 
                              { 
                                backgroundColor: colors.primary,
                                width: `${goal.progress}%` 
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.goalProgressText, { color: colors.textSecondary }]}>
                          {goal.progress}% complete
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={[styles.goalEditButton, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}
                    onPress={() => handleEditGoal(goal)}
                  >
                    <Edit size={18} color={colors.primary} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))
        ) : (
          <TouchableOpacity 
            style={[styles.addGoalCard, { backgroundColor: colors.card }]}
            onPress={() => setShowGoalPrompt(true)}
          >
            <Plus size={24} color={colors.primary} />
            <Text style={[styles.addGoalText, { color: colors.primary }]}>Set a fitness goal</Text>
          </TouchableOpacity>
        )}
        
        <Button
          title="View All Goals"
          onPress={() => router.push("/goals")}
          variant="outline"
          style={styles.viewAllGoalsButton}
        />
      </View>
      
      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => router.push("/capture-food")}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
            <Camera size={24} color={colors.primary} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.text }]}>Analyze Food</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => router.push("/progress-photos")}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: "rgba(80, 200, 120, 0.1)" }]}>
            <Camera size={24} color={colors.secondary} />
          </View>
          <Text style={[styles.quickActionText, { color: colors.text }]}>Progress Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => router.push("/ai-chat")}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: "rgba(255, 149, 0, 0.1)" }]}>
            <MessageSquare size={24} color="#FF9500" />
          </View>
          <Text style={[styles.quickActionText, { color: colors.text }]}>Ask AI</Text>
        </TouchableOpacity>
      </View>
      
      {recentWorkouts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Workouts</Text>
            <TouchableOpacity onPress={() => router.push("/history")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>History</Text>
            </TouchableOpacity>
          </View>
          
          {recentWorkouts.map((log) => {
            const workout = workouts.find(w => w.id === log.workoutId);
            if (!workout) return null;
            
            return (
              <View key={log.id} style={[styles.recentWorkout, { backgroundColor: colors.card }]}>
                <View style={styles.recentWorkoutInfo}>
                  <Text style={[styles.recentWorkoutName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {workout.name}
                  </Text>
                  <Text style={[styles.recentWorkoutDate, { color: colors.textSecondary }]}>
                    {new Date(log.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.recentWorkoutStats}>
                  <View style={styles.recentWorkoutStat}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={[styles.recentWorkoutStatText, { color: colors.textSecondary }]}>{log.duration} min</Text>
                  </View>
                  <View style={styles.recentWorkoutStat}>
                    <Calendar size={14} color={colors.textSecondary} />
                    <Text style={[styles.recentWorkoutStatText, { color: colors.textSecondary }]}>
                      {log.exercises.length} exercises
                    </Text>
                  </View>
                  
                  {log.rating && (
                    <View style={styles.recentWorkoutStat}>
                      <Text style={styles.ratingText}>
                        {Array(log.rating.rating).fill('★').join('')}
                        {Array(5 - log.rating.rating).fill('☆').join('')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
          
          {recentWorkouts.length >= 3 && (
            <Button
              title="Analyze My Workouts"
              onPress={handleAnalyzeWorkouts}
              variant="outline"
              icon={<Zap size={18} color={colors.primary} />}
              style={styles.analyzeButton}
            />
          )}
        </View>
      )}
      
      {/* Goal Setting Modal */}
      <GoalPrompt
        visible={showGoalPrompt}
        prompt={getPromptForTimeframe(selectedTimeframe)}
        onClose={() => {
          setShowGoalPrompt(false);
          // Update the last prompt date even if the user cancels
          // to prevent showing the prompt again immediately
          updateLastPromptDate(new Date().toISOString());
        }}
        onSubmit={handleSubmitGoal}
        isLoading={isSettingGoal}
        examples={GOAL_EXAMPLES}
        timeframe={selectedTimeframe}
        onTimeframeChange={setSelectedTimeframe}
      />
      
      {/* Mood Selector Modal */}
      <MoodSelector
        visible={showMoodSelector}
        onClose={() => setShowMoodSelector(false)}
        onSelectMood={handleMoodSelected}
      />
      
      {/* Workout Analysis Modal */}
      <Modal
        visible={showWorkoutAnalysis}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => {
            setShowWorkoutAnalysis(false);
            Keyboard.dismiss();
          }}
        >
          <Pressable 
            style={[styles.analysisModal, { backgroundColor: colors.card }]} 
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.analysisModalHeader}>
              <Text style={[styles.analysisModalTitle, { color: colors.text }]}>Workout Analysis</Text>
              <TouchableOpacity 
                onPress={() => setShowWorkoutAnalysis(false)}
                style={[styles.closeButton, { backgroundColor: colors.background }]}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {latestAnalysis ? (
              <ScrollView style={styles.analysisModalContent}>
                <View style={styles.analysisStats}>
                  <View style={styles.analysisStat}>
                    <Text style={[styles.analysisStatLabel, { color: colors.textSecondary }]}>AVG. DURATION</Text>
                    <Text style={[styles.analysisStatValue, { color: colors.text }]}>
                      {Math.floor(latestAnalysis.averageDuration)} min
                    </Text>
                  </View>
                  
                  <View style={styles.analysisStat}>
                    <Text style={[styles.analysisStatLabel, { color: colors.textSecondary }]}>AVG. RATING</Text>
                    <Text style={[styles.analysisStatValue, { color: colors.text }]}>
                      {latestAnalysis.averageRating.toFixed(1)}/5
                    </Text>
                  </View>
                </View>
                
                <View style={[styles.analysisSection, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.analysisSectionTitle, { color: colors.text }]}>Time Optimization</Text>
                  {latestAnalysis.recommendations.timeOptimization.map((tip, index) => (
                    <View key={`time-${index}`} style={styles.analysisTipItem}>
                      <View style={[styles.analysisBullet, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
                        <Text style={[styles.analysisBulletText, { color: colors.primary }]}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.analysisTipText, { color: colors.text }]}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
                
                <View style={[styles.analysisSection, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.analysisSectionTitle, { color: colors.text }]}>Exercise Recommendations</Text>
                  {latestAnalysis.recommendations.exerciseRecommendations.map((tip, index) => (
                    <View key={`exercise-${index}`} style={styles.analysisTipItem}>
                      <View style={[styles.analysisBullet, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
                        <Text style={[styles.analysisBulletText, { color: colors.primary }]}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.analysisTipText, { color: colors.text }]}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.analysisSection}>
                  <Text style={[styles.analysisSectionTitle, { color: colors.text }]}>General Tips</Text>
                  {latestAnalysis.recommendations.generalTips.map((tip, index) => (
                    <View key={`general-${index}`} style={styles.analysisTipItem}>
                      <View style={[styles.analysisBullet, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
                        <Text style={[styles.analysisBulletText, { color: colors.primary }]}>{index + 1}</Text>
                      </View>
                      <Text style={[styles.analysisTipText, { color: colors.text }]}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.noAnalysisContainer}>
                <Text style={[styles.noAnalysisText, { color: colors.textSecondary }]}>
                  Not enough workout data to generate an analysis. Complete more workouts to see insights.
                </Text>
              </View>
            )}
            
            <Button
              title="Close"
              onPress={() => setShowWorkoutAnalysis(false)}
              style={styles.closeAnalysisButton}
            />
          </Pressable>
        </Pressable>
      </Modal>
      
      {/* Rest Day Activities Modal */}
      <Modal
        visible={showRestDayActivities}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => {
            setShowRestDayActivities(false);
            Keyboard.dismiss();
          }}
        >
          <Pressable 
            style={[styles.restDayModal, { backgroundColor: colors.card }]} 
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.restDayModalHeader}>
              <Text style={[styles.restDayModalTitle, { color: colors.text }]}>Rest Day Activities</Text>
              <TouchableOpacity 
                onPress={() => setShowRestDayActivities(false)}
                style={[styles.closeButton, { backgroundColor: colors.background }]}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.restDayModalContent}>
              <Text style={[styles.restDayModalSubtitle, { color: colors.textSecondary }]}>
                Rest days are essential for muscle recovery and preventing burnout. 
                Here are some light activities you can do to stay active while giving your body time to recover:
              </Text>
              
              {restDayActivities.map((activity, index) => (
                <View key={index} style={styles.restDayActivityItem}>
                  <View style={[styles.restDayActivityBullet, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
                    <Text style={[styles.restDayActivityBulletText, { color: colors.primary }]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.restDayActivityText, { color: colors.text }]}>
                    {activity}
                  </Text>
                </View>
              ))}
              
              <View style={[styles.restDayTips, { backgroundColor: colors.background }]}>
                <Text style={[styles.restDayTipsTitle, { color: colors.text }]}>Rest Day Tips:</Text>
                <View style={styles.restDayTipItem}>
                  <Text style={[styles.restDayTipText, { color: colors.text }]}>• Focus on hydration and nutrition</Text>
                </View>
                <View style={styles.restDayTipItem}>
                  <Text style={[styles.restDayTipText, { color: colors.text }]}>• Get 7-9 hours of quality sleep</Text>
                </View>
                <View style={styles.restDayTipItem}>
                  <Text style={[styles.restDayTipText, { color: colors.text }]}>• Use foam rollers or massage tools for recovery</Text>
                </View>
                <View style={styles.restDayTipItem}>
                  <Text style={[styles.restDayTipText, { color: colors.text }]}>• Practice mindfulness or meditation</Text>
                </View>
              </View>
            </ScrollView>
            
            <Button
              title="Close"
              onPress={() => setShowRestDayActivities(false)}
              style={styles.closeRestDayButton}
            />
          </Pressable>
        </Pressable>
      </Modal>
      
      {/* Achievement Celebration Modal - Only show if gamification is enabled */}
      {gamificationEnabled && celebrationAchievement && (
        <AchievementModal
          achievement={celebrationAchievement}
          visible={showCelebration}
          onClose={clearCelebration}
        />
      )}
      
      {/* Smart Progress Tracking Section */}
      {smartProgress.percentToGoal > 0 && userProfile && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Progress</Text>
            <Target size={20} color={colors.primary} />
          </View>
          
          <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>
                {smartProgress.direction === 'down' ? 'Weight Loss' : 
                 smartProgress.direction === 'up' ? 'Weight Gain' : 'Weight Maintenance'} Progress
              </Text>
              <Text style={[styles.progressPercent, { color: colors.primary }]}>
                {Math.round(smartProgress.percentToGoal)}%
              </Text>
            </View>
            
            <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressBar,
                  { 
                    width: `${Math.min(100, smartProgress.percentToGoal)}%`,
                    backgroundColor: colors.primary
                  }
                ]}
              />
            </View>
            
            <View style={styles.progressFooter}>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {smartProgress.kgToGo > 0 
                  ? `${smartProgress.kgToGo.toFixed(1)} kg to go`
                  : 'Goal reached! 🎉'
                }
              </Text>
              
              {smartProgress.onTrack && (
                <View style={[styles.onTrackBadge, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                  <Text style={[styles.onTrackText, { color: colors.secondary }]}>On Track 🎯</Text>
                </View>
              )}
            </View>
            
            {/* Show motivational message based on progress */}
            <View style={styles.motivationContainer}>
              <Text style={[styles.motivationText, { color: colors.textSecondary }]}>
                {smartProgress.percentToGoal >= 100 
                  ? "Amazing! You've reached your goal! Keep up the great work!"
                  : smartProgress.percentToGoal >= 75
                  ? "You're so close to your goal! Keep pushing!"
                  : smartProgress.percentToGoal >= 50
                  ? "Great progress! You're halfway there!"
                  : smartProgress.percentToGoal >= 25
                  ? "Good start! Every step counts towards your goal."
                  : "Just getting started! Consistency is key to success."
                }
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingContainer: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
  },
  subGreeting: {
    fontSize: 16,
    marginTop: 4,
  },
  moodBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginLeft: 8,
  },
  moodEmoji: {
    fontSize: 20,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginLeft: 8,
  },
  moodPrompt: {
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: "center",
  },
  moodPromptText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  moodPromptEmoji: {
    fontSize: 20,
    letterSpacing: 8,
  },
  activeWorkoutCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeWorkoutContent: {
    flex: 1,
  },
  activeWorkoutLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  activeWorkoutTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  activeWorkoutStats: {
    flexDirection: "row",
  },
  activeWorkoutStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  activeWorkoutStatText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 4,
  },
  activeWorkoutAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  quickAccessContainer: {
    marginBottom: 24,
    gap: 12,
  },
  stepsWeightContainer: {
    gap: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAll: {
    fontSize: 14,
  },
  recommendationToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  browseButton: {
    marginTop: 8,
  },
  recentWorkout: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentWorkoutInfo: {
    marginBottom: 8,
  },
  recentWorkoutName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  recentWorkoutDate: {
    fontSize: 14,
  },
  recentWorkoutStats: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  recentWorkoutStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  recentWorkoutStatText: {
    fontSize: 14,
    marginLeft: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#FFB800",
  },
  goalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  goalContent: {
    flex: 1,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  goalText: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 8,
    flex: 1,
  },
  goalTimeframeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
  },
  goalTimeframeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  goalDate: {
    fontSize: 14,
  },
  goalTargetDate: {
    fontSize: 12,
    marginTop: 2,
  },
  goalProgressContainer: {
    marginTop: 8,
  },
  goalProgressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalProgressText: {
    fontSize: 12,
  },
  goalEditButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  goalEditContainer: {
    flex: 1,
  },
  goalEditInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  goalEditActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  goalEditCancel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  goalEditSave: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  addGoalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addGoalText: {
    fontSize: 16,
    marginLeft: 8,
  },
  viewAllGoalsButton: {
    marginTop: 8,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    textAlign: "center",
  },
  
  // Analysis Card Styles
  analysisCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  analysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  analysisTip: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  analysisButton: {
    alignSelf: "flex-start",
  },
  analysisButtonText: {
    fontSize: 14,
  },
  
  // Enable Recommendations Card
  enableRecommendationsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  enableRecommendationsText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    marginHorizontal: 16,
  },
  
  // Analyze Button
  analyzeButton: {
    marginTop: 8,
  },
  
  // Analysis Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  analysisModal: {
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    padding: 24,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  analysisModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  analysisModalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  analysisModalContent: {
    maxHeight: 400,
  },
  analysisStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  analysisStat: {
    alignItems: "center",
  },
  analysisStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  analysisStatValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  analysisSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  analysisSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  analysisTipItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  analysisBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  analysisBulletText: {
    fontSize: 12,
    fontWeight: "600",
  },
  analysisTipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  noAnalysisContainer: {
    alignItems: "center",
    padding: 24,
  },
  noAnalysisText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  closeAnalysisButton: {
    marginTop: 16,
  },
  
  // Mood-based Advice Banner
  moodAdviceBanner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  moodAdviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  moodAdviceText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  
  // Rest Day Card
  restDayCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  restDayTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  restDaySubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  restActivitiesList: {
    marginBottom: 16,
  },
  restActivity: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  restActivityBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  restActivityBulletText: {
    fontSize: 12,
    fontWeight: "600",
  },
  restActivityText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  seeMoreButton: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: "500",
  },
  
  // Rest Day Modal
  restDayModal: {
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    padding: 24,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  restDayModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  restDayModalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  restDayModalContent: {
    maxHeight: 400,
  },
  restDayModalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  restDayActivityItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  restDayActivityBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  restDayActivityBulletText: {
    fontSize: 12,
    fontWeight: "600",
  },
  restDayActivityText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  restDayTips: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  restDayTipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  restDayTipItem: {
    marginBottom: 8,
  },
  restDayTipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeRestDayButton: {
    marginTop: 16,
  },
  
  // Daily Fitness Tip Styles
  tipCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  
  // Gamification Styles
  gamificationContainer: {
    marginBottom: 24,
  },
  gamificationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  gamificationItem: {
    flex: 1,
  },
  achievementsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    position: 'relative',
  },
  achievementsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  achievementsBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  achievementsBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // New styles for smart progress tracking
  progressCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: "700",
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
  },
  onTrackBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onTrackText: {
    fontSize: 12,
    fontWeight: "600",
  },
  motivationContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  motivationText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  personalizationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  personalizationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  personalizationText: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  disabledCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  enableButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  enableButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Data Viewer Button Styles
  dataViewerButton: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dataViewerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dataViewerText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dataViewerSubtext: {
    fontSize: 12,
    marginLeft: 28,
  },
});