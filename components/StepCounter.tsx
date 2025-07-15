import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from "react-native";
import { Play, Pause, Award, RefreshCw, Watch, AlertTriangle, Zap } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useHealthStore } from "@/store/healthStore";
import useStepCounter from "@/hooks/useStepCounter";

type StepCounterProps = {
  compact?: boolean;
};

export default function StepCounter({ compact = false }: StepCounterProps) {
  const { healthGoals, isAppleWatchConnected } = useHealthStore();
  const { 
    currentStepCount, 
    isPedometerAvailable, 
    isTrackingSteps, 
    error, 
    errorType,
    startTracking, 
    stopTracking,
    manualSync,
    isUsingConnectedDevice,
    deviceName,
    retryPedometerConnection,
    dataSource,
    healthKitAvailable,
    healthKitAuthorized,
    isSyncing
  } = useStepCounter();
  
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Calculate progress percentage
  const progressPercentage = Math.min(100, (currentStepCount / healthGoals.dailySteps) * 100);
  
  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <Text style={styles.notAvailableText}>
          Step counting is not available on web
        </Text>
      </View>
    );
  }
  
  const handleSync = async () => {
    if (!isUsingConnectedDevice && dataSource !== "healthKit") {
      Alert.alert("No Data Source", "No connected device or health data source to sync with");
      return;
    }
    
    await manualSync();
  };
  
  const handleRetry = async () => {
    setIsRetrying(true);
    const success = await retryPedometerConnection();
    setIsRetrying(false);
    
    if (success) {
      Alert.alert("Success", "Step counter connection restored successfully!");
      startTracking();
    } else {
      Alert.alert(
        "Step Counter Unavailable", 
        "Could not connect to the step counter. This may be due to device restrictions or privacy settings.",
        [{ text: "OK" }]
      );
    }
  };
  
  // Get data source display name
  const getDataSourceName = () => {
    if (isUsingConnectedDevice && deviceName) return deviceName;
    if (dataSource === "healthKit") return "Apple Health";
    if (dataSource === "pedometer") return "Device Pedometer";
    return "Unknown";
  };
  
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactContent}>
          <Award size={20} color={colors.primary} />
          <Text style={styles.compactSteps}>{currentStepCount.toLocaleString()}</Text>
          <Text style={styles.compactLabel}>steps</Text>
          
          {dataSource !== "pedometer" && (
            <View style={styles.compactDeviceContainer}>
              {dataSource === "healthKit" ? (
                <Zap size={14} color={colors.textSecondary} />
              ) : isUsingConnectedDevice ? (
                <Watch size={14} color={colors.textSecondary} />
              ) : (
                <AlertTriangle size={14} color={colors.warning} />
              )}
              <Text style={styles.compactDeviceText}>{getDataSourceName()}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.compactProgressContainer}>
          <View style={styles.compactProgressBar}>
            <View 
              style={[
                styles.compactProgressFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.compactGoal}>
            {Math.round(progressPercentage)}% of {healthGoals.dailySteps.toLocaleString()}
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Steps</Text>
        <View style={styles.headerButtons}>
          {(isUsingConnectedDevice || dataSource === "healthKit") && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <RefreshCw size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.trackingButton,
              isTrackingSteps ? styles.trackingActiveButton : {}
            ]}
            onPress={isTrackingSteps ? stopTracking : startTracking}
          >
            {isTrackingSteps ? (
              <Pause size={16} color="#FFFFFF" />
            ) : (
              <Play size={16} color="#FFFFFF" />
            )}
            <Text style={styles.trackingButtonText}>
              {isTrackingSteps ? "Pause" : "Track"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsCount}>
          {currentStepCount.toLocaleString()}
        </Text>
        <Text style={styles.stepsLabel}>steps today</Text>
        

        
        {dataSource === "healthKit" && (
          <View style={styles.dataSourceContainer}>
            <Zap size={16} color={colors.primary} />
            <Text style={styles.dataSourceText}>
              Data from Apple Health
            </Text>
          </View>
        )}
        
        {isUsingConnectedDevice && (
          <View style={styles.deviceContainer}>
            <Watch size={16} color={colors.textSecondary} />
            <Text style={styles.deviceText}>
              Data from {deviceName}
            </Text>
          </View>
        )}
        
        {error && (
          <TouchableOpacity 
            style={styles.errorInfoContainer}
            onPress={handleRetry}
          >
            <AlertTriangle size={14} color={colors.warning} />
            <Text style={styles.errorInfoText}>
              {error.includes("CMErrorDomain") || error.includes("cmerrordomain") 
                ? "Pedometer unavailable. Tap to retry." 
                : "Pedometer error. Tap to retry."}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            {Math.round(progressPercentage)}% of daily goal
          </Text>
          <Text style={styles.goalText}>
            Goal: {healthGoals.dailySteps.toLocaleString()} steps
          </Text>
        </View>
      </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  trackingButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  trackingActiveButton: {
    backgroundColor: colors.warning,
  },
  trackingButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
    marginLeft: 4,
  },
  syncButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.highlight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  stepsContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  stepsCount: {
    fontSize: 40,
    fontWeight: "700",
    color: colors.text,
  },
  stepsLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  deviceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: colors.highlight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  deviceText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  dataSourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "rgba(76, 217, 100, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  dataSourceText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
  },

  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  goalText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    alignItems: "center",
    padding: 16,
  },
  errorIcon: {
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
    marginBottom: 16,
  },
  errorActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    marginLeft: 4,
  },

  notAvailableText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    padding: 16,
  },
  compactContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  compactSteps: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 8,
    marginRight: 4,
  },
  compactLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  compactDeviceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: colors.highlight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  compactDeviceText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 2,
  },

  compactProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginRight: 8,
    overflow: "hidden",
  },
  compactProgressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  compactGoal: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "rgba(255, 149, 0, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  errorInfoText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 4,
  },
  healthKitStatusContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 8,
  },
  healthKitStatusContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  healthKitStatusText: {
    fontSize: 14,
    marginLeft: 8,
  },
  healthKitStatusRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    gap: 8,
  },
  healthKitStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  healthKitStatusBadgeText: {
    fontSize: 10,
    marginLeft: 4,
  },
});