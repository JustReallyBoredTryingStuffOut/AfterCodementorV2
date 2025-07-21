import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, ArrowRight, Sparkles, Zap } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { useAiStore } from '../store/aiStore';

const STEPS = [
  {
    title: 'Welcome to AI Assistant',
    subtitle: 'Your personalized fitness companion is ready to help you achieve your goals',
    color: '#fbbf24',
  },
  {
    title: 'Customize Your AI',
    subtitle: 'Set up your AI assistant to match your preferences',
    color: '#10b981',
  },
  {
    title: 'AI Features',
    subtitle: 'Discover what your AI assistant can do for you',
    color: '#3b82f6',
  },
  {
    title: 'Ready to Start',
    subtitle: 'Your AI assistant is ready to help you on your fitness journey',
    color: '#ef4444',
  },
];

const PERSONALITY_OPTIONS = [
  {
    id: 'motivational',
    name: 'Motivational Coach',
    emoji: '💪',
    description: 'Energetic and encouraging, always pushing you to do your best',
  },
  {
    id: 'technical',
    name: 'Technical Trainer',
    emoji: '📊',
    description: 'Focused on form, technique, and scientific approach',
  },
  {
    id: 'friendly',
    name: 'Friendly Guide',
    emoji: '😊',
    description: 'Warm and supportive, like a good friend who happens to be a trainer',
  },
  {
    id: 'strict',
    name: 'Strict Coach',
    emoji: '🎯',
    description: 'No-nonsense approach, focused on results and discipline',
  },
];

const EXPERTISE_OPTIONS = [
  {
    id: 'strength',
    name: 'Strength Training',
    emoji: '🏋️',
  },
  {
    id: 'cardio',
    name: 'Cardio & Endurance',
    emoji: '🏃',
  },
  {
    id: 'flexibility',
    name: 'Flexibility & Mobility',
    emoji: '🧘',
  },
  {
    id: 'nutrition',
    name: 'Nutrition Focus',
    emoji: '🥗',
  },
  {
    id: 'general',
    name: 'General Fitness',
    emoji: '💪',
  },
];

const AI_FEATURES = [
  {
    title: 'Smart Workouts',
    description: 'AI-generated workouts based on your goals',
    color: '#10b981',
    icon: Sparkles,
  },
  {
    title: 'Progress Tracking',
    description: 'Monitor your fitness journey with detailed analytics',
    color: '#3b82f6',
    icon: Sparkles,
  },
  {
    title: 'Nutrition Guidance',
    description: 'Get personalized meal plans and nutrition advice',
    color: '#f59e0b',
    icon: Sparkles,
  },
  {
    title: 'Real-time Support',
    description: '24/7 AI assistance for your fitness questions',
    color: '#8b5cf6',
    icon: Sparkles,
  },
];

const AI_CAPABILITIES = [
  {
    title: 'Natural Conversations',
    description: 'Chat naturally with your AI assistant',
    color: '#10b981',
    icon: Sparkles,
  },
  {
    title: 'Goal Setting',
    description: 'Set and track personalized fitness goals',
    color: '#3b82f6',
    icon: Sparkles,
  },
  {
    title: 'Workout Scheduling',
    description: 'Plan and schedule your workouts automatically',
    color: '#f59e0b',
    icon: Sparkles,
  },
  {
    title: 'Progress Analysis',
    description: 'Get insights into your fitness progress',
    color: '#8b5cf6',
    icon: Sparkles,
  },
];

