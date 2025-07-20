import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AppleWatchService from '../src/NativeModules/AppleWatch';
import { colors } from '../constants/colors';

export default function AppleWatchTestScreen() {
  const router = useRouter();

  const testAppleWatchFeatures = () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('iOS Only', 'Apple Watch features are only available on iOS');
      return;
    }

    Alert.alert(
      'Apple Watch Test',
      'This will test the Apple Watch integration features. Note: Some features require a physical Apple Watch.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Test Features', onPress: runTests },
      ]
    );
  };

  const runTests = async () => {
    try {
      // Test 1: Check if Apple Watch is reachable
      const isReachable = await AppleWatchService.isAppleWatchReachable();
      
      // Test 2: Get detailed watch status
      const status = await AppleWatchService.getAppleWatchStatus();
      console.log('Apple Watch Status:', status);
      
      let statusMessage = `Apple Watch reachable: ${isReachable ? 'Yes' : 'No'}\n`;
      statusMessage += `Status: ${status.status || 'Unknown'}\n`;
      statusMessage += `Native module available: ${AppleWatchService.isAvailable ? 'Yes' : 'No'}`;
      
      Alert.alert('Watch Status', statusMessage);

      // Test 3: Try to start rest timer (will fail without physical watch, but tests the bridge)
      try {
        await AppleWatchService.startRestTimerOnWatch(60);
        console.log('Rest timer test completed');
      } catch (error) {
        console.log('Rest timer test failed (expected without physical watch):', error.message);
      }

      Alert.alert('Test Complete', 'Check console for detailed results');
    } catch (error) {
      Alert.alert('Test Error', error.message);
    }
  };

  const testRestTimer = async () => {
    try {
      const success = await AppleWatchService.startRestTimerOnWatch(30);
      Alert.alert('Rest Timer', success ? 'Started successfully' : 'Failed to start');
    } catch (error) {
      Alert.alert('Error', 'Failed to start rest timer: ' + error.message);
    }
  };

  const testWorkoutControl = async () => {
    try {
      const success = await AppleWatchService.startWorkoutOnWatch();
      Alert.alert('Workout Control', success ? 'Workout started' : 'Failed to start workout');
    } catch (error) {
      Alert.alert('Error', 'Failed to start workout: ' + error.message);
    }
  };

  const testQuickLogging = async () => {
    try {
      const success = await AppleWatchService.logWaterOnWatch('250ml');
      Alert.alert('Quick Logging', success ? 'Water logged' : 'Failed to log water');
    } catch (error) {
      Alert.alert('Error', 'Failed to log water: ' + error.message);
    }
  };

  const testNotifications = async () => {
    try {
      const success = await AppleWatchService.sendAchievementNotification(
        'Test Achievement',
        'This is a test notification'
      );
      Alert.alert('Notifications', success ? 'Notification sent' : 'Failed to send notification');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Apple Watch Test</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Test Apple Watch integration features. Some features require a physical Apple Watch.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tests</Text>
          
          <TouchableOpacity style={styles.testButton} onPress={testAppleWatchFeatures}>
            <Text style={styles.testButtonText}>Run All Tests</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testRestTimer}>
            <Text style={styles.testButtonText}>Test Rest Timer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testWorkoutControl}>
            <Text style={styles.testButtonText}>Test Workout Control</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testQuickLogging}>
            <Text style={styles.testButtonText}>Test Quick Logging</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testNotifications}>
            <Text style={styles.testButtonText}>Test Notifications</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Features</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>🕐 Rest Timer</Text>
            <Text style={styles.featureDescription}>
              Start, stop, and update rest timers on Apple Watch
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>💪 Workout Control</Text>
            <Text style={styles.featureDescription}>
              Start, pause, skip exercises, and complete sets
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>📝 Quick Logging</Text>
            <Text style={styles.featureDescription}>
              Log water, weight, and mood directly from Apple Watch
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>🔔 Smart Notifications</Text>
            <Text style={styles.featureDescription}>
              Schedule reminders and send achievement notifications
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>📊 Health Integration</Text>
            <Text style={styles.featureDescription}>
              Sync data with Apple Health and HealthKit
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testing Notes</Text>
          <Text style={styles.note}>
            • Physical Apple Watch required for full functionality{'\n'}
            • Some features will show "not available" without a watch{'\n'}
            • Check console logs for detailed error messages{'\n'}
            • Bridge communication is tested even without physical watch
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.primary,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    lineHeight: 24,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  featureItem: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  note: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 10,
  },
}); 