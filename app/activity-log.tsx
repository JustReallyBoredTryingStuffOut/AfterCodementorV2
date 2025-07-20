import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Switch, TouchableOpacity, Modal } from "react-native";
import { Stack, useRouter } from "expo-router";
import { MapPin, Clock, Calendar, ArrowLeft, Zap, RefreshCw, TrendingUp, Activity, Plus } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useHealthStore } from "@/store/healthStore";
import { ActivityLog } from "@/types";
import Button from "@/components/Button";
import { Picker } from "@react-native-picker/picker";
import NoteInput from "@/components/NoteInput";
import SwimmingActivityCard from '@/components/SwimmingActivityCard';
import SwimmingProgressTracker from '@/components/SwimmingProgressTracker';
import ActivityCard from "@/components/ActivityCard";
import ActivityDetailModal from "@/components/ActivityDetailModal";
import { useTheme } from "@react-navigation/native";
import { usePhotoStore } from "@/store/photoStore";

export default function ActivityLogScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { activityLogs, addActivityLog, removeActivityLog, syncSwimmingFromHealthKit, manualSyncSwimming } = useHealthStore();
  const { progressPhotos } = usePhotoStore();
  
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSwimmingSyncLoading, setIsSwimmingSyncLoading] = useState(false);
  const [showSwimmingProgress, setShowSwimmingProgress] = useState(false);
  
  const [activityType, setActivityType] = useState("walking");
  const [duration, setDuration] = useState("30");
  const [distance, setDistance] = useState("2.5");
  const [calories, setCalories] = useState("150");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(
    new Date().toTimeString().split(" ")[0].substring(0, 5)
  );
  const [isOutdoor, setIsOutdoor] = useState(true);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  
  const handleSave = () => {
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      type: activityType,
      duration: parseInt(duration) || 0,
      distance: parseFloat(distance) || 0,
      calories: parseInt(calories) || 0,
      date: `${date}T${time}:00`,
      isOutdoor,
      location: isOutdoor ? location : "",
      notes,
    };
    
    addActivityLog(newActivity);
    Alert.alert("Success", "Activity logged successfully");
    router.back();
  };
  
  // Calculate calories based on activity type, duration, and distance
  const calculateCalories = () => {
    const durationNum = parseInt(duration) || 0;
    const distanceNum = parseFloat(distance) || 0;
    
    let caloriesPerMinute = 0;
    
    switch (activityType) {
      case "walking":
        caloriesPerMinute = 4; // ~4 calories per minute for walking
        break;
      case "running":
        caloriesPerMinute = 10; // ~10 calories per minute for running
        break;
      case "cycling":
        caloriesPerMinute = 8; // ~8 calories per minute for cycling
        break;
      case "swimming":
        caloriesPerMinute = 9; // ~9 calories per minute for swimming
        break;
      case "hiking":
        caloriesPerMinute = 6; // ~6 calories per minute for hiking
        break;
      default:
        caloriesPerMinute = 5; // Default value
    }
    
    const estimatedCalories = Math.round(durationNum * caloriesPerMinute);
    setCalories(estimatedCalories.toString());
  };
  
  // Update calories when activity type, duration, or distance changes
  React.useEffect(() => {
    calculateCalories();
  }, [activityType, duration, distance]);
  
  const handleGoBack = () => {
    router.back();
  };

  const handleSwimmingSync = async () => {
    setIsSwimmingSyncLoading(true);
    try {
      const success = await manualSyncSwimming();
      if (success) {
        Alert.alert(
          "Sync Complete",
          "Swimming activities have been synced from Apple Health!",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Sync Failed",
          "No new swimming activities found or sync failed. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error syncing swimming:", error);
      Alert.alert(
        "Sync Error",
        "There was an error syncing swimming activities. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSwimmingSyncLoading(false);
    }
  };

  // Filter swimming activities
  const swimmingActivities = activityLogs.filter(activity => activity.type === 'swimming');
  const otherActivities = activityLogs.filter(activity => activity.type !== 'swimming');

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen 
        options={{
          title: "Log Activity",
          headerBackTitle: "Health",
          headerLeft: () => (
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Activity Log</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track your fitness activities</Text>
      </View>

      {/* Swimming Section */}
      {swimmingActivities.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Zap size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Swimming Activities
              </Text>
            </View>
            <View style={styles.sectionActions}>
              <TouchableOpacity
                style={[styles.syncButton, { backgroundColor: colors.primary }]}
                onPress={handleSwimmingSync}
                disabled={isSwimmingSyncLoading}
              >
                <RefreshCw size={16} color="white" style={isSwimmingSyncLoading ? styles.rotating : undefined} />
                <Text style={styles.syncButtonText}>
                  {isSwimmingSyncLoading ? 'Syncing...' : 'Sync'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.progressButton, { borderColor: colors.border }]}
                onPress={() => setShowSwimmingProgress(!showSwimmingProgress)}
              >
                <TrendingUp size={16} color={colors.primary} />
                <Text style={[styles.progressButtonText, { color: colors.primary }]}>
                  Progress
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showSwimmingProgress ? (
            <SwimmingProgressTracker activities={swimmingActivities} />
          ) : (
            swimmingActivities.map((activity) => (
              <SwimmingActivityCard
                key={activity.id}
                activity={activity}
                onPress={() => {
                  setSelectedActivity(activity);
                  setIsModalVisible(true);
                }}
              />
            ))
          )}
        </View>
      )}

      {/* Other Activities Section */}
      {otherActivities.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Other Activities
            </Text>
          </View>
          
          {otherActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onPress={() => {
                setSelectedActivity(activity);
                setIsModalVisible(true);
              }}
            />
          ))}
        </View>
      )}

      {/* Empty State */}
      {activityLogs.length === 0 && (
        <View style={[styles.emptyContainer, { backgroundColor: colors.cardBackground }]}>
          <Activity size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Activities Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Start tracking your fitness activities or sync from Apple Health
          </Text>
          
          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/log-cardio')}
            >
              <Text style={styles.primaryButtonText}>Log Activity</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={handleSwimmingSync}
              disabled={isSwimmingSyncLoading}
            >
              <RefreshCw size={16} color={colors.primary} style={isSwimmingSyncLoading ? styles.rotating : undefined} />
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                {isSwimmingSyncLoading ? 'Syncing...' : 'Sync from Health'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add Activity Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/log-cardio')}
      >
        <Plus size={24} color="white" />
        <Text style={styles.addButtonText}>Add Activity</Text>
      </TouchableOpacity>

      {/* Activity Detail Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        {selectedActivity && (
          <ActivityDetailModal
            activity={selectedActivity}
            onClose={() => {
              setIsModalVisible(false);
              setSelectedActivity(null);
            }}
            onDelete={() => {
              removeActivityLog(selectedActivity.id);
              setIsModalVisible(false);
              setSelectedActivity(null);
            }}
          />
        )}
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
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
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  dateTimeContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  notesContainer: {
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 8,
  },
  backButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  progressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  progressButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});