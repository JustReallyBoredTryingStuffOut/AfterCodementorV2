import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  Activity, 
  Target,
  Filter,
  Download,
  BarChart3,
  LineChart,
  PieChart,
  CalendarDays,
  Clock,
  Zap,
  Award
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useHealthStore } from '@/store/healthStore';
import { useWorkoutStore } from '@/store/workoutStore';

const { width } = Dimensions.get('window');

type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';
type DataType = 'steps' | 'calories' | 'distance' | 'activities';

export default function HealthDataViewer() {
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    stepLogs, 
    activityLogs, 
    getStepsForDate, 
    getStepsForWeek, 
    getStepsForMonth,
    getActivityLogsByDate,
    calculateTotalCaloriesBurned,
    calculateTotalDistance,
    calculateTotalDuration
  } = useHealthStore();
  
  const { workoutLogs } = useWorkoutStore();
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('week');
  const [selectedDataType, setSelectedDataType] = useState<DataType>('steps');
  const [showFilters, setShowFilters] = useState(false);

  // Get data based on selected time range
  const getDataForTimeRange = () => {
    const today = new Date();
    const endDate = new Date();
    let startDate = new Date();

    switch (selectedTimeRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
    }

    return {
      startDate,
      endDate,
      stepLogs: stepLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startDate && logDate <= endDate;
      }),
      activityLogs: activityLogs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= startDate && logDate <= endDate;
      })
    };
  };

  const { stepLogs: filteredStepLogs, activityLogs: filteredActivityLogs } = getDataForTimeRange();

  // Calculate totals
  const totalSteps = filteredStepLogs.reduce((sum, log) => sum + log.steps, 0);
  const totalCalories = filteredStepLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
  const totalDistance = filteredStepLogs.reduce((sum, log) => sum + (log.distance || 0), 0);
  const totalActivities = filteredActivityLogs.length;

  // Get today's data
  const today = new Date().toISOString().split('T')[0];
  const todaySteps = getStepsForDate(today);
  const todayCalories = todaySteps?.caloriesBurned || 0;

  // Calculate averages
  const daysInRange = selectedTimeRange === 'today' ? 1 : 
                     selectedTimeRange === 'week' ? 7 : 
                     selectedTimeRange === 'month' ? 30 : 
                     selectedTimeRange === 'year' ? 365 : filteredStepLogs.length;

  const averageSteps = daysInRange > 0 ? Math.round(totalSteps / daysInRange) : 0;
  const averageCalories = daysInRange > 0 ? Math.round(totalCalories / daysInRange) : 0;

  // Get best and worst days
  const sortedStepLogs = [...filteredStepLogs].sort((a, b) => b.steps - a.steps);
  const bestDay = sortedStepLogs[0];
  const worstDay = sortedStepLogs[sortedStepLogs.length - 1];

  // Get activity breakdown
  const activityBreakdown = filteredActivityLogs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Time Range</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeRangeScroll}>
        {(['today', 'week', 'month', 'year', 'all'] as TimeRange[]).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              selectedTimeRange === range && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedTimeRange(range)}
          >
            <Text style={[
              styles.timeRangeButtonText,
              { color: selectedTimeRange === range ? '#FFFFFF' : colors.text }
            ]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderDataTypeSelector = () => (
    <View style={styles.dataTypeContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dataTypeScroll}>
        {(['steps', 'calories', 'distance', 'activities'] as DataType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.dataTypeButton,
              selectedDataType === type && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedDataType(type)}
          >
            <Text style={[
              styles.dataTypeButtonText,
              { color: selectedDataType === type ? '#FFFFFF' : colors.text }
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <View style={styles.summaryHeader}>
          <Activity size={20} color={colors.primary} />
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Total Steps</Text>
        </View>
        <Text style={[styles.summaryValue, { color: colors.text }]}>
          {totalSteps.toLocaleString()}
        </Text>
        <Text style={[styles.summarySubtext, { color: colors.textSecondary }]}>
          Avg: {averageSteps.toLocaleString()}/day
        </Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <View style={styles.summaryHeader}>
          <Zap size={20} color={colors.primary} />
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Calories Burned</Text>
        </View>
        <Text style={[styles.summaryValue, { color: colors.text }]}>
          {totalCalories.toLocaleString()}
        </Text>
        <Text style={[styles.summarySubtext, { color: colors.textSecondary }]}>
          Avg: {averageCalories}/day
        </Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <View style={styles.summaryHeader}>
          <TrendingUp size={20} color={colors.primary} />
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Distance</Text>
        </View>
        <Text style={[styles.summaryValue, { color: colors.text }]}>
          {totalDistance.toFixed(1)} km
        </Text>
        <Text style={[styles.summarySubtext, { color: colors.textSecondary }]}>
          {totalActivities} activities
        </Text>
      </View>
    </View>
  );

  const renderDetailedData = () => (
    <View style={styles.detailedContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Detailed Data</Text>
      
      {/* Best and Worst Days */}
      <View style={styles.performanceContainer}>
        <View style={[styles.performanceCard, { backgroundColor: colors.card }]}>
          <Award size={16} color={colors.primary} />
          <Text style={[styles.performanceTitle, { color: colors.text }]}>Best Day</Text>
          {bestDay ? (
            <>
              <Text style={[styles.performanceValue, { color: colors.text }]}>
                {bestDay.steps.toLocaleString()} steps
              </Text>
              <Text style={[styles.performanceDate, { color: colors.textSecondary }]}>
                {new Date(bestDay.date).toLocaleDateString()}
              </Text>
            </>
          ) : (
            <Text style={[styles.performanceValue, { color: colors.textSecondary }]}>
              No data
            </Text>
          )}
        </View>

        <View style={[styles.performanceCard, { backgroundColor: colors.card }]}>
          <Target size={16} color={colors.warning} />
          <Text style={[styles.performanceTitle, { color: colors.text }]}>Worst Day</Text>
          {worstDay ? (
            <>
              <Text style={[styles.performanceValue, { color: colors.text }]}>
                {worstDay.steps.toLocaleString()} steps
              </Text>
              <Text style={[styles.performanceDate, { color: colors.textSecondary }]}>
                {new Date(worstDay.date).toLocaleDateString()}
              </Text>
            </>
          ) : (
            <Text style={[styles.performanceValue, { color: colors.textSecondary }]}>
              No data
            </Text>
          )}
        </View>
      </View>

      {/* Daily Breakdown */}
      <View style={styles.dailyBreakdownContainer}>
        <Text style={[styles.subsectionTitle, { color: colors.text }]}>Daily Breakdown</Text>
        <ScrollView style={styles.dailyBreakdownScroll}>
          {filteredStepLogs.length > 0 ? (
            filteredStepLogs.map((log, index) => (
              <View key={log.id} style={[styles.dailyEntry, { backgroundColor: colors.card }]}>
                <View style={styles.dailyEntryHeader}>
                  <Text style={[styles.dailyDate, { color: colors.text }]}>
                    {new Date(log.date).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.dailySteps, { color: colors.primary }]}>
                    {log.steps.toLocaleString()} steps
                  </Text>
                </View>
                <View style={styles.dailyEntryDetails}>
                  <Text style={[styles.dailyDetail, { color: colors.textSecondary }]}>
                    {log.caloriesBurned || 0} calories
                  </Text>
                  <Text style={[styles.dailyDetail, { color: colors.textSecondary }]}>
                    {(log.distance || 0).toFixed(1)} km
                  </Text>
                  <Text style={[styles.dailyDetail, { color: colors.textSecondary }]}>
                    {log.source}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.noDataContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                No data available for selected time range
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Activity Breakdown */}
      {Object.keys(activityBreakdown).length > 0 && (
        <View style={styles.activityBreakdownContainer}>
          <Text style={[styles.subsectionTitle, { color: colors.text }]}>Activity Types</Text>
          {Object.entries(activityBreakdown).map(([type, count]) => (
            <View key={type} style={[styles.activityEntry, { backgroundColor: colors.card }]}>
              <Text style={[styles.activityType, { color: colors.text }]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
              <Text style={[styles.activityCount, { color: colors.primary }]}>
                {count} {count === 1 ? 'session' : 'sessions'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This feature would export your health data to a CSV file. Implementation coming soon!',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Health Data Viewer</Text>
        <TouchableOpacity 
          style={styles.exportButton} 
          onPress={handleExportData}
        >
          <Download size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Filters */}
        <View style={styles.filtersContainer}>
          {renderTimeRangeSelector()}
          {renderDataTypeSelector()}
        </View>

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Detailed Data */}
        {renderDetailedData()}
      </ScrollView>
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  exportButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  timeRangeContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  timeRangeScroll: {
    flexDirection: 'row',
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dataTypeContainer: {
    marginBottom: 16,
  },
  dataTypeScroll: {
    flexDirection: 'row',
  },
  dataTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  dataTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 10,
  },
  detailedContainer: {
    marginBottom: 24,
  },
  performanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  performanceCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  performanceTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  performanceDate: {
    fontSize: 10,
  },
  dailyBreakdownContainer: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  dailyBreakdownScroll: {
    maxHeight: 300,
  },
  dailyEntry: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dailyEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dailyDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  dailySteps: {
    fontSize: 16,
    fontWeight: '600',
  },
  dailyEntryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dailyDetail: {
    fontSize: 12,
  },
  noDataContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
  },
  activityBreakdownContainer: {
    marginBottom: 20,
  },
  activityEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityCount: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 