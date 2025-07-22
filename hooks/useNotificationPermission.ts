import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/NotificationService';
import { useWaterStore } from '../store/waterStore';

export const useNotificationPermission = () => {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [hasCheckedPermission, setHasCheckedPermission] = useState(false);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      // Check if this is the first launch
      const hasLaunchedBefore = await AsyncStorage.getItem('hasLaunchedBefore');
      const permissionGranted = await AsyncStorage.getItem('notificationPermissionGranted');
      const permissionDeclined = await AsyncStorage.getItem('notificationPermissionDeclined');

      if (!hasLaunchedBefore) {
        // First time launching the app
        await AsyncStorage.setItem('hasLaunchedBefore', 'true');
        
        // Show permission modal after a short delay
        setTimeout(() => {
          setShowPermissionModal(true);
        }, 1000);
      } else if (!permissionGranted && !permissionDeclined) {
        // User has launched before but hasn't made a decision about notifications
        setShowPermissionModal(true);
      }

      setHasCheckedPermission(true);
    } catch (error) {
      console.error('Error checking first launch:', error);
      setHasCheckedPermission(true);
    }
  };

  const handlePermissionGranted = () => {
    setShowPermissionModal(false);
    // You can add additional logic here, like scheduling default notifications
    scheduleDefaultNotifications();
  };

  const handlePermissionDeclined = () => {
    setShowPermissionModal(false);
  };

  const scheduleDefaultNotifications = async () => {
    try {
      // Initialize default notifications using the service
      await NotificationService.initializeDefaultNotifications();
      
      // Schedule a welcome notification
      await NotificationService.scheduleNotification({
        id: 'welcome_notification',
        title: 'Welcome to FitJourney! 🎉',
        body: 'Your fitness journey starts now. Let\'s crush your goals together!',
        data: { type: 'welcome' },
        trigger: { seconds: 5 },
      });

      // Initialize water goal and schedule smart water reminders
      const { initializeWaterGoal } = useWaterStore.getState();
      await initializeWaterGoal();

      console.log('Default notifications scheduled successfully');
    } catch (error) {
      console.error('Error scheduling default notifications:', error);
    }
  };

  const requestPermissionManually = async () => {
    try {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        await AsyncStorage.setItem('notificationPermissionGranted', 'true');
        await scheduleDefaultNotifications();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting permission manually:', error);
      return false;
    }
  };

  const checkPermissionStatus = async () => {
    try {
      return await NotificationService.getPermissionStatus();
    } catch (error) {
      console.error('Error checking permission status:', error);
      return 'unknown';
    }
  };

  return {
    showPermissionModal,
    hasCheckedPermission,
    handlePermissionGranted,
    handlePermissionDeclined,
    requestPermissionManually,
    checkPermissionStatus,
  };
}; 