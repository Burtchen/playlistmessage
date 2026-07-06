// Spotify Authorization Code + PKCE (public client, no secret).
// https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SCOPE = "playlist-modify-public playlist-modify-private";
const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const STORAGE_KEY = "playlistmessage.spotify.auth";

function base64UrlEncode(bytes) {
  let str = "";
  for (const b of bytes) {
    str += String.fromCharCode(b);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(length = 64) {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function sha256(input) {
  const data = new TextEncoder().encode(input);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function loadAuth() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAuth(auth) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  window.localStorage.removeItem(STORAGE_KEY);
}

function redirectUri() {
  return window.location.origin + window.location.pathname;
}

export async function beginAuth() {
  const codeVerifier = randomString(64);
  const codeChallenge = await sha256(codeVerifier);
  const state = randomString(16);

  window.sessionStorage.setItem(
    "pkce",
    JSON.stringify({ codeVerifier, state }),
  );

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPE,
    redirect_uri: redirectUri(),
    state,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  window.location = `${AUTH_URL}?${params.toString()}`;
}

// Called on load. If the URL contains a code from Spotify, exchange it.
// Returns the fresh auth object on success, or null if there's nothing to do.
export async function handleRedirectCallback() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (!code && !error) {
    return null;
  }

  const stashed = JSON.parse(window.sessionStorage.getItem("pkce") ?? "null");
  window.sessionStorage.removeItem("pkce");

  // Always clean the URL so a refresh doesn't retry the exchange.
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, "", cleanUrl);

  if (error) {
    throw new Error(error);
  }
  if (!stashed || stashed.state !== returnedState) {
    throw new Error("state_mismatch");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
    client_id: CLIENT_ID,
    code_verifier: stashed.codeVerifier,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error(`token_exchange_failed:${response.status}`);
  }
  const data = await response.json();
  const auth = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  saveAuth(auth);
  return auth;
}

async function refresh(existing) {
  if (!existing?.refreshToken) {
    return null;
  }
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: existing.refreshToken,
    client_id: CLIENT_ID,
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    clearAuth();
    return null;
  }
  const data = await response.json();
  const auth = {
    accessToken: data.access_token,
    // Spotify may or may not return a new refresh token; keep the old one otherwise.
    refreshToken: data.refresh_token ?? existing.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  saveAuth(auth);
  return auth;
}

// Returns a valid access token, refreshing if needed. Null if the user is not signed in.
export async function getAccessToken() {
  const auth = loadAuth();
  if (!auth) {
    return null;
  }
  // Refresh a minute before expiry.
  if (Date.now() >= auth.expiresAt - 60_000) {
    const refreshed = await refresh(auth);
    return refreshed?.accessToken ?? null;
  }
  return auth.accessToken;
}

export function getStoredAuth() {
  return loadAuth();
}
