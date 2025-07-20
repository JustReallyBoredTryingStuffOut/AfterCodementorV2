import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/constants/colors';
import { X } from 'lucide-react-native';

interface GdprConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function GdprConsentModal({ onAccept, onDecline }: GdprConsentModalProps) {
  const [visible, setVisible] = useState(false);
  const { theme, colorScheme } = useThemeStore();
  const currentTheme = theme === "system" ? "light" : theme;
  const colors = getColors(currentTheme, colorScheme);

  useEffect(() => {
    checkConsentStatus();
  }, []);

  const checkConsentStatus = async () => {
    try {
      const consentGiven = await AsyncStorage.getItem('gdpr-consent');
      if (consentGiven === null) {
        setVisible(true);
      }
    } catch (error) {
      console.error('Error checking consent status:', error);
      setVisible(true); // Show consent dialog on error to be safe
    }
  };

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem('gdpr-consent', 'true');
      setVisible(false);
      onAccept();
    } catch (error) {
      console.error('Error saving consent:', error);
    }
  };

  const handleDecline = async () => {
    try {
      await AsyncStorage.setItem('gdpr-consent', 'false');
      setVisible(false);
      onDecline();
    } catch (error) {
      console.error('Error saving consent rejection:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Privacy & Data Protection</Text>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: colors.background }]}
              onPress={handleDecline}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              How We Use Your Data
            </Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              This app collects and processes personal data to provide you with a personalized fitness experience. 
              We take your privacy seriously and want to be transparent about how we handle your information.
            </Text>
            
            <Text style={[styles.subtitle, { color: colors.text }]}>
              Data We Collect
            </Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              • Profile information (name, age, weight, height){'\n'}
              • Workout and exercise data{'\n'}
              • Nutrition and meal information{'\n'}
              • Health metrics (steps, weight logs){'\n'}
              • Photos you choose to upload{'\n'}
              • App usage information
            </Text>
            
            <Text style={[styles.subtitle, { color: colors.text }]}>
              How We Protect Your Data
            </Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              • All sensitive data is encrypted{'\n'}
              • Your data is stored locally on your device{'\n'}
              • We do not share your personal data with third parties{'\n'}
              • You can export or delete your data at any time
            </Text>
            
            <Text style={[styles.subtitle, { color: colors.text }]}>
              Your Rights
            </Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              Under GDPR and other privacy regulations, you have the right to:{'\n'}
              • Access your personal data{'\n'}
              • Correct inaccurate data{'\n'}
              • Delete your data{'\n'}
              • Export your data{'\n'}
              • Withdraw consent at any time
            </Text>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton, { borderColor: colors.error }]}
              onPress={handleDecline}
            >
              <Text style={[styles.buttonText, { color: colors.error }]}>Decline</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.acceptButton, { backgroundColor: colors.primary }]}
              onPress={handleAccept}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>Accept</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              setVisible(false);
              // Navigate to privacy policy
              // This would typically use navigation, but we're just reopening the modal after
              setTimeout(() => setVisible(true), 500);
            }}
          >
            <Text style={[styles.link, { color: colors.primary }]}>
              Read Full Privacy Policy
            </Text>
          </TouchableOpacity>
          
          {/* Added CLOSE button */}
          <TouchableOpacity
            style={[styles.closeModalButton, { borderColor: colors.border }]}
            onPress={handleDecline}
          >
            <Text style={[styles.closeModalText, { color: colors.textSecondary }]}>
              CLOSE
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalView: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    maxHeight: 350,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  acceptButton: {
    elevation: 2,
  },
  declineButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  linkButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  link: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  closeModalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  closeModalText: {
    fontSize: 16,
    fontWeight: '600',
  },
});