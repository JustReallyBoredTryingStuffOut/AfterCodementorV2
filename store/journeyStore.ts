import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useHealthStore } from "./healthStore";

// Norway-specific data
export interface NorwegianLandmark {
  id: string;
  name: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distanceFromStart: number; // km from Lindesnes
  category: 'city' | 'nature' | 'culture' | 'adventure';
  funFact: string;
  imageUrl?: string;
  unlocked: boolean;
  dateUnlocked?: string;
}

export interface JourneyProgress {
  totalSteps: number;
  totalDistance: number; // km
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  distanceTraveled: number; // km from Lindesnes
  currentLandmark?: NorwegianLandmark;
  nextLandmark?: NorwegianLandmark;
  progressPercentage: number;
  journeyStarted: string;
  lastUpdated: string;
  isStarted: boolean; // New flag to track if journey has been started
}

export interface JourneyAchievement {
  id: string;
  title: string;
  description: string;
  category: 'distance' | 'landmark' | 'streak' | 'special';
  unlocked: boolean;
  dateUnlocked?: string;
  progress: number;
  target: number;
}

export interface JourneySettings {
  enabled: boolean;
  country: 'norway';
  startDate: string;
  dailyStepGoal: number;
  distanceMultiplier: number; // steps to km conversion
  autoSync: boolean;
}

interface JourneyState {
  // Core state
  settings: JourneySettings;
  progress: JourneyProgress;
  landmarks: NorwegianLandmark[];
  achievements: JourneyAchievement[];
  
  // Actions
  initializeJourney: () => void;
  startJourney: () => void;
  updateProgress: (steps: number) => void;
  syncWithHealthKit: () => Promise<void>;
  unlockLandmark: (landmarkId: string) => void;
  unlockAchievement: (achievementId: string) => void;
  resetJourney: () => void;
  
  // Getters
  getCurrentLocation: () => { latitude: number; longitude: number };
  getNextLandmark: () => NorwegianLandmark | undefined;
  getUnlockedLandmarks: () => NorwegianLandmark[];
  getUnlockedAchievements: () => JourneyAchievement[];
  getJourneyStats: () => {
    totalDistance: number;
    landmarksVisited: number;
    achievementsUnlocked: number;
    daysActive: number;
  };
  
  // Settings
  toggleJourney: (enabled: boolean) => void;
  updateSettings: (settings: Partial<JourneySettings>) => void;
}

// Norway landmarks data - Starting from southernmost point and going north
// Total journey: 2,500 km (realistic driving route from Lindesnes to Nordkapp)
// Total steps needed: 3,500,000 steps (1,400 steps per km average)
const norwegianLandmarks: NorwegianLandmark[] = [
  {
    id: 'lindesnes',
    name: 'Lindesnes',
    description: 'The southernmost point of mainland Norway, marked by the iconic Lindesnes Lighthouse.',
    location: { latitude: 57.9833, longitude: 7.0500 },
    distanceFromStart: 0,
    category: 'nature',
    funFact: 'Lindesnes Lighthouse is Norway\'s oldest lighthouse, first lit in 1655.',
    unlocked: false
  },
  {
    id: 'kristiansand',
    name: 'Kristiansand',
    description: 'The largest city in Southern Norway, known for its beaches and cultural festivals.',
    location: { latitude: 58.1600, longitude: 8.0000 },
    distanceFromStart: 80,
    category: 'city',
    funFact: 'Kristiansand is home to the largest music festival in Norway, the Quart Festival.',
    unlocked: false
  },
  {
    id: 'stavanger',
    name: 'Stavanger',
    description: 'The oil capital of Norway with beautiful coastal scenery.',
    location: { latitude: 58.9700, longitude: 5.7331 },
    distanceFromStart: 200,
    category: 'city',
    funFact: 'Stavanger is known for its white wooden houses and is the gateway to the famous Preikestolen.',
    unlocked: false
  },
  {
    id: 'preikestolen',
    name: 'Preikestolen (Pulpit Rock)',
    description: 'One of Norway\'s most famous natural attractions.',
    location: { latitude: 58.9864, longitude: 6.1103 },
    distanceFromStart: 250,
    category: 'nature',
    funFact: 'The cliff rises 604 meters above the Lysefjord and is one of Norway\'s most photographed sites.',
    unlocked: false
  },
  {
    id: 'bergen',
    name: 'Bergen',
    description: 'The gateway to the fjords and a UNESCO World Heritage city.',
    location: { latitude: 60.3913, longitude: 5.3221 },
    distanceFromStart: 450,
    category: 'city',
    funFact: 'Bergen is known as the "City of Seven Mountains" and has the most rainfall of any European city.',
    unlocked: false
  },
  {
    id: 'oslo',
    name: 'Oslo',
    description: 'The capital and largest city of Norway, known for its museums, parks, and vibrant culture.',
    location: { latitude: 59.9139, longitude: 10.7522 },
    distanceFromStart: 650,
    category: 'city',
    funFact: 'Oslo was named the European Green Capital in 2019 for its environmental initiatives.',
    unlocked: false
  },
  {
    id: 'geiranger',
    name: 'Geirangerfjord',
    description: 'One of the most beautiful fjords in Norway.',
    location: { latitude: 62.1014, longitude: 7.2061 },
    distanceFromStart: 900,
    category: 'nature',
    funFact: 'The Geirangerfjord is a UNESCO World Heritage site and one of the most visited tourist attractions in Norway.',
    unlocked: false
  },
  {
    id: 'trondheim',
    name: 'Trondheim',
    description: 'Norway\'s third-largest city and former capital.',
    location: { latitude: 63.4305, longitude: 10.3951 },
    distanceFromStart: 1200,
    category: 'city',
    funFact: 'Trondheim was the capital of Norway during the Viking Age and is home to the Nidaros Cathedral.',
    unlocked: false
  },
  {
    id: 'mo-i-rana',
    name: 'Mo i Rana',
    description: 'A city in Northern Norway known for its steel industry and Arctic Circle location.',
    location: { latitude: 66.3167, longitude: 14.1333 },
    distanceFromStart: 1600,
    category: 'city',
    funFact: 'Mo i Rana is located just south of the Arctic Circle and is known for its steel production.',
    unlocked: false
  },
  {
    id: 'bodoe',
    name: 'Bodø',
    description: 'A coastal city known for its stunning scenery and the Saltstraumen whirlpool.',
    location: { latitude: 67.2804, longitude: 14.4050 },
    distanceFromStart: 1800,
    category: 'nature',
    funFact: 'Bodø is home to the world\'s strongest tidal current, the Saltstraumen whirlpool.',
    unlocked: false
  },
  {
    id: 'tromso',
    name: 'Tromsø',
    description: 'The gateway to the Arctic and the Northern Lights.',
    location: { latitude: 69.6492, longitude: 18.9553 },
    distanceFromStart: 2200,
    category: 'adventure',
    funFact: 'Tromsø is the largest city in Northern Norway and is known as the "Paris of the North".',
    unlocked: false
  },
  {
    id: 'nordkapp',
    name: 'Nordkapp (North Cape)',
    description: 'The northernmost point of mainland Europe, offering spectacular views of the Arctic Ocean.',
    location: { latitude: 71.1707, longitude: 25.7833 },
    distanceFromStart: 2500,
    category: 'adventure',
    funFact: 'Nordkapp is considered the northernmost point of Europe and is a popular destination for midnight sun viewing.',
    unlocked: false
  }
];

