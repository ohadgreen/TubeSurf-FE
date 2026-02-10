import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import "./SentimentAnalysis.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SentimentAnalysis = ({ videoId, words, videoTitle }) => {
    const [selectedWord, setSelectedWord] = useState("");
    const [isCustomWord, setIsCustomWord] = useState(false);
    const [customWordInput, setCustomWordInput] = useState("");
    const [commentsToAnalyze, setCommentsToAnalyze] = useState(50);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [sentimentSummary, setSentimentSummary] = useState(null);
    const [analysisId, setAnalysisId] = useState(null);
    const pollingIntervalRef = useRef(null);

    const handleWordChange = (e) => {
        const value = e.target.value;
        if (value === "__CUSTOM__") {
            setIsCustomWord(true);
            setSelectedWord(customWordInput);
        } else {
            setIsCustomWord(false);
            setCustomWordInput("");
            setSelectedWord(value);
        }
    };

    const handleCustomWordInputChange = (e) => {
        const value = e.target.value;
        setCustomWordInput(value);
        setSelectedWord(value);
    };

    const handleCommentsToAnalyzeChange = (e) => {
        setCommentsToAnalyze(Number(e.target.value));
    };

    // Function to fetch sentiment summary
    const fetchSentimentSummary = useCallback(async (vidId, analysisId) => {
        try {
            const summaryResponse = await fetch(
                `http://localhost:8081/api/sentiment/sentimentOngoingAnalysis/${vidId}/${analysisId}`,
                {
                    method: "GET",
                    headers: {
                        "accept": "*/*"
                    }
                }
            );

            if (!summaryResponse.ok) {
                throw new Error(`HTTP error! status: ${summaryResponse.status}`);
            }

            const summaryData = await summaryResponse.json();
            console.log("Sentiment summary:", summaryData);
            setSentimentSummary(summaryData);
            return summaryData;
        } catch (err) {
            console.error("Error fetching sentiment summary:", err);
            return null;
        }
    }, []);

    const handleAnalyze = async () => {
        if (!selectedWord) {
            alert("Please select a word to analyze");
            return;
        }

        if (!videoId || !videoTitle) {
            alert("Video information is missing");
            return;
        }

        setIsAnalyzing(true);
        setSentimentSummary(null);
        
        try {
            const payload = {
                analysisId: "",
                videoId: videoId,
                videoTitle: videoTitle,
                analysisObject: selectedWord,
                moreInfo: "",
                totalCommentsToAnalyze: commentsToAnalyze
            };

            const response = await fetch("http://localhost:8081/api/sentiment/analyzeRequest", {
                method: "POST",
                headers: {
                    "accept": "*/*",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Analysis request successful - full response:", result);
            console.log("Response type:", typeof result);
            
            // Extract analysisId from the response - handle different response formats
            let receivedAnalysisId = null;
            
            // Case 1: Response is a string (UUID)
            if (typeof result === 'string') {
                receivedAnalysisId = result;
            }
            // Case 2: Response is an object
            else if (typeof result === 'object' && result !== null) {
                receivedAnalysisId = result.analysisId || result.id || result.uuid || result.analysisUuid;
            }
            
            // Also check response headers for Location header (common pattern for created resources)
            if (!receivedAnalysisId) {
                const locationHeader = response.headers.get('Location');
                if (locationHeader) {
                    // Extract ID from Location header (e.g., "/api/sentiment/.../uuid")
                    const match = locationHeader.match(/[a-f0-9-]{36}/i);
                    if (match) {
                        receivedAnalysisId = match[0];
                    }
                }
            }
            
            if (!receivedAnalysisId) {
                console.error("Could not extract analysisId. Response structure:", result);
                throw new Error("Analysis ID not found in response. Check console for response details.");
            }
            
            setAnalysisId(receivedAnalysisId);
            
            // Make initial GET call to sentimentSummary
            await fetchSentimentSummary(videoId, receivedAnalysisId);
        } catch (err) {
            console.error("Error analyzing sentiment:", err);
            alert("Failed to analyze sentiment. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Poll for sentiment summary updates every 3 seconds until status is COMPLETED
    useEffect(() => {
        // Clear any existing interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        // Only start polling if we have analysisId and status is not COMPLETED
        if (analysisId && videoId) {
            const isCompleted = sentimentSummary?.analysisStatus === "COMPLETED";
            
            if (!isCompleted) {
                // Start polling every 3 seconds
                pollingIntervalRef.current = setInterval(async () => {
                    const summaryData = await fetchSentimentSummary(videoId, analysisId);
                    
                    // Stop polling if status becomes COMPLETED
                    if (summaryData?.analysisStatus === "COMPLETED") {
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }
                    }
                }, 3000);
            }
        }

        // Cleanup function
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [analysisId, videoId, sentimentSummary?.analysisStatus, fetchSentimentSummary]);

    // Prepare chart data for sentiment summary
    const sentimentChartData = sentimentSummary ? {
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [
            {
                label: 'Comments Count',
                data: [
                    sentimentSummary.positiveComments || 0,
                    sentimentSummary.negativeComments || 0,
                    sentimentSummary.neutralComments || 0
                ],
                backgroundColor: [
                    '#4caf50', // Green for Positive
                    '#f44336', // Red for Negative
                    '#ff9800'  // Orange for Neutral
                ],
                borderColor: [
                    '#4caf50',
                    '#f44336',
                    '#ff9800'
                ],
                borderWidth: 1
            }
        ]
    } : null;

    const sentimentChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Sentiment Distribution'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    precision: 0
                }
            }
        }
    };

    return (
        <div className="sentiment-analysis-placeholder">
            <h3>Sentiment Analysis</h3>
            {words && words.length > 0 ? (
                <>
                    <div className="sentiment-dropdowns-container">
                        <div className="sentiment-dropdown-wrapper">
                            <label htmlFor="word-select" style={{ marginTop: "10px", marginBottom: "5px", display: "block" }}>
                                Select a word:
                            </label>
                            <select
                                id="word-select"
                                value={isCustomWord ? "__CUSTOM__" : selectedWord}
                                onChange={handleWordChange}
                                className="sentiment-word-dropdown"
                            >
                                <option value="">-- Select a word --</option>
                                {words.map((word, index) => (
                                    <option key={index} value={word}>
                                        {word}
                                    </option>
                                ))}
                                <option value="__CUSTOM__">Type custom word...</option>
                            </select>
                            {isCustomWord && (
                                <input
                                    type="text"
                                    value={customWordInput}
                                    onChange={handleCustomWordInputChange}
                                    placeholder="Enter custom word..."
                                    className="sentiment-word-dropdown"
                                    style={{ marginTop: "10px" }}
                                    autoFocus
                                />
                            )}
                        </div>
                        <div className="sentiment-dropdown-wrapper">
                            <label htmlFor="comments-to-analyze-select" style={{ marginTop: "10px", marginBottom: "5px", display: "block" }}>
                                Comments to analyze:
                            </label>
                            <select
                                id="comments-to-analyze-select"
                                value={commentsToAnalyze}
                                onChange={handleCommentsToAnalyzeChange}
                                className="sentiment-word-dropdown"
                            >
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={500}>500</option>
                                <option value={1000}>1000</option>
                            </select>
                        </div>
                        <div className="sentiment-button-wrapper">
                            <button 
                                className="sentiment-analyze-button" 
                                style={{ marginTop: "33px" }}
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !selectedWord || !commentsToAnalyze}
                            >
                                {isAnalyzing ? "Analyzing..." : "Analyze"}
                            </button>
                        </div>
                    </div>
                    {selectedWord && (
                        <p style={{ marginTop: "10px" }}>
                            Selected: <strong>{selectedWord}</strong>
                        </p>
                    )}
                    {sentimentSummary && sentimentChartData && (
                        <div className="sentiment-summary" style={{ marginTop: "20px", padding: "15px", paddingBottom: "20px", border: "1px solid #ddd", borderRadius: "5px" }}>
                            <div className="sentiment-chart-container">
                                <Bar data={sentimentChartData} options={sentimentChartOptions} />
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <p>No words available</p>
            )}
        </div>
    );
};

export default SentimentAnalysis;
