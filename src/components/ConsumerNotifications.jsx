import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { IoIosNotifications } from "react-icons/io";

export default function ConsumerNotifications({
    setNotificationOpen,
    onNotificationRead,
}) {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        loadNotifications();
    }, [user]);

    const loadNotifications = async () => {
        const reloadNotifications = async () => {
            try {
                const res = await api.get(`/notifications/consumer/${user._id}`);
                setNotifications(res.data);
            } catch (err) {
                console.error("Error loading notifications:", err);
            } finally {
                setLoading(false);
            }
        };

        reloadNotifications();
        // Poll every 10 seconds
        const interval = setInterval(reloadNotifications, 10000);
        return () => clearInterval(interval);
    };

    const deleteNotification = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications(notifications.filter((n) => n._id !== notificationId));
            if (typeof onNotificationRead === "function") onNotificationRead(notificationId);
            return true;
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    if (loading) {
        return <div style={styles.loading}>Loading notifications...</div>;
    }

    return (
        <div style={styles.container}>
            <h3 style={{ color: "#FFFAF0" }}>
                <IoIosNotifications style={{ fontSize: "35px", color: "#FFFAF0", marginBottom: "-11px" }} />
                {" "} Order Updates
            </h3>

            {notifications.length === 0 ? (
                <div style={styles.emptyState}>
                    <p>No notifications yet!</p>
                    <p>You'll be notified when your orders are shipped or delivered.</p>
                </div>
            ) : (
                <div style={styles.notificationsList}>
                    {notifications
                        .filter((x) => !x.isRead)
                        .map((notification) => (
                            <div
                                key={notification._id}
                                style={notification.isRead ? styles.readNotification : styles.unreadNotification}
                                onClick={async () => {
                                    await deleteNotification(notification._id);
                                    setNotificationOpen && setNotificationOpen(false);
                                }}
                            >
                                <div style={styles.notificationHeader}>
                                    <h4>{notification.title}</h4>
                                    <span style={styles.timestamp}>
                                        {new Date(notification.createdAt).toLocaleDateString("en-IN")}
                                    </span>
                                </div>
                                <p>{notification.message}</p>
                                {notification.metadata && (
                                    <div style={styles.metadata}>
                                        <p><strong>Order ID:</strong> {notification.metadata.orderId}</p>
                                        <p><strong>Status:</strong> {notification.metadata.status}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: { maxWidth: "800px", margin: "0 auto" },
    loading: { textAlign: "center", padding: "50px" },
    emptyState: {
        textAlign: "center",
        padding: "50px",
        backgroundColor: "rgba(31, 41, 55, 0.5)",
        borderRadius: "8px",
        color: "white",
    },
    notificationsList: { display: "flex", flexDirection: "column", gap: "15px" },
    unreadNotification: {
        backgroundColor: "#FFFAF0",
        borderRadius: "8px",
        padding: "15px",
        cursor: "pointer",
        color: "#2B4936",
    },
    readNotification: {
        backgroundColor: "rgba(31, 41, 55, 0.5)",
        borderRadius: "8px",
        padding: "15px",
        color: "white",
    },
    notificationHeader: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
    timestamp: { fontSize: "12px", color: "#666" },
    metadata: {
        marginTop: "10px",
        backgroundColor: "#89AA97",
        padding: "10px",
        borderRadius: "4px",
        color: "#FFFAF0",
    },
};