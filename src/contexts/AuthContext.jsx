// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import api from "../api/api";
import { firebaseMessaging } from "../utils/firebaseMessaging";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // 👈 NEW state

    useEffect(() => {
        const loadUser = async () => {
            try {
                const savedUser = localStorage.getItem("user");
                if (savedUser) {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);

                    // Optional: Initialize Firebase for restored session
                    try {
                        await firebaseMessaging.requestPermission(
                            parsedUser._id
                        );
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

    const signup = async (data) => {
        const res = await api.post("/auth/register", data);
        return res.data;
    };

    const login = async (credentials) => {
        const res = await api.post("/auth/login", credentials, {
            withCredentials: true,
        });
        const loggedUser = res.data;

        localStorage.setItem("user", JSON.stringify(loggedUser));
        setUser(loggedUser);

        try {
            await firebaseMessaging.requestPermission(loggedUser._id);
        } catch (err) {
            console.error("Failed to initialize Firebase messaging:", err);
        }

        return loggedUser;
    };

    const logout = () => {
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
