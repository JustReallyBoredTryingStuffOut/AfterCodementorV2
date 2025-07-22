import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useWaterStore } from '../store/waterStore';
import NotificationService from '../services/NotificationService';

export default function WaterTestScreen() {
  const [amount, setAmount] = useState('250');
  const { 
    addWaterIntake, 
    getTodayIntake, 
    getTodayGoal, 
    getProgressPercentage,
    setDailyGoal,
    waterStreak,
    resetToday
  } = useWaterStore();

  const todayIntake = getTodayIntake();
  const todayGoal = getTodayGoal();
  const progress = getProgressPercentage();

  const handleAddWater = async () => {
    const waterAmount = parseInt(amount);
    if (isNaN(waterAmount) || waterAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount of water.');
      return;
    }

    await addWaterIntake(waterAmount);
    setAmount('250');
  };

  const handleSetGoal = async () => {
    Alert.prompt(
      'Set Daily Water Goal',
      'Enter your daily water goal in ml:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set',
          onPress: async (goalText) => {
            const goal = parseInt(goalText || '2000');
            if (isNaN(goal) || goal <= 0) {
              Alert.alert('Invalid Goal', 'Please enter a valid goal.');
              return;
            }
            await setDailyGoal(goal);
          }
        }
      ],
      'plain-text',
      todayGoal.toString()
    );
  };

  const handleTestNotifications = async () => {
    try {
      // Test goal achievement notification
      await NotificationService.scheduleWaterGoalAchievementNotification(2000, 1800);
      
      // Test streak notification
      await NotificationService.scheduleWaterStreakNotification(5);
      
      Alert.alert('Test Notifications', 'Test notifications have been scheduled!');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule test notifications.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Water Intake Test</Text>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statText}>Today's Intake: {todayIntake}ml</Text>
        <Text style={styles.statText}>Daily Goal: {todayGoal}ml</Text>
        <Text style={styles.statText}>Progress: {progress}%</Text>
        <Text style={styles.statText}>Current Streak: {waterStreak.currentStreak} days</Text>
        <Text style={styles.statText}>Longest Streak: {waterStreak.longestStreak} days</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Add Water Intake (ml):</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="250"
        />
        <TouchableOpacity style={styles.button} onPress={handleAddWater}>
          <Text style={styles.buttonText}>Add Water</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSetGoal}>
          <Text style={styles.buttonText}>Set Daily Goal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleTestNotifications}>
          <Text style={styles.buttonText}>Test Notifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={resetToday}>
          <Text style={styles.buttonText}>Reset Today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Smart Water Notifications:</Text>
        <Text style={styles.infoText}>• Reminders throughout the day based on your goal</Text>
        <Text style={styles.infoText}>• Achievement notifications at 50%, 80%, and 100%</Text>
        <Text style={styles.infoText}>• Streak notifications for consecutive days</Text>
        <Text style={styles.infoText}>• Final reminder at 8 PM if goal not met</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  statsContainer: {
    backgroundColor: '#2A2A2A',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  progressBar: {
    height: 20,
    backgroundColor: '#444444',
    borderRadius: 10,
    marginBottom: 30,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  secondaryButton: {
    backgroundColor: '#444444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  infoContainer: {
    backgroundColor: '#2A2A2A',
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
}); 