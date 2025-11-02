import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { IoStorefrontSharp } from "react-icons/io5";
import { BsFillBookmarkPlusFill } from "react-icons/bs";
import { FaSearch } from "react-icons/fa";

export default function PantryManager() {
    const { user } = useContext(AuthContext);
    const [pantryItems, setPantryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [query, setQuery] = useState("");
    const [filteredProduct, setFilteredProducts] = useState([pantryItems]);

    useEffect(() => {
        if (query.trim() === "") {
            setFilteredProducts(pantryItems);
        } else {
            const lowerCaseQuery = query.toLowerCase();
            const filteredProducts = pantryItems.filter((p) =>
                p.productName.toLowerCase().includes(lowerCaseQuery)
            );
            setFilteredProducts(filteredProducts);
        }
    }, [query, pantryItems, user]);

    useEffect(() => {
        loadPantryItems();
    }, [user]);

    const loadPantryItems = async () => {
        try {
            const res = await api.get(`/pantry/user/${user._id}`);
            setPantryItems(res.data);
        } catch (err) {
            console.error("Error loading pantry:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateConsumption = async (itemId, newPacks) => {
        try {
            const res = await api.put(`/pantry/${itemId}`, {
                currentPacks: newPacks,
            });

            setPantryItems(
                pantryItems.map((item) =>
                    item._id === itemId ? res.data : item
                )
            );
        } catch (err) {
            console.error("Error updating consumption:", err);
        }
    };

    const requestRefill = async (itemId) => {
        try {
            const res = await api.put(`/pantry/${itemId}`, {
                status: "REFILL_REQUESTED",
            });

            setPantryItems(
                pantryItems.map((item) =>
                    item._id === itemId ? res.data : item
                )
            );

            alert(
                "Refill request sent to your shop! They will confirm shortly."
            );
        } catch (err) {
            console.error("Error requesting refill:", err);
            alert("Error requesting refill");
        }
    };

    if (loading) {
        return <div style={styles.loading}>Loading your pantry...</div>;
    }

    return (
        <div style={styles.container}>
            <div className="pantry-header-wrapper" style={styles.header}>
                <h3 style={{ color: "#2B4936" }}>
                    <IoStorefrontSharp /> Your Smart Pantry
                </h3>

                <div className="search-bar-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                        className="search-bar"
                        type="text"
                        value={query}
                        placeholder="Search grocery..."
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    style={styles.addButton}
                >
                    <BsFillBookmarkPlusFill style={{ marginBottom: "-2px" }} />{" "}
                    Track New Item
                </button>
            </div>

            {pantryItems.length === 0 ? (
                <div style={styles.emptyState}>
                    <h4>Your pantry is empty!</h4>
                    <p>
                        Start tracking your regular groceries to get automatic
                        refill notifications.
                    </p>
                </div>
            ) : (
                <div style={styles.pantryGrid}>
                    {filteredProduct.map((item) => (
                        <div
                            key={item._id}
                            style={getItemCardStyle(item.status)}
                        >
                            <div style={styles.itemHeader}>
                                <h4>{item.productName}</h4>
                                <span style={getStatusBadgeStyle(item.status)}>
                                    {item.status.replace("_", " ")}
                                </span>
                            </div>

                            <div style={styles.itemDetails}>
                                <p>
                                    <strong>Shop:</strong> {item.shopId?.name}
                                </p>
                                <p>
                                    <strong>Brand:</strong>{" "}
                                    {item.brandName || "Generic"}
                                </p>
                                <p>
                                    <strong>Size:</strong>{" "}
                                    {item.quantityPerPack} {item.unit}
                                </p>
                            </div>

                            <div style={styles.stockTracker}>
                                <p>
                                    <strong>Current Stock:</strong>
                                </p>
                                <div style={styles.stockControls}>
                                    <button
                                        onClick={() =>
                                            updateConsumption(
                                                item._id,
                                                Math.max(
                                                    0,
                                                    item.currentPacks - 1
                                                )
                                            )
                                        }
                                        style={styles.stockButton}
                                    >
                                        -
                                    </button>
                                    <span style={styles.stockCount}>
                                        {item.currentPacks} / {item.packsOwned}{" "}
                                        packs
                                    </span>
                                    <button
                                        onClick={() =>
                                            updateConsumption(
                                                item._id,
                                                Math.min(
                                                    item.packsOwned,
                                                    item.currentPacks + 1
                                                )
                                            )
                                        }
                                        style={styles.stockButton}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div style={styles.itemActions}>
                                {item.status === "STOCKED" &&
                                    item.currentPacks <=
                                        item.refillThreshold && (
                                        <button
                                            onClick={() =>
                                                requestRefill(item._id)
                                            }
                                            style={styles.refillButton}
                                        >
                                            🔔 Request Refill
                                        </button>
                                    )}

                                {item.status === "LOW" && (
                                    <button
                                        onClick={() => requestRefill(item._id)}
                                        style={styles.refillButton}
                                    >
                                        🚨 Need Refill Now!
                                    </button>
                                )}

                                {[
                                    "REFILL_REQUESTED",
                                    "CONFIRMED",
                                    "OUT_FOR_DELIVERY",
                                ].includes(item.status) && (
                                    <div style={styles.statusMessage}>
                                        {item.status === "REFILL_REQUESTED" &&
                                            "⏳ Waiting for shop confirmation..."}
                                        {item.status === "CONFIRMED" &&
                                            "✅ Confirmed! Preparing for delivery..."}
                                        {item.status === "OUT_FOR_DELIVERY" &&
                                            "🚚 Out for delivery!"}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const getItemCardStyle = (status) => ({
    ...styles.itemCard,
    border: `4px solid ${
        status === "LOW" || status === "REFILL_REQUESTED"
            ? "#dc3545"
            : status === "CONFIRMED" || status === "OUT_FOR_DELIVERY"
            ? "#ffc107"
            : status === "STOCKED"
            ? "#28a745"
            : "#6c757d"
    }`,
});

const getStatusBadgeStyle = (status) => ({
    ...styles.statusBadge,
    backgroundColor:
        status === "LOW" || status === "REFILL_REQUESTED"
            ? "#dc3545"
            : status === "CONFIRMED" || status === "OUT_FOR_DELIVERY"
            ? "#ffc107"
            : status === "STOCKED"
            ? "#28a745"
            : "#6c757d",
});

const styles = {
    container: {
        padding: "20px",
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
    addButton: {
        padding: "10px",
        backgroundColor: "#89AA97",
        color: "white",
        border: "none",
        borderRadius: "25px",
        cursor: "pointer",
        fontSize: "18px",
        fontWeight: "bold",
    },
    emptyState: {
        textAlign: "center",
        padding: "60px",
        backgroundColor: "#f8f9fa",
        borderRadius: "12px",
        color: "#666",
    },
    pantryGrid: {
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
    },
    itemCard: {
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",

        border: "1px solid #ddd",
        width: "auto",
    },
    itemHeader: {
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
    itemDetails: {
        marginBottom: "15px",
        fontSize: "14px",
        color: "#666",
    },
    stockTracker: {
        marginBottom: "15px",
    },
    stockControls: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginTop: "8px",
    },
    stockButton: {
        width: "30px",
        height: "30px",
        border: "1px solid #ddd",
        backgroundColor: "#f8f9fa",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
    },
    stockCount: {
        fontWeight: "bold",
        minWidth: "100px",
        textAlign: "center",
    },
    itemActions: {
        marginTop: "15px",
    },
    refillButton: {
        width: "100%",
        padding: "10px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
    },
    statusMessage: {
        textAlign: "center",
        padding: "10px",
        backgroundColor: "#fff3cd",
        borderRadius: "6px",
        color: "#856404",
        fontWeight: "bold",
    },
};
