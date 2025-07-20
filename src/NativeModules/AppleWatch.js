import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AppleWatchBridge } = NativeModules;

class AppleWatchService {
  constructor() {
    this.isAvailable = Platform.OS === 'ios' && AppleWatchBridge;
    
    if (this.isAvailable) {
      this.eventEmitter = new NativeEventEmitter(AppleWatchBridge);
      this.setupEventListeners();
    } else {
      console.log('Apple Watch Bridge not available - using fallback mode');
    }
  }

  setupEventListeners() {
    // Rest timer events
    this.eventEmitter.addListener('restTimerCompleted', this.handleRestTimerCompleted);
    this.eventEmitter.addListener('restTimerCountdown', this.handleRestTimerCountdown);
    
    // Watch status events
    this.eventEmitter.addListener('watchStatusChanged', this.handleWatchStatusChanged);
    
    // Workout control events
    this.eventEmitter.addListener('workoutControl', this.handleWorkoutControl);
    
    // Quick logging events
    this.eventEmitter.addListener('quickLogging', this.handleQuickLogging);
    
    // Notification events
    this.eventEmitter.addListener('notificationReceived', this.handleNotificationReceived);
  }

  // MARK: - Rest Timer Methods (Existing)

  async startRestTimerOnWatch(seconds) {
    if (!this.isAvailable) {
      console.warn('Apple Watch Bridge not available - returning false');
      return false;
    }

    try {
      const result = await AppleWatchBridge.startRestTimerOnWatch(seconds);
      return result.success;
    } catch (error) {
      console.error('Failed to start rest timer on Apple Watch:', error);
      return false;
    }
  }

