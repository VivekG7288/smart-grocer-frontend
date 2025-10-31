import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { IoIosNotifications } from "react-icons/io";

export default function ShopkeeperNotifications({
    setNotificationOpen,
    onNotificationRead,
}) {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, [user]);

    const loadNotifications = async () => {
        const reloadNotifications = async () => {
            try {
                const res = await api.get(`/notifications/user/${user._id}`);
                setNotifications(res.data);
            } catch (err) {
                console.error("Error loading notifications:", err);
            } finally {
                setLoading(false);
            }
        };

        reloadNotifications();
        // Poll every 10 seconds for new notifications
        const interval = setInterval(reloadNotifications, 10000);
        return () => clearInterval(interval);
    };

    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`);
            setNotifications((prev) =>
                prev.map((n) =>
                    n._id === notificationId ? { ...n, isRead: true } : n
                )
            );
            // Inform parent that one notification was read so it can decrement the count
            if (typeof onNotificationRead === "function")
                onNotificationRead(notificationId);
            return true;
        } catch (err) {
            console.error("Error marking notification as read:", err);
            return false;
        }
    };

    if (loading) {
        return <div style={styles.loading}>Loading notifications...</div>;
    }

    return (
        <div style={styles.container}>
            <h3>
                <IoIosNotifications
                    style={{
                        fontSize: "35px",
                        color: "white",
                        marginBottom: "-11px",
                    }}
                />{" "}
                Shop Notifications
            </h3>

            {notifications.length === 0 ? (
                <div style={styles.emptyState}>
                    <p>No notifications yet!</p>
                    <p>You'll get notified when customers request refills.</p>
                </div>
            ) : (
                <div style={styles.notificationsList}>
                    {notifications
                        .filter((x) => !x.isRead)
                        .map((notification) => (
                            <Link
                                to={
                                    notification.type === "ORDER"
                                        ? "/orders"
                                        : "/refill-requests"
                                }
                                // to="/refill-requests"
                                key={notification._id}
                                style={
                                    notification.isRead
                                        ? styles.readNotification
                                        : styles.unreadNotification
                                }
                                onClick={async () => {
                                    // If unread, mark as read on the server and update parent counter
                                    if (!notification.isRead) {
                                        const ok = await markAsRead(
                                            notification._id
                                        );
                                        if (ok) {
                                            // close notifications panel if parent provided setter
                                            setNotificationOpen &&
                                                setNotificationOpen(false);
                                            // onNotificationRead already called inside markAsRead
                                        }
                                    }
                                }}
                            >
                                <div style={styles.notificationHeader}>
                                    <h4>{notification.title}</h4>
                                    <span style={styles.timestamp}>
                                        {new Date(
                                            notification.createdAt
                                        ).toLocaleDateString("en-IN")}
                                    </span>
                                </div>
                                <p>{notification.message}</p>
                                {notification.metadata && (
                                    <div style={styles.metadata}>
                                        <p>
                                            <strong>Customer:</strong>{" "}
                                            {notification.metadata.customerName}
                                        </p>
                                        <p>
                                            <strong>Product:</strong>{" "}
                                            {notification.metadata.productName}
                                        </p>
                                        <p>
                                            <strong>Quantity:</strong>{" "}
                                            {notification.metadata.quantity}
                                        </p>
                                    </div>
                                )}
                                {notification.actionRequired && (
                                    <div style={styles.actionRequired}>
                                        ⚡ Action Required - Check Refill
                                        Requests
                                    </div>
                                )}
                            </Link>
                        ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "800px",
        margin: "0 auto",
    },
    loading: {
        textAlign: "center",
        padding: "50px",
    },
    emptyState: {
        textAlign: "center",
        padding: "50px",
        backgroundColor: "rgba(31, 41, 55, 0.5)",
        borderRadius: "8px",
        color: "white",
        border: "2px solid rgb(55, 65, 81)",
    },
    notificationsList: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },
    unreadNotification: {
        backgroundColor: "rgba(31, 41, 55, 0.5)",
        border: "2px solid rgb(55, 65, 81)",
        borderRadius: "8px",
        padding: "15px",
        cursor: "pointer",
        textDecoration: "none",
        color: "white",
    },
    readNotification: {
        backgroundColor: "rgba(31, 41, 55, 0.5)",
        border: "2px solid rgb(55, 65, 81)",
        borderRadius: "8px",
        padding: "15px",
        textDecoration: "none",
        color: "white",
    },
    notificationHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
    },
    timestamp: {
        fontSize: "12px",
        color: "#666",
    },
    metadata: {
        marginTop: "10px",
        backgroundColor: "#0ca335bf",
        padding: "10px",
        borderRadius: "4px",
        fontSize: "14px",
    },
    actionRequired: {
        marginTop: "10px",
        backgroundColor: "#dc3545",
        color: "white",
        padding: "8px 12px",
        borderRadius: "4px",
        fontWeight: "bold",
        textAlign: "center",
    },
};
