import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../store/userStore';
import { useSettingsStore } from '../store/settingsStore';
import { useWaterStore } from '../store/waterStore';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, updateUser, logout } = useUserStore();
  const { settings, updateSettings } = useSettingsStore();
  const { preferredBottleSize, setPreferredBottleSize } = useWaterStore();
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle account deletion
            Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const toggleSetting = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
  };

  const settingsSections = [
    {
      title: 'Profile',
      items: [
        {
          icon: 'person-outline',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          action: () => router.push('/edit-profile'),
          showArrow: true,
        },
        {
          icon: 'fitness-outline',
          title: 'Fitness Goals',
          subtitle: 'Set your fitness and nutrition goals',
          action: () => router.push('/fitness-goals'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Push Notifications',
          subtitle: 'Receive reminders and updates',
          action: () => toggleSetting('pushNotifications'),
          showSwitch: true,
          switchValue: settings.pushNotifications,
        },
        {
          icon: 'moon-outline',
          title: 'Dark Mode',
          subtitle: 'Use dark theme',
          action: () => toggleSetting('darkMode'),
          showSwitch: true,
          switchValue: settings.darkMode,
        },
        {
          icon: 'language-outline',
          title: 'Language',
          subtitle: 'English',
          action: () => router.push('/language'),
          showArrow: true,
        },
        {
          icon: 'time-outline',
          title: 'Time Zone',
          subtitle: 'UTC-05:00 (Eastern Time)',
          action: () => router.push('/timezone'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Water Tracking',
      items: [
        {
          icon: 'water-outline',
          title: 'Preferred Bottle Size',
          subtitle: `${preferredBottleSize}ml - Your quick-add button`,
          action: () => {
            Alert.prompt(
              'Set Preferred Bottle Size',
              'Enter your preferred bottle size in ml:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Save',
                  onPress: (value) => {
                    const size = parseInt(value || '500');
                    if (size >= 100) {
                      setPreferredBottleSize(size);
                    }
                  },
                },
              ],
              'plain-text',
              preferredBottleSize.toString(),
            );
          },
          showArrow: true,
        },
        {
          icon: 'droplet-outline',
          title: 'Water Reminders',
          subtitle: 'Get reminded to drink water',
          action: () => router.push('/notifications'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          icon: 'cloud-upload-outline',
          title: 'Backup Data',
          subtitle: 'Export your fitness data',
          action: () => router.push('/backup'),
          showArrow: true,
        },
        {
          icon: 'shield-outline',
          title: 'Privacy Settings',
          subtitle: 'Manage your privacy preferences',
          action: () => router.push('/privacy'),
          showArrow: true,
        },
        {
          icon: 'download-outline',
          title: 'Export Data',
          subtitle: 'Download your data',
          action: () => router.push('/export'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Development',
      items: [
        {
          icon: 'watch-outline',
          title: 'Apple Watch Test',
          subtitle: 'Test Apple Watch integration features',
          action: () => router.push('/apple-watch-test'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Help & FAQ',
          subtitle: 'Get help and find answers',
          action: () => router.push('/help'),
          showArrow: true,
        },
        {
          icon: 'chatbubble-outline',
          title: 'Contact Support',
          subtitle: 'Get in touch with our team',
          action: () => router.push('/contact'),
          showArrow: true,
        },
        {
          icon: 'star-outline',
          title: 'Rate App',
          subtitle: 'Rate us on the App Store',
          action: () => {
            // Handle app store rating
            Alert.alert('Rate App', 'Thank you for your feedback!');
          },
          showArrow: true,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: 'log-out-outline',
          title: 'Logout',
          subtitle: 'Sign out of your account',
          action: handleLogout,
          showArrow: false,
          destructive: true,
        },
        {
          icon: 'trash-outline',
          title: 'Delete Account',
          subtitle: 'Permanently delete your account',
          action: handleDeleteAccount,
          showArrow: false,
          destructive: true,
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.settingItem}
                onPress={item.action}
              >
                <View style={styles.settingLeft}>
                  <View style={[
                    styles.iconContainer,
                    item.destructive && styles.destructiveIcon
                  ]}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color={item.destructive ? colors.error : colors.textSecondary} 
                    />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={[
                      styles.settingTitle,
                      item.destructive && styles.destructiveText
                    ]}>
                      {item.title}
                    </Text>
                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  {item.showSwitch && (
                    <Switch
                      value={item.switchValue}
                      onValueChange={item.action}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.background}
                    />
                  )}
                  {item.showArrow && (
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Fitness Journey Tracker</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: colors.error + '20',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  destructiveText: {
    color: colors.error,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  settingRight: {
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
}); 