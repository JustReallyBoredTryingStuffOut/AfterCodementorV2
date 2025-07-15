import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";

interface NotificationSettings {
  enabled: boolean;
  workoutReminders: boolean;
  mealReminders: boolean;
  waterReminders: boolean;
  stepReminders: boolean;
  dailySummary: boolean;
  longWorkoutAlert: boolean;
}

interface WorkoutReminder {
  minutesBefore: number;
  sound: boolean;
}

interface MealReminder {
  breakfast: boolean;
  breakfastTime: string; // HH:MM format
  lunch: boolean;
  lunchTime: string;
  dinner: boolean;
  dinnerTime: string;
  snacks: boolean;
}

interface WaterReminder {
  interval: number; // minutes
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  specificTimes: string[]; // Array of HH:MM format times for specific reminders
}

interface StepReminder {
  reminderTime: string; // HH:MM format
  goalPercentage: number; // Remind at what percentage of goal
}

interface NotificationState {
  settings: NotificationSettings;
  workoutReminders: WorkoutReminder;
  mealReminders: MealReminder;
  waterReminders: WaterReminder;
  stepReminders: StepReminder;
  goalReminderIds: Record<string, string[]>; // Map of goalId to notification IDs
  
  // Actions
  updateSettings: (settings: NotificationSettings) => void;
  updateWorkoutReminder: (reminder: WorkoutReminder) => void;
  updateMealReminder: (reminder: MealReminder) => void;
  updateWaterReminder: (reminder: WaterReminder) => void;
  updateStepReminder: (reminder: StepReminder) => void;
  
  scheduleWorkoutNotification: (workoutId: string, workoutName: string, scheduledTime: Date) => Promise<string | null>;
  cancelWorkoutNotification: (notificationId: string) => Promise<void>;
  
  scheduleMealNotification: (mealType: string, time: Date) => Promise<string | null>;
  scheduleWaterNotification: () => Promise<void>;
  scheduleStepNotification: (goalSteps: number) => Promise<string | null>;
  
  // Goal reminder functions
  scheduleGoalReminder: (goalId: string, frequency: "hourly" | "daily" | "custom", customHours?: number[]) => Promise<void>;
  cancelGoalReminder: (goalId: string) => Promise<void>;
  
