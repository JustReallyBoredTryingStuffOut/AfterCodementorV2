import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useGamificationStore } from '@/store/gamificationStore';
import { ArrowLeft, Award, Check, Clock, Zap } from 'lucide-react-native';
import Button from '@/components/Button';

export default function DailyQuestsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { dailyQuests, completeDailyQuest, gamificationEnabled, checkAndAutoCompleteQuests } = useGamificationStore();
  
  // Check for automatic quest completion when screen loads
  useEffect(() => {
    if (gamificationEnabled) {
      checkAndAutoCompleteQuests();
    }
  }, [gamificationEnabled, checkAndAutoCompleteQuests]);
  
  // Filter active quests for today
  const activeQuests = dailyQuests.filter(
    quest => !quest.completed && 
    new Date(quest.date).toDateString() === new Date().toDateString()
  );
  
  // Filter completed quests for today
  const completedQuests = dailyQuests.filter(
    quest => quest.completed && 
    new Date(quest.date).toDateString() === new Date().toDateString()
  );
  
  // Get icon for quest category
  const getQuestIcon = (category: string) => {
    switch (category) {
      case 'workout':
        return <Zap size={20} color={colors.primary} />;
      case 'nutrition':
        return <Award size={20} color="#FF9500" />;
      case 'steps':
        return <Clock size={20} color="#4CD964" />;
      default:
        return <Award size={20} color={colors.primary} />;
    }
  };
  
  // Handle quest completion
  const handleCompleteQuest = (questId: string) => {
    completeDailyQuest(questId);
  };
  
  // Handle back navigation
  const handleBack = () => {
    router.back();
  };
  
  if (!gamificationEnabled) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.card }]}
            onPress={handleBack}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Daily Quests</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.emptyContainer}>
          <Award size={60} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Gamification is Disabled
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Enable gamification in your profile settings to access daily quests and earn rewards.
          </Text>
          <Button
            title="Go to Profile Settings"
            onPress={() => router.push("/profile")}
            style={styles.profileButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={handleBack}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Daily Quests</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Complete quests to earn XP and rewards
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Daily quests reset at midnight. Make sure to complete them before they expire!
          </Text>
        </View>
        
        {activeQuests.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Today's Quests ({activeQuests.length})
            </Text>
            
            {activeQuests.map((quest) => (
              <View 
                key={quest.id} 
                style={[styles.questCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.questInfo}>
                  <View style={[styles.questIcon, { backgroundColor: `${colors.primary}20` }]}>
                    {getQuestIcon(quest.category)}
                  </View>
                  <View style={styles.questContent}>
                    <Text style={[styles.questTitle, { color: colors.text }]}>
                      {quest.title}
                    </Text>
                    <Text style={[styles.questDescription, { color: colors.textSecondary }]}>
                      {quest.description}
                    </Text>
                    <View style={styles.questReward}>
                      <Text style={[styles.questRewardText, { color: colors.primary }]}>
                        +{quest.points} XP
                      </Text>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.completeButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleCompleteQuest(quest.id)}
                >
                  <Check size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyQuestsCard, { backgroundColor: colors.card }]}>
            <Award size={40} color={colors.primary} />
            <Text style={[styles.emptyQuestsTitle, { color: colors.text }]}>
              All Quests Completed!
            </Text>
            <Text style={[styles.emptyQuestsText, { color: colors.textSecondary }]}>
              You've completed all of today's quests. Check back tomorrow for new challenges.
            </Text>
          </View>
        )}
        
        {completedQuests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Completed ({completedQuests.length})
            </Text>
            
            {completedQuests.map((quest) => (
              <View 
                key={quest.id} 
                style={[styles.questCard, { backgroundColor: colors.card, opacity: 0.7 }]}
              >
                <View style={styles.questInfo}>
                  <View style={[styles.questIcon, { backgroundColor: `${colors.primary}20` }]}>
                    {getQuestIcon(quest.category)}
                  </View>
                  <View style={styles.questContent}>
                    <Text style={[styles.questTitle, { color: colors.text }]}>
                      {quest.title}
                    </Text>
                    <Text style={[styles.questDescription, { color: colors.textSecondary }]}>
                      {quest.description}
                    </Text>
                    <View style={styles.questReward}>
                      <Text style={[styles.questRewardText, { color: colors.primary }]}>
                        +{quest.points} XP
                      </Text>
                      <Text style={[styles.completedText, { color: colors.secondary }]}>
                        Completed
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={[styles.completedCheck, { backgroundColor: colors.secondary }]}>
                  <Check size={20} color="#FFFFFF" />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      <View style={[styles.bottomBar, { backgroundColor: colors.card }]}>
        <Button
          title="Back to Home"
          onPress={handleBack}
          style={styles.backHomeButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  questCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  questInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  questIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questContent: {
    flex: 1,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  questDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  questReward: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questRewardText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  completedCheck: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyQuestsCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyQuestsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyQuestsText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  backHomeButton: {
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  profileButton: {
    minWidth: 200,
  },
});