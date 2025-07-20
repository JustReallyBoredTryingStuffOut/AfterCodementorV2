import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { getColors } from '@/constants/colors';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from "lucide-react-native";

export default function TermsOfService() {
  const router = useRouter();
  const { theme, colorScheme } = useThemeStore();
  const currentTheme = theme === "system" ? "light" : theme;
  const colors = getColors(currentTheme, colorScheme);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: "Terms of Service",
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleGoBack} 
              style={styles.backButton}
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }} 
      />
      
      {/* Additional back button at the top of content for visibility */}
      <TouchableOpacity 
        onPress={handleGoBack} 
        style={[styles.visibleBackButton, { backgroundColor: colors.card }]}
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={20} color={colors.primary} />
        <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Terms of Service</Text>
          <Text style={[styles.date, { color: colors.text }]}>Last Updated: May 31, 2025</Text>
          
          <Text style={[styles.section, { color: colors.text }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            By accessing or using our fitness app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our app.
          </Text>
          
          <Text style={[styles.section, { color: colors.text }]}>2. Description of Service</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Our fitness app provides tools for tracking workouts, nutrition, and health metrics. The app may include features such as workout plans, exercise demonstrations, progress tracking, and nutrition logging.
          </Text>
          
          <Text style={[styles.section, { color: colors.text }]}>3. User Content</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            You retain ownership of any content you submit to the app, including photos and personal data. By submitting content, you grant us a non-exclusive, royalty-free license to use, store, and process that content solely for the purpose of providing and improving our services.
          </Text>
          
          <Text style={[styles.section, { color: colors.text }]}>4. AI Assistant and Data Handling</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Our app includes an AI assistant feature that provides personalized fitness guidance and recommendations. Here's how we handle your data when using the AI assistant:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • <Text style={{ fontWeight: '600' }}>Conversation Data:</Text> Your conversations with the AI assistant are processed locally on your device to provide personalized responses and improve the service. This includes your fitness goals, preferences, and questions.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • <Text style={{ fontWeight: '600' }}>Personalization:</Text> The AI uses your fitness data (workouts, nutrition, progress) stored locally on your device to provide tailored recommendations and guidance.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • <Text style={{ fontWeight: '600' }}>Data Storage:</Text> Your AI conversations and preferences are stored locally on your device to maintain continuity and improve your experience. No data is transmitted to external servers.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • <Text style={{ fontWeight: '600' }}>Privacy Protection:</Text> All your personal fitness data and AI conversations remain on your device. We do not collect, store, or transmit any of your data to external servers or third parties.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • <Text style={{ fontWeight: '600' }}>Data Retention:</Text> Your AI conversation history is retained locally on your device for the duration of your app usage. You can clear this data through your device settings or by uninstalling the app.
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • <Text style={{ fontWeight: '600' }}>Offline Operation:</Text> The AI assistant operates completely offline. No internet connection is required for AI functionality, and no data is shared with external services.
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            By using the AI assistant feature, you consent to this local data handling as described above. Your privacy is protected as all data remains on your device.
          </Text>
          
          <Text style={[styles.section, { color: colors.text }]}>5. Third-Party Content and Copyright</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Our app may display exercise tutorial videos and other content from third-party platforms such as YouTube and TikTok. This content is subject to the following terms:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • All video content displayed in our app remains the property of their respective creators and platform providers (YouTube/Google LLC, TikTok/ByteDance Ltd, etc.)
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • We do not claim ownership of any third-party video content
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Videos are displayed through official embedding features provided by these platforms in accordance with their terms of service
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • All trademarks, service marks, trade names, and logos displayed in the videos belong to their respective owners
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • We do not host, store, or modify any third-party video content
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            If you are a content creator and believe your content is being used inappropriately in our app, please contact us at the email address provided at the end of these terms.
          </Text>
          
          <Text style={[styles.section, { color: colors.text }]}>6. Health Disclaimer</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            The information provided in our app is for general informational purposes only and is not intended as medical advice. Always consult with a qualified healthcare professional before starting any fitness program, especially if you have any medical conditions or concerns.
          </Text>
          
          <Text style={[styles.section, { color: colors.text }]}>7. Limitation of Liability</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of our app.
          </Text>
          
          <Text style={[styles.section, { color: colors.text }]}>8. Changes to Terms</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We reserve the right to modify these terms at any time. We will provide notice of significant changes by posting the new Terms of Service within the app and updating the "Last Updated" date.
          </Text>
          
          <Text style={[styles.section, { color: colors.text }]}>9. Termination</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            We may terminate or suspend your access to our app immediately, without prior notice or liability, for any reason, including if you breach these Terms of Service.
          </Text>
          
          <Text style={[styles.section, { color: colors.text }]}>10. Governing Law</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
          </Text>
          
          <Text style={[styles.section, { color: colors.text }]}>11. Contact Us</Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            If you have any questions about these Terms of Service, please contact us at:
          </Text>
          <Text style={[styles.paragraph, { color: colors.text }]}>
            terms@fitnessapp.example.com
          </Text>
          
          {/* Bottom back button for additional visibility */}
          <TouchableOpacity 
            onPress={handleGoBack} 
            style={[styles.bottomBackButton, { backgroundColor: colors.primary }]}
            accessibilityLabel="Go back"
          >
            <Text style={styles.bottomBackButtonText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  visibleBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  backButtonText: {
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 16,
  },
  bottomBackButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bottomBackButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});