// Journey achievements
const journeyAchievements: JourneyAchievement[] = [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Start your journey through Norway',
    category: 'distance',
    unlocked: false,
    progress: 0,
    target: 1
  },
  {
    id: 'lindesnes-explorer',
    title: 'Lindesnes Explorer',
    description: 'Complete your first day of walking at the southernmost point of Norway',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 1
  },
  {
    id: 'kristiansand-visitor',
    title: 'Kristiansand Visitor',
    description: 'Reach the largest city in Southern Norway',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 80
  },
  {
    id: 'stavanger-visitor',
    title: 'Stavanger Visitor',
    description: 'Reach the beautiful coastal city of Stavanger',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 200
  },
  {
    id: 'preikestolen-climber',
    title: 'Preikestolen Climber',
    description: 'Reach the famous Pulpit Rock',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 250
  },
  {
    id: 'bergen-explorer',
    title: 'Bergen Explorer',
    description: 'Reach the gateway to the fjords',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 450
  },
  {
    id: 'oslo-explorer',
    title: 'Oslo Explorer',
    description: 'Reach the capital city of Norway',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 650
  },
  {
    id: 'fjord-explorer',
    title: 'Fjord Explorer',
    description: 'Reach the stunning Geirangerfjord',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 900
  },
  {
    id: 'trondheim-explorer',
    title: 'Trondheim Explorer',
    description: 'Reach Norway\'s third-largest city',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 1200
  },
  {
    id: 'arctic-adventurer',
    title: 'Arctic Adventurer',
    description: 'Reach the northern city of Tromsø',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 2200
  },
  {
    id: 'north-cape-conqueror',
    title: 'North Cape Conqueror',
    description: 'Reach the northernmost point of mainland Europe',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 2500
  },
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day walking streak',
    category: 'streak',
    unlocked: false,
    progress: 0,
    target: 7
  },
  {
    id: 'month-master',
    title: 'Month Master',
    description: 'Maintain a 30-day walking streak',
    category: 'streak',
    unlocked: false,
    progress: 0,
    target: 30
  }
];

const defaultSettings: JourneySettings = {
  enabled: false,
  country: 'norway',
  startDate: new Date().toISOString(),
  dailyStepGoal: 10000,
  distanceMultiplier: 0.000714, // 1 step ≈ 0.714 meters (1,400 steps per km)
  autoSync: true
};



