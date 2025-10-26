import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { geocodeAddress, reverseGeocode } from "../utils/locationService";
import api from "../api/api";

export default function AddressSelector({ onAddressConfirmed }) {
    const { user } = useContext(AuthContext);
    const [step, setStep] = useState("select"); // 'select', 'location', 'address'
    const [loading, setLoading] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [detectedAddress, setDetectedAddress] = useState("");
    const [manualAddress, setManualAddress] = useState("");
    const [addressDetails, setAddressDetails] = useState({
        label: "Home",
        flat: "",
        building: "",
        street: "",
        area: "",
        landmark: "",
        city: "",
        pincode: "",
    });
    const [autocomplete, setAutocomplete] = useState(null);

    useEffect(() => {
        loadSavedAddresses();
        loadGoogleMapsScript();
    }, [user]);

    const loadSavedAddresses = async () => {
        try {
            const res = await api.get(`/addresses/user/${user._id}`);
            setSavedAddresses(res.data);
        } catch (err) {
            console.error("Error loading saved addresses:", err);
        }
    };

    const loadGoogleMapsScript = () => {
        if (window.google) {
            setTimeout(initAutocomplete, 100);
            return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${
            import.meta.env.VITE_GOOGLE_API_KEY
        }&libraries=places`;
        script.async = true;
        script.onload = () => setTimeout(initAutocomplete, 100);
        document.head.appendChild(script);
    };

    const initAutocomplete = () => {
        const input = document.getElementById("address-autocomplete");
        if (window.google && input) {
            const autocompleteInstance =
                new window.google.maps.places.Autocomplete(input, {
                    types: ["address"],
                    componentRestrictions: { country: "in" },
                });

            autocompleteInstance.addListener(
                "place_changed",
                handlePlaceSelect
            );
            setAutocomplete(autocompleteInstance);
        }
    };

    const handlePlaceSelect = () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
            setManualAddress(place.formatted_address);
            parseAddressComponents(place);
        }
    };

    const parseAddressComponents = (place) => {
        const components = place.address_components || [];
        const newDetails = { ...addressDetails };

        components.forEach((component) => {
            const types = component.types;
            if (
                types.includes("sublocality_level_1") ||
                types.includes("neighborhood")
            ) {
                newDetails.area = component.long_name;
            }
            if (types.includes("locality")) {
                newDetails.city = component.long_name;
            }
            if (types.includes("postal_code")) {
                newDetails.pincode = component.long_name;
            }
            if (types.includes("route")) {
                newDetails.street = component.long_name;
            }
        });

        setAddressDetails(newDetails);
    };

    const selectSavedAddress = async (address) => {
        try {
            setLoading(true);

            // Update last used
            await api.put(`/addresses/${address._id}/use`);

            // Convert to the format expected by the app
            const selectedAddress = {
                flat: address.flat,
                building: address.building,
                street: address.street,
                area: address.area,
                landmark: address.landmark,
                city: address.city,
                pincode: address.pincode,
                coordinates: address.coordinates,
                formattedAddress: address.formattedAddress,
                label: address.label,
            };

            onAddressConfirmed(selectedAddress);
        } catch (err) {
            console.error("Error selecting address:", err);
            alert("Error selecting address");
        } finally {
            setLoading(false);
        }
    };

    const detectLocation = () => {
        setLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentLocation({ latitude, longitude });

                    try {
                        const result = await reverseGeocode(
                            latitude,
                            longitude
                        );
                        if (result) {
                            setDetectedAddress(result.address);
                            setStep("address");
                        }
                    } catch (error) {
                        console.error("Reverse geocoding failed:", error);
                        setStep("address");
                    } finally {
                        setLoading(false);
                    }
                },
                (error) => {
                    console.error("Location detection failed:", error);
                    setLoading(false);
                    setStep("address");
                }
            );
        } else {
            setLoading(false);
            setStep("address");
        }
    };

    const handleAddressSubmit = async () => {
        setLoading(true);
        try {
            const fullAddress =
                `${addressDetails.flat} ${addressDetails.building} ${addressDetails.street} ${addressDetails.area} ${addressDetails.city} ${addressDetails.pincode}`.trim();

            let locationData;
            try {
                locationData = await geocodeAddress(fullAddress);
            } catch (err) {
                console.warn(
                    "Geocoding failed, proceeding without coordinates"
                );
                locationData = {
                    coordinates: [],
                    formattedAddress: fullAddress,
                };
            }

            const finalAddress = {
                ...addressDetails,
                coordinates: locationData.coordinates,
                formattedAddress: locationData.formattedAddress || fullAddress,
            };

            // Save address for future use
            try {
                await api.post("/addresses", {
                    userId: user._id,
                    ...finalAddress,
                    isDefault: savedAddresses.length === 0, // First address is default
                });
            } catch (err) {
                console.warn("Failed to save address for future use:", err);
            }

            onAddressConfirmed(finalAddress);
        } catch (error) {
            alert(
                "Unable to process this address. Please check and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (step === "select") {
        return (
            <div style={styles.container}>
                <div style={styles.selectCard}>
                    <h2>📍 Choose Delivery Address</h2>

                    {savedAddresses.length > 0 && (
                        <div style={styles.savedAddressesSection}>
                            <h3>🏠 Your Saved Addresses</h3>
                            <div style={styles.addressList}>
                                {savedAddresses.map((address) => (
                                    <div
                                        key={address._id}
                                        style={styles.savedAddressCard}
                                    >
                                        <div style={styles.addressInfo}>
                                            <h4>
                                                {address.label}{" "}
                                                {address.isDefault && (
                                                    <span
                                                        style={
                                                            styles.defaultBadge
                                                        }
                                                    >
                                                        Default
                                                    </span>
                                                )}
                                            </h4>
                                            <p>
                                                {address.flat}{" "}
                                                {address.building}
                                            </p>
                                            <p>
                                                {address.area}, {address.city}
                                            </p>
                                            <p>Pincode: {address.pincode}</p>
                                            {address.landmark && (
                                                <p>
                                                    <em>
                                                        Near {address.landmark}
                                                    </em>
                                                </p>
                                            )}
                                            <small style={styles.lastUsed}>
                                                Last used:{" "}
                                                {new Date(
                                                    address.lastUsed
                                                ).toLocaleDateString("en-IN")}
                                            </small>
                                        </div>
                                        <button
                                            onClick={() =>
                                                selectSavedAddress(address)
                                            }
                                            disabled={loading}
                                            style={styles.selectButton}
                                        >
                                            {loading ? "..." : "✓ Use This"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={styles.newAddressSection}>
                        <h3>➕ Add New Address</h3>
                        <div style={styles.newAddressButtons}>
                            <button
                                onClick={detectLocation}
                                disabled={loading}
                                style={styles.primaryButton}
                            >
                                {loading
                                    ? "🔍 Detecting..."
                                    : "📱 Use Current Location"}
                            </button>

                            <button
                                onClick={() => setStep("address")}
                                style={styles.secondaryButton}
                            >
                                📝 Enter Manually
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === "address") {
        return (
            <div style={styles.container}>
                <div style={styles.addressCard}>
                    <div style={styles.backButton}>
                        <button
                            onClick={() => setStep("select")}
                            style={styles.backBtn}
                        >
                            ← Back to Saved Addresses
                        </button>
                    </div>

                    <h2>🏠 Enter New Address</h2>

                    {detectedAddress && (
                        <div style={styles.detectedLocation}>
                            <p>
                                <strong>Detected:</strong> {detectedAddress}
                            </p>
                            <button
                                onClick={() =>
                                    setManualAddress(detectedAddress)
                                }
                                style={styles.useDetectedButton}
                            >
                                ✓ Use This Address
                            </button>
                        </div>
                    )}

                    <div style={styles.form}>
                        <div style={styles.labelRow}>
                            <label>Address Label:</label>
                            <select
                                value={addressDetails.label}
                                onChange={(e) =>
                                    setAddressDetails({
                                        ...addressDetails,
                                        label: e.target.value,
                                    })
                                }
                                style={styles.labelSelect}
                            >
                                <option value="Home">🏠 Home</option>
                                <option value="Office">🏢 Office</option>
                                <option value="Apartment">🏘️ Apartment</option>
                                <option value="Other">📍 Other</option>
                            </select>
                        </div>

                        <div style={styles.searchBox}>
                            <input
                                id="address-autocomplete"
                                type="text"
                                placeholder="Search for your area, street name..."
                                value={manualAddress}
                                onChange={(e) =>
                                    setManualAddress(e.target.value)
                                }
                                style={styles.searchInput}
                            />
                        </div>

                        <div style={styles.addressGrid}>
                            <input
                                placeholder="Flat / House No *"
                                value={addressDetails.flat}
                                onChange={(e) =>
                                    setAddressDetails({
                                        ...addressDetails,
                                        flat: e.target.value,
                                    })
                                }
                                style={styles.input}
                            />
                            <input
                                placeholder="Building / Apartment Name"
                                value={addressDetails.building}
                                onChange={(e) =>
                                    setAddressDetails({
                                        ...addressDetails,
                                        building: e.target.value,
                                    })
                                }
                                style={styles.input}
                            />
                            <input
                                placeholder="Street / Road Name"
                                value={addressDetails.street}
                                onChange={(e) =>
                                    setAddressDetails({
                                        ...addressDetails,
                                        street: e.target.value,
                                    })
                                }
                                style={styles.input}
                            />
                            <input
                                placeholder="Area / Locality *"
                                value={addressDetails.area}
                                onChange={(e) =>
                                    setAddressDetails({
                                        ...addressDetails,
                                        area: e.target.value,
                                    })
                                }
                                style={styles.input}
                            />
                            <input
                                placeholder="Landmark (Optional)"
                                value={addressDetails.landmark}
                                onChange={(e) =>
                                    setAddressDetails({
                                        ...addressDetails,
                                        landmark: e.target.value,
                                    })
                                }
                                style={styles.input}
                            />
                            <input
                                placeholder="City *"
                                value={addressDetails.city}
                                onChange={(e) =>
                                    setAddressDetails({
                                        ...addressDetails,
                                        city: e.target.value,
                                    })
                                }
                                style={styles.input}
                            />
                            <input
                                placeholder="Pincode *"
                                value={addressDetails.pincode}
                                onChange={(e) =>
                                    setAddressDetails({
                                        ...addressDetails,
                                        pincode: e.target.value,
                                    })
                                }
                                style={styles.input}
                                maxLength={6}
                            />
                        </div>

                        <button
                            onClick={handleAddressSubmit}
                            disabled={
                                loading ||
                                !addressDetails.flat ||
                                !addressDetails.area ||
                                !addressDetails.city ||
                                !addressDetails.pincode
                            }
                            style={styles.confirmButton}
                        >
                            {loading
                                ? "🔍 Saving & Confirming..."
                                : "✓ Save & Use This Address"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        padding: "20px",
    },
    selectCard: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "30px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        maxWidth: "800px",
        width: "100%",
    },
    addressCard: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "30px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        maxWidth: "600px",
        width: "100%",
    },
    backButton: {
        marginBottom: "20px",
    },
    backBtn: {
        padding: "8px 16px",
        backgroundColor: "#6c757d",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    savedAddressesSection: {
        marginBottom: "30px",
    },
    addressList: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },
    savedAddressCard: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "15px",
        border: "2px solid #e8f5e8",
        borderRadius: "8px",
        backgroundColor: "#f8fff8",
    },
    addressInfo: {
        flex: 1,
    },
    defaultBadge: {
        backgroundColor: "#28a745",
        color: "white",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "bold",
    },
    lastUsed: {
        color: "#666",
        fontSize: "12px",
    },
    selectButton: {
        padding: "10px 20px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
    },
    newAddressSection: {
        borderTop: "2px solid #ddd",
        paddingTop: "20px",
    },
    newAddressButtons: {
        display: "flex",
        gap: "15px",
        flexWrap: "wrap",
    },
    primaryButton: {
        flex: 1,
        padding: "15px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
    },
    secondaryButton: {
        flex: 1,
        padding: "15px",
        backgroundColor: "transparent",
        color: "#007bff",
        border: "2px solid #007bff",
        borderRadius: "8px",
        fontSize: "16px",
        cursor: "pointer",
    },
    labelRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "15px",
    },
    labelSelect: {
        padding: "8px 12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
    },
    // ... rest of existing styles
    detectedLocation: {
        backgroundColor: "#e8f5e8",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #28a745",
    },
    useDetectedButton: {
        marginTop: "10px",
        padding: "8px 16px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },
    searchBox: {
        marginBottom: "10px",
    },
    searchInput: {
        width: "100%",
        padding: "15px",
        border: "2px solid #ddd",
        borderRadius: "8px",
        fontSize: "16px",
        outline: "none",
    },
    addressGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "15px",
    },
    input: {
        padding: "12px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        fontSize: "14px",
        outline: "none",
    },
    confirmButton: {
        padding: "15px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        marginTop: "10px",
    },
};
