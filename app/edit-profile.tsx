import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, TouchableOpacity, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Info } from "lucide-react-native";
import { useMacroStore } from "@/store/macroStore";
import { UserProfile } from "@/types";
import Button from "@/components/Button";
import CustomDropdown from "@/components/CustomDropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import MacroInfoModal from "@/components/MacroInfoModal";
import { useTheme } from "@/context/ThemeContext";

export default function EditProfileScreen() {
  const router = useRouter();
  const { userProfile, updateUserProfile } = useMacroStore();
  const { colors } = useTheme();
  
  // Dropdown options
  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
    { label: "Prefer not to say", value: "prefer-not-to-say" }
  ];
  
  const fitnessGoalOptions = [
    { label: "Lose Weight", value: "lose" },
    { label: "Maintain Weight", value: "maintain" },
    { label: "Gain Muscle", value: "gain" }
  ];
  
  const activityLevelOptions = [
    { label: "Sedentary (little or no exercise)", value: "sedentary" },
    { label: "Lightly active (light exercise 1-3 days/week)", value: "light" },
    { label: "Moderately active (moderate exercise 3-5 days/week)", value: "moderate" },
    { label: "Very active (hard exercise 6-7 days/week)", value: "active" },
    { label: "Extra active (very hard exercise & physical job)", value: "very_active" }
  ];
  
  const [name, setName] = useState(userProfile.name);
  const [weight, setWeight] = useState(userProfile.weight.toString());
  const [height, setHeight] = useState(userProfile.height.toString());
  const [age, setAge] = useState(userProfile.age.toString());
  const [gender, setGender] = useState(userProfile.gender || "male");
  const [fitnessGoal, setFitnessGoal] = useState(userProfile.fitnessGoal);
  const [activityLevel, setActivityLevel] = useState(userProfile.activityLevel);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
    userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  
  const handleSave = () => {
    const updatedProfile: UserProfile = {
      name,
      weight: parseFloat(weight) || userProfile.weight,
      height: parseFloat(height) || userProfile.height,
      age: parseInt(age) || userProfile.age,
      gender,
      fitnessGoal,
      activityLevel,
      dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
    };
    
    updateUserProfile(updatedProfile);
    Alert.alert("Success", "Profile updated successfully");
    router.back();
  };
  
  const handleGoBack = () => {
    router.back();
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      
      // Calculate age from date of birth
      if (selectedDate) {
        const today = new Date();
        let calculatedAge = today.getFullYear() - selectedDate.getFullYear();
        const m = today.getMonth() - selectedDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
          calculatedAge--;
        }
        setAge(calculatedAge.toString());
      }
    }
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return "Select Date of Birth";
    return date.toLocaleDateString();
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen 
        options={{
          title: "Edit Profile",
          headerBackTitle: "Profile",
          headerLeft: () => (
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Edit Your Profile</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Update your personal information</Text>
      </View>
      
      <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Name</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Weight (kg)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="Your weight in kg"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Height (cm)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
            placeholder="Your height in cm"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Date of Birth</Text>
          <TouchableOpacity 
            style={[styles.datePickerButton, { borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.datePickerText, { color: colors.text }]}>
              {formatDate(dateOfBirth)}
            </Text>
            <Calendar size={20} color={colors.primary} />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth || new Date(1990, 0, 1)}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Age</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            placeholder="Your age"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
          <CustomDropdown
            value={gender}
            onValueChange={setGender}
            options={genderOptions}
            placeholder="Select gender"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Fitness Goal</Text>
            <TouchableOpacity 
              onPress={() => setInfoModalVisible(true)}
              style={styles.infoButton}
              accessibilityLabel="Nutrition information"
              accessibilityHint="Opens a modal with information about how nutrition goals are calculated"
            >
              <Info size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <CustomDropdown
            value={fitnessGoal}
            onValueChange={setFitnessGoal}
            options={fitnessGoalOptions}
            placeholder="Select fitness goal"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Activity Level</Text>
          <CustomDropdown
            value={activityLevel}
            onValueChange={setActivityLevel}
            options={activityLevelOptions}
            placeholder="Select activity level"
          />
        </View>
        
        <View style={[styles.disclaimerContainer, { backgroundColor: colors.backgroundLight }]}>
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            Your profile information is used to calculate personalized nutrition recommendations. 
            These are estimates only - for precise guidance, consult a healthcare professional.
          </Text>
        </View>
      </View>
      
      <Button
        title="Save Profile"
        onPress={handleSave}
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
      />
      
      <MacroInfoModal 
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  formContainer: {
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
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  infoButton: {
    marginLeft: 8,
    padding: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  backButton: {
    padding: 8,
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  datePickerText: {
    fontSize: 16,
  },
  disclaimerContainer: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 18,
  },
});