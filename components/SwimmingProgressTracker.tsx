import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ActivityLog } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { TrendingUp, Award, Clock, MapPin } from 'lucide-react-native';

interface SwimmingProgressTrackerProps {
  activities: ActivityLog[];
  timeRange?: 'week' | 'month' | 'year';
}

export default function SwimmingProgressTracker({ activities, timeRange = 'week' }: SwimmingProgressTrackerProps) {
  const { colors } = useTheme();
  
  // Filter swimming activities
  const swimmingActivities = activities.filter(activity => activity.type === 'swimming');
  
  // Calculate statistics
  const totalDistance = swimmingActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0);
  const totalDuration = swimmingActivities.reduce((sum, activity) => sum + activity.duration, 0);
  const totalCalories = swimmingActivities.reduce((sum, activity) => sum + (activity.calories || 0), 0);
  const totalWorkouts = swimmingActivities.length;
  
  // Calculate average pace
  const totalPace = swimmingActivities.reduce((sum, activity) => {
    if (activity.swimmingMetrics?.averagePace) {
      return sum + activity.swimmingMetrics.averagePace;
    }
    return sum;
  }, 0);
  const averagePace = totalWorkouts > 0 ? totalPace / totalWorkouts : 0;
  
  // Calculate total laps
  const totalLaps = swimmingActivities.reduce((sum, activity) => {
    if (activity.swimmingMetrics?.laps) {
      return sum + activity.swimmingMetrics.laps.pool25m;
    }
    return sum;
  }, 0);
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  const formatPace = (pace: number) => {
    return `${pace.toFixed(1)} min/100m`;
  };

  if (swimmingActivities.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.cardBackground }]}>
        <Award size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No Swimming Activities
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Your swimming workouts from Apple Health will appear here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TrendingUp size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Swimming Progress
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <MapPin size={20} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatDistance(totalDistance)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total Distance
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Clock size={20} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatDuration(totalDuration)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total Time
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Award size={20} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {totalWorkouts}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Workouts
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <TrendingUp size={20} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {totalLaps.toFixed(0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total Laps
          </Text>
        </View>
      </View>

      <View style={[styles.detailCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.detailTitle, { color: colors.text }]}>
          Performance Metrics
        </Text>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Average Pace:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {formatPace(averagePace)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Total Calories:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {totalCalories.toFixed(0)} cal
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Average Distance:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {formatDistance(totalWorkouts > 0 ? totalDistance / totalWorkouts : 0)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  detailCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 