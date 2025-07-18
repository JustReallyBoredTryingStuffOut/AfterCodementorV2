import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Shield, Heart, TrendingUp, X } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

interface JourneyConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const JourneyConsentModal: React.FC<JourneyConsentModalProps> = ({
  visible,
  onAccept,
  onDecline
}) => {
  if (!visible) return null;

  const handleAccept = () => {
    Alert.alert(
      'Journey Feature Enabled',
      'Your virtual journey through Norway has been activated. Your step count will now contribute to your progress along the route from Lindesnes to Nordkapp.',
      [
        {
          text: 'Get Started',
          onPress: onAccept
        }
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Feature Disabled',
      'The journey feature has been disabled. You can enable it later in settings if you change your mind.',
      [
        {
          text: 'OK',
          onPress: onDecline
        }
      ]
    );
  };

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <MapPin size={32} color="#FFFFFF" />
          <Text style={styles.title}>Virtual Journey Through Norway</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What is this feature?</Text>
            <Text style={styles.description}>
              Embark on a virtual journey through Norway's most breathtaking landscapes, 
              from the southernmost point at Lindesnes to the northernmost reaches of Nordkapp. 
              Every step you take in real life translates to progress along this scenic route.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How it works</Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <TrendingUp size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>
                  Your daily step count is converted to distance traveled
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MapPin size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>
                  Unlock virtual landmarks as you progress through Norway
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Heart size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>
                  Earn achievements and track your fitness journey
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Data</Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Shield size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>
                  This feature does NOT track your actual location
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Shield size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>
                  Only your step count from HealthKit is used
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Shield size={20} color="#FFFFFF" />
                <Text style={styles.featureText}>
                  All data is stored locally on your device
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Important Notes</Text>
            <Text style={styles.description}>
              • This is a gamified fitness feature, not a navigation tool{'\n'}
              • Your virtual position is calculated based on step count{'\n'}
              • No real-time location tracking is involved{'\n'}
              • You can disable this feature at any time in settings
            </Text>
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.declineButton]} 
            onPress={handleDecline}
          >
            <X size={20} color={colors.text} />
            <Text style={[styles.buttonText, styles.declineText]}>Not Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.acceptButton]} 
            onPress={handleAccept}
          >
            <MapPin size={20} color="#FFFFFF" />
            <Text style={[styles.buttonText, styles.acceptText]}>Start Journey</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#FFFFFF',
    lineHeight: 22,
    opacity: 0.9,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  declineButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  acceptButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  declineText: {
    color: '#FFFFFF',
  },
  acceptText: {
    color: colors.primary,
  },
}); 