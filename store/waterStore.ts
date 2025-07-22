import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/NotificationService';

interface WaterIntake {
  id: string;
  amount: number; // in ml
  timestamp: string;
  date: string; // YYYY-MM-DD format
}

interface WaterGoal {
  dailyGoal: number; // in ml
  createdAt: string;
  updatedAt: string;
}

interface WaterStreak {
  currentStreak: number;
  longestStreak: number;
  lastGoalMet: string; // YYYY-MM-DD format
}

interface WaterStore {
  // State
  waterIntake: WaterIntake[];
  waterGoal: WaterGoal;
  waterStreak: WaterStreak;
  todayIntake: number;
  todayGoal: number;
  
  // Actions
  addWaterIntake: (amount: number) => Promise<void>;
  removeWaterIntake: (id: string) => Promise<void>;
  setDailyGoal: (goal: number) => Promise<void>;
  getTodayIntake: () => number;
  getTodayGoal: () => number;
  getProgressPercentage: () => number;
  checkGoalAchievement: () => Promise<void>;
  updateStreak: () => Promise<void>;
  resetToday: () => void;
  initializeWaterGoal: () => Promise<void>;
}

const defaultWaterGoal: WaterGoal = {
  dailyGoal: 2000, // 2L default
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const defaultWaterStreak: WaterStreak = {
  currentStreak: 0,
  longestStreak: 0,
  lastGoalMet: '',
};

export const useWaterStore = create<WaterStore>()(
  persist(
    (set, get) => ({
      // Initial state
      waterIntake: [],
      waterGoal: defaultWaterGoal,
      waterStreak: defaultWaterStreak,
      todayIntake: 0,
      todayGoal: 2000,

      // Add water intake
      addWaterIntake: async (amount: number) => {
        const newIntake: WaterIntake = {
          id: Date.now().toString(),
          amount,
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        };

        set((state) => ({
          waterIntake: [...state.waterIntake, newIntake],
          todayIntake: state.todayIntake + amount,
        }));

        // Check if goal is achieved
        await get().checkGoalAchievement();
        
        // Update streak
        await get().updateStreak();
      },

      // Remove water intake
      removeWaterIntake: async (id: string) => {
        const intake = get().waterIntake.find(item => item.id === id);
        if (!intake) return;

        set((state) => ({
          waterIntake: state.waterIntake.filter(item => item.id !== id),
          todayIntake: state.todayIntake - intake.amount,
        }));

        // Recheck goal achievement
        await get().checkGoalAchievement();
      },

      // Set daily water goal
      setDailyGoal: async (goal: number) => {
        const updatedGoal: WaterGoal = {
          ...get().waterGoal,
          dailyGoal: goal,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          waterGoal: updatedGoal,
          todayGoal: goal,
        }));

        // Update notification service with new goal
        await NotificationService.updateWaterGoal(goal);
      },

      // Get today's water intake
      getTodayIntake: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().waterIntake
          .filter(item => item.date === today)
          .reduce((total, item) => total + item.amount, 0);
      },

      // Get today's goal
      getTodayGoal: () => {
        return get().waterGoal.dailyGoal;
      },

      // Get progress percentage
      getProgressPercentage: () => {
        const intake = get().getTodayIntake();
        const goal = get().getTodayGoal();
        return Math.min(100, Math.round((intake / goal) * 100));
      },

      // Check if goal is achieved
      checkGoalAchievement: async () => {
        const intake = get().getTodayIntake();
        const goal = get().getTodayGoal();
        const percentage = get().getProgressPercentage();

        // Send achievement notification at key milestones
        if (percentage >= 100 && percentage < 110) {
          // Goal achieved
          await NotificationService.scheduleWaterGoalAchievementNotification(goal, intake);
        } else if (percentage >= 80 && percentage < 100) {
          // Almost there
          await NotificationService.scheduleWaterGoalAchievementNotification(goal, intake);
        } else if (percentage >= 50 && percentage < 80) {
          // Halfway there
          await NotificationService.scheduleWaterGoalAchievementNotification(goal, intake);
        }
      },

      // Update streak
      updateStreak: async () => {
        const today = new Date().toISOString().split('T')[0];
        const intake = get().getTodayIntake();
        const goal = get().getTodayGoal();
        const state = get();

        if (intake >= goal) {
          // Goal met today
          if (state.waterStreak.lastGoalMet !== today) {
            const newStreak = state.waterStreak.currentStreak + 1;
            const longestStreak = Math.max(newStreak, state.waterStreak.longestStreak);

            set((state) => ({
              waterStreak: {
                ...state.waterStreak,
                currentStreak: newStreak,
                longestStreak,
                lastGoalMet: today,
              },
            }));

            // Send streak notification for milestones
            if (newStreak >= 3 && newStreak <= 7) {
              await NotificationService.scheduleWaterStreakNotification(newStreak);
            }
          }
        } else {
          // Goal not met today, reset streak if it's a new day
          if (state.waterStreak.lastGoalMet !== today && state.waterStreak.lastGoalMet !== '') {
            set((state) => ({
              waterStreak: {
                ...state.waterStreak,
                currentStreak: 0,
                lastGoalMet: '',
              },
            }));
          }
        }
      },

      // Reset today's intake (for testing)
      resetToday: () => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          waterIntake: state.waterIntake.filter(item => item.date !== today),
          todayIntake: 0,
        }));
      },

      // Initialize water goal from notification service
      initializeWaterGoal: async () => {
        try {
          const savedGoal = await NotificationService.getWaterGoal();
          const currentGoal = get().waterGoal.dailyGoal;

          if (savedGoal !== currentGoal) {
            set((state) => ({
              waterGoal: {
                ...state.waterGoal,
                dailyGoal: savedGoal,
                updatedAt: new Date().toISOString(),
              },
              todayGoal: savedGoal,
            }));
          }

          // Schedule smart water reminders
          await NotificationService.scheduleSmartWaterReminders(savedGoal);
        } catch (error) {
          console.error('Error initializing water goal:', error);
        }
      },
    }),
    {
      name: 'water-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        waterIntake: state.waterIntake,
        waterGoal: state.waterGoal,
        waterStreak: state.waterStreak,
      }),
    }
  )
); 