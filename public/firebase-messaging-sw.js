// Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCDFlFfH8v9vPqnjOqRIqUuh9GsqF_252w",
  authDomain: "smart-grocer-90714.firebaseapp.com",
  projectId: "smart-grocer-90714",
  storageBucket: "smart-grocer-90714.firebasestorage.app",
  messagingSenderId: "980993250745",
  appId: "1:980993250745:web:d394ecd25341e620285268",
  measurementId: "G-PSS4CEYCN4"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg', // Replace with your app icon
    badge: '/vite.svg', // Replace with your notification badge
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});