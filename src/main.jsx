import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { registerSW } from "virtual:pwa-register";

/*
 * Registers the Service Worker for the app.
 *
 * - onNeedRefresh(): Triggered when a new version of the app is available.
 *   The service worker has updated files ready, but they won't apply until
 *   the page is refreshed. Here we simply log a message, but you can replace
 *   it with a UI prompt (e.g., a toast/button) to let the user refresh.
 *
 * - onOfflineReady(): Triggered when the app is fully cached and can run
 *   offline. This means the required assets have been stored and the user
 *   can now access the app without internet.
 *
 * Overall, this helps the app behave like a PWA — supporting offline use
 * and detecting updates for smoother user experience.
 */
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
