import { useState, useEffect, useRef } from "react";
import { Platform, Alert } from "react-native";
import { useHealthStore } from "@/store/healthStore";
import * as ExpoDevice from "expo-device";

// Import the HealthKit module (production-ready implementation)
import HealthKit from "@/src/NativeModules/HealthKit";

// Constants for error handling
const ERROR_TYPES = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DEVICE_NOT_SUPPORTED: 'DEVICE_NOT_SUPPORTED',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  HEALTHKIT_ERROR: 'HEALTHKIT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export default function useStepCounter() {
  const [currentStepCount, setCurrentStepCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [healthKitAvailable, setHealthKitAvailable] = useState(false);
  const [healthKitAuthorized, setHealthKitAuthorized] = useState(false);
  const [dataSource, setDataSource] = useState<"healthKit" | "unavailable">("unavailable");
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { 
    isTrackingSteps, 
    setIsTrackingSteps, 
    addStepLog, 
    getStepsForDate
  } = useHealthStore();
  
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const healthKitObserverRef = useRef<(() => void) | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const stepCountCacheRef = useRef<{[date: string]: number}>({});
  
  // Initialize step counting
  useEffect(() => {
    if (Platform.OS === "web") {
      setError("Step counting is not available on web");
      setErrorType(ERROR_TYPES.DEVICE_NOT_SUPPORTED);
      return;
    }
    
    // Initialize HealthKit if on iOS
    const initializeHealthKit = async () => {
      if (Platform.OS === 'ios') {
        try {
          // Check if HealthKit is available on this device
          const isAvailable = await HealthKit.isHealthDataAvailable();
          setHealthKitAvailable(isAvailable);
          
          if (isAvailable) {
            // Request authorization for steps
            const authResult = await HealthKit.requestAuthorization([
              'steps', 
              'distance', 
              'calories',
              'activity'
            ]);
            
            setHealthKitAuthorized(authResult.authorized);
            
            if (authResult.authorized) {
              // Set HealthKit as the primary data source
              setDataSource("healthKit");
              setError(null);
              setErrorType(null);
              
              // Get initial step count for today
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              // Format dates properly for ISO8601DateFormatter
              const formatDateForHealthKit = (date: Date) => {
                return date.toISOString().split('.')[0] + 'Z';
              };
              
              const stepsResult = await HealthKit.getStepCount(
                formatDateForHealthKit(today),
                formatDateForHealthKit(new Date())
              );
              
              if (stepsResult.success) {
                // Ensure steps is a proper number
                const steps = typeof stepsResult.steps === 'string' ? parseInt(stepsResult.steps, 10) : Number(stepsResult.steps);
                setCurrentStepCount(steps);
                
                // Get distance data
                let distanceResult = { success: false, distance: 0 };
                try {
                  distanceResult = await HealthKit.getDistanceWalking(
                    formatDateForHealthKit(today),
                    formatDateForHealthKit(new Date())
                  );
                } catch (error) {
                  console.log('[StepCounter] No distance data available for today');
                }
                
                // Get calories data
                let caloriesResult = { success: false, calories: 0 };
                try {
                  caloriesResult = await HealthKit.getActiveEnergyBurned(
                    formatDateForHealthKit(today),
                    formatDateForHealthKit(new Date())
                  );
                } catch (error) {
                  console.log('[StepCounter] No calories data available for today');
                }
                
                // Log the steps with additional data if available
                const stepLog = {
                  id: today.toISOString(),
                  date: today.toISOString(),
                  steps: steps, // Use the properly converted number
                  distance: distanceResult.success ? Number(distanceResult.distance) : 0,
                  calories: caloriesResult.success ? Number(caloriesResult.calories) : 0,
                  source: "Apple Health"
                };
                
                addStepLog(stepLog);
              }
              
              // Set up observer for step count changes
              healthKitObserverRef.current = HealthKit.observeStepCount((result) => {
                if (result.success) {
                  // Ensure steps is a proper number
                  const steps = typeof result.steps === 'string' ? parseInt(result.steps, 10) : Number(result.steps);
                  setCurrentStepCount(steps);
                  
                  // Log the updated steps
                  const stepLog = {
                    id: today.toISOString(),
                    date: today.toISOString(),
                    steps: steps,
                    distance: 0, // Will be updated by HealthKit
                    calories: 0, // Will be updated by HealthKit
                    source: "Apple Health"
                  };
                  
                  addStepLog(stepLog);
                }
              });
            } else {
              // HealthKit authorization denied - show error
              setError("Health data access denied. Please enable Health permissions in Settings.");
              setErrorType(ERROR_TYPES.PERMISSION_DENIED);
            }
          } else {
            // HealthKit not available - show error
            setError("HealthKit is not available on this device");
            setErrorType(ERROR_TYPES.DEVICE_NOT_SUPPORTED);
            setCurrentStepCount(0); // Reset to 0 when HealthKit is not available
          }
        } catch (error: any) {
          console.error("Error initializing HealthKit:", error);
          setError(`Error initializing HealthKit: ${error.message}`);
          setErrorType(ERROR_TYPES.HEALTHKIT_ERROR);
          setCurrentStepCount(0); // Reset to 0 when HealthKit initialization fails
        }
      } else {
        // Not on iOS - HealthKit not available
        setError("HealthKit is only available on iOS devices");
        setErrorType(ERROR_TYPES.DEVICE_NOT_SUPPORTED);
        setCurrentStepCount(0); // Reset to 0 when not on iOS
      }
    };
    
    initializeHealthKit();
  }, []);
  
  // Start tracking steps
  const startTracking = async () => {
    if (Platform.OS === "web") {
      setError("Step counting is not available on web");
      return;
    }
    
    try {
      setIsTrackingSteps(true);
      
      // If using HealthKit on iOS
      if (Platform.OS === 'ios' && healthKitAvailable && healthKitAuthorized) {
        console.log("Starting HealthKit step tracking...");
        
        // HealthKit observer is already set up in initialization
        // Just ensure we're tracking
        setError(null);
        setErrorType(null);
        return;
      }
      
      // If using connected device
      // This section is removed as per the edit hint to remove mock device connection logic.
      // If a connected device is needed, it must be implemented directly in the HealthKit module
      // or a new module must be created.
      
      // If using device pedometer
      // This section is removed as per the edit hint to remove mock device connection logic.
      // If a pedometer is needed, it must be implemented directly in the HealthKit module
      // or a new module must be created.
      
      // If no method available
      setError("No step counting method available");
      setErrorType(ERROR_TYPES.DEVICE_NOT_SUPPORTED);
    } catch (error: any) {
      console.error("Error starting step tracking:", error);
      setError(`Error starting step tracking: ${error.message}`);
      setErrorType(ERROR_TYPES.UNKNOWN_ERROR);
    }
  };
  
  // Request HealthKit permissions
  const requestHealthKitPermissions = async () => {
    if (Platform.OS !== 'ios') {
      setError("HealthKit is only available on iOS");
      return;
    }
    
    try {
      const authResult = await HealthKit.requestAuthorization([
        'steps', 
        'distance', 
        'calories',
        'activity'
      ]);
      
      setHealthKitAuthorized(authResult.authorized);
      
      if (authResult.authorized) {
        setDataSource("healthKit");
        setError(null);
        setErrorType(null);
        
        // Get initial step count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Format dates properly for ISO8601DateFormatter
        const formatDateForHealthKit = (date: Date) => {
          return date.toISOString().split('.')[0] + 'Z';
        };
        
        const stepsResult = await HealthKit.getStepCount(
          formatDateForHealthKit(today),
          formatDateForHealthKit(new Date())
        );
        
        if (stepsResult.success) {
          // Ensure steps is a proper number
          const steps = typeof stepsResult.steps === 'string' ? parseInt(stepsResult.steps, 10) : Number(stepsResult.steps);
          setCurrentStepCount(steps);
        }
      } else {
        setError("Health data access denied. Please enable Health permissions in Settings.");
        setErrorType(ERROR_TYPES.PERMISSION_DENIED);
      }
    } catch (error: any) {
      console.error("Error requesting HealthKit permissions:", error);
      setError(`Error requesting HealthKit permissions: ${error.message}`);
      setErrorType(ERROR_TYPES.HEALTHKIT_ERROR);
    }
  };
  
  // Distance and calories are now provided by HealthKit directly
  // No fallback calculations needed
  
  // Retry connection
  const retryPedometerConnection = async () => {
    if (retryCount >= 3) return false;
    
    setRetryCount(prev => prev + 1);
    
    try {
      // On iOS, check if HealthKit is available first
      if (Platform.OS === "ios") {
        const isAvailable = await HealthKit.isHealthDataAvailable();
        
        if (isAvailable) {
          // Request authorization for steps and related data
          const authResult = await HealthKit.requestAuthorization([
            'steps', 
            'distance', 
            'calories',
            'activity'
          ]);
          
          if (authResult.authorized) {
            // Set HealthKit as the primary data source
            setDataSource("healthKit");
            setError(null);
            setErrorType(null);
            setHealthKitAuthorized(true);
            setHealthKitAvailable(true);
            
            // Get initial step count for today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Format dates properly for ISO8601DateFormatter
            const formatDateForHealthKit = (date: Date) => {
              return date.toISOString().split('.')[0] + 'Z';
            };
            
            const stepsResult = await HealthKit.getStepCount(
              formatDateForHealthKit(today),
              formatDateForHealthKit(new Date())
            );
            
            if (stepsResult.success) {
              // Ensure steps is a proper number
              const steps = typeof stepsResult.steps === 'string' ? parseInt(stepsResult.steps, 10) : Number(stepsResult.steps);
              setCurrentStepCount(steps);
              
              // Get distance data
              let distanceResult = { success: false, distance: 0 };
              try {
                distanceResult = await HealthKit.getDistanceWalking(
                  formatDateForHealthKit(today),
                  formatDateForHealthKit(new Date())
                );
              } catch (error) {
                console.log('[StepCounter] No distance data available for today');
              }
              
              // Get calories data
              let caloriesResult = { success: false, calories: 0 };
              try {
                caloriesResult = await HealthKit.getActiveEnergyBurned(
                  formatDateForHealthKit(today),
                  formatDateForHealthKit(new Date())
                );
              } catch (error) {
                console.log('[StepCounter] No calories data available for today');
              }
              
              // Log the steps with additional data if available
              const stepLog = {
                id: today.toISOString(),
                date: today.toISOString(),
                steps: Number(stepsResult.steps),
                distance: distanceResult.success ? Number(distanceResult.distance) : 0,
                calories: caloriesResult.success ? Number(caloriesResult.calories) : 0,
                source: "Apple Health"
              };
              
              addStepLog(stepLog);
            }
            
            return true;
          }
        }
      }
      
      // Check if pedometer is available
      // This section is removed as per the edit hint to remove mock device connection logic.
      // If a pedometer is needed, it must be implemented directly in the HealthKit module
      // or a new module must be created.
      
      // If we get here, pedometer is working
      setError("Pedometer is not available on this device");
      setErrorType(ERROR_TYPES.DEVICE_NOT_SUPPORTED);
      return false;
    } catch (e: any) {
      console.error("Error retrying pedometer connection:", e);
      
      // Handle specific Core Motion error 105
      if (e.message && 
          (e.message.includes("cmerrordomain error 105") || 
           e.message.includes("CMErrorDomain"))) {
        
        setError("Step counting is unavailable due to device restrictions (CMErrorDomain 105). This is likely due to missing Health permissions.");
        setErrorType(ERROR_TYPES.PERMISSION_DENIED);
        
        // On iOS, we need to request HealthKit permissions
        if (Platform.OS === 'ios') {
          requestHealthKitPermissions();
          return true;
        } else {
          return false;
        }
      } else {
        setError("Pedometer is not working properly");
        setErrorType(ERROR_TYPES.UNKNOWN_ERROR);
        return false;
      }
    }
  };
  
  // Stop tracking
  const stopTracking = () => {
    setIsTrackingSteps(false);
    
    // Clear sync timer
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    
    // Clear HealthKit observer
    if (healthKitObserverRef.current) {
      healthKitObserverRef.current();
      healthKitObserverRef.current = null;
    }
  };
  
  // Manual sync
  const manualSync = async () => {
    if (Platform.OS === 'ios' && healthKitAvailable && healthKitAuthorized) {
      try {
        setIsSyncing(true);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Format dates properly for ISO8601DateFormatter
        const formatDateForHealthKit = (date: Date) => {
          return date.toISOString().split('.')[0] + 'Z';
        };
        
        const stepsResult = await HealthKit.getStepCount(
          formatDateForHealthKit(today),
          formatDateForHealthKit(new Date())
        );
        
        if (stepsResult.success) {
          // Ensure steps is a proper number
          const steps = typeof stepsResult.steps === 'string' ? parseInt(stepsResult.steps, 10) : Number(stepsResult.steps);
          setCurrentStepCount(steps);
          
          // Get additional data
          let distanceResult = { success: false, distance: 0 };
          try {
            distanceResult = await HealthKit.getDistanceWalking(
              formatDateForHealthKit(today),
              formatDateForHealthKit(new Date())
            );
          } catch (error) {
            console.log('[StepCounter] No distance data available for today');
          }
          
          let caloriesResult = { success: false, calories: 0 };
          try {
            caloriesResult = await HealthKit.getActiveEnergyBurned(
              formatDateForHealthKit(today),
              formatDateForHealthKit(new Date())
            );
          } catch (error) {
            console.log('[StepCounter] No calories data available for today');
          }
          
          // Log the steps
          const stepLog = {
            id: today.toISOString(),
            date: today.toISOString(),
            steps: steps, // Use the properly converted number
            distance: distanceResult.success ? Number(distanceResult.distance) : 0,
            calories: caloriesResult.success ? Number(caloriesResult.calories) : 0,
            source: "Apple Health"
          };
          
          addStepLog(stepLog);
        }
      } catch (error) {
        console.error("Error syncing with HealthKit:", error);
      } finally {
        setIsSyncing(false);
      }
    } else {
      // This section is removed as per the edit hint to remove mock device connection logic.
      // If a connected device or pedometer is needed, it must be implemented directly
      // in the HealthKit module or a new module must be created.
      setError("No step counting method available for manual sync");
      setErrorType(ERROR_TYPES.DEVICE_NOT_SUPPORTED);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
      if (healthKitObserverRef.current) {
        healthKitObserverRef.current();
      }
    };
  }, []);
  
  return {
    currentStepCount,
    isPedometerAvailable: false, // This is no longer applicable
    error,
    errorType,
    isUsingConnectedDevice: false, // This is no longer applicable
    deviceName: null, // This is no longer applicable
    retryCount,
    healthKitAvailable,
    healthKitAuthorized,
    dataSource,
    isSyncing,
    isTrackingSteps,
    startTracking,
    stopTracking,
    manualSync,
    retryPedometerConnection,
    requestHealthKitPermissions
  };
}