import React, { useState } from "react";
import VideoSearch from "./VideoSearch";
import VideoDisplayWrapper from "./videoStats/VideoDisplayWrapper";
import LatestAnalysis from "./LatestAnalysis";
import "./TubeSurfMain.css";

const TubeSurfMain = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [videoIdToAnalyze, setVideoIdToAnalyze] = useState("");
  const [selectedVideoFromSearch, setSelectedVideoFromSearch] = useState(null);
  const [showSearchList, setShowSearchList] = useState(false);
  const [showVideoDetails, setShowVideoDetails] = useState(false);

  const videoSetter = (event, searchItem) => {
    event.stopPropagation();
    const id = searchItem?.id?.videoId ?? searchItem;
    setVideoIdToAnalyze(id);
    setSelectedVideoFromSearch(typeof searchItem === "object" && searchItem?.id?.videoId ? searchItem : null);
    setShowVideoDetails(true);
    setShowSearchList(false);
  };

  return (
    <div className="search--main">
      <div className="search--options">
        <div className="search--option">
          <div className="search--input-row">
            <input
              type="text"
              required={false}
              placeholder="e.g. us elections, tech news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={() => {setShowSearchList(true); setShowVideoDetails(false);}}
              disabled={searchTerm === ""}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {showVideoDetails ? (
        <VideoDisplayWrapper videoId={videoIdToAnalyze} selectedVideoFromSearch={selectedVideoFromSearch} />
      ) : null}
      {showSearchList ? (
        <VideoSearch onClick={videoSetter} searchTerm={searchTerm} />
      ) : null}
      {!showSearchList && !showVideoDetails ? (
        <LatestAnalysis />
      ) : null}
    </div>
  );
};

export default TubeSurfMain;
