import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { registerSW } from "virtual:pwa-register"; // <-- vite-plugin-pwa helper

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "YOUR_CLIENT_ID.apps.googleusercontent.com";

// ✅ Register the PWA Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.log("New content available; please refresh.");
  },
  onOfflineReady() {
    console.log("App ready to work offline!");
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
