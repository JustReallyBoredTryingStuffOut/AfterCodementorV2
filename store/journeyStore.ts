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
  distanceFromStart: number; // km from Oslo
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
  distanceTraveled: number; // km from Oslo
  currentLandmark?: NorwegianLandmark;
  nextLandmark?: NorwegianLandmark;
  progressPercentage: number;
  journeyStarted: string;
  lastUpdated: string;
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

// Norway landmarks data
const norwegianLandmarks: NorwegianLandmark[] = [
  {
    id: 'oslo',
    name: 'Oslo',
    description: 'The capital and largest city of Norway, known for its museums, parks, and vibrant culture.',
    location: { latitude: 59.9139, longitude: 10.7522 },
    distanceFromStart: 0,
    category: 'city',
    funFact: 'Oslo was named the European Green Capital in 2019 for its environmental initiatives.',
    unlocked: true
  },
  {
    id: 'drammen',
    name: 'Drammen',
    description: 'A city known for its beautiful river and outdoor activities.',
    location: { latitude: 59.7440, longitude: 10.2045 },
    distanceFromStart: 40,
    category: 'city',
    funFact: 'Drammen is home to the world\'s largest wooden building, the Drammen Theater.',
    unlocked: false
  },
  {
    id: 'kongsberg',
    name: 'Kongsberg',
    description: 'A historic mining town with rich cultural heritage.',
    location: { latitude: 59.6689, longitude: 9.6502 },
    distanceFromStart: 80,
    category: 'culture',
    funFact: 'Kongsberg was once the largest silver mining town in Europe.',
    unlocked: false
  },
  {
    id: 'notodden',
    name: 'Notodden',
    description: 'A town known for its industrial heritage and beautiful lakes.',
    location: { latitude: 59.5614, longitude: 9.2572 },
    distanceFromStart: 120,
    category: 'culture',
    funFact: 'Notodden is part of the UNESCO World Heritage site for industrial heritage.',
    unlocked: false
  },
  {
    id: 'telemark',
    name: 'Telemark',
    description: 'A region famous for its skiing heritage and beautiful landscapes.',
    location: { latitude: 59.3911, longitude: 8.3214 },
    distanceFromStart: 160,
    category: 'adventure',
    funFact: 'Telemark skiing was invented in this region in the 1860s.',
    unlocked: false
  },
  {
    id: 'stavanger',
    name: 'Stavanger',
    description: 'The oil capital of Norway with beautiful coastal scenery.',
    location: { latitude: 58.9700, longitude: 5.7331 },
    distanceFromStart: 300,
    category: 'city',
    funFact: 'Stavanger is known for its white wooden houses and is the gateway to the famous Preikestolen.',
    unlocked: false
  },
  {
    id: 'preikestolen',
    name: 'Preikestolen (Pulpit Rock)',
    description: 'One of Norway\'s most famous natural attractions.',
    location: { latitude: 58.9864, longitude: 6.1103 },
    distanceFromStart: 320,
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
    id: 'geiranger',
    name: 'Geirangerfjord',
    description: 'One of the most beautiful fjords in Norway.',
    location: { latitude: 62.1014, longitude: 7.2061 },
    distanceFromStart: 550,
    category: 'nature',
    funFact: 'The Geirangerfjord is a UNESCO World Heritage site and one of the most visited tourist attractions in Norway.',
    unlocked: false
  },
  {
    id: 'trondheim',
    name: 'Trondheim',
    description: 'Norway\'s third-largest city and former capital.',
    location: { latitude: 63.4305, longitude: 10.3951 },
    distanceFromStart: 650,
    category: 'city',
    funFact: 'Trondheim was the capital of Norway during the Viking Age and is home to the Nidaros Cathedral.',
    unlocked: false
  },
  {
    id: 'tromso',
    name: 'Tromsø',
    description: 'The gateway to the Arctic and the Northern Lights.',
    location: { latitude: 69.6492, longitude: 18.9553 },
    distanceFromStart: 1200,
    category: 'adventure',
    funFact: 'Tromsø is the largest city in Northern Norway and is known as the "Paris of the North".',
    unlocked: false
  },
  {
    id: 'north-cape',
    name: 'North Cape',
    description: 'The northernmost point of mainland Europe.',
    location: { latitude: 71.1707, longitude: 25.7833 },
    distanceFromStart: 1500,
    category: 'adventure',
    funFact: 'The North Cape is the northernmost point of mainland Europe and offers spectacular views of the Arctic Ocean.',
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
    id: 'oslo-explorer',
    title: 'Oslo Explorer',
    description: 'Complete your first day of walking in Oslo',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 1
  },
  {
    id: 'drammen-visitor',
    title: 'Drammen Visitor',
    description: 'Reach the beautiful city of Drammen',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 40
  },
  {
    id: 'kongsberg-miner',
    title: 'Kongsberg Miner',
    description: 'Discover the historic mining town of Kongsberg',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 80
  },
  {
    id: 'telemark-skier',
    title: 'Telemark Skier',
    description: 'Reach the birthplace of Telemark skiing',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 160
  },
  {
    id: 'fjord-explorer',
    title: 'Fjord Explorer',
    description: 'Reach the stunning Geirangerfjord',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 550
  },
  {
    id: 'arctic-adventurer',
    title: 'Arctic Adventurer',
    description: 'Reach the northern city of Tromsø',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 1200
  },
  {
    id: 'north-cape-conqueror',
    title: 'North Cape Conqueror',
    description: 'Reach the northernmost point of mainland Europe',
    category: 'landmark',
    unlocked: false,
    progress: 0,
    target: 1500
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
  enabled: true,
  country: 'norway',
  startDate: new Date().toISOString(),
  dailyStepGoal: 10000,
  distanceMultiplier: 0.0008, // 1 step ≈ 0.8 meters
  autoSync: true
};

const defaultProgress: JourneyProgress = {
  totalSteps: 0,
  totalDistance: 0,
  currentLocation: { latitude: 59.9139, longitude: 10.7522 }, // Oslo
  distanceTraveled: 0,
  progressPercentage: 0,
  journeyStarted: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
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
      
      updateProgress: (steps: number) => {
        const { settings, progress, landmarks } = get();
        if (!settings.enabled) return;
        
        const newTotalSteps = progress.totalSteps + steps;
        const newDistance = steps * settings.distanceMultiplier;
        const newTotalDistance = progress.totalDistance + newDistance;
        const newDistanceTraveled = progress.distanceTraveled + newDistance;
        
        // Calculate new position (simplified - moves along a straight line)
        const progressPercentage = Math.min(newDistanceTraveled / 1500, 1); // 1500km is total journey
        const newLatitude = 59.9139 + (progressPercentage * 11.2568); // Oslo to North Cape latitude difference
        const newLongitude = 10.7522 + (progressPercentage * 15.0311); // Oslo to North Cape longitude difference
        
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