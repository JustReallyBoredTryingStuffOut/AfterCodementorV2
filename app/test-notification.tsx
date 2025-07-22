import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNotificationPermission } from '../hooks/useNotificationPermission';
import NotificationPermissionModal from '../components/NotificationPermissionModal';

export default function TestNotificationScreen() {
  const {
    showPermissionModal,
    handlePermissionGranted,
    handlePermissionDeclined,
    requestPermissionManually,
    checkPermissionStatus,
  } = useNotificationPermission();

  const handleTestPermission = async () => {
    const status = await checkPermissionStatus();
    console.log('Current permission status:', status);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Permission Test</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={handleTestPermission}
      >
        <Text style={styles.buttonText}>Check Permission Status</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={requestPermissionManually}
      >
        <Text style={styles.buttonText}>Request Permission Manually</Text>
      </TouchableOpacity>
      
      <Text style={styles.status}>
        Modal Visible: {showPermissionModal ? 'Yes' : 'No'}
      </Text>
      
      {/* Notification Permission Modal */}
      <NotificationPermissionModal
        visible={showPermissionModal}
        onClose={handlePermissionDeclined}
        onPermissionGranted={handlePermissionGranted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
  },
}); 