import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig } from '../config/firebase';
import api from '../api/api';

class FirebaseMessaging {
  constructor() {
    if (!this.app) {
      this.app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(this.app);
    }
  }

  async requestPermission(userId) {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Get registration token. Initially this makes a network call
      const token = await this.getFCMToken();
      if (token) {
        console.log('FCM Registration Token:', token);
        // Save token to backend
        await this.saveTokenToServer(userId, token);
        return token;
      }
    } catch (err) {
      console.error('Failed to get FCM token:', err);
      return null;
    }
  }

  async getFCMToken() {
    try {
      // Get registration token. Initially this makes a network call
      const token = await getToken(this.messaging, {
        vapidKey: "BKagOny0KF_2pCJQ3m__6yL8KhxGmdOHfz-4CKKH3lrKYTlmrqk3cddwNyVDh9A1UjHOxI4Gj_Y4SbXETn4hOwo" // Your VAPID key here
      });
      
      if (token) {
        return token;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    } catch (err) {
      console.error('An error occurred while retrieving token:', err);
      return null;
    }
  }

  async saveTokenToServer(userId, token) {
    try {
      const response = await api.post('/users/fcm-token', { userId, token });
      console.log('FCM token saved to server:', response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to save FCM token to server:', err);
      throw err;
    }
  }

  onForegroundMessage(callback) {
    return onMessage(this.messaging, (payload) => {
      console.log('Received foreground message:', payload);
      // Create notification
      const { title, body } = payload.notification || {};
      if (title) {
        new Notification(title, {
          body,
          icon: '/vite.svg' // Your app icon
        });
      }
      if (callback) callback(payload);
    });
  }
}

// Create a singleton instance
export const firebaseMessaging = new FirebaseMessaging();
export default firebaseMessaging;