import React, { createContext, useState, useEffect } from "react";
import api from "../api/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem("user");
        if (saved) setUser(JSON.parse(saved));
    }, []);

    const signup = async (data) => {
        const res = await api.post("/auth/register", data);
        return res.data;
    };

    const login = async (credentials) => {
        const res = await api.post("/auth/login", credentials);
        const user = res.data;
        console.log("API", user);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        return user;
    };

    const logout = () => {
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, signup, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
