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
        return new Promise((res) => {
            const id = "razorpay-script";
            if (document.getElementById(id)) return res(true);
            const script = document.createElement("script");
            script.id = id;
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => res(true);
            document.body.appendChild(script);
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
