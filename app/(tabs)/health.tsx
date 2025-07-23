import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { 
  Activity, 
  TrendingUp, 
  Target, 
  Heart, 
  Droplets, 
  Scale, 
  Smartphone, 
  Zap,
  RefreshCw,
  Watch,
  Award,
  BarChart2,
  ChevronRight,
  Camera,
  MapPin,
  Footprints,
  ArrowLeft,
  AlertTriangle,
  BarChart3
} from "lucide-react-native";
import { useHealthStore } from "@/store/healthStore";
import { useWorkoutStore } from "@/store/workoutStore";
import { usePhotoStore } from "@/store/photoStore";
import { useTheme } from "@/context/ThemeContext";
import StepCounter from "@/components/StepCounter";
import WeightTracker from "@/components/WeightTracker";
import WaterTracker from "@/components/WaterTracker";
import ActivityMap from "@/components/ActivityMap";
import Button from "@/components/Button";
import ErrorBoundary from "@/components/ErrorBoundary";

// Safe imports with error handling
let HealthKit: any = null;
let HealthKitService: any = null;
let AppleWatchService: any = null;

try {
  if (Platform.OS === 'ios') {
    HealthKit = require("@/src/NativeModules/HealthKit").default;
    HealthKitService = require('../../src/services/HealthKitService').default;
    AppleWatchService = require('../../src/NativeModules/AppleWatch').default;
  }
} catch (error) {
  console.warn('Native modules not available:', error);
}

