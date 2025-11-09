// Proxy service worker loader for OneSignal updater
// This file must be present at the site root: /OneSignalSDKUpdaterWorker.js
// It forwards to OneSignal's CDN updater worker. Do NOT change the filename.
try {
  importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKUpdaterWorker.js');
} catch (e) {
  console.error('Failed to import OneSignalSDKUpdaterWorker from CDN', e);
}
