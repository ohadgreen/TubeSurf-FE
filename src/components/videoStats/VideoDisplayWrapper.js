import React, { useState, useEffect } from "react";
import VideoCommentsAnalysis from "./VideoCommentsAnalysis";

const VideoDisplayWrapper = (props) => {

    const videoId = props.videoId;
    const selectedVideoFromSearch = props.selectedVideoFromSearch;
    const videoDetailsBaseUrl = "http://localhost:8081/api/videos/details";

    const [videoDetails, setVideoDetails] = useState(null);
    const [loading, setLoading] = useState(true);

      useEffect(() => {
        if (!videoId) return;
        setVideoDetails(null);
        setLoading(true);
        const fetchData = async () => {
          try {
            const url = `${videoDetailsBaseUrl}?videoId=${encodeURIComponent(videoId)}`;
            const response = await fetch(url).then((res) => res.json());

            const details = response?.items?.[0] ?? (response?.snippet ? response : null);
            if (details) {
              setVideoDetails(details);
            } else {
              setVideoDetails(null);
            }
          } catch (err) {
            console.log(err);
            setVideoDetails(null);
          } finally {
            setLoading(false);
          }
        };

        fetchData();
      }, [videoId]);

      // Render VideoCommentsAnalysis as soon as we have a videoId so commentsListReqUrl
      // is triggered immediately when a search result is selected (don't wait for details).
      if (!videoId) return null;

      return (
        <VideoCommentsAnalysis
          videoId={videoId}
          videoTitle={videoDetails?.snippet?.title}
          videoDetails={videoDetails}
          selectedVideoFromSearch={selectedVideoFromSearch}
        />
      )


};

export default VideoDisplayWrapper;    