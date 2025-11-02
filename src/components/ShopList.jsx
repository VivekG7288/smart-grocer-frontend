import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { MdOutlineDeliveryDining } from "react-icons/md";

export default function ShopList({ deliveryAddress }) {
    const [allShops, setAllShops] = useState([]);
    const [nearbyShops, setNearbyShops] = useState([]);
    const [userSubscriptions, setUserSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        loadShopsAndFilter();
        loadUserSubscriptions();
    }, [deliveryAddress, user]);

    const loadShopsAndFilter = async () => {
        try {
            setLoading(true);
            console.log("Loading shops for delivery address:", deliveryAddress);

            // Get all shops
            const shopsRes = await api.get("/shops");
            const shops = shopsRes.data;
            setAllShops(shops);

            // Filter shops based on delivery address
            if (deliveryAddress && deliveryAddress.coordinates) {
                const filteredShops = filterShopsByLocation(
                    shops,
                    deliveryAddress
                );
                console.log("Filtered nearby shops:", filteredShops);
                setNearbyShops(filteredShops);
            } else {
                // If no delivery address coordinates, show all shops
                setNearbyShops(shops);
            }
        } catch (err) {
            console.error("Error loading shops:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadUserSubscriptions = async () => {
        try {
            const userRes = await api.get(`/users/${user._id}`);
            const subscriptions = userRes.data.subscriptions || [];
            setUserSubscriptions(subscriptions);
        } catch (err) {
            console.error("Error loading subscriptions:", err);
        }
    };

    const filterShopsByLocation = (shops, userAddress) => {
        const userCoords = userAddress.coordinates; // [longitude, latitude]
        const userLat = userCoords[1];
        const userLng = userCoords[0];

        return shops
            .map((shop) => {
                // Check if shop has location data
                if (!shop.location || !shop.location.coordinates) {
                    console.log("Shop missing location data:", shop.name);
                    return null;
                }

                const shopCoords = shop.location.coordinates; // [longitude, latitude]
                const shopLat = shopCoords[1];
                const shopLng = shopCoords[0];

                // Calculate distance using Haversine formula
                const distance = calculateDistance(
                    userLat,
                    userLng,
                    shopLat,
                    shopLng
                );
                const deliveryRadius = shop.deliveryRadius || 5; // Default 5km

                // Only include shops within their delivery radius
                if (distance <= deliveryRadius) {
                    return {
                        ...shop,
                        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
                        canDeliver: true,
                    };
                }

                return null;
            })
            .filter((shop) => shop !== null) // Remove null entries
            .sort((a, b) => a.distance - b.distance); // Sort by distance (nearest first)
    };

    const handleOpenMap = (address) => {
        // Encode the address to make it URL-safe
        const encodedAddress = encodeURIComponent(address);
        // Construct the Google Maps search URL
        const mapUrl = `https://www.google.com/maps?q=${encodedAddress}`;
        // Open the map in a new tab
        window.open(mapUrl, "_blank");
    };

    // Haversine formula to calculate distance between two points
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    };

    const toggleSubscription = async (shopId) => {
        try {
            const isSubscribed = userSubscriptions.includes(shopId);
            let newSubscriptions;

            if (isSubscribed) {
                newSubscriptions = userSubscriptions.filter(
                    (id) => id !== shopId
                );
                alert("Unsubscribed from shop!");
            } else {
                newSubscriptions = [...userSubscriptions, shopId];
                alert("Subscribed to shop!");
            }

            await api.put(`/users/${user._id}`, {
                subscriptions: newSubscriptions,
            });

            setUserSubscriptions(newSubscriptions);
        } catch (err) {
            console.error("Error toggling subscription:", err);
            alert("Error updating subscription");
        }
    };

    const subscribedShops = nearbyShops.filter((shop) =>
        userSubscriptions.includes(shop._id)
    );
    const availableShops = nearbyShops.filter(
        (shop) => !userSubscriptions.includes(shop._id)
    );

    if (loading) {
        return (
            <div style={styles.loading}>
                🔍 Finding shops that deliver to your area...
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Delivery Area Info */}
            <div style={styles.deliveryInfo}>
                <h3>
                    🚚 Delivery to: {deliveryAddress?.area},{" "}
                    {deliveryAddress?.city}
                </h3>
                <p>
                    {nearbyShops.length > 0
                        ? `Found ${nearbyShops.length} shops that deliver to your area`
                        : "No shops found in your delivery area"}
                </p>
                {deliveryAddress?.pincode && (
                    <p>
                        <strong>Pincode:</strong> {deliveryAddress.pincode}
                    </p>
                )}
            </div>

            {/* Subscribed Shops */}
            <div style={styles.section}>
                <h3>🏪 Your Subscribed Shops ({subscribedShops.length})</h3>
                {subscribedShops.length > 0 ? (
                    <div style={styles.shopGrid}>
                        {subscribedShops.map((shop) => (
                            <div
                                key={shop._id}
                                style={styles.subscribedShopCard}
                            >
                                <div style={styles.shopInfo}>
                                    <div className="shop-title-customer-dashboard">
                                        <h4>{shop.name}</h4>
                                        {shop.homeDelivery && (
                                            <div className="home-delivery-wrapper">
                                                <MdOutlineDeliveryDining
                                                    style={{
                                                        fontSize: "23px",
                                                        color: "white",
                                                    }}
                                                />
                                                Home Delivery available
                                            </div>
                                        )}
                                    </div>
                                    {shop.location.address && (
                                        <button
                                            onClick={() =>
                                                handleOpenMap(
                                                    shop.location.address
                                                )
                                            }
                                            style={{
                                                padding: "10px",
                                                background: "none",
                                                border: "2px solid #007bff",
                                                borderRadius: "12px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            📍 {shop.location?.address}
                                        </button>
                                    )}
                                    {!shop.location.address && (
                                        <p>Address not available</p>
                                    )}
                                    <p>📞 {shop.phone || "No phone"}</p>
                                    <p style={styles.distance}>
                                        🚚 {shop.distance} km away • Delivers
                                        within {shop.deliveryRadius || 5} km
                                    </p>
                                    {shop.openingHours && (
                                        <p style={styles.hours}>
                                            🕒 {shop.openingHours.open} -{" "}
                                            {shop.openingHours.close}
                                        </p>
                                    )}
                                </div>
                                <div style={styles.shopActions}>
                                    <Link
                                        to={`/shop/${shop._id}`}
                                        style={styles.browseButton}
                                    >
                                        🛍️ Browse Products
                                    </Link>
                                    <button
                                        onClick={() =>
                                            toggleSubscription(shop._id)
                                        }
                                        style={styles.unsubscribeButton}
                                    >
                                        Unsubscribe
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={styles.emptyState}>
                        <p>No subscribed shops in your delivery area.</p>
                        <p>Subscribe to shops below to start shopping!</p>
                    </div>
                )}
            </div>

            {/* Available Shops */}
            {availableShops.length > 0 && (
                <div style={styles.section}>
                    <h3>
                        🔍 Shops Available in Your Area ({availableShops.length}
                        )
                    </h3>
                    <div style={styles.shopGrid}>
                        {availableShops.map((shop) => (
                            <div key={shop._id} style={styles.shopCard}>
                                <div style={styles.shopInfo}>
                                    <h4>{shop.name}</h4>
                                    <p>
                                        📍{" "}
                                        {shop.location?.address ||
                                            "Address not available"}
                                    </p>
                                    <p>📞 {shop.phone || "No phone"}</p>
                                    <p style={styles.distance}>
                                        🚚 {shop.distance} km away • Delivers
                                        within {shop.deliveryRadius || 5} km
                                    </p>
                                    {shop.openingHours && (
                                        <p style={styles.hours}>
                                            🕒 {shop.openingHours.open} -{" "}
                                            {shop.openingHours.close}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => toggleSubscription(shop._id)}
                                    style={styles.subscribeButton}
                                >
                                    ➕ Subscribe
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Shops Available */}
            {nearbyShops.length === 0 && !loading && (
                <div style={styles.noShops}>
                    <h3>😔 No shops deliver to your area yet</h3>
                    <p>We're working to expand our delivery network.</p>
                    <p>Try changing your location or check back later.</p>
                    <div style={styles.expansionInfo}>
                        <h4>Want to see shops in your area?</h4>
                        <p>
                            Currently showing shops within delivery radius of:{" "}
                            <strong>{deliveryAddress?.city}</strong>
                        </p>
                        <p>
                            Total shops in system:{" "}
                            <strong>{allShops.length}</strong>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
    },
    loading: {
        textAlign: "center",
        padding: "50px",
        fontSize: "18px",
    },
    deliveryInfo: {
        backgroundColor: "#e8f5e8",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "30px",
        border: "1px solid #28a745",
    },
    section: {
        marginBottom: "40px",
    },
    shopGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "20px",
    },
    subscribedShopCard: {
        border: "2px solid #28a745",
        borderRadius: "12px",
        padding: "20px",
        backgroundColor: "#f8fff8",
        boxShadow: "0 4px 8px rgba(40, 167, 69, 0.1)",
    },
    shopCard: {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        backgroundColor: "#fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    shopInfo: {
        marginBottom: "15px",
    },
    distance: {
        color: "#007bff",
        fontWeight: "bold",
        fontSize: "14px",
    },
    hours: {
        color: "#28a745",
        fontSize: "14px",
    },
    shopActions: {
        display: "flex",
        gap: "10px",
        flexDirection: "column",
    },
    browseButton: {
        display: "inline-block",
        padding: "12px 20px",
        backgroundColor: "#007bff",
        color: "white",
        textDecoration: "none",
        borderRadius: "6px",
        textAlign: "center",
        fontWeight: "bold",
    },
    subscribeButton: {
        padding: "12px 20px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
    },
    unsubscribeButton: {
        padding: "8px 16px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    emptyState: {
        textAlign: "center",
        padding: "40px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        color: "#666",
    },
    noShops: {
        textAlign: "center",
        padding: "50px",
        color: "#666",
    },
    expansionInfo: {
        backgroundColor: "#fff3cd",
        padding: "20px",
        borderRadius: "8px",
        marginTop: "20px",
        border: "1px solid #ffc107",
    },
};
