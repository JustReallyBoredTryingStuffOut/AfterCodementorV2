import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { useWorkoutStore } from "@/store/workoutStore";
import { useTheme } from "@/context/ThemeContext";

interface TimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  isRunning: boolean;
  onPause?: () => void;
  onResume?: () => void;
}

// Voice configuration for a more natural female voice
const voiceConfig = {
  language: 'en-US',
  pitch: 1.0,
  rate: 0.9,
};

// Helper function to speak with the default voice
const speakWithDefaultVoice = (text: string) => {
  if (Platform.OS === 'web') return;
  
  Speech.speak(text, voiceConfig);
};

export default function Timer({ initialSeconds, onComplete, isRunning, onPause, onResume }: TimerProps) {
  const { colors } = useTheme();
  const { timerSettings } = useWorkoutStore();
  
  const [seconds, setSeconds] = useState(initialSeconds);
  const [paused, setPaused] = useState(!isRunning);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenSecond = useRef<number | null>(null);
  const hasAnnouncedComplete = useRef(false);

  // Only set initial seconds when the timer is (re)started
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  // Reset lastSpokenSecond and hasAnnouncedComplete only on mount (or when Timer is re-mounted with a new key)
  useEffect(() => {
    lastSpokenSecond.current = null;
    hasAnnouncedComplete.current = false;
  }, []);

  useEffect(() => {
    if (isRunning && !paused) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, paused]);

  // Voice countdown and haptic feedback for last 10 seconds
  useEffect(() => {
    if (!timerSettings.voicePrompts) return;
    if (Platform.OS === 'web') return;
    if (seconds > 0 && seconds <= 10) {
      if (lastSpokenSecond.current !== seconds) {
        speakWithDefaultVoice(seconds.toString());
        lastSpokenSecond.current = seconds;
      }
    }
    if (seconds === 0 && !hasAnnouncedComplete.current) {
      speakWithDefaultVoice('Rest complete. Ready for next set.');
      Vibration.vibrate(500);
      hasAnnouncedComplete.current = true;
      if (onComplete) onComplete();
    }
  }, [seconds, timerSettings.voicePrompts, onComplete]);

  const handlePause = () => {
    setPaused(true);
    onPause && onPause();
  };

  const handleResume = () => {
    setPaused(false);
    onResume && onResume();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatTime(seconds)}</Text>
      <View style={styles.controls}>
        {paused ? (
          <TouchableOpacity onPress={handleResume} style={styles.controlButton}>
            <Ionicons name="play" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handlePause} style={styles.controlButton}>
            <Ionicons name="pause" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  time: {
    fontSize: 48,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});