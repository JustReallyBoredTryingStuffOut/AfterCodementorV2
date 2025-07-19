import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Dimensions, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Search, Filter, Zap, Activity, Dumbbell, ChevronRight, Info } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useWorkoutStore } from "@/store/workoutStore";
import { useMacroStore } from "@/store/macroStore";
import WorkoutCard from "@/components/WorkoutCard";
import MuscleGroupSelector from "@/components/MuscleGroupSelector";
import EquipmentSelector from "@/components/EquipmentSelector";
import AiRecommendationsModal from "@/components/AiRecommendationsModal";
import { BodyRegion, MuscleGroup, EquipmentType, Exercise } from "@/types";

export default function WorkoutsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    workouts, 
    getRecommendedWorkouts, 
    workoutRecommendationsEnabled,
    aiRecommendationsExplained,
    toggleWorkoutRecommendations,
    setAiRecommendationsExplained,
    getBodyRegions,
    getMuscleGroups,
    getEquipmentTypes,
    getFilteredExercises,
    exercises
  } = useWorkoutStore();
  
  const { userProfile } = useMacroStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'workouts' | 'exercises'>('workouts');
  const [selectedBodyRegion, setSelectedBodyRegion] = useState<BodyRegion | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [selectedEquipmentCategory, setSelectedEquipmentCategory] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [showAiRecommendationsModal, setShowAiRecommendationsModal] = useState(false);
  const [bodyViewMode, setBodyViewMode] = useState<'front' | 'back'>('front');
  
  // Get recommended workouts based on user's fitness level and goals
  const recommendedWorkouts = getRecommendedWorkouts(5);
  const recommendedWorkoutIds = new Set(recommendedWorkouts.map(w => w.id));
  
  // Filter workouts based on recommendations if enabled
  const filteredWorkouts = showRecommendedOnly 
    ? workouts.filter(workout => recommendedWorkoutIds.has(workout.id))
    : workouts;
  
  // Group workouts by category
  const workoutsByCategory = filteredWorkouts.reduce((acc, workout) => {
    if (!acc[workout.category]) {
      acc[workout.category] = [];
    }
    acc[workout.category].push({
      ...workout,
      isRecommended: recommendedWorkoutIds.has(workout.id)
    });
    return acc;
  }, {} as Record<string, any[]>);
  
  // Get unique categories
  const categories = Object.keys(workoutsByCategory);
  
  // Get body regions, muscle groups, and equipment types
  const bodyRegions = getBodyRegions();
  const muscleGroups = getMuscleGroups(selectedBodyRegion || undefined);
  const equipmentTypes = getEquipmentTypes();
  
  // Check if we should show the AI recommendations modal
  useEffect(() => {
    if (!aiRecommendationsExplained && !workoutRecommendationsEnabled && viewMode === 'workouts') {
      // Show the AI recommendations modal when user first visits the workouts tab
      setShowAiRecommendationsModal(true);
    }
  }, [aiRecommendationsExplained, workoutRecommendationsEnabled, viewMode]);
  
  // Update filtered exercises when filters change
  useEffect(() => {
    if (viewMode === 'exercises') {
      const filters = {
        bodyRegion: selectedBodyRegion || undefined,
        muscleGroup: selectedMuscleGroup || undefined,
        equipment: selectedEquipment || undefined,
        searchQuery: searchQuery || undefined,
      };
      
      const filtered = getFilteredExercises(filters);
      setFilteredExercises(filtered);
    }
  }, [viewMode, selectedBodyRegion, selectedMuscleGroup, selectedEquipment, searchQuery]);
  
  const handleSelectBodyRegion = (region: BodyRegion) => {
    if (selectedBodyRegion === region) {
      setSelectedBodyRegion(null);
      setSelectedMuscleGroup(null);
    } else {
      setSelectedBodyRegion(region);
      setSelectedMuscleGroup(null);
      // Reset to front view when changing body region
      setBodyViewMode('front');
    }
  };
  
  const handleSelectMuscleGroup = (group: MuscleGroup) => {
    setSelectedMuscleGroup(selectedMuscleGroup === group ? null : group);
  };
  
  const handleSelectEquipmentCategory = (category: string | null) => {
    setSelectedEquipmentCategory(category);
  };
  
  const handleSelectEquipment = (equipment: EquipmentType) => {
    setSelectedEquipment(selectedEquipment === equipment ? null : equipment);
  };
  
  const toggleBodyViewMode = () => {
    setBodyViewMode(bodyViewMode === 'front' ? 'back' : 'front');
  };
  
  const clearFilters = () => {
    setSelectedBodyRegion(null);
    setSelectedMuscleGroup(null);
    setSelectedEquipmentCategory(null);
    setSelectedEquipment(null);
  };
  
  // Handle AI recommendations modal actions
  const handleEnableAiRecommendations = () => {
    toggleWorkoutRecommendations(true);
    setAiRecommendationsExplained(true);
    setShowAiRecommendationsModal(false);
  };
  
  const handleDisableAiRecommendations = () => {
    toggleWorkoutRecommendations(false);
    setAiRecommendationsExplained(true);
    setShowAiRecommendationsModal(false);
  };
  
  const screenWidth = Dimensions.get('window').width;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.searchBar, { backgroundColor: colors.background }]}
          onPress={() => router.push("/search")}
          activeOpacity={0.7}
        >
          <Search size={20} color={colors.textSecondary} />
          <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>Search workouts...</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: colors.background }]}
          onPress={() => setViewMode(viewMode === 'workouts' ? 'exercises' : 'workouts')}
        >
          <Filter size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.viewToggle, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.viewToggleButton, 
            viewMode === 'workouts' && [styles.activeViewToggleButton, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setViewMode('workouts')}
        >
          <Text style={[
            styles.viewToggleText, 
            { color: colors.textSecondary },
            viewMode === 'workouts' && { color: colors.primary }
          ]}>
            Workouts
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.viewToggleButton, 
            viewMode === 'exercises' && [styles.activeViewToggleButton, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setViewMode('exercises')}
        >
          <Text style={[
            styles.viewToggleText, 
            { color: colors.textSecondary },
            viewMode === 'exercises' && { color: colors.primary }
          ]}>
            Exercises
          </Text>
        </TouchableOpacity>
      </View>
      
      {viewMode === 'workouts' && (
        <View style={[styles.recommendationsToggle, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.toggleContainer}>
            <Zap size={16} color={colors.primary} />
            <Text style={[styles.toggleLabel, { color: colors.text }]}>AI Recommendations</Text>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => setShowAiRecommendationsModal(true)}
            >
              <Info size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Switch
            value={workoutRecommendationsEnabled}
            onValueChange={(value) => {
              if (!value) {
                // If turning off, just do it
                toggleWorkoutRecommendations(false);
              } else {
                // If turning on, show explanation first if not already explained
                if (!aiRecommendationsExplained) {
                  setShowAiRecommendationsModal(true);
                } else {
                  toggleWorkoutRecommendations(true);
                }
              }
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      )}
      
      {viewMode === 'workouts' && workoutRecommendationsEnabled && (
        <View style={[styles.recommendationsToggle, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Show recommended only</Text>
          </View>
          <Switch
            value={showRecommendedOnly}
            onValueChange={setShowRecommendedOnly}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      )}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'workouts' ? (
          <>
            {/* Cardio Activities Section */}
            <View style={styles.cardioSection}>
              <Text style={[styles.cardioTitle, { color: colors.text }]}>Cardio Activities</Text>
              <View style={styles.cardioCards}>
                <TouchableOpacity 
                  style={[styles.cardioCard, { backgroundColor: colors.card }]}
                  onPress={() => router.push("/log-cardio")}
                >
                  <View style={[styles.cardioIcon, { backgroundColor: "rgba(52, 152, 219, 0.1)" }]}>
                    <Activity size={24} color="#3498db" />
                  </View>
                  <Text style={[styles.cardioName, { color: colors.text }]}>Log Cardio</Text>
                  <Text style={[styles.cardioDescription, { color: colors.textSecondary }]}>Walking, Running, Cycling</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.cardioCard, { backgroundColor: colors.card }]}
                  onPress={() => router.push("/activity-log")}
                >
                  <View style={[styles.cardioIcon, { backgroundColor: "rgba(46, 204, 113, 0.1)" }]}>
                    <Activity size={24} color="#2ecc71" />
                  </View>
                  <Text style={[styles.cardioName, { color: colors.text }]}>Other Activities</Text>
                  <Text style={[styles.cardioDescription, { color: colors.textSecondary }]}>Swimming, Hiking, Sports</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {workoutRecommendationsEnabled && recommendedWorkouts.length > 0 && !showRecommendedOnly && (
              <View style={[styles.recommendedSection, { backgroundColor: colors.card }]}>
                <Text style={[styles.recommendedTitle, { color: colors.text }]}>Recommended For You</Text>
                <Text style={[styles.recommendedSubtitle, { color: colors.textSecondary }]}>
                  Based on your {userProfile.fitnessLevel || "beginner"} fitness level and {userProfile.fitnessGoal || "general"} goals
                </Text>
                
                {/* Show personalized recommendation info */}
                <View style={styles.personalizationInfo}>
                  <Text style={[styles.personalizationText, { color: colors.textSecondary }]}>
                    {userProfile.fitnessGoal === 'lose' 
                      ? "Focusing on workouts that support weight loss goals"
                      : userProfile.fitnessGoal === 'gain'
                      ? "Prioritizing strength training for muscle building"
                      : "Balanced workouts for weight maintenance"
                    }
                  </Text>
                  <Text style={[styles.personalizationText, { color: colors.textSecondary }]}>
                    {userProfile.fitnessLevel === 'beginner'
                      ? "Showing beginner-friendly workouts for safe progression"
                      : userProfile.fitnessLevel === 'intermediate'
                      ? "Mix of beginner and intermediate workouts for gradual challenge"
                      : "Full range of workouts to match your advanced level"
                    }
                  </Text>
                </View>
                
                {recommendedWorkouts.slice(0, 3).map((workout) => (
                  <WorkoutCard 
                    key={workout.id} 
                    workout={{...workout, isRecommended: true}}
                  />
                ))}
                
                {recommendedWorkouts.length > 3 && (
                  <TouchableOpacity 
                    style={[styles.showMoreButton, { borderTopColor: colors.border }]}
                    onPress={() => setShowRecommendedOnly(true)}
                  >
                    <Text style={[styles.showMoreText, { color: colors.primary }]}>
                      Show all {recommendedWorkouts.length} recommended workouts
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {categories.map((category) => (
              <View key={category} style={styles.categorySection}>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>{category}</Text>
                
                {workoutsByCategory[category].map((workout) => (
                  <WorkoutCard key={workout.id} workout={workout} />
                ))}
              </View>
            ))}
            
            {categories.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  {showRecommendedOnly 
                    ? "No recommended workouts found. Try different workouts to get personalized recommendations."
                    : "No workouts found."}
                </Text>
              </View>
            )}
          </>
        ) : (
          // Exercise Browser View
          <View style={styles.exerciseBrowserContainer}>
            {/* Body Region and Muscle Group Selector */}
            <MuscleGroupSelector
              selectedBodyRegion={selectedBodyRegion}
              selectedMuscleGroup={selectedMuscleGroup}
              onSelectBodyRegion={handleSelectBodyRegion}
              onSelectMuscleGroup={handleSelectMuscleGroup}
              bodyRegions={bodyRegions}
              muscleGroups={muscleGroups}
              viewMode={bodyViewMode}
              toggleViewMode={toggleBodyViewMode}
            />
            
            {/* Equipment Selector */}
            <EquipmentSelector
              selectedEquipmentCategory={selectedEquipmentCategory}
              selectedEquipment={selectedEquipment}
              onSelectEquipmentCategory={handleSelectEquipmentCategory}
              onSelectEquipment={handleSelectEquipment}
              equipmentTypes={equipmentTypes}
            />
            
            {/* Clear Filters Button */}
            {(selectedBodyRegion || selectedMuscleGroup || selectedEquipmentCategory || selectedEquipment) && (
              <TouchableOpacity 
                style={[styles.clearFiltersButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={clearFilters}
              >
                <Text style={[styles.clearFiltersText, { color: colors.text }]}>Clear Filters</Text>
              </TouchableOpacity>
            )}
            
            {/* Exercise Results */}
            <View style={styles.exerciseResultsContainer}>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                {filteredExercises.length} {filteredExercises.length === 1 ? 'Exercise' : 'Exercises'} Found
              </Text>
              
              {filteredExercises.length > 0 ? (
                filteredExercises.map(exercise => (
                  <TouchableOpacity 
                    key={exercise.id}
                    style={[styles.exerciseResultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push(`/exercise/${exercise.id}`)}
                  >
                    <View style={styles.exerciseResultContent}>
                      <Text style={[styles.exerciseResultName, { color: colors.text }]}>{exercise.name}</Text>
                      <View style={styles.exerciseResultTags}>
                        {exercise.muscleGroups.slice(0, 2).map(group => (
                          <View key={typeof group === 'string' ? group : group.name} style={styles.exerciseResultTag}>
                            <Text style={styles.exerciseResultTagText}>{typeof group === 'string' ? group : group.name}</Text>
                          </View>
                        ))}
                        {exercise.equipment.length > 0 && (
                          <View style={styles.exerciseResultEquipment}>
                            <Dumbbell size={12} color={colors.textSecondary} />
                            <Text style={[styles.exerciseResultEquipmentText, { color: colors.textSecondary }]}>
                              {typeof exercise.equipment[0] === 'string' ? exercise.equipment[0] : exercise.equipment[0].name}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    No exercises found with the selected filters.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/create-workout")}
      >
        <Text style={styles.createButtonText}>Create Custom Workout</Text>
      </TouchableOpacity>
      
      {/* AI Recommendations Modal */}
      <AiRecommendationsModal
        visible={showAiRecommendationsModal}
        onClose={() => {
          setAiRecommendationsExplained(true);
          setShowAiRecommendationsModal(false);
        }}
        onEnable={handleEnableAiRecommendations}
        onDisable={handleDisableAiRecommendations}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 12,
  },
  searchPlaceholder: {
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  viewToggle: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeViewToggleButton: {
    borderBottomWidth: 2,
  },
  viewToggleText: {
    fontSize: 16,
    fontWeight: "500",
  },
  recommendationsToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  infoButton: {
    marginLeft: 8,
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  cardioSection: {
    marginBottom: 24,
  },
  cardioTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  cardioCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardioCard: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardioIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardioName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardioDescription: {
    fontSize: 12,
  },
  recommendedSection: {
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendedTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  recommendedSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  showMoreButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "500",
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  createButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginTop: 24,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
  exerciseBrowserContainer: {
    flex: 1,
  },
  clearFiltersButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: "500",
  },
  exerciseResultsContainer: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  exerciseResultCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  exerciseResultContent: {
    flex: 1,
  },
  exerciseResultName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  exerciseResultTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  exerciseResultTag: {
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  exerciseResultTagText: {
    fontSize: 12,
    color: "#3498db",
  },
  exerciseResultEquipment: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  exerciseResultEquipmentText: {
    fontSize: 12,
    marginLeft: 4,
  },
  personalizationInfo: {
    marginTop: 12,
    marginBottom: 16,
  },
  personalizationText: {
    fontSize: 14,
    marginBottom: 4,
  },
});