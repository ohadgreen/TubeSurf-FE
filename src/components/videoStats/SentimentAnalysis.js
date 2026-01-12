import React, { useState } from "react";
import "./SentimentAnalysis.css";

const SentimentAnalysis = ({ videoId, words }) => {
    const [selectedWord, setSelectedWord] = useState("");

    const handleWordChange = (e) => {
        setSelectedWord(e.target.value);
    };

    return (
        <div className="sentiment-analysis-placeholder">
            <h3>Sentiment Analysis</h3>
            {words && words.length > 0 ? (
                <>
                    <label htmlFor="word-select" style={{ marginTop: "10px", marginBottom: "5px", display: "block" }}>
                        Select a word:
                    </label>
                    <select
                        id="word-select"
                        value={selectedWord}
                        onChange={handleWordChange}
                        className="sentiment-word-dropdown"
                    >
                        <option value="">-- Select a word --</option>
                        {words.map((word, index) => (
                            <option key={index} value={word}>
                                {word}
                            </option>
                        ))}
                    </select>
                    {selectedWord && (
                        <p style={{ marginTop: "10px" }}>
                            Selected: <strong>{selectedWord}</strong>
                        </p>
                    )}
                </>
            ) : (
                <p>No words available</p>
            )}
        </div>
    );
};

export default SentimentAnalysis;
