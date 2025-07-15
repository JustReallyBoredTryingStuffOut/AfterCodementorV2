import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Plus, Trash2, Target } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useAiStore, Goal } from "@/store/aiStore";
import GoalPrompt from "@/components/GoalPrompt";

export default function GoalsScreen() {
  const router = useRouter();
  const { goals, deleteGoal, addGoal, scheduleGoalReminder } = useAiStore();
  const [selectedTimeframe, setSelectedTimeframe] = useState<"all" | "weekly" | "monthly">("all");
  const [showGoalPrompt, setShowGoalPrompt] = useState(false);
  const [isSettingGoal, setIsSettingGoal] = useState(false);
  const [selectedTimeframeForModal, setSelectedTimeframeForModal] = useState<"weekly" | "monthly">("weekly");
  
  // Goal suggestions
  const GOAL_EXAMPLES = [
    "Drink 2L of water daily",
    "Walk 10,000 steps every day this week",
    "Complete 50 pushups by the end of the week",
    "Lose 0.5kg this week",
    "Go to the gym 3 times this week",
    "Meditate for 10 minutes daily",
    "Run 5km three times this week",
    "Do yoga for 20 minutes every morning",
    "Stretch for 15 minutes after each workout",
    "Eat 5 servings of vegetables daily",
    "Track all meals in the app every day",
    "Get 8 hours of sleep each night",
    "Take 10,000 steps daily for a month",
    "Complete 100 squats by end of week",
    "Reduce sugar intake to under 25g daily",
    "Increase protein intake to 120g daily",
    "Drink green tea instead of coffee",
    "Try a new workout class weekly",
    "Meal prep lunches for the entire week",
    "Do 3 HIIT workouts this week",
    "Increase deadlift weight by 5kg",
    "Practice mindful eating at every meal",
    "Take progress photos weekly",
    "Cycle to work 3 days this week",
    "Climb stairs instead of using elevator",
    "Drink 3L of water daily for hydration",
    "Complete 200 crunches by weekend",
    "Walk at least 8,000 steps every day",
    "Stretch for 10 minutes before bed",
    "Limit screen time to 1 hour before sleep",
    "Add a vegetable to every meal",
    "Do 20 minutes of cardio 4 times this week",
    "Practice deep breathing for 5 minutes daily",
    "Increase water intake by 500ml daily",
    "Try one new healthy recipe each week",
    "Do 15 minutes of mobility work daily",
    "Reach 12,000 steps three times this week",
    "Cut out added sugars for the week",
    "Drink a glass of water before each meal",
    "Complete 3 strength training sessions",
    "Increase daily fiber intake to 30g",
    "Take the stairs instead of elevator daily",
    "Meditate for 5 minutes every morning",
    "Stretch for 10 minutes before bedtime",
    "Track macros for all meals this week",
    "Try intermittent fasting for 5 days",
    "Do 100 kettlebell swings daily",
    "Complete 20 pull-ups by end of week",
    "Increase bench press by 2.5kg",
    "Walk or bike for all trips under 2km",
    "Reduce sodium intake to under 2000mg daily",
    "Practice proper posture throughout day",
    "Increase daily step count by 1000 steps",
    "Do 50 bodyweight squats every morning",
    "Try a new vegetable or fruit each day",
    "Complete 30-day plank challenge",
    "Drink herbal tea instead of coffee",
    "Reduce processed food consumption by 50%",
    "Increase daily protein to 1.5g per kg bodyweight",
    "Practice yoga for 15 minutes daily",
    "Maintain calorie deficit of 300 kcal daily",
    "Complete 10,000 steps before noon",
    "Drink 500ml water immediately after waking"
  ];
  
  const filteredGoals = selectedTimeframe === "all" 
    ? goals 
    : goals.filter(goal => goal.timeframe === selectedTimeframe);
  
  const handleGoBack = () => {
    router.back();
  };
  
  const handleDeleteGoal = (goalId: string) => {
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: () => deleteGoal(goalId),
          style: "destructive"
        }
      ]
    );
  };
  
  const handleSubmitGoal = async (goalText: string, timeframe: "weekly" | "monthly", targetDate?: string, waterBottleSize?: number) => {
    setIsSettingGoal(true);
    
    try {
      // Detect goal category
      const detectGoalCategory = (text: string): string => {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('water') || lowerText.includes('drink') || lowerText.includes('hydrate')) return 'hydration';
        if (lowerText.includes('step') || lowerText.includes('walk') || lowerText.includes('run')) return 'activity';
        if (lowerText.includes('workout') || lowerText.includes('gym') || lowerText.includes('exercise')) return 'fitness';
        if (lowerText.includes('eat') || lowerText.includes('meal') || lowerText.includes('food') || lowerText.includes('diet')) return 'nutrition';
        if (lowerText.includes('sleep') || lowerText.includes('rest')) return 'wellness';
        if (lowerText.includes('meditate') || lowerText.includes('yoga') || lowerText.includes('mindful')) return 'wellness';
        return 'general';
      };
      
      // Extract target value from goal text
      const extractTargetValue = (text: string): number | null => {
        const matches = text.match(/(\d+(?:\.\d+)?)/);
        return matches ? parseFloat(matches[1]) : null;
      };
      
      // Extract time period from goal text
      const extractTimePeriod = (text: string): string => {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('daily') || lowerText.includes('every day')) return 'daily';
        if (lowerText.includes('weekly') || lowerText.includes('this week')) return 'weekly';
        if (lowerText.includes('monthly') || lowerText.includes('this month')) return 'monthly';
        return timeframe === "weekly" ? "weekly" : "monthly";
      };
      
      const category = detectGoalCategory(goalText);
      const targetValue = extractTargetValue(goalText);
      const timePeriod = extractTimePeriod(goalText);
      
      const newGoal = {
        id: Date.now().toString(),
        text: goalText,
        category,
        timeframe,
        targetValue,
        timePeriod,
        progress: 0,
        completed: false,
        createdAt: new Date().toISOString(),
        targetDate: targetDate || undefined,
        waterBottleSize: waterBottleSize || undefined
      };
      
      addGoal(newGoal);
      
      // Schedule goal reminder if it's a water goal
      if (category === 'hydration' && waterBottleSize) {
        scheduleGoalReminder(newGoal.id, waterBottleSize);
      }
      
      setShowGoalPrompt(false);
    } catch (error) {
      console.error('Error setting goal:', error);
      Alert.alert('Error', 'Failed to set goal. Please try again.');
    } finally {
      setIsSettingGoal(false);
    }
  };
  
  const openGoalPrompt = () => {
    setShowGoalPrompt(true);
  };
  
  const renderGoalItem = ({ item }: { item: Goal }) => {
    const progressPercentage = item.progress || 0;
    
    return (
      <View style={styles.goalItem}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalText}>{item.text}</Text>
          <TouchableOpacity 
            onPress={() => handleDeleteGoal(item.id)}
            style={styles.deleteButton}
            accessibilityLabel="Delete goal"
          >
            <Trash2 size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.goalDetails}>
          <Text style={styles.goalCategory}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)} • 
            {item.timeframe === "weekly" ? " Weekly" : " Monthly"}
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progressPercentage}%` },
                  item.completed ? styles.completedProgress : null
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{progressPercentage}%</Text>
          </View>
          
          <Text style={styles.progressMessage}>
            {useAiStore.getState().getGoalProgressMessage(item)}
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: "My Goals",
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
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push("/add-goal")}
              style={styles.addButton}
              accessibilityLabel="Add new goal"
            >
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            selectedTimeframe === "all" && styles.activeFilter
          ]}
          onPress={() => setSelectedTimeframe("all")}
        >
          <Text 
            style={[
              styles.filterText, 
              selectedTimeframe === "all" && styles.activeFilterText
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            selectedTimeframe === "weekly" && styles.activeFilter
          ]}
          onPress={() => setSelectedTimeframe("weekly")}
        >
          <Text 
            style={[
              styles.filterText, 
              selectedTimeframe === "weekly" && styles.activeFilterText
            ]}
          >
            Weekly
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            selectedTimeframe === "monthly" && styles.activeFilter
          ]}
          onPress={() => setSelectedTimeframe("monthly")}
        >
          <Text 
            style={[
              styles.filterText, 
              selectedTimeframe === "monthly" && styles.activeFilterText
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Add Goal Button */}
      <View style={styles.addGoalSection}>
        <TouchableOpacity 
          style={styles.addGoalPromptButton}
          onPress={openGoalPrompt}
        >
          <Target size={20} color={colors.white} />
          <Text style={styles.addGoalPromptText}>Create New Goal</Text>
        </TouchableOpacity>
      </View>
      
      {filteredGoals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No goals found</Text>
          <TouchableOpacity 
            style={styles.addGoalButton}
            onPress={() => router.push("/add-goal")}
          >
            <Text style={styles.addGoalButtonText}>Add a Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredGoals}
          renderItem={renderGoalItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Goal Prompt Modal */}
      <GoalPrompt
        visible={showGoalPrompt}
        prompt="What fitness goal would you like to set for yourself?"
        onClose={() => setShowGoalPrompt(false)}
        onSubmit={handleSubmitGoal}
        isLoading={isSettingGoal}
        examples={GOAL_EXAMPLES}
        timeframe={selectedTimeframeForModal}
        onTimeframeChange={setSelectedTimeframeForModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: colors.primaryLight,
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: colors.primary,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
  goalItem: {
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
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  goalText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  goalDetails: {
    marginTop: 12,
  },
  goalCategory: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  completedProgress: {
    backgroundColor: colors.success,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    width: 40,
    textAlign: "right",
  },
  progressMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  addGoalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addGoalButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
  addGoalSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addGoalPromptButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  addGoalPromptText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
});