const defaultProgress: JourneyProgress = {
  totalSteps: 0,
  totalDistance: 0,
  currentLocation: { latitude: 57.9833, longitude: 7.0500 }, // Lindesnes (southernmost point)
  distanceTraveled: 0,
  progressPercentage: 0,
  journeyStarted: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  isStarted: false
};

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      progress: defaultProgress,
      landmarks: norwegianLandmarks,
      achievements: journeyAchievements,
      
      initializeJourney: () => {
        const { settings } = get();
        if (settings.enabled) {
          set({
            progress: {
              ...defaultProgress,
              journeyStarted: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            }
          });
        }
      },
      
      startJourney: () => {
        const { settings } = get();
        console.log('[JourneyStore] startJourney called, settings.enabled:', settings.enabled);
        if (!settings.enabled) return;
        
        const startDate = new Date().toISOString();
        console.log('[JourneyStore] Starting journey with date:', startDate);
        set({
          progress: {
            ...defaultProgress,
            journeyStarted: startDate,
            lastUpdated: startDate,
            isStarted: true
          },
          settings: {
            ...settings,
            startDate: startDate
          }
        });
        console.log('[JourneyStore] Journey started successfully');
      },
      
      updateProgress: (steps: number) => {
        const { settings, progress, landmarks } = get();
        if (!settings.enabled) return;
        
        const newTotalSteps = progress.totalSteps + steps;
        const newDistance = steps * settings.distanceMultiplier;
        const newTotalDistance = progress.totalDistance + newDistance;
        const newDistanceTraveled = progress.distanceTraveled + newDistance;
        
        // Calculate new position (simplified - moves along a straight line)
        const progressPercentage = Math.min(newDistanceTraveled / 2500, 1); // 2500km is total journey
        const newLatitude = 57.9833 + (progressPercentage * 13.1874); // Lindesnes to North Cape latitude difference
        const newLongitude = 7.0500 + (progressPercentage * 18.7333); // Lindesnes to North Cape longitude difference
        
        // Check for new landmarks
        const newLandmarks = [...landmarks];
        const unlockedLandmarks = newLandmarks.filter(l => !l.unlocked && l.distanceFromStart <= newDistanceTraveled);
        
        unlockedLandmarks.forEach(landmark => {
          landmark.unlocked = true;
          landmark.dateUnlocked = new Date().toISOString();
        });
        
        set({
          progress: {
            ...progress,
            totalSteps: newTotalSteps,
            totalDistance: newTotalDistance,
            distanceTraveled: newDistanceTraveled,
            currentLocation: { latitude: newLatitude, longitude: newLongitude },
            progressPercentage,
            lastUpdated: new Date().toISOString()
          },
          landmarks: newLandmarks
        });
      },
      
      syncWithHealthKit: async () => {
        const { settings } = get();
        if (!settings.enabled || !settings.autoSync) return;
        
        try {
          const healthStore = useHealthStore.getState();
          const todaySteps = healthStore.stepCount;
          
          if (todaySteps > 0) {
            get().updateProgress(todaySteps);
          }
        } catch (error) {
          console.error('[JourneyStore] Error syncing with HealthKit:', error);
        }
      },
      
      unlockLandmark: (landmarkId: string) => {
        const { landmarks } = get();
        const newLandmarks = landmarks.map(landmark => 
          landmark.id === landmarkId 
            ? { ...landmark, unlocked: true, dateUnlocked: new Date().toISOString() }
            : landmark
        );
        set({ landmarks: newLandmarks });
      },
      
      unlockAchievement: (achievementId: string) => {
        const { achievements } = get();
        const newAchievements = achievements.map(achievement => 
          achievement.id === achievementId 
            ? { ...achievement, unlocked: true, dateUnlocked: new Date().toISOString() }
            : achievement
        );
        set({ achievements: newAchievements });
      },
      
      resetJourney: () => {
        set({
          progress: defaultProgress,
          landmarks: norwegianLandmarks,
          achievements: journeyAchievements
        });
      },
      
      getCurrentLocation: () => {
        const { progress } = get();
        return progress.currentLocation;
      },
      
      getNextLandmark: () => {
        const { landmarks, progress } = get();
        return landmarks.find(landmark => 
          !landmark.unlocked && landmark.distanceFromStart > progress.distanceTraveled
        );
      },
      
      getUnlockedLandmarks: () => {
        const { landmarks } = get();
        return landmarks.filter(landmark => landmark.unlocked);
      },
      
      getUnlockedAchievements: () => {
        const { achievements } = get();
        return achievements.filter(achievement => achievement.unlocked);
      },
      
      getJourneyStats: () => {
        const { progress, landmarks, achievements } = get();
        const unlockedLandmarks = landmarks.filter(l => l.unlocked);
        const unlockedAchievements = achievements.filter(a => a.unlocked);
        const daysActive = Math.ceil((Date.now() - new Date(progress.journeyStarted).getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          totalDistance: progress.totalDistance,
          landmarksVisited: unlockedLandmarks.length,
          achievementsUnlocked: unlockedAchievements.length,
          daysActive
        };
      },
      
      toggleJourney: (enabled: boolean) => {
        set(state => ({
          settings: { ...state.settings, enabled }
        }));
      },
      
      updateSettings: (newSettings: Partial<JourneySettings>) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings }
        }));
      }
    }),
    {
      name: 'journey-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 