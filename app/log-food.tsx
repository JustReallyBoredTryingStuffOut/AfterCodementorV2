import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Image, Modal } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Plus, Minus, Clock, Coffee, UtensilsCrossed, Soup, ArrowLeft, Camera } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useMacroStore } from "@/store/macroStore";
import { useGamificationStore } from "@/store/gamificationStore";
import { MacroLog, FoodItem } from "@/types";
import Button from "@/components/Button";
import NoteInput from "@/components/NoteInput";
import CustomDropdown from "@/components/CustomDropdown";
import FoodCategorySelector from "@/components/FoodCategorySelector";
import NutritionLabelScanner from "@/components/NutritionLabelScanner";
import { foodCategories } from "@/mocks/foodCategories";

export default function LogFoodScreen() {
  const router = useRouter();
  const { addMacroLog, macroGoals, calculateDailyMacros } = useMacroStore();
  const { gamificationEnabled, achievements, updateAchievementProgress, unlockAchievement } = useGamificationStore();
  
  const [calories, setCalories] = useState("0");
  const [protein, setProtein] = useState("0");
  const [carbs, setCarbs] = useState("0");
  const [fat, setFat] = useState("0");
  const [notes, setNotes] = useState("");
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");
  const [selectedFoodItems, setSelectedFoodItems] = useState<FoodItem[]>([]);
  const [quantity, setQuantity] = useState("1");
  const [showNutritionScanner, setShowNutritionScanner] = useState(false);
  
  // Meal type options for dropdown
  const mealTypeOptions = [
    { label: "Breakfast", value: "breakfast" },
    { label: "Lunch", value: "lunch" },
    { label: "Dinner", value: "dinner" },
    { label: "Snack", value: "snack" }
  ];
  
  // Get current time in HH:MM format
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const [mealTime, setMealTime] = useState(`${hours}:${minutes}`);
  
  // Get today's date as ISO string
  const today = new Date().toISOString().split('T')[0];
  
  // Get current daily macros
  const todayMacros = calculateDailyMacros(today);
  
  // Check if macro goals are set up
  const hasValidMacroGoals = macroGoals && 
    macroGoals.calories > 0 && 
    macroGoals.protein > 0 && 
    macroGoals.carbs > 0 && 
    macroGoals.fat > 0;
  
  // Update macros when food items are selected
  useEffect(() => {
    if (selectedFoodItems.length > 0) {
      const totalCalories = selectedFoodItems.reduce((sum, item) => {
        const qty = parseInt(item.quantity || "1");
        return sum + (item.calories * qty);
      }, 0);
      
      const totalProtein = selectedFoodItems.reduce((sum, item) => {
        const qty = parseInt(item.quantity || "1");
        return sum + (item.protein * qty);
      }, 0);
      
      const totalCarbs = selectedFoodItems.reduce((sum, item) => {
        const qty = parseInt(item.quantity || "1");
        return sum + (item.carbs * qty);
      }, 0);
      
      const totalFat = selectedFoodItems.reduce((sum, item) => {
        const qty = parseInt(item.quantity || "1");
        return sum + (item.fat * qty);
      }, 0);
      
      setCalories(Math.round(totalCalories).toString());
      setProtein(Math.round(totalProtein).toString());
      setCarbs(Math.round(totalCarbs).toString());
      setFat(Math.round(totalFat).toString());
    }
  }, [selectedFoodItems]);
  
  const handleSave = () => {
    const newLog: MacroLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      notes,
      mealType,
      mealTime,
      foodItems: selectedFoodItems.length > 0 ? selectedFoodItems : undefined,
    };
    
    addMacroLog(newLog);
    
    // Check for nutrition achievements if gamification is enabled
    if (gamificationEnabled) {
      checkNutritionAchievements();
    }
    
    Alert.alert(
      "Success", 
      "Food logged successfully",
      [
        {
          text: "OK",
          onPress: () => router.back()
        }
      ]
    );
  };
  
  const checkNutritionAchievements = () => {
    // Find nutrition achievements
    const nutritionAchievements = achievements.filter(a => 
      a.category === "nutrition" && !a.completed
    );
    
    // Check for first meal logged achievement
    const firstMealAchievement = nutritionAchievements.find(a => a.id === "nutrition-log-first");
    if (firstMealAchievement) {
      updateAchievementProgress(firstMealAchievement.id, 1);
      unlockAchievement(firstMealAchievement.id);
    }
    
    // Check for protein goal achievement
    const proteinGoalAchievement = nutritionAchievements.find(a => a.id === "nutrition-protein-goal");
    if (proteinGoalAchievement) {
      const proteinValue = parseInt(protein) || 0;
      if (proteinValue >= (macroGoals?.protein || 0)) {
        updateAchievementProgress(proteinGoalAchievement.id, proteinGoalAchievement.progress + 1);
        
        // If we've reached the target, unlock the achievement
        if (proteinGoalAchievement.progress + 1 >= proteinGoalAchievement.target) {
          unlockAchievement(proteinGoalAchievement.id);
        }
      }
    }
    
    // Check for balanced macros achievement
    const balancedMacrosAchievement = nutritionAchievements.find(a => a.id === "nutrition-balanced-10");
    if (balancedMacrosAchievement) {
      const proteinValue = parseInt(protein) || 0;
      const carbsValue = parseInt(carbs) || 0;
      const fatValue = parseInt(fat) || 0;
      
      // Check if macros are within 10% of target ratios
      const isBalanced = 
        proteinValue >= (macroGoals?.protein || 0) * 0.9 && 
        proteinValue <= (macroGoals?.protein || 0) * 1.1 &&
        carbsValue >= (macroGoals?.carbs || 0) * 0.9 && 
        carbsValue <= (macroGoals?.carbs || 0) * 1.1 &&
        fatValue >= (macroGoals?.fat || 0) * 0.9 && 
        fatValue <= (macroGoals?.fat || 0) * 1.1;
      
      if (isBalanced) {
        updateAchievementProgress(balancedMacrosAchievement.id, balancedMacrosAchievement.progress + 1);
        
        // If we've reached the target, unlock the achievement
        if (balancedMacrosAchievement.progress + 1 >= balancedMacrosAchievement.target) {
          unlockAchievement(balancedMacrosAchievement.id);
        }
      }
    }
  };
  
  const adjustValue = (setter: React.Dispatch<React.SetStateAction<string>>, value: string, amount: number) => {
    const currentValue = parseInt(value) || 0;
    const newValue = Math.max(0, currentValue + amount);
    setter(newValue.toString());
  };
  
  const adjustQuantity = (foodItem: FoodItem, amount: number) => {
    const currentValue = parseInt(foodItem.quantity || "1");
    const newValue = Math.max(1, currentValue + amount);
    
    const updatedItems = selectedFoodItems.map(item => {
      if (item.id === foodItem.id) {
        return { ...item, quantity: newValue.toString() };
      }
      return item;
    });
    
    setSelectedFoodItems(updatedItems);
  };
  
  const getMealTypeIcon = () => {
    switch (mealType) {
      case "breakfast":
        return <Coffee size={20} color={colors.primary} />;
      case "lunch":
        return <UtensilsCrossed size={20} color={colors.primary} />;
      case "dinner":
        return <UtensilsCrossed size={20} color={colors.primary} />;
      case "snack":
        return <Soup size={20} color={colors.primary} />;
      default:
        return <Coffee size={20} color={colors.primary} />;
    }
  };
  
  const handleGoBack = () => {
    if (parseInt(calories) > 0 || parseInt(protein) > 0 || parseInt(carbs) > 0 || parseInt(fat) > 0 || notes.trim().length > 0) {
      Alert.alert(
        "Discard Changes",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };
  
  const handleCancel = () => {
    handleGoBack();
  };
  
  const handleAddFood = (food: FoodItem) => {
    // Add quantity property to the food item
    const foodWithQuantity = { ...food, quantity: "1" };
    setSelectedFoodItems(prev => [...prev, foodWithQuantity]);
  };
  
  const handleRemoveFood = (foodId: string) => {
    setSelectedFoodItems(prev => prev.filter(item => item.id !== foodId));
  };
  
  const handleClearAllFoods = () => {
    setSelectedFoodItems([]);
    setCalories("0");
    setProtein("0");
    setCarbs("0");
    setFat("0");
  };
  
  const handleNutritionScanned = (nutrition: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: string;
    servingSize: string;
  }) => {
    // Clear any existing food items since we're using scanned nutrition
    setSelectedFoodItems([]);
    
    // Set the nutrition values
    setCalories(nutrition.calories.toString());
    setProtein(nutrition.protein.toString());
    setCarbs(nutrition.carbs.toString());
    setFat(nutrition.fat.toString());
    
    // Add notes about the scanned item
    const notesText = `Scanned: ${nutrition.name}${nutrition.quantity !== "1" ? ` (${nutrition.quantity} servings)` : ""}${nutrition.servingSize ? ` - ${nutrition.servingSize}` : ""}`;
    setNotes(notesText);
    
    setShowNutritionScanner(false);
  };
  
  const areManualInputsEnabled = selectedFoodItems.length === 0;
  
  // Calculate remaining macros for the day (only if goals are set)
  const remainingCalories = hasValidMacroGoals ? Math.max(0, (macroGoals?.calories || 0) - todayMacros.calories - parseInt(calories || "0")) : 0;
  const remainingProtein = hasValidMacroGoals ? Math.max(0, (macroGoals?.protein || 0) - todayMacros.protein - parseInt(protein || "0")) : 0;
  const remainingCarbs = hasValidMacroGoals ? Math.max(0, (macroGoals?.carbs || 0) - todayMacros.carbs - parseInt(carbs || "0")) : 0;
  const remainingFat = hasValidMacroGoals ? Math.max(0, (macroGoals?.fat || 0) - todayMacros.fat - parseInt(fat || "0")) : 0;
  
  // Calculate percentage of daily goals (only if goals are set)
  const caloriePercentage = hasValidMacroGoals ? Math.min(100, (((todayMacros.calories + parseInt(calories || "0")) / (macroGoals?.calories || 1)) * 100)) : 0;
  const proteinPercentage = hasValidMacroGoals ? Math.min(100, (((todayMacros.protein + parseInt(protein || "0")) / (macroGoals?.protein || 1)) * 100)) : 0;
  const carbsPercentage = hasValidMacroGoals ? Math.min(100, (((todayMacros.carbs + parseInt(carbs || "0")) / (macroGoals?.carbs || 1)) * 100)) : 0;
  const fatPercentage = hasValidMacroGoals ? Math.min(100, (((todayMacros.fat + parseInt(fat || "0")) / (macroGoals?.fat || 1)) * 100)) : 0;
  
  // Generate progress messages
  const getProgressMessage = (current: number, goal: number, nutrient: string) => {
    const percentage = (current / goal) * 100;
    
    if (percentage >= 100) {
      return `You've reached your daily ${nutrient} goal! 🎉`;
    } else if (percentage >= 90) {
      return `Almost there! Just a little more ${nutrient} to reach your goal.`;
    } else if (percentage >= 75) {
      return `You're making great progress on your ${nutrient} intake.`;
    } else if (percentage >= 50) {
      return `You're halfway to your ${nutrient} goal for today.`;
    } else if (percentage >= 25) {
      return `You've started on your ${nutrient} intake for today.`;
    } else {
      return `You still need more ${nutrient} to reach your daily goal.`;
    }
  };
  
  const calorieMessage = hasValidMacroGoals ? getProgressMessage(todayMacros.calories + parseInt(calories || "0"), macroGoals?.calories || 0, "calorie") : "";
  const proteinMessage = hasValidMacroGoals ? getProgressMessage(todayMacros.protein + parseInt(protein || "0"), macroGoals?.protein || 0, "protein") : "";
  const carbsMessage = hasValidMacroGoals ? getProgressMessage(todayMacros.carbs + parseInt(carbs || "0"), macroGoals?.carbs || 0, "carbs") : "";
  const fatMessage = hasValidMacroGoals ? getProgressMessage(todayMacros.fat + parseInt(fat || "0"), macroGoals?.fat || 0, "fat") : "";
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen 
        options={{
          title: "Log Food",
          headerBackTitle: "Nutrition",
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
      
      <View style={styles.header}>
        <Text style={styles.title}>Log Your Nutrition</Text>
        <Text style={styles.subtitle}>Track your macros and calories</Text>
      </View>
      
      {/* Back button below subtitle */}
      <TouchableOpacity 
        onPress={handleGoBack} 
        style={styles.belowSubtitleBackButton}
        accessibilityLabel="Go back"
        accessibilityHint="Returns to the previous screen"
      >
        <ArrowLeft size={24} color={colors.text} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      
      <View style={styles.formContainer}>
        <View style={styles.mealInfoContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meal Type</Text>
            <CustomDropdown
              value={mealType}
              onValueChange={(value) => {
                setMealType(value as "breakfast" | "lunch" | "dinner" | "snack");
                setSelectedFoodItems([]);
              }}
              options={mealTypeOptions}
              placeholder="Select meal type"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meal Time</Text>
            <View style={styles.timeInputContainer}>
              <Clock size={20} color={colors.textSecondary} style={styles.timeIcon} />
              <TextInput
                style={styles.timeInput}
                value={mealTime}
                onChangeText={setMealTime}
                placeholder="HH:MM"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Food Database</Text>
          <Text style={styles.sectionDescription}>
            These are example foods to help you get started. You can select multiple items from different categories or enter nutrition information manually below.
          </Text>
          
          {/* Food Category Selector */}
          <FoodCategorySelector
            mealType={mealType}
            categories={foodCategories}
            onSelectFood={handleAddFood}
          />
        </View>
        
        {/* Selected Food Items Display */}
        {selectedFoodItems.length > 0 && (
          <View style={styles.selectedFoodContainer}>
            <View style={styles.selectedFoodHeader}>
              <Text style={styles.selectedFoodTitle}>Selected Foods</Text>
              <TouchableOpacity onPress={handleClearAllFoods} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            
            {selectedFoodItems.map((food, index) => (
              <View key={`${food.id}-${index}`} style={styles.selectedFoodCard}>
                {food.imageUrl && (
                  <Image source={{ uri: food.imageUrl }} style={styles.foodImage} />
                )}
                
                <View style={styles.foodDetails}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.servingSize}>{food.servingSize}</Text>
                  
                  <View style={styles.macroInfo}>
                    <Text style={styles.calories}>
                      {Math.round(food.calories * parseInt(food.quantity || "1"))} kcal
                    </Text>
                    <Text style={styles.macros}>
                      P: {Math.round(food.protein * parseInt(food.quantity || "1"))}g • 
                      C: {Math.round(food.carbs * parseInt(food.quantity || "1"))}g • 
                      F: {Math.round(food.fat * parseInt(food.quantity || "1"))}g
                    </Text>
                  </View>
                  
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Quantity:</Text>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => adjustQuantity(food, -1)}
                        disabled={parseInt(food.quantity || "1") <= 1}
                      >
                        <Minus size={16} color={parseInt(food.quantity || "1") <= 1 ? colors.textLight : colors.text} />
                      </TouchableOpacity>
                      
                      <Text style={styles.quantityText}>{food.quantity || "1"}</Text>
                      
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => adjustQuantity(food, 1)}
                      >
                        <Plus size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveFood(food.id)}
                >
                  <Minus size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        
        {/* Nutrition Scanner Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Scan Nutrition Label</Text>
          <Text style={styles.sectionDescription}>
            Take a photo of a nutrition label to automatically extract nutrition information.
          </Text>
          <Button
            title="Scan Nutrition Label"
            onPress={() => setShowNutritionScanner(true)}
            icon={<Camera size={20} color={colors.white} />}
            style={styles.scannerButton}
          />
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Manual Nutrition Entry</Text>
          <Text style={styles.sectionDescription}>
            You can directly enter nutrition values without selecting foods from the database.
            {!areManualInputsEnabled && " (Disabled when foods are selected)"}
          </Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Calories</Text>
          <View style={styles.numberInput}>
            <TouchableOpacity 
              style={[styles.button, !areManualInputsEnabled && styles.buttonDisabled]}
              onPress={() => adjustValue(setCalories, calories, -50)}
              disabled={!areManualInputsEnabled}
            >
              <Minus size={20} color={!areManualInputsEnabled ? colors.textLight : colors.text} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, !areManualInputsEnabled && styles.inputDisabled]}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              editable={areManualInputsEnabled}
            />
            
            <TouchableOpacity 
              style={[styles.button, !areManualInputsEnabled && styles.buttonDisabled]}
              onPress={() => adjustValue(setCalories, calories, 50)}
              disabled={!areManualInputsEnabled}
            >
              <Plus size={20} color={!areManualInputsEnabled ? colors.textLight : colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Protein (g)</Text>
          <View style={styles.numberInput}>
            <TouchableOpacity 
              style={[styles.button, !areManualInputsEnabled && styles.buttonDisabled]}
              onPress={() => adjustValue(setProtein, protein, -1)}
              disabled={!areManualInputsEnabled}
            >
              <Minus size={20} color={!areManualInputsEnabled ? colors.textLight : colors.text} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, !areManualInputsEnabled && styles.inputDisabled]}
              value={protein}
              onChangeText={setProtein}
              keyboardType="numeric"
              editable={areManualInputsEnabled}
            />
            
            <TouchableOpacity 
              style={[styles.button, !areManualInputsEnabled && styles.buttonDisabled]}
              onPress={() => adjustValue(setProtein, protein, 1)}
              disabled={!areManualInputsEnabled}
            >
              <Plus size={20} color={!areManualInputsEnabled ? colors.textLight : colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Carbs (g)</Text>
          <View style={styles.numberInput}>
            <TouchableOpacity 
              style={[styles.button, !areManualInputsEnabled && styles.buttonDisabled]}
              onPress={() => adjustValue(setCarbs, carbs, -1)}
              disabled={!areManualInputsEnabled}
            >
              <Minus size={20} color={!areManualInputsEnabled ? colors.textLight : colors.text} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, !areManualInputsEnabled && styles.inputDisabled]}
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="numeric"
              editable={areManualInputsEnabled}
            />
            
            <TouchableOpacity 
              style={[styles.button, !areManualInputsEnabled && styles.buttonDisabled]}
              onPress={() => adjustValue(setCarbs, carbs, 1)}
              disabled={!areManualInputsEnabled}
            >
              <Plus size={20} color={!areManualInputsEnabled ? colors.textLight : colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fat (g)</Text>
          <View style={styles.numberInput}>
            <TouchableOpacity 
              style={[styles.button, !areManualInputsEnabled && styles.buttonDisabled]}
              onPress={() => adjustValue(setFat, fat, -1)}
              disabled={!areManualInputsEnabled}
            >
              <Minus size={20} color={!areManualInputsEnabled ? colors.textLight : colors.text} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, !areManualInputsEnabled && styles.inputDisabled]}
              value={fat}
              onChangeText={setFat}
              keyboardType="numeric"
              editable={areManualInputsEnabled}
            />
            
            <TouchableOpacity 
              style={[styles.button, !areManualInputsEnabled && styles.buttonDisabled]}
              onPress={() => adjustValue(setFat, fat, 1)}
              disabled={!areManualInputsEnabled}
            >
              <Plus size={20} color={!areManualInputsEnabled ? colors.textLight : colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.notesContainer}>
          <Text style={styles.label}>Notes</Text>
          <NoteInput
            initialValue={notes}
            onSave={setNotes}
            placeholder="Add notes about this meal..."
            multiline
          />
        </View>
        
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Macronutrient Breakdown</Text>
          
          <View style={styles.macroBreakdown}>
            <View style={styles.macroItem}>
              <View style={[styles.macroCircle, { backgroundColor: colors.macroProtein }]} />
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{protein}g</Text>
              <Text style={styles.macroCalories}>
                {(parseInt(protein) || 0) * 4} kcal
              </Text>
            </View>
            
            <View style={styles.macroItem}>
              <View style={[styles.macroCircle, { backgroundColor: colors.macroCarbs }]} />
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{carbs}g</Text>
              <Text style={styles.macroCalories}>
                {(parseInt(carbs) || 0) * 4} kcal
              </Text>
            </View>
            
            <View style={styles.macroItem}>
              <View style={[styles.macroCircle, { backgroundColor: colors.macroFat }]} />
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{fat}g</Text>
              <Text style={styles.macroCalories}>
                {(parseInt(fat) || 0) * 9} kcal
              </Text>
            </View>
          </View>
          
          {/* Only show Daily Goal Progress if macro goals are set up */}
          {hasValidMacroGoals ? (
            <View style={styles.goalProgress}>
              <Text style={styles.goalProgressTitle}>Daily Goal Progress</Text>
              
              <View style={styles.goalProgressItem}>
                <View style={styles.goalProgressHeader}>
                  <Text style={styles.goalProgressLabel}>Calories</Text>
                  <Text style={styles.goalProgressValue}>
                    {todayMacros.calories + parseInt(calories || "0")} / {macroGoals?.calories || 0} kcal
                  </Text>
                </View>
                <View style={styles.goalProgressBar}>
                  <View 
                    style={[
                      styles.goalProgressFill, 
                      { width: `${caloriePercentage}%`, backgroundColor: colors.primary }
                    ]} 
                  />
                </View>
                <Text style={styles.goalProgressMessage}>
                  {remainingCalories > 0 
                    ? `${remainingCalories} kcal remaining` 
                    : calorieMessage}
                </Text>
              </View>
              
              <View style={styles.goalProgressItem}>
                <View style={styles.goalProgressHeader}>
                  <Text style={styles.goalProgressLabel}>Protein</Text>
                  <Text style={styles.goalProgressValue}>
                    {todayMacros.protein + parseInt(protein || "0")} / {macroGoals?.protein || 0}g
                  </Text>
                </View>
                <View style={styles.goalProgressBar}>
                  <View 
                    style={[
                      styles.goalProgressFill, 
                      { width: `${proteinPercentage}%`, backgroundColor: colors.macroProtein }
                    ]} 
                  />
                </View>
                <Text style={styles.goalProgressMessage}>
                  {remainingProtein > 0 
                    ? `${remainingProtein}g remaining` 
                    : proteinMessage}
                </Text>
              </View>
              
              <View style={styles.goalProgressItem}>
                <View style={styles.goalProgressHeader}>
                  <Text style={styles.goalProgressLabel}>Carbs</Text>
                  <Text style={styles.goalProgressValue}>
                    {todayMacros.carbs + parseInt(carbs || "0")} / {macroGoals?.carbs || 0}g
                  </Text>
                </View>
                <View style={styles.goalProgressBar}>
                  <View 
                    style={[
                      styles.goalProgressFill, 
                      { width: `${carbsPercentage}%`, backgroundColor: colors.macroCarbs }
                    ]} 
                  />
                </View>
                <Text style={styles.goalProgressMessage}>
                  {remainingCarbs > 0 
                    ? `${remainingCarbs}g remaining` 
                    : carbsMessage}
                </Text>
              </View>
              
              <View style={styles.goalProgressItem}>
                <View style={styles.goalProgressHeader}>
                  <Text style={styles.goalProgressLabel}>Fat</Text>
                  <Text style={styles.goalProgressValue}>
                    {todayMacros.fat + parseInt(fat || "0")} / {macroGoals?.fat || 0}g
                  </Text>
                </View>
                <View style={styles.goalProgressBar}>
                  <View 
                    style={[
                      styles.goalProgressFill, 
                      { width: `${fatPercentage}%`, backgroundColor: colors.macroFat }
                    ]} 
                  />
                </View>
                <Text style={styles.goalProgressMessage}>
                  {remainingFat > 0 
                    ? `${remainingFat}g remaining` 
                    : fatMessage}
                </Text>
              </View>
              
              {gamificationEnabled && (
                <View style={styles.achievementHint}>
                  <Text style={styles.achievementHintText}>
                    💡 Meeting your nutrition goals consistently unlocks achievements and earns you points!
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noGoalsContainer}>
              <Text style={styles.noGoalsText}>
                Set up your daily macro goals in the nutrition settings to track your progress.
              </Text>
              <TouchableOpacity 
                style={styles.setupGoalsButton}
                onPress={() => router.push("/health-goals")}
              >
                <Text style={styles.setupGoalsButtonText}>Set Up Nutrition Goals</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Save Food Log"
          onPress={handleSave}
          style={styles.saveButton}
        />
        
        <Button
          title="Cancel"
          onPress={handleCancel}
          variant="outline"
          style={styles.cancelButton}
        />
      </View>
      </ScrollView>
      
      {/* Nutrition Scanner Modal */}
      <Modal
        visible={showNutritionScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <NutritionLabelScanner
          onNutritionScanned={handleNutritionScanned}
          onCancel={() => setShowNutritionScanner(false)}
        />
      </Modal>
    </View>
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
    marginBottom: 8, // Reduced from 24 to make room for back button
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
  // New back button style below subtitle
  belowSubtitleBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
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
  mealInfoContainer: {
    marginBottom: 16,
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

  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  timeIcon: {
    marginRight: 8,
  },
  timeInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  numberInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  button: {
    padding: 12,
    backgroundColor: colors.background,
  },
  buttonDisabled: {
    backgroundColor: colors.backgroundLight,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
  },
  inputDisabled: {
    backgroundColor: colors.backgroundLight,
    color: colors.textLight,
  },
  macroContainer: {
    marginBottom: 16,
  },
  notesContainer: {
    marginBottom: 24,
  },
  summary: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  macroBreakdown: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  macroItem: {
    alignItems: "center",
  },
  macroCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  macroCalories: {
    fontSize: 12,
    color: colors.textLight,
  },
  goalProgress: {
    marginTop: 8,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
  },
  goalProgressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  goalProgressItem: {
    marginBottom: 16,
  },
  goalProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  goalProgressLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  goalProgressValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  goalProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  goalProgressMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  achievementHint: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  achievementHintText: {
    fontSize: 14,
    color: colors.text,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  saveButton: {
    marginBottom: 12,
  },
  cancelButton: {
  },
  backButton: {
    padding: 8,
  },
  selectedFoodContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  selectedFoodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectedFoodTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  selectedFoodCard: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    marginBottom: 8,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  foodDetails: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  servingSize: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  macroInfo: {
    marginBottom: 8,
  },
  calories: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
    marginBottom: 2,
  },
  macros: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityLabel: {
    fontSize: 14,
    color: colors.text,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  quantityButton: {
    padding: 8,
    backgroundColor: colors.background,
  },
  quantityText: {
    width: 30,
    paddingVertical: 4,
    fontSize: 14,
    color: colors.text,
    textAlign: "center",
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  sectionContainer: {
    marginBottom: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  error: {
    color: colors.error,
  },
  noGoalsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    alignItems: "center",
  },
  noGoalsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 12,
  },
  setupGoalsButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  setupGoalsButtonText: {
    color: colors.white,
    fontWeight: "500",
    fontSize: 14,
  },
  scannerButton: {
    marginTop: 8,
  },
});