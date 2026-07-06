import React, { useState, useEffect } from "react";
import "./normalize.css";
import "./App.css";

import Header from "./components/Header";
import { Message } from "./components/Message";
import { getUserData } from "./services/spotify";
import Footer from "./components/Footer";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

function getHashParams() {
  const hashParams = {};
  let e;
  const r = /([^&;=]+)=?([^&;]*)/g;
  const q = window.location.hash.substring(1);
  while ((e = r.exec(q))) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

function redirectToSpotifyAuth() {
  const redirect_uri = window.location.protocol + "//" + window.location.host;
  const state = new Uint32Array(16);
  window.crypto.getRandomValues(state);
  const scope = "playlist-modify-public playlist-modify-private";
  let url = "https://accounts.spotify.com/authorize";
  url += "?response_type=token";
  url += "&client_id=" + encodeURIComponent(CLIENT_ID);
  url += "&scope=" + encodeURIComponent(scope);
  url += "&redirect_uri=" + encodeURIComponent(redirect_uri);
  url += "&state=" + encodeURIComponent(state);
  window.location = url;
}

export function App() {
  const [accessToken] = useState(() => getHashParams()?.access_token ?? null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (accessToken) {
      getUserData(accessToken)
        .then((r) => r.json())
        .then((data) => setUserId(data.id));
    }
  }, [accessToken]);

  function setupForSessionRefresh() {
    setAccessToken(null);
    window.location = window.location.href;
  }

  const hasPreviousAuth = userId !== null;
  const hasDenied = window.location.search?.includes("access_denied");

  return (
    <div>
      <Header />
      {accessToken ? (
        <Message
          refreshSession={setupForSessionRefresh}
          accessToken={accessToken}
          userId={userId}
        />
      ) : (
        <div className="sm_section">
          <div className="example-image-container">
            <img
              alt="Example PlaylistMessage"
              src={`/${hasPreviousAuth ? "example2" : "example"}.png`}
            />
          </div>
          {hasDenied && (
            <p className="hint alert">
              Once more, with feeling! You need to authorize Spotify, otherwise
              we can't play(list message).
            </p>
          )}
          {hasPreviousAuth ? (
            <p className="hint" style={{ marginTop: "1rem" }}>
              Your Spotify connection expired, click below to write another
              playlist message.
            </p>
          ) : (
            <p className="hint">
              Say it with a playlist! Just type and we'll find songs matching
              your input. Then, save the playlist in your Spotify account and
              share it!
            </p>
          )}
          <button
            className="btn btn-primary"
            type="button"
            onClick={redirectToSpotifyAuth}
          >
            {hasPreviousAuth ? "Start again" : "Authorize Spotify to Start"}
          </button>
          {!hasPreviousAuth && (
            <p className="hint" style={{ marginTop: "1rem" }}>
              We need your permission to use your Spotify account to search for
              songs and create public playlists. We cannot use your email
              address or any other information you do not grant access to.
            </p>
          )}
        </div>
      )}
      <Footer />
    </div>
  );
}

export default App;
