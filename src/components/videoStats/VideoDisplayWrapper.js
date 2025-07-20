import React, { useState, useEffect } from "react";
import VideoCommentsAnalysis from "./VideoCommentsAnalysis";
import VideoPlayer from "./VideoPlayer";

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

            setVideoDetails(videoDetails.items[0]);
            setLoading(false);
          } catch (err) {
            console.log(err);
            setLoading(false);
          }
        };
    
        fetchData();
      }, [videoId]);


      if (loading) return <div>Loading...</div>;

      return (
        <div>
            <VideoPlayer videoDetails={videoDetails} />
            <VideoCommentsAnalysis videoId={videoId} />
        </div>

      )


};

export default VideoDisplayWrapper;    