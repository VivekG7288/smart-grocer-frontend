import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";

async function haveSameShopId(items) {
    if (!Array.isArray(items) || items.length === 0) return false;

    try {
        const shopsRes = await api.get("/shops");

        const firstShopId = items[0].shopId;
        const allSame = items.every((item) => item.shopId === firstShopId);
        const filteredStore = shopsRes.data.filter(
            (x) => x._id == items[0].shopId
        );

        return filteredStore[0].homeDelivery && allSame;
    } catch (error) {
        console.error("Error checking shop IDs:", error);
        return false;
    }
}

export default function Cart({ deliveryAddress }) {
    const { user } = useContext(AuthContext);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState("");
    const [sameShop, setSameShop] = useState(false);
    const handleCheckboxChange = (option) => {
        setSelectedOption(option === selectedOption ? "" : option);
    };

    useEffect(() => {
        loadCart();
    }, []);

    useEffect(() => {
        async function checkShop() {
            setLoading(true);
            const result = await haveSameShopId(cart);
            setSameShop(result);
            setLoading(false);
        }

        if (cart && cart.length > 0) {
            checkShop();
        } else {
            setSameShop(false);
            setLoading(false);
        }
    }, [cart]);

    const loadCart = () => {
        const cartData = JSON.parse(localStorage.getItem("cart") || "[]");
        console.log("Loaded cart:", cartData);
        setCart(cartData);
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        const updatedCart = cart.map((item) =>
            item._id === productId ? { ...item, quantity: newQuantity } : item
        );
        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
    };

    const removeFromCart = (productId) => {
        const updatedCart = cart.filter((item) => item._id !== productId);
        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
    };

    const addToPantry = async (product) => {
        try {
            // Get user's current delivery address
            const savedAddress = localStorage.getItem(
                `deliveryAddress_${user._id}`
            );
            let deliveryAddress = null;

            if (savedAddress) {
                deliveryAddress = JSON.parse(savedAddress);
            }

            const payload = {
                userId: user._id,
                shopId: product.shopId,
                productId: product._id,
                productName: product.name,
                brandName: "", // Can add input for this
                quantityPerPack: 1, // Default, can be customized
                unit: product.unit,
                packsOwned: 2, // Default
                price: product.price,
                refillThreshold: 1,

                // Include delivery address
                deliveryAddress: deliveryAddress
                    ? {
                          flat: deliveryAddress.flat || "",
                          building: deliveryAddress.building || "",
                          street: deliveryAddress.street || "",
                          area: deliveryAddress.area || "",
                          landmark: deliveryAddress.landmark || "",
                          city: deliveryAddress.city || "",
                          pincode: deliveryAddress.pincode || "",
                          coordinates: deliveryAddress.coordinates || [],
                          formattedAddress:
                              deliveryAddress.formattedAddress ||
                              `${deliveryAddress.area}, ${deliveryAddress.city}`,
                      }
                    : null,
            };

            await api.post("/pantry", payload);
            alert(`${product.name} added to your pantry for tracking!`);
        } catch (err) {
            console.error("Error adding to pantry:", err);
            alert(
                "Error adding to pantry: " +
                    (err.response?.data?.error || err.message)
            );
        }
    };

    const placeOrder = async () => {
        if (!cart.length) {
            alert("Cart is empty");
            return;
        }

        if (!user) {
            alert("Please login to place order");
            return;
        }

        if (!deliveryAddress) {
            alert("Please set your delivery address first");
            return;
        }

        // Validate delivery address has required fields
        if (
            !deliveryAddress.area ||
            !deliveryAddress.city ||
            !deliveryAddress.pincode
        ) {
            alert(
                "Please provide complete delivery address (area, city, pincode)"
            );
            return;
        }

        setLoading(true);
        try {
            // Group cart items by shop
            const ordersByShop = {};
            cart.forEach((item) => {
                if (!ordersByShop[item.shopId]) {
                    ordersByShop[item.shopId] = [];
                }
                ordersByShop[item.shopId].push({
                    productId: item._id,
                    quantity: item.quantity,
                    price: item.price,
                });
            });

            // Create separate orders for each shop
            for (const [shopId, items] of Object.entries(ordersByShop)) {
                const totalAmount = items.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                );

                const orderData = {
                    customerId: user._id,
                    shopId: shopId,
                    items: items,
                    totalAmount: totalAmount,
                    status: "PENDING",

                    // Include delivery address
                    deliveryAddress: {
                        flat: deliveryAddress.flat || "",
                        building: deliveryAddress.building || "",
                        street: deliveryAddress.street || "",
                        area: deliveryAddress.area,
                        landmark: deliveryAddress.landmark || "",
                        city: deliveryAddress.city,
                        pincode: deliveryAddress.pincode,
                        coordinates: deliveryAddress.coordinates || [],
                        formattedAddress:
                            deliveryAddress.formattedAddress ||
                            `${deliveryAddress.area}, ${deliveryAddress.city} - ${deliveryAddress.pincode}`,
                    },

                    // Include customer contact info
                    customerContact: {
                        name: user.name,
                        email: user.email,
                        phone: user.phone || "",
                    },
                };

                console.log("Placing order with delivery address:", orderData);
                await api.post("/orders", orderData);
            }

            // Clear cart after successful order
            localStorage.removeItem("cart");
            setCart([]);
            alert(
                "Order(s) placed successfully! The shop will contact you for delivery confirmation."
            );
        } catch (err) {
            console.error("Error placing order:", err);
            const errorMsg = err.response?.data?.error || err.message;
            alert("Error placing order: " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const getTotalAmount = () => {
        return cart
            .reduce((total, item) => total + item.price * item.quantity, 0)
            .toFixed(2);
    };

    if (cart.length === 0) {
        return (
            <div style={styles.container}>
                <h3>🛒 Your Cart</h3>
                <div style={styles.emptyCart}>
                    <p>Your cart is empty</p>
                    <p>Subscribe to shops and add products to get started!</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h3>🛒 Your Cart ({cart.length} items)</h3>

            {/* Delivery Address Display */}
            {deliveryAddress && (
                <div style={styles.deliveryAddressCard}>
                    <h4>🚚 Delivering to:</h4>
                    <div style={styles.addressDetails}>
                        <p>
                            <strong>
                                {deliveryAddress.flat}{" "}
                                {deliveryAddress.building}
                            </strong>
                        </p>
                        <p>{deliveryAddress.street}</p>
                        <p>
                            {deliveryAddress.area}, {deliveryAddress.city}
                        </p>
                        <p>Pincode: {deliveryAddress.pincode}</p>
                        {deliveryAddress.landmark && (
                            <p>
                                <em>Landmark: {deliveryAddress.landmark}</em>
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div style={styles.cartItems}>
                {cart.map((item) => (
                    <div key={item._id} style={styles.cartItem}>
                        {item.image && (
                            <img
                                src={item.image}
                                alt={item.name}
                                style={styles.itemImage}
                            />
                        )}
                        <div style={styles.itemDetails}>
                            <h4>{item.name}</h4>
                            <p style={styles.itemCategory}>{item.category}</p>
                            <p style={styles.itemPrice}>
                                ₹{item.price} per {item.unit}
                            </p>
                        </div>
                        <div style={styles.quantityControls}>
                            <button
                                onClick={() =>
                                    updateQuantity(item._id, item.quantity - 1)
                                }
                                style={styles.quantityButton}
                            >
                                -
                            </button>
                            <span style={styles.quantity}>{item.quantity}</span>
                            <button
                                onClick={() =>
                                    updateQuantity(item._id, item.quantity + 1)
                                }
                                style={styles.quantityButton}
                            >
                                +
                            </button>
                        </div>
                        <div style={styles.itemTotal}>
                            ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button
                            onClick={() => addToPantry(item)}
                            disabled={item.stock === 0}
                            style={
                                item.stock === 0
                                    ? styles.disabledButton
                                    : styles.pantryButton
                            }
                        >
                            Track in Pantry
                        </button>
                        <button
                            onClick={() => removeFromCart(item._id)}
                            style={styles.removeButton}
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>

            <div className="place-order-wrapper" style={styles.cartSummary}>
                {sameShop && (
                    <div className="checkbox-wrapper">
                        <div className="checkbox-container">
                            <input
                                style={{ cursor: "pointer" }}
                                type="checkbox"
                                name="optionName"
                                checked={selectedOption === "store"}
                                onChange={() => handleCheckboxChange("store")}
                            />
                            <label> Pick from store</label>
                        </div>

                        <div className="checkbox-container">
                            <input
                                style={{ cursor: "pointer" }}
                                type="checkbox"
                                name="optionName"
                                checked={selectedOption === "delivery"}
                                onChange={() =>
                                    handleCheckboxChange("delivery")
                                }
                            />
                            <label> Need Home delivery</label>
                            {selectedOption === "delivery" && (
                                <p style={{ color: "red", marginTop: "4px" }}>
                                    Delivery charges will be applied
                                </p>
                            )}
                        </div>
                    </div>
                )}
                <div className="cart-button-wrapper">
                    <div style={styles.totalAmount}>
                        <strong>Total: ₹{getTotalAmount()}</strong>
                    </div>

                    <button
                        onClick={placeOrder}
                        disabled={loading}
                        style={
                            loading
                                ? styles.disabledButton
                                : styles.placeOrderButton
                        }
                    >
                        {loading ? "🚚 Placing Order..." : "🛒 Place Order"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "800px",
        margin: "0 auto",
    },
    pantryButton: {
        width: "fit-content",
        padding: "5px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "600",
    },
    emptyCart: {
        textAlign: "center",
        padding: "50px",
        color: "#666",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
    },
    deliveryAddressCard: {
        backgroundColor: "#e8f5e8",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #28a745",
    },
    addressDetails: {
        marginTop: "10px",
        backgroundColor: "#fff",
        padding: "10px",
        borderRadius: "4px",
        lineHeight: "1.4",
    },
    cartItems: {
        marginBottom: "30px",
    },
    cartItem: {
        display: "flex",
        alignItems: "center",
        padding: "15px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        marginBottom: "15px",
        gap: "15px",
        backgroundColor: "#fff",
    },
    itemImage: {
        width: "80px",
        height: "80px",
        objectFit: "cover",
        borderRadius: "4px",
    },
    itemDetails: {
        flex: 1,
    },
    itemCategory: {
        color: "#666",
        fontSize: "14px",
        margin: "4px 0",
    },
    itemPrice: {
        color: "#007bff",
        fontWeight: "bold",
        margin: "4px 0",
    },
    quantityControls: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        padding: "5px",
    },
    quantityButton: {
        width: "30px",
        height: "30px",
        border: "none",
        backgroundColor: "#f8f9fa",
        cursor: "pointer",
        borderRadius: "4px",
        fontWeight: "bold",
    },
    quantity: {
        minWidth: "30px",
        textAlign: "center",
        fontWeight: "bold",
    },
    itemTotal: {
        fontWeight: "bold",
        minWidth: "80px",
        textAlign: "right",
        fontSize: "16px",
    },
    removeButton: {
        padding: "8px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    cartSummary: {
        borderTop: "2px solid #ddd",
        paddingTop: "20px",
        textAlign: "right",
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
    },
    totalAmount: {
        fontSize: "24px",
        marginBottom: "15px",
        color: "#333",
    },
    placeOrderButton: {
        padding: "15px 40px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "18px",
        fontWeight: "bold",
        cursor: "pointer",
        transition: "background-color 0.3s",
    },
    disabledButton: {
        padding: "15px 40px",
        backgroundColor: "#6c757d",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "18px",
        cursor: "not-allowed",
    },
};
