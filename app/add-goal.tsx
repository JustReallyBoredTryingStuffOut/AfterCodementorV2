import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAiStore, Goal } from "@/store/aiStore";
import { useNotificationStore } from "@/store/notificationStore";

const CATEGORIES = [
  { id: "weight", label: "Weight" },
  { id: "workout", label: "Workout" },
  { id: "nutrition", label: "Nutrition" },
  { id: "water", label: "Water" },
  { id: "steps", label: "Steps" },
  { id: "health", label: "Health" },
  { id: "other", label: "Other" }
];

export default function AddGoalScreen() {
  const router = useRouter();
  const { addGoal, scheduleGoalReminder } = useAiStore();
  
  const [goalText, setGoalText] = useState("");
  const [category, setCategory] = useState("workout");
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly">("weekly");
  const [waterBottleSize, setWaterBottleSize] = useState("");
  const [showWaterBottleInput, setShowWaterBottleInput] = useState(false);
  
  // Check if goal is about water intake
  useEffect(() => {
    const isWaterGoal = 
      category === "water" && 
      goalText.toLowerCase().includes("water") &&
      (goalText.toLowerCase().includes("drink") || 
       goalText.toLowerCase().includes("liter") || 
       goalText.toLowerCase().includes("l"));
    
    setShowWaterBottleInput(isWaterGoal);
  }, [category, goalText]);
  
  const handleGoBack = () => {
    router.back();
  };
  
  const handleAddGoal = async () => {
    if (goalText.trim() === "") {
      Alert.alert("Error", "Please enter a goal");
      return;
    }
    
    const newGoal: Goal = {
      id: Date.now().toString(),
      text: goalText.trim(),
      date: new Date().toISOString(),
      completed: false,
      category,
      timeframe,
    };
    
    // Add water bottle size if provided
    if (showWaterBottleInput && waterBottleSize) {
      // Replace comma with dot for decimal parsing
      const normalizedSize = waterBottleSize.replace(',', '.');
      const bottleSize = parseFloat(normalizedSize);
      if (!isNaN(bottleSize) && bottleSize > 0) {
        newGoal.waterBottleSize = bottleSize;
      }
    }
    
    addGoal(newGoal);
    
    // Schedule reminders for water goals
    if (category === 'water' && typeof scheduleGoalReminder === 'function') {
      try {
        // For water goals, schedule hourly reminders by default
        scheduleGoalReminder(newGoal.id, 'hourly');
        
        // Also schedule water notifications
        const notificationStore = useNotificationStore.getState();
        if (notificationStore && notificationStore.scheduleWaterNotification) {
          await notificationStore.scheduleWaterNotification();
        }
      } catch (error) {
        console.error("Error scheduling water goal reminder:", error);
      }
    } else if (typeof scheduleGoalReminder === 'function') {
      try {
        // For other goals, schedule daily reminders
        scheduleGoalReminder(newGoal.id, 'daily');
      } catch (error) {
        console.error("Error scheduling daily goal reminder:", error);
      }
    }
    
    router.back();
  };
  
  // Handle water bottle size input to accept both comma and dot
  const handleWaterBottleSizeChange = (text: string) => {
    // Allow only numbers and a single decimal separator (comma or dot)
    const sanitizedText = text.replace(/[^0-9.,]/g, '');
    
    // Ensure only one decimal separator
    const commaCount = (sanitizedText.match(/,/g) || []).length;
    const dotCount = (sanitizedText.match(/\./g) || []).length;
    
    if (commaCount + dotCount <= 1) {
      setWaterBottleSize(sanitizedText);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen 
        options={{
          title: "Add New Goal",
          headerShown: true,
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
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>What's your goal?</Text>
          <TextInput
            style={styles.input}
            value={goalText}
            onChangeText={setGoalText}
            placeholder="e.g., Drink 2L of water daily for a week"
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={200}
          />
          
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  category === cat.id && styles.selectedCategoryButton
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.id && styles.selectedCategoryText
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.label}>Timeframe</Text>
          <View style={styles.timeframeContainer}>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                timeframe === "weekly" && styles.selectedTimeframeButton
              ]}
              onPress={() => setTimeframe("weekly")}
            >
              <Text
                style={[
                  styles.timeframeText,
                  timeframe === "weekly" && styles.selectedTimeframeText
                ]}
              >
                Weekly
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                timeframe === "monthly" && styles.selectedTimeframeButton
              ]}
              onPress={() => setTimeframe("monthly")}
            >
              <Text
                style={[
                  styles.timeframeText,
                  timeframe === "monthly" && styles.selectedTimeframeText
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
          </View>
          
          {showWaterBottleInput && (
            <>
              <Text style={styles.label}>Water Bottle Size (Liters)</Text>
              <TextInput
                style={styles.input}
                value={waterBottleSize}
                onChangeText={handleWaterBottleSizeChange}
                placeholder="e.g., 0.5 or 0,5"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.helperText}>
                This helps track your progress in terms of water bottles (use dot or comma for decimals)
              </Text>
            </>
          )}
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddGoal}
          >
            <Text style={styles.addButtonText}>Add Goal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.card,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategoryButton: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedCategoryText: {
    color: colors.primary,
    fontWeight: "600",
  },
  timeframeContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTimeframeButton: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  timeframeText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  selectedTimeframeText: {
    color: colors.primary,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});