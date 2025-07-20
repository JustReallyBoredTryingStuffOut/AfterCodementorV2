import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Alert, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, Play, Pause, RotateCcw, Watch } from 'lucide-react-native';
import AppleWatch from '@/src/NativeModules/AppleWatch';

interface RestTimerModalProps {
  visible: boolean;
  onClose: () => void;
  duration: number; // in seconds
  onComplete?: () => void;
}

export default function RestTimerModal({ visible, onClose, duration, onComplete }: RestTimerModalProps) {
  const { colors } = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isAppleWatchConnected, setIsAppleWatchConnected] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const countdownAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setTimeLeft(duration);
      setIsRunning(false);
      setShowCountdown(false);
      checkAppleWatchConnection();
    }
  }, [visible, duration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          
          // Check if we should show countdown (last 10 seconds)
          if (newTime <= 10 && newTime > 0 && !showCountdown) {
            setShowCountdown(true);
            animateCountdown();
          }
          
          // Check if timer completed
          if (newTime <= 0) {
            handleTimerComplete();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft, showCountdown]);

  const checkAppleWatchConnection = async () => {
    if (Platform.OS === 'ios') {
      try {
        const isReachable = await AppleWatch.isAppleWatchReachable();
        setIsAppleWatchConnected(isReachable);
      } catch (error) {
        console.error('Error checking Apple Watch connection:', error);
        setIsAppleWatchConnected(false);
      }
    }
  };

  const startTimer = async () => {
    setIsRunning(true);
    
    // Start timer on Apple Watch if connected
    if (Platform.OS === 'ios' && isAppleWatchConnected) {
      try {
        await AppleWatch.startRestTimerOnWatch(timeLeft);
      } catch (error) {
        console.error('Error starting timer on Apple Watch:', error);
      }
    }
    
    // Animate the start
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pauseTimer = async () => {
    setIsRunning(false);
    
    // Stop timer on Apple Watch if connected
    if (Platform.OS === 'ios' && isAppleWatchConnected) {
      try {
        await AppleWatch.stopRestTimerOnWatch();
      } catch (error) {
        console.error('Error stopping timer on Apple Watch:', error);
      }
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    setShowCountdown(false);
    
    // Stop timer on Apple Watch if connected
    if (Platform.OS === 'ios' && isAppleWatchConnected) {
      try {
        AppleWatch.stopRestTimerOnWatch();
      } catch (error) {
        console.error('Error stopping timer on Apple Watch:', error);
      }
    }
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    setShowCountdown(false);
    
    // Stop timer on Apple Watch if connected
    if (Platform.OS === 'ios' && isAppleWatchConnected) {
      try {
        await AppleWatch.stopRestTimerOnWatch();
        await AppleWatch.announceRestComplete();
      } catch (error) {
        console.error('Error completing timer on Apple Watch:', error);
      }
    }
    
    // Animate completion
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Call completion callback
    if (onComplete) {
      onComplete();
    }
    
    // Auto-close after 2 seconds
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const animateCountdown = () => {
    Animated.sequence([
      Animated.timing(countdownAnim, {
        toValue: 1.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(countdownAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return 1 - (timeLeft / duration);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
        <Animated.View 
          style={[
            styles.container, 
            { 
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Rest Timer
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Apple Watch Status */}
          {Platform.OS === 'ios' && (
            <View style={styles.watchStatus}>
              <Watch size={16} color={isAppleWatchConnected ? colors.primary : colors.textSecondary} />
              <Text style={[styles.watchStatusText, { color: colors.textSecondary }]}>
                {isAppleWatchConnected ? 'Apple Watch Connected' : 'Apple Watch Not Connected'}
              </Text>
            </View>
          )}

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            {showCountdown ? (
              <Animated.View style={{ transform: [{ scale: countdownAnim }] }}>
                <Text style={[styles.countdownText, { color: colors.primary }]}>
                  {timeLeft}
                </Text>
              </Animated.View>
            ) : (
              <Text style={[styles.timerText, { color: colors.text }]}>
                {formatTime(timeLeft)}
              </Text>
            )}
          </View>

          {/* Progress Ring */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressRing, { borderColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: colors.primary,
                    width: `${getProgress() * 100}%`
                  }
                ]} 
              />
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, { borderColor: colors.border }]}
              onPress={resetTimer}
            >
              <RotateCcw size={20} color={colors.text} />
              <Text style={[styles.controlButtonText, { color: colors.text }]}>
                Reset
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              onPress={isRunning ? pauseTimer : startTimer}
            >
              {isRunning ? (
                <Pause size={24} color="white" />
              ) : (
                <Play size={24} color="white" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <X size={20} color={colors.text} />
              <Text style={[styles.controlButtonText, { color: colors.text }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  watchStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  watchStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  countdownText: {
    fontSize: 72,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressRing: {
    width: 200,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});