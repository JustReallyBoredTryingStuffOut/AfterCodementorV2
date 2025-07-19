import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from "react-native";
import { TrendingUp, Plus, ArrowLeft, Trash2 } from "lucide-react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "@/constants/colors";
import { useHealthStore } from "@/store/healthStore";
import { useMacroStore } from "@/store/macroStore";
import { useRouter } from "expo-router";
import { calculateWeightProgress as calculateSmartWeightProgress } from "@/utils/dateUtils";

type WeightTrackerProps = {
  compact?: boolean;
  standalone?: boolean;
  onAddWeight?: () => void;
  onDeleteWeight?: (id: string) => void;
  onBackPress?: () => void;
};

export default function WeightTracker({ 
  compact, 
  standalone, 
  onAddWeight,
  onDeleteWeight,
  onBackPress
}: WeightTrackerProps) {
  const router = useRouter();
  const { weightLogs, calculateWeightProgress: healthStoreProgress, getWeightTrend, removeWeightLog, syncWeightFromHealthKit } = useHealthStore();
  const { userProfile } = useMacroStore();
  
  // Sync weight data from HealthKit when component mounts
  useEffect(() => {
    const syncWeightData = async () => {
      try {
        await syncWeightFromHealthKit();
      } catch (error) {
        console.error('Error syncing weight data:', error);
      }
    };
    
    syncWeightData();
  }, [syncWeightFromHealthKit]);
  
  // Get weight progress from health store
  const healthProgress = healthStoreProgress();
  
  // Get smart progress tracking using onboarding data
  const currentWeight = healthProgress.currentWeight;
  const startWeight = userProfile?.weight || 0; // Use onboarding weight as baseline
  const targetWeight = userProfile?.targetWeight || 0; // Get target weight from onboarding
  
  // Use onboarding weight as fallback if no HealthKit data
  const displayWeight = currentWeight > 0 ? currentWeight : startWeight;
  const weightSource = currentWeight > 0 ? 'HealthKit' : 'Onboarding';
  
  const smartProgress = calculateSmartWeightProgress({
    startWeight: startWeight || 0,
    currentWeight: displayWeight || 0,
    goal: userProfile?.fitnessGoal || 'maintain',
    targetWeight: targetWeight || 0,
  });
  
  // Get weight trend for the last 30 days
  const trend = getWeightTrend(30);
  
  // Calculate min and max values for the chart
  const weights = trend.weights;
  const minWeight = weights.length > 0 ? Math.min(...weights) * 0.95 : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) * 1.05 : 100;
  
  // Calculate chart dimensions
  const chartWidth = Dimensions.get("window").width - (standalone ? 64 : 32);
  const chartHeight = standalone ? 200 : 100;
  
  // Generate chart points
  const points = weights.map((weight, index) => {
    const x = (index / (weights.length - 1 || 1)) * chartWidth;
    const normalizedWeight = (weight - minWeight) / (maxWeight - minWeight || 1);
    const y = chartHeight - (normalizedWeight * chartHeight);
    return { x, y };
  });
  
  // Generate SVG path for the chart
  const generatePath = () => {
    if (points.length < 2) return "";
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    return path;
  };
  
  const handleAddWeight = () => {
    if (onAddWeight) {
      onAddWeight();
    } else {
      router.push("/weight-log");
    }
  };
  
  const handleDeleteWeight = (id: string) => {
    if (onDeleteWeight) {
      onDeleteWeight(id);
    } else {
      Alert.alert(
        "Delete Weight Log",
        "Are you sure you want to delete this weight log?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: () => removeWeightLog(id),
            style: "destructive",
          },
        ]
      );
    }
  };
  
  const handleGoBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };
  
  // Safety check - don't render if userProfile is not loaded yet
  if (!userProfile) {
    return (
      <View style={[styles.container, standalone && styles.standaloneContainer]}>
        <View style={styles.header}>
          <Text style={styles.title}>Weight Tracker</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      </View>
    );
  }
  
  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer}
        onPress={handleAddWeight}
      >
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>Weight</Text>
          <TrendingUp size={16} color={colors.primary} />
        </View>
        
        {currentWeight > 0 ? (
          <Text style={styles.compactWeight}>{currentWeight.toFixed(1)} kg</Text>
        ) : startWeight > 0 ? (
          <Text style={styles.compactWeight}>{startWeight.toFixed(1)} kg</Text>
        ) : (
          <Text style={styles.compactNoData}>No data</Text>
        )}
        
        {/* Show weight source indicator */}
        {currentWeight === 0 && startWeight > 0 && (
          <Text style={styles.compactSource}>from onboarding</Text>
        )}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={[styles.container, standalone && styles.standaloneContainer]}>
      {standalone && (
        <View style={styles.standaloneHeader}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.standaloneTitle}>Weight Tracker</Text>
          <View style={styles.placeholder} />
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.title}>Weight Tracker</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.syncButton}
            onPress={syncWeightFromHealthKit}
          >
            <Text style={styles.syncButtonText}>Sync</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddWeight}
          >
            <Plus size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {weightLogs.length > 0 ? (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{displayWeight.toFixed(1)}</Text>
              <Text style={styles.statLabel}>
                {weightSource === 'HealthKit' ? 'Current (kg)' : 'Weight (kg)'}
              </Text>
              {weightSource === 'Onboarding' && (
                <Text style={styles.weightSource}>from onboarding</Text>
              )}
            </View>
            
            {/* Show target weight from onboarding */}
            {targetWeight > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{targetWeight.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Target (kg)</Text>
              </View>
            )}
            
            {/* Show smart progress stats */}
            {smartProgress.kgToGo > 0 && (
              <View style={styles.statItem}>
                <Text style={[
                  styles.statValue,
                  smartProgress.direction === 'down' ? styles.weightLoss : 
                  smartProgress.direction === 'up' ? styles.weightGain : styles.weightMaintain
                ]}>
                  {smartProgress.kgToGo.toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>To go (kg)</Text>
              </View>
            )}
          </View>
          
          {/* Smart Progress Section */}
          {smartProgress.percentToGoal > 0 && (
            <View style={styles.smartProgressContainer}>
              <View style={styles.smartProgressHeader}>
                <Text style={styles.smartProgressTitle}>
                  {smartProgress.direction === 'down' ? 'Weight Loss' : 
                   smartProgress.direction === 'up' ? 'Weight Gain' : 'Weight Maintenance'} Progress
                </Text>
                <Text style={styles.smartProgressPercent}>
                  {Math.round(smartProgress.percentToGoal)}%
                </Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(100, smartProgress.percentToGoal)}%` }
                  ]}
                />
              </View>
              
              <View style={styles.smartProgressFooter}>
                <Text style={styles.smartProgressText}>
                  {smartProgress.kgToGo > 0 
                    ? `${smartProgress.kgToGo.toFixed(1)} kg to go`
                    : 'Goal reached! 🎉'
                  }
                </Text>
                
                {smartProgress.onTrack && (
                  <Text style={styles.onTrackBadge}>On Track 🎯</Text>
                )}
              </View>
            </View>
          )}
          
          {/* Enhanced Progress Section for Weight Tracker Screen */}
          {targetWeight > 0 && (
            <View style={styles.enhancedProgressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progress to Goal</Text>
                <Text style={styles.progressPercentage}>
                  {Math.round(smartProgress.percentToGoal)}%
                </Text>
              </View>
              
              <View style={styles.progressBarLarge}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: `${Math.min(100, smartProgress.percentToGoal)}%`,
                      backgroundColor: smartProgress.direction === 'down' ? '#22C55E' : 
                                   smartProgress.direction === 'up' ? '#3B82F6' : '#6B7280'
                    }
                  ]}
                />
              </View>
              
              <View style={styles.progressDetails}>
                <View style={styles.progressDetailItem}>
                  <Text style={styles.progressDetailLabel}>Starting Weight</Text>
                  <Text style={styles.progressDetailValue}>{startWeight.toFixed(1)} kg</Text>
                </View>
                
                <View style={styles.progressDetailItem}>
                  <Text style={styles.progressDetailLabel}>Current Weight</Text>
                  <Text style={styles.progressDetailValue}>{displayWeight.toFixed(1)} kg</Text>
                </View>
                
                <View style={styles.progressDetailItem}>
                  <Text style={styles.progressDetailLabel}>Target Weight</Text>
                  <Text style={styles.progressDetailValue}>{targetWeight.toFixed(1)} kg</Text>
                </View>
                
                <View style={styles.progressDetailItem}>
                  <Text style={styles.progressDetailLabel}>Remaining</Text>
                  <Text style={[
                    styles.progressDetailValue,
                    { color: smartProgress.direction === 'down' ? '#22C55E' : 
                             smartProgress.direction === 'up' ? '#3B82F6' : '#6B7280' }
                  ]}>
                    {smartProgress.kgToGo.toFixed(1)} kg
                  </Text>
                </View>
              </View>
              
              {smartProgress.onTrack && (
                <View style={styles.onTrackContainer}>
                  <Text style={styles.onTrackText}>On Track! 🎯</Text>
                  <Text style={styles.onTrackSubtext}>Keep up the great work!</Text>
                </View>
              )}
            </View>
          )}
          
          {weights.length > 1 && (
            <View style={styles.chartContainer}>
              <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
                <Path
                  d={generatePath()}
                  stroke={colors.primary}
                  strokeWidth="2"
                  fill="none"
                />
                {points.map((point, index) => (
                  <Circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill={colors.primary}
                  />
                ))}
              </Svg>
              
              <View style={styles.chartLabels}>
                <Text style={styles.chartLabel}>
                  {weights.length > 0 ? weights[weights.length - 1].toFixed(1) : "0"} kg
                </Text>
                <Text style={styles.chartLabel}>
                  {weights.length > 0 ? weights[0].toFixed(1) : "0"} kg
                </Text>
              </View>
            </View>
          )}
          
          {/* Original progress section for backward compatibility */}
          {standalone && healthProgress.targetWeight > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progress to Goal</Text>
                <Text style={styles.progressPercent}>
                  {Math.round(healthProgress.percentComplete)}%
                </Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar,
                    { width: `${healthProgress.percentComplete}%` }
                  ]}
                />
              </View>
              
              {healthProgress.remainingWeight > 0 && (
                <Text style={styles.remainingText}>
                  {healthProgress.remainingWeight.toFixed(1)} kg to go
                </Text>
              )}
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No weight data</Text>
          <Text style={styles.emptySubtext}>
            Tap the + button to log your weight
          </Text>
          
          {/* Show onboarding weight if available */}
          {startWeight > 0 && (
            <View style={styles.onboardingWeightContainer}>
              <Text style={styles.onboardingWeightLabel}>Your starting weight:</Text>
              <Text style={styles.onboardingWeightValue}>{startWeight.toFixed(1)} kg</Text>
            </View>
          )}
          
          {/* Show target weight if available */}
          {targetWeight > 0 && (
            <View style={styles.targetWeightContainer}>
              <Text style={styles.targetWeightLabel}>Your target weight:</Text>
              <Text style={styles.targetWeightValue}>{targetWeight.toFixed(1)} kg</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  standaloneContainer: {
    marginBottom: 24,
  },
  standaloneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  standaloneTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#22c55e",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  weightLoss: {
    color: colors.secondary,
  },
  weightGain: {
    color: colors.error,
  },
  chartContainer: {
    marginBottom: 16,
  },
  chart: {
    backgroundColor: "transparent",
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  compactContainer: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  compactWeight: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  compactNoData: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  compactSource: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  recentLogsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  recentLogsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  recentLogItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentLogInfo: {
    flex: 1,
  },
  recentLogWeight: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  recentLogDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteLogButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  // New styles for smart progress tracking
  smartProgressContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.1)',
  },
  smartProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  smartProgressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  smartProgressPercent: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  smartProgressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  smartProgressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  onTrackBadge: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.secondary,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  onTrackText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.secondary,
    marginTop: 2,
  },
  weightMaintain: {
    color: colors.primary,
  },
  weightSource: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  onboardingWeightContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.1)',
  },
  onboardingWeightLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  onboardingWeightValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  targetWeightContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.1)',
  },
  targetWeightLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  targetWeightValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  enhancedProgressContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(107, 114, 128, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.1)',
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  progressBarLarge: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  progressDetailItem: {
    alignItems: "center",
  },
  progressDetailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  progressDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  onTrackContainer: {
    alignItems: "center",
  },
  onTrackText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.secondary,
    marginTop: 4,
  },
  onTrackSubtext: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
});