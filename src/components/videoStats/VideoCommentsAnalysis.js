import React, { useState, useEffect } from "react";
import { formatDateString } from "../../utils/Utils";
import CommentListItem from "./CommentListItem";
import "./VideoCommentsAnalysis.css";

const VideoCommentsAnalysis = (props) => {

    const videoId = props.videoId;
    console.log("@@@ videoId: " + videoId);

    let commentsListReqUrl = "http://localhost:8081/api/sentiment/commentsList";

    const [initialCommentsSummary, setInitialCommentsSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchData = async () => {
      try {
        const payload = {
          userId: "ogreen",
          jobId: "12345",
          videoId: videoId,
          totalCommentsRequired: 50,
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
      } catch (err) {
        console.log(err);
      } finally {
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
          {initialCommentsSummary.topRatedComments.map((comment, index) => (
            <CommentListItem key={index} comment={{
              ...comment,
              publishedAt: formatDateString(comment.publishedAt)
            }} />
          ))}
        </div>
        </div>
    );
};

export default VideoCommentsAnalysis;