import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWorkoutStore } from "./workoutStore";
import { useHealthStore } from "./healthStore";
import { useMacroStore } from "./macroStore";

export type AchievementCategory = 
  | "workout" 
  | "nutrition" 
  | "weight" 
  | "steps" 
  | "streak" 
  | "special";

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  tier: AchievementTier;
  progress: number;
  target: number;
  completed: boolean;
  dateCompleted?: string;
  points: number;
  fitnessLevel?: FitnessLevel[]; // Which fitness levels this achievement is appropriate for
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  target: number;
  progress: number;
  completed: boolean;
  category: AchievementCategory;
  points: number;
  reward?: string;
  difficulty?: "easy" | "medium" | "hard";
  fitnessLevel?: FitnessLevel[]; // Which fitness levels this challenge is appropriate for
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string;
  streakDates: string[];
}

export interface Level {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  unlocked: boolean;
  dateUnlocked?: string;
  used: boolean;
  dateUsed?: string;
  category: "nutrition" | "workout" | "rest" | "special";
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  date: string;
  points: number;
  category: AchievementCategory;
  fitnessLevel?: FitnessLevel[]; // Which fitness levels this quest is appropriate for
}

export interface ProgressionTracker {
  currentFitnessLevel: FitnessLevel;
  workoutsCompleted: number;
  streakRecord: number;
  totalPoints: number;
  timeAtCurrentLevel: number; // days at current level
  readyForProgression: boolean;
  lastProgressionCheck: string;
  progressionCriteria: {
    workouts: number;
    streak: number;
    points: number;
    timeRequired: number; // minimum days at current level
  };
}

interface GamificationState {
  // Core state
  gamificationEnabled: boolean;
  onboardingCompleted: boolean;
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  challenges: Challenge[];
  activeChallenge: Challenge | null;
  streak: Streak;
  points: number;
  level: number;
  rewards: Reward[];
  dailyQuests: DailyQuest[];
  recentlyUnlocked: Achievement[];
  showCelebration: boolean;
  celebrationAchievement: Achievement | null;
  showChallengeCelebration: boolean;
  celebrationChallenge: Challenge | null;
  progressionTracker: ProgressionTracker;
  
