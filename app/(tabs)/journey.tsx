import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { JourneyMap } from '../../components/JourneyMap';
import { useJourneyStore } from '../../store/journeyStore';
import { colors } from '../../constants/colors';

export default function JourneyScreen() {
  const { initializeJourney } = useJourneyStore();

  useEffect(() => {
    // Initialize journey when component mounts
    initializeJourney();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <JourneyMap />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
}); 