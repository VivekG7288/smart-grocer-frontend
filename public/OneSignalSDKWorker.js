// Proxy service worker loader for OneSignal
// This file must be present at the site root: /OneSignalSDKWorker.js
// It forwards to OneSignal's CDN worker. Do NOT change the filename.
try {
  importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');
} catch (e) {
  console.error('Failed to import OneSignalSDKWorker from CDN', e);
}
