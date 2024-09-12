import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import EventCard from './components/EventCard';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { PermissionsAndroid, Platform } from 'react-native';

export default function App() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Check notification permission and token on mount
    const checkNotificationPermission = async () => {
      const authStatus = await messaging().hasPermission();
      if (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      ) {
        await getPushToken(); // If permission is granted, get the token
        setNotificationsEnabled(true); // Set notifications as enabled
      } else {
        setNotificationsEnabled(false); // Notifications disabled
      }
    };

    checkNotificationPermission();
  }, []);

  // Request notification permission from the system
  const requestPermission = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      if (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      ) {
        Alert.alert('Notification permission granted.');
        await getPushToken();
        setNotificationsEnabled(true); // Enable notifications after permission granted
      } else {
        Alert.alert('Notification permission denied.');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  const getPushToken = async () => {
    try {
      const token = await messaging().getToken();
      setPushToken(token);
      await storeTokenToFirestore(token); // Store token in Firestore if notifications are enabled
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  };

  // Store push token in Firestore
  const storeTokenToFirestore = async (token: string) => {
    try {
      await firestore()
        .collection('pushTokens')
        .doc(token)
        .set({ token });
      Alert.alert('Notifications enabled!');
    } catch (error) {
      console.error('Error storing push token in Firestore:', error);
    }
  };

  // Handle enabling/disabling notifications
  const handleEnableDisableNotifications = async () => {
    if (!notificationsEnabled) {
      await requestPermission();
    } else {
      // If notifications are already enabled, disable them and remove the token
      Alert.alert('Notifications disabled.');
      setNotificationsEnabled(false);
      if (pushToken) {
        await firestore().collection('pushTokens').doc(pushToken).delete(); // Remove the push token
        setPushToken(null);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.eventsContainer}>
        {/* Upper Event Card */}
        <EventCard
          logoSrc={require('./assets/ch.png')}
          eventName="Cryptic Hunt"
          apiEndpoint="https://track.cryptichunt.in/seats1"
          totalSeats={800}
        />
        {/* Lower Event Card */}
        <EventCard
          logoSrc={require('./assets/cx.png')}
          eventName="Codex Cryptum"
          apiEndpoint="https://track.cryptichunt.in/seats2"
          totalSeats={200}
        />

        {/* Notification Button */}
        <TouchableOpacity
          style={[
            styles.notificationButton,
            { backgroundColor: notificationsEnabled ? '#f87171' : '#3b82f6' }, // Toggle button color
          ]}
          onPress={handleEnableDisableNotifications}
        >
          <Text style={styles.buttonText}>
            {notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  eventsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  notificationButton: {
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
