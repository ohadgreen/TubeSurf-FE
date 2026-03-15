import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";
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
import SentimentAnalysis from "./SentimentAnalysis";
import VideoPlayer from "./VideoPlayer";
import "./VideoCommentsAnalysis.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const VideoCommentsAnalysis = (props) => {
    const auth = useAuth();
    const videoId = props.videoId;
    const selectedVideoFromSearch = props.selectedVideoFromSearch;
    const TOTAL_COMMENTS_REQUIRED = 500;
    const commentsListReqUrl = "http://localhost:8081/api/sentiment/getRawVideoComments";
    const commentsPageReqUrl = "http://localhost:8081/api/comments/page";

    const [initialCommentsSummary, setInitialCommentsSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [filteredComments, setFilteredComments] = useState([]);
    const [selectedWord, setSelectedWord] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sentimentFilter, setSentimentFilter] = useState(null); // 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | null
    const [sentimentObject, setSentimentObject] = useState(null); // The word analyzed (e.g. "love") - required for sentiment filter
    
    const PAGE_SIZE = 20; // Constant page size

    // Fetch summary data (wordsFrequency) - triggers commentsListReqUrl when videoId is set (e.g. search result selected)
    useEffect(() => {
        if (!videoId) return;

        const controller = new AbortController();
        const signal = controller.signal;
        setLoading(true);

        const fetchSummary = async () => {
            try {
                // Reset state when video changes (clear summary so existing sentiment data is not from previous video)
                setInitialCommentsSummary(null);
                setFilteredComments([]);
                setPageNumber(1);
                setSelectedWord(null);
                setHasMorePages(true);
                setSentimentFilter(null);
                setSentimentObject(null);
                
                const payload = {
                    userId: auth.user?.sub || auth.user?.email || "anonymous",
                    jobId: "12345",
                    videoId: videoId,
                    totalCommentsRequired: TOTAL_COMMENTS_REQUIRED,
                    commentsInPage: 50
                };

                const response = await apiFetch(commentsListReqUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload),
                    signal
                });

                const initialCommentsSummaryResults = await response.json();
                setInitialCommentsSummary(initialCommentsSummaryResults);
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.log(err);
            } finally {
                if (!signal.aborted) setLoading(false);
            }
        };

        fetchSummary();
        return () => controller.abort();
    }, [videoId]);

    // Fetch comments with pagination
    const fetchComments = useCallback(async (pageNum, pageSizeParam, wordFilter = null, sentimentObjectParam = null, sentimentValueParam = null, loadMore = false) => {
        if (loadMore) {
            setLoadingMore(true);
        } else {
            setCommentsLoading(true);
        }
        
        try {
            // API uses 0-indexed page numbers, convert from 1-indexed UI
            const apiPageNumber = pageNum - 1;
            
            const params = new URLSearchParams({
                videoId: videoId,
                pageNumber: apiPageNumber.toString(),
                pageSize: pageSizeParam.toString()
            });

            // Add keyword parameter for word filtering
            if (wordFilter) {
                params.append('keyword', wordFilter);
            }

            // Backend expects sentimentObject (the analyzed word) and sentiment (POSITIVE/NEUTRAL/NEGATIVE)
            if (sentimentObjectParam && sentimentValueParam) {
                params.append('sentimentObject', sentimentObjectParam);
                params.append('sentiment', sentimentValueParam);
            }

            const response = await apiFetch(`${commentsPageReqUrl}?${params.toString()}`);
            const commentsData = await response.json();

            // API returns Spring Data pagination format:
            // { content: [], totalElements: number, totalPages: number, number: number (0-indexed), size: number }
            const comments = Array.isArray(commentsData.content) ? commentsData.content : [];
            const total = commentsData.totalElements || 0;
            const totalPages = commentsData.totalPages || Math.ceil(total / pageSizeParam);
            const isLastPage = commentsData.last !== undefined ? commentsData.last : (pageNum >= totalPages);

            setHasMorePages(!isLastPage);

            // Map API response fields to what CommentListItem expects
            // API returns: text, authorName, authorProfileImageUrl, likeCount, publishedAt, commentId, sentiment...
            const mappedComments = comments.map(comment => ({
                ...comment,
                text: comment.text || comment.textDisplay || comment.textOriginal || '',
                authorName: comment.authorName || comment.authorDisplayName || ''
            }));

            // Backend handles keyword filtering, so just use the returned comments
            if (loadMore) {
                setFilteredComments(prev => [...prev, ...mappedComments]);
            } else {
                setFilteredComments(mappedComments);
            }
        } catch (err) {
            console.log(err);
        } finally {
            if (loadMore) {
                setLoadingMore(false);
            } else {
                setCommentsLoading(false);
            }
        }
    }, [videoId, commentsPageReqUrl]);

    // Handler for sentiment filter button click - triggers new API request
    const handleSentimentFilterClick = (value) => {
        // If clicking "All" (null), always clear the filter
        // Otherwise, toggle the filter (click same button to clear, different button to switch)
        const newFilter = value === null ? null : (sentimentFilter === value ? null : value);
        setSentimentFilter(newFilter);
        setFilteredComments([]);
        setPageNumber(1);
        setHasMorePages(true);
    };

    // Fetch comments when component mounts or filter changes (initial load)
    useEffect(() => {
        if (!loading && videoId) {
            setPageNumber(1);
            setHasMorePages(true);
            fetchComments(1, PAGE_SIZE, selectedWord, sentimentObject, sentimentFilter, false);
        }
    }, [videoId, selectedWord, sentimentFilter, sentimentObject, loading, fetchComments]);

    // Filter comments based on selected word
    const filterCommentsByWord = (word) => {
        if (!initialCommentsSummary) return;

        // Clear comments list when filter changes
        setFilteredComments([]);
        
        if (selectedWord === word) {
            // Clear filter - reset to page 1
            setSelectedWord(null);
            setPageNumber(1);
            setHasMorePages(true);
        } else {
            // Set new filter - will trigger useEffect to fetch filtered comments
            setSelectedWord(word);
            setPageNumber(1);
            setHasMorePages(true);
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

    // Load more comments for infinite scroll
    const loadMoreComments = useCallback(() => {
        if (!loadingMore && hasMorePages && !commentsLoading && !loading) {
            const nextPage = pageNumber + 1;
            setPageNumber(nextPage);
            fetchComments(nextPage, PAGE_SIZE, selectedWord, sentimentObject, sentimentFilter, true);
        }
    }, [loadingMore, hasMorePages, commentsLoading, loading, pageNumber, selectedWord, sentimentFilter, sentimentObject, fetchComments]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '100px',
            threshold: 0.1
        };

        const observerCallback = (entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMorePages && !loadingMore && !commentsLoading) {
                loadMoreComments();
            }
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const sentinelElement = document.getElementById('scroll-sentinel');

        if (sentinelElement) {
            observer.observe(sentinelElement);
        }

        return () => {
            if (sentinelElement) {
                observer.unobserve(sentinelElement);
            }
        };
    }, [hasMorePages, loadingMore, commentsLoading, loadMoreComments]);

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
        maintainAspectRatio: false,
        onClick: handleBarClick,
        plugins: {
            legend: {
                display: false,
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

    // Derive existing sentiment analyses from getRawVideoComments shortcut (when analysis already in DB)
    const existingSentimentAnalyses = (() => {
        const map = initialCommentsSummary?.sentimentAnalysisStatusMap;
        if (!map || typeof map !== 'object') return undefined;
        const entries = Object.entries(map);
        if (entries.length === 0) return undefined;
        return entries.map(([analysisId, data]) => ({
            id: `existing-${analysisId}`,
            word: data.sentimentObject ?? data.analysisObject ?? '',
            commentsToAnalyze: data.totalCommentsToAnalyze ?? 0,
            isAnalyzing: false,
            analysisId,
            sentimentSummary: {
                analysisObject: data.sentimentObject ?? data.analysisObject ?? '',
                positiveComments: data.positiveComments ?? 0,
                negativeComments: data.negativeComments ?? 0,
                neutralComments: data.neutralComments ?? 0,
                totalCommentsToAnalyze: data.totalCommentsToAnalyze ?? 0,
                totalCommentsAnalyzed: data.totalCommentsAnalyzed ?? 0,
                analysisStatus: data.analysisStatus ?? 'COMPLETED'
            }
        }));
    })();

    // Build player details from fetch response (getRawVideoComments); fallback to search result or minimal when loading
    const playerDetails = initialCommentsSummary?.videoId != null
        ? {
            id: initialCommentsSummary.videoId,
            snippet: {
                title: initialCommentsSummary.videoTitle ?? "Loading...",
                description: initialCommentsSummary.description ?? ""
            },
            statistics: initialCommentsSummary.statistics ?? {}
        }
        : (videoId && selectedVideoFromSearch
            ? {
                id: videoId,
                snippet: selectedVideoFromSearch.snippet ?? { title: "Loading...", description: "" },
                statistics: selectedVideoFromSearch.statistics ?? {}
              }
            : videoId
                ? { id: videoId, snippet: { title: "Loading...", description: "" }, statistics: {} }
                : null);

    return (
        <div className="video-comments-analysis-root layout-5col">
            <div className="video-player-cell">
                {playerDetails && <VideoPlayer videoDetails={playerDetails} />}
            </div>
            <div className="comments-col">
                <div className="comments-header-row">
                    <div className="comments-header">Comments</div>
                    {(selectedWord || sentimentFilter || sentimentObject) && (
                        <button
                            className="clear-filter-btn"
                            onClick={() => {
                                setSelectedWord(null);
                                setSentimentFilter(null);
                                setSentimentObject(null);
                                setFilteredComments([]);
                                setPageNumber(1);
                                setHasMorePages(true);
                                fetchComments(1, PAGE_SIZE, null, null, null, false);
                            }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
                {commentsLoading && <div>Loading comments...</div>}
                <div className="comments--list scrollable-comments-list">
                    {!commentsLoading && filteredComments.length === 0 && selectedWord ? (
                        <p>No comments found containing the word "{selectedWord}"</p>
                    ) : !commentsLoading && filteredComments.length === 0 ? (
                        <p>No comments found</p>
                    ) : null}
                    {!commentsLoading && filteredComments.length > 0 ? (
                        <>
                            {filteredComments.map((comment, index) => (
                                <CommentListItem
                                    key={comment.commentId || comment.id || index}
                                    comment={{
                                        ...comment,
                                        publishedAt: formatDateString(comment.publishedAt),
                                        // When sentiment filter is active, pass sentiment from parent (API may not include it per comment)
                                        ...(sentimentFilter && { sentiment: comment.sentiment ?? sentimentFilter })
                                    }}
                                    highlightWord={selectedWord || sentimentObject || undefined}
                                />
                            ))}
                            {/* Scroll sentinel for infinite scroll */}
                            <div id="scroll-sentinel" style={{ height: '20px' }}></div>
                            {loadingMore && (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    Loading more comments...
                                </div>
                            )}
                            {!hasMorePages && (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                    No more comments to load
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
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
            <div className="sentiment-analysis-col">
                <SentimentAnalysis
                    videoId={videoId}
                    words={words}
                    existingAnalyses={existingSentimentAnalyses}
                    onAnalyzeClicked={(analyzedWord) => setSentimentObject(analyzedWord)}
                    onAnalysisCompleted={() => {
                        setSelectedWord(null);
                        setSentimentFilter(null);
                        setSentimentObject(null);
                        setFilteredComments([]);
                        setPageNumber(1);
                        setHasMorePages(true);
                        fetchComments(1, PAGE_SIZE, null, null, null, false);
                    }}
                    onSentimentBarClick={(sentimentObj, sentiment) => {
                        const isSameFilter = sentimentObject === sentimentObj && sentimentFilter === sentiment;
                        const newFilter = isSameFilter ? null : sentiment;
                        const newSentimentObj = isSameFilter ? null : sentimentObj;
                        setSelectedWord(null);
                        setSentimentObject(newSentimentObj);
                        setSentimentFilter(newFilter);
                        setFilteredComments([]);
                    }}
                />
            </div>
        </div>
    );
};

export default VideoCommentsAnalysis;