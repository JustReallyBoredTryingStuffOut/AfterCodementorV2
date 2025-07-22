import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Dimensions
} from 'react-native';
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  Activity, 
  Target,
  Award,
  Clock,
  Zap,
  BarChart3,
  CalendarDays
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useHealthStore } from '@/store/healthStore';

const { width } = Dimensions.get('window');

type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

export default function StepDataDetail() {
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    stepLogs, 
    getStepsForDate, 
    getStepsForWeek, 
    getStepsForMonth,
    healthGoals
  } = useHealthStore();
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('week');

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

    return stepLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= endDate;
    });
  };

  const filteredStepLogs = getDataForTimeRange();

  // Calculate totals and averages
  const totalSteps = filteredStepLogs.reduce((sum, log) => sum + log.steps, 0);
  const totalCalories = filteredStepLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
  const totalDistance = filteredStepLogs.reduce((sum, log) => sum + (log.distance || 0), 0);

  // Get today's data
  const today = new Date().toISOString().split('T')[0];
  const todaySteps = getStepsForDate(today);

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

  // Calculate goal achievement
  const dailyGoal = healthGoals.dailySteps || 10000;
  const goalAchievementRate = filteredStepLogs.length > 0 ? 
    (filteredStepLogs.filter(log => log.steps >= dailyGoal).length / filteredStepLogs.length) * 100 : 0;

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
          {filteredStepLogs.length} days tracked
        </Text>
      </View>
    </View>
  );

  const renderPerformanceInsights = () => (
    <View style={styles.performanceContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance Insights</Text>
      
      <View style={styles.performanceGrid}>
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

        <View style={[styles.performanceCard, { backgroundColor: colors.card }]}>
          <CalendarDays size={16} color={colors.primary} />
          <Text style={[styles.performanceTitle, { color: colors.text }]}>Goal Achievement</Text>
          <Text style={[styles.performanceValue, { color: colors.text }]}>
            {Math.round(goalAchievementRate)}%
          </Text>
          <Text style={[styles.performanceDate, { color: colors.textSecondary }]}>
            {filteredStepLogs.filter(log => log.steps >= dailyGoal).length} of {filteredStepLogs.length} days
          </Text>
        </View>

        <View style={[styles.performanceCard, { backgroundColor: colors.card }]}>
          <Clock size={16} color={colors.primary} />
          <Text style={[styles.performanceTitle, { color: colors.text }]}>Today's Progress</Text>
          {todaySteps ? (
            <>
              <Text style={[styles.performanceValue, { color: colors.text }]}>
                {todaySteps.steps.toLocaleString()} steps
              </Text>
              <Text style={[styles.performanceDate, { color: colors.textSecondary }]}>
                {Math.round((todaySteps.steps / dailyGoal) * 100)}% of goal
              </Text>
            </>
          ) : (
            <Text style={[styles.performanceValue, { color: colors.textSecondary }]}>
              No data today
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderDailyBreakdown = () => (
    <View style={styles.dailyBreakdownContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Breakdown</Text>
      <ScrollView style={styles.dailyBreakdownScroll}>
        {filteredStepLogs.length > 0 ? (
          filteredStepLogs.map((log, index) => {
            const isToday = new Date(log.date).toDateString() === new Date().toDateString();
            const isGoalMet = log.steps >= dailyGoal;
            
            return (
              <View key={log.id} style={[
                styles.dailyEntry, 
                { backgroundColor: colors.card },
                isToday && { borderColor: colors.primary, borderWidth: 2 }
              ]}>
                <View style={styles.dailyEntryHeader}>
                  <View style={styles.dailyDateContainer}>
                    <Text style={[styles.dailyDate, { color: colors.text }]}>
                      {new Date(log.date).toLocaleDateString()}
                    </Text>
                    {isToday && (
                      <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.todayBadgeText}>Today</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.dailySteps, 
                    { color: isGoalMet ? colors.primary : colors.text }
                  ]}>
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
                  {isGoalMet && (
                    <View style={[styles.goalMetBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.goalMetBadgeText}>Goal Met</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={[styles.noDataContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              No step data available for selected time range
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Step Data Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Filters */}
        {renderTimeRangeSelector()}

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Performance Insights */}
        {renderPerformanceInsights()}

        {/* Daily Breakdown */}
        {renderDailyBreakdown()}
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timeRangeContainer: {
    marginBottom: 20,
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
  performanceContainer: {
    marginBottom: 24,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    marginBottom: 24,
  },
  dailyBreakdownScroll: {
    maxHeight: 400,
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
  dailyDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  todayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  todayBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  dailySteps: {
    fontSize: 16,
    fontWeight: '600',
  },
  dailyEntryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyDetail: {
    fontSize: 12,
  },
  goalMetBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  goalMetBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
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
}); 