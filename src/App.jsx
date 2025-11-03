import React, { useContext, useEffect } from "react";
import "../style.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./contexts/AuthContext";
import AuthForm from "./components/AuthForm";
import ConsumerDashboard from "./components/ConsumerDashboard";
import ShopkeeperDashboard from "./components/ShopkeeperDashboard";
import OneSignal from 'react-onesignal';

function App() {
  // Access the 'user' value from AuthContext to know if someone is logged in
  const { user } = useContext(AuthContext);
  console.log("AuthContext user:", user);

  // Initialize OneSignal notifications once on app mount
//   useEffect(() => {
//     if (window.OneSignal) {
//       window.OneSignal.push(() => {
//         window.OneSignal.init({
//           appId: "76eb459e-8e91-47ce-8fba-f551244b0363",
//         });
//       });
//     }
//   }, []);

  useEffect(() => {
    OneSignal.init({
      appId: "76eb459e-8e91-47ce-8fba-f551244b0363",
      allowLocalhostAsSecureOrigin: true, // for localhost testing
    });
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
