// Updated OrderList.js with better delivery address display
import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { AiFillAccountBook } from "react-icons/ai";
import { GrRefresh } from "react-icons/gr";
import { MdDirections } from "react-icons/md";

export default function OrderList() {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [paginationCount, setPaginationCount] = useState(0);
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [slicedOrders, setSlicesOrders] = useState([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(1);
    const [visibleStart, setVisibleStart] = useState(1);
    const maxVisible = 6;

    useEffect(() => {
        setPaginationCount(Math.ceil(orders.length / 5));
        setSlicesOrders(orders.slice(0, orders.length > 5 ? 5 : orders.length));
    }, [orders]);

    useEffect(() => {
        if (user) {
            findShopAndLoadOrders();
        }
    }, [user]);

    const findShopAndLoadOrders = async () => {
        try {
            setLoading(true);
            console.log("Finding shop for user:", user._id);

            // First, find the shopkeeper's shop
            const shopsRes = await api.get("/shops");
            const userShop = shopsRes.data.find(
                (s) =>
                    s.ownerId === user._id ||
                    s.ownerId.toString() === user._id.toString() ||
                    (typeof s.ownerId === "object" &&
                        s.ownerId._id === user._id)
            );

            console.log("Found shop:", userShop);

            if (userShop) {
                setShop(userShop);

                // Now get orders for this shop
                const ordersRes = await api.get("/orders");
                const shopOrders = ordersRes.data.filter(
                    (order) =>
                        order.shopId === userShop._id ||
                        order.shopId.toString() === userShop._id.toString() ||
                        (typeof order.shopId === "object" &&
                            order.shopId._id === userShop._id)
                );

                console.log("Found orders for shop:", shopOrders);
                setOrders(shopOrders);
            } else {
                console.log("No shop found for this user");
            }
        } catch (err) {
            console.error("Error loading orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}`, { status: newStatus });

            // Update local state
            setOrders(
                orders.map((order) =>
                    order._id === orderId
                        ? { ...order, status: newStatus }
                        : order
                )
            );

            alert(`Order status updated to ${newStatus}`);
        } catch (err) {
            console.error("Error updating order status:", err);
            alert("Error updating order status");
        }
    };

    const refreshOrders = () => {
        findShopAndLoadOrders();
    };
    const handleNext = () => {
        if (visibleStart + maxVisible - 1 < paginationCount) {
            setVisibleStart(visibleStart + 1);
        }
    };

    const handlePrev = () => {
        if (visibleStart > 1) {
            setVisibleStart(visibleStart - 1);
        }
    };
    const getVisiblePages = () => {
        const end = Math.min(visibleStart + maxVisible - 1, paginationCount);
        return Array.from(
            { length: end - visibleStart + 1 },
            (_, i) => visibleStart + i
        );
    };
    useEffect(() => {
        updatePagination();
    }, [currentPageIndex]);
    const updatePagination = () => {
        const end =
            currentPageIndex * 5 > orders.length
                ? orders.length
                : currentPageIndex * 5;
        setSlicesOrders(orders.slice(end - 5, end));
    };

    const handleOpenMap = (address) => {
        // Encode the address to make it URL-safe
        const encodedAddress = encodeURIComponent(address);
        // Construct the Google Maps search URL
        const mapUrl = `https://www.google.com/maps?q=${encodedAddress}`;
        // Open the map in a new tab
        window.open(mapUrl, "_blank");
    };

    if (loading) {
        return <div style={styles.loading}>Loading orders...</div>;
    }

    if (!shop) {
        return (
            <div style={styles.container}>
                <h3>
                    <AiFillAccountBook
                        style={{ marginRight: "5px", marginBottom: "-2px" }}
                    />{" "}
                    Orders
                </h3>
                <p>You need to create a shop first to receive orders.</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3>
                    <AiFillAccountBook
                        style={{ marginRight: "5px", marginBottom: "-2px" }}
                    />{" "}
                    Orders for {shop.name}
                </h3>
                <button onClick={refreshOrders} style={styles.refreshButton}>
                    <GrRefresh
                        style={{
                            marginBottom: "-2px",
                            marginRight: "5px",
                            fontSize: "15px",
                        }}
                    />{" "}
                    Refresh
                </button>
            </div>

            {orders.length === 0 ? (
                <div style={styles.noOrders}>
                    <p>No orders received yet.</p>
                    <p>Orders will appear here when customers place them.</p>
                </div>
            ) : (
                <div style={styles.ordersList}>
                    {slicedOrders.map((order) => (
                        <div key={order._id} style={styles.orderCard}>
                            <div style={styles.orderHeader}>
                                <h4>Order #{order._id.slice(-6)}</h4>
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

                            {/* Enhanced Customer & Delivery Information */}
                            <div style={styles.deliveryInfo}>
                                <h5>🚚 Delivery Information:</h5>
                                <div className="customer-details-shopkeeper-dashboard">
                                    <div style={styles.contactInfo}>
                                        <p>
                                            <strong>Customer:</strong>{" "}
                                            {order.customerContact?.name ||
                                                order.customerId?.name ||
                                                "N/A"}
                                        </p>
                                        <p>
                                            <strong>Email:</strong>{" "}
                                            {order.customerContact?.email ||
                                                order.customerId?.email ||
                                                "N/A"}
                                        </p>
                                        <p>
                                            <strong>Phone:</strong>{" "}
                                            {order.customerContact?.phone ||
                                                "Not provided"}
                                        </p>
                                    </div>

                                    <div style={styles.addressInfo}>
                                        <p
                                            style={{
                                                display: "flex",
                                                gap: "5px",
                                            }}
                                        >
                                            <strong>
                                                📍 Delivery Address:
                                            </strong>
                                            <button
                                                onClick={() =>
                                                    handleOpenMap(
                                                        order.deliveryAddress
                                                            .formattedAddress
                                                    )
                                                }
                                                style={{
                                                    cursor: "pointer",
                                                    border: "none",
                                                    background: "none",
                                                    display: "flex",
                                                    gap: "10px",
                                                }}
                                            >
                                                <MdDirections
                                                    style={{ fontSize: "20px" }}
                                                />
                                            </button>
                                        </p>

                                        <div style={styles.fullAddress}>
                                            {order.deliveryAddress ? (
                                                <>
                                                    <p>
                                                        {
                                                            order
                                                                .deliveryAddress
                                                                .flat
                                                        }{" "}
                                                        {
                                                            order
                                                                .deliveryAddress
                                                                .building
                                                        }
                                                    </p>
                                                    <p>
                                                        {
                                                            order
                                                                .deliveryAddress
                                                                .street
                                                        }
                                                    </p>
                                                    <p>
                                                        {
                                                            order
                                                                .deliveryAddress
                                                                .area
                                                        }
                                                        ,{" "}
                                                        {
                                                            order
                                                                .deliveryAddress
                                                                .city
                                                        }
                                                    </p>
                                                    <p>
                                                        Pincode:{" "}
                                                        {
                                                            order
                                                                .deliveryAddress
                                                                .pincode
                                                        }
                                                    </p>
                                                    {order.deliveryAddress
                                                        .landmark && (
                                                        <p>
                                                            <em>
                                                                Landmark:{" "}
                                                                {
                                                                    order
                                                                        .deliveryAddress
                                                                        .landmark
                                                                }
                                                            </em>
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <p style={styles.noAddress}>
                                                    ⚠️ Delivery address not
                                                    available
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={styles.orderItems}>
                                <h5>📋 Items Ordered:</h5>
                                {order.items.map((item, index) => (
                                    <div key={index} style={styles.orderItem}>
                                        <span>
                                            {item.productId?.name || "Product"}
                                        </span>
                                        <span>Qty: {item.quantity}</span>
                                        <span>
                                            ₹
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
                                        Total: ₹
                                        {order.totalAmount?.toFixed(2) ||
                                            "0.00"}
                                    </strong>
                                </div>
                                <div style={styles.orderDate}>
                                    Ordered:{" "}
                                    {new Date(
                                        order.orderDate
                                    ).toLocaleDateString("en-IN")}
                                </div>
                            </div>

                            <div style={styles.actionButtons}>
                                {order.status === "PENDING" && (
                                    <>
                                        <button
                                            onClick={() =>
                                                updateOrderStatus(
                                                    order._id,
                                                    "CONFIRMED"
                                                )
                                            }
                                            style={styles.confirmButton}
                                        >
                                            ✅ Confirm Order
                                        </button>
                                        <button
                                            onClick={() =>
                                                updateOrderStatus(
                                                    order._id,
                                                    "CANCELLED"
                                                )
                                            }
                                            style={styles.cancelButton}
                                        >
                                            ❌ Cancel Order
                                        </button>
                                    </>
                                )}
                                {order.status === "CONFIRMED" && (
                                    <button
                                        onClick={() =>
                                            updateOrderStatus(
                                                order._id,
                                                "SHIPPED"
                                            )
                                        }
                                        style={styles.shipButton}
                                    >
                                        🚚 Mark as Shipped
                                    </button>
                                )}
                                {order.status === "SHIPPED" && (
                                    <button
                                        onClick={() =>
                                            updateOrderStatus(
                                                order._id,
                                                "DELIVERED"
                                            )
                                        }
                                        style={styles.deliverButton}
                                    >
                                        ✅ Mark as Delivered
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {orders.length > 5 && (
                <div className="pagination-wrapper">
                    {paginationCount > maxVisible && (
                        <button
                            onClick={handlePrev}
                            className="pagination-button"
                            disabled={visibleStart === 1}
                        >
                            {"<"}
                        </button>
                    )}

                    {visibleStart > 1 && <span>...</span>}
                    {getVisiblePages().map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPageIndex(page)}
                            className={`pagination-button ${
                                page === currentPageIndex ? "active" : ""
                            }`}
                            style={{
                                background:
                                    page === currentPageIndex ? "#333" : "#fff",
                                color:
                                    page === currentPageIndex ? "#fff" : "#000",
                            }}
                        >
                            {page}
                        </button>
                    ))}

                    {visibleStart + maxVisible - 1 < paginationCount && (
                        <span>...</span>
                    )}

                    {paginationCount > maxVisible && (
                        <button
                            onClick={handleNext}
                            className="pagination-button"
                            disabled={
                                visibleStart + maxVisible - 1 >= paginationCount
                            }
                        >
                            {">"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

const getStatusColor = (status) => {
    switch (status) {
        case "PENDING":
            return "#ffc107";
        case "CONFIRMED":
            return "#17a2b8";
        case "SHIPPED":
            return "#007bff";
        case "DELIVERED":
            return "#28a745";
        case "CANCELLED":
            return "#dc3545";
        default:
            return "#6c757d";
    }
};

const styles = {
    container: {
        padding: "20px",
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
        color: "#666",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
    },
    deliveryInfo: {
        backgroundColor: "#f0f8ff",
        padding: "15px",
        borderRadius: "6px",
        marginBottom: "15px",
        border: "1px solid #b8daff",
    },
    contactInfo: {
        backgroundColor: "#fff",
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #ddd",
    },
    addressInfo: {
        backgroundColor: "#fff",
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #ddd",
        textAlign: "left",
        cursor: "pointer",
    },
    fullAddress: {
        marginTop: "8px",
        lineHeight: "1.4",
    },
    noAddress: {
        color: "#dc3545",
        fontWeight: "bold",
    },
    confirmButton: {
        padding: "8px 16px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        marginRight: "10px",
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
        alignItems: "center",
        marginBottom: "15px",
    },
    statusBadge: {
        padding: "4px 12px",
        borderRadius: "20px",
        color: "white",
        fontSize: "12px",
        fontWeight: "bold",
    },
    customerInfo: {
        backgroundColor: "#f8f9fa",
        padding: "15px",
        borderRadius: "6px",
        marginBottom: "15px",
    },
    orderItems: {
        marginBottom: "15px",
    },
    orderItem: {
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid #eee",
    },
    orderFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px",
        paddingTop: "15px",
        borderTop: "1px solid #eee",
    },
    totalAmount: {
        fontSize: "18px",
    },
    orderDate: {
        color: "#666",
        fontSize: "14px",
    },
    actionButtons: {
        display: "flex",
        gap: "10px",
    },
    shipButton: {
        padding: "8px 16px",
        backgroundColor: "#17a2b8",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    deliverButton: {
        padding: "8px 16px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    cancelButton: {
        padding: "8px 16px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
};
