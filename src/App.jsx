import React, { useContext } from "react";
import "../style.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./contexts/AuthContext";
import AuthForm from "./components/AuthForm";
import ConsumerDashboard from "./components/ConsumerDashboard";
import ShopkeeperDashboard from "./components/ShopkeeperDashboard";

function App() {
    const { user, loading } = useContext(AuthContext);

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
