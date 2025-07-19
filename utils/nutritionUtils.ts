import { FoodItem, Meal, MacroLog } from '../types';

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Calculate total nutrition from a list of food items
 */
export const calculateNutritionFromFoodItems = (foodItems: FoodItem[]): NutritionTotals => {
  return foodItems.reduce((totals, item) => ({
    calories: totals.calories + (item.nutrition?.calories || 0),
    protein: totals.protein + (item.nutrition?.protein || 0),
    carbs: totals.carbs + (item.nutrition?.carbs || 0),
    fat: totals.fat + (item.nutrition?.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
};

/**
 * Calculate total nutrition from a meal
 */
export const calculateMealNutrition = (meal: Meal): NutritionTotals => {
  return calculateNutritionFromFoodItems(meal.foodItems);
};

/**
 * Calculate nutrition for multiple meals
 */
export const calculateMultipleMealsNutrition = (meals: Meal[]): NutritionTotals => {
  return meals.reduce((totals, meal) => {
    const mealNutrition = calculateMealNutrition(meal);
    return {
      calories: totals.calories + mealNutrition.calories,
      protein: totals.protein + mealNutrition.protein,
      carbs: totals.carbs + mealNutrition.carbs,
      fat: totals.fat + mealNutrition.fat,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
};

/**
 * Calculate nutrition from macro logs
 */
export const calculateNutritionFromLogs = (logs: MacroLog[]): NutritionTotals => {
  return logs.reduce((totals, log) => ({
    calories: totals.calories + (log.calories || 0),
    protein: totals.protein + (log.protein || 0),
    carbs: totals.carbs + (log.carbs || 0),
    fat: totals.fat + (log.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
};

/**
 * Calculate nutrition for a user (main function used in meal detail screen)
 */
export const calculateNutrition = (userId: string): NutritionTotals => {
  // This function calculates total nutrition for a user
  // In a real implementation, this would fetch user's nutrition data from stores
  // For now, return default values to prevent errors
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
};

/**
 * Calculate nutrition percentage based on goals
 */
export const calculateNutritionPercentages = (
  current: NutritionTotals,
  goals: NutritionTotals
): { calories: number; protein: number; carbs: number; fat: number } => {
  return {
    calories: goals.calories > 0 ? Math.min(100, (current.calories / goals.calories) * 100) : 0,
    protein: goals.protein > 0 ? Math.min(100, (current.protein / goals.protein) * 100) : 0,
    carbs: goals.carbs > 0 ? Math.min(100, (current.carbs / goals.carbs) * 100) : 0,
    fat: goals.fat > 0 ? Math.min(100, (current.fat / goals.fat) * 100) : 0,
  };
};

/**
 * Calculate remaining nutrition needed to reach goals
 */
export const calculateRemainingNutrition = (
  current: NutritionTotals,
  goals: NutritionTotals
): NutritionTotals => {
  return {
    calories: Math.max(0, goals.calories - current.calories),
    protein: Math.max(0, goals.protein - current.protein),
    carbs: Math.max(0, goals.carbs - current.carbs),
    fat: Math.max(0, goals.fat - current.fat),
  };
};

/**
 * Format nutrition values for display
 */
export const formatNutritionValue = (value: number, unit: string = ''): string => {
  return `${Math.round(value)}${unit}`;
};

/**
 * Get nutrition color based on percentage
 */
export const getNutritionColor = (percentage: number): string => {
  if (percentage >= 100) return '#28A745'; // Green for completed
  if (percentage >= 75) return '#17A2B8'; // Blue for good progress
  if (percentage >= 50) return '#FFC107'; // Yellow for moderate progress
  return '#DC3545'; // Red for low progress
};

/**
 * Calculate BMI
 */
export const calculateBMI = (weight: number, height: number): number => {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

/**
 * Get BMI category
 */
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 */
export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female'
): number => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 */
export const calculateTDEE = (
  bmr: number,
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
): number => {
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  
  return bmr * activityMultipliers[activityLevel];
};

/**
 * Calculate macro goals based on TDEE and fitness goal
 */
export const calculateMacroGoals = (
  tdee: number,
  weight: number,
  fitnessGoal: 'lose' | 'maintain' | 'gain'
): NutritionTotals => {
  // Adjust calories based on fitness goal
  let calorieGoal = tdee;
  switch (fitnessGoal) {
    case 'lose':
      calorieGoal = tdee - 500; // 500 calorie deficit
      break;
    case 'gain':
      calorieGoal = tdee + 500; // 500 calorie surplus
      break;
  }
  
  // Calculate protein (1.6-2.2g per kg)
  let proteinGoal = 0;
  switch (fitnessGoal) {
    case 'gain':
      proteinGoal = Math.round(weight * 2.2);
      break;
    case 'lose':
      proteinGoal = Math.round(weight * 2.0);
      break;
    default:
      proteinGoal = Math.round(weight * 1.6);
  }
  
  // Calculate fat (25% of calories)
  const fatGoal = Math.round((calorieGoal * 0.25) / 9);
  
  // Remaining calories from carbs
  const proteinCalories = proteinGoal * 4;
  const fatCalories = fatGoal * 9;
  const carbCalories = calorieGoal - proteinCalories - fatCalories;
  const carbGoal = Math.round(carbCalories / 4);
  
  return {
    calories: Math.round(calorieGoal),
    protein: proteinGoal,
    carbs: carbGoal,
    fat: fatGoal,
  };
}; 

// Hybrid calorie calculation system
import type { UserProfile } from '../types';

/**
 * Estimate calories burned for a workout/activity if HealthKit data is unavailable.
 * Uses user profile (weight, activity level, etc) and activity type/duration.
 */
export function estimateCaloriesBurned({
  weight,
  activityLevel,
  durationMinutes = 30,
  activityType = 'general',
}: {
  weight: number;
  activityLevel: string;
  durationMinutes?: number;
  activityType?: string;
}): number {
  // MET values for common activities
  const METS: Record<string, number> = {
    walking: 3.5,
    running: 7.5,
    cycling: 6.8,
    swimming: 6.0,
    hiking: 6.0,
    hiit: 8.0,
    strength: 5.0,
    general: 4.0,
  };
  const met = METS[activityType] || METS['general'];
  // Calories burned = MET * weight (kg) * duration (hr)
  return Math.round(met * weight * (durationMinutes / 60));
}

/**
 * Get calories burned for today, using HealthKit if available, otherwise estimate.
 * Pass in actualCalories (from HealthKit) if available, otherwise will estimate.
 */
export function getTodayCaloriesBurned({
  userProfile,
  actualCalories,
  fallbackActivityType = 'general',
  fallbackDuration = 30,
}: {
  userProfile: UserProfile;
  actualCalories?: number;
  fallbackActivityType?: string;
  fallbackDuration?: number;
}): { calories: number; source: 'actual' | 'estimate' } {
  if (typeof actualCalories === 'number' && actualCalories > 0) {
    return { calories: actualCalories, source: 'actual' };
  }
  // Estimate based on user profile
  const calories = estimateCaloriesBurned({
    weight: userProfile.weight,
    activityLevel: userProfile.activityLevel,
    durationMinutes: fallbackDuration,
    activityType: fallbackActivityType,
  });
  return { calories, source: 'estimate' };
} 