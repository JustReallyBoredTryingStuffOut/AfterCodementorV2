import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Switch, ScrollView, Alert, Platform, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Bell, Clock, Dumbbell, Utensils, Calendar, ArrowLeft, Save } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useNotificationStore } from "@/store/notificationStore";
import * as Notifications from "expo-notifications";
import Button from "@/components/Button";

export default function NotificationsScreen() {
  const router = useRouter();
  
  // Add error boundary for notification store
  const [storeError, setStoreError] = useState(false);
  
  let notificationStore;
  try {
    notificationStore = useNotificationStore();
  } catch (error) {
    console.error('Error accessing notification store:', error);
    setStoreError(true);
  }
  
  const { 
    settings, 
    updateSettings,
    workoutReminders,
    updateWorkoutReminder,
    mealReminders,
    updateMealReminder,
    waterReminders,
    updateWaterReminder,
    stepReminders,
    updateStepReminder
  } = notificationStore || {};
  
  const [hasPermission, setHasPermission] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Add safe defaults for notification store
  const safeSettings = settings || { enabled: false };
  const safeWorkoutReminders = workoutReminders || { minutesBefore: 30, sound: true };
  const safeMealReminders = mealReminders || { breakfast: true, breakfastTime: "08:00", lunch: true, lunchTime: "12:30", dinner: true, dinnerTime: "19:00", snacks: false };
  const safeWaterReminders = waterReminders || { interval: 60, startTime: "08:00", endTime: "22:00", specificTimes: ["10:00", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30", "21:00"] };
  const safeStepReminders = stepReminders || { reminderTime: "19:00", goalPercentage: 70 };
  
  useEffect(() => {
    checkNotificationPermissions();
  }, []);
  
  const checkNotificationPermissions = async () => {
    if (Platform.OS === "web") {
      setHasPermission(false);
      return;
    }
    
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === "granted");
  };
  
  const requestPermissions = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not Available", "Notifications are not available on web");
      return;
    }
    
    const { status } = await Notifications.requestPermissionsAsync();
    setHasPermission(status === "granted");
    
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please enable notifications in your device settings to receive reminders"
      );
    } else {
      Alert.alert("Success", "Notification permissions granted");
    }
  };
  
  const toggleNotifications = (value: boolean) => {
    if (value && !hasPermission) {
      requestPermissions();
    }
    
    updateSettings({
      ...settings,
      enabled: value,
    });
    setHasChanges(true);
  };
  
  const handleGoBack = () => {
    if (hasChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Do you want to save before leaving?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
          {
            text: "Save",
            onPress: () => {
              saveSettings();
              router.back();
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      router.back();
    }
  };
  
  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Here you would typically make API calls or perform async operations
      // to save the settings to a backend or local storage
      
      // Simulate a delay for the save operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setHasChanges(false);
      Alert.alert("Success", "Notification settings saved successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to save notification settings");
      console.error("Error saving notification settings:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const updateSettingWithChange = (newSettings: any) => {
    updateSettings(newSettings);
    setHasChanges(true);
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: "Notifications",
          headerShown: true,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleGoBack} 
              style={styles.backButton}
              accessibilityLabel="Go back"
              accessibilityHint="Returns to the previous screen"
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Notification Settings</Text>
          <Text style={styles.subtitle}>Manage your reminders and alerts</Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={24} color={colors.primary} />
              <Text style={styles.settingTitle}>Enable Notifications</Text>
            </View>
            <Switch
              trackColor={{ false: colors.inactive, true: colors.primary }}
              thumbColor="#FFFFFF"
              value={safeSettings.enabled}
              onValueChange={toggleNotifications}
            />
          </View>
          
          {!hasPermission && safeSettings.enabled && (
            <View style={styles.permissionWarning}>
              <Text style={styles.permissionText}>
                Notifications permission is required. Please grant permission to receive reminders.
              </Text>
              <Button
                title="Grant Permission"
                onPress={requestPermissions}
                style={styles.permissionButton}
                variant="secondary"
              />
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Reminders</Text>
          
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Dumbbell size={24} color={colors.primary} />
                <View>
                  <Text style={styles.settingTitle}>Workout Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Remind me about scheduled workouts
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor="#FFFFFF"
                value={settings.workoutReminders}
                onValueChange={(value) => updateSettingWithChange({
                  ...settings,
                  workoutReminders: value,
                })}
                disabled={!settings.enabled}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Clock size={24} color={colors.primary} />
                <View>
                  <Text style={styles.settingTitle}>Reminder Time</Text>
                  <Text style={styles.settingDescription}>
                    {workoutReminders.minutesBefore} minutes before scheduled workout
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Reminders</Text>
          
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Utensils size={24} color={colors.primary} />
                <View>
                  <Text style={styles.settingTitle}>Meal Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Remind me to log my meals
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor="#FFFFFF"
                value={settings.mealReminders}
                onValueChange={(value) => updateSettingWithChange({
                  ...settings,
                  mealReminders: value,
                })}
                disabled={!settings.enabled}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Calendar size={24} color={colors.primary} />
                <View>
                  <Text style={styles.settingTitle}>Daily Summary</Text>
                  <Text style={styles.settingDescription}>
                    Send me a daily nutrition summary
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor="#FFFFFF"
                value={settings.dailySummary}
                onValueChange={(value) => updateSettingWithChange({
                  ...settings,
                  dailySummary: value,
                })}
                disabled={!settings.enabled}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Reminders</Text>
          
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Bell size={24} color={colors.primary} />
                <View>
                  <Text style={styles.settingTitle}>Step Goal Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Remind me to reach my daily step goal
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor="#FFFFFF"
                value={settings.stepReminders}
                onValueChange={(value) => updateSettingWithChange({
                  ...settings,
                  stepReminders: value,
                })}
                disabled={!settings.enabled}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Bell size={24} color={colors.primary} />
                <View>
                  <Text style={styles.settingTitle}>Water Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Remind me to drink water throughout the day
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: colors.inactive, true: colors.primary }}
                thumbColor="#FFFFFF"
                value={settings.waterReminders}
                onValueChange={(value) => updateSettingWithChange({
                  ...settings,
                  waterReminders: value,
                })}
                disabled={!settings.enabled}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Save Settings"
          onPress={saveSettings}
          style={styles.saveButton}
          loading={isSaving}
          icon={<Save size={20} color="#FFFFFF" />}
          disabled={!hasChanges}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80, // Extra padding at bottom for the save button
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginLeft: 12,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    marginTop: 2,
  },
  permissionWarning: {
    backgroundColor: "rgba(255, 204, 0, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  permissionText: {
    fontSize: 14,
    color: colors.warning,
    marginBottom: 8,
  },
  permissionButton: {
    marginTop: 4,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  saveButton: {
    width: "100%",
  },
});