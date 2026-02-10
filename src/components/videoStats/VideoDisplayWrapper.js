import React, { useState, useEffect } from "react";
import VideoCommentsAnalysis from "./VideoCommentsAnalysis";

const VideoDisplayWrapper = (props) => {

    const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
    const videoId = props.videoId;

    let youTubeVideoDetailsUrl = `https://youtube.googleapis.com/youtube/v3/videos?key=${apiKey}&part=statistics,snippet&id=${videoId}`;

    const [videoDetails, setVideoDetails] = useState(null);
    const [loading, setLoading] = useState(true);

      useEffect(() => {
        const fetchData = async () => {
          try {
            const videoDetails = await fetch(youTubeVideoDetailsUrl).then(
              (res) => res.json()
            );

            if (videoDetails && videoDetails.items && videoDetails.items.length > 0) {
              setVideoDetails(videoDetails.items[0]);
            } else {
              setVideoDetails(null);
            }
            setLoading(false);
          } catch (err) {
            console.log(err);
            setLoading(false);
          }
        };
    
        fetchData();
      }, [videoId]);


      if (loading) return <div>Loading...</div>;
      if (!videoDetails) return <div>Video not found or failed to load</div>;

      return (
        <VideoCommentsAnalysis
          videoId={videoId}
          videoTitle={videoDetails?.snippet?.title}
          videoDetails={videoDetails}
        />
      )


};

export default VideoDisplayWrapper;    