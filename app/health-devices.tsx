import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform, ActivityIndicator } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Smartphone, Watch, RefreshCw, Plus, ChevronRight, ArrowLeft, Zap, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useHealthStore } from "@/store/healthStore";
import { HealthDevice } from "@/types";
import Button from "@/components/Button";
import AppleWatchService from "@/src/NativeModules/AppleWatch";

export default function HealthDevicesScreen() {
  const router = useRouter();
  const { 
    connectedDevices, 
    addDevice, 
    updateDevice, 
    removeDevice,
    importDataFromDevice,
    getLastSyncTimeForDevice,
    getDeviceSyncHistory,
    isAppleWatchConnected,
    setIsAppleWatchConnected
  } = useHealthStore();
  
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [isCheckingAppleWatch, setIsCheckingAppleWatch] = useState(true);
  
  // Check Apple Watch connection status
  useEffect(() => {
    const checkAppleWatchConnection = async () => {
      if (Platform.OS === 'ios') {
        try {
          const isReachable = await AppleWatchService.isAppleWatchReachable();
          setIsAppleWatchConnected(isReachable);
        } catch (error) {
          console.log('Apple Watch not available:', error);
          setIsAppleWatchConnected(false);
        }
      }
      setIsCheckingAppleWatch(false);
    };
    
    checkAppleWatchConnection();
    
    // Listen for Apple Watch connection changes
    let subscription;
    try {
      subscription = AppleWatchService.addListener('appleWatchStatusChanged', (status) => {
        setIsAppleWatchConnected(status.isReachable);
      });
    } catch (error) {
      console.log('Apple Watch event listener not available:', error);
    }
    
    return () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  }, [setIsAppleWatchConnected]);
  
  const handleScanDevices = async () => {
    Alert.alert(
      "Device Scanning",
      "Device scanning functionality has been removed. This app now focuses on HealthKit integration for iOS and Google Fit for Android.",
      [{ text: "OK" }]
    );
  };
  
  const handleConnectDevice = async (device: any) => {
    Alert.alert(
      "Device Connection",
      "Device connection functionality has been removed. This app now focuses on HealthKit integration for iOS and Google Fit for Android.",
      [{ text: "OK" }]
    );
  };
  
  const handleSyncDevice = async (deviceId: string) => {
    setIsSyncing(prev => ({ ...prev, [deviceId]: true }));
    
    try {
      // Get the device
      const device = connectedDevices.find(d => d.id === deviceId);
      
      if (!device) {
        throw new Error("Device not found");
      }
      
      // Show a syncing dialog
      Alert.alert(
        "Syncing",
        `Syncing data from ${device.name}...`,
        []
      );
      
      // In a real app, this would use HealthKit or Google Fit APIs
      // to import data from the connected device
      
      // Import all data types from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const success = await importDataFromDevice(
        deviceId,
        "all",
        sevenDaysAgo.toISOString(),
        new Date().toISOString()
      );
      
      if (success) {
        Alert.alert(
          "Sync Complete",
          "Your health data has been successfully synced.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Sync Failed",
          "There was an error syncing your health data. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error syncing device:", error);
      Alert.alert(
        "Sync Error",
        "An unexpected error occurred while syncing your device.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSyncing(prev => ({ ...prev, [deviceId]: false }));
    }
  };
  
  const toggleDeviceConnection = async (device: HealthDevice) => {
    Alert.alert(
      "Device Connection",
      "Device connection functionality has been removed. This app now focuses on HealthKit integration for iOS and Google Fit for Android.",
      [{ text: "OK" }]
    );
  };
  
  const handleRemoveDevice = (deviceId: string) => {
    Alert.alert(
      "Remove Device",
      "Are you sure you want to remove this device? Your synced data will remain, but you won't receive new data from this device.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          onPress: () => {
            // Remove the device from the store
            removeDevice(deviceId);
          },
          style: "destructive",
        },
      ]
    );
  };
  
  const handleGoBack = () => {
    router.navigate("/(tabs)");
  };
  
  const getDeviceCapabilities = (deviceType: string): string[] => {
    switch (deviceType) {
      case "appleWatch":
        return ["steps", "heartRate", "workouts", "sleep", "standHours", "bloodOxygen"];
      case "fitbit":
        return ["steps", "heartRate", "workouts", "sleep"];
      case "garmin":
        return ["steps", "heartRate", "workouts", "sleep", "stress"];
      case "samsung":
        return ["steps", "heartRate", "workouts", "sleep", "stress"];
      case "whoop":
        return ["heartRate", "sleep", "recovery", "strain"];
      case "xiaomi":
        return ["steps", "heartRate", "sleep"];
      default:
        return ["steps"];
    }
  };
  
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "appleWatch":
        return <Watch size={24} color={colors.primary} />;
      case "fitbit":
        return <Watch size={24} color="#00B0B9" />;
      case "garmin":
        return <Watch size={24} color="#006CC1" />;
      case "samsung":
        return <Watch size={24} color="#1428A0" />;
      case "whoop":
        return <Watch size={24} color="#00A550" />;
      case "xiaomi":
        return <Watch size={24} color="#FF6700" />;
      default:
        return <Smartphone size={24} color={colors.primary} />;
    }
  };
  
  const getLastSyncText = (device: HealthDevice) => {
    if (!device.lastSynced) return "Never synced";
    
    const lastSyncTime = new Date(device.lastSynced);
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };
  
  // Helper function to determine device type from name
  const getDeviceType = (deviceName: string): string => {
    const name = deviceName.toLowerCase();
    if (name.includes("apple") || name.includes("watch")) return "appleWatch";
    if (name.includes("fitbit")) return "fitbit";
    if (name.includes("garmin")) return "garmin";
    if (name.includes("samsung") || name.includes("galaxy")) return "samsung";
    if (name.includes("whoop")) return "whoop";
    if (name.includes("xiaomi") || name.includes("mi band")) return "xiaomi";
    return "unknown";
  };
  
  // Helper function to determine device model from name
  const getDeviceModel = (deviceName: string): string => {
    const name = deviceName.toLowerCase();
    
    if (name.includes("apple") || name.includes("watch")) {
      if (name.includes("series 7")) return "Series 7";
      if (name.includes("series 8")) return "Series 8";
      if (name.includes("ultra")) return "Ultra";
      return "Apple Watch";
    }
    
    if (name.includes("fitbit")) {
      if (name.includes("charge")) return "Charge";
      if (name.includes("versa")) return "Versa";
      if (name.includes("sense")) return "Sense";
      return "Fitbit";
    }
    
    if (name.includes("garmin")) {
      if (name.includes("fenix")) return "Fenix";
      if (name.includes("vivoactive")) return "Vivoactive";
      if (name.includes("forerunner")) return "Forerunner";
      return "Garmin";
    }
    
    if (name.includes("samsung") || name.includes("galaxy")) {
      if (name.includes("watch")) return "Galaxy Watch";
      return "Samsung";
    }
    
    if (name.includes("whoop")) {
      return "Whoop";
    }
    
    if (name.includes("xiaomi") || name.includes("mi band")) {
      return "Mi Band";
    }
    
    return "Unknown Model";
  };
  
  return (
    <View style={styles.mainContainer}>
      <Stack.Screen 
        options={{
          title: "Health Devices",
          headerBackTitle: "Health",
          headerLeft: () => (
            <TouchableOpacity onPress={handleGoBack} style={styles.headerBackButton}>
              <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Connected Devices</Text>
          <Text style={styles.subtitle}>Manage your health tracking devices and sync data</Text>
        </View>
        
        {/* HealthKit Integration Info */}
        <View style={[styles.bluetoothStatusBanner, { backgroundColor: "rgba(76, 217, 100, 0.1)" }]}>
          <View style={styles.bluetoothStatusContent}>
            <CheckCircle2 size={20} color="#4CD964" />
            <Text style={[styles.bluetoothStatusText, { color: "#4CD964" }]}>
              {Platform.OS === 'ios' 
                ? "Apple Health integration is available"
                : "Google Fit integration is available"
              }
            </Text>
          </View>
        </View>
        
        {connectedDevices.length > 0 ? (
          <View style={styles.devicesContainer}>
            {connectedDevices.map((device) => (
              <View key={device.id} style={styles.deviceCard}>
                <View style={styles.deviceInfo}>
                  <View style={[
                    styles.deviceIconContainer, 
                    device.type === "fitbit" ? { backgroundColor: "rgba(0, 176, 185, 0.1)" } :
                    device.type === "garmin" ? { backgroundColor: "rgba(0, 108, 193, 0.1)" } :
                    device.type === "samsung" ? { backgroundColor: "rgba(20, 40, 160, 0.1)" } :
                    device.type === "whoop" ? { backgroundColor: "rgba(0, 165, 80, 0.1)" } :
                    device.type === "xiaomi" ? { backgroundColor: "rgba(255, 103, 0, 0.1)" } :
                    { backgroundColor: "rgba(74, 144, 226, 0.1)" }
                  ]}>
                    {getDeviceIcon(device.type)}
                  </View>
                  
                  <View style={styles.deviceDetails}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceStatus}>
                      {device.connected ? "Connected" : "Disconnected"}
                      {device.connected && device.lastSynced && (
                        ` • Last synced: ${getLastSyncText(device)}`
                      )}
                    </Text>
                    
                    {device.batteryLevel !== undefined && (
                      <View style={styles.batteryContainer}>
                        <View style={styles.batteryBar}>
                          <View 
                            style={[
                              styles.batteryLevel, 
                              { 
                                width: `${device.batteryLevel}%`,
                                backgroundColor: device.batteryLevel > 20 ? "#4CD964" : "#FF3B30"
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.batteryText}>{device.batteryLevel}%</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.deviceActions}>
                  <Switch
                    trackColor={{ false: colors.inactive, true: colors.primary }}
                    thumbColor="#FFFFFF"
                    value={device.connected}
                    onValueChange={() => toggleDeviceConnection(device)}
                  />
                  
                  {device.connected && (
                    <TouchableOpacity
                      style={styles.syncButton}
                      onPress={() => handleSyncDevice(device.id)}
                      disabled={isSyncing[device.id]}
                    >
                      {isSyncing[device.id] ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <>
                          <RefreshCw size={16} color={colors.primary} />
                          <Text style={styles.syncText}>Sync</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveDevice(device.id)}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
                
                {device.capabilities && device.capabilities.length > 0 && (
                  <View style={styles.capabilitiesContainer}>
                    <Text style={styles.capabilitiesTitle}>Data Types</Text>
                    <View style={styles.capabilitiesList}>
                      {device.capabilities.map((capability: string) => (
                        <View key={capability} style={styles.capabilityTag}>
                          <Text style={styles.capabilityText}>{capability}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              {isCheckingAppleWatch ? (
                <ActivityIndicator size={40} color={colors.primary} />
              ) : isAppleWatchConnected ? (
                <Watch size={40} color={colors.primary} />
              ) : (
                <Watch size={40} color={colors.textLight} />
              )}
            </View>
            <Text style={styles.emptyTitle}>
              {isCheckingAppleWatch 
                ? "Checking Apple Watch..." 
                : isAppleWatchConnected 
                  ? "Apple Watch Connected" 
                  : "No Devices Connected"
              }
            </Text>
            <Text style={styles.emptyText}>
              {isCheckingAppleWatch 
                ? "Detecting your Apple Watch connection..."
                : isAppleWatchConnected 
                  ? "Your Apple Watch is connected and syncing data automatically. You can control workouts and log activities directly from your watch."
                  : "Connect your smartwatch or fitness tracker to automatically sync your health data"
              }
            </Text>
            {isAppleWatchConnected && (
              <View style={styles.appleWatchStatus}>
                <CheckCircle2 size={16} color={colors.success} />
                <Text style={styles.appleWatchStatusText}>Connected via WatchConnectivity</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Services</Text>
          
          <TouchableOpacity 
            style={styles.serviceItem}
            onPress={async () => {
              if (Platform.OS !== 'ios') {
                Alert.alert(
                  "Apple Health",
                  "Apple Health is only available on iOS devices.",
                  [{ text: "OK" }]
                );
                return;
              }

              try {
                // Show loading alert
                Alert.alert(
                  "Connecting to Apple Health",
                  "Requesting permissions and syncing data...",
                  []
                );

                // Initialize HealthKit and request permissions
                const { syncWeightFromHealthKit, syncStepsFromHealthKit } = useHealthStore.getState();
                
                // Sync weight data
                await syncWeightFromHealthKit();
                
                // Sync step data
                await syncStepsFromHealthKit();
                
                // Show success message
                Alert.alert(
                  "Apple Health Connected",
                  "Successfully connected to Apple Health! Your weight and step data have been synced.",
                  [{ text: "OK" }]
                );
                
              } catch (error) {
                console.error('Error connecting to Apple Health:', error);
                Alert.alert(
                  "Connection Failed",
                  "There was an error connecting to Apple Health. Please check your permissions in the Health app.",
                  [{ text: "OK" }]
                );
              }
            }}
          >
            <View style={styles.serviceInfo}>
              <View style={[styles.serviceIcon, { backgroundColor: "rgba(74, 144, 226, 0.1)" }]}>
                <Zap size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.serviceName}>Apple Health</Text>
                <Text style={styles.serviceDescription}>Sync data with Apple Health</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.serviceItem}
            onPress={() => {
              if (Platform.OS !== 'android') {
                Alert.alert(
                  "Google Fit",
                  "Google Fit is only available on Android devices.",
                  [{ text: "OK" }]
                );
                return;
              }

              Alert.alert(
                "Google Fit",
                "Google Fit integration is not yet implemented. This feature will be available in a future update.",
                [{ text: "OK" }]
              );
            }}
          >
            <View style={styles.serviceInfo}>
              <View style={[styles.serviceIcon, { backgroundColor: "rgba(80, 200, 120, 0.1)" }]}>
                <RefreshCw size={20} color={colors.secondary} />
              </View>
              <View>
                <Text style={styles.serviceName}>Google Fit</Text>
                <Text style={styles.serviceDescription}>Sync data with Google Fit</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Auto-sync when connected</Text>
              <Text style={styles.settingDescription}>Automatically sync data when devices are connected</Text>
            </View>
            <Switch
              trackColor={{ false: colors.inactive, true: colors.primary }}
              thumbColor="#FFFFFF"
              value={true}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Background sync</Text>
              <Text style={styles.settingDescription}>Sync data in the background periodically</Text>
            </View>
            <Switch
              trackColor={{ false: colors.inactive, true: colors.primary }}
              thumbColor="#FFFFFF"
              value={true}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.settingButton}
            onPress={() => {
              Alert.alert(
                "Sync All Devices",
                "This will sync data from all connected devices. Continue?",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Sync", 
                    onPress: () => {
                      // Sync all connected devices
                      connectedDevices.forEach(device => {
                        if (device.connected) {
                          handleSyncDevice(device.id);
                        }
                      });
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.settingButtonText}>Sync All Devices</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            {Platform.OS === 'ios' 
              ? "For Apple Watch, ensure that Health sharing is enabled in the Watch app and your watch is paired with your iPhone. Apple Watch connects automatically via WatchConnectivity."
              : "If you're having trouble connecting your device, make sure Bluetooth is enabled and your device is nearby."
            }
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>View Troubleshooting Guide</Text>
          </TouchableOpacity>
        </View>
        
        {/* Implementation Notes Section */}
        <View style={styles.implementationNotesSection}>
          <Text style={styles.implementationNotesTitle}>Developer Notes</Text>
          <Text style={styles.implementationNotesText}>
            This screen is using a simulated Core Bluetooth implementation. In a production app, you would need to:
          </Text>
          <View style={styles.implementationNotesList}>
            <Text style={styles.implementationNotesItem}>
              • Create a native iOS module using Swift/Objective-C that interfaces with CoreBluetooth framework
            </Text>
            <Text style={styles.implementationNotesItem}>
              • Implement proper permission handling for Bluetooth usage
            </Text>
            <Text style={styles.implementationNotesItem}>
              • Handle device discovery, connection, and data transfer using the CoreBluetooth APIs
            </Text>
            <Text style={styles.implementationNotesItem}>
              • Integrate with HealthKit for syncing health data
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Back button at the bottom */}
      <View style={styles.bottomBackButtonContainer}>
        <TouchableOpacity 
          style={styles.bottomBackButton}
          onPress={handleGoBack}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
          <Text style={styles.bottomBackButtonText}>Back to Health</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 80, // Add extra padding at the bottom for the back button
  },
  header: {
    marginBottom: 24,
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
  bluetoothStatusBanner: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  bluetoothStatusContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bluetoothStatusText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  bluetoothWarning: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  bluetoothWarningText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  bluetoothSettingsButton: {
    backgroundColor: colors.error,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  bluetoothSettingsText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
  },
  scanContainer: {
    marginBottom: 24,
  },
  scanButton: {
    width: "100%",
  },
  errorText: {
    color: colors.error,
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  devicesContainer: {
    marginBottom: 24,
  },
  availableDevicesContainer: {
    marginBottom: 24,
  },
  deviceCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  deviceStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  batteryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  batteryBar: {
    height: 6,
    width: 50,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
    marginRight: 8,
  },
  batteryLevel: {
    height: "100%",
    backgroundColor: "#4CD964",
  },
  batteryText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  signalContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  signalText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
  },
  signalBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 12,
  },
  signalBar: {
    width: 3,
    marginHorizontal: 1,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  deviceActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  syncText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  capabilitiesContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  capabilitiesTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  capabilitiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  capabilityTag: {
    backgroundColor: colors.highlight,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  capabilityText: {
    fontSize: 12,
    color: colors.primary,
  },
  connectButton: {
    alignSelf: "flex-end",
  },
  emptyContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  appleWatchStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "rgba(76, 217, 100, 0.1)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  appleWatchStatusText: {
    fontSize: 12,
    color: "#4CD964",
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  serviceItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  settingItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  settingButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  helpSection: {
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
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  helpButton: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  headerBackButton: {
    padding: 8,
    marginLeft: 8,
  },
  bottomBackButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  bottomBackButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomBackButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  implementationNotesSection: {
    backgroundColor: "rgba(255, 149, 0, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  implementationNotesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF9500",
    marginBottom: 8,
  },
  implementationNotesText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  implementationNotesList: {
    marginLeft: 8,
  },
  implementationNotesItem: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
});