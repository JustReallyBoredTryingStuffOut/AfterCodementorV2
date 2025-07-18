import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, Text, TouchableOpacity, Alert } from 'react-native';
import { JourneyMap } from '../../components/JourneyMap';
import { JourneyConsentModal } from '../../components/JourneyConsentModal';
import { useJourneyStore } from '../../store/journeyStore';
import { colors } from '../../constants/colors';
import { MapPin } from 'lucide-react-native';

// Default progress for comparison
const defaultProgress = {
  totalSteps: 0,
  totalDistance: 0,
  currentLocation: { latitude: 57.9833, longitude: 7.0500 },
  distanceTraveled: 0,
  progressPercentage: 0,
  journeyStarted: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  isStarted: false
};

export default function JourneyScreen() {
  const { settings, progress, initializeJourney, startJourney, toggleJourney } = useJourneyStore();
  const [showConsent, setShowConsent] = useState(false);
  const [hasShownConsent, setHasShownConsent] = useState(false);

  // Debug logging
  console.log('Journey Screen - Settings:', settings);
  console.log('Journey Screen - Progress:', progress);
  console.log('Journey Screen - Total Steps:', progress.totalSteps);
  console.log('Journey Screen - Distance Traveled:', progress.distanceTraveled);
  console.log('Journey Screen - Is Started:', progress.isStarted);
  console.log('Journey Screen - Should show start screen:', settings.enabled && !progress.isStarted);
  console.log('Journey Screen - Should show map:', settings.enabled && progress.isStarted);

  useEffect(() => {
    // Only show consent modal if journey is enabled but consent hasn't been shown yet
    if (settings.enabled && !hasShownConsent) {
      setShowConsent(true);
      setHasShownConsent(true);
    } else if (settings.enabled) {
      initializeJourney();
    }
  }, [settings.enabled, hasShownConsent]);

  // Monitor progress changes
  useEffect(() => {
    console.log('Progress changed:', progress);
  }, [progress]);

  const handleAcceptJourney = () => {
    setShowConsent(false);
    initializeJourney();
  };

  const handleDeclineJourney = () => {
    toggleJourney(false);
    setShowConsent(false);
    setHasShownConsent(false);
  };

  const handleStartJourney = () => {
    console.log('Button pressed - Starting journey...');
    console.log('Current settings.enabled:', settings.enabled);
    console.log('Current progress:', progress);
    
    if (!settings.enabled) {
      Alert.alert('Journey Disabled', 'Please enable the journey feature in Profile Settings first.');
      return;
    }
    
    startJourney();
    Alert.alert('Journey Started!', 'Your virtual journey through Norway has begun!');
  };


  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {!settings.enabled ? (
        <View style={styles.disabledContainer}>
          <MapPin size={64} color={colors.primary} />
          <Text style={styles.disabledTitle}>Journey Feature Disabled</Text>
          <Text style={styles.disabledDescription}>
            Enable the virtual journey feature in Profile Settings to start your adventure through Norway.
          </Text>
        </View>
      ) : settings.enabled && !progress.isStarted ? (
        <View style={styles.startJourneyContainer}>
          <MapPin size={64} color={colors.primary} />
          <Text style={styles.startJourneyTitle}>Ready to Start Your Journey?</Text>
          <Text style={styles.startJourneyDescription}>
            Begin your virtual adventure through Norway from Lindesnes to Nordkapp. Your steps will be tracked from the moment you start.
          </Text>
          <TouchableOpacity 
            style={styles.startJourneyButton}
            onPress={handleStartJourney}
          >
            <Text style={styles.startJourneyButtonText}>Start Journey</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <JourneyMap />
      )}
      
      <JourneyConsentModal
        visible={showConsent}
        onAccept={handleAcceptJourney}
        onDecline={handleDeclineJourney}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  disabledTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  disabledDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  startJourneyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  startJourneyTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  startJourneyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startJourneyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startJourneyButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
}); 