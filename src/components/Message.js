import React from "react";

import cloneDeep from "lodash/cloneDeep";
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

const LOW_SUCCESS_WORDS = [
  "I",
  "a",
  "do",
  "and",
  "you",
  "love",
  "the",
].map((string) => string.toLowerCase());
const DEFAULT_PLAYLIST_TITLE = "A playlist message";
const showMarketSelector = false;

export class Message extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      playlistTitle: DEFAULT_PLAYLIST_TITLE,
      playlistId: "",
      isPrivate: false,
      generalError: false,
      marketValue: "all",
      searchTerms: [],
      songs: [],
      text: "",
      supportsCopy: null,
    };
    this.searchField = React.createRef();
    this.titleField = React.createRef();
  }

  setGeneralError() {
    this.setState({ generalError: true });
  }

  changeSong(title, event) {
    const { songs } = this.state;
    const uri = event.target.value;
    const songToChange = find(songs, ["title", title]);
    const songIndex = indexOf(songs, songToChange);
    const songToUseInstead = find(songToChange.possibleSuggestions, { uri });
    const newSong = {
      status: "match",
      index: songIndex,
      key: uri + songToChange.index,
      uri,
      title: songToUseInstead.name,
      artist: songToUseInstead.artists[0].name,
      allExactMatches: null,
      alternativeArtists: null,
    };
    const text = cloneDeep(this.state.text).replace(
      new RegExp(title, "g"),
      songToUseInstead.name.indexOf(" ") !== -1
        ? `(${songToUseInstead.name})`
        : songToUseInstead.name
    );
    const newSongArray = cloneDeep(songs);
    newSongArray[songIndex] = newSong;
    this.setState({
      songs: newSongArray,
      playlistId: "",
      text,
      searchTerms: this.getSearchTerms(text),
    });
  }

  changeArtist(uri, event) {
    const { songs } = this.state;
    const songToChange = find(songs, { uri });
    const { target } = event;
    if (songToChange && songToChange.uri !== target.value) {
      const newSong = {
        status: "match",
        index: songToChange.index,
        key: target.value + songToChange.index,
        uri: target.value,
        title: songToChange.title,
        artist: target.options[target.selectedIndex].text,
        allExactMatches: songToChange.allExactMatches,
        alternativeArtists: songToChange.allExactMatches.filter(
          (match) => match.uri !== target.value
        ),
      };
      const songIndex = indexOf(songs, songToChange);
      const newSongArray = cloneDeep(songs);
      newSongArray[songIndex] = newSong;
      this.setState({
        songs: newSongArray,
        playlistId: "",
      });
    }
  }

  async createPlaylist() {
    const { userId, accessToken } = this.props;
    const { isPrivate, playlistTitle, songs } = this.state;
    const createEmptyPlaylistResponse = await createEmptyPlaylist(
      userId,
      playlistTitle,
      !isPrivate,
      accessToken
    )
      .then((response) => response.json())
      .catch((error) => {
        this.setGeneralError();
      });
    const { id } = createEmptyPlaylistResponse;

    const uris = songs.map((value) => value["uri"]);
    const addSongsToPlaylistResponse = await addSongsToPlaylist(
      userId,
      id,
      uris,
      accessToken
    )
      .then((response) => response.json())
      .catch((error) => {
        this.setGeneralError();
      });
    if (addSongsToPlaylistResponse && addSongsToPlaylistResponse.snapshot_id) {
      this.setState({ playlistId: id });
    }
  }

  getSearchTerms(rawText) {
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

  splitInputTerm(event) {
    this.setState({
      text: event.target.value,
      searchTerms: this.getSearchTerms(event.target.value),
    });
  }

  getSongsForPlaylist() {
    this.setState({
      playlistId: "",
      playlistTitle: DEFAULT_PLAYLIST_TITLE,
      isPrivate: false,
    }); // clear playlist on new submission
    // we're using the first user-initiated event to query for copy support
    if (this.state.supportsCopy === null) {
      this.setState({
        supportsCopy: !!document.queryCommandSupported("copy"),
      });
    }
    const incomingSongs = [];
    this.state.searchTerms.forEach(async (keyword, index) => {
      incomingSongs.push({
        title: keyword,
        status: "pending",
      });
      this.setState({ songs: incomingSongs });
      const response = await searchForSong(
        keyword,
        this.props.accessToken
      ).catch((error) => {
        this.setGeneralError();
      });
      if (response && !response.error) {
        const { tracks } = response;
        let songObject = {};
        if (tracks?.items) {
          let allExactMatches = filter(
            tracks.items,
            (item) =>
              !isEmpty(item.uri) &&
              item.name.toLowerCase() === keyword.toLowerCase() &&
              (this.state.marketValue === "all" ||
                some(item.available_markets, this.state.marketValue))
          );
          let firstMatch, songsFromDifferentArtists;
          if (!isEmpty(allExactMatches)) {
            if (allExactMatches?.length > 1) {
              firstMatch = maxBy(allExactMatches, "popularity");
              songsFromDifferentArtists = allExactMatches.filter(function (
                match
              ) {
                return match.uri !== firstMatch.uri;
              });
            } else {
              firstMatch = allExactMatches[0];
            }
          }
          songObject = find(incomingSongs, { title: keyword });
          if (firstMatch) {
            songObject.status = "match";
            songObject.index = index;
            songObject.uri = firstMatch.uri;
            songObject.title = firstMatch.name;
            songObject.artist = firstMatch.artists[0].name;
            if (songsFromDifferentArtists) {
              songObject.allExactMatches = allExactMatches;
              songObject.alternativeArtists = songsFromDifferentArtists;
            }
          } else {
            // if we do not have a single match, suggest a random search result
            songObject.status = "unmatched";
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
              songObject.possibleSuggestions = sortBy(
                uniqBy(possibleSuggestions, (item) => item.name.toLowerCase()),
                (item) => levenshtein.get(item.name, keyword)
              );
            }
          }
        } else {
          songObject.status = "unmatched";
        }
        this.setState({ songs: incomingSongs });
      } else {
        if (response?.error?.status === 401) {
          this.props.refreshSession();
        } else {
          this.setGeneralError();
        }
      }
    });
  }

  checkForShortcut(event) {
    if (event.keyCode === 13 && (event.ctrlKey || event.metaKey)) {
      this.searchField.current.blur();
      this.getSongsForPlaylist();
    }
  }

  handleMarketSelectorChange(event) {
    this.setState({ marketValue: event.target.value });
  }

  render() {
    const { isPrivate, songs, searchTerms } = this.state;
    const hasMatchedSongs = some(songs, { status: "match" });
    const hasUnmatchedSongs = some(songs, { status: "unmatched" });
    const hasPendingSongs = some(songs, { status: "pending" });
    const hasLowSuccessText =
      intersection(
        searchTerms.map((string) => string.toLowerCase()),
        LOW_SUCCESS_WORDS
      ).length > 0;

    return (
      <div>
        <div className="well clearfix content_wrap">
          <div
            className={`sm_section ${this.state.songs?.length > 0 && "arrow"}`}
          >
            <textarea
              value={this.state.text}
              ref={this.searchField}
              placeholder="Type your playlist message here"
              onChange={(event) => this.splitInputTerm(event)}
              onKeyDown={(event) => this.checkForShortcut(event)}
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
                <Markets
                  handleChange={() => this.handleMarketSelectorChange()}
                />
                <p className="hint">
                  Restricting a market just affects whether songs can be played,
                  not whether they can be added to a playlist message.
                </p>
              </>
            )}
            <button
              className="btn btn-primary pull-right"
              onClick={() => this.getSongsForPlaylist()}
              disabled={this.state.searchTerms.length === 0}
            >
              Get songs for playlist
            </button>
          </div>
        </div>
        <div className="well clearfix">
          <div
            className={`sm_section ${
              this.state.playlistId && !this.state.generalError && "arrow"
            }`}
          >
            <ul id="react-suggested-songs" className="clearfix list-group">
              {this.state.songs.map((song, index) => (
                <Song
                  {...song}
                  key={index}
                  changeSong={this.changeSong.bind(this)}
                  changeArtist={this.changeArtist.bind(this)}
                />
              ))}
            </ul>
            {this.state.generalError ? (
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
                  value={this.state.playlistTitle}
                  ref={this.titleField}
                  onChange={(event) =>
                    this.setState({ playlistTitle: event.target.value })
                  }
                />
                <input
                  type="checkbox"
                  id="privateplaylist"
                  value={isPrivate}
                  onChange={() => this.setState({ isPrivate: !isPrivate })}
                />
                <label htmlFor="privateplaylist">Make playlist private</label>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => this.createPlaylist()}
                >
                  Create playlist
                </button>
              </div>
            ) : null}
          </div>
        </div>
        {this.state.playlistId && !this.state.generalError && (
          <Share
            url={`https://open.spotify.com/playlist/${this.state.playlistId}`}
            isPrivate={isPrivate}
            supportsCopy={this.state.supportsCopy}
          />
        )}
      </div>
    );
  }
}
