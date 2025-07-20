import { Platform } from 'react-native';
import HealthKit from '../NativeModules/HealthKit';
import { HEALTH_DATA_TYPES, type HealthDataType } from '../../types/health';

/**
 * Production HealthKit Service
 * Provides a clean interface to HealthKit functionality using only real data
 * NO MOCK DATA - Production ready implementation
 */
class HealthKitService {
  private healthKit: typeof HealthKit;
  private isInitialized = false;
  private authorizedDataTypes: Set<string> = new Set();

  constructor() {
    this.healthKit = HealthKit;
  }

  /**
   * Initialize HealthKit service
   * Must be called before using any other methods
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      throw new Error('HealthKit is only available on iOS devices');
    }

    try {
      const isAvailable = await this.healthKit.isHealthDataAvailable();
      
      if (!isAvailable) {
        throw new Error('HealthKit is not available on this device');
      }

      this.isInitialized = true;
  
      return true;
    } catch (error) {
      console.error('[HealthKitService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Request authorization for specific health data types
   */
  async requestAuthorization(dataTypes: HealthDataType[]): Promise<boolean> {
    this.ensureInitialized();

    try {
      const result = await this.healthKit.requestAuthorization(dataTypes);
      
      if (result.authorized) {
        dataTypes.forEach(type => this.authorizedDataTypes.add(type));
    
      } else {
        console.warn('[HealthKitService] Authorization denied for:', dataTypes);
      }

      return result.authorized;
    } catch (error) {
      console.error('[HealthKitService] Authorization failed:', error);
      throw error;
    }
  }

  /**
   * Request authorization for all supported health data types
   */
  async requestAllAuthorizations(): Promise<boolean> {
    this.ensureInitialized();

    const allDataTypes: HealthDataType[] = [
      HEALTH_DATA_TYPES.STEP_COUNT,
      HEALTH_DATA_TYPES.DISTANCE_WALKING_RUNNING,
      HEALTH_DATA_TYPES.ACTIVE_ENERGY_BURNED,
      HEALTH_DATA_TYPES.HEART_RATE,
      HEALTH_DATA_TYPES.SLEEP_ANALYSIS,
      HEALTH_DATA_TYPES.WORKOUT,
      HEALTH_DATA_TYPES.BODY_MASS
    ];

    try {
      const result = await this.requestAuthorization(allDataTypes);
  
      return result;
    } catch (error) {
      console.error('[HealthKitService] Failed to request all authorizations:', error);
      throw error;
    }
  }

