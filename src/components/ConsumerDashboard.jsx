import React, { useState, useContext, useEffect } from "react";
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
import { SlLocationPin } from "react-icons/sl";
import { IoIosNotifications } from "react-icons/io";
import { IoStorefrontSharp } from "react-icons/io5";
import { GiHamburgerMenu } from "react-icons/gi";

export default function ConsumerDashboard() {
    const { user, logout } = useContext(AuthContext);
    const [deliveryAddress, setDeliveryAddress] = useState(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const location = useLocation();
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const notificationRef = React.useRef(null);

    const handleAddressConfirmed = (address) => {
        setDeliveryAddress(address);
        localStorage.setItem(
            `deliveryAddress_${user._id}`,
            JSON.stringify(address)
        );
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target) &&
                !event.target.closest(
                    'button[aria-label="Toggle notifications"]'
                )
            ) {
                setNotificationOpen(false);
            }
        }

        if (notificationOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [notificationOpen]);

    const loadUnreadCount = () => {
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
        // Poll every 10 seconds for new notifications
        const interval = setInterval(loadUnreadCount, 10000);
        return () => clearInterval(interval);
    };

    useEffect(() => {
        loadUnreadCount();
    }, [user]);

    const changeLocation = () => {
        setDeliveryAddress(null);
        localStorage.removeItem(`deliveryAddress_${user._id}`);
    };

    // Check for saved address on load
    useEffect(() => {
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
                        <button
                            className="hamburger-button"
                            aria-expanded={menuOpen}
                            aria-label={
                                menuOpen
                                    ? "Close navigation"
                                    : "Open navigation"
                            }
                            onClick={() => setMenuOpen((s) => !s)}
                            style={{
                                background: "transparent",
                                border: "none",
                                padding: 0,
                                margin: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                cursor: "pointer",
                            }}
                        >
                            <GiHamburgerMenu className="hamburger-icon" />
                        </button>
                        <h2>Welcome, {user.name}!</h2>
                    </div>

                    <div style={styles.deliveryAddress}>
                        <span>
                            <SlLocationPin style={{ marginBottom: "-2px" }} />{" "}
                            Delivering to: {deliveryAddress.area},{" "}
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
                    <button
                        style={styles.notificationButton}
                        onClick={() => setNotificationOpen(!notificationOpen)}
                        aria-label="Toggle notifications"
                        aria-expanded={notificationOpen}
                    >
                        <IoIosNotifications
                            style={{ fontSize: "35px", color: "white" }}
                        />{" "}
                        {unreadNotifications > 0 && (
                            <span style={styles.notificationBadge}>
                                {unreadNotifications}
                            </span>
                        )}
                    </button>
                    <div
                        ref={notificationRef}
                        className={
                            "notification-div" +
                            (notificationOpen ? " open" : "")
                        }
                        style={{ marginTop: "2%" }}
                        role="dialog"
                        aria-label="Notifications"
                    >
                        <NotificationCenter
                            onNotificationRead={() =>
                                setUnreadNotifications((n) =>
                                    Math.max(0, n - 1)
                                )
                            }
                        />
                    </div>
                    <button onClick={logout} style={styles.logoutButton}>
                        Logout
                    </button>
                </div>
            </div>

            <nav
                className="shop-keeper-dashboard-nav-desktop"
                style={styles.nav}
            >
                <Link
                    to="/"
                    style={
                        isActive("/") ? styles.activeNavLink : styles.navLink
                    }
                >
                    <IoStorefrontSharp style={{ marginBottom: "-2px" }} /> My
                    Pantry
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

            <div
                className={"hamburger-panel" + (menuOpen ? " open" : "")}
                role="dialog"
                aria-modal="true"
                aria-hidden={!menuOpen}
                style={{ marginTop: 0 }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    <Link
                        to="/"
                        style={styles.navLink}
                        onClick={() => setMenuOpen(false)}
                    >
                        <IoStorefrontSharp style={{ marginBottom: "-2px" }} />{" "}
                        My Pantry
                    </Link>
                    <Link
                        to="/shops"
                        style={styles.navLink}
                        onClick={() => setMenuOpen(false)}
                    >
                        🏪 Find Shops
                    </Link>
                    <Link
                        to="/cart"
                        style={styles.navLink}
                        onClick={() => setMenuOpen(false)}
                    >
                        🛒 Cart
                    </Link>
                    <Link
                        to="/orders"
                        style={styles.navLink}
                        onClick={() => setMenuOpen(false)}
                    >
                        📋 Orders
                    </Link>
                    <Link
                        to="/expenses"
                        style={styles.navLink}
                        onClick={() => setMenuOpen(false)}
                    >
                        💰 Expenses
                    </Link>
                </div>
            </div>

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

                    <Route path="/expenses" element={<ExpenseTracker />} />
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
        backgroundColor: "#0b1220",
        color: "white",
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
    },
    changeLocationButton: {
        padding: "10px",
        backgroundColor: "rgb(79 70 229)",
        color: "white",
        border: "none",
        borderRadius: "25px",
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
        border: "none",
        background: "none",
        cursor: "pointer",
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
        background: "linear-gradient(90deg,#0f172a,#111827)",
        boxShadow: "0 6px 18px rgba(2,6,23,0.35)",
        marginBottom: "-1px",
    },
    navLink: {
        padding: "15px 20px",
        textDecoration: "none",
        color: "white",
        transition: "all 0.3s",
    },
    activeNavLink: {
        padding: "18px 20px",
        textDecoration: "none",
        color: "rgb(11, 18, 32)",
        fontWeight: "bold",
        backgroundColor: "white",
        borderRadius: "12px 12px 0px 0px",
    },
    content: {
        padding: "20px",
        backgroundColor: "white",
    },
};
