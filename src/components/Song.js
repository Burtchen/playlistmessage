import React from "react";

const Song = ({
  status,
  artist,
  changeArtist,
  changeSong,
  alternativeArtists,
  possibleSuggestions,
  title,
  uri,
}) => {
  if (status === "pending") {
    return (
      <li className="list-group-item list-group-item-info">
        We are looking for potential matches for &quot;{title}&quot;.
      </li>
    );
  }

  if (status === "unmatched") {
    return possibleSuggestions?.length ? (
      <li className="list-group-item list-group-item-warning">
        <strong>No matches for "{title}". </strong>{" "}
        <select
          className="playlist-message-select-artist"
          onChange={(event) => changeSong(title, event)}
        >
          <option value={null}>Suggestions from Spotify</option>
          {possibleSuggestions.map((suggestion) => (
            <option value={suggestion.uri} key={suggestion.uri}>
              {suggestion.name}
            </option>
          ))}
        </select>
      </li>
    ) : (
      <li className="list-group-item list-group-item-warning">
        No matches for "{title}".
      </li>
    );
  } else {
    const artistDomElement = alternativeArtists ? (
      <select
        className="playlist-message-select-artist"
        onChange={function (event) {
          return changeArtist(uri, event);
        }}
      >
        <option value={uri}>{artist}</option>
        {alternativeArtists.map((alternativeSong) => (
          <option value={alternativeSong.uri} key={alternativeSong.uri}>
            {alternativeSong.artists[0].name}
          </option>
        ))}
      </select>
    ) : (
      artist
    );
    return (
      <li className="list-group-item list-group-item-success">
        <strong>{title}</strong> <small>by {artistDomElement}</small>
      </li>
    );
  }
};

export default Song;
