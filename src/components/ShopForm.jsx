import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { CiShop } from "react-icons/ci";

export default function ShopForm() {
    const { user } = useContext(AuthContext);
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creatingShop, setCreatingShop] = useState(false);
    const [shopData, setShopData] = useState({
        name: "",
        address: "",
        phone: "",
        deliveryRadius: 5,
    });
    const [product, setProduct] = useState({
        name: "",
        category: "",
        price: 0,
        stock: 0,
        unit: "",
        image: "",
    });
    const [products, setProducts] = useState([]);
    const [addingProduct, setAddingProduct] = useState(false);

    useEffect(() => {
        findUserShop();
        loadGoogleMapsScript();
    }, [user]);

    const loadGoogleMapsScript = () => {
        if (window.google) {
            setTimeout(initAutocomplete, 100);
            return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD2TeCSHqgbJIHKG0zVgGDddi4bLzNEn8o&libraries=places`;
        script.async = true;
        script.onload = () => {
            setTimeout(initAutocomplete, 100);
        };
        document.head.appendChild(script);
    };

    const initAutocomplete = () => {
        const input = document.getElementById("shop-address-input");
        if (window.google && input) {
            const autocomplete = new window.google.maps.places.Autocomplete(
                input,
                {
                    types: ["establishment", "geocode"],
                    componentRestrictions: { country: "in" },
                }
            );

            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (place.formatted_address) {
                    setShopData((prev) => ({
                        ...prev,
                        address: place.formatted_address,
                    }));
                }
            });
        }
    };

    const findUserShop = async () => {
        try {
            setLoading(true);
            console.log("Looking for shops for user ID:", user._id);

            const res = await api.get("/shops");
            console.log("All shops:", res.data);

            const userShop = res.data.find((s) => {
                console.log(
                    "Comparing shop ownerId:",
                    s.ownerId,
                    "with user._id:",
                    user._id
                );
                return (
                    s.ownerId === user._id ||
                    s.ownerId.toString() === user._id.toString() ||
                    (typeof s.ownerId === "object" &&
                        s.ownerId._id === user._id)
                );
            });

            console.log("Found user shop:", userShop);

            if (userShop) {
                setShop(userShop);
                await loadProducts(userShop._id);
            }
        } catch (err) {
            console.error("Error finding user shop:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async (shopId) => {
        try {
            console.log("Loading products for shop:", shopId);
            const res = await api.get("/products");
            console.log("All products:", res.data);

            const shopProducts = res.data.filter(
                (p) =>
                    p.shopId === shopId ||
                    p.shopId.toString() === shopId.toString()
            );

            console.log("Shop products:", shopProducts);
            setProducts(shopProducts);
        } catch (err) {
            console.error("Error loading products:", err);
        }
    };

    const handleShopDataChange = (e) => {
        const { name, value } = e.target;
        setShopData({ ...shopData, [name]: value });
    };

    const handleProductChange = (e) => {
        const { name, value, type } = e.target;
        const processedValue =
            type === "number" ? parseFloat(value) || 0 : value;
        setProduct({ ...product, [name]: processedValue });
    };

    const handleCreateShop = async () => {
        try {
            if (!shopData.name.trim()) {
                alert("Shop name is required");
                return;
            }

            if (!shopData.address.trim()) {
                alert("Shop address is required for location services");
                return;
            }

            setCreatingShop(true);

            const payload = {
                ownerId: user._id,
                name: shopData.name.trim(),
                address: shopData.address.trim(),
                phone: shopData.phone.trim(),
                deliveryRadius: parseInt(shopData.deliveryRadius),
            };

            console.log("Creating shop with payload:", payload);
            const res = await api.post("/shops", payload);
            console.log("Shop created successfully:", res.data);

            setShop(res.data);
            alert(
                `Shop "${res.data.name}" created successfully!\nLocation: ${
                    res.data.location?.city || "Unknown"
                }\nDelivery Radius: ${res.data.deliveryRadius} km`
            );
        } catch (err) {
            console.error("Error creating shop:", err);
            const errorMsg = err.response?.data?.error || err.message;
            alert("Error creating shop: " + errorMsg);
        } finally {
            setCreatingShop(false);
        }
    };

    const addProduct = async () => {
        try {
            if (!product.name.trim() || !product.price || !product.stock) {
                alert("Product name, price, and stock are required");
                return;
            }

            setAddingProduct(true);

            const payload = {
                shopId: shop._id,
                name: product.name.trim(),
                category: product.category.trim(),
                price: parseFloat(product.price),
                stock: parseInt(product.stock),
                unit: product.unit.trim() || "pcs",
                image: product.image.trim(),
            };

            console.log("Adding product with payload:", payload);
            const res = await api.post("/products", payload);
            console.log("Product added:", res.data);

            setProducts([...products, res.data]);
            setProduct({
                name: "",
                category: "",
                price: 0,
                stock: 0,
                unit: "",
                image: "",
            });
            alert("Product added successfully!");
        } catch (err) {
            console.error("Error adding product:", err);
            const errorMsg = err.response?.data?.error || err.message;
            alert("Error adding product: " + errorMsg);
        } finally {
            setAddingProduct(false);
        }
    };

    const deleteProduct = async (productId) => {
        if (!confirm("Are you sure you want to delete this product?")) {
            return;
        }

        try {
            await api.delete(`/products/${productId}`);
            setProducts(products.filter((p) => p._id !== productId));
            alert("Product deleted successfully");
        } catch (err) {
            console.error("Error deleting product:", err);
            alert("Error deleting product");
        }
    };

    const updateStock = async (productId, newStock) => {
        try {
            const res = await api.put(`/products/${productId}`, {
                stock: newStock,
            });
            setProducts(
                products.map((p) =>
                    p._id === productId ? { ...p, stock: newStock } : p
                )
            );
            console.log("Stock updated successfully");
        } catch (err) {
            console.error("Error updating stock:", err);
            alert("Error updating stock");
        }
    };

    if (loading) {
        return <div style={styles.loading}>Loading your shop...</div>;
    }

    if (!shop) {
        return (
            <div style={styles.container}>
                <div style={styles.createShopCard}>
                    <h3>
                        <CiShop
                            style={{ marginRight: "5px", marginBottom: "-2px" }}
                        />{" "}
                        Create Your Shop
                    </h3>
                    <p>
                        Set up your shop with precise location for delivery
                        services
                    </p>

                    <div style={styles.form}>
                        <label
                            htmlFor="shop-name-input"
                            style={{
                                color: "rgb(209 213 219 / var(--tw-text-opacity, 1))",
                                marginTop: "10px",
                            }}
                        >
                            Shop Name
                        </label>
                        <input
                            name="name"
                            placeholder="Shop Name *"
                            value={shopData.name}
                            onChange={handleShopDataChange}
                            style={styles.input}
                            required
                        />
                        <label
                            htmlFor="shop-address-input"
                            style={{
                                color: "rgb(209 213 219 / var(--tw-text-opacity, 1))",
                                marginTop: "10px",
                            }}
                        >
                            Shop Address
                        </label>
                        <input
                            id="shop-address-input"
                            name="address"
                            placeholder="Shop Address * (Start typing for suggestions)"
                            value={shopData.address}
                            onChange={handleShopDataChange}
                            style={styles.input}
                            required
                        />

                        <label
                            htmlFor="phone-number-input"
                            style={{
                                color: "rgb(209 213 219 / var(--tw-text-opacity, 1))",
                                marginTop: "10px",
                            }}
                        >
                            Phone Number
                        </label>
                        <input
                            name="phone"
                            placeholder="Phone Number"
                            value={shopData.phone}
                            onChange={handleShopDataChange}
                            style={styles.input}
                            type="tel"
                        />

                        <div style={styles.radiusContainer}>
                            <label style={styles.radiusLabel}>
                                Delivery Radius:{" "}
                                <strong>{shopData.deliveryRadius} km</strong>
                            </label>
                            <input
                                type="range"
                                name="deliveryRadius"
                                min="1"
                                max="20"
                                value={shopData.deliveryRadius}
                                onChange={handleShopDataChange}
                                style={styles.slider}
                            />
                            <div style={styles.radiusHint}>
                                <span>1 km</span>
                                <span>20 km</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCreateShop}
                            disabled={creatingShop}
                            style={
                                creatingShop
                                    ? styles.disabledButton
                                    : styles.button
                            }
                        >
                            {creatingShop
                                ? " Creating Shop & Setting Location..."
                                : " Create Shop with Location"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.shopInfo}>
                <h3>🏪 {shop.name}</h3>
                <div style={styles.locationDetails}>
                    <p>
                        <strong>📍 Location:</strong>{" "}
                        {shop.location?.formattedAddress ||
                            shop.location?.address ||
                            "Location not available"}
                    </p>
                    <p>
                        <strong>🏙️ City:</strong>{" "}
                        {shop.location?.city || "Unknown"}
                    </p>
                    <p>
                        <strong>📮 Pincode:</strong>{" "}
                        {shop.location?.pincode || "Unknown"}
                    </p>
                    <p>
                        <strong>🚚 Delivery Radius:</strong>{" "}
                        {shop.deliveryRadius} km
                    </p>
                    <p>
                        <strong>📞 Phone:</strong>{" "}
                        {shop.phone || "Not provided"}
                    </p>
                    <p>
                        <strong>🆔 Shop ID:</strong> {shop._id}
                    </p>
                </div>
            </div>

            <div style={styles.section}>
                <h4>📦 Add New Product</h4>
                <div style={styles.productForm}>
                    <div style={styles.formRow}>
                        <input
                            name="name"
                            placeholder="Product Name *"
                            value={product.name}
                            onChange={handleProductChange}
                            style={styles.productInput}
                        />
                        <input
                            name="category"
                            placeholder="Category (e.g., Fruits, Vegetables)"
                            value={product.category}
                            onChange={handleProductChange}
                            style={styles.productInput}
                        />
                    </div>

                    <div style={styles.formRow}>
                        <input
                            name="price"
                            type="number"
                            step="0.01"
                            placeholder="Price (₹) *"
                            value={product.price}
                            onChange={handleProductChange}
                            style={styles.productInput}
                        />
                        <input
                            name="stock"
                            type="number"
                            placeholder="Stock Quantity *"
                            value={product.stock}
                            onChange={handleProductChange}
                            style={styles.productInput}
                        />
                        <input
                            name="unit"
                            placeholder="Unit (kg, ltr, pcs)"
                            value={product.unit}
                            onChange={handleProductChange}
                            style={styles.productInput}
                        />
                    </div>

                    <input
                        name="image"
                        placeholder="Image URL (optional)"
                        value={product.image}
                        onChange={handleProductChange}
                        style={styles.imageInput}
                    />

                    <button
                        onClick={addProduct}
                        disabled={addingProduct}
                        style={
                            addingProduct
                                ? styles.disabledButton
                                : styles.addButton
                        }
                    >
                        {addingProduct
                            ? "➕ Adding Product..."
                            : "➕ Add Product"}
                    </button>
                </div>
            </div>

            <div style={styles.section}>
                <h4>📋 Current Inventory ({products.length} items)</h4>
                {products.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p>
                            No products added yet. Add your first product above!
                        </p>
                    </div>
                ) : (
                    <div style={styles.productGrid}>
                        {products.map((p) => (
                            <div key={p._id} style={styles.productCard}>
                                {p.image && (
                                    <img
                                        src={p.image}
                                        alt={p.name}
                                        style={styles.productImage}
                                    />
                                )}
                                <div style={styles.productContent}>
                                    <h5 style={styles.productName}>{p.name}</h5>
                                    <p style={styles.productCategory}>
                                        {p.category}
                                    </p>
                                    <p style={styles.productPrice}>
                                        ₹{p.price} per {p.unit}
                                    </p>

                                    <div style={styles.stockControl}>
                                        <label>Stock: </label>
                                        <input
                                            type="number"
                                            value={p.stock}
                                            onChange={(e) =>
                                                updateStock(
                                                    p._id,
                                                    parseInt(e.target.value) ||
                                                        0
                                                )
                                            }
                                            style={styles.stockInput}
                                            min="0"
                                        />
                                        <span style={styles.stockUnit}>
                                            {p.unit}
                                        </span>
                                    </div>

                                    <div style={styles.productActions}>
                                        <button
                                            onClick={() => deleteProduct(p._id)}
                                            style={styles.deleteButton}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
    },
    loading: {
        textAlign: "center",
        padding: "50px",
        fontSize: "18px",
    },
    createShopCard: {
        backgroundColor: "rgb(31, 41, 55)",
        padding: "30px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        border: "1px solid #ddd",
        color: "white",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        marginTop: "20px",
    },
    input: {
        padding: "12px",
        color: "white",
        border: "1px solid rgb(75 85 99)",
        borderRadius: "12px",
        fontSize: "16px",
        outline: "none",
        transition: "border-color 0.3s",
        backgroundColor: "rgb(55 65 81 )",
    },
    radiusContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    radiusLabel: {
        fontSize: "14px",
        color: "white",
    },
    slider: {
        width: "100%",
        height: "6px",
        borderRadius: "3px",
        background: "#ddd",
        outline: "none",
    },
    radiusHint: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "12px",
        color: "white",
    },
    button: {
        padding: "14px",
        backgroundColor: "rgb(79 70 229)",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: "600",
        transition: "background-color 0.3s",
    },
    disabledButton: {
        padding: "14px",
        backgroundColor: "#6c757d",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "not-allowed",
        fontSize: "16px",
        fontWeight: "600",
    },
    shopInfo: {
        backgroundColor: "#e8f5e8",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "30px",
        border: "2px solid #28a745",
    },
    locationDetails: {
        backgroundColor: "#fff",
        padding: "15px",
        borderRadius: "6px",
        marginTop: "10px",
    },
    section: {
        marginBottom: "40px",
    },
    productForm: {
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #ddd",
    },
    formRow: {
        display: "flex",
        gap: "15px",
        marginBottom: "15px",
    },
    productInput: {
        flex: 1,
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "14px",
    },
    imageInput: {
        width: "100%",
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "14px",
        marginBottom: "15px",
    },
    addButton: {
        padding: "12px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
    },
    emptyState: {
        textAlign: "center",
        color: "#666",
        fontStyle: "italic",
        padding: "40px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
    },
    productGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "20px",
    },
    productCard: {
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        transition: "transform 0.2s",
    },
    productImage: {
        width: "100%",
        height: "150px",
        objectFit: "cover",
    },
    productContent: {
        padding: "15px",
    },
    productName: {
        margin: "0 0 8px 0",
        fontSize: "16px",
        fontWeight: "bold",
    },
    productCategory: {
        margin: "0 0 8px 0",
        color: "#666",
        fontSize: "14px",
    },
    productPrice: {
        margin: "0 0 15px 0",
        color: "#007bff",
        fontWeight: "bold",
        fontSize: "16px",
    },
    stockControl: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "15px",
    },
    stockInput: {
        width: "80px",
        padding: "5px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        textAlign: "center",
    },
    stockUnit: {
        fontSize: "14px",
        color: "#666",
    },
    productActions: {
        display: "flex",
        gap: "10px",
    },
    deleteButton: {
        padding: "6px 12px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "12px",
    },
};
