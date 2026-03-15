import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
    const auth = useAuth();

    const handleSuccess = async (credentialResponse) => {
        try {
            await auth.login(credentialResponse.credential);
        } catch (err) {
            console.error("Login failed:", err);
            alert("Sign-in failed. Please try again.");
        }
    };

    const handleError = () => {
        alert("Google sign-in failed. Please try again.");
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>TubeSurf</h1>
                <p style={styles.subtitle}>YouTube comment sentiment analysis</p>
                <div style={styles.buttonWrap}>
                    <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
    },
    card: {
        background: "#fff",
        borderRadius: "12px",
        padding: "48px 40px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        textAlign: "center",
        minWidth: "320px",
    },
    title: {
        margin: "0 0 8px",
        fontSize: "2rem",
        fontWeight: 700,
    },
    subtitle: {
        margin: "0 0 32px",
        color: "#666",
        fontSize: "1rem",
    },
    buttonWrap: {
        display: "flex",
        justifyContent: "center",
    },
};

export default LoginPage;