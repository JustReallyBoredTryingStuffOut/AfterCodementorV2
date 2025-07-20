import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWorkoutStore } from "./workoutStore";
import { useHealthStore } from "./healthStore";
import { useNotificationStore } from "./notificationStore";
import { Platform } from "react-native";

export interface Goal {
  id: string;
  text: string;
  date: string; // When the goal was created
  completed: boolean;
  category: string; // "weight" | "workout" | "nutrition" | "water" | "steps" | "health" | "other"
  timeframe: "weekly" | "monthly";
  targetDate?: string; // When the goal should be completed by
  aiAnalysis?: string | null;
  progress?: number; // Progress as a percentage (0-100)
  milestones?: GoalMilestone[]; // Sub-goals or checkpoints
  lastChecked?: string; // Last time progress was checked
  targetValue?: number; // Numeric target value (e.g., 10000 steps, 2L water)
  timePeriod?: string; // "daily", "weekly", "monthly"
  reminderSchedule?: "hourly" | "daily" | "custom"; // How often to send reminders
  currentValue?: number; // Current progress value
  dailyProgress?: Record<string, boolean>; // For tracking daily completion of weekly goals
  waterBottleSize?: number; // Size of water bottle in liters
}

export interface GoalMilestone {
  id: string;
  text: string;
  completed: boolean;
}

export interface UserMood {
  mood: string;
  emoji: string;
  date: string;
  preference?: string;
}

export interface AIPersonality {
  name: string;
  personality: 'motivational' | 'technical' | 'friendly' | 'strict';
  expertise: 'strength' | 'cardio' | 'flexibility' | 'nutrition' | 'general';
  communicationStyle: 'casual' | 'professional' | 'encouraging';
  avatar?: string;
}

export interface UserProfile {
  preferredName: string;
  fitnessGoals: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredWorkoutTime: 'morning' | 'afternoon' | 'evening';
  motivationStyle: 'achievement' | 'social' | 'health' | 'appearance';
  favoriteExercises: string[];
  dislikedExercises: string[];
  moodHistory: UserMood[];
}

