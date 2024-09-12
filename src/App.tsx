import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Modal,
} from 'react-native';
import EventCard from './components/EventCard';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const initializeNotificationState = async () => {
      try {
        // Load notification state from AsyncStorage
        const storedState = await AsyncStorage.getItem('notificationsEnabled');
        const isEnabled = storedState === 'true';

        if (isEnabled) {
          // Check if permissions are still granted
          const permissionGranted = await checkPermissionStatus();
          if (permissionGranted) {
            // Retrieve the push token
            const token = await messaging().getToken();
            if (token) {
              setPushToken(token);
              setNotificationsEnabled(true);
            }
          } else {
            // Permissions have been revoked
            await disableNotifications(false);
          }
        }
      } catch (error) {
        console.error('Error initializing notification state:', error);
      }
    };
    initializeNotificationState();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      return enabled;
    } catch (error) {
      console.error('Error checking notification permission status:', error);
      return false;
    }
  };

  const handleEnableNotifications = async () => {
    if (!notificationsEnabled) {
      let permissionGranted = true;
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        // Request POST_NOTIFICATIONS permission
        permissionGranted = await requestAndroidNotificationPermission();
      }
      if (permissionGranted) {
        await requestFirebasePermission();
      }
    } else {
      // Disable notifications
      await disableNotifications(true);
    }
  };

  const requestAndroidNotificationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        showModal('Notification permission denied.');
        return false;
      }
    } catch (err) {
      console.warn('Error requesting POST_NOTIFICATIONS permission:', err);
      return false;
    }
  };

  const requestFirebasePermission = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        showModal('Notification permission granted.');
        await getPushToken();
        setNotificationsEnabled(true);
        // Save state to AsyncStorage
        await AsyncStorage.setItem('notificationsEnabled', 'true');
      } else {
        showModal('Notification permission denied.');
      }
    } catch (error) {
      console.error('Error requesting Firebase notification permission:', error);
    }
  };

  const getPushToken = async () => {
    try {
      const token = await messaging().getToken();
      setPushToken(token);
      await storeTokenToFirestore(token);
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  };

  const storeTokenToFirestore = async (token: string) => {
    try {
      await firestore().collection('pushTokens').doc(token).set({ token });
      // No modal shown to the user
    } catch (error) {
      console.error('Error storing push token in Firestore:', error);
    }
  };

  const disableNotifications = async (showModalMessage: boolean) => {
    try {
      // Delete the push token
      await messaging().deleteToken();
      // Remove the token from Firestore if you have stored it
      if (pushToken) {
        await firestore().collection('pushTokens').doc(pushToken).delete();
      }
      setPushToken(null);
      setNotificationsEnabled(false);
      // Remove state from AsyncStorage
      await AsyncStorage.removeItem('notificationsEnabled');
      if (showModalMessage) {
        showModal('Notifications have been disabled.');
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      if (showModalMessage) {
        showModal('An error occurred while disabling notifications.');
      }
    }
  };

  const showModal = (message: string) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalMessage('');
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
            notificationsEnabled && styles.notificationButtonDisabled,
          ]}
          onPress={handleEnableNotifications}
        >
          <Text style={styles.buttonText}>
            {notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Modal */}
      {modalVisible && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalText}>{modalMessage}</Text>
              <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
    backgroundColor: '#3b82f6', // Blue color for "Enable Notifications"
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 12,
    marginTop: 20,
  },
  notificationButtonDisabled: {
    backgroundColor: '#ef4444', // Red color for "Disable Notifications"
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20, // Rounded corners
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 30,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: 'black',
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
