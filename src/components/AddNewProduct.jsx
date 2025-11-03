import React, { useState, useEffect, useContext } from "react";
import Papa from "papaparse";
import api from "../api/api";
import { MdProductionQuantityLimits } from "react-icons/md";
import { AuthContext } from "../contexts/AuthContext";

function AddNewProduct() {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [addingProduct, setAddingProduct] = useState(false);
    const [shop, setShop] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [csvData, setCsvData] = useState([]);
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

    const unitsOption = ["Kg", "Ltr", "packet", "piece", "Bottle"];

    const [product, setProduct] = useState({
        name: "",
        category: "",
        price: "",
        stock: "",
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
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setCsvFile(file);
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    console.log("Parsed CSV Data:", results.data);
                    setCsvData(results.data);
                },
            });
        }
    };
    const handleUploadData = async () => {
        if (!csvData.length) {
            alert("Please upload a valid CSV file first.");
            return;
        }

        if (!shop?._id) {
            alert("Shop not found. Please ensure you're logged in correctly.");
            return;
        }

        setUploading(true);

        try {
            for (const item of csvData) {
                if (!item.name || !item.price || !item.stock) continue;

                const payload = {
                    shopId: shop._id,
                    name: item.name.trim(),
                    category: item.category?.trim() || "others",
                    price: parseFloat(item.price),
                    stock: parseInt(item.stock),
                    unit: item.unit?.trim() || "pcs",
                    image: item.image?.trim() || "",
                };

                await api.post("/products", payload);
            }

            alert("All products uploaded successfully!");
        } catch (err) {
            console.error("Error uploading products:", err);
            const errorMsg = err.response?.data?.error || err.message;
            alert("Error uploading some products: " + errorMsg);
        } finally {
            setUploading(false);
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
                    color: "#2B4936",
                }}
            >
                <MdProductionQuantityLimits
                    style={{
                        fontSize: "25px",
                        marginBottom: "-4px",
                        color: "#2B4936",
                    }}
                />{" "}
                Add New Product
            </h4>
            <div style={styles.productForm}>
                <div className="add-new-product-form-row">
                    <div className="input-container">
                        <label
                            htmlFor="name"
                            style={{
                                color: "#FFFAF0",
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
                            className="add-new-product-input"
                        />
                    </div>

                    <div className="input-container">
                        <label
                            htmlFor="name"
                            style={{
                                color: "#FFFAF0",
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

                <div className="customer-details-shopkeeper-dashboard">
                    <div className="input-container">
                        <label
                            htmlFor="price"
                            style={{
                                color: "#FFFAF0",
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
                            className="add-new-product-input"
                        />
                    </div>

                    <div className="input-container">
                        <label
                            htmlFor="unit"
                            style={{
                                color: "#FFFAF0",
                            }}
                        >
                            Unit
                        </label>
                        <select
                            name="unit"
                            value={product.unit}
                            onChange={handleProductChange}
                            style={styles.productInput}
                        >
                            <option value="">
                                Select Unit (Kg, Ltr, ...etc)
                            </option>
                            {unitsOption.map((units) => (
                                <option key={units} value={units}>
                                    {units}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="add-new-product-form-row-image">
                    <div className="input-container">
                        <label
                            htmlFor="stock"
                            style={{
                                color: "#FFFAF0",
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
                            className="add-new-product-input"
                        />
                    </div>

                    <div className="input-container">
                        <label
                            htmlFor="image"
                            style={{
                                color: "#FFFAF0",
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
                            className="add-new-product-input"
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

                <hr style={{ borderColor: "white" }} />
                <div className="upload-csv-wrapper">
                    <h5
                        style={{
                            color: "white",
                            textAlign: "#FFFAF0",
                            margin: "10px 0",
                        }}
                    >
                        OR Upload Products via CSV
                    </h5>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        style={{
                            color: "#FFFAF0",
                            marginTop: "10px",
                            display: "block",
                            margin: "0 auto",
                        }}
                    />

                    {csvData.length > 0 && (
                        <p style={{ color: "lightgreen", textAlign: "center" }}>
                            {csvData.length} products ready to upload
                        </p>
                    )}

                    <button
                        onClick={handleUploadData}
                        disabled={uploading}
                        style={
                            uploading
                                ? styles.disabledButton
                                : styles.fileUploadButton
                        }
                    >
                        {uploading ? " Uploading..." : " Upload Data"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddNewProduct;

const styles = {
    fileUploadButton: {
        padding: "10px",
        backgroundColor: "#2B4936",
        color: "#FFFAF0",
        border: "none",
        borderRadius: "25px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
        marginTop: "10px",
    },
    loading: {
        textAlign: "center",
        padding: "50px",
        fontSize: "18px",
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
        backgroundColor: "#89AA97",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #2B4936",
    },
    productInput: {
        padding: "10px",
        border: "1px solid #2B4936",
        backgroundColor: "#FFFAF0",
        borderRadius: "12px",
        fontSize: "14px",
        transition: "border-color 0.3s",
        outline: "none",
        color: "#2B4936",
        display: "flex",
        width: "fit-content",
    },
    imageInput: {
        padding: "10px",
        border: "1px solid #2B4936",
        backgroundColor: "#FFFAF0",
        borderRadius: "12px",
        color: "#2B4936",
        fontSize: "14px",
        marginBottom: "15px",
    },
    addButton: {
        padding: "15px",
        backgroundColor: "#2B4936",
        color: "#FFFAF0",
        border: "none",
        borderRadius: "25px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
    },
};
