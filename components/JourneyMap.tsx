import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Alert, Image, PanGestureHandler, State } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useJourneyStore } from '../store/journeyStore';
import { useHealthStore } from '../store/healthStore';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { MapPin, Trophy, Star, TrendingUp, Navigation, Zap, ZoomIn, ZoomOut, Compass, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { GestureHandlerRootView, PinchGestureHandler } from 'react-native-gesture-handler';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

interface JourneyMapProps {
  compact?: boolean;
}

export const JourneyMap: React.FC<JourneyMapProps> = ({ compact = false }) => {
  const {
    progress,
    landmarks,
    achievements,
    settings,
    syncWithHealthKit,
    getJourneyStats,
    getNextLandmark
  } = useJourneyStore();
  
  const { stepCount } = useHealthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date('2024-07-15')); // Start with a date that has data
  const [timelineData, setTimelineData] = useState([]);

  useEffect(() => {
    if (settings.autoSync && stepCount > 0) {
      syncWithHealthKit();
    }
  }, [stepCount, settings.autoSync]);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await syncWithHealthKit();
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync with HealthKit');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = getJourneyStats();
  const nextLandmark = getNextLandmark();
  const unlockedLandmarks = landmarks.filter(l => l.unlocked);

  // Calculate total distance up to selected date
  const getTotalDistanceUpToDate = (targetDate: Date) => {
    if (timelineData.length === 0) {
      return 0;
    }
    
    const dateString = targetDate.toISOString().split('T')[0];
    console.log('Looking for date:', dateString);
    console.log('Available dates:', timelineData.map(item => item.date));
    
    const dataUpToDate = timelineData.filter(item => item.date <= dateString);
    const totalDistance = dataUpToDate.reduce((total, item) => total + item.distanceKm, 0);
    
    console.log('Date:', dateString, 'Total distance:', totalDistance, 'Items found:', dataUpToDate.length);
    return totalDistance;
  };

  const currentTotalDistance = getTotalDistanceUpToDate(selectedDate);

  // Journey path from Lindesnes (southernmost) to Nordkapp (northernmost)
  const journeyPath = [
    { latitude: 57.9833, longitude: 7.0500, name: 'Lindesnes', unlocked: true }, // Southernmost point
    { latitude: 58.1600, longitude: 8.0000, name: 'Kristiansand', unlocked: true },
    { latitude: 58.9700, longitude: 5.7300, name: 'Stavanger', unlocked: true },
    { latitude: 59.9100, longitude: 10.7500, name: 'Oslo', unlocked: false },
    { latitude: 60.3900, longitude: 5.3200, name: 'Bergen', unlocked: false },
    { latitude: 61.4700, longitude: 5.8600, name: 'Ålesund', unlocked: false },
    { latitude: 63.4300, longitude: 10.3900, name: 'Trondheim', unlocked: false },
    { latitude: 65.8400, longitude: 13.2400, name: 'Mo i Rana', unlocked: false },
    { latitude: 67.2800, longitude: 14.4100, name: 'Bodø', unlocked: false },
    { latitude: 69.6500, longitude: 18.9600, name: 'Tromsø', unlocked: false },
    { latitude: 70.9800, longitude: 25.9700, name: 'Nordkapp', unlocked: false }, // Northernmost point
  ];

  // Calculate current position based on progress
  const calculateCurrentPosition = () => {
    const progressPercentage = Math.min(currentTotalDistance / 2500, 1);
    const currentIndex = Math.floor(progressPercentage * (journeyPath.length - 1));
    const nextIndex = Math.min(currentIndex + 1, journeyPath.length - 1);
    
    const currentPoint = journeyPath[currentIndex];
    const nextPoint = journeyPath[nextIndex];
    
    const segmentProgress = (progressPercentage * (journeyPath.length - 1)) - currentIndex;
    
    return {
      latitude: currentPoint.latitude + (nextPoint.latitude - currentPoint.latitude) * segmentProgress,
      longitude: currentPoint.longitude + (nextPoint.longitude - currentPoint.longitude) * segmentProgress,
    };
  };

  const currentPosition = calculateCurrentPosition();

  // Create route coordinates for the polyline
  const routeCoordinates = journeyPath.map(point => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));

  // Get completed route (up to current position)
  const progressPercentage = Math.min(currentTotalDistance / 2500, 1);
  const completedPoints = Math.max(0, Math.floor(progressPercentage * journeyPath.length));
  const completedRoute = routeCoordinates.slice(0, completedPoints);
  
  // Add current position to the completed route to show the actual path traveled
  const routeToCurrentPosition = currentTotalDistance > 0 ? [...completedRoute, currentPosition] : [];

  // Calculate map region to focus on current position
  const getMapRegion = () => {
    const currentPos = calculateCurrentPosition();
    return {
      latitude: currentPos.latitude,
      longitude: currentPos.longitude,
      latitudeDelta: 3.0, // More zoomed in
      longitudeDelta: 4.0,
    };
  };

  const [mapRegion, setMapRegion] = useState(getMapRegion());

  // Update map region when current position changes
  useEffect(() => {
    setMapRegion(getMapRegion());
  }, [currentTotalDistance]);

  // Debug logging for position calculation
  useEffect(() => {
    console.log('Selected date changed:', selectedDate.toISOString().split('T')[0]);
    console.log('Current total distance:', currentTotalDistance);
    console.log('Current position:', currentPosition);
  }, [selectedDate, currentTotalDistance, currentPosition]);

  const handleZoomIn = () => {
    setMapRegion(prev => ({
      ...prev,
      latitudeDelta: prev.latitudeDelta * 0.5,
      longitudeDelta: prev.longitudeDelta * 0.5,
    }));
  };

  const handleZoomOut = () => {
    setMapRegion(prev => ({
      ...prev,
      latitudeDelta: prev.latitudeDelta * 2,
      longitudeDelta: prev.longitudeDelta * 2,
    }));
  };

  const handleResetZoom = () => {
    setMapRegion(getMapRegion());
  };

  const getZoomPercentage = () => {
    const baseDelta = 3.0;
    const currentDelta = mapRegion.latitudeDelta;
    const zoomLevel = baseDelta / currentDelta;
    return Math.round(zoomLevel * 100);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDateData = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return timelineData.find(item => item.date === dateString);
  };

  const currentDateData = getDateData(selectedDate);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.compactCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.compactHeader}>
            <View style={styles.compactTitleRow}>
              <MapPin size={16} color={colors.text} />
              <Text style={styles.compactTitle}>Norway Journey</Text>
            </View>
            <Text style={styles.compactSubtitle}>
              {currentTotalDistance.toFixed(1)}km traveled
            </Text>
          </View>
          
          <View style={styles.compactMapContainer}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={{ width: '100%', height: 120, borderRadius: 12 }}
              region={mapRegion}
              scrollEnabled={true}
              zoomEnabled={true}
              pitchEnabled={false}
              rotateEnabled={false}
              showsUserLocation={false}
              showsMyLocationButton={false}
            >
              {journeyPath.map((point, idx) => (
                <Marker
                  key={point.name}
                  coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                  title={point.name}
                  pinColor={point.unlocked ? colors.primary : '#666'}
                />
              ))}
              
              {/* Completed route - modern thin line */}
              {routeToCurrentPosition.length > 0 && (
                <Polyline
                  coordinates={routeToCurrentPosition}
                  strokeColor="#FF6B35"
                  strokeWidth={3}
                  lineDashPattern={[1, 0]}
                />
              )}
              
              {/* Remaining route - dashed line */}
              {currentTotalDistance > 0 && (
                <Polyline
                  coordinates={routeCoordinates.slice(completedRoute.length)}
                  strokeColor="#CCCCCC"
                  strokeWidth={2}
                  lineDashPattern={[8, 4]}
                />
              )}
              
              {/* Current position - prominent marker */}
              <Marker
                coordinate={currentPosition}
                title="You"
                pinColor={colors.secondary}
              />
            </MapView>
          </View>
          
          <View style={styles.compactStats}>
            <View style={styles.compactStat}>
              <Trophy size={12} color={colors.primary} />
              <Text style={styles.compactStatText}>
                {journeyPath.filter(p => p.unlocked).length}/{journeyPath.length} landmarks
              </Text>
            </View>
            <View style={styles.compactStat}>
              <Star size={12} color={colors.primary} />
              <Text style={styles.compactStatText}>
                {achievements.filter(a => a.unlocked).length} achievements
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <MapPin size={24} color={colors.primary} />
          <Text style={styles.title}>Your Journey</Text>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: colors.card }]}
            onPress={() => setShowTimeline(!showTimeline)}
          >
            <Calendar size={16} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: colors.card }]}
            onPress={handleZoomOut}
          >
            <ZoomOut size={16} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>{getZoomPercentage()}%</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: colors.card }]}
            onPress={handleZoomIn}
          >
            <ZoomIn size={16} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: colors.secondary }]}
            onPress={handleResetZoom}
          >
            <Compass size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {showTimeline && (
        <View style={styles.timelineContainer}>
          <View style={styles.timelineHeader}>
            <TouchableOpacity 
              style={styles.timelineNavButton}
              onPress={() => navigateDate('prev')}
            >
              <ChevronLeft size={16} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.timelineDateInfo}>
              <Text style={styles.timelineDate}>{formatDate(selectedDate)}</Text>
              {currentDateData && (
                <Text style={styles.timelineSteps}>
                  {currentDateData.steps.toLocaleString()} steps • {currentDateData.distanceKm.toFixed(1)}km
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.timelineNavButton}
              onPress={() => navigateDate('next')}
            >
              <ChevronRight size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.timelineScroll}
            contentContainerStyle={styles.timelineContent}
          >
            {timelineData.length === 0 ? (
              <View style={styles.emptyTimeline}>
                <Text style={styles.emptyTimelineText}>No journey data yet</Text>
                <Text style={styles.emptyTimelineSubtext}>Your progress will appear here as you walk</Text>
              </View>
            ) : (
              timelineData.map((item, index) => {
                const itemDate = new Date(item.date);
                const isSelected = itemDate.toDateString() === selectedDate.toDateString();
                const totalDistance = timelineData.slice(0, index + 1).reduce((sum, d) => sum + d.distanceKm, 0);
                
                return (
                  <TouchableOpacity
                    key={item.date}
                    style={[
                      styles.timelineItem,
                      isSelected && styles.timelineItemSelected
                    ]}
                    onPress={() => setSelectedDate(itemDate)}
                  >
                    <Text style={[styles.timelineItemDate, isSelected && styles.timelineItemDateSelected]}>
                      {new Date(item.date).getDate()}
                    </Text>
                    <Text style={[styles.timelineItemSteps, isSelected && styles.timelineItemStepsSelected]}>
                      {item.steps.toLocaleString()}
                    </Text>
                    <Text style={[styles.timelineItemDistance, isSelected && styles.timelineItemDistanceSelected]}>
                      {totalDistance.toFixed(1)}km
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          region={mapRegion}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={false}
          rotateEnabled={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {journeyPath.map((point, idx) => (
            <Marker
              key={point.name}
              coordinate={{ latitude: point.latitude, longitude: point.longitude }}
              title={point.name}
              pinColor={point.unlocked ? colors.primary : '#666'}
            />
          ))}
          
          {/* Completed route - modern thin line */}
          {routeToCurrentPosition.length > 0 && (
            <Polyline
              coordinates={routeToCurrentPosition}
              strokeColor="#FF6B35"
              strokeWidth={4}
              lineDashPattern={[1, 0]}
            />
          )}
          
          {/* Remaining route - dashed line */}
          {currentTotalDistance > 0 && (
            <Polyline
              coordinates={routeCoordinates.slice(completedRoute.length)}
              strokeColor="#CCCCCC"
              strokeWidth={2}
              lineDashPattern={[8, 4]}
            />
          )}
          
          {/* Current position - very prominent marker */}
          <Marker
            coordinate={currentPosition}
            title="You"
            pinColor={colors.secondary}
          />
        </MapView>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Navigation size={20} color={colors.primary} />
          <Text style={styles.statValue}>{currentTotalDistance.toFixed(1)}km</Text>
          <Text style={styles.statLabel}>Distance Traveled</Text>
        </View>
        
        <View style={styles.statCard}>
          <MapPin size={20} color={colors.primary} />
          <Text style={styles.statValue}>{journeyPath.filter(p => p.unlocked).length}/{journeyPath.length}</Text>
          <Text style={styles.statLabel}>Landmarks Visited</Text>
        </View>
        
        <View style={styles.statCard}>
          <Trophy size={20} color={colors.primary} />
          <Text style={styles.statValue}>{achievements.filter(a => a.unlocked).length}</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
      </View>

      {nextLandmark && (
        <View style={[styles.nextLandmarkCard, { backgroundColor: colors.card }]}>
          <View style={styles.nextLandmarkHeader}>
            <MapPin size={20} color={colors.primary} />
            <Text style={styles.nextLandmarkTitle}>Next Destination</Text>
          </View>
          <Text style={styles.nextLandmarkName}>{nextLandmark.name}</Text>
          <Text style={styles.nextLandmarkDistance}>
            {(() => {
              const distanceToGo = nextLandmark.distance - currentTotalDistance;
              if (isNaN(distanceToGo) || distanceToGo < 0) {
                return "0m to go";
              }
              return `${(distanceToGo * 1000).toFixed(0)}m to go`;
            })()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#000000',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomIndicator: {
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  timelineContainer: {
    backgroundColor: colors.card,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  timelineNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDateInfo: {
    alignItems: 'center',
  },
  timelineDate: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  timelineSteps: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#666666',
  },
  timelineScroll: {
    paddingHorizontal: 20,
  },
  timelineContent: {
    gap: 10,
  },
  timelineItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  timelineItemSelected: {
    backgroundColor: colors.primary,
  },
  timelineItemDate: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  timelineItemDateSelected: {
    color: '#FFFFFF',
  },
  timelineItemSteps: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: '#666666',
  },
  timelineItemStepsSelected: {
    color: '#FFFFFF',
  },
  timelineItemDistance: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  timelineItemDistanceSelected: {
    color: '#FFFFFF',
  },
  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  emptyTimelineText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 4,
  },
  emptyTimelineSubtext: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#666666',
  },
  mapContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  map: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#000000',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#666666',
    marginTop: 2,
  },
  nextLandmarkCard: {
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  nextLandmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
  },
  nextLandmarkTitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#666666',
  },
  nextLandmarkName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#000000',
    marginBottom: 5,
  },
  nextLandmarkDistance: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#666666',
  },
  compactContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  compactCard: {
    borderRadius: 12,
    padding: 15,
  },
  compactHeader: {
    marginBottom: 10,
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  compactTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  compactSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  compactMapContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  compactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  compactStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  compactStatText: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: '#FFFFFF',
    opacity: 0.9,
  },
}); 