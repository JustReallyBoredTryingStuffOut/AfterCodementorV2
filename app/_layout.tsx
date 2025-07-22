import React, { useState, useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Dimensions, TextInput, ScrollView, Platform, ActivityIndicator, Alert, AppState, Keyboard, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useGamificationStore } from '@/store/gamificationStore';
import { useMacroStore } from '@/store/macroStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useHealthStore } from '@/store/healthStore';
import { Zap, Award, Trophy, X, User, Weight, Ruler, Calendar, Activity, ArrowRight, ChevronRight, Brain, Sparkles, Heart, AlertTriangle, Check, ArrowLeft, Apple, Moon, Dumbbell } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import CustomDropdown from '@/components/CustomDropdown';
import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import NotificationHandler from '@/components/NotificationHandler';
import NotificationPermissionModal from '@/components/NotificationPermissionModal';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import HealthKit from '@/src/NativeModules/HealthKit';

// App name
export const APP_NAME = "FitQuest";

export default function RootLayout() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);
  
  // Notification permission hook
  const {
    showPermissionModal,
    hasCheckedPermission,
    handlePermissionGranted,
    handlePermissionDeclined,
  } = useNotificationPermission();
  
  const { 
    gamificationEnabled, 
    toggleGamification, 
    onboardingCompleted, 
    setOnboardingCompleted 
  } = useGamificationStore();
  
  const { userProfile, updateUserProfile } = useMacroStore();
  const { workoutRecommendationsEnabled, toggleWorkoutRecommendations, setAiRecommendationsExplained } = useWorkoutStore();
  
  // User profile form state
  const [name, setName] = useState(userProfile.name || "");
  const [weight, setWeight] = useState(userProfile.weight?.toString() || "");
  const [height, setHeight] = useState(userProfile.height?.toString() || "");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState(userProfile.gender || "prefer-not-to-say");
  const [activityLevel, setActivityLevel] = useState(userProfile.activityLevel || "moderate");
  const [fitnessGoal, setFitnessGoal] = useState(userProfile.fitnessGoal || "maintain");
  const [fitnessLevel, setFitnessLevel] = useState(userProfile.fitnessLevel || "beginner");
  const [targetWeight, setTargetWeight] = useState(userProfile.targetWeight?.toString() || "");
  
  // Health disclaimer acceptance
  const [healthDisclaimerAccepted, setHealthDisclaimerAccepted] = useState(false);
  
  // HealthKit permission state
  const [healthKitPermissionRequested, setHealthKitPermissionRequested] = useState(false);
  const [healthKitPermissionGranted, setHealthKitPermissionGranted] = useState(false);
  const [healthKitPermissionLoading, setHealthKitPermissionLoading] = useState(false);
  
  // Form validation state
  const [nameError, setNameError] = useState("");
  const [weightError, setWeightError] = useState("");
  const [heightError, setHeightError] = useState("");
  const [birthYearError, setBirthYearError] = useState("");
  const [targetWeightError, setTargetWeightError] = useState("");
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const loadingBarWidth = useRef(new Animated.Value(0)).current;
  const welcomeFadeIn = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Custom scrollbar state for health disclaimer
  const [scrollY, setScrollY] = useState(0);
  const [contentHeight, setContentHeight] = useState(1);
  const [containerHeight, setContainerHeight] = useState(1);
  const scrollViewRef = useRef(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  
  // Dropdown options for onboarding
  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
    { label: "Prefer not to say", value: "prefer-not-to-say" }
  ];
  
  const activityLevelOptions = [
    { label: "Sedentary (Little or no exercise)", value: "sedentary" },
    { label: "Lightly active (1-3 days/week)", value: "light" },
    { label: "Moderately active (3-5 days/week)", value: "moderate" },
    { label: "Very active (6-7 days/week)", value: "active" },
    { label: "Extra active (Very hard exercise & physical job)", value: "very_active" }
  ];
  
  const fitnessGoalOptions = [
    { label: "Lose Weight", value: "lose" },
    { label: "Maintain Weight", value: "maintain" },
    { label: "Gain Muscle", value: "gain" }
  ];
  
  const fitnessLevelOptions = [
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Advanced", value: "advanced" }
  ];
  
  // Handle app state changes to prevent crashes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground

        // Refresh data when app comes to foreground
        try {
          // Refresh HealthKit data
          const healthStore = useHealthStore.getState();
          if (healthStore && healthStore.syncWeightFromHealthKit) {
            healthStore.syncWeightFromHealthKit().catch(err => 
              console.error('Error syncing weight from HealthKit:', err)
            );
          }
          if (healthStore && healthStore.syncStepsFromHealthKit) {
            healthStore.syncStepsFromHealthKit().catch(err => 
              console.error('Error syncing steps from HealthKit:', err)
            );
          }
        } catch (error) {
          console.error('Error refreshing data on foreground:', error);
        }
      } else if (appState === 'active' && nextAppState.match(/inactive|background/)) {
        // App has gone to the background

        // Save any pending state
        try {
          // Ensure all stores are persisted
          const stores = [useGamificationStore, useMacroStore, useWorkoutStore];
          stores.forEach(store => {
            if (store.getState) {
              store.getState();
            }
          });
        } catch (error) {
          console.error('Error saving state on background:', error);
        }
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState]);



  // Check if it's the first launch
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        
        if (hasLaunched === null) {
          setIsFirstLaunch(true);
          setShowWelcome(true);
        } else {
          setIsFirstLaunch(false);
          
          // Check if onboarding is completed
          if (!onboardingCompleted) {
            setShowWelcome(true);
          }
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
        setIsFirstLaunch(false);
      }
    };
    
    checkFirstLaunch();
  }, [onboardingCompleted]);
  
  // Run animations when welcome screen is shown
  useEffect(() => {
    if (showWelcome) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
      
      // Slide up animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
      
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: currentOnboardingStep / (onboardingSteps.length - 1),
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showWelcome, fadeAnim, slideAnim, currentOnboardingStep]);
  
  // Update progress bar when step changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentOnboardingStep / (onboardingSteps.length - 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentOnboardingStep]);
  
  // Run loading screen animations
  useEffect(() => {
    if (showLoadingScreen) {
      // Animate loading bar
      Animated.timing(loadingBarWidth, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          // Animate welcome message fade in
          Animated.timing(welcomeFadeIn, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start(() => {
            // After a delay, hide loading screen and mark first launch
            setTimeout(async () => {
              setShowLoadingScreen(false);
              await AsyncStorage.setItem('hasLaunched', 'true');
            }, 1500);
          });
        }
      });
      
      // Update progress percentage
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 150);
      
      return () => clearInterval(interval);
    }
  }, [showLoadingScreen, loadingBarWidth, welcomeFadeIn]);
  
  // Validate form fields
  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError("Name is required");
      return false;
    }
    setNameError("");
    return true;
  };
  
  const validateWeight = (value: string) => {
    if (!value.trim()) {
      setWeightError("Weight is required");
      return false;
    }
    const weightNum = parseFloat(value);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      setWeightError("Please enter a valid weight");
      return false;
    }
    setWeightError("");
    return true;
  };
  
  const validateHeight = (value: string) => {
    if (!value.trim()) {
      setHeightError("Height is required");
      return false;
    }
    const heightNum = parseFloat(value);
    if (isNaN(heightNum) || heightNum <= 0 || heightNum > 300) {
      setHeightError("Please enter a valid height");
      return false;
    }
    setHeightError("");
    return true;
  };
  
  // Calculate current year for birth year validation
  const currentYear = new Date().getFullYear();
  const minBirthYear = currentYear - 100;
  const maxBirthYear = currentYear - 13;
  
  // Validate birth year input
  const validateBirthYear = (value: string) => {
    if (!value) {
      setBirthYear("");
      setBirthYearError("");
      return true; // Birth year is optional
    }
    
    const year = parseInt(value);
    if (isNaN(year)) {
      setBirthYearError("Please enter a valid year");
      return false;
    }
    
    if (year < minBirthYear || year > maxBirthYear) {
      setBirthYearError(`Year must be between ${minBirthYear} and ${maxBirthYear}`);
      return false;
    }
    
    setBirthYearError("");
    return true;
  };
  
  // Validate target weight input
  const validateTargetWeight = (value: string) => {
    if (!value.trim()) {
      setTargetWeightError("Target weight is required for weight loss/gain goals");
      return false;
    }
    const targetWeightNum = parseFloat(value);
    if (isNaN(targetWeightNum) || targetWeightNum <= 0 || targetWeightNum > 500) {
      setTargetWeightError("Please enter a valid target weight");
      return false;
    }
    
    // Check if target weight makes sense based on current weight and goal
    const currentWeightNum = parseFloat(weight) || 0;
    if (currentWeightNum > 0) {
      if (fitnessGoal === "lose" && targetWeightNum >= currentWeightNum) {
        setTargetWeightError("Target weight should be less than current weight for weight loss");
        return false;
      }
      if (fitnessGoal === "gain" && targetWeightNum <= currentWeightNum) {
        setTargetWeightError("Target weight should be more than current weight for weight gain");
        return false;
      }
    }
    
    setTargetWeightError("");
    return true;
  };
  
  // Handle continue button press
  const handleContinue = async () => {
    // If we're on the name step, validate name
    if (currentOnboardingStep === 4) {
      if (!validateName(name)) {
        return;
      }
    }
    
    // If we're on the body metrics step, validate weight and height
    if (currentOnboardingStep === 5) {
      const isWeightValid = validateWeight(weight);
      const isHeightValid = validateHeight(height);
      const isBirthYearValid = validateBirthYear(birthYear);
      
      if (!isWeightValid || !isHeightValid || !isBirthYearValid) {
        return;
      }
    }
    
    // If we're on the fitness profile step, validate target weight if needed
    if (currentOnboardingStep === 6) {
      const isTargetWeightValid = (fitnessGoal === "lose" || fitnessGoal === "gain") 
        ? validateTargetWeight(targetWeight) 
        : true;
      
      if (!isTargetWeightValid) {
        return;
      }
    }
    
    // If we're on the health disclaimer step, check if it's accepted
    if (currentOnboardingStep === 7) {
      if (!healthDisclaimerAccepted) {
        Alert.alert(
          "Health Disclaimer Required",
          "You must accept the health disclaimer to continue.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    
    if (currentOnboardingStep < onboardingSteps.length - 1) {
      setCurrentOnboardingStep(currentOnboardingStep + 1);
    } else {
      // We're on the last step
      // Complete onboarding and show loading screen
      await completeOnboarding();
    }
  };
  
  // Function to complete onboarding and transition to loading screen
  const completeOnboarding = async () => {
    // Save user profile
    const age = birthYear ? new Date().getFullYear() - parseInt(birthYear) : userProfile.age;
    
    updateUserProfile({
      name: name.trim() || "Fitness Enthusiast", // Default name if empty
      weight: weight ? parseFloat(weight) : userProfile.weight,
      height: height ? parseFloat(height) : userProfile.height,
      age: age || 30,
      gender,
      fitnessGoal,
      activityLevel,
      fitnessLevel,
      targetWeight: (fitnessGoal === "lose" || fitnessGoal === "gain") && targetWeight 
        ? parseFloat(targetWeight) 
        : undefined,
      dateOfBirth: null, // We're only collecting year, not full date
    });
    
    // Complete onboarding
    setOnboardingCompleted(true);
    setShowWelcome(false);
    
    // Show loading screen for first launch
    if (isFirstLaunch) {
      setShowLoadingScreen(true);
    }
    
    // Request HealthKit permissions after onboarding is complete
    if (Platform.OS === 'ios') {
      // Small delay to ensure onboarding UI is cleared
      setTimeout(async () => {
        await requestHealthKitPermissions();
      }, 1000);
    }
  };
  
  // Handle skip button press
  const handleSkip = async () => {
    // If we're in the user details section, just complete onboarding
    if (currentOnboardingStep >= 4) {
      // For body metrics step, we don't allow skipping
      if (currentOnboardingStep === 5) {
        const isWeightValid = validateWeight(weight);
        const isHeightValid = validateHeight(height);
        
        if (!isWeightValid || !isHeightValid) {
          return;
        }
      }
      
      // Complete onboarding
      await completeOnboarding();
      return;
    }
    
    // Otherwise, set default gamification to enabled and skip to user details
    toggleGamification(true);
    setCurrentOnboardingStep(4); // Skip to first user details step
  };
  
  // Handle gamification toggle
  const handleGamificationToggle = (enabled: boolean) => {
    toggleGamification(enabled);
    handleContinue();
  };
  
  // Handle AI recommendations toggle
  const handleAiRecommendationsToggle = (enabled: boolean) => {
    toggleWorkoutRecommendations(enabled);
    setAiRecommendationsExplained(true);
    // Move to next step manually since this step has custom buttons
    setCurrentOnboardingStep(currentOnboardingStep + 1);
  };
  
  // Handle birth year input
  const handleBirthYearChange = (text: string) => {
    // Only allow digits
    const numericValue = text.replace(/[^0-9]/g, '');
    
    // Limit to 4 digits
    if (numericValue.length <= 4) {
      setBirthYear(numericValue);
      validateBirthYear(numericValue);
    }
  };
  
  // Request comprehensive HealthKit permissions
  const requestHealthKitPermissions = async () => {
    if (Platform.OS !== 'ios') {
      return true; // Not applicable on non-iOS
    }
    
    setHealthKitPermissionLoading(true);
    
    try {
      // Check if HealthKit is available
      const isAvailable = await HealthKit.isHealthDataAvailable();
      
      if (!isAvailable) {
        Alert.alert(
          "HealthKit Not Available",
          "HealthKit is not available on this device. You can still use the app without health data integration.",
          [{ text: "OK" }]
        );
        setHealthKitPermissionLoading(false);
        return false;
      }
      
      // Request authorization for all health data types
      const authResult = await HealthKit.requestAuthorization([
        'steps', 
        'distance', 
        'calories', 
        'heartRate', 
        'sleep', 
        'workouts',
        'weight',
        'bodyMass',
        'bodyFat',
        'muscleMass'
      ]);
      
      setHealthKitPermissionRequested(true);
      setHealthKitPermissionGranted(authResult.authorized);
      
      if (authResult.authorized) {
        // Initialize health store with the granted permissions
        const healthStore = useHealthStore.getState();
        if (healthStore && healthStore.initializeHealthKit) {
          await healthStore.initializeHealthKit();
        }
        
        Alert.alert(
          "Health Data Connected",
          "Your app is now connected to Apple Health. Your health data will be synced automatically.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Health Data Access Denied",
          "You can still use the app, but some features like automatic step counting and weight tracking will be limited. You can enable health data access later in Settings.",
          [{ text: "OK" }]
        );
      }
      
      setHealthKitPermissionLoading(false);
      return authResult.authorized;
    } catch (error: any) {
      console.error('Error requesting HealthKit permissions:', error);
      setHealthKitPermissionLoading(false);
      
      Alert.alert(
        "Health Data Error",
        "There was an error setting up health data access. You can still use the app and enable health data later.",
        [{ text: "OK" }]
      );
      
      return false;
    }
  };
  
  // Onboarding steps
  const onboardingSteps = [
    {
      title: `Welcome to ${APP_NAME}!`,
      description: "Your personal fitness journey starts here. Let's get you set up for success!",
      icon: <Image source={require('@/assets/images/adaptive-icon.png')} style={styles.welcomeIcon} />,
      action: () => handleContinue(),
      actionText: "Get Started",
      showSkip: false, // Don't allow skipping the first screen
    },
    {
      title: "Gamify Your Fitness Journey",
      description: `${APP_NAME} offers a fun, game-like experience to keep you motivated. Earn achievements, complete challenges, and level up as you reach your fitness goals!`,
      icon: <Trophy size={80} color={colors.primary} />,
      action: () => handleContinue(),
      actionText: "Tell Me More",
      showSkip: false, // Don't allow skipping
    },
    {
      title: "Track Your Progress",
      description: "Earn points for completing workouts, maintaining streaks, and hitting personal records. Watch yourself level up from Beginner to Fitness Guru!",
      icon: <Award size={80} color={colors.primary} />,
      action: () => handleContinue(),
      actionText: "Sounds Fun",
      showSkip: false, // Don't allow skipping
    },
    {
      title: "Enable Achievement System?",
      description: "Would you like to enable the achievement system features? You can always change this later in your profile settings.",
      icon: <Zap size={80} color={colors.primary} />,
      action: null, // No single action, we have two buttons
      actionText: "",
      showSkip: false,
      customButtons: (
        <View style={styles.choiceButtons}>
          <TouchableOpacity 
            style={[styles.choiceButton, styles.noButton]} 
            onPress={() => handleGamificationToggle(false)}
          >
            <Text style={styles.choiceButtonText}>No Thanks</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.choiceButton, styles.yesButton]} 
            onPress={() => handleGamificationToggle(true)}
          >
            <Text style={styles.choiceButtonText}>Enable</Text>
          </TouchableOpacity>
        </View>
      ),
    },
    // New user profile steps
    {
      title: "Tell Us About Yourself",
      description: "We'll use this information to personalize your experience, track your macros, and recommend workouts that match your goals.",
      icon: <User size={80} color={colors.primary} />,
      content: (
        <View style={styles.formContainer}>
          <Text style={styles.formLabel}>Your Name <Text style={styles.requiredStar}>*</Text></Text>
          <TextInput
            style={[styles.textInput, nameError ? styles.inputError : null]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (text.trim()) setNameError("");
            }}
            placeholder="Enter your name"
            placeholderTextColor={colors.textLight}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>
      ),
      action: () => handleContinue(),
      actionText: "Continue",
      showSkip: false, // Don't allow skipping name entry
    },
    {
      title: "Your Body Metrics",
      description: "This helps us calculate your daily calorie needs and track your progress accurately.",
      icon: <Weight size={80} color={colors.primary} />,
      content: (
        <View style={styles.formContainer}>
          <View style={styles.formRow}>
            <View style={styles.formColumn}>
              <Text style={styles.formLabel}>Weight (kg) <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={[styles.textInput, weightError ? styles.inputError : null]}
                value={weight}
                onChangeText={(text) => {
                  setWeight(text);
                  if (text.trim()) validateWeight(text);
                }}
                placeholder="70"
                keyboardType="numeric"
                placeholderTextColor={colors.textLight}
              />
              {weightError ? <Text style={styles.errorText}>{weightError}</Text> : null}
            </View>
            
            <View style={styles.formColumn}>
              <Text style={styles.formLabel}>Height (cm) <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={[styles.textInput, heightError ? styles.inputError : null]}
                value={height}
                onChangeText={(text) => {
                  setHeight(text);
                  if (text.trim()) validateHeight(text);
                }}
                placeholder="175"
                keyboardType="numeric"
                placeholderTextColor={colors.textLight}
              />
              {heightError ? <Text style={styles.errorText}>{heightError}</Text> : null}
            </View>
          </View>
          
          <Text style={styles.formLabel}>Birth Year</Text>
          <TextInput
            style={[styles.textInput, birthYearError ? styles.inputError : null]}
            value={birthYear}
            onChangeText={handleBirthYearChange}
            placeholder={`${currentYear - 30}`}
            keyboardType="numeric"
            maxLength={4}
            placeholderTextColor={colors.textLight}
          />
          {birthYearError ? (
            <Text style={styles.errorText}>{birthYearError}</Text>
          ) : (
            <Text style={styles.inputHint}>
              This helps us determine your age group for better recommendations
            </Text>
          )}
        </View>
      ),
      action: () => handleContinue(),
      actionText: "Continue",
      showSkip: false, // Don't allow skipping body metrics
    },
    {
      title: "Your Fitness Profile",
      description: "Let us know your current activity level and goals so we can tailor your experience.",
      icon: <Activity size={80} color={colors.primary} />,
      content: (
        <View style={styles.formContainer}>
          <Text style={styles.formLabel}>Gender (Optional)</Text>
          <CustomDropdown
            value={gender}
            onValueChange={setGender}
            options={genderOptions}
            placeholder="Select gender"
          />

          <Text style={styles.formLabel}>Activity Level</Text>
          <CustomDropdown
            value={activityLevel}
            onValueChange={setActivityLevel}
            options={activityLevelOptions}
            placeholder="Select activity level"
          />

          <Text style={styles.formLabel}>Fitness Goal</Text>
          <CustomDropdown
            value={fitnessGoal}
            onValueChange={(value) => {
              setFitnessGoal(value);
              // Clear target weight when goal changes to maintain
              if (value === "maintain") {
                setTargetWeight("");
                setTargetWeightError("");
              }
            }}
            options={fitnessGoalOptions}
            placeholder="Select fitness goal"
          />

          <Text style={styles.formLabel}>Fitness Level</Text>
          <CustomDropdown
            value={fitnessLevel}
            onValueChange={setFitnessLevel}
            options={fitnessLevelOptions}
            placeholder="Select fitness level"
          />

          {/* Show target weight field only for lose/gain goals */}
          {(fitnessGoal === "lose" || fitnessGoal === "gain") && (
            <>
              <Text style={styles.formLabel}>
                Target Weight (kg) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, targetWeightError ? styles.inputError : null]}
                value={targetWeight}
                onChangeText={(text) => {
                  setTargetWeight(text);
                  if (text.trim()) validateTargetWeight(text);
                }}
                placeholder={fitnessGoal === "lose" ? "65" : "80"}
                keyboardType="numeric"
                placeholderTextColor={colors.textLight}
              />
              {targetWeightError ? (
                <Text style={styles.errorText}>{targetWeightError}</Text>
              ) : (
                <Text style={styles.inputHint}>
                  {fitnessGoal === "lose" 
                    ? "Enter your target weight for weight loss"
                    : "Enter your target weight for weight gain"
                  }
                </Text>
              )}
            </>
          )}
        </View>
      ),
      action: () => handleContinue(),
      actionText: "Continue",
      showSkip: false, // Don't allow skipping fitness profile
    },
    {
      title: "AI Workout Recommendations",
      description: "Would you like personalized workout recommendations based on your goals, fitness level, and preferences?",
      icon: <Brain size={80} color={colors.primary} />,
      content: (
        <View style={styles.aiRecommendationsContainer}>
          <View style={styles.aiFeatureItem}>
            <Sparkles size={24} color={colors.primary} style={styles.aiFeatureIcon} />
            <Text style={styles.aiFeatureText}>Smart workout suggestions based on your progress</Text>
          </View>
          <View style={styles.aiFeatureItem}>
            <Sparkles size={24} color={colors.primary} style={styles.aiFeatureIcon} />
            <Text style={styles.aiFeatureText}>Adapts to your fitness level as you improve</Text>
          </View>
          <View style={styles.aiFeatureItem}>
            <Sparkles size={24} color={colors.primary} style={styles.aiFeatureIcon} />
            <Text style={styles.aiFeatureText}>Considers your goals and preferences</Text>
          </View>
          <Text style={styles.aiPrivacyNote}>
            Your data is processed locally on your device. You can change this setting anytime.
          </Text>
        </View>
      ),
      action: null,
      actionText: "",
      showSkip: false,
      customButtons: (
        <View style={styles.choiceButtons}>
          <TouchableOpacity 
            style={[styles.choiceButton, styles.noButton]} 
            onPress={() => handleAiRecommendationsToggle(false)}
          >
            <Text style={styles.choiceButtonText}>No Thanks</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.choiceButton, styles.yesButton]} 
            onPress={() => handleAiRecommendationsToggle(true)}
          >
            <Text style={styles.choiceButtonText}>Enable</Text>
          </TouchableOpacity>
        </View>
      ),
    },
    // Health Disclaimer Step
    {
      title: "Health Disclaimer",
      description: "Before you begin your fitness journey with us, please read and acknowledge our health disclaimer.",
      icon: <AlertTriangle size={80} color="#FF9500" />,
      content: (
        <View style={styles.healthDisclaimerContainer}>
          <View style={{ position: 'relative' }}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.healthDisclaimerScroll}
              showsVerticalScrollIndicator={false}
              onScroll={e => {
                setScrollY(e.nativeEvent.contentOffset.y);
                // Check if scrolled to bottom
                const y = e.nativeEvent.contentOffset.y;
                const visibleHeight = e.nativeEvent.layoutMeasurement.height;
                const totalHeight = e.nativeEvent.contentSize.height;
                if (y + visibleHeight >= totalHeight - 8) {
                  setHasScrolledToBottom(true);
                }
              }}
              onContentSizeChange={(w, h) => setContentHeight(h)}
              onLayout={e => setContainerHeight(e.nativeEvent.layout.height)}
              scrollEventThrottle={16}
            >
              <Text style={styles.healthDisclaimerText}>
                The information provided by {APP_NAME} is for general informational and educational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment.
              </Text>
              
              <Text style={styles.healthDisclaimerText}>
                Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or before beginning any new exercise program.
              </Text>
              
              <Text style={styles.healthDisclaimerText}>
                Stop exercising immediately if you experience faintness, dizziness, pain or shortness of breath at any time while exercising and consult with your physician.
              </Text>
              
              <Text style={styles.healthDisclaimerText}>
                By using {APP_NAME}, you acknowledge that:
              </Text>
              
              <View style={styles.healthDisclaimerBullets}>
                <Text style={styles.healthDisclaimerBullet}>• You are in good physical condition and have no medical reason or impairment that might prevent you from safely using our app</Text>
                <Text style={styles.healthDisclaimerBullet}>• You understand that results may vary and depend on factors including genetics, adherence to program, and individual effort</Text>
                <Text style={styles.healthDisclaimerBullet}>• You assume all risk of injury from using the workouts, nutrition advice, and other content provided in this app</Text>
              </View>
              
              <Text style={styles.healthDisclaimerText}>
                {APP_NAME} is not responsible for any health problems that may result from training programs, products, or events you learn about through the app.
              </Text>
            </ScrollView>
            <LinearGradient
              colors={["rgba(35,35,35,0)", "#232323"]}
              style={styles.scrollGradient}
              pointerEvents="none"
            />
            {/* Custom persistent scrollbar */}
            {contentHeight > containerHeight && (
              <View style={styles.customScrollbarTrack} pointerEvents="none">
                <View
                  style={[
                    styles.customScrollbarThumb,
                    {
                      height: Math.max((containerHeight / contentHeight) * containerHeight, 32),
                      top: (scrollY / (contentHeight - containerHeight)) * (containerHeight - Math.max((containerHeight / contentHeight) * containerHeight, 32)),
                    },
                  ]}
                />
              </View>
            )}
          </View>
          
          {!hasScrolledToBottom && (
            <Text style={{ color: '#AAAAAA', fontSize: 12, textAlign: 'center', marginTop: -8 }}>
              Scroll to the bottom to accept
            </Text>
          )}
          <View style={styles.healthDisclaimerCheckbox}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                healthDisclaimerAccepted && styles.checkboxChecked
              ]}
              onPress={() => {
                if (hasScrolledToBottom) setHealthDisclaimerAccepted(!healthDisclaimerAccepted);
              }}
              disabled={!hasScrolledToBottom}
            >
              {healthDisclaimerAccepted && <Check size={16} color="#FFFFFF" />}
            </TouchableOpacity>
            <Text style={[styles.healthDisclaimerCheckboxText, !hasScrolledToBottom && { color: '#888888' }]}>
              I have read and accept the health disclaimer
            </Text>
          </View>
        </View>
      ),
      action: () => handleContinue(),
      actionText: "Continue",
      showSkip: false, // Don't allow skipping health disclaimer
    },
  ];
  
  // Current step
  const currentStep = onboardingSteps[currentOnboardingStep];
  
  if (isFirstLaunch === null) {
    // Still loading
    return null;
  }
  
  return (
    <ThemeProvider>
      {showLoadingScreen ? (
        <View style={styles.loadingContainer}>
          <Image 
            source={require('@/assets/images/adaptive-icon.png')} 
            style={styles.loadingIcon} 
          />
          <Text style={styles.loadingTitle}>{APP_NAME}</Text>
          <Text style={styles.loadingSubtitle}>Your fitness journey awaits</Text>
          
          <View style={styles.loadingBarContainer}>
            <Animated.View 
              style={[
                styles.loadingBar,
                { width: loadingBarWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })}
              ]}
            />
          </View>
          
          <Text style={styles.loadingPercentage}>{loadingProgress}%</Text>
          
          {loadingProgress === 100 && (
            <Animated.View style={{ opacity: welcomeFadeIn }}>
              <Text style={styles.welcomeMessage}>Welcome, {name || "Fitness Enthusiast"}!</Text>
            </Animated.View>
          )}
        </View>
      ) : showWelcome ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View 
            style={[
              styles.welcomeContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Keyboard dismiss button */}
            <TouchableOpacity
              style={styles.keyboardDismissButton}
              onPress={Keyboard.dismiss}
              accessibilityLabel="Dismiss keyboard"
            >
              <Text style={styles.keyboardDismissText}>⌨️</Text>
            </TouchableOpacity>
            
            {/* Back button, not shown on the first onboarding step */}
            {currentOnboardingStep > 0 && (
              <TouchableOpacity
                style={styles.onboardingBackButton}
                onPress={() => setCurrentOnboardingStep(currentOnboardingStep - 1)}
                accessibilityLabel="Go back"
              >
                <ArrowLeft size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View style={styles.welcomeContent}>
            {currentStep.showSkip && (
              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={handleSkip}
              >
                <Text style={styles.skipButtonText}>
                  {currentStep.skipText || "Skip"}
                </Text>
                <ChevronRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            <View style={styles.iconContainer}>
              {currentStep.icon}
            </View>
            
            <Text style={styles.welcomeTitle}>{currentStep.title}</Text>
            <Text style={styles.welcomeDescription}>{currentStep.description}</Text>
            
            {currentStep.content && (
              <View style={styles.stepContent}>
                {currentStep.content}
              </View>
            )}
            
            {currentStep.customButtons ? (
              currentStep.customButtons
            ) : (
              <Button
                title={currentStep.actionText}
                onPress={currentStep.action || handleContinue}
                style={styles.continueButton}
                icon={<ArrowRight size={18} color="#FFFFFF" style={{ marginRight: 8 }} />}
              />
            )}
            
            {/* Modern progress indicator */}
            <View style={styles.progressContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}
              />
              <View style={styles.progressStepsContainer}>
                {onboardingSteps.map((_, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={[
                      styles.progressStep,
                      currentOnboardingStep === index && styles.activeProgressStep
                    ]}
                    onPress={() => {
                      // Only allow going back to previous steps
                      if (index <= currentOnboardingStep) {
                        setCurrentOnboardingStep(index);
                      }
                    }}
                  />
                ))}
              </View>
            </View>
            
            {currentOnboardingStep >= 4 && currentOnboardingStep < onboardingSteps.length - 1 && (
              <Text style={styles.privacyNote}>
                You can always update these details later in your profile settings.
              </Text>
            )}
          </View>
        </Animated.View>
        </TouchableWithoutFeedback>
      ) : (
        <>
          <NotificationHandler />
          <Stack screenOptions={{ headerShown: false }} />
          
          {/* Notification Permission Modal */}
          <NotificationPermissionModal
            visible={showPermissionModal}
            onClose={handlePermissionDeclined}
            onPermissionGranted={handlePermissionGranted}
          />
        </>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContent: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeIcon: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    position: 'absolute',
    top: 40,
    right: 0,
    padding: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 4,
  },
  // Modern progress indicator
  progressContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 10,
    position: 'relative',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  progressStepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'relative',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },
  progressStep: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 2,
  },
  activeProgressStep: {
    backgroundColor: colors.primary,
    transform: [{scale: 1.5}],
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  choiceButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  choiceButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '48%',
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: colors.primary,
  },
  noButton: {
    backgroundColor: '#444444',
  },
  choiceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // New styles for user profile form
  stepContent: {
    width: '100%',
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#232323',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: -12,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  formColumn: {
    width: '48%',
  },

  inputHint: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: -12,
    marginBottom: 16,
  },
  privacyNote: {
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 8,
  },
  // Loading screen styles
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingIcon: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 18,
    color: '#CCCCCC',
    marginBottom: 40,
  },
  loadingBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadingBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  loadingPercentage: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 40,
  },
  welcomeMessage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // AI recommendations styles
  aiRecommendationsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  aiFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  aiFeatureIcon: {
    marginRight: 12,
  },
  aiFeatureText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  aiPrivacyNote: {
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  // Health Disclaimer styles
  healthDisclaimerContainer: {
    width: '100%',
    marginBottom: 16,
  },
  healthDisclaimerScroll: {
    maxHeight: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#232323',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  healthDisclaimerText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  healthDisclaimerBullets: {
    marginLeft: 8,
    marginBottom: 12,
  },
  healthDisclaimerBullet: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  healthDisclaimerCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  healthDisclaimerCheckboxText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  scrollGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 32,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  customScrollbarTrack: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    width: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.04)',
    zIndex: 10,
  },
  customScrollbarThumb: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    width: 6,
  },
  onboardingBackButton: {
    position: 'absolute',
    top: 40,
    left: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 8,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  // HealthKit permission styles
  healthKitContainer: {
    width: '100%',
    marginBottom: 16,
  },
  healthKitFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  healthKitFeatureIcon: {
    marginRight: 12,
  },
  healthKitFeatureText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  healthKitStatus: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    alignItems: 'center',
  },
  healthKitStatusSuccess: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  healthKitStatusDenied: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  healthKitStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  healthKitPrivacyNote: {
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  keyboardDismissButton: {
    position: 'absolute',
    top: 40,
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 8,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  keyboardDismissText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});