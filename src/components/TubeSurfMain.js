import React, { useState } from "react";
import VideoSearch from "./VideoSearch";
import VideoDetails from "./VideoDetails";
import "./TubeSurfMain.css";

const TubeSurfMain = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchList, setShowSearchList] = useState(false);
  const [chosenVideoId, setChosenVideoId] = useState("");

  const videoSetter = (event, itemId) => {
    event.stopPropagation();
    setChosenVideoId(itemId);
  };

  return (
    <div>
      <div>
        <h3>Video Search</h3>
        <div  className="search-video">
          <input
            type="text"
            required={true}
            placeholder="Search for a video"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="get-video--button"
            onClick={() => setShowSearchList(true)}
          >
            Search
          </button>
        </div>
      </div>
      {chosenVideoId !== "" ? <VideoDetails videoId={chosenVideoId} /> : null}
      {showSearchList ? (
        <VideoSearch onClick={videoSetter} searchTerm={searchTerm} />
      ) : null}
    </div>
  );
};

export default TubeSurfMain;
