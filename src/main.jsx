import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { registerSW } from "virtual:pwa-register"; // <-- vite-plugin-pwa helper

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
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>
);
