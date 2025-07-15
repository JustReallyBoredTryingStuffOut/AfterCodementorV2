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

  // Realistic Norway outline with proper shape
  const norwayPath = `
    M ${mapWidth * 0.1} ${mapHeight * 0.9}
    L ${mapWidth * 0.15} ${mapHeight * 0.85}
    L ${mapWidth * 0.2} ${mapHeight * 0.8}
    L ${mapWidth * 0.25} ${mapHeight * 0.75}
    L ${mapWidth * 0.3} ${mapHeight * 0.7}
    L ${mapWidth * 0.35} ${mapHeight * 0.65}
    L ${mapWidth * 0.4} ${mapHeight * 0.6}
    L ${mapWidth * 0.45} ${mapHeight * 0.55}
    L ${mapWidth * 0.5} ${mapHeight * 0.5}
    L ${mapWidth * 0.55} ${mapHeight * 0.45}
    L ${mapWidth * 0.6} ${mapHeight * 0.4}
    L ${mapWidth * 0.65} ${mapHeight * 0.35}
    L ${mapWidth * 0.7} ${mapHeight * 0.3}
    L ${mapWidth * 0.75} ${mapHeight * 0.25}
    L ${mapWidth * 0.8} ${mapHeight * 0.2}
    L ${mapWidth * 0.85} ${mapHeight * 0.15}
    L ${mapWidth * 0.9} ${mapHeight * 0.1}
    L ${mapWidth * 0.92} ${mapHeight * 0.08}
    L ${mapWidth * 0.9} ${mapHeight * 0.05}
    L ${mapWidth * 0.85} ${mapHeight * 0.03}
    L ${mapWidth * 0.8} ${mapHeight * 0.02}
    L ${mapWidth * 0.75} ${mapHeight * 0.01}
    L ${mapWidth * 0.7} ${mapHeight * 0.005}
    L ${mapWidth * 0.65} ${mapHeight * 0.01}
    L ${mapWidth * 0.6} ${mapHeight * 0.02}
    L ${mapWidth * 0.55} ${mapHeight * 0.03}
    L ${mapWidth * 0.5} ${mapHeight * 0.05}
    L ${mapWidth * 0.45} ${mapHeight * 0.08}
    L ${mapWidth * 0.4} ${mapHeight * 0.12}
    L ${mapWidth * 0.35} ${mapHeight * 0.18}
    L ${mapWidth * 0.3} ${mapHeight * 0.25}
    L ${mapWidth * 0.25} ${mapHeight * 0.35}
    L ${mapWidth * 0.2} ${mapHeight * 0.45}
    L ${mapWidth * 0.15} ${mapHeight * 0.6}
    L ${mapWidth * 0.12} ${mapHeight * 0.75}
    L ${mapWidth * 0.1} ${mapHeight * 0.9}
    Z
  `;

  // Major fjords and geographical features
  const fjords = [
    // Sognefjord (longest fjord)
    `M ${mapWidth * 0.35} ${mapHeight * 0.6} L ${mapWidth * 0.3} ${mapHeight * 0.55} L ${mapWidth * 0.25} ${mapHeight * 0.5}`,
    // Hardangerfjord
    `M ${mapWidth * 0.45} ${mapHeight * 0.55} L ${mapWidth * 0.4} ${mapHeight * 0.5} L ${mapWidth * 0.35} ${mapHeight * 0.45}`,
    // Trondheimsfjord
    `M ${mapWidth * 0.55} ${mapHeight * 0.4} L ${mapWidth * 0.5} ${mapHeight * 0.35} L ${mapWidth * 0.45} ${mapHeight * 0.3}`,
    // Oslofjord
    `M ${mapWidth * 0.6} ${mapHeight * 0.35} L ${mapWidth * 0.55} ${mapHeight * 0.3} L ${mapWidth * 0.5} ${mapHeight * 0.25}`,
  ];

  // Mountain ranges
  const mountains = [
    // Jotunheimen (highest mountains)
    `M ${mapWidth * 0.35} ${mapHeight * 0.55} L ${mapWidth * 0.4} ${mapHeight * 0.5} L ${mapWidth * 0.45} ${mapHeight * 0.55}`,
    // Dovrefjell
    `M ${mapWidth * 0.55} ${mapHeight * 0.35} L ${mapWidth * 0.6} ${mapHeight * 0.3} L ${mapWidth * 0.65} ${mapHeight * 0.35}`,
    // Rondane
    `M ${mapWidth * 0.5} ${mapHeight * 0.4} L ${mapWidth * 0.55} ${mapHeight * 0.35} L ${mapWidth * 0.6} ${mapHeight * 0.4}`,
  ];

  // Major cities and landmarks
  const cities = [
    { name: 'Oslo', x: mapWidth * 0.6, y: mapHeight * 0.3, unlocked: true },
    { name: 'Bergen', x: mapWidth * 0.35, y: mapHeight * 0.55, unlocked: false },
    { name: 'Trondheim', x: mapWidth * 0.55, y: mapHeight * 0.35, unlocked: false },
    { name: 'Stavanger', x: mapWidth * 0.4, y: mapHeight * 0.65, unlocked: false },
    { name: 'Tromsø', x: mapWidth * 0.75, y: mapHeight * 0.15, unlocked: false },
    { name: 'Bodø', x: mapWidth * 0.65, y: mapHeight * 0.25, unlocked: false },
  ];

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel / 1.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
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
                
                {/* Cities */}
                {cities.map((city, index) => (
                  <G key={`city-${index}`}>
                    <Circle
                      cx={city.x}
                      cy={city.y}
                      r={city.unlocked ? 4 : 3}
                      fill={city.unlocked ? colors.primary : "#666"}
                      stroke="#FFFFFF"
                      strokeWidth={1}
                    />
                    {city.unlocked && (
                      <SvgText
                        x={city.x}
                        y={city.y - 8}
                        fontSize={10}
                        fill={colors.text}
                        textAnchor="middle"
                        fontFamily={fonts.regular}
                      >
                        {city.name}
                      </SvgText>
                    )}
                  </G>
                ))}
                
                {/* Avatar */}
                <Circle
                  cx={avatarPosition.x}
                  cy={avatarPosition.y}
                  r={6}
                  fill={colors.primary}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                <Circle
                  cx={avatarPosition.x}
                  cy={avatarPosition.y}
                  r={10}
                  fill={colors.primary}
                  opacity={0.3}
                />
              </G>
            </Svg>
          </View>
          
          <View style={styles.compactStats}>
            <View style={styles.compactStat}>
              <Trophy size={12} color={colors.primary} />
              <Text style={styles.compactStatText}>
                {unlockedLandmarks.length}/{landmarks.length} landmarks
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
            onPress={handleZoomOut}
          >
            <ZoomOut size={16} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>{Math.round(zoomLevel * 100)}%</Text>
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
          
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: colors.primary }]}
            onPress={handleSync}
            disabled={isLoading}
          >
            <Zap size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mapContainer}>
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
          
          <G
            transform={`scale(${zoomLevel}) translate(${panOffset.x}, ${panOffset.y})`}
            transformOrigin={`${mapWidth / 2} ${mapHeight / 2}`}
          >
            {/* Norway outline with realistic coloring */}
            <Path
              d={norwayPath}
              fill="url(#norwayGradient)"
              stroke={colors.primary}
              strokeWidth={2 / zoomLevel}
            />
            
            {/* Mountain ranges */}
            {mountains.map((mountain, index) => (
              <Path
                key={`mountain-${index}`}
                d={mountain}
                fill="url(#mountainGradient)"
                stroke="#FFFFFF"
                strokeWidth={1 / zoomLevel}
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
                strokeWidth={1 / zoomLevel}
                opacity={0.7}
              />
            ))}
            
            {/* Cities */}
            {cities.map((city, index) => (
              <G key={`city-${index}`}>
                <Circle
                  cx={city.x}
                  cy={city.y}
                  r={city.unlocked ? 6 / zoomLevel : 4 / zoomLevel}
                  fill={city.unlocked ? colors.primary : "#666"}
                  stroke="#FFFFFF"
                  strokeWidth={1 / zoomLevel}
                />
                {city.unlocked && (
                  <SvgText
                    x={city.x}
                    y={city.y - 10 / zoomLevel}
                    fontSize={12 / zoomLevel}
                    fill={colors.text}
                    textAnchor="middle"
                    fontFamily={fonts.regular}
                  >
                    {city.name}
                  </SvgText>
                )}
              </G>
            ))}
            
            {/* Avatar */}
            <Circle
              cx={avatarPosition.x}
              cy={avatarPosition.y}
              r={8 / zoomLevel}
              fill={colors.primary}
              stroke="#FFFFFF"
              strokeWidth={2 / zoomLevel}
            />
            <Circle
              cx={avatarPosition.x}
              cy={avatarPosition.y}
              r={15 / zoomLevel}
              fill={colors.primary}
              opacity={0.3}
            />
          </G>
        </Svg>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Navigation size={20} color={colors.primary} />
          <Text style={styles.statValue}>{progress.distanceTraveled.toFixed(1)}km</Text>
          <Text style={styles.statLabel}>Distance Traveled</Text>
        </View>
        
        <View style={styles.statCard}>
          <MapPin size={20} color={colors.primary} />
          <Text style={styles.statValue}>{unlockedLandmarks.length}/{landmarks.length}</Text>
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
            {((nextLandmark.distance - progress.distanceTraveled) * 1000).toFixed(0)}m to go
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
    paddingHorizontal: 20,
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
    gap: 10,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomIndicator: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  mapContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  map: {
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