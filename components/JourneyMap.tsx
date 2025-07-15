import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Alert, Image, PanGestureHandler, State } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useJourneyStore } from '../store/journeyStore';
import { useHealthStore } from '../store/healthStore';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { Svg, Circle, Line, Text as SvgText, G, Path, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { MapPin, Trophy, Star, TrendingUp, Navigation, Zap, ZoomIn, ZoomOut, Compass } from 'lucide-react-native';
import { GestureHandlerRootView, PinchGestureHandler } from 'react-native-gesture-handler';

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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

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

  // Norway map dimensions with realistic proportions
  const mapWidth = compact ? width * 0.85 : width * 0.9;
  const mapHeight = compact ? 180 : 280;
  
  // Norway bounding box (realistic coordinates)
  const norwayBounds = {
    minLat: 57.5,
    maxLat: 71.5,
    minLng: 4.5,
    maxLng: 31.5
  };

  const scaleCoordinate = (value: number, min: number, max: number, size: number) => {
    return ((value - min) / (max - min)) * size;
  };

  const getAvatarPosition = () => {
    const x = scaleCoordinate(progress.currentLocation.longitude, norwayBounds.minLng, norwayBounds.maxLng, mapWidth);
    const y = mapHeight - scaleCoordinate(progress.currentLocation.latitude, norwayBounds.minLat, norwayBounds.maxLat, mapHeight);
    return { x, y };
  };

  const avatarPosition = getAvatarPosition();

  // Realistic Norway outline with fjords and coastline
  const norwayPath = `
    M ${mapWidth * 0.15} ${mapHeight * 0.85}
    L ${mapWidth * 0.25} ${mapHeight * 0.8}
    L ${mapWidth * 0.35} ${mapHeight * 0.75}
    L ${mapWidth * 0.45} ${mapHeight * 0.7}
    L ${mapWidth * 0.55} ${mapHeight * 0.65}
    L ${mapWidth * 0.65} ${mapHeight * 0.6}
    L ${mapWidth * 0.75} ${mapHeight * 0.55}
    L ${mapWidth * 0.8} ${mapHeight * 0.5}
    L ${mapWidth * 0.85} ${mapHeight * 0.45}
    L ${mapWidth * 0.9} ${mapHeight * 0.4}
    L ${mapWidth * 0.88} ${mapHeight * 0.35}
    L ${mapWidth * 0.85} ${mapHeight * 0.3}
    L ${mapWidth * 0.8} ${mapHeight * 0.25}
    L ${mapWidth * 0.75} ${mapHeight * 0.2}
    L ${mapWidth * 0.7} ${mapHeight * 0.15}
    L ${mapWidth * 0.6} ${mapHeight * 0.1}
    L ${mapWidth * 0.5} ${mapHeight * 0.08}
    L ${mapWidth * 0.4} ${mapHeight * 0.1}
    L ${mapWidth * 0.3} ${mapHeight * 0.15}
    L ${mapWidth * 0.25} ${mapHeight * 0.2}
    L ${mapWidth * 0.2} ${mapHeight * 0.3}
    L ${mapWidth * 0.18} ${mapHeight * 0.4}
    L ${mapWidth * 0.15} ${mapHeight * 0.6}
    Z
  `;

  // Major fjords and geographical features
  const fjords = [
    // Sognefjord
    `M ${mapWidth * 0.4} ${mapHeight * 0.7} L ${mapWidth * 0.35} ${mapHeight * 0.65} L ${mapWidth * 0.3} ${mapHeight * 0.6}`,
    // Hardangerfjord
    `M ${mapWidth * 0.5} ${mapHeight * 0.65} L ${mapWidth * 0.45} ${mapHeight * 0.6} L ${mapWidth * 0.4} ${mapHeight * 0.55}`,
    // Trondheimsfjord
    `M ${mapWidth * 0.6} ${mapHeight * 0.5} L ${mapWidth * 0.55} ${mapHeight * 0.45} L ${mapWidth * 0.5} ${mapHeight * 0.4}`,
  ];

  // Mountain ranges
  const mountains = [
    // Jotunheimen
    `M ${mapWidth * 0.35} ${mapHeight * 0.6} L ${mapWidth * 0.4} ${mapHeight * 0.55} L ${mapWidth * 0.45} ${mapHeight * 0.6}`,
    // Dovrefjell
    `M ${mapWidth * 0.55} ${mapHeight * 0.45} L ${mapWidth * 0.6} ${mapHeight * 0.4} L ${mapWidth * 0.65} ${mapHeight * 0.45}`,
  ];

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel / 1.2, 0.5));
  };

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
              {progress.distanceTraveled.toFixed(1)}km traveled
            </Text>
          </View>
          
          <View style={styles.compactMapContainer}>
            <Svg width={mapWidth} height={mapHeight} style={styles.map}>
              <Defs>
                <SvgLinearGradient id="norwayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#4A90E2" stopOpacity="0.3" />
                  <Stop offset="50%" stopColor="#2E8B57" stopOpacity="0.4" />
                  <Stop offset="100%" stopColor="#8B4513" stopOpacity="0.3" />
                </SvgLinearGradient>
                <SvgLinearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                  <Stop offset="100%" stopColor="#D3D3D3" stopOpacity="0.6" />
                </SvgLinearGradient>
                <SvgLinearGradient id="fjordGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#1E90FF" stopOpacity="0.6" />
                  <Stop offset="100%" stopColor="#000080" stopOpacity="0.4" />
                </SvgLinearGradient>
              </Defs>
              
              <G>
                {/* Norway outline with realistic coloring */}
                <Path
                  d={norwayPath}
                  fill="url(#norwayGradient)"
                  stroke={colors.primary}
                  strokeWidth={2}
                />
                
                {/* Mountain ranges */}
                {mountains.map((mountain, index) => (
                  <Path
                    key={`mountain-${index}`}
                    d={mountain}
                    fill="url(#mountainGradient)"
                    stroke="#FFFFFF"
                    strokeWidth={1}
                    opacity={0.8}
                  />
                ))}
                
                {/* Fjords */}
                {fjords.map((fjord, index) => (
                  <Path
                    key={`fjord-${index}`}
                    d={fjord}
                    fill="url(#fjordGradient)"
                    stroke="#1E90FF"
                    strokeWidth={1}
                    opacity={0.7}
                  />
                ))}
                
                {/* Progress path with realistic trail */}
                <Path
                  d={`M ${mapWidth * 0.15} ${mapHeight * 0.85} L ${avatarPosition.x} ${avatarPosition.y}`}
                  stroke={colors.accent}
                  strokeWidth={3}
                  strokeDasharray="6,6"
                  opacity={0.9}
                />
                
                {/* Landmarks with realistic markers */}
                {landmarks.map((landmark) => {
                  const x = scaleCoordinate(landmark.location.longitude, norwayBounds.minLng, norwayBounds.maxLng, mapWidth);
                  const y = mapHeight - scaleCoordinate(landmark.location.latitude, norwayBounds.minLat, norwayBounds.maxLat, mapHeight);
                  
                  return (
                    <G key={landmark.id}>
                      {landmark.unlocked && (
                        <Circle
                          cx={x}
                          cy={y}
                          r={10}
                          fill="transparent"
                          stroke={colors.success}
                          strokeWidth={2}
                          opacity={0.6}
                        />
                      )}
                      <Circle
                        cx={x}
                        cy={y}
                        r={landmark.unlocked ? 6 : 4}
                        fill={landmark.unlocked ? colors.success : colors.textSecondary}
                        opacity={0.9}
                      />
                      {landmark.unlocked && (
                        <SvgText
                          x={x}
                          y={y - 15}
                          fontSize="8"
                          fill={colors.text}
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          {landmark.name.split(' ')[0]}
                        </SvgText>
                      )}
                    </G>
                  );
                })}
                
                {/* Avatar with realistic positioning */}
                <Circle
                  cx={avatarPosition.x}
                  cy={avatarPosition.y}
                  r={8}
                  fill="transparent"
                  stroke={colors.accent}
                  strokeWidth={2}
                  opacity={0.4}
                />
                <Circle
                  cx={avatarPosition.x}
                  cy={avatarPosition.y}
                  r={5}
                  fill={colors.accent}
                  stroke={colors.background}
                  strokeWidth={1}
                />
                <Circle
                  cx={avatarPosition.x}
                  cy={avatarPosition.y}
                  r={2}
                  fill={colors.background}
                />
              </G>
            </Svg>
          </View>
          
          <View style={styles.compactStats}>
            <View style={styles.compactStat}>
              <Trophy size={12} color={colors.textSecondary} />
              <Text style={styles.compactStatText}>
                {unlockedLandmarks.length} landmarks
              </Text>
            </View>
            <View style={styles.compactStat}>
              <Star size={12} color={colors.textSecondary} />
              <Text style={styles.compactStatText}>
                {stats.achievementsUnlocked} achievements
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <MapPin size={24} color={colors.text} />
            <Text style={styles.title}>Norway Journey</Text>
          </View>
          <Text style={styles.subtitle}>Walk through the beautiful landscapes of Norway</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress.progressPercentage * 100}%` }
                ]} 
              />
            </View>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressText}>
                {progress.distanceTraveled.toFixed(1)}km / 1500km
              </Text>
              <Text style={styles.progressPercentage}>
                {Math.round(progress.progressPercentage * 100)}%
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Interactive Map Section */}
        <View style={styles.mapSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Journey</Text>
            <View style={styles.mapControls}>
              <TouchableOpacity onPress={handleZoomOut} style={styles.zoomButton}>
                <ZoomOut size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleZoomIn} style={styles.zoomButton}>
                <ZoomIn size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSync} disabled={isLoading}>
                <Zap size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.mapContainer}>
            <Svg 
              width={mapWidth * zoomLevel} 
              height={mapHeight * zoomLevel} 
              style={[styles.map, { transform: [{ scale: zoomLevel }] }]}
            >
              <Defs>
                <SvgLinearGradient id="norwayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#4A90E2" stopOpacity="0.3" />
                  <Stop offset="30%" stopColor="#2E8B57" stopOpacity="0.4" />
                  <Stop offset="70%" stopColor="#8B4513" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
                </SvgLinearGradient>
                <SvgLinearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                  <Stop offset="50%" stopColor="#D3D3D3" stopOpacity="0.7" />
                  <Stop offset="100%" stopColor="#A9A9A9" stopOpacity="0.5" />
                </SvgLinearGradient>
                <SvgLinearGradient id="fjordGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#1E90FF" stopOpacity="0.7" />
                  <Stop offset="100%" stopColor="#000080" stopOpacity="0.5" />
                </SvgLinearGradient>
                <SvgLinearGradient id="forestGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#228B22" stopOpacity="0.4" />
                  <Stop offset="100%" stopColor="#006400" stopOpacity="0.3" />
                </SvgLinearGradient>
              </Defs>
              
              <G>
                {/* Norway outline with realistic satellite-style coloring */}
                <Path
                  d={norwayPath}
                  fill="url(#norwayGradient)"
                  stroke={colors.primary}
                  strokeWidth={3}
                />
                
                {/* Mountain ranges with snow caps */}
                {mountains.map((mountain, index) => (
                  <Path
                    key={`mountain-${index}`}
                    d={mountain}
                    fill="url(#mountainGradient)"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    opacity={0.9}
                  />
                ))}
                
                {/* Fjords with realistic water coloring */}
                {fjords.map((fjord, index) => (
                  <Path
                    key={`fjord-${index}`}
                    d={fjord}
                    fill="url(#fjordGradient)"
                    stroke="#1E90FF"
                    strokeWidth={2}
                    opacity={0.8}
                  />
                ))}
                
                {/* Forest areas */}
                <Path
                  d={`M ${mapWidth * 0.3} ${mapHeight * 0.6} L ${mapWidth * 0.4} ${mapHeight * 0.55} L ${mapWidth * 0.5} ${mapHeight * 0.6} L ${mapWidth * 0.4} ${mapHeight * 0.65} Z`}
                  fill="url(#forestGradient)"
                  opacity={0.6}
                />
                
                {/* Progress path with realistic trail */}
                <Path
                  d={`M ${mapWidth * 0.15} ${mapHeight * 0.85} L ${avatarPosition.x} ${avatarPosition.y}`}
                  stroke={colors.accent}
                  strokeWidth={4}
                  strokeDasharray="8,8"
                  opacity={0.9}
                />
                
                {/* Landmarks with realistic markers */}
                {landmarks.map((landmark) => {
                  const x = scaleCoordinate(landmark.location.longitude, norwayBounds.minLng, norwayBounds.maxLng, mapWidth);
                  const y = mapHeight - scaleCoordinate(landmark.location.latitude, norwayBounds.minLat, norwayBounds.maxLat, mapHeight);
                  
                  return (
                    <G key={landmark.id}>
                      {landmark.unlocked && (
                        <Circle
                          cx={x}
                          cy={y}
                          r={15}
                          fill="transparent"
                          stroke={colors.success}
                          strokeWidth={2}
                          opacity={0.4}
                        />
                      )}
                      <Circle
                        cx={x}
                        cy={y}
                        r={landmark.unlocked ? 8 : 6}
                        fill={landmark.unlocked ? colors.success : colors.textSecondary}
                        opacity={0.9}
                      />
                      {landmark.unlocked && (
                        <SvgText
                          x={x}
                          y={y - 20}
                          fontSize="10"
                          fill={colors.text}
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          {landmark.name.split(' ')[0]}
                        </SvgText>
                      )}
                    </G>
                  );
                })}
                
                {/* Avatar with realistic positioning and glow */}
                <Circle
                  cx={avatarPosition.x}
                  cy={avatarPosition.y}
                  r={20}
                  fill="transparent"
                  stroke={colors.accent}
                  strokeWidth={2}
                  opacity={0.3}
                />
                <Circle
                  cx={avatarPosition.x}
                  cy={avatarPosition.y}
                  r={12}
                  fill={colors.accent}
                  stroke={colors.background}
                  strokeWidth={3}
                />
                <Circle
                  cx={avatarPosition.x}
                  cy={avatarPosition.y}
                  r={6}
                  fill={colors.background}
                />
              </G>
            </Svg>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Journey Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.statCardGradient}
              >
                <TrendingUp size={24} color={colors.text} />
                <Text style={styles.statValue}>{stats.totalDistance.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Total Distance (km)</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={[colors.success, '#4CAF50']}
                style={styles.statCardGradient}
              >
                <MapPin size={24} color={colors.text} />
                <Text style={styles.statValue}>{unlockedLandmarks.length}</Text>
                <Text style={styles.statLabel}>Landmarks Visited</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={[colors.accent, '#FF9800']}
                style={styles.statCardGradient}
              >
                <Trophy size={24} color={colors.text} />
                <Text style={styles.statValue}>{stats.achievementsUnlocked}</Text>
                <Text style={styles.statLabel}>Achievements</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={[colors.secondary, '#9C27B0']}
                style={styles.statCardGradient}
              >
                <Navigation size={24} color={colors.text} />
                <Text style={styles.statValue}>{stats.daysActive}</Text>
                <Text style={styles.statLabel}>Days Active</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Next Landmark */}
        {nextLandmark && (
          <View style={styles.nextLandmarkSection}>
            <Text style={styles.sectionTitle}>Next Destination</Text>
            <LinearGradient
              colors={[colors.card, colors.surface]}
              style={styles.landmarkCard}
            >
              <View style={styles.landmarkHeader}>
                <View style={styles.landmarkIcon}>
                  <MapPin size={20} color={colors.primary} />
                </View>
                <View style={styles.landmarkInfo}>
                  <Text style={styles.landmarkName}>{nextLandmark.name}</Text>
                  <Text style={styles.landmarkCategory}>{nextLandmark.category}</Text>
                </View>
              </View>
              <Text style={styles.landmarkDescription}>{nextLandmark.description}</Text>
              <View style={styles.landmarkProgress}>
                <Text style={styles.landmarkDistance}>
                  {nextLandmark.distanceFromStart - progress.distanceTraveled}km to go
                </Text>
                <View style={styles.landmarkProgressBar}>
                  <View 
                    style={[
                      styles.landmarkProgressFill,
                      { width: `${Math.min((progress.distanceTraveled / nextLandmark.distanceFromStart) * 100, 100)}%` }
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.landmarkFunFact}>💡 {nextLandmark.funFact}</Text>
            </LinearGradient>
          </View>
        )}

        {/* Recent Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {achievements
              .filter(a => a.unlocked)
              .slice(-3)
              .map(achievement => (
                <LinearGradient
                  key={achievement.id}
                  colors={[colors.card, colors.surface]}
                  style={styles.achievementCard}
                >
                  <Trophy size={20} color={colors.accent} />
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                </LinearGradient>
              ))}
          </ScrollView>
        </View>

        {/* Sync Button */}
        <TouchableOpacity 
          style={styles.syncButton} 
          onPress={handleSync}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.syncButtonGradient}
          >
            <Zap size={20} color={colors.text} />
            <Text style={styles.syncButtonText}>
              {isLoading ? 'Syncing...' : 'Sync with HealthKit'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  compactContainer: {
    marginVertical: 8,
  },
  compactCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
  },
  compactHeader: {
    marginBottom: 12,
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginLeft: 8,
  },
  compactSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  compactMapContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  compactStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactStatText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  progressPercentage: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  content: {
    padding: 20,
  },
  mapSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  mapControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoomButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  map: {
    borderRadius: 12,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text,
    textAlign: 'center',
    opacity: 0.9,
  },
  nextLandmarkSection: {
    marginBottom: 24,
  },
  landmarkCard: {
    borderRadius: 16,
    padding: 20,
  },
  landmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  landmarkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  landmarkInfo: {
    flex: 1,
  },
  landmarkName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 2,
  },
  landmarkCategory: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  landmarkDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  landmarkProgress: {
    marginBottom: 12,
  },
  landmarkDistance: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.primary,
    marginBottom: 8,
  },
  landmarkProgressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  landmarkProgressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  landmarkFunFact: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementCard: {
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 150,
    alignItems: 'center',
  },
  achievementTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  syncButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  syncButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  syncButtonText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginLeft: 8,
  },
}); 