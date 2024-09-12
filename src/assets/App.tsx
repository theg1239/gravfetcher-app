import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import EventCard from './components/EventCard';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';

export default function App() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const authStatus = await messaging().hasPermission();
        if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
          console.log('Notification permission already granted');
          await getPushToken();
        } else {
          console.log('Notification permission not granted yet');
        }
      } catch (error) {
        console.error('Error checking notification permission:', error);
      }
    };
    checkPermission();
  }, []);

  const requestPermission = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      if (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      ) {
        console.log('Notification permission granted');
        Alert.alert('Notification permission granted.');
        await getPushToken();
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
      if (token) {
        console.log('Push token received:', token);
        setPushToken(token);
        await storeTokenToFirestore(token);
      } else {
        console.log('No push token received');
      }
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  };

  const storeTokenToFirestore = async (token: string) => {
    try {
      console.log('Storing push token to Firestore:', token);
      await firestore().collection('pushTokens').doc(token).set({ token });
      console.log('Push token successfully stored to Firestore');
      Alert.alert('Notifications enabled!');
    } catch (error) {
      console.error('Error storing push token in Firestore:', error);
      Alert.alert('Error storing push token:', error.message);
    }
  };

  const handleEnableNotifications = async () => {
    if (!notificationsEnabled) {
      await requestPermission();
      setNotificationsEnabled(true);
    } else {
      Alert.alert('Notifications are already enabled.');
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
          style={[styles.notificationButton, notificationsEnabled && styles.buttonEnabled]}
          onPress={handleEnableNotifications}
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
    backgroundColor: '#3b82f6', // Blue background
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonEnabled: {
    backgroundColor: 'red', // Change button color to red when enabled
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