  async stopRestTimerOnWatch() {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.stopRestTimerOnWatch();
      return result.success;
    } catch (error) {
      console.error('Failed to stop rest timer on Apple Watch:', error);
      return false;
    }
  }

  async updateRestTimerOnWatch(seconds) {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.updateRestTimerOnWatch(seconds);
      return result.success;
    } catch (error) {
      console.error('Failed to update rest timer on Apple Watch:', error);
      return false;
    }
  }

  // MARK: - Workout Control Methods

  async startWorkoutOnWatch() {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.startWorkoutOnWatch();
      return result.success;
    } catch (error) {
      console.error('Failed to start workout on Apple Watch:', error);
      return false;
    }
  }

  async pauseWorkoutOnWatch() {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.pauseWorkoutOnWatch();
      return result.success;
    } catch (error) {
      console.error('Failed to pause workout on Apple Watch:', error);
      return false;
    }
  }

  async skipExerciseOnWatch() {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.skipExerciseOnWatch();
      return result.success;
    } catch (error) {
      console.error('Failed to skip exercise on Apple Watch:', error);
      return false;
    }
  }

  async completeSetOnWatch() {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.completeSetOnWatch();
      return result.success;
    } catch (error) {
      console.error('Failed to complete set on Apple Watch:', error);
      return false;
    }
  }

  async emergencyStopWorkoutOnWatch() {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.emergencyStopWorkoutOnWatch();
      return result.success;
    } catch (error) {
      console.error('Failed to emergency stop workout on Apple Watch:', error);
      return false;
    }
  }

  // MARK: - Quick Logging Methods

  async logWaterOnWatch(amount) {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.logWaterOnWatch(amount);
      return result.success;
    } catch (error) {
      console.error('Failed to log water on Apple Watch:', error);
      return false;
    }
  }

  async logWeightOnWatch(weight) {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.logWeightOnWatch(weight);
      return result.success;
    } catch (error) {
      console.error('Failed to log weight on Apple Watch:', error);
      return false;
    }
  }

  async logMoodOnWatch(mood, description) {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.logMoodOnWatch(mood, description);
      return result.success;
    } catch (error) {
      console.error('Failed to log mood on Apple Watch:', error);
      return false;
    }
  }

  // MARK: - Smart Notification Methods

  async scheduleWorkoutReminder(hour, minute) {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.scheduleWorkoutReminder(hour, minute);
      return result.success;
    } catch (error) {
      console.error('Failed to schedule workout reminder:', error);
      return false;
    }
  }

  async scheduleHydrationReminder(interval) {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.scheduleHydrationReminder(interval);
      return result.success;
    } catch (error) {
      console.error('Failed to schedule hydration reminder:', error);
      return false;
    }
  }

  async sendAchievementNotification(achievement, description) {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.sendAchievementNotification(achievement, description);
      return result.success;
    } catch (error) {
      console.error('Failed to send achievement notification:', error);
      return false;
    }
  }

  async sendStreakNotification(streakType, days) {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.sendStreakNotification(streakType, days);
      return result.success;
    } catch (error) {
      console.error('Failed to send streak notification:', error);
      return false;
    }
  }

  async sendWorkoutCompletionNotification(duration, calories) {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.sendWorkoutCompletionNotification(duration, calories);
      return result.success;
    } catch (error) {
      console.error('Failed to send workout completion notification:', error);
      return false;
    }
  }

  // MARK: - Connection Status Methods

  async isAppleWatchReachable() {
    if (!this.isAvailable) {
      console.log('Apple Watch Bridge not available - returning false');
      return false;
    }

    try {
      const result = await AppleWatchBridge.isAppleWatchReachable();
      return result.isReachable;
    } catch (error) {
      console.log('Apple Watch not available:', error);
      return false;
    }
  }

  async getAppleWatchStatus() {
    if (!this.isAvailable) {
      return 'Native Module Not Available';
    }

    try {
      const result = await AppleWatchBridge.getAppleWatchStatus();
      return result;
    } catch (error) {
      console.error('Failed to get Apple Watch status:', error);
      return { isReachable: false, isPaired: false, isInstalled: false };
    }
  }

  // MARK: - Event Listener Methods

  addListener(eventName, callback) {
    if (Platform.OS !== 'ios' || !this.eventEmitter) {
      console.warn('Apple Watch event emitter not available');
      return { remove: () => {} };
    }

    try {
      const subscription = this.eventEmitter.addListener(eventName, callback);
      return subscription;
    } catch (error) {
      console.error('Failed to add event listener:', error);
      return { remove: () => {} };
    }
  }

  // MARK: - Voice Announcement Methods (Existing)

  async announceRestComplete() {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.announceRestComplete();
      return result.success;
    } catch (error) {
      console.error('Failed to announce rest complete:', error);
      return false;
    }
  }

  async announceCountdown(seconds) {
    if (Platform.OS !== 'ios' || !AppleWatchBridge) {
      return false;
    }

    try {
      const result = await AppleWatchBridge.announceCountdown(seconds);
      return result.success;
    } catch (error) {
      console.error('Failed to announce countdown:', error);
      return false;
    }
  }

  // MARK: - Event Handlers

  handleRestTimerCompleted = (data) => {
    console.log('Rest timer completed on Apple Watch:', data);
    // Handle rest timer completion
  };

  handleRestTimerCountdown = (data) => {
    console.log('Rest timer countdown on Apple Watch:', data);
    // Handle countdown updates
  };

  handleWatchStatusChanged = (data) => {
    console.log('Apple Watch status changed:', data);
    // Handle watch connectivity changes
  };

  handleWorkoutControl = (data) => {
    console.log('Workout control from Apple Watch:', data);
    // Handle workout control commands from Apple Watch
    switch (data.type) {
      case 'startWorkout':
        // Handle workout start
        break;
      case 'pauseWorkout':
        // Handle workout pause
        break;
      case 'skipExercise':
        // Handle exercise skip
        break;
      case 'completeSet':
        // Handle set completion
        break;
      case 'emergencyStopWorkout':
        // Handle emergency stop
        break;
      default:
        break;
    }
  };

  handleQuickLogging = (data) => {
    console.log('Quick logging from Apple Watch:', data);
    // Handle quick logging from Apple Watch
    switch (data.type) {
      case 'logWater':
        // Handle water logging
        break;
      case 'logWeight':
        // Handle weight logging
        break;
      case 'logMood':
        // Handle mood logging
        break;
      default:
        break;
    }
  };

  handleNotificationReceived = (data) => {
    console.log('Notification received from Apple Watch:', data);
    // Handle notifications from Apple Watch
  };

  // MARK: - Cleanup

  cleanup() {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('restTimerCompleted');
      this.eventEmitter.removeAllListeners('restTimerCountdown');
      this.eventEmitter.removeAllListeners('watchStatusChanged');
      this.eventEmitter.removeAllListeners('workoutControl');
      this.eventEmitter.removeAllListeners('quickLogging');
      this.eventEmitter.removeAllListeners('notificationReceived');
    }
  }
}

export default new AppleWatchService(); 