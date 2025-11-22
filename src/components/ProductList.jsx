import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { useParams } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { MdOutlineBakeryDining } from "react-icons/md";
import { GiFruitBowl, GiCannedFish, GiFastNoodles } from "react-icons/gi";
import { PiGrainsFill } from "react-icons/pi";
import { RiDrinks2Fill } from "react-icons/ri";
import { FaBabyCarriage, FaHome, FaSearch } from "react-icons/fa";
import { FaPumpSoap } from "react-icons/fa6";
import { BsFillBasketFill } from "react-icons/bs";
import { IoIosBasket } from "react-icons/io";

export default function ProductList({ increaseQty }) {
    const { shopId } = useParams();
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [shop, setShop] = useState(null);
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState(
        []
    );
    const [query, setQuery] = useState("");

    const [selectoryCategory, setSelectoryCategory] = useState("All");

    const onCatagorySelect = (value) => {
        setSelectoryCategory(value);
    };

    const loadCart = async () => {
        try {
            const res = await api.get("/cart", {
                params: { userId: user._id },
            });
            increaseQty(res.data.items.length);
        } catch (error) {
            console.error("Error loading cart:", error);
        }
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

    useEffect(() => {
        loadShop();
        loadProducts();
    }, [shopId]);

    const loadShop = async () => {
        try {
            const res = await api.get(`/shops`);
            const currentShop = res.data.find((s) => s._id === shopId);
            setShop(currentShop);
        } catch (err) {
            console.error("Error loading shop:", err);
        }
    };

    const loadProducts = async () => {
        try {
            const res = await api.get("/products");
            const shopProducts = res.data.filter((p) => p.shopId === shopId);
            setProducts(shopProducts);
        } catch (err) {
            console.error("Error loading products:", err);
        }
    };

    const addToCart = async (product) => {
        if (!user) {
            alert("Please log in to add items to your cart.");
            return;
        }

        try {
            const payload = {
                userId: user._id,
                productId: product._id,
                quantity: 1,
            };

            await api.post("/cart", payload); // now hits /api/cart on backend
            await loadCart();
            alert(`${product.name} added to cart!`);
        } catch (error) {
            console.error("Error adding to cart:", error);
            alert("Failed to add product to cart. Please try again.");
        }
    };

    return (
        <div>
            {shop && (
                <div style={styles.shopHeader}>
                    <h3 style={{ color: "#FFFAF0" }}>{shop.name}</h3>
                    <p style={{ color: "#FFFAF0" }}>
                        {shop.location?.address || shop.address} | {shop.phone}
                    </p>
                </div>
            )}
            <div className="search-container">
                <h4 style={{ color: "#2B4936" }}>
                    {" "}
                    Available Products ({selectedCategoryProducts.length})
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

            <div className="inventory-container">
                {query === "" && (
                    <div className="category-list-customer">
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
                )}

                {selectedCategoryProducts.length === 0 ? (
                    <p>No products available in this shop yet.</p>
                ) : (
                    <div className="product-grid">
                        {selectedCategoryProducts.map((product) => (
                            <div className="product-card" key={product._id}>
                                {product.image && (
                                    <img
                                        className="product-image"
                                        src={product.image}
                                        alt={product.name}
                                    />
                                )}
                                <div style={styles.productInfo}>
                                    <div style={{ flex: "1" }}>
                                        <h5 style={{ margin: "8px 0" }}>
                                            {product.name}
                                        </h5>
                                        <p className="product-category">
                                            {product.category}
                                        </p>
                                        <p className="product-price">
                                            ₹{product.price} per {product.unit}
                                        </p>
                                        <p className="product-stock-info">
                                            Stock: {product.stock}{" "}
                                            {product.unit}
                                        </p>
                                    </div>

                                    {/* ADD THE BUTTONS HERE - Both buttons in a button container */}
                                    <div style={styles.buttonContainer}>
                                        <button
                                            className="add-to-cart-button"
                                            onClick={() => addToCart(product)}
                                            disabled={product.stock === 0}
                                            style={
                                                product.stock === 0
                                                    ? styles.disabledButton
                                                    : styles.addButton
                                            }
                                        >
                                            {product.stock === 0
                                                ? "Out of Stock"
                                                : "+ Add to Cart"}
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
    shopHeader: {
        backgroundColor: "#89AA97",
        padding: "10px",
        borderRadius: "8px",
        marginBottom: "20px",
    },
    productImage: {
        width: "100%",
        height: "200px",
        objectFit: "cover",
    },
    productInfo: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "15px",
    },

    /* NEW STYLES FOR BUTTON CONTAINER */
    buttonContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    addButton: {
        width: "100%",
        padding: "5px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "600",
    },
    disabledButton: {
        width: "100%",
        padding: "5px",
        backgroundColor: "#6c757d",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "not-allowed",
    },
};
