import React, { useState } from "react";
import he from "he";
import "./CommentListItem.css";

const MAX_COMMENT_LENGTH = 300;

const CommentListItem = ({ comment }) => {
  const [expanded, setExpanded] = useState(false);
  const decodedText = he.decode(comment.text);
  const isLong = decodedText.length > MAX_COMMENT_LENGTH;

  const toggleExpand = () => setExpanded((prev) => !prev);

  return (
    <li className="comment--card">
      <img
        className="comment-author--img"
        src={comment.authorProfileImageUrl}
        alt="authImg"
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
        <div className="comment--likes">
          <img
            src={`${process.env.PUBLIC_URL}/like.png`}
            width={15}
            height={15}
            alt="likes"
          />
          {comment.likeCount}
        </div>
      </div>
    </li>
  );
};

export default CommentListItem; 