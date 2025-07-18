import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch
} from "react-native";
import { useRouter } from "expo-router";
import { 
  Settings, 
  User, 
  Bell, 
  Moon, 
  Award, 
  Camera, 
  Lock,
  ChevronRight,
  Trophy,
  MapPin
} from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useThemeStore } from "@/store/themeStore";
import { useGamificationStore } from "@/store/gamificationStore";
import { useJourneyStore } from "@/store/journeyStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const { gamificationEnabled, toggleGamification } = useGamificationStore();
  const { settings, toggleJourney } = useJourneyStore();
  
  const profileSections = [
    {
      title: "Account",
      items: [
        {
          icon: <User size={20} color={colors.primary} />,
          title: "Edit Profile",
          onPress: () => router.push("/edit-profile"),
        },
        {
          icon: <Bell size={20} color={colors.primary} />,
          title: "Notifications",
          onPress: () => router.push("/notifications"),
        },
        {
          icon: <Moon size={20} color={colors.primary} />,
          title: "Theme Settings",
          onPress: () => router.push("/theme-settings"),
        },
      ],
    },
    {
      title: "Content",
      items: [
        {
          icon: <Award size={20} color={colors.primary} />,
          title: "Achievements",
          onPress: () => router.push("/achievements"),
        },
        {
          icon: <Camera size={20} color={colors.primary} />,
          title: "Food Photos",
          onPress: () => router.push("/food-photos"),
        },
        {
          icon: <Camera size={20} color={colors.primary} />,
          title: "Progress Photos",
          onPress: () => router.push("/progress-photos"),
        },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        {
          icon: <Settings size={20} color={colors.primary} />,
          title: "Data Management",
          onPress: () => router.push("/data-management"),
        },
        {
          icon: <Lock size={20} color={colors.primary} />,
          title: "Terms of Service",
          onPress: () => router.push("/terms-of-service"),
        },
      ],
    },
  ];
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.profileName}>John Doe</Text>
      </View>
      
      {/* Achievement System Toggle */}
      <View style={styles.gamificationContainer}>
        <View style={styles.gamificationLeft}>
          <View style={styles.gamificationIconContainer}>
            <Trophy size={20} color={colors.primary} />
          </View>
          <View style={styles.gamificationTextContainer}>
            <Text style={styles.gamificationTitle}>Enable Achievement System</Text>
            <Text style={styles.gamificationDescription}>
              Turn on achievements, challenges, and rewards
            </Text>
          </View>
        </View>
        <Switch
          value={gamificationEnabled}
          onValueChange={toggleGamification}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>
      
      {/* Journey System Toggle */}
      <View style={styles.gamificationContainer}>
        <View style={styles.gamificationLeft}>
          <View style={styles.gamificationIconContainer}>
            <MapPin size={20} color={colors.primary} />
          </View>
          <View style={styles.gamificationTextContainer}>
            <Text style={styles.gamificationTitle}>Enable Virtual Journey</Text>
            <Text style={styles.gamificationDescription}>
              Track your progress through Norway's landscapes
            </Text>
          </View>
        </View>
        <Switch
          value={settings.enabled}
          onValueChange={toggleJourney}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>
      
      {profileSections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuItemIconContainer}>
                    {item.icon}
                  </View>
                  <View>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    {item.description && (
                      <Text style={styles.menuItemDescription}>{item.description}</Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      
      <View style={styles.footer}>
        <Text style={styles.version}>Version 1.0.0</Text>
        <TouchableOpacity onPress={() => router.push("/privacy-policy")}>
          <Text style={styles.privacyLink}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  gamificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gamificationLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  gamificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  gamificationTextContainer: {
    flex: 1,
  },
  gamificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
    flexShrink: 1,
  },
  gamificationDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  menuItemDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  version: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  privacyLink: {
    fontSize: 12,
    color: colors.primary,
  },
});