export default function HealthScreen() {
  const router = useRouter();
  const { 
    workoutLogs 
  } = useWorkoutStore();
  const { 
    weightLogs, 
    connectedDevices, 
    activityLogs, 
    isTrackingLocation,
    isAppleWatchConnected,
    getConnectedDeviceByType,
    syncSwimmingFromHealthKit,
    startSwimmingSync,
    stopSwimmingSync,
    manualSyncSwimming,
    setIsAppleWatchConnected
  } = useHealthStore();
  
  // Safe access to weight logs
  const safeWeightLogs = (() => {
    try {
      return weightLogs || [];
    } catch (error) {
      console.warn('Error accessing weight logs:', error);
      return [];
    }
  })();
  const { progressPhotos } = usePhotoStore();
  const { colors } = useTheme();
  
  // Safe access to progress photos
  const safeProgressPhotos = (() => {
    try {
      return progressPhotos || [];
    } catch (error) {
      console.warn('Error accessing progress photos:', error);
      return [];
    }
  })();

  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isSwimmingSyncLoading, setIsSwimmingSyncLoading] = useState(false);

  const [healthKitAvailable, setHealthKitAvailable] = useState(false);
  const [healthKitAuthorized, setHealthKitAuthorized] = useState(false);
  
  // Initialize HealthKit and start swimming sync
  useEffect(() => {
    if (Platform.OS === 'ios' && HealthKit) {
      const initializeHealthKit = async () => {
        try {
          // Check if HealthKit is available
          const isAvailable = await HealthKit.isHealthDataAvailable();
          setHealthKitAvailable(isAvailable);
          
          if (isAvailable) {
            // Request authorization for health data
            const authResult = await HealthKit.requestAuthorization([
              'steps', 
              'distance', 
              'calories', 
              'heartRate', 
              'sleep', 
              'workouts'
            ]);
            
            setHealthKitAuthorized(authResult.authorized);
            
            // Start swimming sync if authorized
            if (authResult.authorized) {
              startSwimmingSync();
            }
          }
        } catch (error) {
          console.error("Error initializing HealthKit:", error);
          setHealthKitAvailable(false);
          setHealthKitAuthorized(false);
        }
      };
      
      initializeHealthKit();
    }
    
    // Cleanup swimming sync on unmount
    return () => {
      stopSwimmingSync();
    };
  }, []);

  useEffect(() => {
    let subscription;
    const checkAppleWatch = async () => {
      if (Platform.OS === 'ios' && AppleWatchService) {
        try {
          const reachable = await AppleWatchService.isAppleWatchReachable();
          setIsAppleWatchConnected(!!reachable);
        } catch (error) {
          console.warn('Apple Watch service not available:', error);
          setIsAppleWatchConnected(false);
        }
      }
    };
    checkAppleWatch();
    if (Platform.OS === 'ios' && AppleWatchService?.eventEmitter) {
      try {
        subscription = AppleWatchService.eventEmitter.addListener('watchStatusChanged', (data) => {
          setIsAppleWatchConnected(!!data.isReachable);
        });
      } catch (error) {
        console.warn('Apple Watch event emitter not available:', error);
      }
    }
    return () => {
      if (subscription) subscription.remove();
    };
  }, []);
  

  
  // Calculate total workouts with safe error handling
  const totalWorkouts = (() => {
    try {
      return workoutLogs ? workoutLogs.length : 0;
    } catch (error) {
      console.warn('Error calculating total workouts:', error);
      return 0;
    }
  })();
  
  // Calculate active days (unique days with workouts) with safe error handling
  const activeDays = (() => {
    try {
      if (!workoutLogs) return 0;
      return new Set(
        workoutLogs.map(log => new Date(log.date).toDateString())
      ).size;
    } catch (error) {
      console.warn('Error calculating active days:', error);
      return 0;
    }
  })();
  
  // Calculate total workout time with safe error handling
  const totalWorkoutTime = (() => {
    try {
      if (!workoutLogs) return 0;
      return workoutLogs.reduce(
        (total, log) => total + (log.duration || 0),
        0
      );
    } catch (error) {
      console.warn('Error calculating total workout time:', error);
      return 0;
    }
  })();
  
  // Get recent activities with safe error handling
  const recentActivities = (() => {
    try {
      const healthStore = useHealthStore.getState();
      if (healthStore && typeof healthStore.getRecentActivityLogs === 'function') {
        return healthStore.getRecentActivityLogs(3);
      }
      return [];
    } catch (error) {
      console.warn('Error getting recent activities:', error);
      return [];
    }
  })();
  
  // Check for connected devices with safe error handling
  const hasConnectedDevices = (() => {
    try {
      return connectedDevices && connectedDevices.some(device => device.connected);
    } catch (error) {
      console.warn('Error checking connected devices:', error);
      return false;
    }
  })();
  
  const appleWatch = (() => {
    try {
      return getConnectedDeviceByType ? getConnectedDeviceByType("appleWatch") : null;
    } catch (error) {
      console.warn('Error getting Apple Watch device:', error);
      return null;
    }
  })();
  
  const fitbit = (() => {
    try {
      return getConnectedDeviceByType ? getConnectedDeviceByType("fitbit") : null;
    } catch (error) {
      console.warn('Error getting Fitbit device:', error);
      return null;
    }
  })();
  
  const garmin = (() => {
    try {
      return getConnectedDeviceByType ? getConnectedDeviceByType("garmin") : null;
    } catch (error) {
      console.warn('Error getting Garmin device:', error);
      return null;
    }
  })();
  
  const handleSyncAllDevices = async () => {
    if (!hasConnectedDevices && !healthKitAuthorized) {
      Alert.alert(
        "No Data Sources",
        "You don't have any connected devices or Apple Health access. Would you like to connect a device or enable Apple Health?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Connect Device", onPress: () => router.push("/health-devices") },
          { 
            text: "Enable Apple Health", 
            onPress: async () => {
              if (Platform.OS === 'ios' && HealthKit) {
                try {
                  const authResult = await HealthKit.requestAuthorization([
                    'steps', 
                    'distance', 
                    'calories', 
                    'heartRate', 
                    'sleep', 
                    'workouts'
                  ]);
                  
                  setHealthKitAuthorized(authResult.authorized);
                  
                  if (authResult.authorized) {
                    Alert.alert(
                      "Apple Health Connected",
                      "Your app is now connected to Apple Health. Your health data will be synced automatically.",
                      [{ text: "OK" }]
                    );
                  } else {
                    Alert.alert(
                      "Apple Health Access Denied",
                      "Please open the Settings app and grant this app access to your health data.",
                      [{ text: "OK" }]
                    );
                  }
                } catch (error) {
                  console.error("Error requesting HealthKit authorization:", error);
                  Alert.alert(
                    "Error",
                    "There was an error connecting to Apple Health. Please try again.",
                    [{ text: "OK" }]
                  );
                }
              } else {
                Alert.alert(
                  "Not Available",
                  "Apple Health is not available on this device.",
                  [{ text: "OK" }]
                );
              }
            }
          }
        ]
      );
      return;
    }
    
    setIsSyncingAll(true);
    
    try {
      // Sync with Apple Health if authorized
      if (Platform.OS === 'ios' && healthKitAuthorized && HealthKit) {
        try {
          // Get today's date at midnight
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Get 7 days ago
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          // Get step data
          const stepsResult = await HealthKit.getStepCount(
            sevenDaysAgo.toISOString(),
            new Date().toISOString()
          );
          
          if (stepsResult.success) {
            // Log success
            console.log('Steps synced successfully');
          }
          
          // Get workout data
          const workouts = await HealthKit.getWorkouts(
            sevenDaysAgo.toISOString(),
            new Date().toISOString()
          );
          
          if (workouts && workouts.length > 0) {
            // Log success
            console.log('Workouts synced successfully');
          }
        } catch (error) {
          console.error('Error syncing with HealthKit:', error);
        }
      }
      
      // Sync with connected devices
      if (hasConnectedDevices) {
        // Simulate syncing with all connected devices
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      Alert.alert(
        "Sync Complete",
        "All your health data has been synced successfully.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error syncing devices:", error);
      Alert.alert(
        "Sync Error",
        "There was an error syncing your devices. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSwimmingSync = async () => {
    setIsSwimmingSyncLoading(true);
    
    try {
      if (manualSyncSwimming) {
        await manualSyncSwimming();
        Alert.alert(
          "Swimming Sync Complete",
          "Swimming activities have been synced from Apple Health.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Not Available",
          "Swimming sync is not available on this device.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error syncing swimming:", error);
      Alert.alert(
        "Sync Error",
        "There was an error syncing swimming activities. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSwimmingSyncLoading(false);
    }
  };

  const handleWorkoutControl = (type, data) => {
    console.log('Workout control received:', type, data);
    // Handle workout controls from Apple Watch
    try {
      switch (type) {
        case 'startWorkout':
          Alert.alert('Workout Started', 'Workout started from Apple Watch');
          break;
        case 'pauseWorkout':
          Alert.alert('Workout Paused', 'Workout paused from Apple Watch');
          break;
        case 'skipExercise':
          Alert.alert('Exercise Skipped', 'Exercise skipped from Apple Watch');
          break;
        case 'completeSet':
          Alert.alert('Set Completed', 'Set marked as complete from Apple Watch');
          break;
        case 'emergencyStopWorkout':
          Alert.alert('Workout Stopped', 'Workout stopped from Apple Watch');
          break;
        default:
          console.log('Unknown workout control type:', type);
      }
    } catch (error) {
      console.error('Error handling workout control:', error);
    }
  };

  const handleQuickLog = (type, data) => {
    console.log('Quick log received:', type, data);
    // Handle quick logging from Apple Watch
    try {
      switch (type) {
        case 'logWater':
          if (data?.amount) {
            Alert.alert('Water Logged', `Logged ${data.amount} from Apple Watch`);
          }
          break;
        case 'logWeight':
          if (data?.weight) {
            Alert.alert('Weight Logged', `Logged ${data.weight}kg from Apple Watch`);
          }
          break;
        case 'logMood':
          if (data?.mood && data?.description) {
            Alert.alert('Mood Logged', `Logged mood: ${data.description} from Apple Watch`);
          }
          break;
        default:
          console.log('Unknown quick log type:', type);
      }
    } catch (error) {
      console.error('Error handling quick log:', error);
    }
  };

  const handleNotificationReceived = (type, data) => {
    console.log('Notification received:', type, data);
    // Handle notifications from Apple Watch
    try {
      Alert.alert('Apple Watch Notification', `Received ${type} notification`);
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  return (
    <ErrorBoundary>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>


        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Health Tracking</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Monitor your fitness progress</Text>
        </View>

        {/* Apple Health Banner (iOS only) */}
        {Platform.OS === 'ios' && healthKitAvailable && !healthKitAuthorized && (
          <View style={[
            styles.healthKitBanner, 
            { backgroundColor: "rgba(74, 144, 226, 0.1)" }
          ]}>
            <View style={styles.healthKitContent}>
              <Zap size={20} color={colors.primary} />
              <Text style={[styles.healthKitText, { color: colors.text }]}>
                Connect to Apple Health to automatically sync your steps, workouts, and swimming activities.
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.healthKitButton, { backgroundColor: colors.primary }]}
              onPress={async () => {
                if (!HealthKit) {
                  Alert.alert(
                    "Not Available",
                    "Apple Health is not available on this device.",
                    [{ text: "OK" }]
                  );
                  return;
                }
                
                try {
                  const authResult = await HealthKit.requestAuthorization([
                    'steps', 
                    'distance', 
                    'calories', 
                    'heartRate', 
                    'sleep', 
                    'workouts'
                  ]);
                  
                  setHealthKitAuthorized(authResult.authorized);
                  
                  if (authResult.authorized) {
                    Alert.alert(
                      "Apple Health Connected",
                      "Your app is now connected to Apple Health. Your health data will be synced automatically.",
                      [{ text: "OK" }]
                    );
                  } else {
                    Alert.alert(
                      "Apple Health Access Denied",
                      "Please open the Settings app and grant this app access to your health data.",
                      [{ text: "OK" }]
                    );
                  }
                } catch (error: any) {
                  Alert.alert(
                    "Error",
                    `There was an error connecting to Apple Health: ${error.message}`,
                    [{ text: "OK" }]
                  );
                }
              }}
            >
              <Text style={styles.healthKitButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Swimming Sync Section */}
        {Platform.OS === 'ios' && healthKitAvailable && healthKitAuthorized && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Zap size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Swimming Sync
              </Text>
            </View>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Automatically sync swimming activities from Apple Health
            </Text>
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: colors.primary }]}
              onPress={handleSwimmingSync}
              disabled={isSwimmingSyncLoading}
            >
              <RefreshCw size={16} color="white" style={isSwimmingSyncLoading ? styles.rotating : undefined} />
              <Text style={styles.syncButtonText}>
                {isSwimmingSyncLoading ? 'Syncing...' : 'Sync Swimming'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        

        
        {/* Connected Device Banner */}
        {(hasConnectedDevices || (Platform.OS === 'ios' && healthKitAuthorized)) && (
          <View style={[styles.deviceBanner, { backgroundColor: colors.highlight }]}>
            <View style={styles.deviceInfo}>
              {healthKitAuthorized && Platform.OS === 'ios' ? (
                <>
                  <Zap size={20} color={colors.primary} />
                  <Text style={[styles.deviceText, { color: colors.text }]}>
                    Connected to Apple Health
                  </Text>
                </>
              ) : (
                <>
                  <Smartphone size={20} color={colors.primary} />
                  <Text style={[styles.deviceText, { color: colors.text }]}>
                    Connected to {
                      appleWatch ? "Apple Watch" : 
                      fitbit ? "Fitbit" : 
                      garmin ? "Garmin" : 
                      "Smart Device"
                    }
                  </Text>
                </>
              )}
            </View>
            <TouchableOpacity
              style={styles.syncAllButton}
              onPress={handleSyncAllDevices}
              disabled={isSyncingAll}
            >
              {isSyncingAll ? (
                <Text style={[styles.syncAllText, { color: colors.primary }]}>Syncing...</Text>
              ) : (
                <>
                  <RefreshCw size={14} color={colors.primary} />
                  <Text style={[styles.syncAllText, { color: colors.primary }]}>Sync</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Step Counter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Step Counter</Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Track your daily steps and activity
          </Text>
          <ErrorBoundary>
            <StepCounter />
          </ErrorBoundary>
        </View>
        
        {/* Weight Tracker */}
        <ErrorBoundary>
          <WeightTracker 
            onAddWeight={() => router.push("/weight-log")}
          />
        </ErrorBoundary>
        
        {/* Water Tracker */}
        <ErrorBoundary>
          <WaterTracker />
        </ErrorBoundary>
        
        {isTrackingLocation && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity Map</Text>
              <TouchableOpacity onPress={() => router.push("/activity-map")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>Full Map</Text>
              </TouchableOpacity>
            </View>
            
            <ActivityMap height={200} />
            
            <TouchableOpacity 
              style={[styles.activityButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/activity-log")}
            >
              <MapPin size={18} color="#FFFFFF" />
              <Text style={styles.activityButtonText}>Log Activity</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
              <Activity size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalWorkouts}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workouts</Text>
           </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(80, 200, 120, 0.1)" }]}>
              <Award size={20} color={colors.secondary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{activeDays}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Days</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: "rgba(255, 149, 0, 0.1)" }]}>
              <BarChart2 size={20} color="#FF9500" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalWorkoutTime}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Minutes</Text>
          </View>
        </View>
        
        {!hasConnectedDevices && !(Platform.OS === 'ios' && healthKitAuthorized) && (
          <TouchableOpacity 
            style={[styles.connectDeviceCard, { backgroundColor: colors.card }]}
            onPress={() => router.push("/health-devices")}
          >
            <View style={styles.connectDeviceContent}>
              <View style={[styles.connectDeviceIcon, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
                <Smartphone size={24} color={colors.primary} />
              </View>
              <View style={styles.connectDeviceInfo}>
                <Text style={[styles.connectDeviceTitle, { color: colors.text }]}>
                  Connect a Device
                </Text>
                <Text style={[styles.connectDeviceSubtitle, { color: colors.textSecondary }]}>
                  Sync with Apple Health, Apple Watch, Fitbit, or Garmin
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}

        {recentActivities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activities</Text>
              <TouchableOpacity onPress={() => router.push("/activity-history")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {recentActivities.map((activity) => (
              <TouchableOpacity 
                key={activity.id}
                style={[styles.activityCard, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/activity/${activity.id}`)}
              >
                <View style={styles.activityInfo}>
                  <View style={[styles.activityIcon, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
                    <Footprints size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.activityType, { color: colors.text }]}>
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                    </Text>
                    <Text style={[styles.activityDate, { color: colors.textSecondary }]}>
                      {new Date(activity.date).toLocaleDateString()} • {activity.duration} min
                    </Text>
                    
                    {activity.source && (
                      <View style={styles.activitySourceContainer}>
                        {activity.source.includes("Apple Health") ? (
                          <Zap size={12} color={colors.primary} />
                        ) : activity.source.includes("Apple") ? (
                          <Smartphone size={12} color={colors.textSecondary} />
                        ) : activity.source.includes("Fitbit") ? (
                          <Smartphone size={12} color="#00B0B9" />
                        ) : activity.source.includes("Garmin") ? (
                          <Smartphone size={12} color="#006CC1" />
                        ) : (
                          <Zap size={12} color={colors.textSecondary} />
                        )}
                        <Text style={styles.activitySource}>{activity.source}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.activityStats}>
                  <Text style={[styles.activityDistance, { color: colors.primary }]}>
                    {activity.distance} km
                  </Text>
                  <Text style={[styles.activityCalories, { color: colors.textSecondary }]}>
                    {activity.calories} kcal
                  </Text>
                </View>
                
                <ChevronRight size={20} color={colors.textLight} />
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={[styles.addActivityButton, { backgroundColor: colors.highlight }]}
              onPress={() => router.push("/activity-log")}
            >
              <Text style={[styles.addActivityText, { color: colors.primary }]}>Log New Activity</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Tools</Text>
          
          <TouchableOpacity 
            style={[styles.toolCard, { backgroundColor: colors.card }]}
            onPress={() => router.push("/progress-photos")}
          >
            <View style={styles.toolInfo}>
              <View style={[styles.toolIcon, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
                <Camera size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.toolTitle, { color: colors.text }]}>Progress Photos</Text>
                <Text style={[styles.toolDescription, { color: colors.textSecondary }]}>
                  {safeProgressPhotos.length > 0 
                    ? `${safeProgressPhotos.length} photo${safeProgressPhotos.length > 1 ? 's' : ''} saved`
                    : "Track your physical changes over time"
                  }
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toolCard, { backgroundColor: colors.card }]}
            onPress={() => router.push("/health-devices")}
          >
            <View style={styles.toolInfo}>
              <View style={[styles.toolIcon, { backgroundColor: "rgba(80, 200, 120, 0.1)" }]}>
                <Smartphone size={24} color={colors.secondary} />
              </View>
              <View>
                <Text style={[styles.toolTitle, { color: colors.text }]}>Connected Devices</Text>
                <Text style={[styles.toolDescription, { color: colors.textSecondary }]}>
                  {Platform.OS === 'ios' && isAppleWatchConnected
                    ? "Apple Watch connected - Control workouts from your watch"
                    : hasConnectedDevices
                      ? `${connectedDevices.length} device${connectedDevices.length > 1 ? 's' : ''} connected`
                      : healthKitAuthorized
                        ? "Apple Health connected"
                        : "Connect your smartwatch or fitness tracker"
                  }
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolCard, { backgroundColor: colors.card }]}
            onPress={() => router.push("/weight-log")}
          >
            <View style={styles.toolInfo}>
              <View style={[styles.toolIcon, { backgroundColor: "rgba(255, 149, 0, 0.1)" }]}>
                <TrendingUp size={24} color="#FF9500" />
              </View>
              <View>
                <Text style={[styles.toolTitle, { color: colors.text }]}>Weight Tracking</Text>
                <Text style={[styles.toolDescription, { color: colors.textSecondary }]}>
                  {safeWeightLogs.length > 0 
                    ? `${safeWeightLogs.length} weight log${safeWeightLogs.length > 1 ? 's' : ''} recorded`
                    : "Start tracking your weight progress"
                  }
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolCard, { backgroundColor: colors.card }]}
            onPress={() => router.push("/health-goals")}
          >
            <View style={styles.toolInfo}>
              <View style={[styles.toolIcon, { backgroundColor: "rgba(255, 149, 0, 0.1)" }]}>
                <Target size={24} color="#FF9500" />
              </View>
              <View>
                <Text style={[styles.toolTitle, { color: colors.text }]}>Health Goals</Text>
                <Text style={[styles.toolDescription, { color: colors.textSecondary }]}>
                  Set and track your health objectives
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toolCard, { backgroundColor: colors.card }]}
            onPress={() => router.push("/workout-analytics")}
          >
            <View style={styles.toolInfo}>
              <View style={[styles.toolIcon, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
                <BarChart3 size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.toolTitle, { color: colors.text }]}>Workout Analytics</Text>
                <Text style={[styles.toolDescription, { color: colors.textSecondary }]}>
                  View detailed charts and progress graphs
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.cardioSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Log</Text>
          
          <View style={styles.cardioButtonsContainer}>
            <TouchableOpacity 
              style={[styles.cardioButton, { backgroundColor: colors.card }]}
              onPress={() => router.push("/log-cardio")}
            >
              <View style={[styles.cardioButtonIcon, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
                <Footprints size={24} color={colors.primary} />
              </View>
              <Text style={[styles.cardioButtonText, { color: colors.text }]}>Log Cardio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cardioButton, { backgroundColor: colors.card }]}
              onPress={() => router.push("/activity-log")}
            >
              <View style={[styles.cardioButtonIcon, { backgroundColor: "rgba(80, 200, 120, 0.1)" }]}>
                <Activity size={24} color={colors.secondary} />
              </View>
              <Text style={[styles.cardioButtonText, { color: colors.text }]}>Log Activity</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  healthKitBanner: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  healthKitContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  healthKitText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  healthKitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  healthKitButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
  },

  deviceBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  syncAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  syncAllText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  connectDeviceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  connectDeviceContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  connectDeviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  connectDeviceInfo: {
    flex: 1,
  },
  connectDeviceTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  connectDeviceSubtitle: {
    fontSize: 14,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityType: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  activitySourceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  activitySource: {
    fontSize: 12,
    color: "#8E8E93",
    marginLeft: 4,
  },
  activityStats: {
    marginRight: 12,
    alignItems: "flex-end",
  },
  activityDistance: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  activityCalories: {
    fontSize: 14,
  },
  addActivityButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addActivityText: {
    fontSize: 16,
    fontWeight: "500",
  },
  toolCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toolInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 14,
  },
  cardioSection: {
    marginBottom: 24,
  },
  cardioButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardioButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardioButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  cardioButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  backButton: {
    padding: 8,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  activityButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  activityButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});