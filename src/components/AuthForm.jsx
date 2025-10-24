import React, { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export default function AuthForm() {
    const { signup, login } = useContext(AuthContext);
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "CONSUMER",
        address: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (error) setError(""); // Clear error when user starts typing
    };

    const validateForm = () => {
        if (!form.email || !form.password) {
            setError("Email and password are required");
            return false;
        }

        if (!isLogin && (!form.name || !form.address)) {
            setError("All fields are required for signup");
            return false;
        }

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            setError("Please enter a valid email address");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            if (isLogin) {
                await login({
                    email: form.email,
                    password: form.password,
                });
            } else {
                await signup({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    role: form.role,
                    address: form.address,
                });
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.error || err.message || "An error occurred";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setError("");
        setForm({
            name: "",
            email: "",
            password: "",
            role: "CONSUMER",
            address: "",
        });
    };

    return (
        <div style={styles.container}>
            <div style={styles.blobA} />
            <div style={styles.blobB} />
            <div style={styles.formWrapper}>
                <h2 style={styles.title}>
                    {isLogin ? "Welcome Back" : "Create Account"}
                </h2>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    {!isLogin && (
                        <>
                            <input
                                name="name"
                                type="text"
                                placeholder="Full Name"
                                value={form.name}
                                onChange={handleChange}
                                style={styles.input}
                                onFocus={(e) => (
                                    (e.currentTarget.style.borderColor =
                                        "#3b82f6"),
                                    (e.currentTarget.style.boxShadow =
                                        "0 0 0 4px rgba(59,130,246,.15)")
                                )}
                                onBlur={(e) => (
                                    (e.currentTarget.style.borderColor =
                                        "#e5e7eb"),
                                    (e.currentTarget.style.boxShadow =
                                        "0 0 0 0 rgba(0,0,0,0)")
                                )}
                                required
                            />

                            <select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                style={styles.select}
                                required
                            >
                                <option value="CONSUMER">Consumer</option>
                                <option value="SHOPKEEPER">Shopkeeper</option>
                            </select>

                            <input
                                name="address"
                                type="text"
                                placeholder="Address"
                                value={form.address}
                                onChange={handleChange}
                                style={styles.input}
                                onFocus={(e) => (
                                    (e.currentTarget.style.borderColor =
                                        "#3b82f6"),
                                    (e.currentTarget.style.boxShadow =
                                        "0 0 0 4px rgba(59,130,246,.15)")
                                )}
                                onBlur={(e) => (
                                    (e.currentTarget.style.borderColor =
                                        "#e5e7eb"),
                                    (e.currentTarget.style.boxShadow =
                                        "0 0 0 0 rgba(0,0,0,0)")
                                )}
                                required
                            />
                        </>
                    )}

                    <input
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={handleChange}
                        style={styles.input}
                        onFocus={(e) => (
                            (e.currentTarget.style.borderColor = "#3b82f6"),
                            (e.currentTarget.style.boxShadow =
                                "0 0 0 4px rgba(59,130,246,.15)")
                        )}
                        onBlur={(e) => (
                            (e.currentTarget.style.borderColor = "#e5e7eb"),
                            (e.currentTarget.style.boxShadow =
                                "0 0 0 0 rgba(0,0,0,0)")
                        )}
                        required
                    />

                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        style={styles.input}
                        onFocus={(e) => (
                            (e.currentTarget.style.borderColor = "#3b82f6"),
                            (e.currentTarget.style.boxShadow =
                                "0 0 0 4px rgba(59,130,246,.15)")
                        )}
                        onBlur={(e) => (
                            (e.currentTarget.style.borderColor = "#e5e7eb"),
                            (e.currentTarget.style.boxShadow =
                                "0 0 0 0 rgba(0,0,0,0)")
                        )}
                        required
                        minLength={6}
                    />

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            ...styles.submitButton,
                            ...(isLoading ? styles.disabledButton : {}),
                        }}
                    >
                        {isLoading
                            ? "Processing..."
                            : isLogin
                            ? "Sign In"
                            : "Create Account"}
                    </button>
                </form>

                <div style={styles.switchWrapper}>
                    <span style={styles.switchText}>
                        {isLogin
                            ? "Don't have an account?"
                            : "Already have an account?"}
                    </span>
                    <button
                        type="button"
                        onClick={switchMode}
                        style={styles.switchButton}
                        disabled={isLoading}
                    >
                        {isLogin ? "Sign Up" : "Sign In"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        // base gradient
        background:
            "linear-gradient(135deg, #3b82f6 0%, #6366f1 55%, #a78bfa 100%)",
    },

    /* soft organic “blobs” (no pseudo-elements needed) */
    blobA: {
        position: "absolute",
        width: "70vmax",
        height: "70vmax",
        left: "-20vmax",
        top: "-15vmax",
        background:
            "radial-gradient(closest-side, rgba(255,255,255,0.28), rgba(255,255,255,0) 70%)",
        filter: "blur(20px)",
        mixBlendMode: "screen",
        pointerEvents: "none",
    },
    blobB: {
        position: "absolute",
        width: "70vmax",
        height: "70vmax",
        right: "-25vmax",
        bottom: "-20vmax",
        background:
            "radial-gradient(closest-side, rgba(0,0,0,0.22), rgba(0,0,0,0) 70%)",
        filter: "blur(28px)",
        mixBlendMode: "multiply",
        opacity: 0.7,
        pointerEvents: "none",
    },
    formWrapper: {
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "40px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px",
    },
    title: {
        textAlign: "center",
        marginBottom: "30px",
        color: "#333",
        fontSize: "24px",
        fontWeight: "600",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    input: {
        padding: "12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "16px",
        transition: "border-color 0.3s",
        outline: "none",
    },
    select: {
        padding: "12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "16px",
        backgroundColor: "white",
        outline: "none",
    },
    submitButton: {
        padding: "12px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
        marginTop: "10px",
        transition: "background-color 0.3s",
    },
    disabledButton: {
        backgroundColor: "#6c757d",
        cursor: "not-allowed",
    },
    switchWrapper: {
        textAlign: "center",
        marginTop: "20px",
    },
    switchText: {
        color: "#666",
        marginRight: "8px",
    },
    switchButton: {
        background: "none",
        border: "none",
        color: "#007bff",
        cursor: "pointer",
        fontSize: "14px",
        textDecoration: "underline",
    },
    error: {
        backgroundColor: "#f8d7da",
        color: "#721c24",
        padding: "12px",
        borderRadius: "4px",
        marginBottom: "16px",
        border: "1px solid #f5c6cb",
    },
};
