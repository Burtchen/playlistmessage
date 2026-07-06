// Tidal adapter using @tidal-music/auth (public client, PKCE) + Tidal OpenAPI v2.
// https://tidal-music.github.io/tidal-sdk-web/
//
// Requires:
//   - VITE_TIDAL_CLIENT_ID  (from https://developer.tidal.com)
//   - App registered with a redirect URI EXACTLY matching window.location.origin + "/"
//   - HTTPS local dev (Vite basicSsl plugin handles this)

import {
  credentialsProvider,
  finalizeLogin,
  init,
  initializeLogin,
  logout,
} from "@tidal-music/auth";

const CLIENT_ID = import.meta.env.VITE_TIDAL_CLIENT_ID;
const STORAGE_KEY = "playlistmessage.tidal";
// Scopes accepted by Tidal's public API for search + playlist management.
const SCOPES = ["playlists.read", "playlists.write", "user.read"];
const API_BASE = "https://openapi.tidal.com/v2";

let initPromise = null;

function ensureInit() {
  if (!CLIENT_ID) {
    return Promise.reject(new Error("missing_tidal_client_id"));
  }
  if (!initPromise) {
    initPromise = init({
      clientId: CLIENT_ID,
      credentialsStorageKey: STORAGE_KEY,
      scopes: SCOPES,
    });
  }
  return initPromise;
}

function redirectUri() {
  return window.location.origin + window.location.pathname;
}

async function bearer() {
  const creds = await credentialsProvider.getCredentials();
  if (!creds?.token) {
    throw new Error("not_signed_in");
  }
  return creds.token;
}

async function apiFetch(path, { method = "GET", body, params } = {}) {
  const token = await bearer();
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    }
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.api+json",
  };
  if (body) {
    headers["Content-Type"] = "application/vnd.api+json";
  }
  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`tidal_api_${response.status}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

const tidalProvider = {
  id: "tidal",
  displayName: "Tidal",
  brandIcon: "fa-music",
  playlistUrlPrefix: "https://tidal.com/browse/playlist/",

  isSignedIn() {
    // Best-effort synchronous check — we don't know until getCredentials resolves.
    // Return true if we have a persisted key, false otherwise.
    return !!window.localStorage.getItem(STORAGE_KEY);
  },

  async beginSignIn() {
    await ensureInit();
    const url = await initializeLogin({ redirectUri: redirectUri() });
    window.location = url;
  },

  async handleRedirectCallback() {
    if (!CLIENT_ID) {
      return { signedIn: false };
    }
    await ensureInit();
    const query = window.location.search;
    if (!query.includes("code=") && !query.includes("error=")) {
      // Nothing to finalize; if we already have creds, we're signed in.
      try {
        const creds = await credentialsProvider.getCredentials();
        return { signedIn: !!creds?.token };
      } catch {
        return { signedIn: false };
      }
    }
    try {
      await finalizeLogin(query);
      // Clean the URL so a refresh doesn't retry.
      const clean = window.location.origin + window.location.pathname;
      window.history.replaceState({}, "", clean);
      return { signedIn: true };
    } catch (error) {
      const clean = window.location.origin + window.location.pathname;
      window.history.replaceState({}, "", clean);
      return { signedIn: false, error: error?.message ?? "tidal_login_failed" };
    }
  },

  signOut() {
    logout().catch(() => {});
  },

  async refresh() {
    try {
      const creds = await credentialsProvider.getCredentials();
      return !!creds?.token;
    } catch {
      return false;
    }
  },

  async getUser() {
    // /v2/users/me returns the authenticated user.
    const data = await apiFetch("/users/me");
    const id = data?.data?.id ?? "me";
    return { id, name: data?.data?.attributes?.username ?? id };
  },

  async searchTracks(keyword) {
    // Tidal v2 search: /searchResults/{query}/relationships/tracks
    // We need `include=tracks,tracks.artists` to get full track + artist
    // objects back in `included`.
    const encoded = encodeURIComponent(keyword);
    const data = await apiFetch(
      `/searchResults/${encoded}/relationships/tracks`,
      {
        params: {
          include: "tracks,tracks.artists",
          "page[limit]": 25,
          countryCode: "US",
        },
      },
    );

    const included = data?.included ?? [];
    const trackById = new Map();
    const artistById = new Map();
    for (const entry of included) {
      if (entry.type === "tracks") {
        trackById.set(entry.id, entry);
      } else if (entry.type === "artists") {
        artistById.set(entry.id, entry);
      }
    }

    // Preserve the ordering from `data` (relevance-ranked).
    const order = data?.data ?? [];
    const items = order
      .map((ref) => trackById.get(ref.id))
      .filter(Boolean)
      .map((track) => {
        const artistRefs = track.relationships?.artists?.data ?? [];
        const artistNames = artistRefs
          .map((a) => artistById.get(a.id)?.attributes?.name)
          .filter(Boolean);
        return {
          uri: track.id,
          name: track.attributes?.title ?? "",
          artists: artistNames.length
            ? artistNames.map((name) => ({ name }))
            : [{ name: "" }],
          popularity: track.attributes?.popularity,
          available_markets: undefined,
        };
      });

    return { items, raw: data };
  },

  async createPlaylist({ title, isPublic }) {
    const data = await apiFetch("/playlists", {
      method: "POST",
      body: {
        data: {
          type: "playlists",
          attributes: {
            name: title,
            description: "Made with PlaylistMessage",
            // Tidal's v2 API only exposes PUBLIC / UNLISTED — there is no
            // fully-private playlist type. UNLISTED is our closest analogue.
            accessType: isPublic ? "PUBLIC" : "UNLISTED",
          },
        },
      },
    });
    const id = data?.data?.id;
    return {
      id,
      url: this.playlistUrlPrefix + id,
    };
  },

  async addTracks(playlistId, uris) {
    await apiFetch(`/playlists/${playlistId}/relationships/items`, {
      method: "POST",
      body: {
        data: uris.map((id) => ({ id, type: "tracks" })),
      },
    });
    return { ok: true };
  },
};

export default tidalProvider;
