import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Droplets, Plus, Minus, Settings } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useTheme } from '@/context/ThemeContext';
import { useHealthStore } from '@/store/healthStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useSettingsStore } from '@/store/settingsStore';
import Button from './Button';

interface WaterBottle {
  id: string;
  name: string;
  capacity: number; // in ml
}

const defaultBottles: WaterBottle[] = [
  { id: '1', name: 'Small Glass', capacity: 250 },
  { id: '2', name: 'Large Glass', capacity: 500 },
  { id: '3', name: 'Small Bottle', capacity: 330 },
  { id: '4', name: 'Standard Bottle', capacity: 500 },
  { id: '5', name: 'Large Bottle', capacity: 750 },
  { id: '6', name: 'Sports Bottle', capacity: 1000 },
];

const WaterTracker: React.FC = () => {
  const { colors } = useTheme();
  const { 
    waterIntake, 
    addWaterIntake, 
    removeWaterIntake, 
    getWaterIntakeForDate,
    healthGoals,
    updateHealthGoals,
    preferredBottleSize,
    favoriteBottles,
    setPreferredBottleSize,
    addFavoriteBottle,
    removeFavoriteBottle
  } = useHealthStore();
  const { scheduleWaterNotification, settings, updateSettings } = useNotificationStore();
  const { waterTrackingMode, waterTrackingEnabled } = useSettingsStore();

  const [showBottleModal, setShowBottleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [dailyGoal, setDailyGoal] = useState(2000); // Default 2L

  const today = new Date().toISOString().split('T')[0];
  const todayIntake = getWaterIntakeForDate(today);

  useEffect(() => {
    // Load daily goal from health goals if available
    if (healthGoals.dailyWaterGoal) {
      setDailyGoal(healthGoals.dailyWaterGoal);
    }
  }, [healthGoals]);

  const addWater = (amount: number) => {
    addWaterIntake(amount);
    
    // TODO: Check achievements after adding water
    // This would integrate with gamification store
    
    // Check if goal is reached and show celebration
    const newTotal = todayIntake + amount;
    if (todayIntake < dailyGoal && newTotal >= dailyGoal) {
      Alert.alert(
        "🎉 Goal Achieved!",
        `Congratulations! You've reached your daily water goal of ${dailyGoal}ml!`,
        [{ text: "Awesome!", style: "default" }]
      );
    }
  };

  const removeLastIntake = () => {
    const todayEntries = waterIntake.filter(entry => 
      entry.date.startsWith(today)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (todayEntries.length > 0) {
      removeWaterIntake(todayEntries[0].id);
    }
  };

  const updateDailyGoal = (goal: number) => {
    setDailyGoal(goal);
    updateHealthGoals({
      ...healthGoals,
      dailyWaterGoal: goal
    });
  };

  const setupWaterReminders = async () => {
    try {
      // First, enable notifications if they're not already enabled
      if (!settings.enabled || !settings.waterReminders) {
        updateSettings({
          ...settings,
          enabled: true,
          waterReminders: true
        });
      }

      await scheduleWaterNotification();
      
      Alert.alert(
        "✅ Reminders Set!",
        "Water reminders have been scheduled throughout the day! You'll receive notifications at:\n\n• 10:00 AM\n• 12:00 PM\n• 1:30 PM\n• 3:00 PM\n• 4:30 PM\n• 6:00 PM\n• 7:30 PM\n• 9:00 PM\n\nStay hydrated! 💧",
        [{ text: "Perfect!", style: "default" }]
      );
    } catch (error) {
      Alert.alert(
        "❌ Setup Failed",
        "Unable to set up water reminders. Please check your notification permissions in your device settings and try again.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Try Again", onPress: setupWaterReminders }
        ]
      );
    }
  };

  // Test function to trigger immediate water notification
  const testWaterNotification = async () => {
    try {
      // Don't proactively request permissions - let iOS handle it natively
      // when notifications are actually scheduled
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Please enable notifications in your device settings to test water reminders.");
        return;
      }

      // Schedule an immediate notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💧 Hydration Reminder",
          body: "Time to drink some water! Stay hydrated and healthy.",
          data: { type: "water_reminder" },
        },
        trigger: null, // Immediate notification
      });

      Alert.alert(
        "✅ Test Notification Sent!",
        "You should see a water reminder notification appear on your device. Check your notification center if you don't see it immediately.",
        [{ text: "Got it!", style: "default" }]
      );
    } catch (error) {
      console.error("Failed to send test notification:", error);
      Alert.alert(
        "❌ Test Failed",
        "Unable to send test notification. Please check your notification permissions.",
        [{ text: "OK", style: "default" }]
      );
    }
  };

  const progressPercentage = Math.min((todayIntake / dailyGoal) * 100, 100);
  const remainingAmount = Math.max(dailyGoal - todayIntake, 0);

  const getIntakeForWeek = () => {
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const intake = getWaterIntakeForDate(dateStr);
      weekData.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        amount: intake,
        percentage: Math.min((intake / dailyGoal) * 100, 100)
      });
    }
    return weekData;
  };

  const weekData = getIntakeForWeek();

  // Don't render if water tracking is disabled
  if (!waterTrackingEnabled || waterTrackingMode === 'disabled') {
    return null;
  }

  // Render minimal version
  if (waterTrackingMode === 'minimal') {
    return (
      <View style={[styles.container, styles.minimalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.minimalHeader}>
          <View style={styles.headerLeft}>
            <Droplets size={20} color={colors.primary} />
            <Text style={[styles.minimalTitle, { color: colors.text }]}>Water: {todayIntake}ml</Text>
          </View>
          <View style={styles.minimalActions}>
            <TouchableOpacity
              style={[styles.minimalButton, { backgroundColor: colors.primary }]}
              onPress={() => addWater(250)}
            >
              <Plus size={16} color={colors.card} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowSettingsModal(true)}
              style={[styles.minimalSettingsButton, { backgroundColor: colors.backgroundLight }]}
            >
              <Settings size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={testWaterNotification}
              style={[styles.minimalSettingsButton, { backgroundColor: colors.success }]}
            >
              <Text style={[styles.minimalButtonText, { color: colors.white, fontSize: 12 }]}>Test</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.minimalProgressBar, { backgroundColor: colors.backgroundLight }]}>
          <View 
            style={[
              styles.minimalProgressFill, 
              { 
                backgroundColor: colors.primary,
                width: `${progressPercentage}%`
              }
            ]} 
          />
        </View>
        
        {/* Settings Modal for minimal mode */}
        <Modal
          visible={showSettingsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSettingsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Water Settings</Text>
                <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                  <Text style={[styles.closeButton, { color: colors.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {/* Daily Goal */}
                <View style={styles.settingSection}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Daily Goal</Text>
                  <View style={styles.goalAdjuster}>
                    <TouchableOpacity
                      style={[styles.adjustButton, { 
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: 1,
                      }]}
                      onPress={() => updateDailyGoal(Math.max(dailyGoal - 250, 500))}
                    >
                      <Minus size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.goalAmount, { color: colors.text }]}>
                      {dailyGoal}ml
                    </Text>
                    <TouchableOpacity
                      style={[styles.adjustButton, { 
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: 1,
                      }]}
                      onPress={() => updateDailyGoal(dailyGoal + 250)}
                    >
                      <Plus size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Preferred Bottle Size */}
                <View style={styles.settingSection}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Preferred Bottle Size</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    This will be your quick-add button
                  </Text>
                  <View style={styles.goalAdjuster}>
                    <TouchableOpacity
                      style={[styles.adjustButton, { 
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: 1,
                      }]}
                      onPress={() => setPreferredBottleSize(Math.max(preferredBottleSize - 50, 100))}
                    >
                      <Minus size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.goalAmount, { color: colors.text }]}>
                      {preferredBottleSize}ml
                    </Text>
                    <TouchableOpacity
                      style={[styles.adjustButton, { 
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: 1,
                      }]}
                      onPress={() => setPreferredBottleSize(preferredBottleSize + 50)}
                    >
                      <Plus size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Add Buttons */}
                <View style={styles.settingSection}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Quick Add</Text>
                  <View style={styles.modalBottleGrid}>
                    {defaultBottles.slice(0, 6).map((bottle) => (
                      <TouchableOpacity
                        key={bottle.id}
                        style={[styles.modalBottleButton, { 
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          borderWidth: 1,
                        }]}
                        onPress={() => {
                          addWater(bottle.capacity);
                          setShowSettingsModal(false);
                        }}
                      >
                        <Droplets size={20} color={colors.primary} />
                        <Text style={[styles.modalBottleAmount, { color: colors.primary }]}>
                          {bottle.capacity}ml
                        </Text>
                        <Text style={[styles.modalBottleName, { color: colors.textSecondary }]}>
                          {bottle.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Render full version
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Droplets size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Water Intake</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowSettingsModal(true)}
          style={[styles.settingsButton, { backgroundColor: colors.backgroundLight }]}
        >
          <Settings size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={testWaterNotification}
          style={[styles.settingsButton, { backgroundColor: colors.success, marginLeft: 8 }]}
        >
          <Text style={[styles.testButtonText, { color: colors.white }]}>Test</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Circle */}
      <View style={styles.progressSection}>
        <View style={[styles.progressCircle, { borderColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.primary + '20',
                height: `${progressPercentage}%`
              }
            ]} 
          />
          <View style={styles.progressContent}>
            <Text style={[styles.progressAmount, { color: colors.text }]}>
              {todayIntake}ml
            </Text>
            <Text style={[styles.progressGoal, { color: colors.textSecondary }]}>
              of {dailyGoal}ml
            </Text>
            <Text style={[styles.progressPercentage, { color: colors.primary }]}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Add</Text>
        
        {/* Preferred Bottle - Highlighted */}
        <View style={styles.preferredBottleSection}>
          <Text style={[styles.preferredBottleLabel, { color: colors.textSecondary }]}>
            Your Preferred Bottle
          </Text>
          <TouchableOpacity
            style={[
              styles.preferredBottleButton,
              { 
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }
            ]}
            onPress={() => addWater(preferredBottleSize)}
          >
            <Droplets size={24} color={colors.white} />
            <Text style={[styles.preferredBottleAmount, { color: colors.white }]}>
              {preferredBottleSize}ml
            </Text>
            <Text style={[styles.preferredBottleText, { color: colors.white }]}>
              Quick Add
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottleGrid}>
          {(Array.isArray(favoriteBottles) ? favoriteBottles : []).slice(0, 4).map((bottleSize) => (
            <TouchableOpacity
              key={bottleSize}
              style={[
                styles.bottleButton,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.primary,
                  borderWidth: 1,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }
              ]}
              onPress={() => addWater(bottleSize)}
            >
              <Droplets size={20} color={colors.primary} />
              <Text style={[styles.bottleAmount, { color: colors.primary }]}> 
                {bottleSize}ml
              </Text>
              <Text style={[styles.bottleName, { color: colors.textSecondary }]}> 
                Favorite
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity
          style={[styles.moreBottlesButton, { 
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
          }]}
          onPress={() => setShowBottleModal(true)}
        >
          <Text style={[styles.moreBottlesText, { color: colors.primary }]}>
            More Options & Custom Amount
          </Text>
        </TouchableOpacity>
      </View>

      {/* Today's Progress */}
      <View style={styles.todaySection}>
        <View style={styles.todayHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Progress</Text>
          {todayIntake > 0 && (
            <TouchableOpacity onPress={removeLastIntake} style={styles.undoButton}>
              <Minus size={16} color={colors.error} />
              <Text style={[styles.undoText, { color: colors.error }]}>Undo Last</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={[styles.progressBar, { backgroundColor: colors.backgroundLight }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: colors.primary,
                width: `${progressPercentage}%`
              }
            ]} 
          />
        </View>
        
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {remainingAmount > 0 
              ? `${remainingAmount}ml remaining to reach your goal`
              : "Goal achieved! Great job staying hydrated!"
            }
          </Text>
        </View>
      </View>

      {/* Weekly Overview */}
      <View style={styles.weekSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>This Week</Text>
        <View style={styles.weekChart}>
          {weekData.map((day, index) => (
            <View key={index} style={styles.dayColumn}>
              <View style={[styles.dayBar, { backgroundColor: colors.backgroundLight }]}>
                <View 
                  style={[
                    styles.dayBarFill, 
                    { 
                      backgroundColor: day.percentage >= 100 ? colors.success : colors.primary,
                      height: `${Math.min(day.percentage, 100)}%`
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
                {day.day}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottle Selection Modal */}
      <Modal
        visible={showBottleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBottleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Amount</Text>
              <TouchableOpacity onPress={() => setShowBottleModal(false)}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Predefined Bottles */}
              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Quick Options</Text>
              <View style={styles.modalBottleGrid}>
                {defaultBottles.map((bottle) => (
                  <TouchableOpacity
                    key={bottle.id}
                    style={[styles.modalBottleButton, { 
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }]}
                    onPress={() => {
                      addWater(bottle.capacity);
                      setShowBottleModal(false);
                    }}
                  >
                    <Droplets size={24} color={colors.primary} />
                    <Text style={[styles.modalBottleAmount, { color: colors.primary }]}>
                      {bottle.capacity}ml
                    </Text>
                    <Text style={[styles.modalBottleName, { color: colors.textSecondary }]}>
                      {bottle.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Amount */}
              <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Custom Amount</Text>
              <View style={styles.customAmountSection}>
                <TextInput
                  style={[styles.customAmountInput, { 
                    backgroundColor: colors.backgroundLight, 
                    color: colors.text,
                    borderColor: colors.border
                  }]}
                  placeholder="Enter amount in ml"
                  placeholderTextColor={colors.textSecondary}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="numeric"
                />
                <Button
                  title="Add"
                  onPress={() => {
                    const amount = parseInt(customAmount);
                    if (amount && amount > 0) {
                      addWater(amount);
                      setCustomAmount('');
                      setShowBottleModal(false);
                    }
                  }}
                  disabled={!customAmount || parseInt(customAmount) <= 0}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Water Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Daily Goal */}
              <View style={styles.settingSection}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Daily Goal</Text>
                <View style={styles.goalAdjuster}>
                  <TouchableOpacity
                    style={[styles.adjustButton, { 
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }]}
                    onPress={() => updateDailyGoal(Math.max(dailyGoal - 250, 500))}
                  >
                    <Minus size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.goalAmount, { color: colors.text }]}>
                    {dailyGoal}ml
                  </Text>
                  <TouchableOpacity
                    style={[styles.adjustButton, { 
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }]}
                    onPress={() => updateDailyGoal(dailyGoal + 250)}
                  >
                    <Plus size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Recommended: 2000-3000ml per day
                </Text>
              </View>

              {/* Preferred Bottle Size */}
              <View style={styles.settingSection}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Preferred Bottle Size</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Set your default quick-add button size
                </Text>
                <View style={styles.goalAdjuster}>
                  <TouchableOpacity
                    style={[styles.adjustButton, { 
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }]}
                    onPress={() => setPreferredBottleSize(Math.max(preferredBottleSize - 50, 100))}
                  >
                    <Minus size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.goalAmount, { color: colors.text }]}>
                    {preferredBottleSize}ml
                  </Text>
                  <TouchableOpacity
                    style={[styles.adjustButton, { 
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }]}
                    onPress={() => setPreferredBottleSize(preferredBottleSize + 50)}
                  >
                    <Plus size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reminders */}
              <View style={styles.settingSection}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Reminders</Text>
                <Button
                  title="Setup Water Reminders"
                  onPress={setupWaterReminders}
                  variant="outline"
                />
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Get reminded throughout the day to stay hydrated
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 60,
  },
  progressContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressGoal: {
    fontSize: 12,
    marginTop: 2,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  quickActions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  bottleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bottleButton: {
    flex: 1,
    minWidth: '22%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bottleAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  bottleName: {
    fontSize: 10,
    marginTop: 2,
  },
  moreBottlesButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  moreBottlesText: {
    fontSize: 14,
    fontWeight: '500',
  },
  todaySection: {
    marginBottom: 20,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  undoText: {
    fontSize: 12,
    marginLeft: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  weekSection: {
    marginBottom: 8,
  },
  weekChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 60,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dayBar: {
    width: 24,
    height: 40,
    borderRadius: 4,
    marginBottom: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  dayBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalScroll: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  modalBottleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  modalBottleButton: {
    width: '22%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBottleAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  modalBottleName: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  customAmountSection: {
    gap: 12,
  },
  customAmountInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 8,
  },
  goalAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 8,
  },
  adjustButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    minWidth: 100,
    textAlign: 'center',
  },
  // Minimal mode styles
  minimalContainer: {
    padding: 12,
    marginVertical: 4,
  },
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  minimalTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  minimalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minimalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalSettingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  minimalProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  preferredBottleSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  preferredBottleLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  preferredBottleButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  preferredBottleAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  preferredBottleText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default WaterTracker; 