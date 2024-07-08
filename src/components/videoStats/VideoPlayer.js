import React, { useState, useEffect } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import "./VideoPlayer.css";

const VideoPlayer = (props) => {
  const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
  const videoId = props.videoId;

  let youTubeTotalStatsUrl = `https://youtube.googleapis.com/youtube/v3/videos?key=${apiKey}&part=statistics&id=${videoId}`;

  const [youTubeVideoStats, setYouTubeVideoStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const youTubeStatsResults = await fetch(youTubeTotalStatsUrl).then(
          (res) => res.json()
        );
        setYouTubeVideoStats(youTubeStatsResults.items[0].statistics);
        setLoading(false);
      } catch (err) {
        console.log(err);
        setLoading(false);
      }
    };

    fetchData();
  }, [videoId]);

  const opts = {
    height: "300",
    width: "450",
    playerVars: {
      autoplay: 0,
    },
  };

  const onPlayerReady = (event) => {
    event.target.pauseVideo();
  };

  if (loading) return <div>Loading...</div>;
  if (!youTubeVideoStats) return <div>No data found</div>;

  return (
    <div className="video--player">
      <YouTube videoId={videoId} opts={opts} onReady={onPlayerReady} />
      <div className="video--stats">
        <div>
          <img
            src={`${process.env.PUBLIC_URL}/view.png`}
            width={15}
            height={15}
            alt="views"
          />
          {" "}{youTubeVideoStats.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </div>
        <div>
        <img
            src={`${process.env.PUBLIC_URL}/like.png`}
            width={15}
            height={15}
            alt="likes"
          />
          {" "}
          {youTubeVideoStats.likeCount
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </div>
        <div>
        <img
            src={`${process.env.PUBLIC_URL}/comment.png`}
            width={15}
            height={15}
            alt="like icon"
          />
          {" "}
          {youTubeVideoStats.commentCount
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
