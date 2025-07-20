import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ActivityLog } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { X, Clock, MapPin, Flame, Award, Trash2, Edit } from 'lucide-react-native';

interface ActivityDetailModalProps {
  activity: ActivityLog;
  onClose: () => void;
  onDelete: () => void;
  onEdit?: () => void;
}

export default function ActivityDetailModal({ activity, onClose, onDelete, onEdit }: ActivityDetailModalProps) {
  const { colors } = useTheme();

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

  const handleDelete = () => {
    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete }
      ]
    );
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Activity Details
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.activityHeader}>
              <Text style={[styles.activityType, { color: colors.text }]}>
                {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
              </Text>
              <Text style={[styles.activityDate, { color: colors.textSecondary }]}>
                {new Date(activity.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metric}>
                <Clock size={20} color={colors.primary} />
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {formatDuration(activity.duration)}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Duration
                </Text>
              </View>

              {activity.distance && (
                <View style={styles.metric}>
                  <MapPin size={20} color={colors.primary} />
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
                  <Flame size={20} color={colors.primary} />
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {activity.calories.toFixed(0)}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Calories
                  </Text>
                </View>
              )}
            </View>

            {/* Swimming-specific metrics */}
            {activity.type === 'swimming' && activity.swimmingMetrics && (
              <View style={[styles.swimmingSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Swimming Metrics
                </Text>
                
                <View style={styles.swimmingMetrics}>
                  <View style={styles.swimmingMetric}>
                    <Award size={16} color={colors.primary} />
                    <Text style={[styles.swimmingMetricValue, { color: colors.text }]}>
                      {activity.swimmingMetrics.laps.pool25m.toFixed(1)} laps
                    </Text>
                    <Text style={[styles.swimmingMetricLabel, { color: colors.textSecondary }]}>
                      (25m pool)
                    </Text>
                  </View>

                  <View style={styles.swimmingMetric}>
                    <Text style={[styles.swimmingMetricValue, { color: colors.text }]}>
                      {activity.swimmingMetrics.strokeType}
                    </Text>
                    <Text style={[styles.swimmingMetricLabel, { color: colors.textSecondary }]}>
                      Stroke Type
                    </Text>
                  </View>

                  <View style={styles.swimmingMetric}>
                    <Text style={[styles.swimmingMetricValue, { color: colors.text }]}>
                      {formatPace(activity.swimmingMetrics.averagePace)}
                    </Text>
                    <Text style={[styles.swimmingMetricLabel, { color: colors.textSecondary }]}>
                      Average Pace
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {activity.notes && (
              <View style={[styles.notesSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Notes
                </Text>
                <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                  {activity.notes}
                </Text>
              </View>
            )}

            {activity.source && (
              <View style={[styles.sourceSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Source
                </Text>
                <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
                  {activity.source}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {onEdit && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.border }]}
              onPress={onEdit}
            >
              <Edit size={16} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                Edit
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: '#FF4444' }]}
            onPress={handleDelete}
          >
            <Trash2 size={16} color="white" />
            <Text style={styles.deleteButtonText}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    marginBottom: 20,
  },
  activityType: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  swimmingSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  swimmingMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  swimmingMetric: {
    alignItems: 'center',
    flex: 1,
  },
  swimmingMetricValue: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  swimmingMetricLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  notesSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    marginBottom: 20,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sourceSection: {
    paddingTop: 20,
    borderTopWidth: 1,
  },
  sourceText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 