export interface WorkoutAnalysis {
  averageDuration: number;
  averageRating: number;
  mostFrequentCategory: string;
  recommendations: {
    timeOptimization: string[];
    exerciseRecommendations: string[];
    generalTips: string[];
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

export interface AiChat {
  id: string;
  date: string;
  messages: ChatMessage[];
}

interface AiState {
  goals: Goal[];
  weeklyPrompt: string;
  monthlyPrompt: string;
  lastPromptDate: string | null;
  lastMoodPromptDate: string | null;
  userMood: UserMood | null;
  userName: string;
  chats: AiChat[];
  messages: ChatMessage[];
  isLoading: boolean;
  
  // Personalization
  aiPersonality: AIPersonality;
  userProfile: UserProfile;
  conversationMemory: string[];
  moodBasedResponses: boolean;
  hasCompletedOnboarding: boolean;
  
  // Actions
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  completeGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  updateLastPromptDate: (date: string) => void;
  updateLastMoodPromptDate: (date: string) => void;
  shouldShowGoalPrompt: () => boolean;
  shouldShowMoodPrompt: () => boolean;
  setUserMood: (mood: UserMood) => void;
  setUserName: (name: string) => void;
  
  // Goal progress tracking
  updateGoalProgress: (id: string, progress: number) => void;
  addGoalMilestone: (goalId: string, milestone: GoalMilestone) => void;
  completeGoalMilestone: (goalId: string, milestoneId: string) => void;
  checkGoalProgress: (goalId: string) => void;
  checkAllGoalsProgress: () => void;
  getGoalProgressMessage: (goal: Goal) => string;
  
  // Goal reminders
  scheduleGoalReminder: (goalId: string, frequency: "hourly" | "daily" | "custom", customHours?: number[]) => void;
  cancelGoalReminder: (goalId: string) => void;
  
  // AI analysis
  analyzeWorkoutDurations: (workoutLogs: any[]) => WorkoutAnalysis;
  getLatestWorkoutAnalysis: () => WorkoutAnalysis | null;
  getPromptForTimeframe: (timeframe: "weekly" | "monthly") => string;
  getMoodBasedWorkoutAdvice: () => string | null;
  
  // Chat functions
  addChat: (chat: AiChat) => void;
  deleteChat: (chatId: string) => void;
  addMessageToChat: (chatId: string, message: Omit<ChatMessage, "id" | "timestamp">) => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  
  // Personalization actions
  setAIPersonality: (personality: AIPersonality) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  addToConversationMemory: (memory: string) => void;
  clearConversationMemory: () => void;
  toggleMoodBasedResponses: (enabled: boolean) => void;
  getMoodBasedRecommendation: () => string;
  generatePersonalizedGreeting: () => string;
        setOnboardingComplete: (completed: boolean) => void;
      resetOnboarding: () => void;
}

// Helper function to clean markdown formatting from text
const cleanMarkdownFormatting = (text: string): string => {
  // Remove markdown bold/italic formatting (** or __ for bold, * or _ for italic)
  let cleaned = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');
  return cleaned;
};

export const useAiStore = create<AiState>()(
  persist(
    (set, get) => ({
      goals: [],
      weeklyPrompt: "What fitness goal would you like to achieve this week? Setting a clear, achievable weekly goal can help you stay focused and motivated.",
      monthlyPrompt: "What fitness goal would you like to achieve this month? A monthly goal gives you time to make meaningful progress toward a larger achievement.",
      lastPromptDate: null,
      lastMoodPromptDate: null,
      userMood: null,
      userName: "",
      chats: [],
      messages: [],
      isLoading: false,
      
      // Personalization defaults
      aiPersonality: {
        name: "Coach Alex",
        personality: 'motivational',
        expertise: 'general',
        communicationStyle: 'encouraging',
        avatar: undefined
      },
      userProfile: {
        preferredName: "",
        fitnessGoals: [],
        experienceLevel: 'beginner',
        preferredWorkoutTime: 'evening',
        motivationStyle: 'health',
        favoriteExercises: [],
        dislikedExercises: [],
        moodHistory: []
      },
      conversationMemory: [],
      moodBasedResponses: true,
      hasCompletedOnboarding: false,
      
      addGoal: (goal) => set((state) => ({
        goals: [...state.goals, goal]
      })),
      
      updateGoal: (id, updates) => set((state) => ({
        goals: state.goals.map(goal => 
          goal.id === id ? { ...goal, ...updates } : goal
        )
      })),
      
      completeGoal: (id) => set((state) => ({
        goals: state.goals.map(goal => 
          goal.id === id ? { ...goal, completed: true } : goal
        )
      })),
      
      deleteGoal: (id) => set((state) => ({
        goals: state.goals.filter(goal => goal.id !== id)
      })),
      
      updateLastPromptDate: (date) => set({
        lastPromptDate: date
      }),
      
      updateLastMoodPromptDate: (date) => set({
        lastMoodPromptDate: date
      }),
      
      shouldShowGoalPrompt: () => {
        const { lastPromptDate, goals } = get();
        
        // If no previous prompt, show it (new user)
        if (!lastPromptDate) return true;
        
        // If user has no goals yet, show prompt regardless of day
        if (!goals || goals.length === 0) return true;
        
        const lastPrompt = new Date(lastPromptDate);
        const now = new Date();
        
        // Check if it's been at least 7 days since the last prompt for weekly goals
        const diffTime = Math.abs(now.getTime() - lastPrompt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isWeeklyInterval = diffDays >= 7;
        
        // Check if it's been at least 30 days since the last prompt for monthly goals
        const isMonthlyInterval = diffDays >= 30;
        
        // Check if it's the beginning of the week (Monday) or month (1st)
        const isMonday = now.getDay() === 1;
        const isFirstOfMonth = now.getDate() === 1;
        
        // Show prompt if:
        // 1. It's Monday and it's been at least 7 days since the last prompt, or
        // 2. It's the 1st of the month and it's been at least 30 days since the last prompt
        return (isMonday && isWeeklyInterval) || (isFirstOfMonth && isMonthlyInterval);
      },
      
      shouldShowMoodPrompt: () => {
        const { lastMoodPromptDate, userMood } = get();
        const now = new Date();
        
        // If user already set mood today, don't show prompt
        if (userMood) {
          const moodDate = new Date(userMood.date);
          if (moodDate.toDateString() === now.toDateString()) {
            return false;
          }
        }
        
        // If no previous prompt, show it
        if (!lastMoodPromptDate) return true;
        
        const lastPrompt = new Date(lastMoodPromptDate);
        
        // Don't show mood prompt if it's been less than 4 hours since the last one
        const hoursSinceLastPrompt = (now.getTime() - lastPrompt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastPrompt < 4) return false;
        
        // Check if it's a reasonable time to show the prompt (between 6am and 10pm)
        const hour = now.getHours();
        if (hour < 6 || hour > 22) return false;
        
        // Check if user has scheduled workouts today
        const workoutStore = useWorkoutStore.getState();
        const hasScheduledWorkout = workoutStore.scheduledWorkouts.some(sw => {
          const scheduleDate = new Date(sw.date);
          return scheduleDate.toDateString() === now.toDateString();
        });
        
        // Show more frequently if user has scheduled workouts today
        return hasScheduledWorkout || lastPrompt.toDateString() !== now.toDateString();
      },
      
      setUserMood: (mood) => set({
        userMood: mood
      }),
      
      setUserName: (name) => set({
        userName: name
      }),
      
      // Goal progress tracking
      updateGoalProgress: (id, progress) => set((state) => ({
        goals: state.goals.map(goal => 
          goal.id === id ? { ...goal, progress: Math.min(100, progress) } : goal
        )
      })),
      
      addGoalMilestone: (goalId, milestone) => set((state) => ({
        goals: state.goals.map(goal => {
          if (goal.id === goalId) {
            const milestones = goal.milestones || [];
            return {
              ...goal,
              milestones: [...milestones, milestone]
            };
          }
          return goal;
        })
      })),
      
      completeGoalMilestone: (goalId, milestoneId) => set((state) => ({
        goals: state.goals.map(goal => {
          if (goal.id === goalId && goal.milestones) {
            const updatedMilestones = goal.milestones.map(milestone => 
              milestone.id === milestoneId ? { ...milestone, completed: true } : milestone
            );
            
            // Calculate new progress based on completed milestones
            const totalMilestones = updatedMilestones.length;
            const completedMilestones = updatedMilestones.filter(m => m.completed).length;
            const newProgress = totalMilestones > 0 
              ? Math.round((completedMilestones / totalMilestones) * 100) 
              : goal.progress || 0;
            
            // Check if all milestones are completed
            const allCompleted = totalMilestones > 0 && completedMilestones === totalMilestones;
            
            return {
              ...goal,
              milestones: updatedMilestones,
              progress: newProgress,
              completed: allCompleted || goal.completed,
              lastChecked: new Date().toISOString()
            };
          }
          return goal;
        })
      })),
      
      checkGoalProgress: (goalId) => {
        const { goals, updateGoalProgress, completeGoal } = get();
        const goal = goals ? goals.find(g => g.id === goalId) : undefined;
        
        if (!goal) return;
        
        // Mark that we checked this goal
        set(state => ({
          goals: state.goals.map(g => 
            g.id === goalId ? { ...g, lastChecked: new Date().toISOString() } : g
          )
        }));
        
        // Skip if already completed
        if (goal.completed) return;
        
        // Check if target date has passed
        if (goal.targetDate) {
          const targetDate = new Date(goal.targetDate);
          const now = new Date();
          
          if (now > targetDate) {
            // Target date passed, check if we should mark as completed or failed
            // For now, we'll just update the lastChecked date
            return;
          }
        }
        
        // Check progress based on goal category and text
        let progress = 0;
        let completed = false;
        
        switch (goal.category) {
          case "weight": {
            // Check weight goals
            const healthStore = useHealthStore.getState();
            const weightLogs = healthStore.weightLogs;
            
            if (weightLogs.length >= 2) {
              // Sort logs by date (oldest first)
              const sortedLogs = [...weightLogs].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              
              // Get weight at goal creation time or first available
              const goalDate = new Date(goal.date);
              let startWeight = sortedLogs[0].weight;
              
              for (let i = 0; i < sortedLogs.length; i++) {
                const logDate = new Date(sortedLogs[i].date);
                if (logDate >= goalDate) {
                  if (i > 0) {
                    startWeight = sortedLogs[i - 1].weight;
                  }
                  break;
                }
              }
              
              // Get latest weight
              const latestWeight = sortedLogs[sortedLogs.length - 1].weight;
              
              // Check if goal is about weight loss
              if (goal.text.toLowerCase().includes("lose") || 
                  goal.text.toLowerCase().includes("reduce") ||
                  goal.text.toLowerCase().includes("drop")) {
                
                // Extract target weight loss amount
                const matches = goal.text.match(/\d+(\.\d+)?/);
                if (matches) {
                  const targetLoss = parseFloat(matches[0]);
                  const actualLoss = Math.max(0, startWeight - latestWeight);
                  
                  progress = Math.min(100, Math.round((actualLoss / targetLoss) * 100));
                  completed = actualLoss >= targetLoss;
                }
              }
              // Check if goal is about weight gain
              else if (goal.text.toLowerCase().includes("gain") || 
                       goal.text.toLowerCase().includes("increase") ||
                       goal.text.toLowerCase().includes("build")) {
                
                // Extract target weight gain amount
                const matches = goal.text.match(/\d+(\.\d+)?/);
                if (matches) {
                  const targetGain = parseFloat(matches[0]);
                  const actualGain = Math.max(0, latestWeight - startWeight);
                  
                  progress = Math.min(100, Math.round((actualGain / targetGain) * 100));
                  completed = actualGain >= targetGain;
                }
              }
            }
            break;
          }
          
          case "workout": {
            // Check workout goals
            const workoutStore = useWorkoutStore.getState();
            const workoutLogs = workoutStore.workoutLogs;
            
            // Check if goal is about completing a number of workouts
            if (goal.text.toLowerCase().includes("workout") || 
                goal.text.toLowerCase().includes("exercise")) {
              
              // Extract target number of workouts
              const matches = goal.text.match(/\d+/);
              if (matches) {
                const targetWorkouts = parseInt(matches[0]);
                
                // Count workouts since goal was created
                const goalDate = new Date(goal.date);
                const completedWorkouts = workoutLogs.filter(log => {
                  const logDate = new Date(log.date);
                  return logDate >= goalDate && log.completed;
                }).length;
                
                progress = Math.min(100, Math.round((completedWorkouts / targetWorkouts) * 100));
                completed = completedWorkouts >= targetWorkouts;
              }
            }
            // Check if goal is about specific exercises
            else if (goal.text.toLowerCase().includes("push-up") || 
                     goal.text.toLowerCase().includes("pushup") ||
                     goal.text.toLowerCase().includes("pull-up") ||
                     goal.text.toLowerCase().includes("pullup") ||
                     goal.text.toLowerCase().includes("squat") ||
                     goal.text.toLowerCase().includes("plank")) {
              
              // This would require more detailed tracking of specific exercises
              // For now, we'll rely on milestones for these goals
            }
            break;
          }
          
          case "water": {
            // Check water intake goals
            const healthStore = useHealthStore.getState();
            const waterIntake = healthStore.waterIntake || []; // Add default empty array
            
            // Extract target water amount (in liters)
            const matches = goal.text.match(/(\d+(\.\d+)?)\s*(l|liter|liters)/i);
            if (matches) {
              const targetWater = parseFloat(matches[1]);
              
              // Handle different timeframes for water goals
              if (goal.timeframe === "weekly" && goal.text.toLowerCase().includes("daily")) {
                // For goals like "drink 2L of water daily for a week"
                // We need to check each day of the current week
                
                // Initialize daily progress tracking if not exists
                if (!goal.dailyProgress) {
                  set(state => ({
                    goals: state.goals.map(g => 
                      g.id === goalId ? { ...g, dailyProgress: {} } : g
                    )
                  }));
                }
                
                // Get the start of the current week (Sunday)
                const today = new Date();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay()); // Go to Sunday
                startOfWeek.setHours(0, 0, 0, 0);
                
                // Check water intake for each day of the current week
                const dailyProgress: Record<string, boolean> = { ...goal.dailyProgress } || {};
                let daysCompleted = 0;
                
                for (let i = 0; i < 7; i++) {
                  const currentDate = new Date(startOfWeek);
                  currentDate.setDate(startOfWeek.getDate() + i);
                  const dateString = currentDate.toISOString().split('T')[0];
                  
                  // Skip future days
                  if (currentDate > today) continue;
                  
                  // Calculate water intake for this day
                  const dayWaterIntake = waterIntake
                    .filter(entry => new Date(entry.date).toISOString().split('T')[0] === dateString)
                    .reduce((total, entry) => total + entry.amount, 0);
                  
                  // Check if target was met for this day
                  const targetMet = dayWaterIntake >= targetWater;
                  dailyProgress[dateString] = targetMet;
                  
                  if (targetMet) {
                    daysCompleted++;
                  }
                }
                
                // Update daily progress tracking
                set(state => ({
                  goals: state.goals.map(g => 
                    g.id === goalId ? { ...g, dailyProgress } : g
                  )
                }));
                
                // Calculate overall progress (percentage of days completed)
                const daysPassed = Math.min(7, today.getDay() + 1); // Number of days passed in current week
                progress = Math.round((daysCompleted / 7) * 100);
                
                // Goal is completed if all 7 days met the target
                completed = daysCompleted === 7;
                
                // Update current value to show days completed
                set(state => ({
                  goals: state.goals.map(g => 
                    g.id === goalId ? { ...g, currentValue: daysCompleted } : g
                  )
                }));
              } else {
                // For regular daily water goals
                // Calculate water intake for today
                const todayWaterIntake = waterIntake
                  .filter(entry => new Date(entry.date).toDateString() === new Date().toDateString())
                  .reduce((total, entry) => total + entry.amount, 0);
                
                // Update current value
                set(state => ({
                  goals: state.goals.map(g => 
                    g.id === goalId ? { ...g, currentValue: todayWaterIntake } : g
                  )
                }));
                
                // Calculate progress
                progress = Math.min(100, Math.round((todayWaterIntake / targetWater) * 100));
                completed = todayWaterIntake >= targetWater;
              }
            }
            break;
          }
          
          case "steps": {
            // Check step goals
            const healthStore = useHealthStore.getState();
            const stepCount = healthStore.stepCount || 0; // Add default value
            
            // Extract target steps
            const matches = goal.text.match(/(\d+)\s*(steps|step)/i);
            if (matches) {
              const targetSteps = parseInt(matches[1]);
              
              // Update current value
              set(state => ({
                goals: state.goals.map(g => 
                  g.id === goalId ? { ...g, currentValue: stepCount } : g
                )
              }));
              
              // Calculate progress
              progress = Math.min(100, Math.round((stepCount / targetSteps) * 100));
              completed = stepCount >= targetSteps;
            }
            break;
          }
          
          case "nutrition": {
            // Check nutrition goals
            // This would require integration with nutrition tracking
            // For now, we'll rely on milestones for these goals
            break;
          }
          
          default:
            // For other goals, rely on manual updates or milestones
            break;
        }
        
        // Update progress if we calculated it
        if (progress > 0) {
          updateGoalProgress(goalId, progress);
        }
        
        // Mark as completed if achieved
        if (completed) {
          completeGoal(goalId);
        }
      },
      
      checkAllGoalsProgress: () => {
        const { goals, checkGoalProgress } = get();
        
        // Check active goals - add null check for goals
        if (goals && goals.length > 0) {
          goals.filter(goal => !goal.completed).forEach(goal => {
            checkGoalProgress(goal.id);
          });
        }
      },
      
      getGoalProgressMessage: (goal) => {
        if (goal.completed) {
          return "Congratulations! You've completed this goal.";
        }
        
        // Special message for weekly water goals
        if (goal.category === "water" && goal.timeframe === "weekly" && goal.text.toLowerCase().includes("daily")) {
          const daysCompleted = goal.currentValue || 0;
          const daysRemaining = 7 - daysCompleted;
          
          if (daysCompleted === 0) {
            return "Start tracking your daily water intake to make progress on this goal.";
          } else if (daysCompleted < 3) {
            return `You've met your water goal for ${daysCompleted} day${daysCompleted > 1 ? 's' : ''} this week. Keep going!`;
          } else if (daysCompleted < 6) {
            return `Great progress! You've met your water goal for ${daysCompleted} days this week. Just ${daysRemaining} more to go!`;
          } else if (daysCompleted === 6) {
            return "Almost there! You've met your water goal for 6 days this week. Just one more day to complete your goal!";
          } else {
            return "You've met your water goal every day this week! Great job staying hydrated!";
          }
        }
        
        // Special message for water goals with bottle size
        if (goal.category === "water" && goal.waterBottleSize) {
          // Extract target water amount (in liters)
          const matches = goal.text.match(/(\d+(\.\d+)?)\s*(l|liter|liters)/i);
          if (matches) {
            const targetWater = parseFloat(matches[1]);
            const bottleSize = goal.waterBottleSize;
            const bottlesNeeded = Math.ceil(targetWater / bottleSize);
            const currentValue = goal.currentValue || 0;
            const bottlesCompleted = Math.floor(currentValue / bottleSize);
            const bottlesRemaining = Math.max(0, bottlesNeeded - bottlesCompleted);
            
            if (bottlesCompleted === 0) {
              return `You need to drink ${bottlesNeeded} bottle${bottlesNeeded !== 1 ? 's' : ''} (${bottleSize}L each) to reach your goal.`;
            } else if (bottlesCompleted < bottlesNeeded) {
              return `You've had ${bottlesCompleted} bottle${bottlesCompleted !== 1 ? 's' : ''} so far. ${bottlesRemaining} more to go!`;
            } else {
              return "You've reached your water intake goal for today!";
            }
          }
        }
        
        if (!goal.progress || goal.progress === 0) {
          return "You're just getting started with this goal.";
        }
        
        if (goal.progress < 25) {
          return "You're making initial progress toward this goal.";
        } else if (goal.progress < 50) {
          return "You're making steady progress. Keep going!";
        } else if (goal.progress < 75) {
          return "You're well on your way to achieving this goal!";
        } else if (goal.progress < 100) {
          return "You're almost there! Just a little more effort.";
        } else {
          return "You've reached your goal! Consider marking it complete.";
        }
      },
      
      // Goal reminder functions
      scheduleGoalReminder: (goalId, frequency, customHours) => {
        if (Platform.OS === "web") return;
        
        try {
          const notificationStore = useNotificationStore.getState();
          if (notificationStore && typeof notificationStore.scheduleGoalReminder === 'function') {
            // Schedule reminders based on goal category and frequency
            notificationStore.scheduleGoalReminder(goalId, frequency, customHours);
            
            // Update goal with reminder schedule
            set(state => ({
              goals: state.goals.map(g => 
                g.id === goalId ? { ...g, reminderSchedule: frequency } : g
              )
            }));
          } else {
            console.warn("scheduleGoalReminder function not available in notificationStore");
          }
        } catch (error) {
          console.error("Failed to schedule reminder:", error);
        }
      },
      
      cancelGoalReminder: (goalId) => {
        if (Platform.OS === "web") return;
        
        try {
          const notificationStore = useNotificationStore.getState();
          if (notificationStore && typeof notificationStore.cancelGoalReminder === 'function') {
            notificationStore.cancelGoalReminder(goalId);
          } else {
            console.warn("cancelGoalReminder function not available in notificationStore");
          }
        } catch (error) {
          console.error("Failed to cancel reminder:", error);
        }
      },
      
      // AI analysis functions
      analyzeWorkoutDurations: (workoutLogs) => {
        // Skip if no logs
        if (!workoutLogs || workoutLogs.length === 0) {
          return {
            averageDuration: 0,
            averageRating: 0,
            mostFrequentCategory: "",
            recommendations: {
              timeOptimization: [],
              exerciseRecommendations: [],
              generalTips: []
            }
          };
        }
        
        // Calculate average duration
        const completedLogs = workoutLogs.filter(log => log.completed && log.duration);
        const totalDuration = completedLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
        const averageDuration = completedLogs.length > 0 ? totalDuration / completedLogs.length : 0;
        
        // Calculate average rating
        const ratedLogs = workoutLogs.filter(log => log.rating && log.rating.rating);
        const totalRating = ratedLogs.reduce((sum, log) => sum + (log.rating?.rating || 0), 0);
        const averageRating = ratedLogs.length > 0 ? totalRating / ratedLogs.length : 0;
        
        // Find most frequent workout category
        const workoutStore = useWorkoutStore.getState();
        const { workouts } = workoutStore;
        
        const categoryCounts: Record<string, number> = {};
        completedLogs.forEach(log => {
          const workout = workouts.find(w => w.id === log.workoutId);
          if (workout) {
            categoryCounts[workout.category] = (categoryCounts[workout.category] || 0) + 1;
          }
        });
        
        let mostFrequentCategory = "";
        let maxCount = 0;
        
        Object.entries(categoryCounts).forEach(([category, count]) => {
          if (count > maxCount) {
            mostFrequentCategory = category;
            maxCount = count;
          }
        });
        
        // Generate recommendations
        const timeOptimization = [];
        const exerciseRecommendations = [];
        const generalTips = [];
        
        // Time optimization recommendations
        if (averageDuration < 30) {
          timeOptimization.push("Your workouts are relatively short. Consider adding 5-10 minutes to increase effectiveness.");
          timeOptimization.push("Try supersets to maximize your time efficiency while increasing workout intensity.");
        } else if (averageDuration > 75) {
          timeOptimization.push("Your workouts are on the longer side. Consider splitting them into more frequent, shorter sessions for better recovery.");
          timeOptimization.push("Focus on compound exercises to get more benefit in less time.");
        } else {
          timeOptimization.push("Your workout duration is in the optimal range. Keep it up!");
          timeOptimization.push("To maximize results, ensure you're maintaining intensity throughout your workouts.");
        }
        
        // Exercise recommendations based on most frequent category
        if (mostFrequentCategory) {
          if (mostFrequentCategory === "strength") {
            exerciseRecommendations.push("You're focusing on strength training. Consider adding some mobility work to maintain flexibility.");
            exerciseRecommendations.push("To improve strength gains, ensure you're progressively overloading by increasing weight or reps.");
          } else if (mostFrequentCategory === "cardio") {
            exerciseRecommendations.push("You're doing a lot of cardio. Consider adding strength training 2-3 times per week for balanced fitness.");
            exerciseRecommendations.push("Try interval training to boost cardiovascular benefits while keeping workouts interesting.");
          } else if (mostFrequentCategory === "hiit") {
            exerciseRecommendations.push("HIIT workouts are great for efficiency, but ensure you're allowing adequate recovery between sessions.");
            exerciseRecommendations.push("Consider adding a low-intensity recovery day between HIIT sessions.");
          }
        } else {
          exerciseRecommendations.push("Try to maintain a balanced approach with both strength and cardio exercises.");
          exerciseRecommendations.push("Consider trying different workout types to find what you enjoy most.");
        }
        
        // General tips
        generalTips.push("Consistency is more important than intensity. Aim for regular workouts even if they're shorter sometimes.");
        generalTips.push("Don't forget to prioritize recovery with adequate sleep and nutrition.");
        generalTips.push("Track your progress to stay motivated and see how far you've come.");
        
        return {
          averageDuration,
          averageRating,
          mostFrequentCategory,
          recommendations: {
            timeOptimization,
            exerciseRecommendations,
            generalTips
          }
        };
      },
      
      getLatestWorkoutAnalysis: () => {
        const workoutStore = useWorkoutStore.getState();
        const { workoutLogs } = workoutStore;
        
        if (workoutLogs.length < 3) {
          return null; // Not enough data for meaningful analysis
        }
        
        return get().analyzeWorkoutDurations(workoutLogs);
      },
      
      getPromptForTimeframe: (timeframe) => {
        if (timeframe === "weekly") {
          return get().weeklyPrompt;
        } else {
          return get().monthlyPrompt;
        }
      },
      
      getMoodBasedWorkoutAdvice: () => {
        const { userMood } = get();
        
        if (!userMood) return null;
        
        // Check if mood is from today
        const moodDate = new Date(userMood.date);
        const today = new Date();
        
        if (moodDate.toDateString() !== today.toDateString()) {
          return null;
        }
        
        // Return advice based on mood and preference
        switch (userMood.mood) {
          case "great":
            if (userMood.preference === "challenging") {
              return "You're feeling great today! This is the perfect time to challenge yourself with a high-intensity workout.";
            }
            return "Your energy is high today - a great opportunity to push yourself a bit more than usual.";
            
          case "good":
            if (userMood.preference === "challenging") {
              return "You're in a good mood for a challenging workout. Focus on progressive overload today.";
            }
            return "With your positive mood, aim for a balanced workout with both strength and cardio elements.";
            
          case "okay":
            if (userMood.preference === "energizing") {
              return "A moderate workout can help boost your mood and energy levels today.";
            }
            return "Even when feeling just okay, a workout can improve your mood. Start with something enjoyable.";
            
          case "tired":
            if (userMood.preference === "shorter") {
              return "It's okay to do a shorter workout when you're tired. Focus on quality over quantity today.";
            }
            return "Listen to your body when tired. Consider a lighter workout with focus on form and technique.";
            
          case "bad":
            if (userMood.preference === "light") {
              return "Exercise can help improve your mood. A gentle workout like yoga or walking might be perfect today.";
            }
            return "Movement can be medicine for a bad mood. Even a short walk can help shift your perspective.";
            
          default:
            return "Remember that consistency matters more than perfection. Any movement is better than none.";
        }
      },
      
      // Chat functions
      addChat: (chat) => set((state) => ({
        chats: [...state.chats, chat]
      })),
      
      deleteChat: (chatId) => set((state) => ({
        chats: state.chats.filter(chat => chat.id !== chatId)
      })),
      
      addMessageToChat: (chatId, message) => {
        // Clean any markdown formatting from the message content
        const cleanedContent = cleanMarkdownFormatting(message.content);
        
        set((state) => ({
          chats: state.chats.map(chat => {
            if (chat.id === chatId) {
              return {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    id: Date.now().toString(),
                    ...message,
                    content: cleanedContent, // Use cleaned content
                    timestamp: new Date().toISOString()
                  }
                ]
              };
            }
            return chat;
          })
        }));
      },
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      setLoading: (loading) => set({ isLoading: loading }),
      clearMessages: () => set({ messages: [] }),
      
      // Personalization actions
      setAIPersonality: (personality) => set({ aiPersonality: personality }),
      
      updateUserProfile: (updates) => set((state) => ({
        userProfile: { ...state.userProfile, ...updates }
      })),
      
      addToConversationMemory: (memory) => set((state) => ({
        conversationMemory: [...state.conversationMemory, memory]
      })),
      
      clearConversationMemory: () => set({ conversationMemory: [] }),
      
      toggleMoodBasedResponses: (enabled) => set({ moodBasedResponses: enabled }),
      
      getMoodBasedRecommendation: () => {
        const { userMood, userProfile } = get();
        
        if (!userMood) return "How are you feeling today? This helps me give you better workout recommendations.";
        
        const mood = userMood.mood;
        const preference = userMood.preference;
        
        // Enhanced mood-based recommendations using existing mood data
        const recommendations = {
          great: {
            challenging: "You're feeling amazing! Perfect time for a high-intensity workout. Push your limits today! 💪",
            energizing: "Your energy is through the roof! Let's channel that into an energizing full-body session.",
            shorter: "Even with great energy, sometimes shorter, focused workouts are best. Quality over quantity!"
          },
          good: {
            challenging: "Good mood + challenging workout = amazing results! Ready to crush it?",
            energizing: "Your positive energy is perfect for a balanced, energizing workout.",
            shorter: "Good mood calls for a focused, efficient workout. Let's make every minute count!"
          },
          okay: {
            challenging: "Feeling okay? A challenging workout might be just what you need to boost your mood!",
            energizing: "Let's turn that 'okay' into 'great' with an energizing workout!",
            shorter: "Sometimes a shorter, enjoyable workout is exactly what you need when feeling just okay."
          },
          tired: {
            challenging: "Feeling tired? Listen to your body - a lighter workout might be perfect today.",
            energizing: "Tired but want to move? A gentle, energizing session could help boost your energy.",
            shorter: "When tired, shorter workouts are often better. Focus on form and enjoy the movement."
          },
          bad: {
            challenging: "Having a tough day? Exercise can be great medicine. Start gentle and see how you feel.",
            energizing: "Movement can help shift your mood. Even a light, energizing walk can make a difference.",
            shorter: "On bad days, sometimes just showing up is enough. A short, gentle workout might help."
          }
        };
        
        return recommendations[mood]?.[preference] || 
               "Remember: any movement is better than none. Listen to your body and do what feels right.";
      },
      
      generatePersonalizedGreeting: () => {
        const { aiPersonality, userProfile, userMood } = get();
        const { name: aiName, personality } = aiPersonality;
        const { preferredName, experienceLevel } = userProfile;
        
        const timeOfDay = new Date().getHours();
        let greeting = "";
        
        // Time-based greeting
        if (timeOfDay < 12) {
          greeting = "Good morning";
        } else if (timeOfDay < 17) {
          greeting = "Good afternoon";
        } else {
          greeting = "Good evening";
        }
        
        // Add name if available
        if (preferredName) {
          greeting += ` ${preferredName}`;
        }
        
        // Personality-based greeting
        switch (personality) {
          case 'motivational':
            greeting += "! 💪 Ready to crush your fitness goals today?";
            break;
          case 'technical':
            greeting += "! Let's optimize your workout routine for maximum results.";
            break;
          case 'friendly':
            greeting += "! How's your fitness journey going? I'm here to help! 😊";
            break;
          case 'strict':
            greeting += "! Time to get serious about your fitness. What's your plan today?";
            break;
          default:
            greeting += "! How can I help with your fitness goals today?";
        }
        
        // Add mood-based context if available
        if (userMood) {
          const moodDate = new Date(userMood.date);
          const today = new Date();
          
          if (moodDate.toDateString() === today.toDateString()) {
            switch (userMood.mood) {
              case 'great':
                greeting += " I can see you're feeling great today - perfect energy for a workout!";
                break;
              case 'tired':
                greeting += " I notice you're feeling tired. Remember, it's okay to take it easy when needed.";
                break;
              case 'bad':
                greeting += " I see you're having a tough day. Movement can help - even a gentle workout might lift your spirits.";
                break;
            }
          }
        }
        
        return greeting;
      },
      
      setOnboardingComplete: (completed) => set({ hasCompletedOnboarding: completed }),
      
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
    }),
    {
      name: "ai-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);