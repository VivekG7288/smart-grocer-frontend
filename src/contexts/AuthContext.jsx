// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import api from "../api/api";
import { firebaseMessaging } from "../utils/firebaseMessaging";

export const AuthContext = createContext();
// 👉 NEW helper for OneSignal login
function loginToOneSignal(userId) {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
        try {
            await OneSignal.login(userId);
            console.log("OneSignal logged in:", userId);
        } catch (err) {
            console.error("OneSignal login failed:", err);
        }
    });
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(function (OneSignal) {
            OneSignal.init({
                appId: "ca714e05-f86e-4fc7-be98-3028dae8b304",
                allowLocalhostAsSecureOrigin: true,
                notifyButton: { enable: true },
            });
        });
    }, []);

    // 🔹 Restore user session if already logged in
    useEffect(() => {
        const loadUser = async () => {
            try {
                const savedUser = localStorage.getItem("user");
                if (savedUser) {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);

                    // 👉 Important: Also login to OneSignal on reload
                    loginToOneSignal(parsedUser._id);

                    // Firebase setup (optional)
                    try {
                        await firebaseMessaging.requestPermission(
                            parsedUser._id
                        );
                        firebaseMessaging.onForegroundMessage((payload) => {
                            const { title, body } = payload.notification;
                            new Notification(title, { body });
                        });
                    } catch (err) {
                        console.warn(
                            "Firebase messaging init failed:",
                            err.message
                        );
                    }
                }
            } catch (err) {
                console.error("Error restoring user:", err);
                localStorage.removeItem("user");
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    // 🔹 Signup
    const signup = async (data) => {
        const res = await api.post("/auth/register", data);
        return res.data;
    };

    // 🔹 Login
    const login = async (credentials) => {
        const res = await api.post("/auth/login", credentials, {
            withCredentials: true,
        });
        const loggedUser = res.data;

        localStorage.setItem("user", JSON.stringify(loggedUser));
        setUser(loggedUser);

        // 👉 OneSignal Login (IMPORTANT)
        loginToOneSignal(loggedUser._id);

        // Firebase notification setup
        try {
            await firebaseMessaging.requestPermission(loggedUser._id);
            firebaseMessaging.onForegroundMessage((payload) => {
                const { title, body } = payload.notification;
                new Notification(title, { body });
            });
        } catch (err) {
            console.error("Failed to initialize Firebase messaging:", err);
        }

        return loggedUser;
    };

    const logout = () => {
        localStorage.removeItem("user");
        setUser(null);

        // 👉 Logout from OneSignal too
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function (OneSignal) {
            await OneSignal.logout();
            console.log("OneSignal logged out");
        });
    };

    return (
        <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
