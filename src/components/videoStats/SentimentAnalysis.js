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

const MAX_ANALYSES = 3;

const SENTIMENT_CHART_OPTIONS = {
    indexAxis: 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        title: { display: false }
    },
    scales: {
        x: { beginAtZero: true, ticks: { stepSize: 1 } }
    }
};

const buildChartData = (sentimentSummary) => ({
    labels: ['Positive', 'Negative'],
    datasets: [{
        label: 'Comments Count',
        data: [
            sentimentSummary.positiveComments || 0,
            sentimentSummary.negativeComments || 0
        ],
        backgroundColor: ['#4caf50', '#f44336'],
        borderColor: ['#4caf50', '#f44336'],
        borderWidth: 1
    }]
});

const SentimentAnalysis = ({ videoId, words, videoTitle, onAnalyzeClicked }) => {
    const [analyses, setAnalyses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWord, setSelectedWord] = useState("");
    const [isCustomWord, setIsCustomWord] = useState(false);
    const [customWordInput, setCustomWordInput] = useState("");
    const [commentsToAnalyze, setCommentsToAnalyze] = useState(50);

    const pollingRefs = useRef({});
    const analysisIdCounter = useRef(0);

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

    const handleOpenModal = () => {
        setSelectedWord("");
        setIsCustomWord(false);
        setCustomWordInput("");
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    // Cleanup all polling on unmount
    useEffect(() => {
        const refs = pollingRefs.current;
        return () => {
            Object.values(refs).forEach(interval => clearInterval(interval));
        };
    }, []);

    const fetchSentimentSummary = useCallback(async (vidId, aId) => {
        try {
            const summaryResponse = await fetch(
                `http://localhost:8081/api/sentiment/sentimentOngoingAnalysis/${vidId}/${aId}`,
                { method: "GET", headers: { "accept": "*/*" } }
            );
            if (!summaryResponse.ok) {
                throw new Error(`HTTP error! status: ${summaryResponse.status}`);
            }
            return await summaryResponse.json();
        } catch (err) {
            console.error("Error fetching sentiment summary:", err);
            return null;
        }
    }, []);

    const startPolling = useCallback((slotId, vidId, aId) => {
        if (pollingRefs.current[slotId]) {
            clearInterval(pollingRefs.current[slotId]);
        }
        pollingRefs.current[slotId] = setInterval(async () => {
            const summaryData = await fetchSentimentSummary(vidId, aId);
            if (summaryData) {
                setAnalyses(prev => prev.map(a =>
                    a.id === slotId ? { ...a, sentimentSummary: summaryData } : a
                ));
                if (summaryData.analysisStatus === "COMPLETED") {
                    clearInterval(pollingRefs.current[slotId]);
                    delete pollingRefs.current[slotId];
                }
            }
        }, 3000);
    }, [fetchSentimentSummary]);

    const handleAnalyze = async () => {
        if (!selectedWord) {
            alert("Please select a word to analyze");
            return;
        }
        if (!videoId || !videoTitle) {
            alert("Video information is missing");
            return;
        }

        const slotId = ++analysisIdCounter.current;
        const word = selectedWord;
        const numComments = commentsToAnalyze;

        setAnalyses(prev => [...prev, {
            id: slotId,
            word,
            commentsToAnalyze: numComments,
            isAnalyzing: true,
            sentimentSummary: null,
            analysisId: null
        }]);
        setIsModalOpen(false);
        onAnalyzeClicked?.(word);

        try {
            const payload = {
                analysisId: "",
                videoId,
                videoTitle,
                analysisObject: word,
                moreInfo: "",
                totalCommentsToAnalyze: numComments
            };

            const response = await fetch("http://localhost:8081/api/sentiment/analyzeRequest", {
                method: "POST",
                headers: { "accept": "*/*", "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            let receivedAnalysisId = null;

            if (typeof result === 'string') {
                receivedAnalysisId = result;
            } else if (typeof result === 'object' && result !== null) {
                receivedAnalysisId = result.analysisId || result.id || result.uuid || result.analysisUuid;
            }

            if (!receivedAnalysisId) {
                const locationHeader = response.headers.get('Location');
                if (locationHeader) {
                    const match = locationHeader.match(/[a-f0-9-]{36}/i);
                    if (match) receivedAnalysisId = match[0];
                }
            }

            if (!receivedAnalysisId) {
                throw new Error("Analysis ID not found in response.");
            }

            const summary = await fetchSentimentSummary(videoId, receivedAnalysisId);

            setAnalyses(prev => prev.map(a =>
                a.id === slotId
                    ? { ...a, isAnalyzing: false, analysisId: receivedAnalysisId, sentimentSummary: summary }
                    : a
            ));

            if (summary?.analysisStatus !== "COMPLETED") {
                startPolling(slotId, videoId, receivedAnalysisId);
            }
        } catch (err) {
            console.error("Error analyzing sentiment:", err);
            alert("Failed to analyze sentiment. Please try again.");
            setAnalyses(prev => prev.filter(a => a.id !== slotId));
            if (pollingRefs.current[slotId]) {
                clearInterval(pollingRefs.current[slotId]);
                delete pollingRefs.current[slotId];
            }
        }
    };

    const isAnyAnalyzing = analyses.some(a =>
        a.isAnalyzing ||
        (a.sentimentSummary && a.sentimentSummary.analysisStatus !== "COMPLETED")
    );
    const canAddMore = analyses.length < MAX_ANALYSES;
    const slotCount = analyses.length;

    return (
        <div className="sentiment-analysis-placeholder">
            <h3>Sentiment Analysis</h3>
            {words && words.length > 0 ? (
                <>
                    {isModalOpen && (
                        <div className="sentiment-modal-overlay" onClick={handleCloseModal}>
                            <div className="sentiment-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="sentiment-modal-header">
                                    <h4 className="sentiment-modal-title">AI Sentiment Analysis</h4>
                                    <button className="sentiment-modal-close" onClick={handleCloseModal}>✕</button>
                                </div>
                                <div className="sentiment-modal-body">
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
                                                    <option key={index} value={word}>{word}</option>
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
                                                <option value={250}>250</option>
                                                <option value={500}>500</option>
                                                <option value={1000}>1000</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="sentiment-modal-analyze-row">
                                        <button
                                            className="sentiment-analyze-button"
                                            onClick={handleAnalyze}
                                            disabled={!selectedWord || !commentsToAnalyze}
                                        >
                                            Analyze
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {slotCount > 0 && (
                        <div className={`sentiment-charts-row sentiment-charts-${slotCount}`}>
                            {analyses.map(analysis => (
                                <div key={analysis.id} className="sentiment-chart-slot">
                                    {analysis.isAnalyzing ? (
                                        <div className="sentiment-analyzing-indicator">
                                            Analyzing <strong>"{analysis.word}"</strong>…
                                        </div>
                                    ) : analysis.sentimentSummary ? (
                                        <div className="sentiment-summary">
                                            <div className="sentiment-summary-label">
                                                Sentiment for: <strong>{analysis.sentimentSummary.analysisObject || analysis.word}</strong>
                                                {" · "}<strong>{analysis.sentimentSummary.totalCommentsToAnalyze ?? analysis.commentsToAnalyze}</strong>{" comments"}
                                            </div>
                                            <div className="sentiment-chart-and-progress">
                                                <div className="sentiment-chart-container">
                                                    <Bar data={buildChartData(analysis.sentimentSummary)} options={SENTIMENT_CHART_OPTIONS} />
                                                </div>
                                                <div className="sentiment-neutral-count">
                                                    <span className="sentiment-label-color" style={{ backgroundColor: '#ff9800', display: 'inline-block', marginRight: '5px', width: '10px', height: '10px' }}></span>
                                                    <span className="sentiment-label-text">Neutral: {analysis.sentimentSummary.neutralComments ?? 0}</span>
                                                </div>
                                                {analysis.sentimentSummary.analysisStatus !== "COMPLETED" && (
                                                    <div className="sentiment-progress-container">
                                                        <div className="sentiment-progress-label">
                                                            Progress: {analysis.sentimentSummary.totalCommentsAnalyzed ?? 0} / {analysis.sentimentSummary.totalCommentsToAnalyze ?? analysis.commentsToAnalyze}
                                                        </div>
                                                        <div className="sentiment-progress-bar-track">
                                                            <div
                                                                className="sentiment-progress-bar-fill"
                                                                style={{
                                                                    width: `${Math.min(100, ((analysis.sentimentSummary.totalCommentsAnalyzed ?? 0) / ((analysis.sentimentSummary.totalCommentsToAnalyze ?? analysis.commentsToAnalyze) || 1)) * 100)}%`
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}

                    {canAddMore && (
                        <button
                            className="sentiment-open-modal-button"
                            onClick={handleOpenModal}
                            disabled={isAnyAnalyzing}
                        >
                            {isAnyAnalyzing ? "Analyzing…" : "AI sentiment analysis"}
                        </button>
                    )}
                </>
            ) : (
                <p>No words available</p>
            )}
        </div>
    );
};

export default SentimentAnalysis;