  // Actions
  toggleGamification: (enabled: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  initializeAchievements: () => void;
  checkAchievements: () => void;
  unlockAchievement: (achievementId: string) => void;
  updateAchievementProgress: (achievementId: string, progress: number) => void;
  
  startChallenge: (challenge: Challenge) => void;
  completeChallenge: (challengeId: string) => void;
  updateChallengeProgress: (challengeId: string, progress: number) => void;
  
  updateStreak: () => void;
  resetStreak: () => void;
  
  addPoints: (points: number) => void;
  calculateLevel: (points: number) => number;
  
  unlockReward: (rewardId: string) => void;
  useReward: (rewardId: string) => void;
  
  generateDailyQuests: () => void;
  completeDailyQuest: (questId: string) => void;
  checkAndAutoCompleteQuests: () => void;
  resetDailyQuests: () => void;
  
  clearCelebration: () => void;
  clearChallengeCelebration: () => void;
  
  // Getters
  getAchievementsByCategory: (category: AchievementCategory) => Achievement[];
  getRecentAchievements: (count: number) => Achievement[];
  getNextAchievements: (count: number) => Achievement[];
  getCurrentLevel: () => Level;
  getNextLevel: () => Level;
  getLevelProgress: () => number;
  getAvailableRewards: () => Reward[];
  getActiveDailyQuests: () => DailyQuest[];
  getStreakInfo: () => { 
    currentStreak: number; 
    longestStreak: number;
    nextMilestone: number;
    daysToNextReward: number;
  };
  
  // New fitness level and progression methods
  getUserFitnessLevel: () => FitnessLevel;
  getAppropriateAchievements: () => Achievement[];
  getAppropriateChallenges: () => Challenge[];
  getAppropriateDailyQuests: () => DailyQuest[];
  checkProgressionEligibility: () => boolean;
  suggestProgression: () => { 
    ready: boolean; 
    nextLevel: FitnessLevel; 
    criteria: string[];
    completedCriteria: string[];
  };
  updateProgressionTracker: () => void;
  acceptProgression: () => void;
  generateBeginnerFriendlyQuests: () => DailyQuest[];
}

// Define levels
const levels: Level[] = [
  { level: 1, title: "Beginner", minPoints: 0, maxPoints: 99, icon: "🌱" },
  { level: 2, title: "Rookie", minPoints: 100, maxPoints: 249, icon: "🔰" },
  { level: 3, title: "Enthusiast", minPoints: 250, maxPoints: 499, icon: "⭐" },
  { level: 4, title: "Athlete", minPoints: 500, maxPoints: 999, icon: "🏃" },
  { level: 5, title: "Pro", minPoints: 1000, maxPoints: 1999, icon: "🏆" },
  { level: 6, title: "Champion", minPoints: 2000, maxPoints: 3499, icon: "🥇" },
  { level: 7, title: "Elite", minPoints: 3500, maxPoints: 4999, icon: "💪" },
  { level: 8, title: "Master", minPoints: 5000, maxPoints: 7499, icon: "🌟" },
  { level: 9, title: "Legend", minPoints: 7500, maxPoints: 9999, icon: "👑" },
  { level: 10, title: "Fitness Guru", minPoints: 10000, maxPoints: Infinity, icon: "🔱" },
];

// Define default achievements
const defaultAchievements: Achievement[] = [
  // Workout achievements
  {
    id: "workout-first",
    title: "First Step",
    description: "Complete your first workout",
    category: "workout",
    icon: "🏋️",
    tier: "bronze",
    progress: 0,
    target: 1,
    completed: false,
    points: 10
  },
  {
    id: "workout-5",
    title: "Getting Started",
    description: "Complete 5 workouts",
    category: "workout",
    icon: "🏋️",
    tier: "bronze",
    progress: 0,
    target: 5,
    completed: false,
    points: 25
  },
  {
    id: "workout-10",
    title: "Dedicated",
    description: "Complete 10 workouts",
    category: "workout",
    icon: "🏋️",
    tier: "silver",
    progress: 0,
    target: 10,
    completed: false,
    points: 50
  },
  {
    id: "workout-25",
    title: "Fitness Enthusiast",
    description: "Complete 25 workouts",
    category: "workout",
    icon: "🏋️",
    tier: "gold",
    progress: 0,
    target: 25,
    completed: false,
    points: 100
  },
  {
    id: "workout-50",
    title: "Fitness Addict",
    description: "Complete 50 workouts",
    category: "workout",
    icon: "🏋️",
    tier: "platinum",
    progress: 0,
    target: 50,
    completed: false,
    points: 200
  },
  {
    id: "workout-100",
    title: "Century Club",
    description: "Complete 100 workouts",
    category: "workout",
    icon: "🏋️",
    tier: "diamond",
    progress: 0,
    target: 100,
    completed: false,
    points: 500
  },
  {
    id: "workout-200",
    title: "Double Century",
    description: "Complete 200 workouts",
    category: "workout",
    icon: "🏋️‍♂️",
    tier: "diamond",
    progress: 0,
    target: 200,
    completed: false,
    points: 1000
  },
  {
    id: "workout-365",
    title: "Year-Round Athlete",
    description: "Complete 365 workouts",
    category: "workout",
    icon: "📅",
    tier: "diamond",
    progress: 0,
    target: 365,
    completed: false,
    points: 1500
  },
  {
    id: "workout-strength-10",
    title: "Strength Builder",
    description: "Complete 10 strength workouts",
    category: "workout",
    icon: "💪",
    tier: "bronze",
    progress: 0,
    target: 10,
    completed: false,
    points: 50
  },
  {
    id: "workout-strength-50",
    title: "Strength Master",
    description: "Complete 50 strength workouts",
    category: "workout",
    icon: "💪",
    tier: "gold",
    progress: 0,
    target: 50,
    completed: false,
    points: 200
  },
  {
    id: "workout-cardio-10",
    title: "Cardio Starter",
    description: "Complete 10 cardio workouts",
    category: "workout",
    icon: "🏃‍♀️",
    tier: "bronze",
    progress: 0,
    target: 10,
    completed: false,
    points: 50
  },
  {
    id: "workout-cardio-50",
    title: "Cardio King",
    description: "Complete 50 cardio workouts",
    category: "workout",
    icon: "🏃‍♀️",
    tier: "gold",
    progress: 0,
    target: 50,
    completed: false,
    points: 200
  },
  {
    id: "workout-flexibility-10",
    title: "Flexibility Focus",
    description: "Complete 10 flexibility workouts",
    category: "workout",
    icon: "🧘‍♀️",
    tier: "bronze",
    progress: 0,
    target: 10,
    completed: false,
    points: 50
  },
  {
    id: "workout-flexibility-30",
    title: "Flexibility Master",
    description: "Complete 30 flexibility workouts",
    category: "workout",
    icon: "🧘‍♀️",
    tier: "gold",
    progress: 0,
    target: 30,
    completed: false,
    points: 150
  },
  {
    id: "workout-duration-30",
    title: "Half Hour Hero",
    description: "Complete a workout lasting at least 30 minutes",
    category: "workout",
    icon: "⏱️",
    tier: "bronze",
    progress: 0,
    target: 1,
    completed: false,
    points: 15
  },
  {
    id: "workout-duration-60",
    title: "Hour of Power",
    description: "Complete a workout lasting at least 60 minutes",
    category: "workout",
    icon: "⏱️",
    tier: "silver",
    progress: 0,
    target: 1,
    completed: false,
    points: 30
  },
  {
    id: "workout-duration-90",
    title: "Endurance Champion",
    description: "Complete a workout lasting at least 90 minutes",
    category: "workout",
    icon: "⏱️",
    tier: "gold",
    progress: 0,
    target: 1,
    completed: false,
    points: 60
  },
  {
    id: "workout-variety-5",
    title: "Variety Seeker",
    description: "Complete 5 different types of workouts",
    category: "workout",
    icon: "🔄",
    tier: "silver",
    progress: 0,
    target: 5,
    completed: false,
    points: 75
  },
  {
    id: "workout-variety-10",
    title: "Jack of All Trades",
    description: "Complete 10 different types of workouts",
    category: "workout",
    icon: "🔄",
    tier: "gold",
    progress: 0,
    target: 10,
    completed: false,
    points: 150
  },
  {
    id: "workout-early-bird",
    title: "Early Bird",
    description: "Complete 5 workouts before 8 AM",
    category: "workout",
    icon: "🌅",
    tier: "silver",
    progress: 0,
    target: 5,
    completed: false,
    points: 75
  },
  {
    id: "workout-night-owl",
    title: "Night Owl",
    description: "Complete 5 workouts after 8 PM",
    category: "workout",
    icon: "🌙",
    tier: "silver",
    progress: 0,
    target: 5,
    completed: false,
    points: 75
  },
  {
    id: "workout-weekend-warrior",
    title: "Weekend Warrior",
    description: "Complete 10 workouts on weekends",
    category: "workout",
    icon: "📅",
    tier: "silver",
    progress: 0,
    target: 10,
    completed: false,
    points: 100
  },
  
  // Streak achievements
  {
    id: "streak-3",
    title: "Habit Forming",
    description: "Maintain a 3-day workout streak",
    category: "streak",
    icon: "🔥",
    tier: "bronze",
    progress: 0,
    target: 3,
    completed: false,
    points: 30
  },
  {
    id: "streak-7",
    title: "Week Warrior",
    description: "Maintain a 7-day workout streak",
    category: "streak",
    icon: "🔥",
    tier: "silver",
    progress: 0,
    target: 7,
    completed: false,
    points: 70
  },
  {
    id: "streak-14",
    title: "Consistent Athlete",
    description: "Maintain a 14-day workout streak",
    category: "streak",
    icon: "🔥",
    tier: "gold",
    progress: 0,
    target: 14,
    completed: false,
    points: 140
  },
  {
    id: "streak-30",
    title: "Unstoppable",
    description: "Maintain a 30-day workout streak",
    category: "streak",
    icon: "🔥",
    tier: "platinum",
    progress: 0,
    target: 30,
    completed: false,
    points: 300
  },
  {
    id: "streak-45",
    title: "Dedication Personified",
    description: "Maintain a 45-day workout streak",
    category: "streak",
    icon: "🔥",
    tier: "platinum",
    progress: 0,
    target: 45,
    completed: false,
    points: 450
  },
  {
    id: "streak-60",
    title: "Habit Master",
    description: "Maintain a 60-day workout streak",
    category: "streak",
    icon: "🔥",
    tier: "diamond",
    progress: 0,
    target: 60,
    completed: false,
    points: 600
  },
  {
    id: "streak-90",
    title: "Quarterly Champion",
    description: "Maintain a 90-day workout streak",
    category: "streak",
    icon: "🔥",
    tier: "diamond",
    progress: 0,
    target: 90,
    completed: false,
    points: 900
  },
  {
    id: "streak-180",
    title: "Half-Year Hero",
    description: "Maintain a 180-day workout streak",
    category: "streak",
    icon: "🔥",
    tier: "diamond",
    progress: 0,
    target: 180,
    completed: false,
    points: 1800
  },
  {
    id: "streak-365",
    title: "Year of Dedication",
    description: "Maintain a 365-day workout streak",
    category: "streak",
    icon: "🔥",
    tier: "diamond",
    progress: 0,
    target: 365,
    completed: false,
    points: 3650
  },
  {
    id: "streak-comeback",
    title: "Comeback Kid",
    description: "Resume working out after a 7+ day break",
    category: "streak",
    icon: "🔄",
    tier: "silver",
    progress: 0,
    target: 1,
    completed: false,
    points: 50
  },
  {
    id: "streak-3-weeks",
    title: "3-Week Consistency",
    description: "Work out at least 3 times per week for 4 consecutive weeks",
    category: "streak",
    icon: "📊",
    tier: "gold",
    progress: 0,
    target: 4,
    completed: false,
    points: 200
  },
  
  // Weight achievements
  {
    id: "weight-track-7",
    title: "Weight Watcher",
    description: "Track your weight for 7 consecutive days",
    category: "weight",
    icon: "⚖️",
    tier: "bronze",
    progress: 0,
    target: 7,
    completed: false,
    points: 35
  },
  {
    id: "weight-loss-1",
    title: "Progress Begins",
    description: "Lose your first kg",
    category: "weight",
    icon: "📉",
    tier: "bronze",
    progress: 0,
    target: 1,
    completed: false,
    points: 50
  },
  {
    id: "weight-loss-5",
    title: "Visible Progress",
    description: "Lose 5 kg",
    category: "weight",
    icon: "📉",
    tier: "silver",
    progress: 0,
    target: 5,
    completed: false,
    points: 100
  },
  {
    id: "weight-loss-10",
    title: "Transformation",
    description: "Lose 10 kg",
    category: "weight",
    icon: "📉",
    tier: "gold",
    progress: 0,
    target: 10,
    completed: false,
    points: 200
  },
  {
    id: "weight-loss-15",
    title: "Major Transformation",
    description: "Lose 15 kg",
    category: "weight",
    icon: "📉",
    tier: "platinum",
    progress: 0,
    target: 15,
    completed: false,
    points: 300
  },
  {
    id: "weight-loss-20",
    title: "Life-Changing Progress",
    description: "Lose 20 kg",
    category: "weight",
    icon: "📉",
    tier: "diamond",
    progress: 0,
    target: 20,
    completed: false,
    points: 500
  },
  {
    id: "weight-track-30",
    title: "Consistent Tracker",
    description: "Track your weight for 30 consecutive days",
    category: "weight",
    icon: "⚖️",
    tier: "gold",
    progress: 0,
    target: 30,
    completed: false,
    points: 150
  },
  {
    id: "weight-track-90",
    title: "Weight Tracking Pro",
    description: "Track your weight for 90 consecutive days",
    category: "weight",
    icon: "⚖️",
    tier: "platinum",
    progress: 0,
    target: 90,
    completed: false,
    points: 300
  },
  {
    id: "weight-goal-reached",
    title: "Goal Achieved",
    description: "Reach your target weight goal",
    category: "weight",
    icon: "🎯",
    tier: "diamond",
    progress: 0,
    target: 1,
    completed: false,
    points: 500
  },
  {
    id: "weight-maintain-30",
    title: "Maintenance Master",
    description: "Maintain your goal weight for 30 days",
    category: "weight",
    icon: "📊",
    tier: "platinum",
    progress: 0,
    target: 30,
    completed: false,
    points: 300
  },
  {
    id: "weight-maintain-90",
    title: "Lifestyle Change",
    description: "Maintain your goal weight for 90 days",
    category: "weight",
    icon: "📊",
    tier: "diamond",
    progress: 0,
    target: 90,
    completed: false,
    points: 600
  },
  {
    id: "weight-bmi-healthy",
    title: "Healthy Range",
    description: "Achieve a healthy BMI range",
    category: "weight",
    icon: "💚",
    tier: "gold",
    progress: 0,
    target: 1,
    completed: false,
    points: 250
  },
  
  // Steps achievements
  {
    id: "steps-5000",
    title: "Step Starter",
    description: "Walk 5,000 steps in a day",
    category: "steps",
    icon: "👣",
    tier: "bronze",
    progress: 0,
    target: 5000,
    completed: false,
    points: 20
  },
  {
    id: "steps-10000",
    title: "Step Master",
    description: "Walk 10,000 steps in a day",
    category: "steps",
    icon: "👣",
    tier: "silver",
    progress: 0,
    target: 10000,
    completed: false,
    points: 40
  },
  {
    id: "steps-15000",
    title: "Step Champion",
    description: "Walk 15,000 steps in a day",
    category: "steps",
    icon: "👣",
    tier: "gold",
    progress: 0,
    target: 15000,
    completed: false,
    points: 60
  },
  {
    id: "steps-100k",
    title: "Step Enthusiast",
    description: "Walk 100,000 steps in a week",
    category: "steps",
    icon: "👣",
    tier: "platinum",
    progress: 0,
    target: 100000,
    completed: false,
    points: 150
  },
  {
    id: "steps-20000",
    title: "Step Legend",
    description: "Walk 20,000 steps in a day",
    category: "steps",
    icon: "👣",
    tier: "platinum",
    progress: 0,
    target: 20000,
    completed: false,
    points: 100
  },
  {
    id: "steps-25000",
    title: "Step Superstar",
    description: "Walk 25,000 steps in a day",
    category: "steps",
    icon: "👣",
    tier: "diamond",
    progress: 0,
    target: 25000,
    completed: false,
    points: 150
  },
  {
    id: "steps-30000",
    title: "Walking Machine",
    description: "Walk 30,000 steps in a day",
    category: "steps",
    icon: "👣",
    tier: "diamond",
    progress: 0,
    target: 30000,
    completed: false,
    points: 200
  },
  {
    id: "steps-250k",
    title: "Step Maniac",
    description: "Walk 250,000 steps in a month",
    category: "steps",
    icon: "👣",
    tier: "platinum",
    progress: 0,
    target: 250000,
    completed: false,
    points: 300
  },
  {
    id: "steps-500k",
    title: "Step Millionaire",
    description: "Walk 500,000 steps in a month",
    category: "steps",
    icon: "👣",
    tier: "diamond",
    progress: 0,
    target: 500000,
    completed: false,
    points: 500
  },
  {
    id: "steps-1m",
    title: "Million Step Club",
    description: "Walk 1,000,000 steps total",
    category: "steps",
    icon: "👣",
    tier: "diamond",
    progress: 0,
    target: 1000000,
    completed: false,
    points: 1000
  },
  {
    id: "steps-streak-7",
    title: "Step Streak",
    description: "Walk at least 8,000 steps for 7 consecutive days",
    category: "steps",
    icon: "📊",
    tier: "silver",
    progress: 0,
    target: 7,
    completed: false,
    points: 100
  },
  {
    id: "steps-streak-30",
    title: "Step Consistency",
    description: "Walk at least 8,000 steps for 30 consecutive days",
    category: "steps",
    icon: "📊",
    tier: "platinum",
    progress: 0,
    target: 30,
    completed: false,
    points: 300
  },
  {
    id: "steps-weekend-50k",
    title: "Weekend Walker",
    description: "Walk 50,000 steps in a single weekend",
    category: "steps",
    icon: "🏞️",
    tier: "gold",
    progress: 0,
    target: 50000,
    completed: false,
    points: 150
  },
  
  // Nutrition achievements
  {
    id: "nutrition-log-first",
    title: "Nutrition Aware",
    description: "Log your first meal",
    category: "nutrition",
    icon: "🍎",
    tier: "bronze",
    progress: 0,
    target: 1,
    completed: false,
    points: 10
  },
  {
    id: "nutrition-log-week",
    title: "Nutrition Tracker",
    description: "Log all meals for 7 consecutive days",
    category: "nutrition",
    icon: "🍎",
    tier: "silver",
    progress: 0,
    target: 7,
    completed: false,
    points: 70
  },
  {
    id: "nutrition-protein-goal",
    title: "Protein Pro",
    description: "Meet your protein goal for 5 consecutive days",
    category: "nutrition",
    icon: "🥩",
    tier: "gold",
    progress: 0,
    target: 5,
    completed: false,
    points: 50
  },
  {
    id: "nutrition-log-month",
    title: "Nutrition Expert",
    description: "Log all meals for 30 consecutive days",
    category: "nutrition",
    icon: "🍎",
    tier: "platinum",
    progress: 0,
    target: 30,
    completed: false,
    points: 300
  },
  {
    id: "nutrition-balanced-10",
    title: "Balanced Diet",
    description: "Maintain balanced macros for 10 days",
    category: "nutrition",
    icon: "⚖️",
    tier: "gold",
    progress: 0,
    target: 10,
    completed: false,
    points: 100
  },
  {
    id: "nutrition-water-2l",
    title: "Hydration Starter",
    description: "Drink 2L of water daily for 7 days",
    category: "nutrition",
    icon: "💧",
    tier: "silver",
    progress: 0,
    target: 7,
    completed: false,
    points: 70
  },
  {
    id: "nutrition-water-3l",
    title: "Hydration Pro",
    description: "Drink 3L of water daily for 7 days",
    category: "nutrition",
    icon: "💧",
    tier: "gold",
    progress: 0,
    target: 7,
    completed: false,
    points: 100
  },
  {
    id: "nutrition-calorie-goal",
    title: "Calorie Controller",
    description: "Stay within your calorie goal for 14 days",
    category: "nutrition",
    icon: "🔢",
    tier: "platinum",
    progress: 0,
    target: 14,
    completed: false,
    points: 150
  },
  {
    id: "nutrition-variety",
    title: "Nutrition Variety",
    description: "Log 30 different foods in a week",
    category: "nutrition",
    icon: "🥗",
    tier: "gold",
    progress: 0,
    target: 30,
    completed: false,
    points: 100
  },
  {
    id: "nutrition-photo-10",
    title: "Food Photographer",
    description: "Take 10 food photos",
    category: "nutrition",
    icon: "📸",
    tier: "silver",
    progress: 0,
    target: 10,
    completed: false,
    points: 50
  },
  
  // Special achievements
  {
    id: "special-first-photo",
    title: "Progress Documented",
    description: "Take your first progress photo",
    category: "special",
    icon: "📸",
    tier: "bronze",
    progress: 0,
    target: 1,
    completed: false,
    points: 15
  },
  {
    id: "special-all-goals",
    title: "Goal Getter",
    description: "Set goals in all categories",
    category: "special",
    icon: "🎯",
    tier: "silver",
    progress: 0,
    target: 1,
    completed: false,
    points: 30
  },
  {
    id: "special-first-ai",
    title: "AI Assistant",
    description: "Use the AI assistant for the first time",
    category: "special",
    icon: "🤖",
    tier: "bronze",
    progress: 0,
    target: 1,
    completed: false,
    points: 10
  },
  {
    id: "special-photo-series",
    title: "Transformation Journey",
    description: "Take progress photos for 8 consecutive weeks",
    category: "special",
    icon: "📸",
    tier: "gold",
    progress: 0,
    target: 8,
    completed: false,
    points: 100
  },
  {
    id: "special-all-features",
    title: "Power User",
    description: "Use all main features of the app",
    category: "special",
    icon: "🔍",
    tier: "gold",
    progress: 0,
    target: 1,
    completed: false,
    points: 100
  },
  {
    id: "special-share-progress",
    title: "Social Sharer",
    description: "Share your progress on social media",
    category: "special",
    icon: "📱",
    tier: "silver",
    progress: 0,
    target: 1,
    completed: false,
    points: 25
  },
  {
    id: "special-first-pr",
    title: "Personal Best",
    description: "Set your first personal record",
    category: "special",
    icon: "🏅",
    tier: "silver",
    progress: 0,
    target: 1,
    completed: false,
    points: 50
  },
  {
    id: "special-5-pr",
    title: "Record Breaker",
    description: "Set 5 personal records",
    category: "special",
    icon: "🏅",
    tier: "gold",
    progress: 0,
    target: 5,
    completed: false,
    points: 100
  },
  {
    id: "special-10-pr",
    title: "Record Collector",
    description: "Set 10 personal records",
    category: "special",
    icon: "🏅",
    tier: "platinum",
    progress: 0,
    target: 10,
    completed: false,
    points: 200
  },
  {
    id: "special-complete-profile",
    title: "Identity Established",
    description: "Complete your user profile",
    category: "special",
    icon: "👤",
    tier: "bronze",
    progress: 0,
    target: 1,
    completed: false,
    points: 20
  },
  {
    id: "special-feedback",
    title: "App Improver",
    description: "Provide feedback on the app",
    category: "special",
    icon: "💬",
    tier: "bronze",
    progress: 0,
    target: 1,
    completed: false,
    points: 15
  },
  {
    id: "special-night-owl",
    title: "Night Owl",
    description: "Use the app after midnight for 5 days",
    category: "special",
    icon: "🦉",
    tier: "silver",
    progress: 0,
    target: 5,
    completed: false,
    points: 50
  },
  {
    id: "special-early-bird",
    title: "Early Bird",
    description: "Use the app before 6 AM for 5 days",
    category: "special",
    icon: "🐦",
    tier: "silver",
    progress: 0,
    target: 5,
    completed: false,
    points: 50
  },
  {
    id: "special-app-anniversary",
    title: "App Anniversary",
    description: "Use the app for 365 days",
    category: "special",
    icon: "🎂",
    tier: "diamond",
    progress: 0,
    target: 365,
    completed: false,
    points: 500
  },
  
  // Additional Workout Achievements
  {
    id: "workout-strength-100",
    title: "Strength Virtuoso",
    description: "Complete 100 strength workouts",
    category: "workout",
    icon: "💪",
    tier: "diamond",
    progress: 0,
    target: 100,
    completed: false,
    points: 500
  },
  {
    id: "workout-cardio-100",
    title: "Cardio Virtuoso",
    description: "Complete 100 cardio workouts",
    category: "workout",
    icon: "🏃‍♀️",
    tier: "diamond",
    progress: 0,
    target: 100,
    completed: false,
    points: 500
  },
  {
    id: "workout-flexibility-50",
    title: "Flexibility Virtuoso",
    description: "Complete 50 flexibility workouts",
    category: "workout",
    icon: "🧘‍♀️",
    tier: "diamond",
    progress: 0,
    target: 50,
    completed: false,
    points: 300
  },
  {
    id: "workout-duration-120",
    title: "Marathon Trainer",
    description: "Complete a workout lasting at least 120 minutes",
    category: "workout",
    icon: "⏱️",
    tier: "platinum",
    progress: 0,
    target: 1,
    completed: false,
    points: 100
  },
  {
    id: "workout-variety-15",
    title: "Fitness Explorer",
    description: "Complete 15 different types of workouts",
    category: "workout",
    icon: "🔄",
    tier: "platinum",
    progress: 0,
    target: 15,
    completed: false,
    points: 250
  },
  {
    id: "workout-variety-20",
    title: "Fitness Connoisseur",
    description: "Complete 20 different types of workouts",
    category: "workout",
    icon: "🔄",
    tier: "diamond",
    progress: 0,
    target: 20,
    completed: false,
    points: 400
  },
  {
    id: "workout-early-bird-20",
    title: "Dawn Warrior",
    description: "Complete 20 workouts before 8 AM",
    category: "workout",
    icon: "🌅",
    tier: "gold",
    progress: 0,
    target: 20,
    completed: false,
    points: 200
  },
  {
    id: "workout-night-owl-20",
    title: "Midnight Athlete",
    description: "Complete 20 workouts after 8 PM",
    category: "workout",
    icon: "🌙",
    tier: "gold",
    progress: 0,
    target: 20,
    completed: false,
    points: 200
  },
  {
    id: "workout-weekend-warrior-25",
    title: "Weekend Champion",
    description: "Complete 25 workouts on weekends",
    category: "workout",
    icon: "📅",
    tier: "gold",
    progress: 0,
    target: 25,
    completed: false,
    points: 250
  },
  {
    id: "workout-weekend-warrior-50",
    title: "Weekend Legend",
    description: "Complete 50 workouts on weekends",
    category: "workout",
    icon: "📅",
    tier: "platinum",
    progress: 0,
    target: 50,
    completed: false,
    points: 400
  },
  {
    id: "workout-consecutive-days-5",
    title: "5-Day Challenge",
    description: "Work out for 5 consecutive days",
    category: "workout",
    icon: "📆",
    tier: "silver",
    progress: 0,
    target: 5,
    completed: false,
    points: 100
  },
  {
    id: "workout-consecutive-days-10",
    title: "10-Day Challenge",
    description: "Work out for 10 consecutive days",
    category: "workout",
    icon: "📆",
    tier: "gold",
    progress: 0,
    target: 10,
    completed: false,
    points: 200
  },
  {
    id: "workout-consecutive-days-21",
    title: "21-Day Habit",
    description: "Work out for 21 consecutive days",
    category: "workout",
    icon: "📆",
    tier: "platinum",
    progress: 0,
    target: 21,
    completed: false,
    points: 400
  },
  {
    id: "workout-consecutive-days-30",
    title: "30-Day Challenge Master",
    description: "Work out for 30 consecutive days",
    category: "workout",
    icon: "📆",
    tier: "diamond",
    progress: 0,
    target: 30,
    completed: false,
    points: 600
  },
  {
    id: "workout-same-time-7",
    title: "Clockwork",
    description: "Work out at the same time for 7 consecutive days",
    category: "workout",
    icon: "⏰",
    tier: "silver",
    progress: 0,
    target: 7,
    completed: false,
    points: 150
  },
  {
    id: "workout-same-time-14",
    title: "Routine Master",
    description: "Work out at the same time for 14 consecutive days",
    category: "workout",
    icon: "⏰",
    tier: "gold",
    progress: 0,
    target: 14,
    completed: false,
    points: 300
  },
  {
    id: "workout-intensity-high",
    title: "High Intensity",
    description: "Complete 10 high-intensity workouts",
    category: "workout",
    icon: "🔥",
    tier: "gold",
    progress: 0,
    target: 10,
    completed: false,
    points: 200
  },
  {
    id: "workout-intensity-high-25",
    title: "HIIT Enthusiast",
    description: "Complete 25 high-intensity workouts",
    category: "workout",
    icon: "🔥",
    tier: "platinum",
    progress: 0,
    target: 25,
    completed: false,
    points: 350
  },
  {
    id: "workout-intensity-high-50",
    title: "HIIT Master",
    description: "Complete 50 high-intensity workouts",
    category: "workout",
    icon: "🔥",
    tier: "diamond",
    progress: 0,
    target: 50,
    completed: false,
    points: 500
  },
  {
    id: "workout-full-body-10",
    title: "Full Body Focus",
    description: "Complete 10 full-body workouts",
    category: "workout",
    icon: "👤",
    tier: "silver",
    progress: 0,
    target: 10,
    completed: false,
    points: 150
  },
  {
    id: "workout-full-body-25",
    title: "Full Body Expert",
    description: "Complete 25 full-body workouts",
    category: "workout",
    icon: "👤",
    tier: "gold",
    progress: 0,
    target: 25,
    completed: false,
    points: 250
  },
  {
    id: "workout-full-body-50",
    title: "Full Body Master",
    description: "Complete 50 full-body workouts",
    category: "workout",
    icon: "👤",
    tier: "platinum",
    progress: 0,
    target: 50,
    completed: false,
    points: 400
  },
  {
    id: "workout-upper-body-10",
    title: "Upper Body Builder",
    description: "Complete 10 upper-body workouts",
    category: "workout",
    icon: "💪",
    tier: "silver",
    progress: 0,
    target: 10,
    completed: false,
    points: 150
  },
  {
    id: "workout-upper-body-25",
    title: "Upper Body Expert",
    description: "Complete 25 upper-body workouts",
    category: "workout",
    icon: "💪",
    tier: "gold",
    progress: 0,
    target: 25,
    completed: false,
    points: 250
  },
  {
    id: "workout-upper-body-50",
    title: "Upper Body Master",
    description: "Complete 50 upper-body workouts",
    category: "workout",
    icon: "💪",
    tier: "platinum",
    progress: 0,
    target: 50,
    completed: false,
    points: 400
  },
  {
    id: "workout-lower-body-10",
    title: "Lower Body Builder",
    description: "Complete 10 lower-body workouts",
    category: "workout",
    icon: "🦵",
    tier: "silver",
    progress: 0,
    target: 10,
    completed: false,
    points: 150
  },
  {
    id: "workout-lower-body-25",
    title: "Lower Body Expert",
    description: "Complete 25 lower-body workouts",
    category: "workout",
    icon: "🦵",
    tier: "gold",
    progress: 0,
    target: 25,
    completed: false,
    points: 250
  },
  {
    id: "workout-lower-body-50",
    title: "Lower Body Master",
    description: "Complete 50 lower-body workouts",
    category: "workout",
    icon: "🦵",
    tier: "platinum",
    progress: 0,
    target: 50,
    completed: false,
    points: 400
  },
  {
    id: "workout-core-10",
    title: "Core Builder",
    description: "Complete 10 core workouts",
    category: "workout",
    icon: "🧠",
    tier: "silver",
    progress: 0,
    target: 10,
    completed: false,
    points: 150
  },
  {
    id: "workout-core-25",
    title: "Core Expert",
    description: "Complete 25 core workouts",
    category: "workout",
    icon: "🧠",
    tier: "gold",
    progress: 0,
    target: 25,
    completed: false,
    points: 250
  },
  {
    id: "workout-core-50",
    title: "Core Master",
    description: "Complete 50 core workouts",
    category: "workout",
    icon: "🧠",
    tier: "platinum",
    progress: 0,
    target: 50,
    completed: false,
    points: 400
  },
  
  // Additional Streak Achievements
  {
    id: "streak-weekly-4",
    title: "Weekly Commitment",
    description: "Work out at least 4 times a week for 4 consecutive weeks",
    category: "streak",
    icon: "📊",
    tier: "platinum",
    progress: 0,
    target: 4,
    completed: false,
    points: 300
  },
  {
    id: "streak-weekly-5",
    title: "Dedicated Weekly",
    description: "Work out at least 5 times a week for 4 consecutive weeks",
    category: "streak",
    icon: "📊",
    tier: "diamond",
    progress: 0,
    target: 4,
    completed: false,
    points: 400
  },
  {
    id: "streak-monthly-12",
    title: "Year-Round Athlete",
    description: "Work out at least 12 times a month for 12 consecutive months",
    category: "streak",
    icon: "📅",
    tier: "diamond",
    progress: 0,
    target: 12,
    completed: false,
    points: 1200
  },
  {
    id: "streak-recovery-balance",
    title: "Balanced Recovery",
    description: "Maintain a workout-rest pattern for 30 days",
    category: "streak",
    icon: "⚖️",
    tier: "gold",
    progress: 0,
    target: 30,
    completed: false,
    points: 250
  },
  {
    id: "streak-comeback-major",
    title: "Major Comeback",
    description: "Resume working out after a 30+ day break",
    category: "streak",
    icon: "🔄",
    tier: "gold",
    progress: 0,
    target: 1,
    completed: false,
    points: 150
  },
  {
    id: "streak-holiday-warrior",
    title: "Holiday Warrior",
    description: "Work out on 5 major holidays",
    category: "streak",
    icon: "🎄",
    tier: "gold",
    progress: 0,
    target: 5,
    completed: false,
    points: 250
  },
  {
    id: "streak-birthday-workout",
    title: "Birthday Gains",
    description: "Work out on your birthday",
    category: "streak",
    icon: "🎂",
    tier: "silver",
    progress: 0,
    target: 1,
    completed: false,
    points: 100
  },
  {
    id: "streak-new-year",
    title: "New Year, Same Dedication",
    description: "Work out on New Year's Day",
    category: "streak",
    icon: "🎆",
    tier: "silver",
    progress: 0,
    target: 1,
    completed: false,
    points: 100
  },
  {
    id: "streak-monday-10",
    title: "Monday Motivation",
    description: "Work out on 10 consecutive Mondays",
    category: "streak",
    icon: "📅",
    tier: "gold",
    progress: 0,
    target: 10,
    completed: false,
    points: 200
  },
  {
    id: "streak-friday-10",
    title: "Friday Finisher",
    description: "Work out on 10 consecutive Fridays",
    category: "streak",
    icon: "📅",
    tier: "gold",
    progress: 0,
    target: 10,
    completed: false,
    points: 200
  },
  
  // Additional Weight Achievements
  {
    id: "weight-gain-muscle-1",
    title: "Muscle Builder",
    description: "Gain 1 kg of muscle mass",
    category: "weight",
    icon: "📈",
    tier: "bronze",
    progress: 0,
    target: 1,
    completed: false,
    points: 50
  },
  {
    id: "weight-gain-muscle-5",
    title: "Muscle Gainer",
    description: "Gain 5 kg of muscle mass",
    category: "weight",
    icon: "📈",
    tier: "silver",
    progress: 0,
    target: 5,
    completed: false,
    points: 150
  },
  {
    id: "weight-gain-muscle-10",
    title: "Serious Muscle",
    description: "Gain 10 kg of muscle mass",
    category: "weight",
    icon: "📈",
    tier: "gold",
    progress: 0,
    target: 10,
    completed: false,
    points: 300
  },
  {
    id: "weight-body-fat-reduction-5",
    title: "Fat Loss Beginner",
    description: "Reduce body fat percentage by 5%",
    category: "weight",
    icon: "📉",
    tier: "silver",
    progress: 0,
    target: 5,
    completed: false,
    points: 150
  },
  {
    id: "weight-body-fat-reduction-10",
    title: "Fat Loss Expert",
    description: "Reduce body fat percentage by 10%",
    category: "weight",
    icon: "📉",
    tier: "gold",
    progress: 0,
    target: 10,
    completed: false,
    points: 300
  },
  {
    id: "weight-body-fat-reduction-15",
    title: "Fat Loss Master",
    description: "Reduce body fat percentage by 15%",
    category: "weight",
    icon: "📉",
    tier: "platinum",
    progress: 0,
    target: 15,
    completed: false,
    points: 500
  },
  {
    id: "weight-maintain-180",
    title: "Maintenance Expert",
    description: "Maintain your goal weight for 180 days",
    category: "weight",
    icon: "📊",
    tier: "diamond",
    progress: 0,
    target: 180,
    completed: false,
    points: 1000
  },
  {
    id: "weight-maintain-365",
    title: "Maintenance Master",
    description: "Maintain your goal weight for 365 days",
    category: "weight",
    icon: "📊",
    tier: "diamond",
    progress: 0,
    target: 365,
    completed: false,
    points: 2000
  },
  {
    id: "weight-track-180",
    title: "Weight Tracking Expert",
    description: "Track your weight for 180 consecutive days",
    category: "weight",
    icon: "⚖️",
    tier: "diamond",
    progress: 0,
    target: 180,
    completed: false,
    points: 500
  },
  {
    id: "weight-track-365",
    title: "Weight Tracking Master",
    description: "Track your weight for 365 consecutive days",
    category: "weight",
    icon: "⚖️",
    tier: "diamond",
    progress: 0,
    target: 365,
    completed: false,
    points: 1000
  },
  {
    id: "weight-waist-reduction-5",
    title: "Waist Reducer",
    description: "Reduce your waist circumference by 5 cm",
    category: "weight",
    icon: "📏",
    tier: "silver",
    progress: 0,
    target: 5,
    completed: false,
    points: 150
  },
  {
    id: "weight-waist-reduction-10",
    title: "Significant Waist Reduction",
    description: "Reduce your waist circumference by 10 cm",
    category: "weight",
    icon: "📏",
    tier: "gold",
    progress: 0,
    target: 10,
    completed: false,
    points: 300
  },
  
  // Additional Steps Achievements
  {
    id: "steps-35000",
    title: "Ultra Walker",
    description: "Walk 35,000 steps in a day",
    category: "steps",
    icon: "👣",
    tier: "diamond",
    progress: 0,
    target: 35000,
    completed: false,
    points: 250
  },
  {
    id: "steps-40000",
    title: "Step Phenomenon",
    description: "Walk 40,000 steps in a day",
    category: "steps",
    icon: "👣",
    tier: "diamond",
    progress: 0,
    target: 40000,
    completed: false,
    points: 300
  },
  {
    id: "steps-50000",
    title: "Step Superhuman",
    description: "Walk 50,000 steps in a day",
    category: "steps",
    icon: "👣",
    tier: "diamond",
    progress: 0,
    target: 50000,
    completed: false,
    points: 500
  },
  {
    id: "steps-750k",
    title: "Step Titan",
    description: "Walk 750,000 steps in a month",
    category: "steps",
    icon: "👣",
    tier: "diamond",
    progress: 0,
    target: 750000,
    completed: false,
    points: 750
  },
  {
    id: "steps-2m",
    title: "Two Million Step Club",
    description: "Walk 2,000,000 steps total",
    category: "steps",
    icon: "👣",
    tier: "diamond",
    progress: 0,
    target: 2000000,
    completed: false,
    points: 2000
  },
  {
    id: "steps-5m",
    title: "Five Million Step Club",
    description: "Walk 5,000,000 steps total",
    category: "steps",
    icon: "👣",
    tier: "diamond",
    progress: 0,
    target: 5000000,
    completed: false,
    points: 5000
  },
  {
    id: "steps-streak-60",
    title: "Step Dedication",
    description: "Walk at least 8,000 steps for 60 consecutive days",
    category: "steps",
    icon: "📊",
    tier: "diamond",
    progress: 0,
    target: 60,
    completed: false,
    points: 600
  },
  {
    id: "steps-streak-90",
    title: "Step Obsession",
    description: "Walk at least 8,000 steps for 90 consecutive days",
    category: "steps",
    icon: "📊",
    tier: "diamond",
    progress: 0,
    target: 90,
    completed: false,
    points: 900
  },
  {
    id: "steps-streak-180",
    title: "Step Lifestyle",
    description: "Walk at least 8,000 steps for 180 consecutive days",
    category: "steps",
    icon: "📊",
    tier: "diamond",
    progress: 0,
    target: 180,
    completed: false,
    points: 1800
  },
  {
    id: "steps-streak-365",
    title: "Step Devotion",
    description: "Walk at least 8,000 steps for 365 consecutive days",
    category: "steps",
    icon: "📊",
    tier: "diamond",
    progress: 0,
    target: 365,
    completed: false,
    points: 3650
  },
  {
    id: "steps-weekend-100k",
    title: "Weekend Step Champion",
    description: "Walk 100,000 steps in a single weekend",
    category: "steps",
    icon: "🏞️",
    tier: "platinum",
    progress: 0,
    target: 100000,
    completed: false,
    points: 300
  },
  {
    id: "steps-distance-10km",
    title: "10K Walker",
    description: "Walk 10 kilometers in a day",
    category: "steps",
    icon: "🗺️",
    tier: "silver",
    progress: 0,
    target: 10,
    completed: false,
    points: 100
  },
  {
    id: "steps-distance-21km",
    title: "Half-Marathon Walker",
    description: "Walk 21 kilometers in a day",
    category: "steps",
    icon: "🗺️",
    tier: "gold",
    progress: 0,
    target: 21,
    completed: false,
    points: 210
  },
  {
    id: "steps-distance-42km",
    title: "Marathon Walker",
    description: "Walk 42 kilometers in a day",
    category: "steps",
    icon: "🗺️",
    tier: "platinum",
    progress: 0,
    target: 42,
    completed: false,
    points: 420
  },
  
  // Additional Nutrition Achievements
  {
    id: "nutrition-log-90",
    title: "Nutrition Master",
    description: "Log all meals for 90 consecutive days",
    category: "nutrition",
    icon: "🍎",
    tier: "diamond",
    progress: 0,
    target: 90,
    completed: false,
    points: 900
  },
  {
    id: "nutrition-log-180",
    title: "Nutrition Guru",
    description: "Log all meals for 180 consecutive days",
    category: "nutrition",
    icon: "🍎",
    tier: "diamond",
    progress: 0,
    target: 180,
    completed: false,
    points: 1800
  },
  {
    id: "nutrition-log-365",
    title: "Nutrition Devotee",
    description: "Log all meals for 365 consecutive days",
    category: "nutrition",
    icon: "🍎",
    tier: "diamond",
    progress: 0,
    target: 365,
    completed: false,
    points: 3650
  },
  {
    id: "nutrition-protein-goal-30",
    title: "Protein Champion",
    description: "Meet your protein goal for 30 consecutive days",
    category: "nutrition",
    icon: "🥩",
    tier: "platinum",
    progress: 0,
    target: 30,
    completed: false,
    points: 300
  },
  {
    id: "nutrition-protein-goal-90",
    title: "Protein Master",
    description: "Meet your protein goal for 90 consecutive days",
    category: "nutrition",
    icon: "🥩",
    tier: "diamond",
    progress: 0,
    target: 90,
    completed: false,
    points: 900
  },
  {
    id: "nutrition-balanced-30",
    title: "Macro Master",
    description: "Maintain balanced macros for 30 days",
    category: "nutrition",
    icon: "⚖️",
    tier: "platinum",
    progress: 0,
    target: 30,
    completed: false,
    points: 300
  },
  {
    id: "nutrition-balanced-90",
    title: "Macro Guru",
    description: "Maintain balanced macros for 90 days",
    category: "nutrition",
    icon: "⚖️",
    tier: "diamond",
    progress: 0,
    target: 90,
    completed: false,
    points: 900
  },
  {
    id: "nutrition-water-4l",
    title: "Hydration Master",
    description: "Drink 4L of water daily for 7 days",
    category: "nutrition",
    icon: "💧",
    tier: "platinum",
    progress: 0,
    target: 7,
    completed: false,
    points: 150
  },
  {
    id: "nutrition-water-30-days",
    title: "Hydration Habit",
    description: "Meet your water goal for 30 consecutive days",
    category: "nutrition",
    icon: "💧",
    tier: "platinum",
    progress: 0,
    target: 30,
    completed: false,
    points: 300
  },
  {
    id: "nutrition-water-90-days",
    title: "Hydration Lifestyle",
    description: "Meet your water goal for 90 consecutive days",
    category: "nutrition",
    icon: "💧",
    tier: "diamond",
    progress: 0,
    target: 90,
    completed: false,
    points: 900
  },
  {
    id: "nutrition-calorie-goal-30",
    title: "Calorie Master",
    description: "Stay within your calorie goal for 30 days",
    category: "nutrition",
    icon: "🔢",
    tier: "diamond",
    progress: 0,
    target: 30,
    completed: false,
    points: 300
  },
  {
    id: "nutrition-calorie-goal-90",
    title: "Calorie Guru",
    description: "Stay within your calorie goal for 90 days",
    category: "nutrition",
    icon: "🔢",
    tier: "diamond",
    progress: 0,
    target: 90,
    completed: false,
    points: 900
  },
  {
    id: "nutrition-variety-50",
    title: "Nutrition Diversity",
    description: "Log 50 different foods in a month",
    category: "nutrition",
    icon: "🥗",
    tier: "platinum",
    progress: 0,
    target: 50,
    completed: false,
    points: 200
  },
  {
    id: "nutrition-variety-100",
    title: "Nutrition Explorer",
    description: "Log 100 different foods in a month",
    category: "nutrition",
    icon: "🥗",
    tier: "diamond",
    progress: 0,
    target: 100,
    completed: false,
    points: 400
  },
  {
    id: "nutrition-photo-50",
    title: "Food Photography Expert",
    description: "Take 50 food photos",
    category: "nutrition",
    icon: "📸",
    tier: "gold",
    progress: 0,
    target: 50,
    completed: false,
    points: 200
  },
  {
    id: "nutrition-photo-100",
    title: "Food Photography Master",
    description: "Take 100 food photos",
    category: "nutrition",
    icon: "📸",
    tier: "platinum",
    progress: 0,
    target: 100,
    completed: false,
    points: 400
  },
  {
    id: "nutrition-vegetable-servings",
    title: "Vegetable Enthusiast",
    description: "Log 5 servings of vegetables daily for 7 days",
    category: "nutrition",
    icon: "🥦",
    tier: "gold",
    progress: 0,
    target: 7,
    completed: false,
    points: 150
  },
  {
    id: "nutrition-fruit-servings",
    title: "Fruit Lover",
    description: "Log 3 servings of fruit daily for 7 days",
    category: "nutrition",
    icon: "🍎",
    tier: "gold",
    progress: 0,
    target: 7,
    completed: false,
    points: 150
  },
  {
    id: "nutrition-whole-grains",
    title: "Whole Grain Champion",
    description: "Choose whole grains over refined grains for 14 days",
    category: "nutrition",
    icon: "🌾",
    tier: "gold",
    progress: 0,
    target: 14,
    completed: false,
    points: 150
  },
  {
    id: "nutrition-meal-prep-4",
    title: "Meal Prep Beginner",
    description: "Prepare meals in advance for 4 consecutive weeks",
    category: "nutrition",
    icon: "🍱",
    tier: "silver",
    progress: 0,
    target: 4,
    completed: false,
    points: 100
  },
  {
    id: "nutrition-meal-prep-12",
    title: "Meal Prep Master",
    description: "Prepare meals in advance for 12 consecutive weeks",
    category: "nutrition",
    icon: "🍱",
    tier: "gold",
    progress: 0,
    target: 12,
    completed: false,
    points: 300
  },
  
  // Additional Special Achievements
  {
    id: "special-photo-series-12",
    title: "Transformation Chronicler",
    description: "Take progress photos for 12 consecutive months",
    category: "special",
    icon: "📸",
    tier: "platinum",
    progress: 0,
    target: 12,
    completed: false,
    points: 500
  },
  {
    id: "special-20-pr",
    title: "Record Master",
    description: "Set 20 personal records",
    category: "special",
    icon: "🏅",
    tier: "diamond",
    progress: 0,
    target: 20,
    completed: false,
    points: 400
  },
  {
    id: "special-50-pr",
    title: "Record Legend",
    description: "Set 50 personal records",
    category: "special",
    icon: "🏅",
    tier: "diamond",
    progress: 0,
    target: 50,
    completed: false,
    points: 1000
  },
  {
    id: "special-ai-10",
    title: "AI Enthusiast",
    description: "Use the AI assistant 10 times",
    category: "special",
    icon: "🤖",
    tier: "silver",
    progress: 0,
    target: 10,
    completed: false,
    points: 50
  },
  {
    id: "special-ai-50",
    title: "AI Partner",
    description: "Use the AI assistant 50 times",
    category: "special",
    icon: "🤖",
    tier: "gold",
    progress: 0,
    target: 50,
    completed: false,
    points: 200
  },
  {
    id: "special-ai-100",
    title: "AI Symbiosis",
    description: "Use the AI assistant 100 times",
    category: "special",
    icon: "🤖",
    tier: "platinum",
    progress: 0,
    target: 100,
    completed: false,
    points: 400
  },
  {
    id: "special-share-progress-10",
    title: "Social Fitness Influencer",
    description: "Share your progress on social media 10 times",
    category: "special",
    icon: "📱",
    tier: "gold",
    progress: 0,
    target: 10,
    completed: false,
    points: 150
  },
  {
    id: "special-share-progress-50",
    title: "Fitness Inspiration",
    description: "Share your progress on social media 50 times",
    category: "special",
    icon: "📱",
    tier: "platinum",
    progress: 0,
    target: 50,
    completed: false,
    points: 500
  },
  {
    id: "special-app-usage-100",
    title: "App Enthusiast",
    description: "Use the app for 100 days",
    category: "special",
    icon: "📱",
    tier: "gold",
    progress: 0,
    target: 100,
    completed: false,
    points: 200
  },
  {
    id: "special-app-usage-200",
    title: "App Devotee",
    description: "Use the app for 200 days",
    category: "special",
    icon: "📱",
    tier: "platinum",
    progress: 0,
    target: 200,
    completed: false,
    points: 400
  },
  {
    id: "special-app-2-year",
    title: "Two-Year Anniversary",
    description: "Use the app for 730 days",
    category: "special",
    icon: "🎂",
    tier: "diamond",
    progress: 0,
    target: 730,
    completed: false,
    points: 1000
  },
  {
    id: "special-challenge-5",
    title: "Challenge Taker",
    description: "Complete 5 challenges",
    category: "special",
    icon: "🏆",
    tier: "silver",
    progress: 0,
    target: 5,
    completed: false,
    points: 150
  },
  {
    id: "special-challenge-15",
    title: "Challenge Master",
    description: "Complete 15 challenges",
    category: "special",
    icon: "🏆",
    tier: "gold",
    progress: 0,
    target: 15,
    completed: false,
    points: 300
  },
  {
    id: "special-challenge-30",
    title: "Challenge Champion",
    description: "Complete 30 challenges",
    category: "special",
    icon: "🏆",
    tier: "platinum",
    progress: 0,
    target: 30,
    completed: false,
    points: 600
  },
  {
    id: "special-challenge-50",
    title: "Challenge Legend",
    description: "Complete 50 challenges",
    category: "special",
    icon: "🏆",
    tier: "diamond",
    progress: 0,
    target: 50,
    completed: false,
    points: 1000
  },
  {
    id: "special-quest-50",
    title: "Quest Seeker",
    description: "Complete 50 daily quests",
    category: "special",
    icon: "📜",
    tier: "gold",
    progress: 0,
    target: 50,
    completed: false,
    points: 250
  },
  {
    id: "special-quest-100",
    title: "Quest Master",
    description: "Complete 100 daily quests",
    category: "special",
    icon: "📜",
    tier: "platinum",
    progress: 0,
    target: 100,
    completed: false,
    points: 500
  },
  {
    id: "special-quest-365",
    title: "Quest Legend",
    description: "Complete 365 daily quests",
    category: "special",
    icon: "📜",
    tier: "diamond",
    progress: 0,
    target: 365,
    completed: false,
    points: 1500
  },
  {
    id: "special-reward-5",
    title: "Reward Collector",
    description: "Unlock 5 rewards",
    category: "special",
    icon: "🎁",
    tier: "silver",
    progress: 0,
    target: 5,
    completed: false,
    points: 150
  },
  {
    id: "special-reward-15",
    title: "Reward Hunter",
    description: "Unlock 15 rewards",
    category: "special",
    icon: "🎁",
    tier: "gold",
    progress: 0,
    target: 15,
    completed: false,
    points: 300
  },
  {
    id: "special-reward-30",
    title: "Reward Master",
    description: "Unlock 30 rewards",
    category: "special",
    icon: "🎁",
    tier: "platinum",
    progress: 0,
    target: 30,
    completed: false,
    points: 600
  },
  {
    id: "special-achievement-50",
    title: "Achievement Hunter",
    description: "Unlock 50 achievements",
    category: "special",
    icon: "🏆",
    tier: "gold",
    progress: 0,
    target: 50,
    completed: false,
    points: 500
  },
  {
    id: "special-achievement-100",
    title: "Achievement Master",
    description: "Unlock 100 achievements",
    category: "special",
    icon: "🏆",
    tier: "platinum",
    progress: 0,
    target: 100,
    completed: false,
    points: 1000
  },
  {
    id: "special-achievement-150",
    title: "Achievement Legend",
    description: "Unlock 150 achievements",
    category: "special",
    icon: "🏆",
    tier: "diamond",
    progress: 0,
    target: 150,
    completed: false,
    points: 1500
  },
  {
    id: "special-achievement-200",
    title: "Achievement God",
    description: "Unlock all 200 achievements",
    category: "special",
    icon: "👑",
    tier: "diamond",
    progress: 0,
    target: 200,
    completed: false,
    points: 2000
  }
];

// Define default rewards
const defaultRewards: Reward[] = [
  {
    id: "reward-cheat-day",
    title: "Cheat Day",
    description: "Enjoy a guilt-free cheat day after 5 workouts in a week",
    cost: 200,
    icon: "🍕",
    unlocked: false,
    used: false,
    category: "nutrition"
  },
  {
    id: "reward-rest-day",
    title: "Guilt-Free Rest Day",
    description: "Take an extra rest day without breaking your streak",
    cost: 150,
    icon: "😴",
    unlocked: false,
    used: false,
    category: "rest"
  },
  {
    id: "reward-custom-workout",
    title: "AI Workout Plan",
    description: "Get a personalized AI workout plan based on your goals",
    cost: 300,
    icon: "🤖",
    unlocked: false,
    used: false,
    category: "workout"
  },
  {
    id: "reward-nutrition-plan",
    title: "Custom Nutrition Plan",
    description: "Unlock a personalized nutrition plan for your goals",
    cost: 350,
    icon: "🥗",
    unlocked: false,
    used: false,
    category: "nutrition"
  },
  {
    id: "reward-dark-theme",
    title: "Dark Theme",
    description: "Unlock the premium dark theme",
    cost: 100,
    icon: "🌙",
    unlocked: false,
    used: false,
    category: "special"
  }
];

// Define default challenges
const defaultChallenges: Challenge[] = [
  // Workout Challenges
  {
    id: "challenge-week-workouts",
    title: "Weekly Warrior",
    description: "Complete 4 workouts this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 4,
    progress: 0,
    completed: false,
    category: "workout",
    points: 100,
    reward: "50 bonus points",
    difficulty: "easy",
    fitnessLevel: ['intermediate', 'advanced']
  },
  // Beginner-friendly challenges
  {
    id: "challenge-beginner-first-week",
    title: "Getting Started",
    description: "Complete 2 workouts this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 2,
    progress: 0,
    completed: false,
    category: "workout",
    points: 75,
    reward: "30 bonus points",
    difficulty: "easy",
    fitnessLevel: ['beginner']
  },
  {
    id: "challenge-beginner-3-day-streak",
    title: "Building Habits",
    description: "Work out for 3 consecutive days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 3,
    progress: 0,
    completed: false,
    category: "streak",
    points: 60,
    reward: "25 bonus points",
    difficulty: "easy",
    fitnessLevel: ['beginner']
  },
  {
    id: "challenge-beginner-steps",
    title: "Daily Steps",
    description: "Walk 3,000 steps every day this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "steps",
    points: 50,
    reward: "20 bonus points",
    difficulty: "easy",
    fitnessLevel: ['beginner']
  },
  {
    id: "challenge-steps",
    title: "Step Challenge",
    description: "Walk 50,000 steps this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 50000,
    progress: 0,
    completed: false,
    category: "steps",
    points: 150,
    reward: "Cheat Day Reward",
    difficulty: "medium"
  },
  {
    id: "challenge-month-streak",
    title: "Monthly Consistency",
    description: "Work out 20 days this month",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    target: 20,
    progress: 0,
    completed: false,
    category: "streak",
    points: 300,
    reward: "Custom Workout Plan",
    difficulty: "hard"
  },
  // New Workout Challenges
  {
    id: "challenge-strength-week",
    title: "Strength Week",
    description: "Complete 3 strength workouts this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 3,
    progress: 0,
    completed: false,
    category: "workout",
    points: 75,
    reward: "25 bonus points",
    difficulty: "easy"
  },
  {
    id: "challenge-cardio-week",
    title: "Cardio Blast",
    description: "Complete 3 cardio workouts this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 3,
    progress: 0,
    completed: false,
    category: "workout",
    points: 75,
    reward: "25 bonus points",
    difficulty: "easy"
  },
  {
    id: "challenge-flexibility-week",
    title: "Flexibility Focus",
    description: "Complete 3 flexibility workouts this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 3,
    progress: 0,
    completed: false,
    category: "workout",
    points: 75,
    reward: "25 bonus points",
    difficulty: "easy"
  },
  {
    id: "challenge-workout-variety",
    title: "Workout Variety",
    description: "Complete 5 different types of workouts in two weeks",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    target: 5,
    progress: 0,
    completed: false,
    category: "workout",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-workout-duration",
    title: "Endurance Builder",
    description: "Complete 3 workouts lasting at least 45 minutes each this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 3,
    progress: 0,
    completed: false,
    category: "workout",
    points: 100,
    reward: "30 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-morning-workouts",
    title: "Early Bird",
    description: "Complete 3 workouts before 9 AM this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 3,
    progress: 0,
    completed: false,
    category: "workout",
    points: 100,
    reward: "30 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-evening-workouts",
    title: "Night Owl",
    description: "Complete 3 workouts after 6 PM this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 3,
    progress: 0,
    completed: false,
    category: "workout",
    points: 100,
    reward: "30 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-weekend-warrior",
    title: "Weekend Warrior",
    description: "Complete 4 workouts over the next 2 weekends",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    target: 4,
    progress: 0,
    completed: false,
    category: "workout",
    points: 120,
    reward: "40 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-workout-streak-7",
    title: "7-Day Streak",
    description: "Work out for 7 consecutive days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "streak",
    points: 200,
    reward: "Guilt-Free Rest Day",
    difficulty: "hard"
  },
  {
    id: "challenge-workout-streak-14",
    title: "14-Day Streak",
    description: "Work out for 14 consecutive days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    target: 14,
    progress: 0,
    completed: false,
    category: "streak",
    points: 400,
    reward: "Custom Workout Plan",
    difficulty: "hard"
  },
  
  // Nutrition Challenges
  {
    id: "challenge-nutrition-log-week",
    title: "Nutrition Tracker",
    description: "Log all your meals for 7 consecutive days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "nutrition",
    points: 100,
    reward: "30 bonus points",
    difficulty: "easy"
  },
  {
    id: "challenge-protein-goal",
    title: "Protein Champion",
    description: "Meet your daily protein goal for 5 days this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 5,
    progress: 0,
    completed: false,
    category: "nutrition",
    points: 120,
    reward: "40 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-water-intake",
    title: "Hydration Hero",
    description: "Drink at least 2.5L of water daily for 7 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "nutrition",
    points: 100,
    reward: "30 bonus points",
    difficulty: "easy"
  },
  {
    id: "challenge-calorie-deficit",
    title: "Calorie Control",
    description: "Maintain a calorie deficit for 5 days this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 5,
    progress: 0,
    completed: false,
    category: "nutrition",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-balanced-macros",
    title: "Macro Balance",
    description: "Maintain balanced macros for 5 days this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 5,
    progress: 0,
    completed: false,
    category: "nutrition",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-vegetable-servings",
    title: "Vegetable Boost",
    description: "Consume at least 5 servings of vegetables daily for 7 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "nutrition",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-fruit-servings",
    title: "Fruit Feast",
    description: "Consume at least 3 servings of fruit daily for 7 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "nutrition",
    points: 120,
    reward: "40 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-meal-prep",
    title: "Meal Prep Master",
    description: "Prepare meals in advance for 2 weeks",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    target: 2,
    progress: 0,
    completed: false,
    category: "nutrition",
    points: 200,
    reward: "Custom Nutrition Plan",
    difficulty: "hard"
  },
  {
    id: "challenge-nutrition-photos",
    title: "Food Photographer",
    description: "Take photos of 15 different meals this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 15,
    progress: 0,
    completed: false,
    category: "nutrition",
    points: 100,
    reward: "30 bonus points",
    difficulty: "easy"
  },
  
  // Steps Challenges
  {
    id: "challenge-daily-steps",
    title: "Daily Stepper",
    description: "Walk at least 8,000 steps every day for a week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "steps",
    points: 120,
    reward: "40 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-steps-100k",
    title: "100K Steps",
    description: "Walk 100,000 steps in two weeks",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    target: 100000,
    progress: 0,
    completed: false,
    category: "steps",
    points: 200,
    reward: "70 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-steps-15k-day",
    title: "15K Day",
    description: "Walk 15,000 steps in a single day this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 15000,
    progress: 0,
    completed: false,
    category: "steps",
    points: 100,
    reward: "30 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-steps-20k-day",
    title: "20K Day",
    description: "Walk 20,000 steps in a single day this week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 20000,
    progress: 0,
    completed: false,
    category: "steps",
    points: 150,
    reward: "50 bonus points",
    difficulty: "hard",
    fitnessLevel: ['intermediate', 'advanced']
  },
  {
    id: "challenge-steps-weekend",
    title: "Weekend Walker",
    description: "Walk 30,000 steps over the weekend",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 30000,
    progress: 0,
    completed: false,
    category: "steps",
    points: 120,
    reward: "40 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-steps-streak",
    title: "Step Streak",
    description: "Walk at least 10,000 steps for 7 consecutive days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "steps",
    points: 200,
    reward: "70 bonus points",
    difficulty: "hard"
  },
  {
    id: "challenge-steps-monthly",
    title: "Monthly Stepper",
    description: "Walk 300,000 steps in a month",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    target: 300000,
    progress: 0,
    completed: false,
    category: "steps",
    points: 300,
    reward: "100 bonus points",
    difficulty: "hard"
  },
  
  // Weight Challenges
  {
    id: "challenge-weight-tracking",
    title: "Weight Tracker",
    description: "Track your weight for 14 consecutive days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    target: 14,
    progress: 0,
    completed: false,
    category: "weight",
    points: 100,
    reward: "30 bonus points",
    difficulty: "easy"
  },
  {
    id: "challenge-weight-loss-1kg",
    title: "First Kilogram",
    description: "Lose 1 kg in two weeks",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    target: 1,
    progress: 0,
    completed: false,
    category: "weight",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-weight-loss-2kg",
    title: "Steady Progress",
    description: "Lose 2 kg in a month",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    target: 2,
    progress: 0,
    completed: false,
    category: "weight",
    points: 250,
    reward: "Custom Nutrition Plan",
    difficulty: "hard"
  },
  {
    id: "challenge-weight-maintenance",
    title: "Weight Maintenance",
    description: "Maintain your weight within 0.5 kg for 2 weeks",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    target: 14,
    progress: 0,
    completed: false,
    category: "weight",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-body-measurements",
    title: "Body Composition",
    description: "Track your body measurements weekly for a month",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    target: 4,
    progress: 0,
    completed: false,
    category: "weight",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  
  // Special Challenges
  {
    id: "challenge-progress-photos",
    title: "Photo Progress",
    description: "Take weekly progress photos for a month",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    target: 4,
    progress: 0,
    completed: false,
    category: "special",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-ai-assistant",
    title: "AI Coach",
    description: "Use the AI assistant 10 times in two weeks",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    target: 10,
    progress: 0,
    completed: false,
    category: "special",
    points: 100,
    reward: "30 bonus points",
    difficulty: "easy"
  },
  {
    id: "challenge-app-usage",
    title: "App Engagement",
    description: "Use the app every day for 14 consecutive days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    target: 14,
    progress: 0,
    completed: false,
    category: "special",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-share-progress",
    title: "Social Sharing",
    description: "Share your progress on social media 5 times in a month",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    target: 5,
    progress: 0,
    completed: false,
    category: "special",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-complete-profile",
    title: "Profile Completion",
    description: "Complete all sections of your user profile",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 1,
    progress: 0,
    completed: false,
    category: "special",
    points: 50,
    reward: "20 bonus points",
    difficulty: "easy"
  },
  {
    id: "challenge-set-goals",
    title: "Goal Setter",
    description: "Set goals in all categories",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 1,
    progress: 0,
    completed: false,
    category: "special",
    points: 75,
    reward: "25 bonus points",
    difficulty: "easy"
  },
  {
    id: "challenge-daily-quests",
    title: "Quest Completer",
    description: "Complete 15 daily quests in a week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 15,
    progress: 0,
    completed: false,
    category: "special",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-unlock-achievements",
    title: "Achievement Hunter",
    description: "Unlock 5 new achievements in two weeks",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    target: 5,
    progress: 0,
    completed: false,
    category: "special",
    points: 200,
    reward: "70 bonus points",
    difficulty: "hard"
  },
  
  // Seasonal Challenges
  {
    id: "challenge-new-year",
    title: "New Year, New You",
    description: "Complete 20 workouts in January",
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
    endDate: new Date(new Date().getFullYear(), 0, 31).toISOString(),
    target: 20,
    progress: 0,
    completed: false,
    category: "workout",
    points: 300,
    reward: "100 bonus points",
    difficulty: "hard"
  },
  {
    id: "challenge-summer-body",
    title: "Summer Ready",
    description: "Complete 30 workouts in 30 days",
    startDate: new Date(new Date().getFullYear(), 5, 1).toISOString(),
    endDate: new Date(new Date().getFullYear(), 5, 30).toISOString(),
    target: 30,
    progress: 0,
    completed: false,
    category: "workout",
    points: 400,
    reward: "Custom Workout Plan",
    difficulty: "hard"
  },
  {
    id: "challenge-holiday-fitness",
    title: "Holiday Fitness",
    description: "Maintain your workout routine during the holiday season",
    startDate: new Date(new Date().getFullYear(), 11, 15).toISOString(),
    endDate: new Date(new Date().getFullYear(), 11, 31).toISOString(),
    target: 10,
    progress: 0,
    completed: false,
    category: "workout",
    points: 250,
    reward: "Cheat Day Reward",
    difficulty: "medium"
  },
  
  // New Challenges
  {
    id: "challenge-push-pull-legs",
    title: "Push-Pull-Legs Week",
    description: "Complete a push, pull, and legs workout in a single week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 3,
    progress: 0,
    completed: false,
    category: "workout",
    points: 120,
    reward: "40 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-no-sugar-week",
    title: "Sugar Detox",
    description: "Avoid added sugars for 7 consecutive days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "nutrition",
    points: 200,
    reward: "70 bonus points",
    difficulty: "hard"
  },
  {
    id: "challenge-meditation-week",
    title: "Mindfulness Week",
    description: "Meditate for at least 10 minutes daily for 7 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "special",
    points: 100,
    reward: "30 bonus points",
    difficulty: "easy"
  },
  {
    id: "challenge-stairs-only",
    title: "Stair Master",
    description: "Use only stairs (no elevators) for 7 consecutive days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "steps",
    points: 120,
    reward: "40 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-sleep-8-hours",
    title: "Sleep Optimizer",
    description: "Get 8 hours of sleep for 7 consecutive nights",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "special",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-plank-progression",
    title: "Plank Progression",
    description: "Increase your plank time by 10 seconds each day for 10 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    target: 10,
    progress: 0,
    completed: false,
    category: "workout",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-pushup-ladder",
    title: "Push-Up Ladder",
    description: "Complete a push-up ladder (1-10-1) daily for 7 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "workout",
    points: 120,
    reward: "40 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-squat-century",
    title: "Squat Century",
    description: "Complete 100 squats daily for 7 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "workout",
    points: 200,
    reward: "70 bonus points",
    difficulty: "hard"
  },
  {
    id: "challenge-vegetarian-week",
    title: "Vegetarian Week",
    description: "Follow a vegetarian diet for 7 consecutive days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "nutrition",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-morning-stretch",
    title: "Morning Stretch",
    description: "Complete a 10-minute morning stretch routine for 7 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "workout",
    points: 100,
    reward: "30 bonus points",
    difficulty: "easy"
  },
  {
    id: "challenge-digital-detox",
    title: "Digital Detox",
    description: "Limit screen time to 2 hours daily for 7 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "special",
    points: 150,
    reward: "50 bonus points",
    difficulty: "hard"
  },
  {
    id: "challenge-active-commute",
    title: "Active Commute",
    description: "Walk, bike, or run to work/school for 5 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 5,
    progress: 0,
    completed: false,
    category: "steps",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-cold-shower",
    title: "Cold Shower Challenge",
    description: "End your shower with 30 seconds of cold water for 7 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "special",
    points: 120,
    reward: "40 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-gratitude-journal",
    title: "Gratitude Practice",
    description: "Write down 3 things you're grateful for daily for 7 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "special",
    points: 100,
    reward: "30 bonus points",
    difficulty: "easy"
  },
  {
    id: "challenge-hiit-week",
    title: "HIIT Week",
    description: "Complete 4 HIIT workouts in a week",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 4,
    progress: 0,
    completed: false,
    category: "workout",
    points: 200,
    reward: "70 bonus points",
    difficulty: "hard"
  },
  {
    id: "challenge-burpee-master",
    title: "Burpee Master",
    description: "Complete 50 burpees daily for 5 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 5,
    progress: 0,
    completed: false,
    category: "workout",
    points: 250,
    reward: "80 bonus points",
    difficulty: "hard"
  },
  {
    id: "challenge-intermittent-fasting",
    title: "Intermittent Fasting",
    description: "Follow a 16:8 intermittent fasting schedule for 7 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "nutrition",
    points: 200,
    reward: "70 bonus points",
    difficulty: "hard"
  },
  {
    id: "challenge-yoga-week",
    title: "Yoga Week",
    description: "Complete a 20-minute yoga session daily for 7 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    target: 7,
    progress: 0,
    completed: false,
    category: "workout",
    points: 150,
    reward: "50 bonus points",
    difficulty: "medium"
  },
  {
    id: "challenge-posture-check",
    title: "Posture Perfect",
    description: "Set hourly reminders to check and correct your posture for 5 days",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    target: 5,
    progress: 0,
    completed: false,
    category: "special",
    points: 100,
    reward: "30 bonus points",
    difficulty: "easy"
  }
];

// Helper function to generate daily quests
const generateDefaultDailyQuests = (): DailyQuest[] => {
  const today = new Date().toISOString().split('T')[0]; // Use YYYY-MM-DD format
  const macroStore = useMacroStore.getState();
  const userFitnessLevel = macroStore.userProfile.fitnessLevel || 'beginner';
  
  // Generate quests based on fitness level
  if (userFitnessLevel === 'beginner') {
    return [
      {
        id: `quest-beginner-workout-${Date.now()}`,
        title: "First Steps",
        description: "Complete a 15-minute beginner workout",
        completed: false,
        date: today,
        points: 15,
        category: "workout",
        fitnessLevel: ['beginner']
      },
      {
        id: `quest-beginner-steps-${Date.now()}`,
        title: "Daily Walk",
        description: "Take 5,000 steps today",
        completed: false,
        date: today,
        points: 10,
        category: "steps",
        fitnessLevel: ['beginner']
      },
      {
        id: `quest-beginner-water-${Date.now()}`,
        title: "Stay Hydrated",
        description: "Drink 6 glasses of water today",
        completed: false,
        date: today,
        points: 8,
        category: "nutrition",
        fitnessLevel: ['beginner']
      },
      {
        id: `quest-beginner-stretch-${Date.now()}`,
        title: "Gentle Stretch",
        description: "Do 5 minutes of stretching",
        completed: false,
        date: today,
        points: 10,
        category: "workout",
        fitnessLevel: ['beginner']
      }
    ];
  }
  
  // Intermediate/Advanced quests
  return [
    {
      id: `quest-workout-${Date.now()}`,
      title: "Daily Workout",
      description: "Complete at least one workout today",
      completed: false,
      date: today,
      points: 20,
      category: "workout",
      fitnessLevel: ['intermediate', 'advanced']
    },
    {
      id: `quest-steps-${Date.now()}`,
      title: "Step Goal",
      description: "Reach 8,000 steps today",
      completed: false,
      date: today,
      points: 15,
      category: "steps",
      fitnessLevel: ['intermediate', 'advanced']
    },
    {
      id: `quest-water-${Date.now()}`,
      title: "Stay Hydrated",
      description: "Log at least 2L of water today",
      completed: false,
      date: today,
      points: 10,
      category: "nutrition",
      fitnessLevel: ['intermediate', 'advanced']
    },
    {
      id: `quest-protein-${Date.now()}`,
      title: "Protein Goal",
      description: "Meet your protein goal for today",
      completed: false,
      date: today,
      points: 15,
      category: "nutrition",
      fitnessLevel: ['intermediate', 'advanced']
    }
  ];
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      // New state for gamification toggle
      gamificationEnabled: true,
      onboardingCompleted: false,
      achievements: [...defaultAchievements],
      unlockedAchievements: [],
      challenges: [...defaultChallenges],
      activeChallenge: null,
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastWorkoutDate: "",
        streakDates: []
      },
      points: 0,
      level: 1,
      rewards: [...defaultRewards],
      dailyQuests: generateDefaultDailyQuests(),
      recentlyUnlocked: [],
      showCelebration: false,
      celebrationAchievement: null,
      showChallengeCelebration: false,
      celebrationChallenge: null,
      progressionTracker: {
        currentFitnessLevel: 'beginner',
        workoutsCompleted: 0,
        streakRecord: 0,
        totalPoints: 0,
        timeAtCurrentLevel: 0,
        readyForProgression: false,
        lastProgressionCheck: new Date().toISOString(),
        progressionCriteria: {
          workouts: 10, // Complete 10 workouts to progress from beginner
          streak: 3, // Maintain 3-day streak
          points: 200, // Earn 200 points
          timeRequired: 14 // Stay at level for at least 2 weeks
        }
      },
      
      // New action to toggle gamification
      toggleGamification: (enabled) => set({ gamificationEnabled: enabled }),
      
      // New action to set onboarding completed
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      
      initializeAchievements: () => {
        // Skip initialization if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        // This function is called when the app starts
        // It checks if achievements need to be updated based on existing data
        const { checkAchievements, generateDailyQuests, updateStreak } = get();
        
        // Check if we need to generate new daily quests
        const { dailyQuests } = get();
        if (dailyQuests.length === 0 || 
            new Date(dailyQuests[0].date).toDateString() !== new Date().toDateString()) {
          generateDailyQuests();
        }
        
        // Update streak information
        updateStreak();
        
        // Check achievements based on existing data
        checkAchievements();
      },
      
      checkAchievements: () => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        const { achievements, updateAchievementProgress, unlockAchievement } = get();
        const workoutStore = useWorkoutStore.getState();
        const healthStore = useHealthStore.getState();
        
        // Check workout achievements
        const completedWorkouts = workoutStore.workoutLogs.filter(log => log.completed).length;
        
        achievements.forEach(achievement => {
          let progress = 0;
          
          switch (achievement.id) {
            // Workout achievements
            case "workout-first":
            case "workout-5":
            case "workout-10":
            case "workout-25":
            case "workout-50":
            case "workout-100":
            case "workout-200":
            case "workout-365":
              progress = completedWorkouts;
              break;
              
            // Workout type achievements
            case "workout-strength-10":
            case "workout-strength-50":
            case "workout-strength-100":
              const strengthWorkouts = workoutStore.workoutLogs.filter(log => {
                if (!log.completed) return false;
                const workout = workoutStore.workouts.find(w => w.id === log.workoutId);
                return workout && workout.category === "strength";
              }).length;
              progress = strengthWorkouts;
              break;
              
            case "workout-cardio-10":
            case "workout-cardio-50":
            case "workout-cardio-100":
              const cardioWorkouts = workoutStore.workoutLogs.filter(log => {
                if (!log.completed) return false;
                const workout = workoutStore.workouts.find(w => w.id === log.workoutId);
                return workout && workout.category === "cardio";
              }).length;
              progress = cardioWorkouts;
              break;
              
            case "workout-flexibility-10":
            case "workout-flexibility-30":
            case "workout-flexibility-50":
              const flexibilityWorkouts = workoutStore.workoutLogs.filter(log => {
                if (!log.completed) return false;
                const workout = workoutStore.workouts.find(w => w.id === log.workoutId);
                return workout && workout.category === "flexibility";
              }).length;
              progress = flexibilityWorkouts;
              break;
              
            // Workout duration achievements
            case "workout-duration-30":
            case "workout-duration-60":
            case "workout-duration-90":
            case "workout-duration-120":
              // These would need to be checked when a workout is completed
              // based on the duration of the workout
              break;
              
            // Workout variety achievements
            case "workout-variety-5":
            case "workout-variety-10":
            case "workout-variety-15":
            case "workout-variety-20":
              const uniqueWorkoutTypes = new Set(
                workoutStore.workoutLogs
                  .filter(log => log.completed)
                  .map(log => {
                    const workout = workoutStore.workouts.find(w => w.id === log.workoutId);
                    return workout ? workout.name : '';
                  })
                  .filter(name => name !== '')
              ).size;
              progress = uniqueWorkoutTypes;
              break;
              
            // Time-based workout achievements
            case "workout-early-bird":
            case "workout-early-bird-20":
              const earlyWorkouts = workoutStore.workoutLogs.filter(log => {
                if (!log.completed) return false;
                const workoutTime = new Date(log.date);
                return workoutTime.getHours() < 8;
              }).length;
              progress = earlyWorkouts;
              break;
              
            case "workout-night-owl":
            case "workout-night-owl-20":
              const nightWorkouts = workoutStore.workoutLogs.filter(log => {
                if (!log.completed) return false;
                const workoutTime = new Date(log.date);
                return workoutTime.getHours() >= 20;
              }).length;
              progress = nightWorkouts;
              break;
              
            case "workout-weekend-warrior":
            case "workout-weekend-warrior-25":
            case "workout-weekend-warrior-50":
              const weekendWorkouts = workoutStore.workoutLogs.filter(log => {
                if (!log.completed) return false;
                const workoutDay = new Date(log.date).getDay();
                return workoutDay === 0 || workoutDay === 6; // Sunday or Saturday
              }).length;
              progress = weekendWorkouts;
              break;
              
            // Streak achievements
            case "streak-3":
            case "streak-7":
            case "streak-14":
            case "streak-30":
            case "streak-45":
            case "streak-60":
            case "streak-90":
            case "streak-180":
            case "streak-365":
              progress = get().streak.currentStreak;
              break;
              
            // Streak comeback achievement
            case "streak-comeback":
            case "streak-comeback-major":
              // This would need special handling when a user resumes after a break
              break;
              
            // Weekly consistency achievement
            case "streak-3-weeks":
            case "streak-weekly-4":
            case "streak-weekly-5":
            case "streak-monthly-12":
              // This would need special tracking of weekly workout counts
              break;
              
            // Weight achievements
            case "weight-track-7":
            case "weight-track-30":
            case "weight-track-90":
            case "weight-track-180":
            case "weight-track-365": {
              // Count consecutive days of weight tracking
              const weightLogsTrack = healthStore.weightLogs;
              if (weightLogsTrack.length > 0) {
                const sortedLogs = [...weightLogsTrack].sort(
                  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                
                let consecutiveDays = 1;
                let currentDate = new Date(sortedLogs[0].date);
                
                for (let i = 1; i < sortedLogs.length; i++) {
                  const prevDate = new Date(sortedLogs[i].date);
                  const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (diffDays === 1) {
                    consecutiveDays++;
                    currentDate = prevDate;
                  } else {
                    break;
                  }
                }
                
                progress = consecutiveDays;
              }
              break;
            }
              
            case "weight-loss-1":
            case "weight-loss-5":
            case "weight-loss-10":
            case "weight-loss-15":
            case "weight-loss-20": {
              // Calculate weight loss from first to latest log
              const weightLogsLoss = healthStore.weightLogs;
              if (weightLogsLoss.length >= 2) {
                const sortedLogs = [...weightLogsLoss].sort(
                  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                
                const firstWeight = sortedLogs[0].weight;
                const latestWeight = sortedLogs[sortedLogs.length - 1].weight;
                const weightLoss = Math.max(0, firstWeight - latestWeight);
                
                progress = weightLoss;
              }
              break;
            }
              
            case "weight-goal-reached":
              // This would need to be checked against the user's weight goal
              break;
              
            case "weight-maintain-30":
            case "weight-maintain-90":
            case "weight-maintain-180":
            case "weight-maintain-365":
              // These would need special tracking of weight maintenance
              break;
              
            case "weight-bmi-healthy":
              // This would need BMI calculation
              break;
              
            // Steps achievements
            case "steps-5000":
            case "steps-10000":
            case "steps-15000":
            case "steps-20000":
            case "steps-25000":
            case "steps-30000":
            case "steps-35000":
            case "steps-40000":
            case "steps-50000":
              // Get today's steps
              const todaySteps = healthStore.getStepsForDate(new Date().toISOString())?.steps || 0;
              progress = todaySteps;
              break;
              
            case "steps-100k":
              // Calculate weekly steps
              const weeklySteps = healthStore.getStepsForWeek()
                .reduce((total, log) => total + log.steps, 0);
              progress = weeklySteps;
              break;
              
            case "steps-250k":
            case "steps-500k":
            case "steps-750k":
              // Calculate monthly steps
              const monthlySteps = healthStore.getStepsForMonth()
                .reduce((total, log) => total + log.steps, 0);
              progress = monthlySteps;
              break;
              
            case "steps-1m":
            case "steps-2m":
            case "steps-5m":
              // Calculate total steps
              const totalSteps = healthStore.stepLogs
                .reduce((total, log) => total + log.steps, 0);
              progress = totalSteps;
              break;
              
            case "steps-streak-7":
            case "steps-streak-30":
            case "steps-streak-60":
            case "steps-streak-90":
            case "steps-streak-180":
            case "steps-streak-365":
              // These would need special tracking of step streaks
              break;
              
            case "steps-weekend-50k":
            case "steps-weekend-100k":
              // This would need special tracking of weekend steps
              break;
              
            // Special achievements
            case "special-first-photo":
            case "special-photo-series":
            case "special-photo-series-12":
              // These would need to be integrated with the photo store
              break;
              
            default:
              // Other achievements will be updated directly from their respective actions
              break;
          }
          
          // Update progress if needed
          if (progress > 0 && progress !== achievement.progress) {
            updateAchievementProgress(achievement.id, progress);
            
            // Check if achievement should be unlocked
            if (progress >= achievement.target && !achievement.completed) {
              unlockAchievement(achievement.id);
            }
          }
        });
      },
      
      unlockAchievement: (achievementId) => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        set(state => {
          const achievement = state.achievements.find(a => a.id === achievementId);
          
          if (!achievement || achievement.completed) {
            return state;
          }
          
          // Mark achievement as completed
          const updatedAchievements = state.achievements.map(a => 
            a.id === achievementId 
              ? { ...a, completed: true, dateCompleted: new Date().toISOString() } 
              : a
          );
          
          // Add to unlocked achievements
          const unlockedAchievement = updatedAchievements.find(a => a.id === achievementId)!;
          
          // Add points
          const newPoints = state.points + unlockedAchievement.points;
          
          // Calculate new level
          const newLevel = get().calculateLevel(newPoints);
          
          // Show celebration
          return {
            achievements: updatedAchievements,
            unlockedAchievements: [...state.unlockedAchievements, unlockedAchievement],
            recentlyUnlocked: [...state.recentlyUnlocked, unlockedAchievement],
            points: newPoints,
            level: newLevel,
            showCelebration: true,
            celebrationAchievement: unlockedAchievement
          };
        });
      },
      
      updateAchievementProgress: (achievementId, progress) => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        set(state => ({
          achievements: state.achievements.map(a => 
            a.id === achievementId 
              ? { ...a, progress: Math.min(progress, a.target) } 
              : a
          )
        }));
      },
      
