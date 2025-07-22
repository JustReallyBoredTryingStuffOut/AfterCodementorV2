import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/NotificationService';

interface NotificationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
}

const { width, height } = Dimensions.get('window');

export default function NotificationPermissionModal({
  visible,
  onClose,
  onPermissionGranted,
}: NotificationPermissionModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    try {
      const status = await NotificationService.getPermissionStatus();
      if (status === 'granted') {
        onPermissionGranted();
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  const requestNotificationPermission = async () => {
    setIsLoading(true);
    try {
      // Request permission using the service
      const granted = await NotificationService.requestPermissions();
      
      if (granted) {
        // Save that permission was granted
        await AsyncStorage.setItem('notificationPermissionGranted', 'true');
        onPermissionGranted();
        
        // Schedule a test notification
        await scheduleTestNotification();
      } else {
        // Show alert to guide user to settings
        Alert.alert(
          'Notifications Disabled',
          'To get the most out of your fitness journey, please enable notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Alert.alert(
        'Error',
        'There was an error setting up notifications. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleTestNotification = async () => {
    try {
      await NotificationService.scheduleNotification({
        id: 'test_notification',
        title: 'Welcome to FitJourney! 🎉',
        body: 'Your fitness journey starts now. Let\'s crush your goals together!',
        data: { type: 'welcome' },
        trigger: { seconds: 2 },
      });
    } catch (error) {
      console.error('Error scheduling test notification:', error);
    }
  };

  const handleDontAllow = async () => {
    try {
      // Save that user declined
      await AsyncStorage.setItem('notificationPermissionDeclined', 'true');
      onClose();
    } catch (error) {
      console.error('Error saving notification preference:', error);
      onClose();
    }
  };

  const handleAllow = () => {
    requestNotificationPermission();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDontAllow}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* App Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.appIcon}>
              <Ionicons name="fitness" size={40} color="#007AFF" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            "FitJourney" Would Like to Send{'\n'}You Notifications
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            Notifications may include alerts,{'\n'}
            sounds, and icon badges. These can{'\n'}
            be configured in Settings.
          </Text>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons name="notifications" size={20} color="#007AFF" />
              <Text style={styles.benefitText}>Workout reminders</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="trophy" size={20} color="#007AFF" />
              <Text style={styles.benefitText}>Achievement alerts</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="trending-up" size={20} color="#007AFF" />
              <Text style={styles.benefitText}>Progress updates</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.dontAllowButton]}
              onPress={handleDontAllow}
              disabled={isLoading}
            >
              <Text style={styles.dontAllowText}>Don't Allow</Text>
            </TouchableOpacity>

            <View style={styles.buttonDivider} />

            <TouchableOpacity
              style={[styles.button, styles.allowButton]}
              onPress={handleAllow}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingSpinner} />
                  <Text style={styles.allowText}>Setting up...</Text>
                </View>
              ) : (
                <Text style={styles.allowText}>Allow</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 20,
    maxWidth: width * 0.85,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 16,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#3C3C43',
    marginLeft: 8,
    fontWeight: '400',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dontAllowButton: {
    backgroundColor: '#FFFFFF',
  },
  allowButton: {
    backgroundColor: '#FFFFFF',
  },
  buttonDivider: {
    width: 0.5,
    backgroundColor: '#C6C6C8',
  },
  dontAllowText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '400',
  },
  allowText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderTopColor: 'transparent',
    marginRight: 8,
    animation: 'spin 1s linear infinite',
  },
}); 