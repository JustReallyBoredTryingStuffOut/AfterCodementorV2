export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  weight: number;
  height: number;
  goal: string;
  activityLevel: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  muscleGroups: string[];
  calories: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroups: string[];
  equipment: string[];
  instructions: string[];
  tips: string[];
  image?: string;
  videoUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  caloriesPerMinute: number;
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  calories: number;
  exercises: ExerciseSession[];
  notes?: string;
  rating?: number;
}

export interface ExerciseSession {
  exerciseId: string;
  sets: Set[];
  notes?: string;
}

export interface Set {
  reps: number;
  weight: number;
  duration: number;
  restTime: number;
  completed: boolean;
}

export interface Nutrition {
  id: string;
  userId: string;
  date: Date;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterIntake: number;
  notes?: string;
}

export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: Food[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  time: Date;
  image?: string;
}

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
  brand?: string;
  barcode?: string;
  image?: string;
}

export interface Goal {
  id: string;
  userId: string;
  type: 'weight' | 'strength' | 'endurance' | 'flexibility' | 'nutrition';
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: Date;
  status: 'active' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress: number;
  maxProgress: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'workout' | 'nutrition' | 'streak' | 'social';
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  rewards: Reward[];
  participants: string[];
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'expired';
}

export interface Reward {
  id: string;
  type: 'points' | 'badge' | 'unlock' | 'discount';
  title: string;
  description: string;
  value: number;
  icon?: string;
}

export interface ProgressPhoto {
  id: string;
  userId: string;
  imageUri: string;
  date: Date;
  weight?: number;
  measurements?: {
    chest: number;
    waist: number;
    hips: number;
    arms: number;
    thighs: number;
  };
  notes?: string;
  isEncrypted: boolean;
}

export interface FoodPhoto {
  id: string;
  userId: string;
  imageUri: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  foods?: Food[];
  notes?: string;
  isEncrypted: boolean;
}

export interface HealthData {
  id: string;
  userId: string;
  date: Date;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  heartRate?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  sleepHours?: number;
  steps?: number;
  caloriesBurned?: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'workout' | 'nutrition' | 'goal' | 'achievement' | 'reminder';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    error: string;
    success: string;
    warning: string;
  };
  isDark: boolean;
}

export interface AppSettings {
  userId: string;
  theme: string;
  notifications: {
    workouts: boolean;
    nutrition: boolean;
    goals: boolean;
    achievements: boolean;
    reminders: boolean;
  };
  privacy: {
    shareProgress: boolean;
    shareWorkouts: boolean;
    shareNutrition: boolean;
    allowAnalytics: boolean;
  };
  units: {
    weight: 'kg' | 'lbs';
    height: 'cm' | 'ft';
    distance: 'km' | 'miles';
  };
  language: string;
  timezone: string;
  waterTrackingEnabled: boolean;
  waterTrackingMode: 'disabled' | 'minimal' | 'full';
}

export interface AIRecommendation {
  id: string;
  userId: string;
  type: 'workout' | 'nutrition' | 'goal';
  title: string;
  description: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface Schedule {
  id: string;
  userId: string;
  name: string;
  description?: string;
  workouts: ScheduledWorkout[];
  nutrition: ScheduledMeal[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledWorkout {
  id: string;
  workoutId: string;
  dayOfWeek: number;
  time: string;
  duration: number;
  completed: boolean;
}

export interface ScheduledMeal {
  id: string;
  mealId: string;
  dayOfWeek: number;
  time: string;
  completed: boolean;
}

export interface WaterIntake {
  id: string;
  userId: string;
  date: Date;
  amount: number;
  target: number;
  goal: number;
}

export interface Mood {
  id: string;
  userId: string;
  date: Date;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  energy: number;
  stress: number;
  notes?: string;
}

export interface SocialConnection {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
}

export interface WorkoutShare {
  id: string;
  userId: string;
  workoutSessionId: string;
  sharedWith: string[];
  message?: string;
  createdAt: Date;
}

export interface Analytics {
  userId: string;
  period: 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  workouts: {
    total: number;
    duration: number;
    calories: number;
    exercises: number;
  };
  nutrition: {
    totalCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFat: number;
    waterIntake: number;
  };
  goals: {
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
  };
  achievements: {
    total: number;
    unlocked: number;
  };
}

// Additional types for stores
export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MacroLog {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  mealType?: string;
}

export interface UserProfile {
  name: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  fitnessGoal: 'lose' | 'maintain' | 'gain';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  targetWeight?: number; // Optional target weight for lose/gain goals
  dateOfBirth: Date | null;
}

export interface FoodCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  mealTypes: string[];
}

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  notes?: string;
}

export interface StepLog {
  id: string;
  date: string;
  steps: number;
  caloriesBurned: number;
  distance: number;
}

export interface HealthGoals {
  dailySteps: number;
  weeklyWorkouts: number;
  targetWeight: number;
  targetDate: string;
}

export interface HealthDevice {
  id: string;
  name: string;
  type: 'fitness_tracker' | 'smartwatch' | 'heart_rate_monitor' | 'scale' | 'other';
  brand: string;
  model: string;
  isConnected: boolean;
  lastSync: string | null;
}

export interface ActivityLog {
  id: string;
  date: string;
  type: 'walking' | 'running' | 'cycling' | 'swimming' | 'workout' | 'other';
  duration: number;
  distance: number;
  calories: number;
  notes?: string;
}

export interface DeviceSync {
  id: string;
  deviceId: string;
  deviceName: string;
  syncTime: string;
  dataTypes: string[];
  success: boolean;
}

export interface DeviceData {
  steps?: number;
  heartRate?: number;
  weight?: number;
  calories?: number;
  distance?: number;
  sleepHours?: number;
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  date: string;
  duration: number;
  caloriesBurned: number;
  exercises: ExerciseLog[];
  notes?: string;
  rating?: number;
}

export interface ExerciseLog {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  duration: number;
  restTime: number;
  completed: boolean;
}

export interface WorkoutRating {
  id: string;
  workoutId: string;
  rating: number;
  difficulty: number;
  enjoyment: number;
  notes?: string;
}

export interface WorkoutMedia {
  id: string;
  workoutId: string;
  type: 'photo' | 'video';
  uri: string;
  timestamp: string;
}

export interface TimerSettings {
  restTime: number;
  setRestTime: number;
  workoutRestTime: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoStartRest: boolean;
  defaultSetCount: number;
}

export interface BodyRegion {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
}

export interface MuscleGroup {
  id: string;
  name: string;
  bodyRegion: string;
  exercises: string[];
}

export interface EquipmentType {
  id: string;
  name: string;
  category: string;
  exercises: string[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | 'reps' | 'duration' | 'distance';
  value: number;
  date: string;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  dueDate?: string;
}

export interface UserMood {
  id: string;
  userId: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  energy: number;
  stress: number;
  notes?: string;
}

export interface AiChat {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: any;
}

export interface AchievementCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  achievements: Achievement[];
} 