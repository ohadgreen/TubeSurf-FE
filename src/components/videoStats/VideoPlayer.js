import React, { useState, useEffect } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import "./VideoPlayer.css";

const MAX_DESCRIPTION_LENGTH = 300;

const VideoPlayer = (props) => {
  const videoId = props.videoDetails?.id;
  const videoStats = props.videoDetails?.statistics;
  const [descExpanded, setDescExpanded] = useState(false);

  const opts = {
    height: "240",
    width: "360",
    playerVars: {
      autoplay: 0,
    },
  };

  const trimYouTubeDescription = (description) => {
    if (!description || typeof description !== 'string') {
      return '';
    }
    const doubleNewlineIndex = description.indexOf('\n\n');
    if (doubleNewlineIndex === -1) {
      return description;
    }
    return description.substring(0, doubleNewlineIndex);
  };

  const onPlayerReady = (event) => {
    event.target.pauseVideo();
  };

  const rawDescription = props.videoDetails?.snippet?.description;
  const trimmedDescription = trimYouTubeDescription(rawDescription);
  const isLong = trimmedDescription.length > MAX_DESCRIPTION_LENGTH;
  const displayDescription = isLong && !descExpanded
    ? trimmedDescription.slice(0, MAX_DESCRIPTION_LENGTH) + "... "
    : trimmedDescription;

  return (
    <div className="video-player-outer-root">
      <div className="video-player-title-row">
        <div className="video--title">
          {props.videoDetails?.snippet?.title || 'No title available'}
        </div>
      </div>
      <div className="video-player-horizontal-root">
        <div className="video-player-left">
          <YouTube videoId={videoId} opts={opts} onReady={onPlayerReady} />
        </div>
        <div className="video-player-right">
          <div className="video--description" style={{ marginBottom: '16px' }}>
            {displayDescription}
            {isLong && (
              <span
                className="show-more"
                style={{ color: 'blue', cursor: 'pointer' }}
                onClick={() => setDescExpanded((prev) => !prev)}
              >
                {descExpanded ? " show less" : " show more..."}
              </span>
            )}
          </div>
          <div className="video--stats">
            <div>
              <img
                src={`${process.env.PUBLIC_URL}/view.png`}
                width={15}
                height={15}
                alt="views"
              />
              {" "}Views: {videoStats?.viewCount ? videoStats.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'N/A'}
            </div>
            <div>
              <img
                src={`${process.env.PUBLIC_URL}/like.png`}
                width={15}
                height={15}
                alt="likes"
              />
              {" "}Likes: {videoStats?.likeCount ? videoStats.likeCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'N/A'}
            </div>
            <div>
              <img
                src={`${process.env.PUBLIC_URL}/comment.png`}
                width={15}
                height={15}
                alt="comments"
              />
              {" "}Comments: {videoStats?.commentCount ? videoStats.commentCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'N/A'}
            </div>
            {/* <div style={{ color: 'red', fontSize: '0.9em', marginTop: '8px' }}>
              videoId: {videoId}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
