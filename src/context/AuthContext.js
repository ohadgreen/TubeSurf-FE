import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "app_jwt";

function decodeJwtPayload(token) {
    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem(TOKEN_KEY);
        return stored ? decodeJwtPayload(stored) : null;
    });

    const login = useCallback(async (googleCredential) => {
        const res = await fetch("http://localhost:8081/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: googleCredential }),
        });
        if (!res.ok) throw new Error("Authentication failed");
        const { token: appToken } = await res.json();
        localStorage.setItem(TOKEN_KEY, appToken);
        setToken(appToken);
        setUser(decodeJwtPayload(appToken));
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        window.addEventListener("auth:logout", logout);
        return () => window.removeEventListener("auth:logout", logout);
    }, [logout]);

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);