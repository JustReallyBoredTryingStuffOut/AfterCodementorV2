import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ActivityLog } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { Activity, Clock, MapPin, Flame } from 'lucide-react-native';

interface ActivityCardProps {
  activity: ActivityLog;
  onPress?: () => void;
}

export default function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const { colors } = useTheme();
  
  if (activity.type === 'swimming') {
    return null; // Use SwimmingActivityCard for swimming activities
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'walking':
        return '🚶';
      case 'running':
        return '🏃';
      case 'cycling':
        return '🚴';
      case 'workout':
        return '💪';
      default:
        return '🏃';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'walking':
        return '#4CAF50';
      case 'running':
        return '#F44336';
      case 'cycling':
        return '#2196F3';
      case 'workout':
        return '#FF9800';
      default:
        return colors.primary;
    }
  };

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

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.activityIcon, { color: getActivityColor(activity.type) }]}>
            {getActivityIcon(activity.type)}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {new Date(activity.date).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metric}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {formatDuration(activity.duration)}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Duration
          </Text>
        </View>

        {activity.distance && (
          <View style={styles.metric}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {formatDistance(activity.distance)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Distance
            </Text>
          </View>
        )}

        {activity.calories && (
          <View style={styles.metric}>
            <Flame size={16} color={colors.textSecondary} />
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {activity.calories.toFixed(0)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Calories
            </Text>
          </View>
        )}
      </View>

      {activity.source && (
        <View style={styles.sourceContainer}>
          <Text style={[styles.source, { color: colors.textSecondary }]}>
            Source: {activity.source}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sourceContainer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  source: {
    fontSize: 12,
    textAlign: 'center',
  },
}); 