import React from "react";

import maxBy from "lodash/maxBy";
import find from "lodash/find";
import filter from "lodash/filter";
import indexOf from "lodash/indexOf";
import isEmpty from "lodash/isEmpty";
import some from "lodash/some";
import sample from "lodash/sample";

import { Markets } from "./Markets";
import { Share } from "./Share";
import Song from "./Song";
import {
  addSongsToPlaylist,
  createEmptyPlaylist,
  searchForSong,
} from "../services/spotify";

const DEFAULT_PLAYLIST_TITLE = "A playlist message";
const showMarketSelector = false;

export class Message extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      text: "",
      playlistTitle: DEFAULT_PLAYLIST_TITLE,
      playlistId: "",
      isPrivate: false,
      generalError: false,
      marketValue: "all",
      searchTerms: [],
      songs: [],
      supportsCopy: null,
    };
    this.searchField = React.createRef();
    this.titleField = React.createRef();
  }

  setGeneralError() {
    this.setState({ generalError: true });
  }

  changeArtist(previousKey, event) {
    const songs = this.state.songs;
    const songToChange = find(songs, ["key", previousKey]);
    const eTarget = event.target;
    if (songToChange && songToChange.uri !== eTarget.value) {
      const newSong = {
        status: "match",
        index: songToChange.index,
        key: eTarget.value + songToChange.index,
        uri: eTarget.value,
        title: songToChange.title,
        artist: eTarget.options[eTarget.selectedIndex].text,
        allExactMatches: songToChange.allExactMatches,
        alternativeArtists: songToChange.allExactMatches.filter(function (
          match
        ) {
          return match.uri !== eTarget.value;
        }),
      };
      songs.splice(indexOf(songs, songToChange), 1, newSong);
      this.setState({
        songs: songs,
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

  splitInputTerm() {
    this.setState({
      playlistId: "",
      playlistTitle: DEFAULT_PLAYLIST_TITLE,
      isPrivate: false,
    }); // clear playlist on new submission
    const searchKeywordGroups = this.state.text.split("("); //TODO: Check the number of parentheses
    let searchKeywords = [];
    searchKeywordGroups.forEach(function (group) {
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
    this.setState({ searchTerms: searchKeywords }, this.getSongsForPlaylist);
  }

  getSongsForPlaylist() {
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
      const response = await searchForSong(keyword, this.props.accessToken)
        .then((response) => response.json())
        .catch((error) => {
          console.log(error);
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
            songObject.key = firstMatch.uri + index;
            songObject.uri = firstMatch.uri;
            songObject.title = firstMatch.name;
            songObject.artist = firstMatch.artists[0].name;
            if (songsFromDifferentArtists) {
              songObject.allExactMatches = allExactMatches;
              songObject.alternativeArtists = songsFromDifferentArtists;
            }
          } else {
            // if we do not have a single match, suggest a random search result
            // todo: use levenshtein distance, offer suggestion
            songObject.status = "unmatched";
            const possibleSuggestions = filter(tracks.items, (item) => {
              const containsTitle =
                item.name.toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
              const hasNoHyphenOrParenthesis =
                item.name.toLowerCase().indexOf("-") === -1 &&
                item.name.toLowerCase().indexOf("(") === -1;
              return containsTitle && hasNoHyphenOrParenthesis;
            });
            if (possibleSuggestions.length) {
              songObject.suggestedTitle = sample(possibleSuggestions)["name"];
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
      this.splitInputTerm();
    }
  }

  handleMessageTextChange(event) {
    this.setState({ text: event.target.value });
  }

  handleMarketSelectorChange(event) {
    this.setState({ marketValue: event.target.value });
  }

  render() {
    const hasMatchedSongs = some(this.state.songs, { status: "match" });
    const hasUnmatchedSongs = some(this.state.songs, { status: "unmatched" });
    const hasPendingSongs = some(this.state.songs, { status: "pending" });

    return (
      <div>
        <div className="well clearfix content_wrap">
          <div
            className={`sm_section ${this.state.songs?.length > 0 && "arrow"}`}
          >
            <textarea
              ref={this.searchField}
              placeholder="Type your playlist message here"
              onChange={(event) => this.handleMessageTextChange(event)}
              onKeyDown={(event) => this.checkForShortcut(event)}
            />
            <p className="hint">
              Use parentheses to search for groups of words.
              <br /> Example:{" "}
              <span style={{ fontWeight: 600 }}>
                Heartbreaker (nothing compares to you) stay
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
              onClick={() => this.splitInputTerm()}
              disabled={this.state.text.length === 0}
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
                <Song {...song} key={index} changeArtist={this.changeArtist} />
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
                  value={this.state.isPrivate}
                  onChange={() =>
                    this.setState({ isPrivate: !this.state.isPrivate })
                  }
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
            isPrivate={this.state.isPrivate}
            supportsCopy={this.state.supportsCopy}
          />
        )}
      </div>
    );
  }
}