import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import AppleWatchService from '../src/NativeModules/AppleWatch';
import { colors } from '../constants/colors';

interface AppleWatchIntegrationProps {
  onWorkoutControl?: (type: string, data?: any) => void;
  onQuickLog?: (type: string, data?: any) => void;
  onNotificationReceived?: (type: string, data?: any) => void;
}

const AppleWatchIntegration: React.FC<AppleWatchIntegrationProps> = ({
  onWorkoutControl,
  onQuickLog,
  onNotificationReceived,
}) => {
  const [isWatchReachable, setIsWatchReachable] = useState(false);
  const [watchStatus, setWatchStatus] = useState('Checking...');
  const [workoutActive, setWorkoutActive] = useState(false);

  useEffect(() => {
    checkWatchStatus();
    setupEventListeners();
    
    return () => {
      AppleWatchService.cleanup();
    };
  }, []);

  const checkWatchStatus = async () => {
    try {
      const reachable = await AppleWatchService.isAppleWatchReachable();
      const status = await AppleWatchService.getAppleWatchStatus();
      
      setIsWatchReachable(reachable);
      setWatchStatus(status);
    } catch (error) {
      console.error('Error checking watch status:', error);
      setWatchStatus('Error checking status');
    }
  };

  const setupEventListeners = () => {
    // Override default handlers with custom ones
    AppleWatchService.handleWorkoutControl = (data) => {
      console.log('Workout control from Apple Watch:', data);
      onWorkoutControl?.(data.type, data);
      
      switch (data.type) {
        case 'startWorkout':
          setWorkoutActive(true);
          break;
        case 'pauseWorkout':
        case 'emergencyStopWorkout':
          setWorkoutActive(false);
          break;
      }
    };

    AppleWatchService.handleQuickLogging = (data) => {
      console.log('Quick logging from Apple Watch:', data);
      onQuickLog?.(data.type, data);
    };

    AppleWatchService.handleNotificationReceived = (data) => {
      console.log('Notification from Apple Watch:', data);
      onNotificationReceived?.(data.notificationType, data);
    };
  };

  // MARK: - Workout Control Functions

  const handleStartWorkout = async () => {
    if (!isWatchReachable) {
      Alert.alert('Apple Watch Not Available', 'Please ensure your Apple Watch is connected.');
      return;
    }

    try {
      const success = await AppleWatchService.startWorkoutOnWatch();
      if (success) {
        setWorkoutActive(true);
        Alert.alert('Success', 'Workout started on Apple Watch');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start workout on Apple Watch');
    }
  };

  const handlePauseWorkout = async () => {
    if (!isWatchReachable) return;

    try {
      const success = await AppleWatchService.pauseWorkoutOnWatch();
      if (success) {
        setWorkoutActive(false);
        Alert.alert('Success', 'Workout paused on Apple Watch');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pause workout on Apple Watch');
    }
  };

  const handleSkipExercise = async () => {
    if (!isWatchReachable) return;

    try {
      const success = await AppleWatchService.skipExerciseOnWatch();
      if (success) {
        Alert.alert('Success', 'Exercise skipped on Apple Watch');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to skip exercise on Apple Watch');
    }
  };

  const handleCompleteSet = async () => {
    if (!isWatchReachable) return;

    try {
      const success = await AppleWatchService.completeSetOnWatch();
      if (success) {
        Alert.alert('Success', 'Set marked as complete on Apple Watch');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete set on Apple Watch');
    }
  };

  const handleEmergencyStop = async () => {
    if (!isWatchReachable) return;

    Alert.alert(
      'Emergency Stop',
      'Are you sure you want to stop the workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await AppleWatchService.emergencyStopWorkoutOnWatch();
              if (success) {
                setWorkoutActive(false);
                Alert.alert('Success', 'Workout stopped on Apple Watch');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to stop workout on Apple Watch');
            }
          },
        },
      ]
    );
  };

  // MARK: - Quick Logging Functions

  const handleLogWater = async () => {
    if (!isWatchReachable) {
      Alert.alert('Apple Watch Not Available', 'Please ensure your Apple Watch is connected.');
      return;
    }

    try {
      const success = await AppleWatchService.logWaterOnWatch('500ml');
      if (success) {
        Alert.alert('Success', 'Water logged on Apple Watch');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to log water on Apple Watch');
    }
  };

  const handleLogWeight = async () => {
    if (!isWatchReachable) return;

    try {
      const success = await AppleWatchService.logWeightOnWatch(75.5);
      if (success) {
        Alert.alert('Success', 'Weight logged on Apple Watch');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to log weight on Apple Watch');
    }
  };

  const handleLogMood = async () => {
    if (!isWatchReachable) return;

    try {
      const success = await AppleWatchService.logMoodOnWatch('4', 'Good');
      if (success) {
        Alert.alert('Success', 'Mood logged on Apple Watch');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to log mood on Apple Watch');
    }
  };

  // MARK: - Smart Notification Functions

  const handleScheduleWorkoutReminder = async () => {
    if (!isWatchReachable) return;

    try {
      const success = await AppleWatchService.scheduleWorkoutReminder(6, 0);
      if (success) {
        Alert.alert('Success', 'Workout reminder scheduled for 6:00 AM');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule workout reminder');
    }
  };

  const handleScheduleHydrationReminder = async () => {
    if (!isWatchReachable) return;

    try {
      const success = await AppleWatchService.scheduleHydrationReminder(7200); // 2 hours
      if (success) {
        Alert.alert('Success', 'Hydration reminder scheduled every 2 hours');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule hydration reminder');
    }
  };

  const handleSendAchievementNotification = async () => {
    if (!isWatchReachable) return;

    try {
      const success = await AppleWatchService.sendAchievementNotification(
        'First Workout',
        'Completed your first workout!'
      );
      if (success) {
        Alert.alert('Success', 'Achievement notification sent to Apple Watch');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send achievement notification');
    }
  };

  if (Platform.OS !== 'ios') {
    return (
      <View style={styles.container}>
        <Text style={styles.notAvailableText}>
          Apple Watch features are only available on iOS
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apple Watch Status</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Status: {watchStatus}</Text>
          <View style={[styles.statusIndicator, { backgroundColor: isWatchReachable ? colors.success : colors.error }]} />
        </View>
        <TouchableOpacity style={styles.button} onPress={checkWatchStatus}>
          <Text style={styles.buttonText}>Refresh Status</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Controls</Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={[styles.controlButton, workoutActive ? styles.activeButton : styles.inactiveButton]}
            onPress={workoutActive ? handlePauseWorkout : handleStartWorkout}
          >
            <Text style={styles.controlButtonText}>
              {workoutActive ? 'Pause Workout' : 'Start Workout'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleSkipExercise}>
            <Text style={styles.controlButtonText}>Skip Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleCompleteSet}>
            <Text style={styles.controlButtonText}>Complete Set</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlButton, styles.emergencyButton]} onPress={handleEmergencyStop}>
            <Text style={styles.controlButtonText}>Emergency Stop</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Logging</Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.logButton} onPress={handleLogWater}>
            <Text style={styles.logButtonText}>💧 Log Water</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logButton} onPress={handleLogWeight}>
            <Text style={styles.logButtonText}>⚖️ Log Weight</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logButton} onPress={handleLogMood}>
            <Text style={styles.logButtonText}>😊 Log Mood</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Smart Notifications</Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.notificationButton} onPress={handleScheduleWorkoutReminder}>
            <Text style={styles.notificationButtonText}>Schedule Workout Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notificationButton} onPress={handleScheduleHydrationReminder}>
            <Text style={styles.notificationButtonText}>Schedule Hydration Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notificationButton} onPress={handleSendAchievementNotification}>
            <Text style={styles.notificationButtonText}>Send Achievement Notification</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 10,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  controlButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: '48%',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: colors.warning,
  },
  inactiveButton: {
    backgroundColor: colors.success,
  },
  emergencyButton: {
    backgroundColor: colors.error,
  },
  controlButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  logButton: {
    backgroundColor: colors.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: '48%',
    alignItems: 'center',
  },
  logButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  notificationButton: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: '100%',
    alignItems: 'center',
  },
  notificationButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  notAvailableText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
});

export default AppleWatchIntegration; 