  // New function for long workout notification
  showLongWorkoutNotification: (workoutName: string, durationMinutes: number) => Promise<string | null>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

interface NotificationStoreState {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

const defaultSettings: NotificationSettings = {
  enabled: false,
  workoutReminders: true,
  mealReminders: true,
  waterReminders: true,
  stepReminders: true,
  dailySummary: true,
  longWorkoutAlert: true,
};

const defaultWorkoutReminder: WorkoutReminder = {
  minutesBefore: 30,
  sound: true,
};

const defaultMealReminder: MealReminder = {
  breakfast: true,
  breakfastTime: "08:00",
  lunch: true,
  lunchTime: "12:30",
  dinner: true,
  dinnerTime: "19:00",
  snacks: false,
};

// Default water reminder times throughout the day
const defaultWaterReminder: WaterReminder = {
  interval: 60, // 1 hour
  startTime: "08:00",
  endTime: "22:00",
  specificTimes: ["10:00", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30", "21:00"] // More frequent reminders
};

const defaultStepReminder: StepReminder = {
  reminderTime: "19:00",
  goalPercentage: 70, // Remind if less than 70% of goal is reached
};

// Create a secure storage for sensitive notification data
const secureStorage = Platform.OS !== "web" 
  ? {
      getItem: async (key: string) => {
        try {
          return await SecureStore.getItemAsync(key);
        } catch (e) {
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          await SecureStore.setItemAsync(key, value);
        } catch (e) {
          console.error("Error storing secure data:", e);
        }
      },
      removeItem: async (key: string) => {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (e) {
          console.error("Error removing secure data:", e);
        }
      }
    }
  : {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve()
    };

// Goal reminder messages by category
const getReminderMessages = (category: string, goalText: string): string[] => {
  switch (category) {
    case 'water':
      return [
        "Have you had your water today? Stay hydrated!",
        `Remember your goal: ${goalText}`,
        "Hydration is key to performance. Time for some water!",
        "Water break! Your body will thank you.",
        "Staying hydrated helps with recovery and energy levels."
      ];
    case 'steps':
      return [
        "Time to get moving! How are your steps looking today?",
        `Remember your goal: ${goalText}`,
        "A quick walk can help you reach your step goal.",
        "Stand up and move around for a few minutes.",
        "Every step counts toward your goal!"
      ];
    case 'workout':
      return [
        "Don't forget your workout today!",
        `Remember your goal: ${goalText}`,
        "Consistency is key to fitness success.",
        "Your future self will thank you for working out today.",
        "A short workout is better than no workout!"
      ];
    case 'weight':
      return [
        "Tracking your weight regularly helps stay accountable.",
        `Remember your goal: ${goalText}`,
        "Small, consistent progress adds up over time.",
        "Focus on healthy habits, not just the number on the scale.",
        "You're making progress, keep going!"
      ];
    case 'nutrition':
      return [
        "How's your nutrition today? Stay on track with your goal.",
        `Remember your goal: ${goalText}`,
        "Meal prep can help you stay consistent with your nutrition goals.",
        "Don't forget to log your meals today.",
        "Balanced nutrition fuels your fitness journey."
      ];
    default:
      return [
        "Don't forget about your fitness goal today!",
        `Remember your goal: ${goalText}`,
        "Small daily actions lead to big results.",
        "Stay consistent with your goals!",
        "You've got this! Keep pushing toward your goals."
      ];
  }
};

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  notifications: [],
  addNotification: (notification) => set((state) => ({ notifications: [...state.notifications, notification] })),
  markAsRead: (id) => set((state) => ({ notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),
  clearNotifications: () => set({ notifications: [] }),
}));

// Initialize notification handler
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export const useNotificationStoreState = create<NotificationState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      workoutReminders: defaultWorkoutReminder,
      mealReminders: defaultMealReminder,
      waterReminders: defaultWaterReminder,
      stepReminders: defaultStepReminder,
      goalReminderIds: {},
      
      updateSettings: (settings) => set({ settings }),
      
      updateWorkoutReminder: (reminder) => set({ workoutReminders: reminder }),
      
      updateMealReminder: (reminder) => set({ mealReminders: reminder }),
      
      updateWaterReminder: (reminder) => set({ waterReminders: reminder }),
      
      updateStepReminder: (reminder) => set({ stepReminders: reminder }),
      
      scheduleWorkoutNotification: async (workoutId, workoutName, scheduledTime) => {
        if (Platform.OS === "web" || !get().settings.enabled || !get().settings.workoutReminders) {
          return null;
        }
        
        try {
          const { minutesBefore } = get().workoutReminders;
          
          // Calculate notification time (X minutes before workout)
          const notificationTime = new Date(scheduledTime);
          notificationTime.setMinutes(notificationTime.getMinutes() - minutesBefore);
          
          // Don't schedule if the time is in the past
          if (notificationTime <= new Date()) {
            return null;
          }
          
          // Calculate seconds from now until notification time
          const secondsFromNow = Math.floor((notificationTime.getTime() - Date.now()) / 1000);
          
          // Schedule the notification with correct trigger format
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: "Workout Reminder",
              body: `Your ${workoutName} workout is starting in ${minutesBefore} minutes`,
              data: { workoutId },
            },
            trigger: {
              type: "timeInterval",
              seconds: secondsFromNow > 0 ? secondsFromNow : 1,
              repeats: false
            },
          });
          