interface AIOnboardingScreenProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function AIOnboardingScreen({ visible, onComplete, onSkip }: AIOnboardingScreenProps) {
  const {
    aiPersonality,
    setAIPersonality,
  } = useAiStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [aiName, setAiName] = useState(aiPersonality?.name || '');
  const [selectedPersonality, setSelectedPersonality] = useState(aiPersonality?.personality || 'motivational');
  const [selectedExpertise, setSelectedExpertise] = useState(aiPersonality?.expertise || 'strength');

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: (currentStep + 1) / STEPS.length,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible, currentStep]);

  const handleNext = () => {
    // Dismiss keyboard when moving to next step
    Keyboard.dismiss();
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    // Dismiss keyboard when going back
    Keyboard.dismiss();
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const newPersonality = {
      ...aiPersonality,
      name: aiName.trim(),
      personality: selectedPersonality,
      expertise: selectedExpertise,
    };
    setAIPersonality(newPersonality);
    onComplete();
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{STEPS[0].title}</Text>
      <Text style={styles.stepSubtitle}>{STEPS[0].subtitle}</Text>
      
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>🎯 Personalized fitness guidance</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>💬 Natural conversation interface</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>📊 Smart progress analysis</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>⚡ Real-time recommendations</Text>
        </View>
      </View>
    </View>
  );

  const renderNameSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Name Your AI Assistant</Text>
      <TextInput
        style={styles.nameInput}
        value={aiName}
        onChangeText={setAiName}
        placeholder="e.g., Coach Max, FitBuddy, Trainer Sam"
        placeholderTextColor="rgba(255, 255, 255, 0.6)"
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        blurOnSubmit={true}
        autoCapitalize="words"
        autoCorrect={false}
      />
    </View>
  );

  const renderPersonalitySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Choose Personality</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {PERSONALITY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selectedPersonality === option.id && styles.selectedCard,
            ]}
            onPress={() => setSelectedPersonality(option.id)}
          >
            <Text style={styles.optionEmoji}>{option.emoji}</Text>
            <Text style={styles.optionName}>{option.name}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.scrollIndicator}>
        {PERSONALITY_OPTIONS.map((_, index) => (
          <View key={index} style={styles.scrollDot} />
        ))}
      </View>
    </View>
  );

  const renderExpertiseSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Choose Expertise</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {EXPERTISE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selectedExpertise === option.id && styles.selectedCard,
            ]}
            onPress={() => setSelectedExpertise(option.id)}
          >
            <Text style={styles.optionEmoji}>{option.emoji}</Text>
            <Text style={styles.optionName}>{option.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.scrollIndicator}>
        {EXPERTISE_OPTIONS.map((_, index) => (
          <View key={index} style={styles.scrollDot} />
        ))}
      </View>
    </View>
  );

  const renderAISetupStep = () => (
    <View style={styles.stepContainer}>
      {renderNameSection()}
      {renderPersonalitySection()}
      {renderExpertiseSection()}
    </View>
  );

  const renderFeaturesStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{STEPS[2].title}</Text>
      <Text style={styles.stepSubtitle}>{STEPS[2].subtitle}</Text>
      
      <Text style={styles.sectionTitle}>AI Features</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {AI_FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
              <feature.icon size={24} color={colors.white} />
            </View>
            <Text style={styles.featureCardTitle}>{feature.title}</Text>
            <Text style={styles.featureCardDescription}>{feature.description}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.scrollIndicator}>
        {AI_FEATURES.map((_, index) => (
          <View key={index} style={styles.scrollDot} />
        ))}
      </View>
      
      <Text style={styles.sectionTitle}>AI Capabilities</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {AI_CAPABILITIES.map((capability, index) => (
          <View key={index} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: capability.color }]}>
              <capability.icon size={24} color={colors.white} />
            </View>
            <Text style={styles.featureCardTitle}>{capability.title}</Text>
            <Text style={styles.featureCardDescription}>{capability.description}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.scrollIndicator}>
        {AI_CAPABILITIES.map((_, index) => (
          <View key={index} style={styles.scrollDot} />
        ))}
      </View>
    </ScrollView>
  );

  const renderReadyStep = () => (
    <View style={styles.stepContainer}>
      <Animated.View style={[styles.iconContainer, { opacity: fadeAnim }]}>
        <Zap size={80} color={STEPS[3].color} />
      </Animated.View>
      
      <Text style={styles.stepTitle}>{STEPS[3].title}</Text>
      <Text style={styles.stepSubtitle}>{STEPS[3].subtitle}</Text>
      
      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Your AI Assistant: {aiName}</Text>
        <Text style={styles.previewSubtitle}>
          {PERSONALITY_OPTIONS.find(p => p.id === selectedPersonality)?.name} • {EXPERTISE_OPTIONS.find(e => e.id === selectedExpertise)?.name}
        </Text>
        <Text style={styles.previewGreeting}>
          "Hi! I'm {aiName}, your {PERSONALITY_OPTIONS.find(p => p.id === selectedPersonality)?.name.toLowerCase()} specializing in {EXPERTISE_OPTIONS.find(e => e.id === selectedExpertise)?.name.toLowerCase()}. I'm here to help you achieve your fitness goals!"
        </Text>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderAISetupStep();
      case 2:
        return renderFeaturesStep();
      case 3:
        return renderReadyStep();
      default:
        return renderWelcomeStep();
    }
  };

  if (!visible) return null;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.background} />
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {currentStep + 1} of {STEPS.length}
              </Text>
            </View>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View style={styles.stepContent}>
              {renderStep()}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {currentStep > 0 && (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <ArrowLeft size={20} color={colors.text} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={handleNext}
              style={[
                styles.nextButton,
                currentStep === STEPS.length - 1 && styles.completeButton,
              ]}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <ArrowRight size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  progressText: {
    color: colors.white,
    fontSize: 12,
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    alignItems: 'center',
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  section: {
    width: '100%',
    marginBottom: 30,
  },
  iconContainer: {
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  nameInput: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  horizontalScroll: {
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  optionCard: {
    width: 160,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  optionName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  optionDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 12,
  },
  featureCard: {
    width: 180,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureCardTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureCardDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 12,
  },
  scrollIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  scrollDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  featureList: {
    width: '100%',
    marginTop: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  featureText: {
    color: colors.white,
    fontSize: 16,
    marginLeft: 15,
  },
  previewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    width: '100%',
  },
  previewTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  previewSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  previewGreeting: {
    color: colors.white,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 16,
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  completeButton: {
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
}); 