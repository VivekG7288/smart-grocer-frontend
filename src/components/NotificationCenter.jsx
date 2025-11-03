import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { IoIosNotifications } from "react-icons/io";

export default function NotificationCenter({
    onNotificationRead,
    setNotificationOpen,
    unreadNotifications,
}) {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, [user, unreadNotifications]);

    const loadNotifications = async () => {
        try {
            const res = await api.get(`/notifications/user/${user._id}`);
            setNotifications(res.data);
        } catch (err) {
            console.error("Error loading notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`);
            setNotifications(
                notifications.map((n) =>
                    n._id === notificationId ? { ...n, isRead: true } : n
                )
            );
            if (typeof onNotificationRead === "function")
                onNotificationRead(notificationId);
            return true;
        } catch (err) {
            console.error("Error marking notification as read:", err);
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
                Notifications
            </h3>

            {notifications.length === 0 ? (
                <div style={styles.emptyState}>
                    <p>No notifications yet!</p>
                    <p>
                        You'll get notified when shops confirm your refill
                        requests.
                    </p>
                </div>
            ) : (
                <div style={styles.notificationsList}>
                    {notifications
                        .filter((x) => !x.isRead)
                        .map((notification) => (
                            <div
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
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <p>{notification.message}</p>
                                {notification.metadata && (
                                    <div style={styles.metadata}>
                                        <small>
                                            Shop: {notification.shopId?.name}
                                        </small>
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
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        color: "#666",
    },
    notificationsList: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },
    unreadNotification: {
        backgroundColor: "#FFFAF0",
        border: "1px solid #2B4936",
        borderRadius: "8px",
        padding: "15px",
        cursor: "pointer",
        color: "#2B4936",
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
        marginTop: "8px",
        color: "#666",
    },
};
