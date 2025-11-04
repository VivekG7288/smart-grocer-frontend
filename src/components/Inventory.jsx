import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { MdInventory, MdOutlineBakeryDining } from "react-icons/md";
import { TbCategory2 } from "react-icons/tb";
import { GiFruitBowl, GiCannedFish, GiFastNoodles } from "react-icons/gi";
import { PiGrainsFill } from "react-icons/pi";
import { RiDrinks2Fill } from "react-icons/ri";
import { FaBabyCarriage, FaHome, FaSearch } from "react-icons/fa";
import { FaPumpSoap } from "react-icons/fa6";
import { BsFillBasketFill } from "react-icons/bs";
import { IoIosBasket } from "react-icons/io";

function Inventory() {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState(
        []
    );

    const [selectoryCategory, setSelectoryCategory] = useState("All");

    const onCatagorySelect = (value) => {
        setSelectoryCategory(value);
    };

    useEffect(() => {
        if (query.trim() === "") {
            setSelectedCategoryProducts(products);
        } else {
            setSelectoryCategory("All");
            const lowerCaseQuery = query.toLowerCase();
            const filteredProducts = products.filter((p) =>
                p.name.toLowerCase().includes(lowerCaseQuery)
            );
            setSelectedCategoryProducts(filteredProducts);
        }
    }, [query, products]);

    useEffect(() => {
        switch (selectoryCategory) {
            case "All":
                setSelectedCategoryProducts(products);
                break;
            case "Fresh & Perishable":
                setSelectedCategoryProducts(
                    products.filter((p) => p.category === "Fresh & Perishable")
                );
                break;
            case "Bakery & Ready-to-Eat":
                setSelectedCategoryProducts(
                    products.filter(
                        (p) => p.category === "Bakery & Ready-to-Eat"
                    )
                );
                break;
            case "Staples & Grains":
                setSelectedCategoryProducts(
                    products.filter((p) => p.category === "Staples & Grains")
                );
                break;
            case "Beverages":
                setSelectedCategoryProducts(
                    products.filter((p) => p.category === "Beverages")
                );
                break;
            case "Packaged & Canned Goods":
                setSelectedCategoryProducts(
                    products.filter(
                        (p) => p.category === "Packaged & Canned Goods"
                    )
                );
                break;
            case "Confectionery & Snacks":
                setSelectedCategoryProducts(
                    products.filter(
                        (p) => p.category === "Confectionery & Snacks"
                    )
                );
                break;
            case "Baby & Kids":
                setSelectedCategoryProducts(
                    products.filter((p) => p.category === "Baby & Kids")
                );
                break;
            case "Personal Care & Beauty":
                setSelectedCategoryProducts(
                    products.filter(
                        (p) => p.category === "Personal Care & Beauty"
                    )
                );
                break;
            case "Home & Cleaning":
                setSelectedCategoryProducts(
                    products.filter((p) => p.category === "Home & Cleaning")
                );
                break;
            case "others":
                setSelectedCategoryProducts(
                    products.filter((p) => p.category === "others")
                );
                break;
            default:
                setSelectedCategoryProducts(products);
        }
    }, [products, selectoryCategory]);

    const productCategory = [
        ["All", <IoIosBasket className="category-icons" />],
        ["Fresh & Perishable", <GiFruitBowl className="category-icons" />],
        [
            "Bakery & Ready-to-Eat",
            <MdOutlineBakeryDining className="category-icons" />,
        ],
        ["Staples & Grains", <PiGrainsFill className="category-icons" />],
        ["Beverages", <RiDrinks2Fill className="category-icons" />],
        [
            "Packaged & Canned Goods",
            <GiCannedFish className="category-icons" />,
        ],
        [
            "Confectionery & Snacks",
            <GiFastNoodles className="category-icons" />,
        ],
        ["Baby & Kids", <FaBabyCarriage className="category-icons" />],
        ["Personal Care & Beauty", <FaPumpSoap className="category-icons" />],
        ["Home & Cleaning", <FaHome className="category-icons" />],
        ["others", <BsFillBasketFill className="category-icons" />],
    ];
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
            {query === "" && (
                <div className="inventory-filter">
                    <h4 className="category-title">
                        <TbCategory2
                            style={{ fontSize: "25px", marginBottom: "-4px" }}
                        />{" "}
                        Category
                    </h4>
                    <div className="category-list">
                        {productCategory.map((cat) => (
                            <button
                                onClick={() => onCatagorySelect(cat[0])}
                                key={cat[0]}
                                className={`category-list-button ${
                                    cat[0] === selectoryCategory
                                        ? "selected-category"
                                        : ""
                                }`}
                            >
                                {cat[1]} {cat[0]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div style={styles.section}>
                <div className="search-container">
                    <h4 className="current-inventory-title">
                        <MdInventory
                            style={{ marginRight: "5px", marginBottom: "-2px" }}
                        />{" "}
                        Current Inventory ({selectedCategoryProducts.length}{" "}
                        items)
                    </h4>
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
                {selectedCategoryProducts.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p>
                            No selected category products added yet. Add your
                            first product above!
                        </p>
                    </div>
                ) : (
                    <div className="product-grid">
                        {selectedCategoryProducts.map((p) => (
                            <div key={p._id} style={styles.productCard}>
                                {p.image && (
                                    <img
                                        src={p.image}
                                        alt={p.name}
                                        style={styles.productImage}
                                    />
                                )}
                                <div className="product-content">
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
                                            className="stock-input"
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
        padding: "15px",
        backgroundColor: "rgb(79 70 229)",
        color: "white",
        border: "none",
        borderRadius: "25px",
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
    productCard: {
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "#fff",
        boxShadow: "0 4px 12px #2B4936",
        transition: "transform 0.2s",
        width: "250px",
    },
    productImage: {
        width: "100%",
        height: "150px",
        objectFit: "contain",
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
    stockUnit: {
        fontSize: "14px",
        color: "#666",
    },
    productActions: {
        display: "flex",
        gap: "10px",
        justifyContent: "center",
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