      startChallenge: (challenge) => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        set(state => ({
          challenges: [...state.challenges, challenge],
          activeChallenge: challenge
        }));
      },
      
      completeChallenge: (challengeId) => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        set(state => {
          const challenge = state.challenges.find(c => c.id === challengeId);
          
          if (!challenge || challenge.completed) {
            return state;
          }
          
          // Mark challenge as completed
          const updatedChallenges = state.challenges.map(c => 
            c.id === challengeId 
              ? { ...c, completed: true } 
              : c
          );
          
          // Add points
          const newPoints = state.points + challenge.points;
          
          // Calculate new level
          const newLevel = get().calculateLevel(newPoints);
          
          // Get the completed challenge for celebration
          const completedChallenge = updatedChallenges.find(c => c.id === challengeId);
          
          return {
            challenges: updatedChallenges,
            points: newPoints,
            level: newLevel,
            activeChallenge: null,
            showChallengeCelebration: true,
            celebrationChallenge: completedChallenge
          };
        });
      },
      
      updateChallengeProgress: (challengeId, progress) => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        set(state => {
          const challenge = state.challenges.find(c => c.id === challengeId);
          
          if (!challenge) {
            return state;
          }
          
          const updatedChallenges = state.challenges.map(c => 
            c.id === challengeId 
              ? { 
                  ...c, 
                  progress: Math.min(progress, c.target),
                  completed: progress >= c.target ? true : c.completed
                } 
              : c
          );
          
          // If challenge is completed, add points and show celebration
          if (progress >= challenge.target && !challenge.completed) {
            const newPoints = state.points + challenge.points;
            const newLevel = get().calculateLevel(newPoints);
            const completedChallenge = updatedChallenges.find(c => c.id === challengeId);
            
            return {
              challenges: updatedChallenges,
              points: newPoints,
              level: newLevel,
              activeChallenge: null,
              showChallengeCelebration: true,
              celebrationChallenge: completedChallenge
            };
          }
          
          return {
            challenges: updatedChallenges
          };
        });
      },
      
      updateStreak: () => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        set(state => {
          const workoutStore = useWorkoutStore.getState();
          const workoutLogs = workoutStore.workoutLogs;
          
          if (workoutLogs.length === 0) {
            return state;
          }
          
          // Sort logs by date (newest first)
          const sortedLogs = [...workoutLogs]
            .filter(log => log.completed)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          if (sortedLogs.length === 0) {
            return state;
          }
          
          const lastWorkoutDate = new Date(sortedLogs[0].date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          // Check if last workout was today or yesterday
          const lastWorkoutDay = new Date(lastWorkoutDate);
          lastWorkoutDay.setHours(0, 0, 0, 0);
          
          const isToday = lastWorkoutDay.getTime() === today.getTime();
          const isYesterday = lastWorkoutDay.getTime() === yesterday.getTime();
          
          // Get unique workout dates
          const workoutDates = new Set<string>();
          sortedLogs.forEach(log => {
            const date = new Date(log.date);
            workoutDates.add(date.toDateString());
          });
          
          // Convert to array and sort
          const streakDates = Array.from(workoutDates).sort((a, b) => 
            new Date(b).getTime() - new Date(a).getTime()
          );
          
          // Calculate current streak
          let currentStreak = 0;
          
          if (isToday || isYesterday) {
            currentStreak = 1; // Start with today or yesterday
            
            // Check consecutive days
            const checkDate = isToday ? yesterday : new Date(yesterday);
            checkDate.setDate(checkDate.getDate() - 1);
            
            while (true) {
              const dateString = checkDate.toDateString();
              if (streakDates.includes(dateString)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
              } else {
                break;
              }
            }
          }
          
          // Update longest streak if needed
          const longestStreak = Math.max(state.streak.longestStreak, currentStreak);
          
          return {
            streak: {
              currentStreak,
              longestStreak,
              lastWorkoutDate: sortedLogs[0].date,
              streakDates
            }
          };
        });
      },
      
      resetStreak: () => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        set({
          streak: {
            currentStreak: 0,
            longestStreak: 0,
            lastWorkoutDate: "",
            streakDates: []
          }
        });
      },
      
      addPoints: (points) => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        set(state => {
          const newPoints = state.points + points;
          const newLevel = get().calculateLevel(newPoints);
          
          return {
            points: newPoints,
            level: newLevel
          };
        });
      },
      
      calculateLevel: (points) => {
        for (let i = 0; i < levels.length; i++) {
          if (points >= levels[i].minPoints && points <= levels[i].maxPoints) {
            return levels[i].level;
          }
        }
        return levels[levels.length - 1].level;
      },
      
      unlockReward: (rewardId) => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        set(state => {
          const reward = state.rewards.find(r => r.id === rewardId);
          
          if (!reward || reward.unlocked) {
            return state;
          }
          
          // Check if user has enough points
          if (state.points < reward.cost) {
            return state;
          }
          
          // Unlock reward and deduct points
          return {
            rewards: state.rewards.map(r => 
              r.id === rewardId 
                ? { ...r, unlocked: true, dateUnlocked: new Date().toISOString() } 
                : r
            ),
            points: state.points - reward.cost
          };
        });
      },
      
      useReward: (rewardId) => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        set(state => ({
          rewards: state.rewards.map(r => 
            r.id === rewardId 
              ? { ...r, used: true, dateUsed: new Date().toISOString() } 
              : r
          )
        }));
      },
      
      generateDailyQuests: () => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        const today = new Date().toISOString().split('T')[0]; // Get today's date as YYYY-MM-DD
        
        // Check if we already have quests for today
        const existingQuests = get().dailyQuests;
        const todayQuests = existingQuests.filter(q => q.date.startsWith(today));
        
        // Only generate new quests if we don't have any for today
        if (todayQuests.length === 0) {
          set({
            dailyQuests: generateDefaultDailyQuests()
          });
        }
      },
      
      completeDailyQuest: (questId) => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        set(state => {
          const quest = state.dailyQuests.find(q => q.id === questId);
          
          if (!quest || quest.completed) {
            return state;
          }
          
          // Mark quest as completed and add points
          return {
            dailyQuests: state.dailyQuests.map(q => 
              q.id === questId ? { ...q, completed: true } : q
            ),
            points: state.points + quest.points
          };
        });
      },
      
      resetDailyQuests: () => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        const today = new Date().toISOString().split('T')[0];
        
        set(state => ({
          dailyQuests: state.dailyQuests.filter(q => !q.date.startsWith(today))
        }));
      },

      // New method to automatically check and complete quests based on health data
      checkAndAutoCompleteQuests: () => {
        // Skip if gamification is disabled
        if (!get().gamificationEnabled) return;
        
        const { dailyQuests, completeDailyQuest } = get();
        const healthStore = useHealthStore.getState();
        
        // Get today's active quests using YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        const activeQuests = dailyQuests.filter(q => 
          q.date.startsWith(today) && !q.completed
        );
        
        activeQuests.forEach(quest => {
          let shouldComplete = false;
          
          switch (quest.category) {
            case 'steps': {
              // Check step-based quests
              const stepCount = healthStore.stepCount || 0;
              const stepMatches = quest.description.match(/(\d+)\s*(steps|step)/i);
              
              if (stepMatches) {
                const targetSteps = parseInt(stepMatches[1]);
                shouldComplete = stepCount >= targetSteps;
              }
              break;
            }
            
            case 'nutrition': {
              // Check water intake quests
              const waterIntake = healthStore.waterIntake || [];
              const today = new Date().toDateString();
              
              // Calculate today's water intake in ml
              const todayWaterIntake = waterIntake
                .filter(entry => new Date(entry.date).toDateString() === today)
                .reduce((total, entry) => total + entry.amount, 0);
              
              // Check for glass-based quests (e.g., "6 glasses")
              const glassMatches = quest.description.match(/(\d+)\s*(glasses|glass)/i);
              if (glassMatches) {
                const targetGlasses = parseInt(glassMatches[1]);
                const glassSize = 250; // ml per glass
                const targetWater = targetGlasses * glassSize;
                shouldComplete = todayWaterIntake >= targetWater;
              }
              
              // Check for liter-based quests (e.g., "2L")
              const literMatches = quest.description.match(/(\d+(?:\.\d+)?)\s*(l|liter|liters)/i);
              if (literMatches && !shouldComplete) {
                const targetLiters = parseFloat(literMatches[1]);
                const targetWater = targetLiters * 1000; // Convert to ml
                shouldComplete = todayWaterIntake >= targetWater;
              }
              break;
            }
            
            case 'workout': {
              // Workout quests are handled manually when workouts are completed
              // This is already implemented in workoutStore.ts
              break;
            }
          }
          
          // Auto-complete the quest if conditions are met
          if (shouldComplete) {
            completeDailyQuest(quest.id);
            
            // Show a brief celebration for auto-completed quests
            set(state => ({
              showCelebration: true,
              celebrationAchievement: {
                id: quest.id,
                title: quest.title,
                description: quest.description,
                category: quest.category,
                icon: "🎯",
                tier: "bronze",
                progress: 100,
                target: 100,
                completed: true,
                points: quest.points
              }
            }));
            
            // Clear celebration after 3 seconds
            setTimeout(() => {
              set(state => ({
                showCelebration: false,
                celebrationAchievement: null
              }));
            }, 3000);
          }
        });
      },
      
      clearCelebration: () => set({
        showCelebration: false,
        celebrationAchievement: null
      }),
      
      clearChallengeCelebration: () => set({
        showChallengeCelebration: false,
        celebrationChallenge: null
      }),
      
      getAchievementsByCategory: (category) => {
        const { achievements } = get();
        return achievements.filter(a => a.category === category);
      },
      
      getRecentAchievements: (count) => {
        const { unlockedAchievements } = get();
        
        return [...unlockedAchievements]
          .sort((a, b) => {
            if (!a.dateCompleted || !b.dateCompleted) return 0;
            return new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime();
          })
          .slice(0, count);
      },
      
      getNextAchievements: (count) => {
        const { achievements } = get();
        
        // Get incomplete achievements with some progress
        const inProgress = achievements
          .filter(a => !a.completed && a.progress > 0)
          .sort((a, b) => (b.progress / b.target) - (a.progress / a.target));
        
        // Get incomplete achievements with no progress
        const notStarted = achievements
          .filter(a => !a.completed && a.progress === 0);
        
        return [...inProgress, ...notStarted].slice(0, count);
      },
      
      getCurrentLevel: () => {
        const { level } = get();
        return levels.find(l => l.level === level) || levels[0];
      },
      
      getNextLevel: () => {
        const { level } = get();
        return levels.find(l => l.level === level + 1) || levels[levels.length - 1];
      },
      
      getLevelProgress: () => {
        const { points, level } = get();
        const currentLevel = levels.find(l => l.level === level) || levels[0];
        const nextLevel = levels.find(l => l.level === level + 1) || levels[levels.length - 1];
        
        const pointsInLevel = points - currentLevel.minPoints;
        const pointsToNextLevel = nextLevel.minPoints - currentLevel.minPoints;
        
        return Math.min(100, Math.floor((pointsInLevel / pointsToNextLevel) * 100));
      },
      
      getAvailableRewards: () => {
        const { rewards, points } = get();
        
        return rewards.filter(r => !r.unlocked && points >= r.cost);
      },
      
      getActiveDailyQuests: () => {
        const { dailyQuests, gamificationEnabled } = get();
        
        // Return empty array if gamification is disabled
        if (!gamificationEnabled) return [];
        
        const today = new Date().toDateString();
        
        return dailyQuests.filter(q => 
          new Date(q.date).toDateString() === today && !q.completed
        );
      },
      
      getStreakInfo: () => {
        const { streak } = get();
        
        // Calculate next milestone
        let nextMilestone = 0;
        if (streak.currentStreak < 3) nextMilestone = 3;
        else if (streak.currentStreak < 7) nextMilestone = 7;
        else if (streak.currentStreak < 14) nextMilestone = 14;
        else if (streak.currentStreak < 30) nextMilestone = 30;
        else if (streak.currentStreak < 45) nextMilestone = 45;
        else if (streak.currentStreak < 60) nextMilestone = 60;
        else if (streak.currentStreak < 90) nextMilestone = 90;
        else if (streak.currentStreak < 180) nextMilestone = 180;
        else if (streak.currentStreak < 365) nextMilestone = 365;
        else nextMilestone = Math.ceil(streak.currentStreak / 30) * 30;
        
        // Calculate days to next reward
        const daysToNextReward = nextMilestone - streak.currentStreak;
        
        return {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          nextMilestone,
          daysToNextReward
        };
      },

      // New fitness level and progression methods
      getUserFitnessLevel: (): FitnessLevel => {
        const macroStore = useMacroStore.getState();
        return macroStore.userProfile.fitnessLevel || 'beginner';
      },

      getAppropriateAchievements: () => {
        const { achievements, getUserFitnessLevel } = get();
        const userLevel = getUserFitnessLevel();
        
        return achievements.filter(achievement => {
          if (!achievement.fitnessLevel) return true; // If no level specified, show to all
          return achievement.fitnessLevel.includes(userLevel);
        });
      },

      getAppropriateChallenges: () => {
        const { challenges, getUserFitnessLevel } = get();
        const userLevel = getUserFitnessLevel();
        
        return challenges.filter(challenge => {
          if (!challenge.fitnessLevel) return true; // If no level specified, show to all
          return challenge.fitnessLevel.includes(userLevel);
        });
      },

      getAppropriateDailyQuests: () => {
        const { dailyQuests, getUserFitnessLevel } = get();
        const userLevel = getUserFitnessLevel();
        
        return dailyQuests.filter(quest => {
          if (!quest.fitnessLevel) return true; // If no level specified, show to all
          return quest.fitnessLevel.includes(userLevel);
        });
      },

      checkProgressionEligibility: () => {
        const { progressionTracker, getUserFitnessLevel } = get();
        const workoutStore = useWorkoutStore.getState();
        const currentLevel = getUserFitnessLevel();
        
        // Don't suggest progression if already at advanced level
        if (currentLevel === 'advanced') return false;
        
        // Update progression tracker with current stats
        const completedWorkouts = workoutStore.workoutLogs.filter(log => log.completed).length;
        const currentStreak = get().streak.currentStreak;
        const totalPoints = get().points;
        
        // Check if user meets all criteria for progression
        const meetsWorkouts = completedWorkouts >= progressionTracker.progressionCriteria.workouts;
        const meetsStreak = currentStreak >= progressionTracker.progressionCriteria.streak;
        const meetsPoints = totalPoints >= progressionTracker.progressionCriteria.points;
        
        // Check time at current level
        const daysSinceLastCheck = Math.floor(
          (new Date().getTime() - new Date(progressionTracker.lastProgressionCheck).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        const meetsTimeRequirement = daysSinceLastCheck >= progressionTracker.progressionCriteria.timeRequired;
        
        return meetsWorkouts && meetsStreak && meetsPoints && meetsTimeRequirement;
      },

      suggestProgression: () => {
        const { progressionTracker, getUserFitnessLevel, checkProgressionEligibility } = get();
        const workoutStore = useWorkoutStore.getState();
        const currentLevel = getUserFitnessLevel();
        const isReady = checkProgressionEligibility();
        
        const nextLevel: FitnessLevel = currentLevel === 'beginner' ? 'intermediate' : 'advanced';
        
        const completedWorkouts = workoutStore.workoutLogs.filter(log => log.completed).length;
        const currentStreak = get().streak.currentStreak;
        const totalPoints = get().points;
        
        const daysSinceLastCheck = Math.floor(
          (new Date().getTime() - new Date(progressionTracker.lastProgressionCheck).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        
        const criteria = [
          `Complete ${progressionTracker.progressionCriteria.workouts} workouts`,
          `Maintain ${progressionTracker.progressionCriteria.streak}-day streak`,
          `Earn ${progressionTracker.progressionCriteria.points} points`,
          `Stay at current level for ${progressionTracker.progressionCriteria.timeRequired} days`
        ];
        
        const completedCriteria = [];
        if (completedWorkouts >= progressionTracker.progressionCriteria.workouts) {
          completedCriteria.push(`✓ Completed ${completedWorkouts} workouts`);
        } else {
          completedCriteria.push(`${completedWorkouts}/${progressionTracker.progressionCriteria.workouts} workouts completed`);
        }
        
        if (currentStreak >= progressionTracker.progressionCriteria.streak) {
          completedCriteria.push(`✓ ${currentStreak}-day streak achieved`);
        } else {
          completedCriteria.push(`${currentStreak}/${progressionTracker.progressionCriteria.streak} day streak`);
        }
        
        if (totalPoints >= progressionTracker.progressionCriteria.points) {
          completedCriteria.push(`✓ ${totalPoints} points earned`);
        } else {
          completedCriteria.push(`${totalPoints}/${progressionTracker.progressionCriteria.points} points earned`);
        }
        
        if (daysSinceLastCheck >= progressionTracker.progressionCriteria.timeRequired) {
          completedCriteria.push(`✓ ${daysSinceLastCheck} days at current level`);
        } else {
          completedCriteria.push(`${daysSinceLastCheck}/${progressionTracker.progressionCriteria.timeRequired} days at current level`);
        }
        
        return {
          ready: isReady,
          nextLevel,
          criteria,
          completedCriteria
        };
      },

      updateProgressionTracker: () => {
        const { progressionTracker, getUserFitnessLevel } = get();
        const workoutStore = useWorkoutStore.getState();
        
        const completedWorkouts = workoutStore.workoutLogs.filter(log => log.completed).length;
        const currentStreak = get().streak.currentStreak;
        const totalPoints = get().points;
        const currentLevel = getUserFitnessLevel();
        
        // Update progression criteria based on current level
        let newCriteria = progressionTracker.progressionCriteria;
        
        if (currentLevel === 'intermediate') {
          newCriteria = {
            workouts: 25, // More workouts needed to progress to advanced
            streak: 7, // Longer streak required
            points: 500, // More points needed
            timeRequired: 21 // 3 weeks at intermediate level
          };
        }
        
        set({
          progressionTracker: {
            ...progressionTracker,
            currentFitnessLevel: currentLevel,
            workoutsCompleted: completedWorkouts,
            streakRecord: Math.max(progressionTracker.streakRecord, currentStreak),
            totalPoints,
            progressionCriteria: newCriteria,
            readyForProgression: get().checkProgressionEligibility()
          }
        });
      },

      acceptProgression: () => {
        const { getUserFitnessLevel } = get();
        const currentLevel = getUserFitnessLevel();
        const nextLevel: FitnessLevel = currentLevel === 'beginner' ? 'intermediate' : 'advanced';
        
        // Update user profile fitness level
        const macroStore = useMacroStore.getState();
        macroStore.updateUserProfile({
          ...macroStore.userProfile,
          fitnessLevel: nextLevel
        });
        
        // Reset progression tracker for new level
        set({
          progressionTracker: {
            currentFitnessLevel: nextLevel,
            workoutsCompleted: 0,
            streakRecord: 0,
            totalPoints: 0,
            timeAtCurrentLevel: 0,
            readyForProgression: false,
            lastProgressionCheck: new Date().toISOString(),
            progressionCriteria: nextLevel === 'intermediate' ? {
              workouts: 25,
              streak: 7,
              points: 500,
              timeRequired: 21
            } : {
              workouts: 50,
              streak: 14,
              points: 1000,
              timeRequired: 30
            }
          }
        });
        
        // Award bonus points for progression
        get().addPoints(100);
      },

      generateBeginnerFriendlyQuests: () => {
        const today = new Date().toISOString();
        
        const beginnerQuests: DailyQuest[] = [
          {
            id: `quest-beginner-workout-${Date.now()}`,
            title: "First Steps",
            description: "Complete a 15-minute beginner workout",
            completed: false,
            date: today,
            points: 15,
            category: "workout",
            fitnessLevel: ['beginner']
          },
          {
            id: `quest-beginner-steps-${Date.now()}`,
            title: "Daily Walk",
            description: "Take 5,000 steps today",
            completed: false,
            date: today,
            points: 10,
            category: "steps",
            fitnessLevel: ['beginner']
          },
          {
            id: `quest-beginner-water-${Date.now()}`,
            title: "Stay Hydrated",
            description: "Drink 6 glasses of water today",
            completed: false,
            date: today,
            points: 8,
            category: "nutrition",
            fitnessLevel: ['beginner']
          },
          {
            id: `quest-beginner-stretch-${Date.now()}`,
            title: "Gentle Stretch",
            description: "Do 5 minutes of stretching",
            completed: false,
            date: today,
            points: 10,
            category: "workout",
            fitnessLevel: ['beginner']
          }
        ];
        
        return beginnerQuests;
      }
    }),
    {
      name: "gamification-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);