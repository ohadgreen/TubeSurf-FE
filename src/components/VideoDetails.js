import React, { useState, useEffect } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import "./VideoDetails.css";

const VideoDetails = (props) => {
  const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
  const videoId = props.videoId;

  let videoStatsBaseUrl = `https://youtube.googleapis.com/youtube/v3/videos?key=${apiKey}&part=statistics&id=${videoId}`;

  const [videoStats, setVideoStats] = useState(null);

  useEffect(() => {
    fetch(videoStatsBaseUrl)
      .then((res) => res.json())
      .then((res) => {
        setVideoStats(res.items[0].statistics);
      });

    console.log("videoStats: " + videoStats);
  }, [videoId]);

  const opts = {
    height: "390",
    width: "640",
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 0,
    },
  };

  const onPlayerReady = (event) => {
    // access to player in all event handlers via event.target
    event.target.pauseVideo();
  };

  return (
    <div>
      {videoStats == null ? (
        <div></div>
      ) : (
        <div className="video-details">
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onPlayerReady}
            className="video-player"
          />
          <div className="video-stats">
            <div>Views:{videoStats.viewCount}</div>
            <div>Likes:{videoStats.likeCount}</div>
            <div>Comments:{videoStats.commentCount}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoDetails;
