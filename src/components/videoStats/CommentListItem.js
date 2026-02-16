import React, { useState } from "react";
import he from "he";
import "./CommentListItem.css";

const MAX_COMMENT_LENGTH = 300;

const SENTIMENT_COLORS = {
  POSITIVE: '#22c55e',
  NEGATIVE: '#ef4444',
  NEUTRAL: '#f97316',
};

const CommentListItem = ({ comment }) => {
  const [expanded, setExpanded] = useState(false);
  const decodedText = he.decode(comment.text);
  const isLong = decodedText.length > MAX_COMMENT_LENGTH;
  
  // Handle new sentimentResults array structure (up to 3 items)
  const sentimentResults = comment.sentimentResults ?? [];
  const displayedSentiments = sentimentResults.slice(0, 3);

  const toggleExpand = () => setExpanded((prev) => !prev);

  return (
    <li className="comment--card">
      <img
        className="comment-author--img"
        src={comment.authorProfileImageUrl}
        alt="authImg"
        referrerPolicy="no-referrer"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `${process.env.PUBLIC_URL}/person-fallback.webp`;
        }}
      />
      <div className="comment--main">
        <div className="comment-author">
          <div className="comment-author--name">{comment.authorName}</div>
          <div className="comment-author--publish">
            {comment.publishedAt}
          </div>
        </div>
        <div className="comment--text">
          {isLong && !expanded
            ? decodedText.slice(0, MAX_COMMENT_LENGTH) + "... "
            : decodedText}
          {isLong && (
            <span
              className="show-more"
              style={{ color: 'blue', cursor: 'pointer' }}
              onClick={toggleExpand}
            >
              {expanded ? " show less" : " show more..."}
            </span>
          )}
        </div>
        <div className="comment--meta">
          <div className="comment--likes">
            <img
              src={`${process.env.PUBLIC_URL || ""}/like.png`}
              width={15}
              height={15}
              alt="likes"
            />
            {comment.likeCount}
          </div>
          {displayedSentiments.map((result, index) => {
            const sentimentKey = result.sentiment ? String(result.sentiment).toUpperCase() : null;
            const sentimentColor = sentimentKey ? (SENTIMENT_COLORS[sentimentKey] ?? SENTIMENT_COLORS.NEUTRAL) : null;
            
            return (
              <div key={index} className="comment--sentiment" title={result.sentimentReason}>
                <span
                  className="comment--sentiment-square"
                  style={{ backgroundColor: sentimentColor }}
                  aria-hidden="true"
                />
                <span>{result.sentimentObject}</span>
              </div>
            );
          })}
        </div>
      </div>
    </li>
  );
};

export default CommentListItem; 