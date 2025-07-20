import React, { useState } from "react";
import VideoSearch from "./VideoSearch";
import VideoDisplayWrapper from "./videoStats/VideoDisplayWrapper";
import VideoPlayer from "./videoStats/VideoPlayer";
import VideoCommentsAnalysis from "./videoStats/VideoCommentsAnalysis";
import "./TubeSurfMain.css";

const TubeSurfMain = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pastedVideoId, setPastedVideoId] = useState("");
  const [chosenVideoId, setChosenVideoId] = useState("");
  const [videoIdToAnalyze, setVideoIdToAnalyze] = useState("");
  const [showSearchList, setShowSearchList] = useState(false);
  const [showVideoDetails, setShowVideoDetails] = useState(false);

  const videoSetter = (event, itemId) => {
    event.stopPropagation();
    setChosenVideoId(itemId);
    setVideoIdToAnalyze(itemId);
    setShowVideoDetails(true);
    setShowSearchList(false);
  };

  return (
    <div className="search--main">
      <div className="search--options">
        <div className="search--option">
          <label>Search by Term</label>
          <input
            type="text"
            required={false}
            placeholder="us elections"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => {setShowSearchList(true); setShowVideoDetails(false);}}
            disabled={searchTerm === ""}          
          >Search</button>
        </div>
        <div>Or</div>
        <div className="search--option">
          <label>Search by ID</label>
          <input
            type="text"
            required={false}
            placeholder="YH-KJWHKQ_0D"
            value={videoIdToAnalyze}
          onChange={(e) => {
            setVideoIdToAnalyze(e.target.value)
          }}
          />
          <button
            className="get-video--button"
            onClick={() => setShowVideoDetails(true)}
            disabled={videoIdToAnalyze === ""}
          >
            Search
          </button>
        </div>
      </div>

      {showVideoDetails ? (
        <VideoDisplayWrapper videoId={videoIdToAnalyze} />          
      ) : null}
      {showSearchList ? (
        <VideoSearch onClick={videoSetter} searchTerm={searchTerm} />
      ) : null}
    </div>
  );
};

export default TubeSurfMain;
