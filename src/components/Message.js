import React, { useState, useRef } from "react";

import maxBy from "lodash/maxBy";
import find from "lodash/find";
import filter from "lodash/filter";
import intersection from "lodash/intersection";
import indexOf from "lodash/indexOf";
import isEmpty from "lodash/isEmpty";
import some from "lodash/some";
import sortBy from "lodash/sortBy";
import uniqBy from "lodash/uniqBy";

import levenshtein from "fast-levenshtein";

import { Markets } from "./Markets";
import { Share } from "./Share";
import Song from "./Song";
import {
  addSongsToPlaylist,
  createEmptyPlaylist,
  searchForSong,
} from "../services/spotify";

const LOW_SUCCESS_WORDS = ["I", "a", "do", "and", "you", "love", "the"].map(
  (string) => string.toLowerCase(),
);
const DEFAULT_PLAYLIST_TITLE = "A playlist message";
const showMarketSelector = false;

export function Message({ accessToken, userId, refreshSession }) {
  const [playlistTitle, setPlaylistTitle] = useState(DEFAULT_PLAYLIST_TITLE);
  const [playlistId, setPlaylistId] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [generalError, setGeneralError] = useState(false);
  const [marketValue] = useState("all");
  const [searchTerms, setSearchTerms] = useState([]);
  const [songs, setSongs] = useState([]);
  const [text, setText] = useState("");

  const searchField = useRef(null);

  function getSearchTerms(rawText) {
    const searchKeywordGroups = rawText.split("("); //TODO: Check the number of parentheses
    let searchKeywords = [];
    searchKeywordGroups.forEach((group) => {
      if (group.indexOf(")") === -1) {
        group
          .trim()
          .split(" ")
          .forEach(function (word) {
            word = word.trim().replace(/\W/g, "");
            if (word.length) {
              searchKeywords.push(word);
            }
          });
      } else {
        let searchKeywordSplit = group.split(")");
        searchKeywords.push(searchKeywordSplit[0].trim());
        searchKeywordSplit[1]
          .trim()
          .split(" ")
          .forEach(function (word) {
            word = word.trim().replace(/\W/g, "");
            if (word.length) {
              searchKeywords.push(word);
            }
          });
      }
    });
    return searchKeywords;
  }

  function splitInputTerm(event) {
    setText(event.target.value);
    setSearchTerms(getSearchTerms(event.target.value));
  }

  function changeSong(title, event) {
    const uri = event.target.value;
    const songToChange = find(songs, ["title", title]);
    if (!songToChange) {
      return;
    }
    const songToUseInstead = find(songToChange.possibleSuggestions, { uri });
    if (!songToUseInstead) {
      return;
    }
    const songIndex = indexOf(songs, songToChange);
    const replacementName = songToUseInstead.name;
    const replacementInText =
      replacementName.indexOf(" ") !== -1
        ? `(${replacementName})`
        : replacementName;
    const newText = text.replace(new RegExp(title, "g"), replacementInText);

    setSongs((prev) => {
      const next = [...prev];
      next[songIndex] = {
        status: "match",
        index: songIndex,
        key: uri + songToChange.index,
        uri,
        title: replacementName,
        artist: songToUseInstead.artists[0].name,
        allExactMatches: null,
        alternativeArtists: null,
      };
      return next;
    });
    setText(newText);
    setSearchTerms(getSearchTerms(newText));
    setPlaylistId("");
  }

  function changeArtist(uri, event) {
    const { target } = event;
    setSongs((prevSongs) => {
      const songToChange = find(prevSongs, { uri });
      if (!songToChange || songToChange.uri === target.value) {
        return prevSongs;
      }
      const songIndex = indexOf(prevSongs, songToChange);
      const next = [...prevSongs];
      next[songIndex] = {
        status: "match",
        index: songToChange.index,
        key: target.value + songToChange.index,
        uri: target.value,
        title: songToChange.title,
        artist: target.options[target.selectedIndex].text,
        allExactMatches: songToChange.allExactMatches,
        alternativeArtists: songToChange.allExactMatches.filter(
          (match) => match.uri !== target.value,
        ),
      };
      return next;
    });
    setPlaylistId("");
  }

  async function createPlaylist() {
    const createEmptyPlaylistResponse = await createEmptyPlaylist(
      userId,
      playlistTitle,
      !isPrivate,
      accessToken,
    )
      .then((response) => response.json())
      .catch(() => setGeneralError(true));
    const { id } = createEmptyPlaylistResponse;

    const uris = songs.map((value) => value["uri"]);
    const addSongsToPlaylistResponse = await addSongsToPlaylist(
      userId,
      id,
      uris,
      accessToken,
    )
      .then((response) => response.json())
      .catch(() => setGeneralError(true));
    if (addSongsToPlaylistResponse?.snapshot_id) {
      setPlaylistId(id);
    }
  }

  function getSongsForPlaylist() {
    setPlaylistId("");
    setPlaylistTitle(DEFAULT_PLAYLIST_TITLE);
    setIsPrivate(false);
    setGeneralError(false);

    // Initialise all slots as pending up front
    const initialSongs = searchTerms.map((keyword) => ({
      title: keyword,
      status: "pending",
    }));
    setSongs(initialSongs);

    searchTerms.forEach(async (keyword, index) => {
      const response = await searchForSong(keyword, accessToken).catch(() =>
        setGeneralError(true),
      );

      if (response && !response.error) {
        const { tracks } = response;
        let resolvedSong = { title: keyword, status: "unmatched" };

        if (tracks?.items) {
          let allExactMatches = filter(
            tracks.items,
            (item) =>
              !isEmpty(item.uri) &&
              item.name.toLowerCase() === keyword.toLowerCase() &&
              (marketValue === "all" ||
                some(item.available_markets, marketValue)),
          );

          if (!isEmpty(allExactMatches)) {
            let firstMatch, songsFromDifferentArtists;
            if (allExactMatches.length > 1) {
              firstMatch = maxBy(allExactMatches, "popularity");
              songsFromDifferentArtists = allExactMatches.filter(
                (match) => match.uri !== firstMatch.uri,
              );
            } else {
              firstMatch = allExactMatches[0];
            }
            resolvedSong = {
              status: "match",
              index,
              key: firstMatch.uri + index,
              uri: firstMatch.uri,
              title: firstMatch.name,
              artist: firstMatch.artists[0].name,
              allExactMatches: songsFromDifferentArtists
                ? allExactMatches
                : null,
              alternativeArtists: songsFromDifferentArtists ?? null,
            };
          } else {
            const possibleSuggestions = filter(tracks.items, (item) => {
              const name = item.name.toLowerCase();
              const containsTitle = name.indexOf(keyword.toLowerCase()) !== -1;
              const hasNoHyphenOrParenthesis =
                name.indexOf("-") === -1 && name.indexOf("(") === -1;
              const isNotExcessivelyLong =
                name.split(" ").length - keyword.split(" ").length < 2;
              return (
                containsTitle &&
                hasNoHyphenOrParenthesis &&
                isNotExcessivelyLong
              );
            });
            if (possibleSuggestions.length) {
              resolvedSong.possibleSuggestions = sortBy(
                uniqBy(possibleSuggestions, (item) => item.name.toLowerCase()),
                (item) => levenshtein.get(item.name, keyword),
              );
            }
          }
        }

        // Update only this slot, leaving other in-flight results untouched
        setSongs((prev) => {
          const next = [...prev];
          next[index] = resolvedSong;
          return next;
        });
      } else {
        if (response?.error?.status === 401) {
          refreshSession();
        } else {
          setGeneralError(true);
        }
      }
    });
  }

  function checkForShortcut(event) {
    if (event.keyCode === 13 && (event.ctrlKey || event.metaKey)) {
      searchField.current.blur();
      getSongsForPlaylist();
    }
  }

  const hasMatchedSongs = some(songs, { status: "match" });
  const hasUnmatchedSongs = some(songs, { status: "unmatched" });
  const hasPendingSongs = some(songs, { status: "pending" });
  const hasLowSuccessText =
    intersection(
      searchTerms.map((string) => string.toLowerCase()),
      LOW_SUCCESS_WORDS,
    ).length > 0;

  return (
    <div>
      <div className="well clearfix content_wrap">
        <div className={`sm_section ${songs?.length > 0 && "arrow"}`}>
          <textarea
            value={text}
            ref={searchField}
            placeholder="Type your playlist message here"
            onChange={splitInputTerm}
            onKeyDown={checkForShortcut}
          />
          {hasLowSuccessText && (
            <p className="hint">
              Your text contains single words that are not often 100% matches
              for song titles. Try parentheses around them and connect them to
              the next word, like (I will), (a party) or (just you).
            </p>
          )}
          <p className="hint">
            Use parentheses to search for groups of words.
            <br /> Example:{" "}
            <span style={{ fontWeight: 600 }}>
              Heartbreaker (don't leave) stay
            </span>
            .
          </p>
          {showMarketSelector && (
            <>
              <Markets handleChange={() => {}} />
              <p className="hint">
                Restricting a market just affects whether songs can be played,
                not whether they can be added to a playlist message.
              </p>
            </>
          )}
          <button
            className="btn btn-primary pull-right"
            onClick={getSongsForPlaylist}
            disabled={searchTerms.length === 0}
          >
            Get songs for playlist
          </button>
        </div>
      </div>
      <div className="well clearfix">
        <div className={`sm_section ${playlistId && !generalError && "arrow"}`}>
          <ul id="react-suggested-songs" className="clearfix list-group">
            {songs.map((song, index) => (
              <Song
                {...song}
                key={index}
                changeSong={changeSong}
                changeArtist={changeArtist}
              />
            ))}
          </ul>
          {generalError ? (
            <div className="alert">
              We're terribly sorry, but there seems to be a problem with the
              Spotify API. Please check back again later.
            </div>
          ) : hasMatchedSongs && !hasUnmatchedSongs && !hasPendingSongs ? (
            <div className="input-group">
              <label htmlFor="playlisttitle">
                Enter a playlist name (optional)
              </label>
              <input
                id="playlisttitle"
                type="text"
                placeholder="Enter a playlist name (optional)"
                value={playlistTitle}
                onChange={(event) => setPlaylistTitle(event.target.value)}
              />
              <input
                type="checkbox"
                id="privateplaylist"
                checked={isPrivate}
                onChange={() => setIsPrivate((v) => !v)}
              />
              <label htmlFor="privateplaylist">Make playlist private</label>
              <button
                className="btn btn-primary"
                type="button"
                onClick={createPlaylist}
              >
                Create playlist
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {playlistId && !generalError && (
        <Share
          url={`https://open.spotify.com/playlist/${playlistId}`}
          isPrivate={isPrivate}
        />
      )}
    </div>
  );
}
