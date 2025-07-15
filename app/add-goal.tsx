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

// Category-specific goal suggestions
const GOAL_SUGGESTIONS = {
  weight: [
    "Lose 0.5kg this week",
    "Lose 2kg this month",
    "Maintain current weight for a month",
    "Gain 0.5kg of muscle this month",
    "Reduce body fat by 1% this month",
    "Track weight daily for a week",
    "Stay within 1kg of target weight",
    "Lose 5kg over 3 months"
  ],
  workout: [
    "Go to the gym 3 times this week",
    "Complete 4 workouts this month",
    "Try a new workout class this week",
    "Increase bench press by 5kg this month",
    "Run 5km three times this week",
    "Do 50 pushups daily for a week",
    "Complete 100 squats by end of week",
    "Practice yoga for 20 minutes daily",
    "Do 3 HIIT workouts this week",
    "Increase deadlift weight by 5kg",
    "Complete 20 pull-ups by end of week",
    "Do 100 kettlebell swings daily"
  ],
  nutrition: [
    "Eat 5 servings of vegetables daily",
    "Track all meals in the app every day",
    "Reduce sugar intake to under 25g daily",
    "Increase protein intake to 120g daily",
    "Meal prep lunches for the entire week",
    "Try a new healthy recipe each week",
    "Cut out added sugars for the week",
    "Increase daily fiber intake to 30g",
    "Reduce sodium intake to under 2000mg daily",
    "Add a vegetable to every meal",
    "Try a new vegetable or fruit each day",
    "Reduce processed food consumption by 50%",
    "Increase daily protein to 1.5g per kg bodyweight",
    "Track macros for all meals this week",
    "Try intermittent fasting for 5 days",
    "Maintain calorie deficit of 300 kcal daily"
  ],
  water: [
    "Drink 2L of water daily",
    "Drink 3L of water daily for hydration",
    "Increase water intake by 500ml daily",
    "Drink a glass of water before each meal",
    "Drink 500ml water immediately after waking",
    "Drink 8 glasses of water daily",
    "Replace one soda with water daily",
    "Drink water instead of coffee for a week"
  ],
  steps: [
    "Walk 10,000 steps every day this week",
    "Take 10,000 steps daily for a month",
    "Walk at least 8,000 steps every day",
    "Reach 12,000 steps three times this week",
    "Complete 10,000 steps before noon",
    "Increase daily step count by 1000 steps",
    "Walk or bike for all trips under 2km",
    "Take the stairs instead of elevator daily",
    "Climb stairs instead of using elevator",
    "Cycle to work 3 days this week"
  ],
  health: [
    "Get 8 hours of sleep each night",
    "Meditate for 10 minutes daily",
    "Practice mindful eating at every meal",
    "Stretch for 15 minutes after each workout",
    "Limit screen time to 1 hour before sleep",
    "Practice deep breathing for 5 minutes daily",
    "Meditate for 5 minutes every morning",
    "Stretch for 10 minutes before bedtime",
    "Practice proper posture throughout day",
    "Do 15 minutes of mobility work daily",
    "Practice yoga for 15 minutes daily",
    "Take progress photos weekly"
  ],
  other: [
    "Read a fitness book this month",
    "Join a fitness challenge",
    "Find a workout buddy",
    "Set up a home gym space",
    "Learn about nutrition basics",
    "Create a workout playlist",
    "Set up a fitness tracking system",
    "Research healthy recipes"
  ]
};

export default function AddGoalScreen() {
  const router = useRouter();
  const { addGoal, scheduleGoalReminder } = useAiStore();
  
  const [goalText, setGoalText] = useState("");
  const [category, setCategory] = useState("workout");
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly">("weekly");
  const [waterBottleSize, setWaterBottleSize] = useState("");
  const [showWaterBottleInput, setShowWaterBottleInput] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
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
  
  // Handle selecting a goal suggestion
  const handleSelectSuggestion = (suggestion: string) => {
    setGoalText(suggestion);
    setShowSuggestions(false);
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
          
          {/* Goal Suggestions Section */}
          <View style={styles.suggestionsSection}>
            <TouchableOpacity
              style={styles.suggestionsHeader}
              onPress={() => setShowSuggestions(!showSuggestions)}
            >
              <Text style={styles.suggestionsTitle}>
                {showSuggestions ? "Hide" : "Show"} Goal Suggestions
              </Text>
            </TouchableOpacity>
            
            {showSuggestions && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsSubtitle}>
                  Popular {category.charAt(0).toUpperCase() + category.slice(1)} Goals:
                </Text>
                <View style={styles.suggestionsList}>
                  {GOAL_SUGGESTIONS[category as keyof typeof GOAL_SUGGESTIONS]?.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectSuggestion(suggestion)}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
          
          {/* Informational Text for Beginners */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>💡 Goal Setting Tips for Beginners</Text>
            <Text style={styles.infoText}>
              When starting your fitness journey, focus on building sustainable habits rather than achieving rapid results. 
              Research shows that individuals who set realistic, long-term goals are 2.5x more likely to maintain their progress.
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Quality over Quantity:</Text> Instead of setting multiple goals, choose 1-2 meaningful objectives that align with your lifestyle and current fitness level.
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Start Small:</Text> Begin with manageable goals that you can consistently achieve. This builds confidence and creates momentum for more challenging objectives.
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Track Progress:</Text> Regular monitoring helps you stay accountable and provides valuable insights into what works best for your body and schedule.
            </Text>
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
  suggestionsSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  suggestionsHeader: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    textAlign: "center",
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionsSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  suggestionsList: {
    gap: 8,
  },
  suggestionItem: {
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
  },
  infoSection: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  infoBold: {
    fontWeight: "600",
    color: colors.text,
  },
});