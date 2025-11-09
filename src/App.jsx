import React, { useContext, useEffect } from "react";
import "../style.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./contexts/AuthContext";
import AuthForm from "./components/AuthForm";
import ConsumerDashboard from "./components/ConsumerDashboard";
import ShopkeeperDashboard from "./components/ShopkeeperDashboard";

function App() {
  // Access the 'user' value from AuthContext to know if someone is logged in
  const { user } = useContext(AuthContext);
  console.log("AuthContext user:", user);

  // Initialize Firebase notifications
  useEffect(() => {
    // Firebase messaging will be initialized by the NotificationTester component
  }, []);

    /*
     * If no user is logged in:
     * - Show only the AuthForm (login/signup screen)
     * - Wrap it inside BrowserRouter so form can navigate links if needed
     */
    if (!user) {
        return (
            <BrowserRouter>
                <AuthForm />
            </BrowserRouter>
        );
    }

    /*
     * If user is logged in:
     * - Based on user.role, load the correct dashboard
     * - Consumer -> ConsumerDashboard
     * - Shopkeeper -> ShopkeeperDashboard
     * - A fallback route redirects any unknown path to "/"
     */
    return (
        <BrowserRouter>
            <Routes>
                {/* Consumer Routes */}
                {user.role === "CONSUMER" && (
                    <Route path="/*" element={<ConsumerDashboard />} />
                )}

                {/* Shopkeeper Routes */}
                {user.role === "SHOPKEEPER" && (
                    <Route path="/*" element={<ShopkeeperDashboard />} />
                )}

                {/* If someone tries to access an undefined route, redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
