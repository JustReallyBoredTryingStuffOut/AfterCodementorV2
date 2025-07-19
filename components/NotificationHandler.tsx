import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

export default function NotificationHandler() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Handle water reminder notifications
      if (data?.type === 'water_reminder') {
        // Navigate directly to the water intake screen
        router.push('/water-intake');
      }
    });

    return () => subscription.remove();
  }, [router]);

  return null; // This component doesn't render anything
} 