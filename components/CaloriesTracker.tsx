import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from "react-native";
import { Flame, RefreshCw, Zap, Watch, AlertTriangle } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useHealthStore } from "@/store/healthStore";
import HealthKitService from "@/src/services/HealthKitService";
import { HEALTH_DATA_TYPES } from "@/types/health";

type CaloriesTrackerProps = {
  compact?: boolean;
};

export default function CaloriesTracker({ compact = false }: CaloriesTrackerProps) {
  const { healthGoals, isAppleWatchConnected } = useHealthStore();
  const [currentCalories, setCurrentCalories] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataSource, setDataSource] = useState<string>("unknown");
  const [error, setError] = useState<string | null>(null);
  
  // Calculate progress percentage (assuming 500 calories as daily goal)
  const dailyCalorieGoal = 500; // This could be made configurable
  const progressPercentage = Math.min(100, (currentCalories / dailyCalorieGoal) * 100);
  
  // Sync calories from HealthKit
  const syncCaloriesFromHealthKit = async () => {
    if (Platform.OS !== 'ios') {
      setError("Calories tracking is only available on iOS");
      return;
    }
    
    setIsSyncing(true);
    setError(null);
    
    try {
      // Initialize HealthKit service first
      await HealthKitService.initialize();
      
      // Check if HealthKit is available
      const isAvailable = await HealthKitService.isHealthDataAvailable();
      
      if (!isAvailable) {
        setError("HealthKit not available on this device");
        setDataSource("unknown");
        return;
      }
      
      // Request authorization for active energy burned (calories)
      const authResult = await HealthKitService.requestAuthorization([HEALTH_DATA_TYPES.ACTIVE_ENERGY_BURNED]);
      
      if (!authResult) {
        setError("Calories access denied. Please enable Health permissions in Settings.");
        setDataSource("unknown");
        return;
      }
      
      // Get today's active calories
      const calories = await HealthKitService.getTodayActiveCalories();
      
      if (calories >= 0) {
        setCurrentCalories(calories);
        setDataSource("healthKit");
        setError(null);
      } else {
        setCurrentCalories(0);
        setDataSource("healthKit");
        setError("No calories data found for today");
      }
      
    } catch (error: any) {
      console.error("Error syncing calories from HealthKit:", error);
      setError(`Failed to sync calories: ${error.message || 'Unknown error'}`);
      setDataSource("unknown");
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Sync calories on component mount
  useEffect(() => {
    syncCaloriesFromHealthKit();
  }, []);
  
  const handleSync = async () => {
    await syncCaloriesFromHealthKit();
  };
  
  // Get data source display name
  const getDataSourceName = () => {
    if (dataSource === "healthKit") return "Apple Health";
    if (dataSource === "appleWatch") return "Apple Watch";
    return "Unknown";
  };
  
  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <Text style={styles.notAvailableText}>
          Calories tracking is not available on web
        </Text>
      </View>
    );
  }
  
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactContent}>
          <Flame size={20} color={colors.primary} />
          <Text style={styles.compactCalories}>
            {(dataSource === 'healthKit' && currentCalories === 0) ? 'No data' : currentCalories.toLocaleString()}
          </Text>
          <Text style={styles.compactLabel}>calories</Text>
          
          {dataSource !== "unknown" && (
            <View style={styles.compactDeviceContainer}>
              {dataSource === "healthKit" ? (
                <Zap size={14} color={colors.textSecondary} />
              ) : dataSource === "appleWatch" ? (
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
            {Math.round(progressPercentage)}% of {dailyCalorieGoal.toLocaleString()}
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calories Burned</Text>
        <View style={styles.headerButtons}>
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
        </View>
      </View>
      
      <View style={styles.caloriesContainer}>
        <Text style={styles.caloriesCount}>
          {(dataSource === 'healthKit' && currentCalories === 0) ? 'No data' : currentCalories.toLocaleString()}
        </Text>
        <Text style={styles.caloriesLabel}>calories burned today</Text>
        
        {dataSource === "healthKit" && (
          <View style={styles.dataSourceContainer}>
            <Zap size={16} color={colors.primary} />
            <Text style={styles.dataSourceText}>
              Data from Apple Health
            </Text>
          </View>
        )}
        
        {dataSource === "appleWatch" && (
          <View style={styles.deviceContainer}>
            <Watch size={16} color={colors.textSecondary} />
            <Text style={styles.deviceText}>
              Data from Apple Watch
            </Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorInfoContainer}>
            <AlertTriangle size={14} color={colors.warning} />
            <Text style={styles.errorInfoText}>
              {error}
            </Text>
          </View>
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
        <Text style={styles.progressText}>
          {Math.round(progressPercentage)}% of daily goal ({dailyCalorieGoal.toLocaleString()} calories)
        </Text>
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
  notAvailableText: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 14,
  },
  compactContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  compactCalories: {
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
  },
  syncButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
  },
  caloriesContainer: {
    marginBottom: 16,
  },
  caloriesCount: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  caloriesLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  dataSourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  dataSourceText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  deviceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  deviceText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  errorInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  errorInfoText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});