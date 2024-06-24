import React from "react";
import Header from "./Header";
import TubeSurfMain from "./TubeSurfMain";
import "./App.css";

const App = () => {
    return (
        <div className="app-container">
            <Header />
            <div className="app-content">
                <TubeSurfMain />
            </div>
            
        </div>
    )
};

export default App;