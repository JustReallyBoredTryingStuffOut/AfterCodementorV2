import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Plus, ChevronRight, UtensilsCrossed, BarChart, Calendar, ArrowLeft, Info, Coffee, Sun, Moon, Droplets, Lightbulb, Bell } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useMacroStore } from '@/store/macroStore';
import { useGamificationStore } from '@/store/gamificationStore';
import { useWaterStore } from '@/store/waterStore';
import { useMealStore } from '@/store/mealStore';
import MacroProgress from '@/components/MacroProgress';
import MacroInfoModal from '@/components/MacroInfoModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import * as Notifications from "expo-notifications";

export default function NutritionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { macroGoals, macroLogs, calculateDailyMacros } = useMacroStore();
  const { gamificationEnabled, achievements } = useGamificationStore();
  const { getWaterIntakeByDate, setTarget } = useWaterStore();
  const { meals } = useMealStore();
  
  // Get today's water intake with safe access
  const todayWaterIntake = getWaterIntakeByDate ? getWaterIntakeByDate(new Date()) : null;
  const waterIntake = todayWaterIntake?.amount || 0;
  const waterGoal = todayWaterIntake?.goal || 2000; // Default 2L
  
  // Get today's meals with safe access
  const todayMeals = meals ? meals.filter(meal => {
    try {
      const mealDate = new Date(meal.date);
      const today = new Date();
      return mealDate.toDateString() === today.toDateString();
    } catch (error) {
      console.warn('Error filtering meal date:', error);
      return false;
    }
  }) : [];
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  // Format date as ISO string (YYYY-MM-DD)
  const dateString = selectedDate.toISOString().split('T')[0];
  
  // Calculate today's macros with safe access
  const todayMacros = calculateDailyMacros ? calculateDailyMacros(dateString) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  // Calculate percentages with safety checks
  const caloriePercentage = Math.min(100, ((todayMacros?.calories || 0) / (macroGoals?.calories || 1)) * 100);
  const proteinPercentage = Math.min(100, ((todayMacros?.protein || 0) / (macroGoals?.protein || 1)) * 100);
  const carbsPercentage = Math.min(100, ((todayMacros?.carbs || 0) / (macroGoals?.carbs || 1)) * 100);
  const fatPercentage = Math.min(100, ((todayMacros?.fat || 0) / (macroGoals?.fat || 1)) * 100);
  
  // Get nutrition achievements with safe access
  const nutritionAchievements = achievements ? achievements.filter(a => 
    a.category === "nutrition" && !a.completed
  ) : [];
  
  // Find specific achievements
  const proteinGoalAchievement = nutritionAchievements.find(a => a.id === "nutrition-protein-goal");
  const balancedMacrosAchievement = nutritionAchievements.find(a => a.id === "nutrition-balanced-10");
  const logWeekAchievement = nutritionAchievements.find(a => a.id === "nutrition-log-week");

  const handleAddFood = () => {
    router.push('/log-food');
  };

  const handleViewHistory = () => {
    router.push('/nutrition-history');
  };

  const handleViewNutritionInsights = () => {
    router.push('/nutrition-insights');
  };
  
  const handleGoBack = () => {
    router.back();
  };

  // Test water notification function
  const testWaterNotification = async () => {
    try {
      if (Platform.OS !== 'web') {
        // Don't proactively request permissions - let iOS handle it natively
        // when notifications are actually scheduled
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to receive meal reminders."
          );
          return;
        }
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

  // Generate nutrition tips
  const getNutritionTip = () => {
    const tips = [
      "Start your day with protein-rich breakfast to keep you full longer.",
      "Include colorful vegetables in every meal for essential vitamins.",
      "Stay hydrated by drinking water before each meal.",
      "Choose whole grains over refined grains for better nutrition.",
      "Include healthy fats like nuts and avocados in your diet.",
      "Plan your meals ahead to avoid unhealthy last-minute choices.",
      "Listen to your body's hunger and fullness cues.",
      "Include protein in every meal to support muscle health.",
      "Limit added sugars and focus on natural sweeteners.",
      "Eat slowly and mindfully to better enjoy your food."
    ];
    
    // Use the day of the year to cycle through tips
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return tips[dayOfYear % tips.length];
  };
  
  // Generate achievement progress message
  const getAchievementProgressMessage = () => {
    if (!gamificationEnabled) return null;
    
    if (proteinGoalAchievement && proteinGoalAchievement.progress > 0) {
      return `You've met your protein goal ${proteinGoalAchievement.progress} out of ${proteinGoalAchievement.target} days. Keep it up!`;
    }
    
    if (balancedMacrosAchievement && balancedMacrosAchievement.progress > 0) {
      return `You've maintained balanced macros for ${balancedMacrosAchievement.progress} out of ${balancedMacrosAchievement.target} days!`;
    }
    
    if (logWeekAchievement && logWeekAchievement.progress > 0) {
      return `You've logged your meals for ${logWeekAchievement.progress} out of ${logWeekAchievement.target} consecutive days!`;
    }
    
    return "Track your nutrition consistently to unlock achievements and earn points!";
  };

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen 
          options={{
            title: 'Nutrition',
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
              <TouchableOpacity onPress={handleViewHistory} style={styles.historyButton}>
                <Calendar size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Daily Nutrition</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity 
                style={[styles.quickActionButton, { backgroundColor: colors.card }]}
                onPress={() => router.push('/log-food?meal=breakfast')}
              >
                <Sun size={20} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Breakfast</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickActionButton, { backgroundColor: colors.card }]}
                onPress={() => router.push('/log-food?meal=lunch')}
              >
                <UtensilsCrossed size={20} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Lunch</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickActionButton, { backgroundColor: colors.card }]}
                onPress={() => router.push('/log-food?meal=dinner')}
              >
                <Moon size={20} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Dinner</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickActionButton, { backgroundColor: colors.card }]}
                onPress={() => router.push('/log-food?meal=snack')}
              >
                <Coffee size={20} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.text }]}>Snack</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickActionButton, { backgroundColor: colors.success }]}
                onPress={testWaterNotification}
              >
                <Bell size={20} color={colors.white} />
                <Text style={[styles.quickActionText, { color: colors.white }]}>Test Water</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Water Tracking */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Water Intake</Text>
            <View style={[styles.waterCard, { backgroundColor: colors.card }]}>
              <View style={styles.waterHeader}>
                <Droplets size={24} color={colors.primary} />
                <Text style={[styles.waterTitle, { color: colors.text }]}>Daily Hydration</Text>
              </View>
              <View style={styles.waterProgress}>
                <Text style={[styles.waterAmount, { color: colors.text }]}>
                  {waterIntake} / {waterGoal} ml
                </Text>
                <View style={[styles.waterProgressBar, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.waterProgressFill, 
                      { 
                        width: `${Math.min(100, (waterIntake / waterGoal) * 100)}%`,
                        backgroundColor: colors.primary 
                      }
                    ]} 
                  />
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.addWaterButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/water-intake')}
              >
                <Text style={[styles.addWaterButtonText, { color: colors.white }]}>Add Water</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Meals */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Meals</Text>
            {todayMeals.length > 0 ? (
              <View style={styles.mealsContainer}>
                {todayMeals.map((meal, index) => (
                  <View key={meal.id} style={[styles.mealCard, { backgroundColor: colors.card }]}>
                    <View style={styles.mealHeader}>
                      <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
                      <Text style={[styles.mealTime, { color: colors.textSecondary }]}>
                        {new Date(meal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={[styles.mealCalories, { color: colors.textSecondary }]}>
                      {meal.calories} kcal
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.noMealsCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.noMealsText, { color: colors.textSecondary }]}>
                  No meals logged today. Use the quick actions above to log your first meal!
                </Text>
              </View>
            )}
          </View>

          {/* Nutrition Tips */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Nutrition Tips</Text>
            <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
              <View style={styles.tipsHeader}>
                <Lightbulb size={20} color={colors.primary} />
                <Text style={[styles.tipsTitle, { color: colors.text }]}>Today's Tip</Text>
              </View>
              <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
                {getNutritionTip()}
              </Text>
            </View>
          </View>
          
          <View style={[styles.macroCard, { backgroundColor: colors.card }]}>
            <View style={styles.macroHeader}>
              <View style={styles.macroTitleContainer}>
                <Text style={[styles.macroTitle, { color: colors.white }]}>Macros</Text>
                <TouchableOpacity 
                  onPress={() => setInfoModalVisible(true)}
                  style={styles.infoButton}
                  accessibilityLabel="Nutrition information"
                  accessibilityHint="Opens a modal with information about how nutrition goals are calculated"
                >
                  <Info size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleAddFood}>
                <View style={[styles.addButton, { backgroundColor: colors.primary }]}>
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add Food</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.macroContent}>
              <ErrorBoundary>
                <MacroProgress
                  title="Calories"
                  current={todayMacros?.calories || 0}
                  goal={macroGoals?.calories || 0}
                  unit="kcal"
                  percentage={caloriePercentage}
                  color={colors.calorieColor}
                />
              </ErrorBoundary>
              
              <ErrorBoundary>
                <MacroProgress
                  title="Protein"
                  current={todayMacros?.protein || 0}
                  goal={macroGoals?.protein || 0}
                  unit="g"
                  percentage={proteinPercentage}
                  color={colors.macroProtein}
                  achievementId={proteinGoalAchievement?.id}
                />
              </ErrorBoundary>
              
              <ErrorBoundary>
                <MacroProgress
                  title="Carbs"
                  current={todayMacros?.carbs || 0}
                  goal={macroGoals?.carbs || 0}
                  unit="g"
                  percentage={carbsPercentage}
                  color={colors.macroCarbs}
                />
              </ErrorBoundary>
              
              <ErrorBoundary>
                <MacroProgress
                  title="Fat"
                  current={todayMacros?.fat || 0}
                  goal={macroGoals?.fat || 0}
                  unit="g"
                  percentage={fatPercentage}
                  color={colors.macroFat}
                />
              </ErrorBoundary>
            </View>
            
            {gamificationEnabled && (
              <View style={styles.achievementContainer}>
                <Text style={[styles.achievementText, { color: colors.white }]}>
                  {getAchievementProgressMessage()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Food Analysis</Text>
              <TouchableOpacity onPress={() => router.push('/food-photos')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.analysisCard, { backgroundColor: colors.card }]}
              onPress={() => router.push('/capture-food')}
            >
              <View style={styles.analysisContent}>
                <UtensilsCrossed size={24} color={colors.primary} />
                <View style={styles.analysisTextContainer}>
                  <Text style={[styles.analysisTitle, { color: colors.text }]}>Analyze Food with Camera</Text>
                  <Text style={[styles.analysisDescription, { color: colors.textSecondary }]}>
                    Take a photo of your meal or scan nutrition labels
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.analysisCard, { backgroundColor: colors.card }]}
              onPress={handleViewNutritionInsights}
            >
              <View style={styles.analysisContent}>
                <BarChart size={24} color={colors.primary} />
                <View style={styles.analysisTextContainer}>
                  <Text style={[styles.analysisTitle, { color: colors.text }]}>Nutrition Insights</Text>
                  <Text style={[styles.analysisDescription, { color: colors.textSecondary }]}>
                    View trends and patterns in your nutrition data
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        <MacroInfoModal 
          visible={infoModalVisible}
          onClose={() => setInfoModalVisible(false)}
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  historyButton: {
    padding: 8,
  },
  backButton: {
    padding: 8,
  },
  macroCard: {
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  macroTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoButton: {
    marginLeft: 8,
    padding: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  macroContent: {
    gap: 16,
  },
  achievementContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  achievementText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 80,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  waterCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  waterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  waterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  waterProgress: {
    marginBottom: 12,
  },
  waterAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  waterProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  waterProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  addWaterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addWaterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipsCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  mealsContainer: {
    gap: 8,
  },
  mealCard: {
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealTime: {
    fontSize: 12,
  },
  mealCalories: {
    fontSize: 14,
  },
  noMealsCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noMealsText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  analysisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  analysisContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  analysisDescription: {
    fontSize: 14,
  },
});