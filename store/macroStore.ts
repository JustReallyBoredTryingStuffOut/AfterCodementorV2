import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MacroGoals, MacroLog, UserProfile, FoodCategory } from "@/types";
import { foodCategories, getFoodCategoriesByMealType } from "@/mocks/foodCategories";

export interface MacroLog {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

interface MacroState {
  macroLogs: MacroLog[];
  macroGoals: MacroGoals;
  userProfile: UserProfile;
  
  // Actions
  addMacroLog: (log: MacroLog) => void;
  updateMacroLog: (log: MacroLog) => void;
  removeMacroLog: (id: string) => void;
  
  updateMacroGoals: (goals: MacroGoals) => void;
  updateUserProfile: (profile: UserProfile) => void;
  
  calculateDailyMacros: (date: string) => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  
  getMacroLogsByMealType: (date: string, mealType: string) => MacroLog[];
  
  getFoodCategories: (mealType: string) => FoodCategory[];
  
  calculateIdealMacros: () => MacroGoals;
  getNextMealTime: () => {
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    time: string;
  };
}

const defaultUserProfile: UserProfile = {
  name: "User",
  weight: 70, // kg
  height: 175, // cm
  age: 30,
  gender: "male",
  fitnessGoal: "maintain",
  activityLevel: "moderate",
  fitnessLevel: "beginner", // Added fitness level
  targetWeight: undefined, // Will be set based on fitness goal
  dateOfBirth: null,
};

const defaultMacroGoals: MacroGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

export const useMacroStore = create<MacroState>()(
  persist(
    (set, get) => ({
      macroLogs: [],
      macroGoals: defaultMacroGoals,
      userProfile: defaultUserProfile,
      
      addMacroLog: (log) => set((state) => ({
        macroLogs: [...state.macroLogs, log]
      })),
      
      updateMacroLog: (log) => set((state) => ({
        macroLogs: state.macroLogs.map(l => l.id === log.id ? log : l)
      })),
      
      removeMacroLog: (id) => set((state) => ({
        macroLogs: state.macroLogs.filter(l => l.id !== id)
      })),
      
      updateMacroGoals: (goals) => set({ macroGoals: goals }),
      
      updateUserProfile: (profile) => set((state) => {
        // Recalculate macro goals based on new profile
        const newGoals = calculateMacroGoals(profile);
        
        return { 
          userProfile: profile,
          macroGoals: newGoals
        };
      }),
      
      calculateDailyMacros: (date) => {
        const { macroLogs } = get();
        const dayLogs = macroLogs.filter(log => 
          new Date(log.date).toDateString() === new Date(date).toDateString()
        );
        
        return dayLogs.reduce((acc, log) => ({
          calories: acc.calories + log.calories,
          protein: acc.protein + log.protein,
          carbs: acc.carbs + log.carbs,
          fat: acc.fat + log.fat,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      },
      
      getMacroLogsByMealType: (date, mealType) => {
        const { macroLogs } = get();
        return macroLogs.filter(log => 
          new Date(log.date).toDateString() === new Date(date).toDateString() &&
          log.mealType === mealType
        );
      },
      
      getFoodCategories: (mealType) => {
        return getFoodCategoriesByMealType(mealType);
      },
      
      calculateIdealMacros: () => {
        const { userProfile } = get();
        return calculateMacroGoals(userProfile);
      },
      
      getNextMealTime: () => {
        const now = new Date();
        const hour = now.getHours();
        
        // Define meal times
        if (hour < 10) {
          return { mealType: "breakfast", time: "08:00" };
        } else if (hour < 14) {
          return { mealType: "lunch", time: "12:30" };
        } else if (hour < 19) {
          return { mealType: "dinner", time: "18:30" };
        } else {
          // Set breakfast for tomorrow
          return { mealType: "breakfast", time: "08:00" };
        }
      },
    }),
    {
      name: "macro-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper function to calculate macro goals based on user profile
function calculateMacroGoals(profile: UserProfile): MacroGoals {
  // Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
  let bmr = 0;
  
  if (profile.gender === "male") {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }
  
  // Apply activity multiplier
  let activityMultiplier = 1.2; // Sedentary
  
  switch (profile.activityLevel) {
    case "sedentary":
      activityMultiplier = 1.2;
      break;
    case "light":
      activityMultiplier = 1.375;
      break;
    case "moderate":
      activityMultiplier = 1.55;
      break;
    case "active":
      activityMultiplier = 1.725;
      break;
    case "very_active":
      activityMultiplier = 1.9;
      break;
  }
  
  // Calculate Total Daily Energy Expenditure (TDEE)
  let tdee = bmr * activityMultiplier;
  
  // Adjust based on fitness goal
  let calorieGoal = tdee;
  
  switch (profile.fitnessGoal) {
    case "lose":
      calorieGoal = tdee - 500; // 500 calorie deficit for weight loss
      break;
    case "gain":
      calorieGoal = tdee + 500; // 500 calorie surplus for weight gain
      break;
    // maintain stays at TDEE
  }
  
  // Calculate macronutrient goals
  let proteinGoal = 0;
  let fatGoal = 0;
  let carbGoal = 0;
  
  // Protein: 1.6-2.2g per kg of bodyweight
  if (profile.fitnessGoal === "gain") {
    proteinGoal = Math.round(profile.weight * 2.2); // Higher protein for muscle gain
  } else if (profile.fitnessGoal === "lose") {
    proteinGoal = Math.round(profile.weight * 2.0); // Higher protein for weight loss to preserve muscle
  } else {
    proteinGoal = Math.round(profile.weight * 1.6); // Moderate protein for maintenance
  }
  
  // Fat: 20-35% of total calories
  let fatPercentage = 0.25; // 25% of calories from fat
  fatGoal = Math.round((calorieGoal * fatPercentage) / 9); // 9 calories per gram of fat
  
  // Remaining calories from carbs
  const proteinCalories = proteinGoal * 4; // 4 calories per gram of protein
  const fatCalories = fatGoal * 9;
  const carbCalories = calorieGoal - proteinCalories - fatCalories;
  carbGoal = Math.round(carbCalories / 4); // 4 calories per gram of carbs
  
  return {
    calories: Math.round(calorieGoal),
    protein: proteinGoal,
    carbs: carbGoal,
    fat: fatGoal,
  };
}