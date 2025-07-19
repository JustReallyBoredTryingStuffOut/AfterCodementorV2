import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WaterIntake } from '../types';

interface WaterState {
  waterIntakes: WaterIntake[];
  currentIntake: WaterIntake | null;
  isLoading: boolean;
  error: string | null;
  preferredBottleSize: number; // in ml
  favoriteBottles: number[]; // Array of favorite bottle sizes in ml
  
  // Actions
  getWaterIntakeByDate: (date: Date) => WaterIntake | null;
  addWaterIntake: (amount: number) => void;
  updateWaterIntake: (date: Date, amount: number) => void;
  setTarget: (target: number) => void;
  setPreferredBottleSize: (size: number) => void;
  addFavoriteBottle: (size: number) => void;
  removeFavoriteBottle: (size: number) => void;
  clearError: () => void;
}

export const useWaterStore = create<WaterState>()(
  persist(
    (set, get) => ({
      waterIntakes: [],
      currentIntake: null,
      isLoading: false,
      error: null,
      preferredBottleSize: 500, // Default 500ml bottle
      favoriteBottles: [250, 500, 750, 1000], // Default favorite sizes

      getWaterIntakeByDate: (date: Date) => {
        const { waterIntakes } = get();
        const dateString = date.toISOString().split('T')[0];
        return waterIntakes.find(intake => 
          intake.date.toISOString().split('T')[0] === dateString
        ) || null;
      },

      addWaterIntake: (amount: number) => {
        const today = new Date();
        const existingIntake = get().getWaterIntakeByDate(today);
        
        if (existingIntake) {
          set(state => ({
            waterIntakes: state.waterIntakes.map(intake => 
              intake.id === existingIntake.id 
                ? { ...intake, amount: intake.amount + amount }
                : intake
            ),
            currentIntake: state.currentIntake?.id === existingIntake.id
              ? { ...state.currentIntake, amount: state.currentIntake.amount + amount }
              : state.currentIntake
          }));
        } else {
          const newIntake: WaterIntake = {
            id: Date.now().toString(),
            userId: 'current-user',
            date: today,
            amount,
            target: 2000, // Default 2L
            goal: 2000
          };
          
          set(state => ({
            waterIntakes: [...state.waterIntakes, newIntake],
            currentIntake: newIntake
          }));
        }
      },

      updateWaterIntake: (date: Date, amount: number) => {
        const existingIntake = get().getWaterIntakeByDate(date);
        
        if (existingIntake) {
          set(state => ({
            waterIntakes: state.waterIntakes.map(intake => 
              intake.id === existingIntake.id 
                ? { ...intake, amount }
                : intake
            )
          }));
        }
      },

      setTarget: (target: number) => {
        set(state => ({
          waterIntakes: state.waterIntakes.map(intake => ({
            ...intake,
            target,
            goal: target
          })),
          currentIntake: state.currentIntake ? {
            ...state.currentIntake,
            target,
            goal: target
          } : null
        }));
      },

      setPreferredBottleSize: (size: number) => {
        set({ preferredBottleSize: size });
      },

      addFavoriteBottle: (size: number) => {
        set(state => ({
          favoriteBottles: state.favoriteBottles.includes(size) 
            ? state.favoriteBottles 
            : [...state.favoriteBottles, size].sort((a, b) => a - b)
        }));
      },

      removeFavoriteBottle: (size: number) => {
        set(state => ({
          favoriteBottles: state.favoriteBottles.filter(bottle => bottle !== size)
        }));
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'water-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 