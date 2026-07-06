import React, { useState, useEffect } from "react";
import "./normalize.css";
import "./App.css";

import Header from "./components/Header";
import { Message } from "./components/Message";
import Footer from "./components/Footer";
import { PROVIDERS, getProvider } from "./providers";

const LAST_PROVIDER_KEY = "playlistmessage.lastProvider";

export function App() {
  const [providerId, setProviderId] = useState(
    () => window.localStorage.getItem(LAST_PROVIDER_KEY) ?? "spotify",
  );
  const provider = getProvider(providerId);

  const [signedIn, setSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await provider.handleRedirectCallback();
        if (cancelled) {
          return;
        }
        if (result.error) {
          setAuthError(result.error);
        }
        const isSignedIn =
          result.signedIn || (await provider.refresh().catch(() => false));
        if (!cancelled) {
          setSignedIn(isSignedIn);
          setReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setAuthError(error.message);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  useEffect(() => {
    if (!signedIn) {
      return;
    }
    provider
      .getUser()
      .then((u) => setUser(u))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, providerId]);

  function chooseProvider(id) {
    if (id === providerId) {
      return;
    }
    setProviderId(id);
    window.localStorage.setItem(LAST_PROVIDER_KEY, id);
    setSignedIn(false);
    setUser(null);
    setAuthError(null);
    setReady(false);
  }

  async function refreshSession() {
    const ok = await provider.refresh();
    if (!ok) {
      provider.signOut();
      setSignedIn(false);
      setUser(null);
    }
  }

  const hasPreviousAuth = user !== null;
  const hasDenied = authError === "access_denied";

  if (!ready) {
    return (
      <div>
        <Header />
        <div className="sm_section">
          <p className="hint">Signing you in…</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="sm_section" style={{ paddingBottom: 0 }}>
        <div className="btn-group" role="group" aria-label="Choose provider">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`btn ${p.id === providerId ? "btn-primary" : "btn-secondary"}`}
              onClick={() => chooseProvider(p.id)}
            >
              {p.displayName}
            </button>
          ))}
        </div>
      </div>
      {signedIn ? (
        <Message provider={provider} refreshSession={refreshSession} />
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
              Once more, with feeling! You need to authorize{" "}
              {provider.displayName}, otherwise we can't play(list message).
            </p>
          )}
          {authError && !hasDenied && (
            <p className="hint alert">
              Something went wrong signing you in ({authError}). Please try
              again.
            </p>
          )}
          <p className="hint">
            Say it with a playlist! Just type and we'll find songs matching your
            input. Then, save the playlist in your {provider.displayName}{" "}
            account and share it!
          </p>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => provider.beginSignIn()}
          >
            {`Authorize ${provider.displayName} to Start`}
          </button>
          <p className="hint" style={{ marginTop: "1rem" }}>
            We need your permission to search and create playlists in your
            account. We cannot use your email address or any other information
            you do not grant access to.
          </p>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default App;
