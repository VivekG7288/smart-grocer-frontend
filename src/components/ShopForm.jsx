import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { CiShop } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FcShop } from "react-icons/fc";

export default function ShopForm() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creatingShop, setCreatingShop] = useState(false);
    const [shopData, setShopData] = useState({
        name: "",
        address: "",
        phone: "",
        deliveryRadius: 5,
    });

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
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDeUObAPbugkptlPWUnYgWnNsHgggiRo4c&libraries=places`;
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
            }
        } catch (err) {
            console.error("Error finding user shop:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleShopDataChange = (e) => {
        const { name, value } = e.target;
        setShopData({ ...shopData, [name]: value });
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
                registrationFee: 10,
            };

            console.log("Saving pending shop (awaiting payment):", payload);
            localStorage.setItem("pendingShop", JSON.stringify(payload));
            // Navigate to payment page which will create Razorpay order and finalize registration
            navigate("/payment");
        } catch (err) {
            console.error("Error creating shop (pre-payment):", err);
            const errorMsg = err.response?.data?.error || err.message;
            alert("Error creating shop: " + errorMsg);
        } finally {
            setCreatingShop(false);
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
            {/* <div style={styles.shopInfo}> */}
                {/* <div className="shop-card-left">
                    <h3 className="shop-titlle">
                        <MdOutlineShoppingCart
                            style={{
                                marginRight: "5px",
                                marginBottom: "-10px",
                                fontSize: "50px",
                                color: "white",
                            }}
                        />{" "}
                        {shop.name}
                    </h3>
                    <FcShop className="shop-icon" />
                </div> */}
                {/* <div style={styles.locationDetails}>
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
                </div> */}
            {/* </div> */}
        </div>
    );
}

const styles = {
    container: {
        padding: "20px",
        maxWidth: "fit-content",
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
        backgroundColor: "rgb(17, 24, 39)",
        padding: "20px",
        borderRadius: "8px",
        display: "flex",
        gap: "20px",
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
    emptyState: {
        textAlign: "center",
        color: "#666",
        fontStyle: "italic",
        padding: "40px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
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
};
