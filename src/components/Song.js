import React from "react";

const Song = ({
  status,
  artist,
  changeArtist,
  alternativeArtists,
  suggestedTitle,
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
    if (suggestedTitle) {
      return (
        <li className="list-group-item list-group-item-warning">
          We could not find any exact song titles matching "{title}".
          {suggestedTitle &&
            `
            Suggestion from the search results: "${suggestedTitle}".`}
          `
        </li>
      );
    } else {
      return (
        <li className="list-group-item list-group-item-warning">
          We could not find any song titles matching "{title}".
        </li>
      );
    }
  } else {
    const artistDomElement = alternativeArtists ? (
      <select
        className="playlist-message-select-artist"
        onChange={(event) => changeArtist(uri, event)}
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