          return notificationId;
        } catch (error) {
          console.error("Failed to schedule workout notification:", error);
          return null;
        }
      },
      
      cancelWorkoutNotification: async (notificationId) => {
        if (Platform.OS === "web") return;
        
        try {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
        } catch (error) {
          console.error("Failed to cancel notification:", error);
        }
      },
      
      scheduleMealNotification: async (mealType, time) => {
        if (Platform.OS === "web" || !get().settings.enabled || !get().settings.mealReminders) {
          return null;
        }
        
        try {
          // Don't schedule if the time is in the past
          if (time <= new Date()) {
            return null;
          }
          
          // Calculate seconds from now until notification time
          const secondsFromNow = Math.floor((time.getTime() - Date.now()) / 1000);
          
          // Schedule the notification with correct trigger format
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: "Meal Reminder",
              body: `Time for ${mealType}! Don't forget to log your meal.`,
              data: { mealType },
            },
            trigger: {
              type: "timeInterval",
              seconds: secondsFromNow > 0 ? secondsFromNow : 1,
              repeats: false
            },
          });
          
          return notificationId;
        } catch (error) {
          console.error("Failed to schedule meal notification:", error);
          return null;
        }
      },
      
      scheduleWaterNotification: async () => {
        if (Platform.OS === "web" || !get().settings.enabled || !get().settings.waterReminders) {
          return;
        }
        
        try {
          const { specificTimes, startTime, endTime, interval } = get().waterReminders;
          
          // Cancel existing notifications
          await Notifications.cancelAllScheduledNotificationsAsync();
          
          // If specific times are provided, use those
          if (specificTimes && specificTimes.length > 0) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            for (const timeStr of specificTimes) {
              const [hours, minutes] = timeStr.split(':').map(Number);
              const reminderTime = new Date(today);
              reminderTime.setHours(hours, minutes, 0, 0);
              
              // Skip if time has already passed today
              if (reminderTime <= now) continue;
              
              const secondsFromNow = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);
              
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "Hydration Reminder",
                  body: "Time to drink some water! Stay hydrated.",
                },
                trigger: { 
                  type: "timeInterval",
                  seconds: secondsFromNow,
                  repeats: false
                },
              });
            }
          } else {
            // Use interval-based reminders
            // Parse start and end times
            const [startHour, startMinute] = startTime.split(":").map(Number);
            const [endHour, endMinute] = endTime.split(":").map(Number);
            
            // Calculate how many notifications to schedule
            const startDate = new Date();
            startDate.setHours(startHour, startMinute, 0, 0);
            
            const endDate = new Date();
            endDate.setHours(endHour, endMinute, 0, 0);
            
            // If end time is earlier than start time, assume it's for the next day
            if (endDate <= startDate) {
              endDate.setDate(endDate.getDate() + 1);
            }
            
            const now = new Date();
            
            // Don't schedule if current time is past end time
            if (now >= endDate) {
              return;
            }
            
            // Adjust start time if current time is past start time
            const actualStartTime = now > startDate ? now : startDate;
            
            // Calculate time difference in minutes
            const timeDiffMinutes = (endDate.getTime() - actualStartTime.getTime()) / (1000 * 60);
            
            // Calculate number of notifications
            const numNotifications = Math.floor(timeDiffMinutes / interval);
            
            // Schedule new notifications
            for (let i = 0; i < numNotifications; i++) {
              const notificationTime = new Date(actualStartTime);
              notificationTime.setMinutes(notificationTime.getMinutes() + (i + 1) * interval);
              
              const secondsFromNow = Math.floor((notificationTime.getTime() - Date.now()) / 1000);
              
              if (secondsFromNow <= 0) continue;
              
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "Hydration Reminder",
                  body: "Time to drink some water! Stay hydrated.",
                },
                trigger: { 
                  type: "timeInterval",
                  seconds: secondsFromNow,
                  repeats: false
                },
              });
            }
          }
        } catch (error) {
          console.error("Failed to schedule water notifications:", error);
        }
      },
      
      scheduleStepNotification: async (goalSteps) => {
        if (Platform.OS === "web" || !get().settings.enabled || !get().settings.stepReminders) {
          return null;
        }
        
        try {
          const { reminderTime, goalPercentage } = get().stepReminders;
          
          // Parse reminder time
          const [hour, minute] = reminderTime.split(":").map(Number);
          
          // Set notification time
          const notificationTime = new Date();
          notificationTime.setHours(hour, minute, 0, 0);
          
          // If the time has already passed today, schedule for tomorrow
          if (notificationTime <= new Date()) {
            notificationTime.setDate(notificationTime.getDate() + 1);
          }
          
          const secondsFromNow = Math.floor((notificationTime.getTime() - Date.now()) / 1000);
          
          if (secondsFromNow <= 0) return null;
          
          // Schedule the notification with correct trigger format
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: "Step Goal Reminder",
              body: `You're at ${goalPercentage}% of your daily step goal. Take a walk to reach your target of ${goalSteps} steps!`,
            },
            trigger: { 
              type: "timeInterval",
              seconds: secondsFromNow,
              repeats: false
            },
          });
          
          return notificationId;
        } catch (error) {
          console.error("Failed to schedule step notification:", error);
          return null;
        }
      },
      
      // Goal reminder functions
      scheduleGoalReminder: async (goalId, frequency, customHours = [9, 12, 15, 18]) => {
        if (Platform.OS === "web" || !get().settings.enabled) {
          return;
        }
        
        try {
          // First cancel any existing reminders for this goal
          await get().cancelGoalReminder(goalId);
          
          const notificationIds: string[] = [];
          
          // Get current date
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          // Get goal details to customize reminder messages
          const goal = await AsyncStorage.getItem('ai-storage');
          let goalText = "your fitness goal";
          let goalCategory = "other";
          let waterBottleSize: number | undefined;
          
          if (goal) {
            const parsedGoal = JSON.parse(goal);
            const goalObj = parsedGoal?.state?.goals?.find((g: any) => g.id === goalId);
            if (goalObj) {
              goalText = goalObj.text;
              goalCategory = goalObj.category || "other";
              waterBottleSize = goalObj.waterBottleSize;
            }
          }
          
          // Get reminder messages based on goal category
          const reminderMessages = getReminderMessages(goalCategory, goalText);
          
          // For water goals with bottle size, add specific reminders
          if (goalCategory === 'water' && waterBottleSize) {
            // Extract target water amount from goal text (assuming it's in liters)
            const matches = goalText.match(/(\d+(\.\d+)?)\s*(l|liter|liters)/i);
            if (matches && matches[1]) {
              const targetLiters = parseFloat(matches[1]);
              const bottleSize = waterBottleSize;
              const bottlesNeeded = Math.ceil(targetLiters / bottleSize);
              
              // Add bottle-specific messages
              reminderMessages.push(`Remember to drink your water! You need ${bottlesNeeded} ${bottlesNeeded !== 1 ? 'bottles' : 'bottle'} today.`);
              reminderMessages.push(`Have you had a bottle of water in the last hour? Stay on track with your hydration goal!`);
              reminderMessages.push(`Hydration check! Each ${bottleSize}L bottle gets you closer to your daily goal.`);
              reminderMessages.push(`How many bottles have you had so far? Your goal is ${bottlesNeeded} ${bottlesNeeded !== 1 ? 'bottles' : 'bottle'} today.`);
            }
          }
          
          // Schedule based on frequency
          if (frequency === "hourly") {
            // For water goals, use specific times for better user experience
            if (goalCategory === 'water') {
              // Use specific times from water reminder settings if available
              const { specificTimes } = get().waterReminders;
              
              if (specificTimes && specificTimes.length > 0) {
                // Use configured specific times
                for (const timeStr of specificTimes) {
                  const [hour, minute] = timeStr.split(':').map(Number);
                  const reminderTime = new Date(today);
                  reminderTime.setHours(hour, minute, 0, 0);
                  
                  // Skip if time is in the past
                  if (reminderTime <= now) continue;
                  
                  const secondsFromNow = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);
                  
                  // Get a random message from the category-specific messages
                  const randomMessage = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
                  
                  const notificationId = await Notifications.scheduleNotificationAsync({
                    content: {
                      title: "Water Reminder",
                      body: randomMessage,
                      data: { goalId, type: goalCategory },
                    },
                    trigger: {
                      type: "timeInterval",
                      seconds: secondsFromNow,
                      repeats: false
                    },
                  });
                  
                  notificationIds.push(notificationId);
                }
              } else {
                // Default water reminder times if none configured
                const waterReminderHours = [10, 12, 14, 16, 18, 20];
                
                for (const hour of waterReminderHours) {
                  const reminderTime = new Date(today);
                  reminderTime.setHours(hour, 0, 0, 0);
                  
                  // Skip if time is in the past
                  if (reminderTime <= now) continue;
                  
                  const secondsFromNow = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);
                  
                  // Get a random message from the category-specific messages
                  const randomMessage = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
                  
                  const notificationId = await Notifications.scheduleNotificationAsync({
                    content: {
                      title: "Water Reminder",
                      body: randomMessage,
                      data: { goalId, type: goalCategory },
                    },
                    trigger: {
                      type: "timeInterval",
                      seconds: secondsFromNow,
                      repeats: false
                    },
                  });
                  
                  notificationIds.push(notificationId);
                }
              }
            } else {
              // For non-water goals, use regular hourly reminders
              // Schedule reminders every hour from 8am to 8pm
              for (let hour = 8; hour <= 20; hour++) {
                const reminderTime = new Date(today);
                reminderTime.setHours(hour, 0, 0, 0);
                
                // Skip if time is in the past
                if (reminderTime <= now) continue;
                
                const secondsFromNow = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);
                
                // Get a random message from the category-specific messages
                const randomMessage = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
                
                const notificationId = await Notifications.scheduleNotificationAsync({
                  content: {
                    title: "Goal Reminder",
                    body: randomMessage,
                    data: { goalId, type: goalCategory },
                  },
                  trigger: {
                    type: "timeInterval",
                    seconds: secondsFromNow,
                    repeats: false
                  },
                });
                
                notificationIds.push(notificationId);
              }
            }
          } else if (frequency === "daily") {
            // Schedule a reminder at 9am, 12pm, and 6pm
            const reminderHours = [9, 12, 18];
            
            for (const hour of reminderHours) {
              const reminderTime = new Date(today);
              reminderTime.setHours(hour, 0, 0, 0);
              
              // Skip if time is in the past
              if (reminderTime <= now) continue;
              
              const secondsFromNow = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);
              
              // Get a random message from the category-specific messages
              const randomMessage = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
              
              const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                  title: "Goal Reminder",
                  body: randomMessage,
                  data: { goalId, type: goalCategory },
                },
                trigger: {
                  type: "timeInterval",
                  seconds: secondsFromNow,
                  repeats: false
                },
              });
              
              notificationIds.push(notificationId);
            }
          } else if (frequency === "custom" && customHours.length > 0) {
            // Schedule at custom hours
            for (const hour of customHours) {
              const reminderTime = new Date(today);
              reminderTime.setHours(hour, 0, 0, 0);
              
              // Skip if time is in the past
              if (reminderTime <= now) continue;
              
              const secondsFromNow = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);
              
              // Get a random message from the category-specific messages
              const randomMessage = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
              
              const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                  title: "Goal Reminder",
                  body: randomMessage,
                  data: { goalId, type: goalCategory },
                },
                trigger: {
                  type: "timeInterval",
                  seconds: secondsFromNow,
                  repeats: false
                },
              });
              
              notificationIds.push(notificationId);
            }
          }
          
          // Store the notification IDs for this goal
          set(state => ({
            goalReminderIds: {
              ...state.goalReminderIds,
              [goalId]: notificationIds
            }
          }));
          
        } catch (error) {
          console.error("Failed to schedule goal reminders:", error);
        }
      },
      
      cancelGoalReminder: async (goalId) => {
        if (Platform.OS === "web") return;
        
        try {
          const { goalReminderIds } = get();
          const notificationIds = goalReminderIds[goalId] || [];
          
          // Cancel each notification
          for (const notificationId of notificationIds) {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
          }
          
          // Remove the goal's notification IDs from state
          set(state => {
            const newGoalReminderIds = { ...state.goalReminderIds };
            delete newGoalReminderIds[goalId];
            return { goalReminderIds: newGoalReminderIds };
          });
          
        } catch (error) {
          console.error("Failed to cancel goal reminders:", error);
        }
      },
      
      // New function for long workout notification
      showLongWorkoutNotification: async (workoutName, durationMinutes) => {
        if (Platform.OS === "web" || !get().settings.enabled || !get().settings.longWorkoutAlert) {
          return null;
        }
        
        try {
          // Show an immediate notification
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: "Long Workout Detected",
              body: `Your ${workoutName} workout has been running for ${durationMinutes} minutes. Do you want to end it?`,
              data: { type: "longWorkout", workoutName },
            },
            trigger: null, // Immediate notification
          });
          
          return notificationId;
        } catch (error) {
          console.error("Failed to show long workout notification:", error);
          return null;
        }
      },
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);