import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  trigger?: any;
  scheduledTime?: Date;
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Check current permission status
  async getPermissionStatus(): Promise<string> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error checking permission status:', error);
      return 'unknown';
    }
  }

  // Schedule a notification
  async scheduleNotification(notification: NotificationData): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: notification.trigger || null,
      });

      // Save notification to storage
      await this.saveNotification(notificationId, notification);

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Schedule a workout reminder
  async scheduleWorkoutReminder(date: Date, workoutType: string): Promise<string | null> {
    const notification: NotificationData = {
      id: `workout_${Date.now()}`,
      title: 'Time for Your Workout! 💪',
      body: `Your ${workoutType} workout is scheduled for now. Let's crush it!`,
      data: { type: 'workout_reminder', workoutType },
      trigger: { date },
    };

    return await this.scheduleNotification(notification);
  }

  // Schedule a daily reminder
  async scheduleDailyReminder(hour: number, minute: number = 0): Promise<string | null> {
    const notification: NotificationData = {
      id: 'daily_reminder',
      title: 'Time for Your Workout! 💪',
      body: 'Don\'t forget to log your workout today. Every step counts!',
      data: { type: 'daily_reminder' },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    };

    return await this.scheduleNotification(notification);
  }

  // Schedule an achievement notification
  async scheduleAchievementNotification(achievement: string): Promise<string | null> {
    const notification: NotificationData = {
      id: `achievement_${Date.now()}`,
      title: 'Achievement Unlocked! 🏆',
      body: `Congratulations! You've earned: ${achievement}`,
      data: { type: 'achievement', achievement },
      trigger: { seconds: 1 },
    };

    return await this.scheduleNotification(notification);
  }

  // Schedule a goal progress notification
  async scheduleGoalProgressNotification(goal: string, progress: number): Promise<string | null> {
    const notification: NotificationData = {
      id: `goal_progress_${Date.now()}`,
      title: 'Goal Progress Update! 📊',
      body: `You're ${progress}% closer to your ${goal} goal! Keep it up!`,
      data: { type: 'goal_progress', goal, progress },
      trigger: { seconds: 1 },
    };

    return await this.scheduleNotification(notification);
  }

  // Schedule a streak notification
  async scheduleStreakNotification(streakDays: number): Promise<string | null> {
    const notification: NotificationData = {
      id: `streak_${Date.now()}`,
      title: 'Streak Alert! 🔥',
      body: `Amazing! You've maintained a ${streakDays}-day workout streak!`,
      data: { type: 'streak', streakDays },
      trigger: { seconds: 1 },
    };

    return await this.scheduleNotification(notification);
  }

  // Schedule a water reminder
  async scheduleWaterReminder(): Promise<string | null> {
    const notification: NotificationData = {
      id: 'water_reminder',
      title: 'Stay Hydrated! 💧',
      body: 'Time to drink some water. Your body will thank you!',
      data: { type: 'water_reminder' },
      trigger: {
        hour: 10,
        minute: 0,
        repeats: true,
      },
    };

    return await this.scheduleNotification(notification);
  }

  // Schedule smart water reminders based on user's daily goal
  async scheduleSmartWaterReminders(dailyGoal: number): Promise<string[]> {
    try {
      // Cancel existing water reminders
      const existingNotifications = await this.getScheduledNotifications();
      const waterNotifications = existingNotifications.filter(n => 
        n.content.data?.type === 'water_reminder' || 
        n.content.data?.type === 'smart_water_reminder'
      );
      
      for (const notification of waterNotifications) {
        await this.cancelNotification(notification.identifier);
      }

      const notificationIds: string[] = [];
      
      // Calculate optimal reminder times based on goal
      const reminderTimes = this.calculateWaterReminderTimes(dailyGoal);
      
      for (let i = 0; i < reminderTimes.length; i++) {
        const time = reminderTimes[i];
        const amount = this.calculateWaterAmountForTime(i, dailyGoal, reminderTimes.length);
        
        const notification: NotificationData = {
          id: `smart_water_reminder_${i}`,
          title: `Time to Hydrate! 💧 (${i + 1}/${reminderTimes.length})`,
          body: `Drink ${amount}ml of water to stay on track with your ${dailyGoal}ml daily goal!`,
          data: { 
            type: 'smart_water_reminder',
            reminderNumber: i + 1,
            totalReminders: reminderTimes.length,
            targetAmount: amount,
            dailyGoal: dailyGoal
          },
          trigger: {
            hour: time.hour,
            minute: time.minute,
            repeats: true,
          },
        };

        const notificationId = await this.scheduleNotification(notification);
        if (notificationId) {
          notificationIds.push(notificationId);
        }
      }

      // Schedule a final reminder if goal not met
      const finalReminder: NotificationData = {
        id: 'water_goal_reminder',
        title: 'Complete Your Water Goal! 💧',
        body: `Don't forget to reach your ${dailyGoal}ml daily water goal. You're almost there!`,
        data: { 
          type: 'water_goal_reminder',
          dailyGoal: dailyGoal
        },
        trigger: {
          hour: 20,
          minute: 0,
          repeats: true,
        },
      };

      const finalNotificationId = await this.scheduleNotification(finalReminder);
      if (finalNotificationId) {
        notificationIds.push(finalNotificationId);
      }

      console.log(`Scheduled ${notificationIds.length} smart water reminders for ${dailyGoal}ml daily goal`);
      return notificationIds;
    } catch (error) {
      console.error('Error scheduling smart water reminders:', error);
      return [];
    }
  }

  // Calculate optimal reminder times based on daily water goal
  private calculateWaterReminderTimes(dailyGoal: number): Array<{hour: number, minute: number}> {
    // More reminders for higher goals
    let reminderCount: number;
    if (dailyGoal <= 1500) {
      reminderCount = 4; // Every 3-4 hours
    } else if (dailyGoal <= 2000) {
      reminderCount = 5; // Every 3 hours
    } else {
      reminderCount = 6; // Every 2.5 hours
    }

    const times: Array<{hour: number, minute: number}> = [];
    
    // Start at 8 AM and distribute throughout the day
    const startHour = 8;
    const endHour = 18; // Last reminder at 6 PM
    const interval = (endHour - startHour) / (reminderCount - 1);

    for (let i = 0; i < reminderCount; i++) {
      const hour = Math.round(startHour + (interval * i));
      times.push({ hour, minute: 0 });
    }

    return times;
  }

  // Calculate water amount for each reminder
  private calculateWaterAmountForTime(reminderIndex: number, dailyGoal: number, totalReminders: number): number {
    // Distribute water intake evenly across reminders
    const baseAmount = Math.round(dailyGoal / totalReminders);
    
    // Add some variation to make it more realistic
    const variation = Math.random() * 0.2 - 0.1; // ±10% variation
    const adjustedAmount = Math.round(baseAmount * (1 + variation));
    
    // Ensure minimum 200ml and maximum 500ml per reminder
    return Math.max(200, Math.min(500, adjustedAmount));
  }

  // Schedule a water goal achievement notification
  async scheduleWaterGoalAchievementNotification(dailyGoal: number, actualIntake: number): Promise<string | null> {
    const percentage = Math.round((actualIntake / dailyGoal) * 100);
    
    let title: string;
    let body: string;
    
    if (percentage >= 100) {
      title = 'Water Goal Achieved! 🎉';
      body = `Congratulations! You've reached your ${dailyGoal}ml daily water goal!`;
    } else if (percentage >= 80) {
      title = 'Almost There! 💧';
      body = `You're ${percentage}% to your water goal. Just ${Math.round(dailyGoal - actualIntake)}ml more!`;
    } else {
      title = 'Keep Hydrating! 💧';
      body = `You're ${percentage}% to your water goal. Don't forget to drink water!`;
    }

    const notification: NotificationData = {
      id: `water_goal_${Date.now()}`,
      title,
      body,
      data: { 
        type: 'water_goal_achievement',
        dailyGoal,
        actualIntake,
        percentage
      },
      trigger: { seconds: 1 },
    };

    return await this.scheduleNotification(notification);
  }

  // Schedule a water streak notification
  async scheduleWaterStreakNotification(streakDays: number): Promise<string | null> {
    const notification: NotificationData = {
      id: `water_streak_${Date.now()}`,
      title: 'Water Streak! 🔥',
      body: `Amazing! You've met your water goal for ${streakDays} days in a row!`,
      data: { 
        type: 'water_streak',
        streakDays
      },
      trigger: { seconds: 1 },
    };

    return await this.scheduleNotification(notification);
  }

  // Update water goal and reschedule reminders
  async updateWaterGoal(newDailyGoal: number): Promise<void> {
    try {
      // Cancel existing water reminders
      const existingNotifications = await this.getScheduledNotifications();
      const waterNotifications = existingNotifications.filter(n => 
        n.content.data?.type === 'water_reminder' || 
        n.content.data?.type === 'smart_water_reminder' ||
        n.content.data?.type === 'water_goal_reminder'
      );
      
      for (const notification of waterNotifications) {
        await this.cancelNotification(notification.identifier);
      }

      // Schedule new smart water reminders
      await this.scheduleSmartWaterReminders(newDailyGoal);
      
      // Save the new goal
      await AsyncStorage.setItem('water_daily_goal', newDailyGoal.toString());
      
      console.log(`Updated water goal to ${newDailyGoal}ml and rescheduled reminders`);
    } catch (error) {
      console.error('Error updating water goal:', error);
    }
  }

  // Get current water goal
  async getWaterGoal(): Promise<number> {
    try {
      const goal = await AsyncStorage.getItem('water_daily_goal');
      return goal ? parseInt(goal) : 2000; // Default 2L
    } catch (error) {
      console.error('Error getting water goal:', error);
      return 2000; // Default 2L
    }
  }

  // Cancel a specific notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.removeNotification(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await this.clearAllNotifications();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Save notification to storage
  private async saveNotification(id: string, notification: NotificationData): Promise<void> {
    try {
      const notifications = await this.getStoredNotifications();
      notifications[id] = {
        ...notification,
        id,
        scheduledTime: new Date().toISOString(),
      };
      await AsyncStorage.setItem('scheduled_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }

  // Remove notification from storage
  private async removeNotification(id: string): Promise<void> {
    try {
      const notifications = await this.getStoredNotifications();
      delete notifications[id];
      await AsyncStorage.setItem('scheduled_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  }

  // Clear all notifications from storage
  private async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem('scheduled_notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Get stored notifications
  private async getStoredNotifications(): Promise<Record<string, NotificationData>> {
    try {
      const stored = await AsyncStorage.getItem('scheduled_notifications');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return {};
    }
  }

  // Initialize default notifications
  async initializeDefaultNotifications(): Promise<void> {
    try {
      // Schedule daily workout reminder at 9 AM
      await this.scheduleDailyReminder(9, 0);
      
      // Schedule water reminder at 10 AM
      await this.scheduleWaterReminder();
      
      console.log('Default notifications initialized successfully');
    } catch (error) {
      console.error('Error initializing default notifications:', error);
    }
  }

  // Update notification settings
  async updateNotificationSettings(settings: {
    dailyReminder?: boolean;
    waterReminder?: boolean;
    achievementNotifications?: boolean;
    goalProgressNotifications?: boolean;
    streakNotifications?: boolean;
  }): Promise<void> {
    try {
      // Cancel existing notifications
      await this.cancelAllNotifications();
      
      // Schedule new notifications based on settings
      if (settings.dailyReminder) {
        await this.scheduleDailyReminder(9, 0);
      }
      
      if (settings.waterReminder) {
        await this.scheduleWaterReminder();
      }
      
      // Save settings
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));
      
      console.log('Notification settings updated successfully');
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  // Get notification settings
  async getNotificationSettings(): Promise<{
    dailyReminder: boolean;
    waterReminder: boolean;
    achievementNotifications: boolean;
    goalProgressNotifications: boolean;
    streakNotifications: boolean;
  }> {
    try {
      const settings = await AsyncStorage.getItem('notification_settings');
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (error) {
      console.error('Error getting notification settings:', error);
    }
    
    // Return default settings
    return {
      dailyReminder: true,
      waterReminder: true,
      achievementNotifications: true,
      goalProgressNotifications: true,
      streakNotifications: true,
    };
  }
}

export default NotificationService.getInstance(); 