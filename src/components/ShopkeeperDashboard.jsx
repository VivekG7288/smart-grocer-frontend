import React, { useState, useContext, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import ShopForm from "./ShopForm";
import PaymentPage from "./PaymentPage";
import OrderList from "./OrderList";
import RefillRequests from "./RefillRequests";
import ShopkeeperNotifications from "./ShopkeeperNotifications";
import Inventory from "./Inventory";
import AddNewProduct from "./AddNewProduct";
import { IoIosNotifications } from "react-icons/io";
import { FaCartShopping } from "react-icons/fa6";
import { CiRedo } from "react-icons/ci";
import { AiFillAccountBook } from "react-icons/ai";
import { MdInventory } from "react-icons/md";
import api from "../api/api";
import { TbBrowserPlus } from "react-icons/tb";
import { GiHamburgerMenu } from "react-icons/gi";

export default function ShopkeeperDashboard() {
    const { user, logout } = useContext(AuthContext);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [shop, setShop] = useState(null);
    const [analytics, setAnalytics] = useState({
        ordersTotal: 0,
        ordersByStatus: {},
        recentOrders: [],
        refillTotal: 0,
        refillPending: 0,
        recentRefills: [],
        subscribers: 0,
        orderRevenue: 0,
        refillRevenue: 0,
        totalRevenue: 0,
    });
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const navRef = React.useRef(null);
    const notificationRef = React.useRef(null);

    // Handle clicks outside notification panel
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

    // Load shop analytics (orders, refill requests, subscribers)
    useEffect(() => {
        if (!user) return;

        const loadAnalytics = async () => {
            try {
                setAnalyticsLoading(true);

                // Find shop for this user
                const shopsRes = await api.get("/shops");
                const userShop = shopsRes.data.find(
                    (s) =>
                        s.ownerId === user._id ||
                        (s.ownerId &&
                            s.ownerId.toString &&
                            s.ownerId.toString() === user._id.toString()) ||
                        (typeof s.ownerId === "object" &&
                            s.ownerId._id === user._id)
                );

                if (!userShop) {
                    setShop(null);
                    setAnalytics({
                        ordersTotal: 0,
                        ordersByStatus: {},
                        recentOrders: [],
                        refillTotal: 0,
                        refillPending: 0,
                        recentRefills: [],
                        subscribers: 0,
                    });
                    setAnalyticsLoading(false);
                    return;
                }

                setShop(userShop);

                // Orders
                const ordersRes = await api.get("/orders");
                const shopOrders = ordersRes.data.filter(
                    (order) =>
                        order.shopId === userShop._id ||
                        (order.shopId &&
                            order.shopId.toString &&
                            order.shopId.toString() ===
                                userShop._id.toString()) ||
                        (typeof order.shopId === "object" &&
                            order.shopId._id === userShop._id)
                );

                const ordersByStatus = shopOrders.reduce((acc, o) => {
                    const s = o.status || "UNKNOWN";
                    acc[s] = (acc[s] || 0) + 1;
                    return acc;
                }, {});

                const recentOrders = shopOrders
                    .slice()
                    .sort(
                        (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
                    )
                    .slice(0, 5);

                // Calculate order revenue (use order.totalAmount if present, else sum items)
                const orderRevenue = shopOrders.reduce((sum, o) => {
                    if (typeof o.totalAmount === "number")
                        return sum + o.totalAmount;
                    if (Array.isArray(o.items)) {
                        return (
                            sum +
                            o.items.reduce(
                                (s2, it) =>
                                    s2 +
                                    Number(it.price || 0) *
                                        Number(it.quantity || 0),
                                0
                            )
                        );
                    }
                    return sum;
                }, 0);

                // Refill requests
                let refillRequests = [];
                try {
                    const refillRes = await api.get(
                        `/pantry/shop/${userShop._id}/requests`
                    );
                    refillRequests = refillRes.data || [];
                } catch (e) {
                    console.warn("Refill requests endpoint not available", e);
                }

                const refillPending = refillRequests.filter(
                    (r) => r.status === "REFILL_REQUESTED"
                ).length;
                const recentRefills = refillRequests
                    .slice()
                    .sort(
                        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
                    )
                    .slice(0, 5);

                // Calculate refill revenue (price * packsOwned)
                const refillRevenue = refillRequests.reduce((sum, r) => {
                    const price = Number(r.price || 0);
                    const packs = Number(r.packsOwned || 0);
                    return sum + price * packs;
                }, 0);

                // Subscribers
                let subscribers = 0;
                try {
                    const usersRes = await api.get("/users");
                    const users = usersRes.data || [];
                    subscribers = users.filter(
                        (u) =>
                            Array.isArray(u.subscriptions) &&
                            u.subscriptions.includes(userShop._id)
                    ).length;
                } catch (e) {
                    console.warn(
                        "Could not load users for subscriber count",
                        e
                    );
                }

                setAnalytics({
                    ordersTotal: shopOrders.length,
                    ordersByStatus,
                    recentOrders,
                    refillTotal: refillRequests.length,
                    refillPending,
                    recentRefills,
                    subscribers,
                    orderRevenue,
                    refillRevenue,
                    totalRevenue: orderRevenue + refillRevenue,
                });
            } catch (err) {
                console.error("Error loading shop analytics:", err);
            } finally {
                setAnalyticsLoading(false);
            }
        };

        loadAnalytics();
        loadUnreadCount();
    }, [user]);

    const isActive = (path) => location.pathname === path;

    return (
        <div className="shop-keeper-dashboard-container">
            <div style={styles.header}>
                <div style={styles.headerActions}>
                    <button
                        className="hamburger-button"
                        aria-expanded={menuOpen}
                        aria-label={
                            menuOpen ? "Close navigation" : "Open navigation"
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
                    <button
                        style={styles.notificationButton}
                        onClick={() => setNotificationOpen(!notificationOpen)}
                        aria-label="Toggle notifications"
                        aria-expanded={notificationOpen}
                    >
                        <IoIosNotifications
                            style={{ fontSize: "35px", color: "white" }}
                        />

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
                        role="dialog"
                        aria-label="Notifications"
                    >
                        <ShopkeeperNotifications
                            setNotificationOpen={setNotificationOpen}
                        />
                    </div>
                    <button onClick={logout} style={styles.logoutButton}>
                        Logout
                    </button>
                </div>
            </div>

            <nav ref={navRef} className="shop-keeper-dashboard-nav-desktop">
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
                <Link
                    to="/addNewProduct"
                    style={
                        isActive("/addNewProduct")
                            ? styles.activeNavLink
                            : styles.navLink
                    }
                >
                    <TbBrowserPlus
                        style={{ marginRight: "5px", marginBottom: "-2px" }}
                    />{" "}
                    Add new product
                </Link>
            </nav>

            {/* Mobile panel that opens with hamburger — duplicates nav links in a vertical layout */}
            <div
                className={"hamburger-panel" + (menuOpen ? " open" : "")}
                role="dialog"
                aria-modal="true"
                aria-hidden={!menuOpen}
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
                        style={{
                            ...styles.navLink,
                            background: "transparent",
                        }}
                        onClick={() => setMenuOpen(false)}
                    >
                        <FaCartShopping style={{ marginRight: "8px" }} /> My
                        Shop
                    </Link>
                    <Link
                        to="/refill-requests"
                        style={{
                            ...styles.navLink,
                            background: "transparent",
                        }}
                        onClick={() => setMenuOpen(false)}
                    >
                        <CiRedo style={{ marginRight: "8px" }} /> Refill
                        Requests
                    </Link>
                    <Link
                        to="/orders"
                        style={{
                            ...styles.navLink,
                            background: "transparent",
                        }}
                        onClick={() => setMenuOpen(false)}
                    >
                        <AiFillAccountBook style={{ marginRight: "8px" }} />{" "}
                        Orders
                    </Link>
                    <Link
                        to="/inventory"
                        style={{
                            ...styles.navLink,
                            background: "transparent",
                        }}
                        onClick={() => setMenuOpen(false)}
                    >
                        <MdInventory style={{ marginRight: "8px" }} /> Inventory
                    </Link>
                    <Link
                        to="/addNewProduct"
                        style={{
                            ...styles.navLink,
                            background: "transparent",
                        }}
                        onClick={() => setMenuOpen(false)}
                    >
                        <TbBrowserPlus style={{ marginRight: "8px" }} /> Add new
                        product
                    </Link>
                </div>
            </div>

            <div style={styles.content}>
                {location.pathname === "/" && (
                    <div style={styles.analyticsContainer}>
                        <h3>Shop Analytics</h3>
                        {analyticsLoading ? (
                            <div>Loading analytics...</div>
                        ) : shop ? (
                            <>
                                <div style={styles.analyticsGrid}>
                                    <div
                                        style={{
                                            ...styles.metricCard,
                                            background:
                                                "linear-gradient(135deg,#fff7e6,#fff)",
                                        }}
                                    >
                                        <h4>Total Orders</h4>
                                        <p style={styles.metricValue}>
                                            {analytics.ordersTotal}
                                        </p>
                                        <small>
                                            Pending:{" "}
                                            {analytics.ordersByStatus
                                                ?.PENDING || 0}{" "}
                                            • Delivered:{" "}
                                            {analytics.ordersByStatus
                                                ?.DELIVERED || 0}
                                        </small>
                                    </div>

                                    <div
                                        style={{
                                            ...styles.metricCard,
                                            background:
                                                "linear-gradient(135deg,#e8f7ff,#fff)",
                                        }}
                                    >
                                        <h4>Order Revenue</h4>
                                        <p style={styles.metricValue}>
                                            ₹
                                            {analytics.orderRevenue?.toFixed(
                                                2
                                            ) || "0.00"}
                                        </p>
                                        <small>
                                            From confirmed/delivered orders
                                        </small>
                                    </div>

                                    <div
                                        style={{
                                            ...styles.metricCard,
                                            background:
                                                "linear-gradient(135deg,#f0f7ff,#fff)",
                                        }}
                                    >
                                        <h4>Refill Revenue</h4>
                                        <p style={styles.metricValue}>
                                            ₹
                                            {analytics.refillRevenue?.toFixed(
                                                2
                                            ) || "0.00"}
                                        </p>
                                        <small>From refill requests</small>
                                    </div>

                                    <div
                                        style={{
                                            ...styles.metricCard,
                                            background:
                                                "linear-gradient(135deg,#ecfff4,#fff)",
                                        }}
                                    >
                                        <h4>Total Revenuee</h4>
                                        <p style={styles.metricValue}>
                                            ₹
                                            {analytics.totalRevenue?.toFixed(
                                                2
                                            ) || "0.00"}
                                        </p>
                                        <small>Orders + Refills</small>
                                    </div>

                                    <div style={styles.metricCard}>
                                        <h4>Refill Requests</h4>
                                        <p style={styles.metricValue}>
                                            {analytics.refillTotal}
                                        </p>
                                        <small>
                                            Pending: {analytics.refillPending}
                                        </small>
                                    </div>

                                    <div style={styles.metricCard}>
                                        <h4>Subscribers</h4>
                                        <p style={styles.metricValue}>
                                            {analytics.subscribers}
                                        </p>
                                        <small>
                                            Users subscribed to your shop
                                        </small>
                                    </div>
                                </div>

                                {/* Shop Details Card */}
                                <div style={styles.shopDetailsCard}>
                                    <div style={styles.shopDetailsHeader}>
                                        <h4>Shop Details</h4>
                                        <Link to="/" style={styles.editButton}>
                                            Edit Details
                                        </Link>
                                    </div>
                                    <div style={styles.shopDetailsGrid}>
                                        <div style={styles.detailGroup}>
                                            <label>Shop Name</label>
                                            <p>{shop.name}</p>
                                        </div>
                                        <div style={styles.detailGroup}>
                                            <label>Phone</label>
                                            <p>
                                                {shop.phone || "Not provided"}
                                            </p>
                                        </div>
                                        <div style={styles.detailGroup}>
                                            <label>City</label>
                                            <p>
                                                {shop.location?.city ||
                                                    "Not provided"}
                                            </p>
                                        </div>
                                        <div style={styles.detailGroup}>
                                            <label>Pincode</label>
                                            <p>
                                                {shop.location?.pincode ||
                                                    "Not provided"}
                                            </p>
                                        </div>
                                        <div style={styles.detailGroup}>
                                            <label>Delivery Radius</label>
                                            <p>{shop.deliveryRadius || 5} km</p>
                                        </div>
                                        <div
                                            style={{
                                                ...styles.detailGroup,
                                                gridColumn: "1 / -1",
                                            }}
                                        >
                                            <label>Address</label>
                                            <p>
                                                {shop.location?.address ||
                                                    "Address not provided"}
                                            </p>
                                        </div>
                                        <div
                                            style={{
                                                ...styles.detailGroup,
                                                gridColumn: "1 / -1",
                                            }}
                                        >
                                            <label>Shop ID</label>
                                            <p style={styles.shopId}>
                                                {shop._id}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="add-new-product-form-row-image">
                                    <div style={styles.recentCard}>
                                        <h5>Recent Orders</h5>
                                        {analytics.recentOrders.length === 0 ? (
                                            <p>No recent orders</p>
                                        ) : (
                                            <ul>
                                                {analytics.recentOrders.map(
                                                    (o) => (
                                                        <li key={o._id}>
                                                            #{o._id.slice(-6)} —{" "}
                                                            {o.status} —{" "}
                                                            {new Date(
                                                                o.orderDate
                                                            ).toLocaleDateString()}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        )}
                                        <Link to="/orders">
                                            View all orders
                                        </Link>
                                    </div>

                                    <div style={styles.recentCard}>
                                        <h5>Recent Refill Requests</h5>
                                        {analytics.recentRefills.length ===
                                        0 ? (
                                            <p>No recent refill requests</p>
                                        ) : (
                                            <ul>
                                                {analytics.recentRefills.map(
                                                    (r) => (
                                                        <li key={r._id}>
                                                            {r.productName ||
                                                                "Product"}{" "}
                                                            — {r.status} —{" "}
                                                            {new Date(
                                                                r.updatedAt
                                                            ).toLocaleDateString()}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        )}
                                        <Link to="/refill-requests">
                                            View refill requests
                                        </Link>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div>
                                <p>
                                    You need to create a shop first to see
                                    analytics.
                                </p>
                                <Link to="/">Create / Manage Shop</Link>
                            </div>
                        )}
                    </div>
                )}

                <Routes>
                    <Route path="/" element={<ShopForm />} />
                    <Route path="/payment" element={<PaymentPage />} />
                    <Route
                        path="/refill-requests"
                        element={<RefillRequests />}
                    />
                    <Route path="/orders" element={<OrderList />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/addNewProduct" element={<AddNewProduct />} />
                    <Route
                        path="/refill-requests"
                        element={<RefillRequests />}
                    />
                </Routes>
            </div>
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: "#0b1220",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "22px 28px",
        background: "linear-gradient(90deg,#0f172a,#111827)",
        boxShadow: "0 6px 18px rgba(2,6,23,0.35)",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
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
        background: "transparent",
        border: "none",
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
    navLink: {
        padding: "10px 14px",
        textDecoration: "none",
        color: "white",
        borderRadius: "8px",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    activeNavLinkIcon: {
        fontSize: "20px",
        color: "black",
        marginRight: "5px",
        marginBottom: "-3px",
    },
    activeNavLink: {
        padding: "10px 14px",
        textDecoration: "none",
        color: "#0b1220",
        fontWeight: "700",
        backgroundColor: "whitesmoke",
        borderRadius: "12px 12px 0 0",
    },
    content: {
        padding: "20px",
        backgroundColor: "whitesmoke",
    },
    analyticsContainer: {
        marginBottom: "20px",
        padding: "16px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    },
    analyticsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "16px",
    },
    metricCard: {
        padding: "18px",
        borderRadius: "12px",
        backgroundColor: "#fff",
        border: "1px solid #eef2f6",
        textAlign: "center",
        boxShadow: "0 6px 18px rgba(11,20,34,0.04)",
    },
    metricValue: {
        fontSize: "28px",
        fontWeight: "700",
        margin: "8px 0",
    },
    recentCard: {
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: "#fff",
        border: "1px solid #e9ecef",
    },
    shopDetailsCard: {
        padding: "24px",
        marginBottom: "24px",
        backgroundColor: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(11,20,34,0.05)",
        border: "1px solid #eef2f6",
    },
    shopDetailsHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        paddingBottom: "12px",
        borderBottom: "1px solid #eef2f6",
    },
    shopDetailsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "24px",
    },
    detailGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    editButton: {
        padding: "8px 16px",
        backgroundColor: "#f8fafc",
        color: "#334155",
        textDecoration: "none",
        borderRadius: "6px",
        fontSize: "14px",
        border: "1px solid #e2e8f0",
        transition: "all 0.2s",
    },
    shopId: {
        fontFamily: "monospace",
        backgroundColor: "#f1f5f9",
        padding: "8px 12px",
        borderRadius: "4px",
        fontSize: "14px",
        color: "#334155",
    },
};
