import React from "react";
import VideoCommentsAnalysis from "./VideoCommentsAnalysis";

const VideoDisplayWrapper = (props) => {
    const videoId = props.videoId;
    const selectedVideoFromSearch = props.selectedVideoFromSearch;

    // Render VideoCommentsAnalysis as soon as we have a videoId so getRawVideoComments
    // is triggered immediately (title and details come from that response).
    if (!videoId) return null;

      return (
        <VideoCommentsAnalysis
          videoId={videoId}
          selectedVideoFromSearch={selectedVideoFromSearch}
        />
      )

};

export default VideoDisplayWrapper;    