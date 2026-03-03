import React, { useState, useEffect } from "react";
import "./LatestAnalysis.css";

const API_URL = "http://localhost:8081/api/sentiment/latest";

const formatCount = (count) => {
  const num = typeof count === "string" ? parseInt(count, 10) : count;
  if (Number.isNaN(num)) return count;
  return num.toLocaleString();
};

const getTopWords = (wordsFrequency, limit = 5) => {
  if (!wordsFrequency || typeof wordsFrequency !== "object") return [];
  return Object.entries(wordsFrequency)
    .filter(([word]) => word.trim() !== "")
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
};

const LatestAnalysis = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to fetch latest analysis");
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  if (loading) {
    return (
      <div className="latest-analysis">
        <h2 className="latest-analysis__title">Latest comments analysis</h2>
        <div className="latest-analysis__loading">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="latest-analysis">
        <h2 className="latest-analysis__title">Latest comments analysis</h2>
        <div className="latest-analysis__error">{error}</div>
      </div>
    );
  }

  return (
    <div className="latest-analysis">
      <h2 className="latest-analysis__title">Latest comments analysis</h2>
      <div className="latest-analysis__grid">
        {items.map((item) => {
          const topWords = getTopWords(item.wordsFrequency);
          const maxWordCount = topWords.length ? Math.max(...topWords.map((w) => w.count)) : 1;
          const sentimentList = (item.sentimentAnalyses || []).slice(0, 3);
          const maxSentiment = sentimentList.length
            ? Math.max(
                ...sentimentList.flatMap((s) => [s.positiveComments, s.negativeComments])
              )
            : 1;
          return (
            <div key={item.videoId} className="latest-analysis__card">
              <div className="latest-analysis__card-inner">
                <header className="latest-analysis__card-header">
                  <img
                    src={item.defaultThumbnailUrl}
                    alt=""
                    className="latest-analysis__card-thumb"
                  />
                  <div className="latest-analysis__card-header-right">
                    <h3 className="latest-analysis__card-title">{item.videoTitle}</h3>
                    <div className="latest-analysis__card-stats">
                      <span title="Views">{formatCount(item.viewCount)} views</span>
                      <span title="Likes">{formatCount(item.likeCount)} likes</span>
                      <span title="Comments">{formatCount(item.commentCount)} comments</span>
                    </div>
                  </div>
                </header>
                <div className="latest-analysis__card-footer">
                  <div className="latest-analysis__chart">
                    <span className="latest-analysis__chart-label">Top words</span>
                    {topWords.length > 0 ? (
                      <div className="latest-analysis__chart-bars">
                        {topWords.map(({ word, count }) => (
                          <div key={word} className="latest-analysis__chart-row">
                            <span className="latest-analysis__chart-word">{word}</span>
                            <div className="latest-analysis__chart-bar-wrap">
                              <div
                                className="latest-analysis__chart-bar latest-analysis__chart-bar--words"
                                style={{ width: `${(count / maxWordCount) * 100}%` }}
                              />
                            </div>
                            <span className="latest-analysis__chart-value">{count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="latest-analysis__chart-empty">—</span>
                    )}
                  </div>
                  <div className="latest-analysis__sentiment">
                    <span className="latest-analysis__chart-label">Sentiment</span>
                    {sentimentList.length > 0 ? (
                      <div className="latest-analysis__sentiment-list">
                        {sentimentList.map((s) => (
                          <div key={s.sentimentObject} className="latest-analysis__sentiment-item">
                            <span className="latest-analysis__sentiment-object">
                              {s.sentimentObject}
                            </span>
                            <div className="latest-analysis__sentiment-bars">
                              <div className="latest-analysis__sentiment-row">
                                <span className="latest-analysis__sentiment-label latest-analysis__sentiment-label--positive">
                                  POSITIVE
                                </span>
                                <div className="latest-analysis__chart-bar-wrap">
                                  <div
                                    className="latest-analysis__chart-bar latest-analysis__chart-bar--positive"
                                    style={{
                                      width: `${(s.positiveComments / maxSentiment) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="latest-analysis__chart-value">
                                  {s.positiveComments}
                                </span>
                              </div>
                              <div className="latest-analysis__sentiment-row">
                                <span className="latest-analysis__sentiment-label latest-analysis__sentiment-label--negative">
                                  NEGATIVE
                                </span>
                                <div className="latest-analysis__chart-bar-wrap">
                                  <div
                                    className="latest-analysis__chart-bar latest-analysis__chart-bar--negative"
                                    style={{
                                      width: `${(s.negativeComments / maxSentiment) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="latest-analysis__chart-value">
                                  {s.negativeComments}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="latest-analysis__chart-empty">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LatestAnalysis;
