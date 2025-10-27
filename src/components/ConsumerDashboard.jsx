import React, { useState, useContext } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import AddressSelector from "./AddressSelector";
import PantryManager from "./PantryManager"; // Import the new component
import ShopList from "./ShopList";
import ProductList from "./ProductList";
import Cart from "./Cart";
import OrderHistory from "./OrderHistory";
import NotificationCenter from "./NotificationCenter"; // We'll create this too
import ExpenseTracker from "./ExpenseTracker";

export default function ConsumerDashboard() {
    const { user, logout } = useContext(AuthContext);
    const [deliveryAddress, setDeliveryAddress] = useState(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const location = useLocation();

    const handleAddressConfirmed = (address) => {
        setDeliveryAddress(address);
        localStorage.setItem(
            `deliveryAddress_${user._id}`,
            JSON.stringify(address)
        );
    };

    const changeLocation = () => {
        setDeliveryAddress(null);
        localStorage.removeItem(`deliveryAddress_${user._id}`);
    };

    // Check for saved address on load
    React.useEffect(() => {
        const savedAddress = localStorage.getItem(
            `deliveryAddress_${user._id}`
        );
        if (savedAddress) {
            setDeliveryAddress(JSON.parse(savedAddress));
        }
    }, [user._id]);

    const isActive = (path) => location.pathname === path;

    // Show address selector if no address is set
    if (!deliveryAddress) {
        return <AddressSelector onAddressConfirmed={handleAddressConfirmed} />;
    }

    console.log(user);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.locationInfo}>
                    <div style={styles.headerActions}>
                        {user.picture && (
                            <img
                                src={user.picture}
                                alt="Profile"
                                style={{
                                    width: "50px",
                                    height: "50px",
                                    borderRadius: "25px",
                                    objectFit: "cover",
                                }}
                            />
                        )}
                        <h2>Welcome, {user.name}!</h2>
                    </div>

                    <div style={styles.deliveryAddress}>
                        ß
                        <span>
                            📍 Delivering to: {deliveryAddress.area},{" "}
                            {deliveryAddress.city}
                        </span>
                        <button
                            onClick={changeLocation}
                            style={styles.changeLocationButton}
                        >
                            Change
                        </button>
                    </div>
                </div>
                <div style={styles.headerActions}>
                    <Link to="/notifications" style={styles.notificationButton}>
                        🔔{" "}
                        {unreadNotifications > 0 && (
                            <span style={styles.notificationBadge}>
                                {unreadNotifications}
                            </span>
                        )}
                    </Link>
                    <button onClick={logout} style={styles.logoutButton}>
                        Logout
                    </button>
                </div>
            </div>

            <nav style={styles.nav}>
                <Link
                    to="/"
                    style={
                        isActive("/") ? styles.activeNavLink : styles.navLink
                    }
                >
                    🏠 My Pantry
                </Link>
                <Link
                    to="/shops"
                    style={
                        isActive("/shops")
                            ? styles.activeNavLink
                            : styles.navLink
                    }
                >
                    🏪 Find Shops
                </Link>
                <Link
                    to="/cart"
                    style={
                        isActive("/cart")
                            ? styles.activeNavLink
                            : styles.navLink
                    }
                >
                    🛒 Cart
                </Link>
                <Link
                    to="/orders"
                    style={
                        isActive("/orders")
                            ? styles.activeNavLink
                            : styles.navLink
                    }
                >
                    📋 Orders
                </Link>
                <Link
                    to="/expenses"
                    style={
                        isActive("/expenses")
                            ? styles.activeNavLink
                            : styles.navLink
                    }
                >
                    💰 Expenses
                </Link>
            </nav>

            <div style={styles.content}>
                <Routes>
                    {/* Make Pantry the default route - main feature */}
                    <Route path="/" element={<PantryManager />} />
                    <Route
                        path="/shops"
                        element={<ShopList deliveryAddress={deliveryAddress} />}
                    />
                    <Route path="/shop/:shopId" element={<ProductList />} />
                    <Route
                        path="/cart"
                        element={<Cart deliveryAddress={deliveryAddress} />}
                    />
                    <Route path="/orders" element={<OrderHistory />} />
                    <Route
                        path="/notifications"
                        element={<NotificationCenter />}
                    />
                    <Route
                        path="/expenses"
                        element={<ExpenseTracker />}
                    />
                </Routes>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px",
        backgroundColor: "#fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    locationInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "5px",
    },
    deliveryAddress: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "14px",
        color: "#666",
    },
    changeLocationButton: {
        padding: "4px 8px",
        backgroundColor: "transparent",
        color: "#007bff",
        border: "1px solid #007bff",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
    },
    headerActions: {
        display: "flex",
        alignItems: "center",
        gap: "15px",
    },
    notificationButton: {
        position: "relative",
        padding: "8px 12px",
        textDecoration: "none",
        fontSize: "20px",
    },
    notificationBadge: {
        position: "absolute",
        top: "0",
        right: "0",
        backgroundColor: "#dc3545",
        color: "white",
        borderRadius: "50%",
        fontSize: "12px",
        padding: "2px 6px",
        minWidth: "18px",
        textAlign: "center",
    },
    logoutButton: {
        padding: "8px 16px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    nav: {
        display: "flex",
        backgroundColor: "#fff",
        borderBottom: "1px solid #ddd",
        padding: "0 20px",
    },
    navLink: {
        padding: "15px 20px",
        textDecoration: "none",
        color: "#666",
        borderBottom: "3px solid transparent",
        transition: "all 0.3s",
    },
    activeNavLink: {
        padding: "15px 20px",
        textDecoration: "none",
        color: "#007bff",
        borderBottom: "3px solid #007bff",
        fontWeight: "bold",
    },
    content: {
        padding: "20px",
    },
};
