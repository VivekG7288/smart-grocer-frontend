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

export default function ProductList() {
    const { shopId } = useParams();
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [shop, setShop] = useState(null);
    const [selectedCategoryProducts, setSelectedCategoryProducts] = useState(
        []
    );
    const [selectoryCategory, setSelectoryCategory] = useState("All");

    const onCatagorySelect = (value) => {
        setSelectoryCategory(value);
    };

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
                shopId: shopId,
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

    const loadProducts = async () => {
        try {
            const res = await api.get("/products");
            const shopProducts = res.data.filter((p) => p.shopId === shopId);
            setProducts(shopProducts);
        } catch (err) {
            console.error("Error loading products:", err);
        }
    };

    const addToCart = (product) => {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const existingItem = cart.find((item) => item._id === product._id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        alert(`${product.name} added to cart!`);
    };

    return (
        <div style={styles.container}>
            {shop && (
                <div style={styles.shopHeader}>
                    <h3>{shop.name}</h3>
                    <p>
                        {shop.location?.address || shop.address} | {shop.phone}
                    </p>
                </div>
            )}

            <h4>Available Products ({selectedCategoryProducts.length})</h4>

            <div className="inventory-container">
                {products.length !== 0 && (
                    <div className="category-list-customer">
                        {productCategory.map((cat) => (
                            <button
                                onClick={() => onCatagorySelect(cat[0])}
                                key={cat[0]}
                                className={`category-list-button-customer ${
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
                    <div style={styles.productGrid}>
                        {selectedCategoryProducts.map((product) => (
                            <div key={product._id} style={styles.productCard}>
                                {product.image && (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        style={styles.productImage}
                                    />
                                )}
                                <div style={styles.productInfo}>
                                    <div style={{ flex: "1" }}>
                                        <h5 style={{ margin: "8px 0" }}>
                                            {product.name}
                                        </h5>
                                        <p style={styles.category}>
                                            {product.category}
                                        </p>
                                        <p style={styles.price}>
                                            ₹{product.price} per {product.unit}
                                        </p>
                                        <p style={styles.stock}>
                                            Stock: {product.stock}{" "}
                                            {product.unit}
                                        </p>
                                    </div>

                                    {/* ADD THE BUTTONS HERE - Both buttons in a button container */}
                                    <div style={styles.buttonContainer}>
                                        <button
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

                                        {/* ADD TO PANTRY BUTTON - RIGHT HERE */}
                                        <button
                                            onClick={() => addToPantry(product)}
                                            disabled={product.stock === 0}
                                            style={
                                                product.stock === 0
                                                    ? styles.disabledButton
                                                    : styles.pantryButton
                                            }
                                        >
                                            Track in Pantry
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
    },
    shopHeader: {
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px",
    },
    productGrid: {
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        height: "fit-content",
    },
    productCard: {
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "#fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        maxHeight: "400px",
        width: "170px",
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
        height: "-webkit-fill-available",
        padding: "15px",
    },
    category: {
        color: "#666",
        fontSize: "14px",
        margin: "5px 0",
    },
    price: {
        fontWeight: "bold",
        color: "#007bff",
        fontSize: "16px",
        margin: "8px 0 0 0",
    },
    stock: {
        color: "#28a745",
        fontSize: "14px",
        marginBottom: "15px",
        margin: "8px 0",
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
    pantryButton: {
        width: "100%",
        padding: "5px",
        backgroundColor: "#28a745",
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
