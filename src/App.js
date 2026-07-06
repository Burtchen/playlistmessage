import React, { useState, useEffect } from "react";
import "./normalize.css";
import "./App.css";

import Header from "./components/Header";
import { Message } from "./components/Message";
import { getUserData } from "./services/spotify";
import {
  beginAuth,
  clearAuth,
  getAccessToken,
  getStoredAuth,
  handleRedirectCallback,
} from "./services/spotifyAuth";
import Footer from "./components/Footer";

export function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const fromRedirect = await handleRedirectCallback();
        if (fromRedirect) {
          setAccessToken(fromRedirect.accessToken);
        } else if (getStoredAuth()) {
          const token = await getAccessToken();
          if (token) {
            setAccessToken(token);
          }
        }
      } catch (error) {
        setAuthError(error.message);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    getUserData(accessToken)
      .then((r) => r.json())
      .then((data) => setUserId(data.id))
      .catch(() => {});
  }, [accessToken]);

  async function refreshSession() {
    const token = await getAccessToken();
    if (token && token !== accessToken) {
      setAccessToken(token);
    } else {
      clearAuth();
      setAccessToken(null);
      setUserId(null);
    }
  }

  const hasPreviousAuth = userId !== null;
  const hasDenied = authError === "access_denied";

  if (!ready) {
    return (
      <div>
        <Header />
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      {accessToken ? (
        <Message
          refreshSession={refreshSession}
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
          {authError && !hasDenied && (
            <p className="hint alert">
              Something went wrong signing you in ({authError}). Please try
              again.
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
          <button className="btn btn-primary" type="button" onClick={beginAuth}>
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
