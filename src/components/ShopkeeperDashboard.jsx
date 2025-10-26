import React, { useContext } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import ShopForm from "./ShopForm";
import PaymentPage from "./PaymentPage";
import OrderList from "./OrderList";
import RefillRequests from "./RefillRequests"; // New component
import ShopkeeperNotifications from "./ShopkeeperNotifications"; // New component
import Inventory from "./Inventory";
import { IoIosNotifications } from "react-icons/io";
import { FaCartShopping } from "react-icons/fa6";
import { CiRedo } from "react-icons/ci";
import { AiFillAccountBook } from "react-icons/ai";
import { MdInventory } from "react-icons/md";

export default function ShopkeeperDashboard() {
    const { user, logout } = useContext(AuthContext);
    const [unreadNotifications, setUnreadNotifications] = React.useState(0);
    const location = useLocation();

    // Load unread notification count
    React.useEffect(() => {
        const loadUnreadCount = async () => {
            try {
                const res = await fetch(
                    `/api/notifications/user/${user._id}/unread-count`
                );
                const data = await res.json();
                setUnreadNotifications(data.count);
            } catch (err) {
                console.error("Error loading notification count:", err);
            }
        };

        loadUnreadCount();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(loadUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [user._id]);

    const isActive = (path) => location.pathname === path;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
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
                    <h2 style={{ color: "white" }}>Welcome, {user.name}!</h2>
                </div>
                <div style={styles.headerActions}>
                    <Link to="/notifications" style={styles.notificationButton}>
                        <IoIosNotifications
                            style={{ fontSize: "35px", color: "white" }}
                        />

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
                    <FaCartShopping
                        style={{ marginRight: "5px", marginBottom: "-2px" }}
                    />{" "}
                    My Shop
                </Link>
                <Link
                    to="/refill-requests"
                    style={
                        isActive("/refill-requests")
                            ? styles.activeNavLink
                            : styles.navLink
                    }
                >
                    <CiRedo
                        style={{ marginRight: "5px", marginBottom: "-2px" }}
                    />{" "}
                    Refill Requests
                </Link>
                <Link
                    to="/orders"
                    style={
                        isActive("/orders")
                            ? styles.activeNavLink
                            : styles.navLink
                    }
                >
                    <AiFillAccountBook
                        style={{ marginRight: "5px", marginBottom: "-2px" }}
                    />{" "}
                    Orders
                </Link>
                <Link
                    to="/inventory"
                    style={
                        isActive("/inventory")
                            ? styles.activeNavLink
                            : styles.navLink
                    }
                >
                    <MdInventory
                        style={{ marginRight: "5px", marginBottom: "-2px" }}
                    />{" "}
                    Inventory
                </Link>
            </nav>

            <div style={styles.content}>
                <Routes>
                    <Route path="/" element={<ShopForm />} />
                    <Route path="/payment" element={<PaymentPage />} />
                    <Route
                        path="/refill-requests"
                        element={<RefillRequests />}
                    />
                    <Route path="/orders" element={<OrderList />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route
                        path="/notifications"
                        element={<ShopkeeperNotifications />}
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
        backgroundColor: "rgb(17, 24, 39)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
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
        backgroundColor: "rgb(17, 24, 39)",
        padding: "0 20px",
    },
    navLink: {
        padding: "15px 20px",
        textDecoration: "none",
        color: "whitesmoke",
        borderBottom: "3px solid transparent",
        transition: "all 0.3s",
    },
    activeNavLinkIcon: {
        fontSize: "20px",
        color: "rgb(17, 24, 39)",
        marginRight: "5px",
        marginBottom: "-3px",
    },
    activeNavLink: {
        padding: "15px 20px",
        textDecoration: "none",
        color: "rgb(31, 41, 55)",
        fontWeight: "bold",
        backgroundColor: "whitesmoke",
        borderRadius: "10px 10px 0px 0px",
    },
    content: {
        padding: "20px",
        backgroundColor: "whitesmoke",
    },
};
