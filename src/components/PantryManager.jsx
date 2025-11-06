import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { IoStorefrontSharp } from "react-icons/io5";
import { FaSearch } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";

export default function PantryManager() {
    const { user } = useContext(AuthContext);
    const [pantryItems, setPantryItems] = useState([]);
    const [loading, setLoading] = useState(true);
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
            // Add a local property for editable stock
            const itemsWithStock = res.data.map((item) => ({
                ...item,
                editablePacksOwned: item.packsOwned,
            }));
            setPantryItems(itemsWithStock);
        } catch (err) {
            console.error("Error loading pantry:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStockChange = (itemId, value) => {
        setPantryItems((prev) =>
            prev.map((item) =>
                item._id === itemId
                    ? { ...item, editablePacksOwned: Number(value) }
                    : item
            )
        );
    };

    const requestRefill = async (itemId) => {
        const item = pantryItems.find((i) => i._id === itemId);
        if (!item) return;

        try {
            const res = await api.put(`/pantry/${itemId}`, {
                status: "REFILL_REQUESTED",
                currentPacks: item.editablePacksOwned, // ✅ backend expects this field
            });

            setPantryItems((prev) =>
                prev.map((i) =>
                    i._id === itemId
                        ? {
                              ...res.data,
                              editablePacksOwned: res.data.currentPacks,
                          }
                        : i
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
    console.log(filteredProduct);

    const removePantryItem = async (itemID) => {
        try {
            await api.delete(`/pantry/user/${itemID}`);
            loadPantryItems();
        } catch (err) {
            console.error("Error while removing item from pantry", err);
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
                        <div key={item._id} style={styles.itemCard}>
                            <div style={styles.itemHeader}>
                                <h4>{item.productName}</h4>

                                <button
                                    onClick={() => removePantryItem(item._id)}
                                    style={{
                                        cursor: "pointer",
                                        background: "none",
                                        border: "none",
                                    }}
                                >
                                    <MdDeleteForever
                                        style={{
                                            fontSize: "25px",
                                            color: "red",
                                        }}
                                    />
                                </button>
                            </div>
                            <img
                                style={{
                                    objectFit: "contain",
                                    width: "200px",
                                    height: "200px",
                                    marginTop: "-30px",
                                }}
                                src={item.productId.image}
                            ></img>

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
                                <p style={{ minWidth: "120px", margin: 0 }}>
                                    <strong>Current Stock:</strong>
                                </p>
                                <div style={styles.stockControls}>
                                    <input
                                        name="stock"
                                        style={styles.stockCount}
                                        type="number"
                                        value={item.editablePacksOwned}
                                        onChange={(e) =>
                                            handleStockChange(
                                                item._id,
                                                e.target.value
                                            )
                                        }
                                    />{" "}
                                    {item.unit}
                                </div>
                            </div>

                            <div style={styles.itemActions}>
                                <button
                                    onClick={() => requestRefill(item._id)}
                                    style={styles.refillButton}
                                >
                                    🚨 Need Refill Now!
                                </button>

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
        gap: "20px",
        alignItems: "center",
        marginBottom: "30px",
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
        boxShadow: "0 4px 12px #2B4936",
        border: "1px solid #ddd",
        width: "200px",
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
        display: "flex",
        marginBottom: "15px",
    },
    stockControls: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
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
        maxWidth: "40px",
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
        marginTop: "10px",
    },
};
