import React, { useState, useEffect } from "react";
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
import { formatDateString } from "../../utils/Utils";
import CommentListItem from "./CommentListItem";
import "./VideoCommentsAnalysis.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Placeholder for SentimentAnalysis component
const SentimentAnalysis = () => (
  <div className="sentiment-analysis-placeholder">
    <h3>Sentiment Analysis</h3>
    <p>Sentiment analysis results will be displayed here.</p>
  </div>
);

const VideoCommentsAnalysis = (props) => {
    const videoId = props.videoId;
    let commentsListReqUrl = "http://localhost:8081/api/sentiment/commentsList";

    const [initialCommentsSummary, setInitialCommentsSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filteredComments, setFilteredComments] = useState([]);
    const [selectedWord, setSelectedWord] = useState(null);

    useEffect(() => {
    const fetchData = async () => {
      try {
        const payload = {
          userId: "ogreen",
          jobId: "12345",
          videoId: videoId,
          totalCommentsRequired: 500,
          commentsInPage: 50
        };

        const response = await fetch(commentsListReqUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const initialCommentsSummaryResults = await response.json();
        setInitialCommentsSummary(initialCommentsSummaryResults);

        if (initialCommentsSummaryResults && initialCommentsSummaryResults.topRatedComments) {
            setFilteredComments(initialCommentsSummaryResults.topRatedComments);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [videoId]);

    // Filter comments based on selected word
    const filterCommentsByWord = (word) => {
        if (!initialCommentsSummary) return;

        if (selectedWord === word) {
            setFilteredComments(initialCommentsSummary.topRatedComments);
            setSelectedWord(null);
        } else {
                const filtered = initialCommentsSummary.topRatedComments.filter(comment => {
                    if (!comment.text) return false;
                    
                    const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
                    return regex.test(comment.text);
                });
            
            setFilteredComments(filtered);
            setSelectedWord(word);
        }
    };

    // Handle bar click
    const handleBarClick = (event, elements) => {
        if (elements.length > 0) {
            const elementIndex = elements[0].index;
            const words = Object.keys(initialCommentsSummary.wordsFrequency);
            const clickedWord = words[elementIndex];
            filterCommentsByWord(clickedWord);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!initialCommentsSummary || !initialCommentsSummary.wordsFrequency) return <div>No data found</div>;

    // Prepare chart data
    const words = Object.keys(initialCommentsSummary.wordsFrequency);
    const frequencies = Object.values(initialCommentsSummary.wordsFrequency);

    const chartData = {
        labels: words,
        datasets: [
            {
                label: 'Word Frequency',
                data: frequencies,
                backgroundColor: words.map(word => 
                    word === selectedWord ? '#ff6384' : '#36A2EB'
                ), // Highlight selected word
                borderColor: words.map(word => 
                    word === selectedWord ? '#ff6384' : '#36A2EB'
                ),
                borderWidth: 1,
                hoverBackgroundColor: '#ffcd56',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        onClick: handleBarClick,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Words Frequency - Click bars to filter comments',
            },
            tooltip: {
                callbacks: {
                    afterLabel: () => 'Click to filter comments'
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 5,
                    precision: 0,
                },
                grid: {
                    display: true,
                },
            },
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        },
        interaction: {
            intersect: false,
        },
        animation: {
            duration: 0
        }
    };

    return (
        <div className="video-comments-analysis-root layout-3col">
            <div className="words-frequency-col">
                <h3>Words Frequency</h3>
                {selectedWord && (
                    <div className="filter-info">
                        <strong>Filtering by: "{selectedWord}"</strong> 
                        <button 
                            className="clear-filter-btn"
                            onClick={() => filterCommentsByWord(selectedWord)}
                        >
                            Clear Filter
                        </button>
                    </div>
                )}
                <div className="chart-container">
                    <Bar data={chartData} options={chartOptions} />
                </div>
            </div>
            <div className="comments-col">
                <h3>Comments ({filteredComments.length})</h3>
                <div className="comments--list scrollable-comments-list">
                    {filteredComments.length === 0 && selectedWord ? (
                        <p>No comments found containing the word "{selectedWord}"</p>
                    ) : (
                        filteredComments.map((comment, index) => (
                            <CommentListItem key={index} comment={{
                                ...comment,
                                publishedAt: formatDateString(comment.publishedAt)
                            }} />
                        ))
                    )}
                </div>
            </div>
            <div className="sentiment-analysis-col">
                <SentimentAnalysis />
            </div>
        </div>
    );
};

export default VideoCommentsAnalysis;