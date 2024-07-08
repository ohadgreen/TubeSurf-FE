import React, { useState, useEffect } from "react";
import { formatDateString } from "../../utils/Utils";
import he from "he";
import "./VideoCommentsAnalysis.css";

const VideoCommentsAnalysis = (props) => {

    const videoId = props.videoId;
    let initialCommentsSummaryUrl = `http://localhost:9100/api/comments/getVideoCommentsSummary/${videoId}`;

    const [initialCommentsSummary, setInitialCommentsSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const initialCommentsSummaryResults = await fetch(initialCommentsSummaryUrl).then((res) => res.json());
                setInitialCommentsSummary(initialCommentsSummaryResults);
                setLoading(false);
            } catch (err) {
                console.log(err);
                setLoading(false);
            }
        };

        fetchData();
    }, [videoId]);

    if (loading) return <div>Loading...</div>;
    if (!initialCommentsSummary) return <div>No data found</div>;

    return (
        <div>
            <label>Words Frequency</label>
            <table>           
            <tbody>
              {Object.entries(initialCommentsSummary.wordsFrequency).map(([word, frequency]) => (
                <tr key={word}>
                  <td>{word}</td>
                  <td>{frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        <div className="comments--list">
          {initialCommentsSummary.topRatedComments.map((comment, index) => {
            return (
              <li key={index} className="comment--card">
                <img
                  className="comment-author--img"
                  src={comment.authorProfileImageUrl}
                  alt="authImg"
                />
                <div className="comment--main">
                  <div className="comment-author">
                    <div className="comment-author--name">{comment.authorName}</div>
                      <div className="comment-author--publish">
                        {formatDateString(comment.publishedAt)}
                      </div>                    
                  </div>
                  <div className="comment--text">{he.decode(comment.text)}</div>
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
          })}
        </div>
        </div>
    );
};

export default VideoCommentsAnalysis;