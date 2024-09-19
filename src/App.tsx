import * as React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Provider as PaperProvider,
  DefaultTheme,
  Button,
  Portal,
  Dialog,
  Paragraph,
} from 'react-native-paper';
import EventCard from './components/EventCard';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height, width } = Dimensions.get('window');

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3b82f6',
    accent: '#03dac4',
    background: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <MainApp />
    </PaperProvider>
  );
}

function MainApp() {
  const [pushToken, setPushToken] = React.useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState<boolean>(false);
  const [modalVisible, setModalVisible] = React.useState<boolean>(false);
  const [modalMessage, setModalMessage] = React.useState<string>('');

  React.useEffect(() => {
    const initializeNotificationState = async () => {
      try {
        const storedState = await AsyncStorage.getItem('notificationsEnabled');
        const isEnabled = storedState === 'true';

        if (isEnabled) {
          const permissionGranted = await checkPermissionStatus();
          if (permissionGranted) {
            const token = await messaging().getToken();
            if (token) {
              setPushToken(token);
              setNotificationsEnabled(true);
            }
          } else {
            await disableNotifications(false);
          }
        }
      } catch (error) {
        console.error('Error initializing notification state:', error);
      }
    };
    initializeNotificationState();
  }, []);

  const checkPermissionStatus = async (): Promise<boolean> => {
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
        permissionGranted = await requestAndroidNotificationPermission();
      }
      if (permissionGranted) {
        await requestFirebasePermission();
      }
    } else {
      await disableNotifications(true);
    }
  };

  const requestAndroidNotificationPermission = async (): Promise<boolean> => {
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
    } catch (error) {
      console.error('Error storing push token in Firestore:', error);
    }
  };

  const disableNotifications = async (showModalMessage: boolean) => {
    try {
      await messaging().deleteToken();
      if (pushToken) {
        await firestore().collection('pushTokens').doc(pushToken).delete();
      }
      setPushToken(null);
      setNotificationsEnabled(false);
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
        <EventCard
          logoSrc={require('./assets/ch.png')}
          eventName="Cryptic Hunt"
          apiEndpoint="https://track.cryptichunt.in/seats1"
          totalSeats={800}
        />
        <EventCard
          logoSrc={require('./assets/cx.png')}
          eventName="Codex Cryptum"
          apiEndpoint="https://track.cryptichunt.in/seats2"
          totalSeats={120}
        />

        <Button
          mode="contained"
          onPress={handleEnableNotifications}
          style={styles.notificationButton}
          accessibilityLabel="Toggle Notifications"
        >
          {notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
        </Button>
      </ScrollView>

      <Portal>
        <Dialog visible={modalVisible} onDismiss={closeModal}>
          <Dialog.Content>
            <Paragraph>{modalMessage}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeModal}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  eventsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  notificationButton: {
    marginVertical: 20,
    alignSelf: 'center',
    width: '80%',
  },
});
