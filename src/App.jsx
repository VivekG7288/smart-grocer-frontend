import React, { useContext, useEffect } from "react";
import OneSignal from "react-onesignal";
import "../style.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./contexts/AuthContext";
import AuthForm from "./components/AuthForm";
import ConsumerDashboard from "./components/ConsumerDashboard";
import ShopkeeperDashboard from "./components/ShopkeeperDashboard";

function App() {
    const { user, loading } = useContext(AuthContext);
    useEffect(() => {
        async function initOneSignal() {
            try {
                await OneSignal.init({
                    appId: "ca714e05-f86e-4fc7-be98-3028dae8b304",
                    safari_web_id:
                        "web.onesignal.auto.40e188d7-5f7a-4af3-8ac5-05427adc97a7",
                    notifyButton: {
                        enable: true,
                    },
                    allowLocalhostAsSecureOrigin: true,
                    serviceWorkerPath: "/OneSignalSDKWorker.js",
                });
                console.log("OneSignal initialized");
            } catch (err) {
                console.error("OneSignal init failed:", err);
            }
        }

        if (typeof window !== "undefined") {
            initOneSignal();
        }
    }, []);

    if (loading) {
        return <div className="loading-screen">Loading...</div>; // 👈 Prevent flicker
    }

    if (!user) {
        return (
            <BrowserRouter>
                <AuthForm />
            </BrowserRouter>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                {user.role === "CONSUMER" && (
                    <Route path="/*" element={<ConsumerDashboard />} />
                )}
                {user.role === "SHOPKEEPER" && (
                    <Route path="/*" element={<ShopkeeperDashboard />} />
                )}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
