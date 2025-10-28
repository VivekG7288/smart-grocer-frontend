import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";

import { MdProductionQuantityLimits } from "react-icons/md";
import { AuthContext } from "../contexts/AuthContext";

function AddNewProduct() {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [addingProduct, setAddingProduct] = useState(false);
    const [shop, setShop] = useState(null);
    const productCategory = [
        ["All"],
        ["Fresh & Perishable"],
        ["Bakery & Ready-to-Eat"],
        ["Staples & Grains"],
        ["Beverages"],
        ["Packaged & Canned Goods"],
        ["Confectionery & Snacks"],
        ["Baby & Kids"],
        ["Personal Care & Beauty"],
        ["Home & Cleaning"],
        ["others"],
    ];
    const [products, setProducts] = useState([]);

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
            }
        } catch (err) {
            console.error("Error finding user shop:", err);
        } finally {
            setLoading(false);
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
    if (loading) {
        return <div style={styles.loading}>Loading your shop...</div>;
    }
    return (
        <div className="add-new-product-container">
            <h4
                style={{
                    fontSize: "20px",
                    margin: "10px",
                    textAlign: "center",
                }}
            >
                <MdProductionQuantityLimits
                    style={{ fontSize: "25px", marginBottom: "-4px" }}
                />{" "}
                Add New Product
            </h4>
            <div style={styles.productForm}>
                <div className="add-new-product-form-row">
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
                        <select
                            name="category"
                            value={product.category}
                            onChange={handleProductChange}
                            style={styles.productInput}
                        >
                            <option value="">Select Category</option>
                            {productCategory.map((cat) => (
                                <option key={cat[0]} value={cat[0]}>
                                    {cat[0]}
                                </option>
                            ))}
                        </select>
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

                <div className="add-new-product-form-row-image">
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
                        addingProduct ? styles.disabledButton : styles.addButton
                    }
                >
                    {addingProduct ? "➕ Adding Product..." : ` Add Product`}
                </button>
            </div>
        </div>
    );
}

export default AddNewProduct;

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
    productForm: {
        backgroundColor: "rgb(55 65 81 )",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #ddd",
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
        padding: "15px",
        backgroundColor: "rgb(79 70 229)",
        color: "white",
        border: "none",
        borderRadius: "25px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
    },
};
