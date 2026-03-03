import React, { useState, useEffect, useRef, useCallback } from "react";
import he from 'he';
import "./VideoSearch.css";
import { formatDateString } from '../utils/Utils'; 

const VideoSearch = (props) => {
  const searchTerm = props.searchTerm;
  console.log("searchTerm: " + searchTerm);

  const [searchResults, setSearchResults] = useState({
    nextPageToken: "",
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const nextPageTokenRef = useRef("");
  const loadingMoreRef = useRef(false);

  const searchBaseUrl = "http://localhost:8081/api/videos/search";

  nextPageTokenRef.current = searchResults.nextPageToken;
  loadingMoreRef.current = loadingMore;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ q: searchTerm });
    const url = `${searchBaseUrl}?${params.toString()}`;
    fetch(url)
      .then((res) => res.json())
      .then((searchResultsResponse) => {
        setSearchResults({
          nextPageToken: searchResultsResponse.nextPageToken ?? "",
          items: searchResultsResponse.items ?? [],
        });
      })
      .finally(() => setLoading(false));
  }, [searchTerm]);

  const loadMore = useCallback(() => {
    if (!nextPageTokenRef.current || loadingMoreRef.current) return;
    setLoadingMore(true);
    const params = new URLSearchParams({
      q: searchTerm,
      pageToken: nextPageTokenRef.current,
    });
    const url = `${searchBaseUrl}?${params.toString()}`;
    fetch(url)
      .then((res) => res.json())
      .then((searchResultsResponse) => {
        setSearchResults((prev) => ({
          nextPageToken: searchResultsResponse.nextPageToken ?? "",
          items: [...prev.items, ...(searchResultsResponse.items ?? [])],
        }));
      })
      .finally(() => setLoadingMore(false));
  }, [searchTerm]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollRoot = scrollContainerRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextPageTokenRef.current && !loadingMoreRef.current) {
          loadMore();
        }
      },
      { root: scrollRoot || undefined, rootMargin: "200px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, searchResults.nextPageToken]);

  const formatCount = (value) =>
    value != null && value !== ""
      ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      : "N/A";

  let searchResultsDisplay = searchResults.items
    .filter(item => item && item.id && item.id.videoId)
    .map((item) => {
      const stats = item.statistics;
      return (
        <li 
          key={item.id.videoId} 
          onClick={event => props.onClick(event, item)}
          className="video-sr--card">
          <img
            className="video-thumbnail--img"
            src={item.snippet?.thumbnails?.default?.url || ''}
            alt="new"
          />
          <div className="video-title--main">
            <div className="video-title--text">{he.decode(item.snippet?.title || '')}</div>
            <div className="video-title--description">{item.snippet?.description || ''}</div>
            <div className="video-title--publish">{item.snippet?.channelTitle || ''} {formatDateString(item.snippet?.publishTime)}</div>
            <div className="video-sr--stats">
              <span>
                <img src={`${process.env.PUBLIC_URL}/view.png`} width={15} height={15} alt="views" />
                {" "}{formatCount(stats?.viewCount)}
              </span>
              <span>
                <img src={`${process.env.PUBLIC_URL}/like.png`} width={15} height={15} alt="likes" />
                {" "}{formatCount(stats?.likeCount)}
              </span>
              <span>
                <img src={`${process.env.PUBLIC_URL}/comment.png`} width={15} height={15} alt="comments" />
                {" "}{formatCount(stats?.commentCount)}
              </span>
            </div>
          </div>
        </li>
      );
    });

  return (
    <div className="search--results">
      <div ref={scrollContainerRef} className="search--results-scroll">
        {loading && searchResults.items.length === 0 ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className="search-results--list">{searchResultsDisplay}</div>
            <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
            {loadingMore && <div className="search-results--loading-more">Loading more...</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default VideoSearch;
