import React from "react";
import TubeSurfMain from "./TubeSurfMain";
import LoginPage from "./LoginPage";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "./App.css";

const AppContent = () => {
    const auth = useAuth();
    if (!auth.token) return <LoginPage />;
    return (
        <div className="app-container">
            <div className="app-content">
                <TubeSurfMain />
            </div>
        </div>
    );
};

const App = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;