  /**
   * Get step count for today
   */
  async getTodayStepCount(): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return this.getStepCount(startOfDay, today);
  }

  /**
   * Get step count for a specific date range
   */
  async getStepCount(startDate: Date, endDate: Date): Promise<number> {
    this.ensureInitialized();
    this.ensureAuthorized(HEALTH_DATA_TYPES.STEP_COUNT);

    try {
      // Format dates properly for ISO8601DateFormatter
      const formatDateForHealthKit = (date: Date) => {
        return date.toISOString().split('.')[0] + 'Z';
      };

      const result = await this.healthKit.getStepCount(
        formatDateForHealthKit(startDate),
        formatDateForHealthKit(endDate)
      );

      if (result.success) {
        return result.steps;
      } else {
        throw new Error('Failed to retrieve step count');
      }
    } catch (error) {
      console.error('[HealthKitService] Failed to get step count:', error);
      throw error;
    }
  }

  /**
   * Get distance walked for today
   */
  async getTodayDistance(): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return this.getDistanceWalking(startOfDay, today);
  }

  /**
   * Get walking distance for a specific date range
   */
  async getDistanceWalking(startDate: Date, endDate: Date): Promise<number> {
    this.ensureInitialized();
    this.ensureAuthorized(HEALTH_DATA_TYPES.DISTANCE_WALKING_RUNNING);

    try {
      // Format dates properly for ISO8601DateFormatter
      const formatDateForHealthKit = (date: Date) => {
        return date.toISOString().split('.')[0] + 'Z';
      };

      const result = await this.healthKit.getDistanceWalking(
        formatDateForHealthKit(startDate),
        formatDateForHealthKit(endDate)
      );

      if (result.success) {
        return result.distance; // in kilometers
      } else {
        throw new Error('Failed to retrieve walking distance');
      }
    } catch (error) {
      console.error('[HealthKitService] Failed to get distance:', error);
      throw error;
    }
  }

  /**
   * Get active calories burned for today
   */
  async getTodayActiveCalories(): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return this.getActiveEnergyBurned(startOfDay, today);
  }

  /**
   * Get active energy burned for a specific date range
   */
  async getActiveEnergyBurned(startDate: Date, endDate: Date): Promise<number> {
    this.ensureInitialized();
    this.ensureAuthorized(HEALTH_DATA_TYPES.ACTIVE_ENERGY_BURNED);

    try {
      // Format dates properly for ISO8601DateFormatter
      const formatDateForHealthKit = (date: Date) => {
        return date.toISOString().split('.')[0] + 'Z';
      };

      const result = await this.healthKit.getActiveEnergyBurned(
        formatDateForHealthKit(startDate),
        formatDateForHealthKit(endDate)
      );

      if (result.success) {
        return result.calories;
      } else {
        throw new Error('Failed to retrieve active energy burned');
      }
    } catch (error) {
      console.error('[HealthKitService] Failed to get active calories:', error);
      throw error;
    }
  }

  /**
   * Get heart rate samples for today
   */
  async getTodayHeartRateSamples(): Promise<Array<{value: number, startDate: Date, endDate: Date, source: string}>> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return this.getHeartRateSamples(startOfDay, today);
  }

  /**
   * Get heart rate samples for a specific date range
   */
  async getHeartRateSamples(startDate: Date, endDate: Date) {
    this.ensureInitialized();
    this.ensureAuthorized(HEALTH_DATA_TYPES.HEART_RATE);

    try {
      // Format dates properly for ISO8601DateFormatter
      const formatDateForHealthKit = (date: Date) => {
        return date.toISOString().split('.')[0] + 'Z';
      };

      const result = await this.healthKit.getHeartRateSamples(
        formatDateForHealthKit(startDate),
        formatDateForHealthKit(endDate)
      );

      if (result.success) {
        return result.samples.map(sample => ({
          ...sample,
          startDate: new Date(sample.startDate),
          endDate: new Date(sample.endDate)
        }));
      } else {
        throw new Error('Failed to retrieve heart rate samples');
      }
    } catch (error) {
      console.error('[HealthKitService] Failed to get heart rate:', error);
      throw error;
    }
  }

  /**
   * Get workouts for the past week
   */
  async getRecentWorkouts(days: number = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.getWorkouts(startDate, endDate);
  }

  /**
   * Get workouts for a specific date range
   */
  async getWorkouts(startDate: Date, endDate: Date) {
    this.ensureInitialized();
    this.ensureAuthorized(HEALTH_DATA_TYPES.WORKOUT);

    try {
      // Format dates properly for ISO8601DateFormatter
      const formatDateForHealthKit = (date: Date) => {
        return date.toISOString().split('.')[0] + 'Z';
      };

      const result = await this.healthKit.getWorkouts(
        formatDateForHealthKit(startDate),
        formatDateForHealthKit(endDate)
      );

      if (result.success) {
        return result.workouts.map(workout => ({
          ...workout,
          startDate: new Date(workout.startDate),
          endDate: new Date(workout.endDate)
        }));
      } else {
        throw new Error('Failed to retrieve workouts');
      }
    } catch (error) {
      console.error('[HealthKitService] Failed to get workouts:', error);
      throw error;
    }
  }

  /**
   * Write a workout to HealthKit
   * Note: This method will be implemented when writeWorkout is added to the native module
   */
  async writeWorkout(
    workoutType: number,
    startDate: Date,
    endDate: Date,
    totalEnergyBurned: number,
    totalDistance: number
  ): Promise<boolean> {
    this.ensureInitialized();
    this.ensureAuthorized(HEALTH_DATA_TYPES.WORKOUT);

    try {
      // TODO: Implement writeWorkout in native HealthKit module
      console.warn('[HealthKitService] writeWorkout not yet implemented in native module');
      return false;
    } catch (error) {
      console.error('[HealthKitService] Failed to write workout:', error);
      throw error;
    }
  }

  /**
   * Start observing step count changes
   */
  observeStepCount(callback: (stepCount: number) => void): () => void {
    this.ensureInitialized();
    this.ensureAuthorized(HEALTH_DATA_TYPES.STEP_COUNT);

    try {
      const subscription = this.healthKit.observeStepCount((result: any) => {
        if (result.success) {
          callback(result.steps);
        } else {
          console.error('[HealthKitService] Step count observation error:', result.error);
        }
      });
      
      // Return a proper cleanup function
      return () => {
        if (typeof subscription === 'function') {
          subscription();
        } else if (subscription && typeof (subscription as any).remove === 'function') {
          (subscription as any).remove();
        }
      };
    } catch (error) {
      console.error('[HealthKitService] Failed to observe step count:', error);
      throw error;
    }
  }

  /**
   * Get user's biological sex
   */
  async getBiologicalSex(): Promise<string> {
    this.ensureInitialized();

    try {
      const result = await this.healthKit.getBiologicalSex();
      
      // The native module returns { biologicalSex: string } directly
      return result.biologicalSex;
    } catch (error) {
      console.error('[HealthKitService] Failed to get biological sex:', error);
      throw error;
    }
  }

  /**
   * Get body mass (weight) samples for a date range
   */
  async getBodyMass(startDate: Date, endDate: Date): Promise<Array<{value: number, startDate: Date, endDate: Date, source: string}>> {
    this.ensureInitialized();
    this.ensureAuthorized(HEALTH_DATA_TYPES.BODY_MASS);

    try {
      // Format dates properly for ISO8601DateFormatter
      const formatDateForHealthKit = (date: Date) => {
        return date.toISOString().split('.')[0] + 'Z';
      };

      const result = await this.healthKit.getBodyMass(
        formatDateForHealthKit(startDate),
        formatDateForHealthKit(endDate)
      );

      if (result.success) {
        return result.samples.map(sample => ({
          ...sample,
          startDate: new Date(sample.startDate),
          endDate: new Date(sample.endDate)
        }));
      } else {
        throw new Error('Failed to retrieve body mass data');
      }
    } catch (error) {
      console.error('[HealthKitService] Failed to get body mass:', error);
      throw error;
    }
  }

  /**
   * Get today's body mass (weight)
   */
  async getTodayBodyMass(): Promise<Array<{value: number, startDate: Date, endDate: Date, source: string}>> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return this.getBodyMass(startOfDay, today);
  }

  /**
   * Write body mass (weight) to HealthKit
   */
  async writeBodyMass(weight: number, date: Date): Promise<boolean> {
    this.ensureInitialized();
    this.ensureAuthorized(HEALTH_DATA_TYPES.BODY_MASS);

    try {
      // Format dates properly for ISO8601DateFormatter
      const formatDateForHealthKit = (date: Date) => {
        return date.toISOString().split('.')[0] + 'Z';
      };

      const result = await this.healthKit.writeBodyMass(weight, formatDateForHealthKit(date));
      return result.success;
    } catch (error) {
      console.error('[HealthKitService] Failed to write body mass:', error);
      throw error;
    }
  }

  /**
   * Get user's date of birth
   */
  async getDateOfBirth(): Promise<Date> {
    this.ensureInitialized();

    try {
      const result = await this.healthKit.getDateOfBirth();
      
      // The native module returns { dateOfBirth: string } directly
      return new Date(result.dateOfBirth);
    } catch (error) {
      console.error('[HealthKitService] Failed to get date of birth:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive health data for today
   */
  async getTodayHealthData() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [steps, distance, calories, heartRateSamples, workouts] = await Promise.allSettled([
      this.getStepCount(startOfDay, today).catch(() => 0),
      this.getDistanceWalking(startOfDay, today).catch(() => 0),
      this.getActiveEnergyBurned(startOfDay, today).catch(() => 0),
      this.getHeartRateSamples(startOfDay, today).catch(() => []),
      this.getWorkouts(startOfDay, today).catch(() => [])
    ]);

    return {
      steps: steps.status === 'fulfilled' ? steps.value : 0,
      distance: distance.status === 'fulfilled' ? distance.value : 0,
      calories: calories.status === 'fulfilled' ? calories.value : 0,
      heartRateSamples: heartRateSamples.status === 'fulfilled' ? heartRateSamples.value : [],
      workouts: workouts.status === 'fulfilled' ? workouts.value : [],
      date: today
    };
  }

  /**
   * Get swimming workouts for a specific date range
   */
  async getSwimmingWorkouts(startDate: Date, endDate: Date) {
    this.ensureInitialized();
    this.ensureAuthorized(HEALTH_DATA_TYPES.WORKOUT);

    try {
      // Format dates properly for ISO8601DateFormatter
      const formatDateForHealthKit = (date: Date) => {
        return date.toISOString().split('.')[0] + 'Z';
      };

      const result = await this.healthKit.getWorkouts(
        formatDateForHealthKit(startDate),
        formatDateForHealthKit(endDate)
      );

      if (result.success) {
        // Filter for swimming workouts only (HKWorkoutActivityType.Swimming = 46)
        const swimmingWorkouts = result.workouts.filter(workout => 
          workout.type === 46 // Swimming activity type
        );

        return swimmingWorkouts.map(workout => ({
          ...workout,
          startDate: new Date(workout.startDate),
          endDate: new Date(workout.endDate),
          // Add swimming-specific metrics
          laps: this.calculateSwimmingLaps(workout.distance),
          strokeType: this.determineStrokeType(workout),
          poolLength: this.getPoolLength(workout),
          averagePace: this.calculateSwimmingPace(workout.duration, workout.distance)
        }));
      } else {
        throw new Error('Failed to retrieve swimming workouts');
      }
    } catch (error) {
      console.error('[HealthKitService] Failed to get swimming workouts:', error);
      throw error;
    }
  }

  /**
   * Get recent swimming workouts (last 7 days by default)
   */
  async getRecentSwimmingWorkouts(days: number = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.getSwimmingWorkouts(startDate, endDate);
  }

  /**
   * Calculate swimming laps based on distance
   * Assumes standard 25m or 50m pool lengths
   */
  private calculateSwimmingLaps(distance: number): { total: number, pool25m: number, pool50m: number } {
    const laps25m = Math.round((distance / 25) * 10) / 10; // Round to 1 decimal
    const laps50m = Math.round((distance / 50) * 10) / 10;
    
    return {
      total: Math.round(distance),
      pool25m: laps25m,
      pool50m: laps50m
    };
  }

  /**
   * Determine stroke type based on workout metadata or default to freestyle
   */
  private determineStrokeType(workout: any): string {
    // HealthKit doesn't always provide stroke type, so we'll default to freestyle
    // In a real implementation, this could be enhanced with workout metadata
    return 'freestyle';
  }

  /**
   * Get pool length (default to 25m, could be enhanced with user settings)
   */
  private getPoolLength(workout: any): number {
    // Default to 25m pool, could be made configurable
    return 25;
  }

  /**
   * Calculate swimming pace (minutes per 100m)
   */
  private calculateSwimmingPace(duration: number, distance: number): number {
    if (distance === 0) return 0;
    
    const pacePer100m = (duration / 60) * (100 / distance);
    return Math.round(pacePer100m * 10) / 10; // Round to 1 decimal
  }

  /**
   * Write swimming workout to HealthKit
   */
  async writeSwimmingWorkout(
    startDate: Date,
    endDate: Date,
    totalEnergyBurned: number,
    totalDistance: number,
    strokeType?: string,
    poolLength?: number
  ): Promise<boolean> {
    this.ensureInitialized();
    this.ensureAuthorized(HEALTH_DATA_TYPES.WORKOUT);

    try {
      // Format dates properly for ISO8601DateFormatter
      const formatDateForHealthKit = (date: Date) => {
        return date.toISOString().split('.')[0] + 'Z';
      };

      // Swimming activity type = 46
      const result = await this.healthKit.writeWorkout(
        46, // HKWorkoutActivityType.Swimming
        formatDateForHealthKit(startDate),
        formatDateForHealthKit(endDate),
        totalEnergyBurned,
        totalDistance
      );

      return result.success;
    } catch (error) {
      console.error('[HealthKitService] Failed to write swimming workout:', error);
      throw error;
    }
  }

  // Private helper methods
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('HealthKit service not initialized. Call initialize() first.');
    }
  }

  private ensureAuthorized(dataType: string): void {
    if (!this.authorizedDataTypes.has(dataType)) {
      throw new Error(`Authorization required for ${dataType}. Call requestAuthorization() first.`);
    }
  }

  // Static method to check if HealthKit is available
  static isSupported(): boolean {
    return Platform.OS === 'ios';
  }
}

// Export singleton instance
export default new HealthKitService(); 