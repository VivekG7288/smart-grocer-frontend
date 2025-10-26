import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

export default function PaymentPage() {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const pendingShop = JSON.parse(
        localStorage.getItem("pendingShop") || "null"
    );
    const amount = pendingShop?.registrationFee || 500;

    useEffect(() => {
        if (!pendingShop) return navigate("/");
        initPayment();
        // eslint-disable-next-line
    }, []);

    const loadRazorpayScript = () => {
        return new Promise((res, rej) => {
            // 1. Check if the script is ALREADY loaded
            if (window.Razorpay) {
                return res(true);
            }

            // 2. Check if the script tag is already in the DOM (maybe loading)
            const id = "razorpay-script";
            let script = document.getElementById(id);

            if (script) {
                // If the tag exists, it's either loaded (handled by check #1)
                // or it's currently loading. We just need to add our
                // event listeners to wait for it to finish.
                script.addEventListener("load", () => res(true));
                script.addEventListener("error", () => {
                    rej(new Error("Razorpay script failed to load."));
                });
            } else {
                // 3. If tag doesn't exist, create it and load the script
                script = document.createElement("script");
                script.id = id;
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.onload = () => res(true);
                script.onerror = () => {
                    // Optional: remove the failed script tag
                    document.body.removeChild(script);
                    rej(new Error("Razorpay script failed to load."));
                };
                document.body.appendChild(script);
            }
        });
    };

    const initPayment = async () => {
        try {
            setLoading(true);
            const resp = await api.post("/payments/create-order", { amount });
            const { order, key } = resp.data;
            await loadRazorpayScript();
            openCheckout(key, order);
        } catch (err) {
            console.error("initPayment err", err);
            alert("Unable to initialize payment. Try again later.");
            navigate("/");
        } finally {
            setLoading(false);
        }
    };

    const openCheckout = (key, order) => {
        const options = {
            key,
            amount: order.amount,
            currency: order.currency,
            name: pendingShop?.name || "Shop Registration",
            description: "Shopkeeper registration fee",
            order_id: order.id,
            prefill: {
                name: pendingShop?.ownerName || "",
                email: pendingShop?.ownerEmail || "",
            },
            handler: async function (response) {
                try {
                    const verifyResp = await api.post("/payments/verify", {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        metadata: { pendingShop },
                    });

                    if (verifyResp.data.success) {
                        localStorage.removeItem("pendingShop");
                        alert("Payment successful and shop created!");
                        navigate("/");
                    } else {
                        alert("Payment verification failed.");
                    }
                } catch (err) {
                    console.error("Verification error", err);
                    alert("Payment verification failed.");
                }
            },
            theme: { color: "#28a745" },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    if (loading)
        return <div style={{ padding: 20 }}>Initializing payment...</div>;
    return <div style={{ padding: 20 }}>Redirecting to payment...</div>;
}
