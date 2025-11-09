import React, { createContext, useState, useEffect } from "react";
import api from "../api/api";

/*
 * Creates a new Context for authentication data and functions.
 *
 * AuthContext will allow components in the app to access and share
 * authentication-related state (like the logged-in user, login/logout methods)
 * without needing to pass props manually through multiple components.
 *
 * Later, this context will be used with a Provider (AuthProvider)
 * to wrap the app and supply auth state to all child components.
 */
export const AuthContext = createContext();


export function AuthProvider({ children }) {
    // Stores the current logged-in user
    const [user, setUser] = useState(null);

    /*
     * On initial app load:
     * - Check if a user exists in localStorage
     * - If yes, restore login state
     * This keeps the user logged in after a page refresh.
     */
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem("user");
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                setUser(parsed);

                // Register OneSignal for an already-logged-in user
                if (typeof window !== 'undefined') {
                    registerOneSignal(parsed._id).catch((e) => {
                        // non-blocking
                        console.debug('OneSignal register error (init):', e?.message || e);
                    });
                }
            }
        } catch (err) {
            console.error("Error reading user from storage:", err);
            localStorage.removeItem("user");
        }
    }, []);

    /*
     * Signup function:
     * Registers a new user by sending signup data to backend.
     * Note: This does not auto-login the user.
     */
    const signup = async (data) => {
        const res = await api.post("/auth/register", data);
        return res.data;
    };

    /*
     * Login function:
     * - Sends login credentials to backend
     * - Saves returned user data to state & localStorage
     * - Sets withCredentials to allow cookies (session token)
     */
    const login = async (credentials) => {
        const res = await api.post("/auth/login", credentials, { withCredentials: true });
        
        const loggedUser = res.data;
        console.log("API login response:", loggedUser);
        
        localStorage.setItem("user", JSON.stringify(loggedUser));
        setUser(loggedUser);

        // Register OneSignal for push notifications (non-blocking)
        if (typeof window !== 'undefined') {
            registerOneSignal(loggedUser._id).catch((e) => {
                console.debug('OneSignal register error (login):', e?.message || e);
            });
        }
        return loggedUser;
    };

    // Register OneSignal and send playerId to backend
    const registerOneSignal = async (userId) => {
        try {
            const appId = (import.meta.env && import.meta.env.VITE_ONESIGNAL_APP_ID) || '76eb459e-8e91-47ce-8fba-f551244b0363';

            if (!window.OneSignal) {
                console.warn('OneSignal SDK not loaded');
                return;
            }

            window.OneSignal = window.OneSignal || [];
            await new Promise((resolve) => {
                window.OneSignal.push(() => {
                    try {
                        window.OneSignal.init({
                            appId,
                            allowLocalhostAsSecureOrigin: true,
                        });
                    } catch (e) {
                        console.debug('OneSignal init error:', e?.message || e);
                    }
                    resolve();
                });
            });

            // Request permission and get player id
            const playerId = await window.OneSignal.getUserId();
            if (!playerId) {
                // ask for permission
                try {
                    await window.OneSignal.showNativePrompt();
                } catch (e) {}
            }

            const finalId = await window.OneSignal.getUserId();
            if (finalId) {
                await api.post('/users/onesignal', { userId, playerId: finalId });
            }
        } catch (err) {
            console.error('registerOneSignal failed:', err?.message || err);
        }
    };

    /*
     * Logout function:
     * Clears stored user and resets auth state.
     * (Optional enhancement later: call /logout endpoint)
     */
    const logout = () => {
        localStorage.removeItem("user");
        setUser(null);
    };

    /*
     * Provide auth values & functions to the entire app.
     * Any component can now use: useContext(AuthContext)
     */
    return (
        <AuthContext.Provider value={{ user, signup, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
