import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";

export default function OrderHistory() {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        loadOrderHistory();
    }, [user]);

    const loadOrderHistory = async () => {
        try {
            setLoading(true);
            console.log("Loading order history for user:", user._id);

            const res = await api.get("/orders");
            const userOrders = res.data.filter((order) => {
                const customerId = order.customerId;

                if (!customerId) return false; // skip null or undefined

                if (typeof customerId === "object" && customerId._id) {
                    return customerId._id === user._id;
                }

                return (
                    customerId === user._id ||
                    customerId?.toString?.() === user._id?.toString?.()
                );
            });

            // Sort by most recent first
            const sortedOrders = userOrders.sort(
                (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
            );

            console.log("Found user orders:", sortedOrders);
            setOrders(sortedOrders);
        } catch (err) {
            console.error("Error loading order history:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders =
        filter === "ALL"
            ? orders
            : orders.filter((order) => order.status === filter);

    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING":
                return "#ffc107";
            case "SHIPPED":
                return "#17a2b8";
            case "DELIVERED":
                return "#28a745";
            case "CANCELLED":
                return "#dc3545";
            default:
                return "#6c757d";
        }
    };

    const reorderItems = async (order) => {
        try {
            // Add all items from this order back to cart
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");

            for (const item of order.items) {
                const existingItem = cart.find(
                    (cartItem) => cartItem._id === item.productId._id
                );
                if (existingItem) {
                    existingItem.quantity += item.quantity;
                } else {
                    // Get fresh product data
                    const productRes = await api.get("/products");
                    const product = productRes.data.find(
                        (p) => p._id === item.productId._id
                    );
                    if (product && product.stock > 0) {
                        cart.push({ ...product, quantity: item.quantity });
                    }
                }
            }

            localStorage.setItem("cart", JSON.stringify(cart));
            alert(
                "Items added to cart! You can modify quantities before placing order."
            );
        } catch (err) {
            console.error("Error reordering:", err);
            alert("Error adding items to cart");
        }
    };

    if (loading) {
        return <div style={styles.loading}>Loading your order history...</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3>📋 Your Order History</h3>
                <div style={styles.filters}>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={styles.filterSelect}
                    >
                        <option value="ALL">
                            All Orders ({orders.length})
                        </option>
                        <option value="PENDING">Pending</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    <button
                        onClick={loadOrderHistory}
                        style={styles.refreshButton}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div style={styles.noOrders}>
                    {filter === "ALL" ? (
                        <>
                            <p>You haven't placed any orders yet.</p>
                            <p>Subscribe to shops and start shopping!</p>
                        </>
                    ) : (
                        <p>No {filter.toLowerCase()} orders found.</p>
                    )}
                </div>
            ) : (
                <div style={styles.ordersList}>
                    {filteredOrders.map((order) => (
                        <div key={order._id} style={styles.orderCard}>
                            <div style={styles.orderHeader}>
                                <div>
                                    <h4>Order #{order._id.slice(-8)}</h4>
                                    <p style={styles.orderDate}>
                                        {new Date(
                                            order.orderDate
                                        ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                <span
                                    style={{
                                        ...styles.statusBadge,
                                        backgroundColor: getStatusColor(
                                            order.status
                                        ),
                                    }}
                                >
                                    {order.status}
                                </span>
                            </div>

                            <div style={styles.shopInfo}>
                                <p>
                                    <strong>Shop:</strong>{" "}
                                    {order.shopId?.name || "N/A"}
                                </p>
                            </div>

                            <div style={styles.orderItems}>
                                <h5>Items:</h5>
                                {order.items.map((item, index) => (
                                    <div key={index} style={styles.orderItem}>
                                        <div style={styles.itemInfo}>
                                            <span style={styles.itemName}>
                                                {item.productId?.name ||
                                                    "Product"}
                                            </span>
                                            <span style={styles.itemDetails}>
                                                ${item.price} × {item.quantity}
                                            </span>
                                        </div>
                                        <span style={styles.itemTotal}>
                                            $
                                            {(
                                                item.price * item.quantity
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.orderFooter}>
                                <div style={styles.totalAmount}>
                                    <strong>
                                        Total: $
                                        {order.totalAmount?.toFixed(2) ||
                                            "0.00"}
                                    </strong>
                                </div>
                                <div style={styles.orderActions}>
                                    {order.status === "DELIVERED" && (
                                        <button
                                            onClick={() => reorderItems(order)}
                                            style={styles.reorderButton}
                                        >
                                            🔄 Reorder
                                        </button>
                                    )}
                                    {order.deliveryDate && (
                                        <span style={styles.deliveryDate}>
                                            Delivered:{" "}
                                            {new Date(
                                                order.deliveryDate
                                            ).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "900px",
        margin: "0 auto",
    },
    loading: {
        textAlign: "center",
        padding: "50px",
        fontSize: "18px",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
    },
    filters: {
        display: "flex",
        gap: "10px",
        alignItems: "center",
    },
    filterSelect: {
        padding: "8px 12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        backgroundColor: "white",
    },
    refreshButton: {
        padding: "8px 16px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    noOrders: {
        textAlign: "center",
        padding: "50px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        color: "#666",
    },
    ordersList: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    orderCard: {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        backgroundColor: "#fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    orderHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "15px",
    },
    orderDate: {
        color: "#666",
        fontSize: "14px",
        margin: "5px 0 0 0",
    },
    statusBadge: {
        padding: "6px 12px",
        borderRadius: "20px",
        color: "white",
        fontSize: "12px",
        fontWeight: "bold",
    },
    shopInfo: {
        backgroundColor: "#f8f9fa",
        padding: "10px 15px",
        borderRadius: "6px",
        marginBottom: "15px",
    },
    orderItems: {
        marginBottom: "15px",
    },
    orderItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #eee",
    },
    itemInfo: {
        display: "flex",
        flexDirection: "column",
    },
    itemName: {
        fontWeight: "bold",
        marginBottom: "4px",
    },
    itemDetails: {
        color: "#666",
        fontSize: "14px",
    },
    itemTotal: {
        fontWeight: "bold",
    },
    orderFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "15px",
        borderTop: "2px solid #eee",
    },
    totalAmount: {
        fontSize: "18px",
    },
    orderActions: {
        display: "flex",
        alignItems: "center",
        gap: "15px",
    },
    reorderButton: {
        padding: "8px 16px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "14px",
    },
    deliveryDate: {
        color: "#28a745",
        fontSize: "14px",
        fontWeight: "bold",
    },
};
