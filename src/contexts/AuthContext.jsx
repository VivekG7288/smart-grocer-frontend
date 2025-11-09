import React, { createContext, useState, useEffect } from "react";
import api from "../api/api";
import { firebaseMessaging } from '../utils/firebaseMessaging';

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

        // Initialize Firebase messaging and request permission
        try {
            await firebaseMessaging.requestPermission(loggedUser._id);
            
            // Listen for foreground messages
            firebaseMessaging.onForegroundMessage((payload) => {
                const { title, body } = payload.notification;
                new Notification(title, { body });
            });
        } catch (err) {
            console.error('Failed to initialize Firebase messaging:', err);
        }
        
        return loggedUser;
    };

    // Will be replaced with Firebase initialization

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
