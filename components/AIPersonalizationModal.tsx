import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAiStore, AIPersonality, UserProfile } from '../store/aiStore';
import { colors } from '../constants/colors';

interface AIPersonalizationModalProps {
  visible: boolean;
  onClose: () => void;
}

const PERSONALITY_OPTIONS = [
  {
    id: 'motivational',
    name: 'Motivational Coach',
    description: 'Energetic and encouraging, always pushing you to do your best',
    emoji: '💪',
  },
  {
    id: 'technical',
    name: 'Technical Trainer',
    description: 'Focused on form, technique, and scientific approach to fitness',
    emoji: '📊',
  },
  {
    id: 'friendly',
    name: 'Friendly Guide',
    description: 'Warm and supportive, like a good friend who happens to be a trainer',
    emoji: '😊',
  },
  {
    id: 'strict',
    name: 'Strict Coach',
    description: 'No-nonsense approach, holds you accountable to your goals',
    emoji: '🎯',
  },
];

const EXPERTISE_OPTIONS = [
  { id: 'strength', name: 'Strength Training', emoji: '🏋️' },
  { id: 'cardio', name: 'Cardio & Endurance', emoji: '🏃' },
  { id: 'flexibility', name: 'Flexibility & Mobility', emoji: '🧘' },
  { id: 'nutrition', name: 'Nutrition Focus', emoji: '🥗' },
  { id: 'general', name: 'General Fitness', emoji: '⚡' },
];

const COMMUNICATION_STYLES = [
  { id: 'casual', name: 'Casual', description: 'Relaxed and conversational' },
  { id: 'professional', name: 'Professional', description: 'Formal and structured' },
  { id: 'encouraging', name: 'Encouraging', description: 'Positive and uplifting' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', name: 'Beginner', description: 'New to fitness or getting back into it' },
  { id: 'intermediate', name: 'Intermediate', description: 'Some experience with regular workouts' },
  { id: 'advanced', name: 'Advanced', description: 'Experienced with various training methods' },
];

const MOTIVATION_STYLES = [
  { id: 'achievement', name: 'Achievement', description: 'Driven by goals and milestones' },
  { id: 'social', name: 'Social', description: 'Motivated by community and sharing' },
  { id: 'health', name: 'Health', description: 'Focused on overall wellness' },
  { id: 'appearance', name: 'Appearance', description: 'Goal-oriented towards physical changes' },
];

export default function AIPersonalizationModal({ visible, onClose }: AIPersonalizationModalProps) {
  const {
    aiPersonality,
    userProfile,
    setAIPersonality,
    updateUserProfile,
    generatePersonalizedGreeting,
  } = useAiStore();

  const [aiName, setAiName] = useState(aiPersonality.name);
  const [userName, setUserName] = useState(userProfile.preferredName);
  const [selectedPersonality, setSelectedPersonality] = useState(aiPersonality.personality);
  const [selectedExpertise, setSelectedExpertise] = useState(aiPersonality.expertise);
  const [selectedCommunication, setSelectedCommunication] = useState(aiPersonality.communicationStyle);
  const [selectedExperience, setSelectedExperience] = useState(userProfile.experienceLevel);
  const [selectedMotivation, setSelectedMotivation] = useState(userProfile.motivationStyle);

  const handleSave = () => {
    if (!aiName.trim()) {
      Alert.alert('Error', 'Please enter a name for your AI assistant');
      return;
    }

    // Update AI personality
    const newPersonality: AIPersonality = {
      ...aiPersonality,
      name: aiName.trim(),
      personality: selectedPersonality,
      expertise: selectedExpertise,
      communicationStyle: selectedCommunication,
    };

    // Update user profile
    const profileUpdates: Partial<UserProfile> = {
      preferredName: userName.trim(),
      experienceLevel: selectedExperience,
      motivationStyle: selectedMotivation,
    };

    setAIPersonality(newPersonality);
    updateUserProfile(profileUpdates);

    Alert.alert(
      'Personalization Updated!',
      `Your AI assistant ${aiName} is now ready to help you with your fitness journey!`,
      [{ text: 'OK', onPress: onClose }]
    );
  };

  const previewGreeting = () => {
    const tempPersonality = {
      ...aiPersonality,
      name: aiName.trim() || aiPersonality.name,
      personality: selectedPersonality,
      expertise: selectedExpertise,
      communicationStyle: selectedCommunication,
    };

    const tempProfile = {
      ...userProfile,
      preferredName: userName.trim() || userProfile.preferredName,
      experienceLevel: selectedExperience,
      motivationStyle: selectedMotivation,
    };

    // Temporarily set the values to generate greeting
    const originalPersonality = aiPersonality;
    const originalProfile = userProfile;
    
    setAIPersonality(tempPersonality);
    updateUserProfile(tempProfile);
    
    const greeting = generatePersonalizedGreeting();
    
    // Restore original values
    setAIPersonality(originalPersonality);
    updateUserProfile(originalProfile);
    
    Alert.alert('Preview Greeting', greeting);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Personalize Your AI Assistant</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* AI Assistant Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Assistant Name</Text>
            <TextInput
              style={styles.input}
              value={aiName}
              onChangeText={setAiName}
              placeholder="Enter AI assistant name..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* User Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={userName}
              onChangeText={setUserName}
              placeholder="Enter your preferred name..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* AI Personality */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Personality</Text>
            {PERSONALITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedPersonality === option.id && styles.selectedOption,
                ]}
                onPress={() => setSelectedPersonality(option.id as any)}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.name}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* AI Expertise */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Expertise Focus</Text>
            <View style={styles.expertiseGrid}>
              {EXPERTISE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.expertiseOption,
                    selectedExpertise === option.id && styles.selectedExpertise,
                  ]}
                  onPress={() => setSelectedExpertise(option.id as any)}
                >
                  <Text style={styles.expertiseEmoji}>{option.emoji}</Text>
                  <Text style={styles.expertiseName}>{option.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Communication Style */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Communication Style</Text>
            {COMMUNICATION_STYLES.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedCommunication === option.id && styles.selectedOption,
                ]}
                onPress={() => setSelectedCommunication(option.id as any)}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.name}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* User Experience Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Experience Level</Text>
            {EXPERIENCE_LEVELS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedExperience === option.id && styles.selectedOption,
                ]}
                onPress={() => setSelectedExperience(option.id as any)}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.name}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Motivation Style */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What Motivates You?</Text>
            {MOTIVATION_STYLES.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  selectedMotivation === option.id && styles.selectedOption,
                ]}
                onPress={() => setSelectedMotivation(option.id as any)}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.name}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.previewButton} onPress={previewGreeting}>
            <Text style={styles.previewButtonText}>Preview Greeting</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Personalization</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  expertiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  expertiseOption: {
    width: '48%',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedExpertise: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  expertiseEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  expertiseName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewButton: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
}); 