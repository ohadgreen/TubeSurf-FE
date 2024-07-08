import React, { useState, useEffect } from "react";
import he from 'he';
import "./VideoSearch.css";

const VideoSearch = (props) => {
  const myApiKey = process.env.REACT_APP_API_KEY;
  console.log("myApiKey: " + myApiKey);

  const searchTerm = props.searchTerm;
  console.log("searchTerm: " + searchTerm);

  const [searchResults, setSearchResults] = useState({
    nextPageToken: "",
    items: [],
  });

  const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
  console.log("apiKey: " + apiKey);
  let searchVideoBaseUrl2 = `https://youtube.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&maxResults=10&q=`;

  useEffect(() => {
    fetch(searchVideoBaseUrl2 + searchTerm)
      .then((res) => res.json())
      .then((searchResultsResponse) => {
        setSearchResults(() => {
          return { nextPageToken: searchResultsResponse.nextPageToken, items: searchResultsResponse.items };
        });
      });      
  }, []);


  function formatDate(originalDateString) {
    var originalDate = new Date(originalDateString);

    var year = originalDate.getFullYear();
    var month = ("0" + (originalDate.getMonth() + 1)).slice(-2); // Months are zero-based
    var day = ("0" + originalDate.getDate()).slice(-2);

    var formattedDateString = year + "-" + month + "-" + day;
    return formattedDateString;
}

  let searchResultsDisplay = searchResults.items.map((item) => {
    return (
      <li 
        key={item.id.videoId} 
        onClick={event => props.onClick(event, item.id.videoId)}
        className="video-sr--card">
        <img
          className="video-thumbnail--img"
          src={item.snippet.thumbnails.default.url}
          alt="new"
        />
        <div className="video-title--main">
          <div className="video-title--text">{he.decode(item.snippet.title)}</div>
          <div className="video-title--description">{item.snippet.description}</div>
          <div className="video-title--publish">{item.snippet.channelTitle} {formatDate(item.snippet.publishTime)}</div>
        </div>
      </li>
    );
  });

  return (
    <div className="search--results">      
      <div>
        {searchResults == undefined ? (
          <div>Loading...</div>
        ) : (
          <div className="search-results--list">{searchResultsDisplay}</div>
        )}
      </div>
    </div>
  );
};

export default VideoSearch;
