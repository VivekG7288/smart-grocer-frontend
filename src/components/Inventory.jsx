import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { MdProductionQuantityLimits } from "react-icons/md";
import { MdInventory } from "react-icons/md";

function Inventory() {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [addingProduct, setAddingProduct] = useState(false);
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);

    const [product, setProduct] = useState({
        name: "",
        category: "",
        price: 0,
        stock: 0,
        unit: "",
        image: "",
    });
    useEffect(() => {
        findUserShop();
    }, [user]);

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
    const handleProductChange = (e) => {
        const { name, value, type } = e.target;
        const processedValue =
            type === "number" ? parseFloat(value) || 0 : value;
        setProduct({ ...product, [name]: processedValue });
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
    return (
        <div className="inventory-container">
            <div style={styles.section}>
                <h4 style={{ fontSize: "20px", margin: "10px" }}>
                    <MdProductionQuantityLimits
                        style={{ fontSize: "25px", marginBottom: "-4px" }}
                    />{" "}
                    Add New Product
                </h4>
                <div style={styles.productForm}>
                    <div style={styles.formRow}>
                        <div className="input-container">
                            <label
                                htmlFor="name"
                                style={{
                                    color: "white",
                                }}
                            >
                                Name
                            </label>
                            <input
                                name="name"
                                placeholder="Product Name *"
                                value={product.name}
                                onChange={handleProductChange}
                                style={styles.productInput}
                            />
                        </div>

                        <div className="input-container">
                            <label
                                htmlFor="name"
                                style={{
                                    color: "white",
                                }}
                            >
                                Category
                            </label>
                            <input
                                name="category"
                                placeholder="Category "
                                value={product.category}
                                onChange={handleProductChange}
                                style={styles.productInput}
                            />
                        </div>
                    </div>

                    <div style={styles.formRow}>
                        <div className="input-container">
                            <label
                                htmlFor="price"
                                style={{
                                    color: "white",
                                }}
                            >
                                Price
                            </label>
                            <input
                                name="price"
                                type="number"
                                step="0.01"
                                placeholder="Price (₹) *"
                                value={product.price}
                                onChange={handleProductChange}
                                style={styles.productInput}
                            />
                        </div>

                        <div className="input-container">
                            <label
                                htmlFor="unit"
                                style={{
                                    color: "white",
                                }}
                            >
                                Unit
                            </label>
                            <input
                                name="unit"
                                placeholder="Unit (kg, ltr, pcs)"
                                value={product.unit}
                                onChange={handleProductChange}
                                style={styles.productInput}
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "15px" }}>
                        <div className="input-container">
                            <label
                                htmlFor="stock"
                                style={{
                                    color: "white",
                                }}
                            >
                                Stock
                            </label>
                            <input
                                name="stock"
                                type="number"
                                placeholder="Stock Quantity *"
                                value={product.stock}
                                onChange={handleProductChange}
                                style={styles.productInput}
                            />
                        </div>

                        <div className="input-container">
                            <label
                                htmlFor="image"
                                style={{
                                    color: "white",
                                }}
                            >
                                Image
                            </label>
                            <input
                                name="image"
                                placeholder="Image URL (optional)"
                                value={product.image}
                                onChange={handleProductChange}
                                style={styles.imageInput}
                            />
                        </div>
                    </div>

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
                <h4>
                    <MdInventory
                        style={{ marginRight: "5px", marginBottom: "-2px" }}
                    />{" "}
                    Current Inventory ({products.length} items)
                </h4>
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

export default Inventory;

const styles = {
    loading: {
        textAlign: "center",
        padding: "50px",
        fontSize: "18px",
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
    section: {
        marginBottom: "40px",
    },
    productForm: {
        backgroundColor: "rgb(55 65 81 )",
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
        padding: "10px",
        border: "1px solid rgb(75 85 99)",
        backgroundColor: "rgba(31, 41, 55, 0.5)",
        borderRadius: "12px",
        fontSize: "14px",
        transition: "border-color 0.3s",
        outline: "none",
        color: "white",
        display: "flex",
        width: "fit-content",
    },
    imageInput: {
        padding: "10px",
        border: "1px solid rgb(75 85 99)",
        backgroundColor: "rgba(31, 41, 55, 0.5)",
        borderRadius: "12px",
        color: "white",
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
