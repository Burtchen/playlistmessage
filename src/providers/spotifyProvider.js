// Spotify adapter that implements the common provider interface.
// Wraps the existing services/spotify.js + services/spotifyAuth.js modules.

import {
  addSongsToPlaylist,
  createEmptyPlaylist,
  getUserData,
  searchForSong,
} from "../services/spotify";
import {
  beginAuth,
  clearAuth,
  getAccessToken,
  getStoredAuth,
  handleRedirectCallback,
} from "../services/spotifyAuth";

async function withToken(fn) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("not_signed_in");
  }
  return fn(token);
}

const spotifyProvider = {
  id: "spotify",
  displayName: "Spotify",
  playlistUrlPrefix: "https://open.spotify.com/playlist/",

  isSignedIn() {
    return !!getStoredAuth();
  },

  async beginSignIn() {
    await beginAuth();
  },

  async handleRedirectCallback() {
    try {
      const result = await handleRedirectCallback();
      return { signedIn: !!result };
    } catch (error) {
      return { signedIn: false, error: error.message };
    }
  },

  signOut() {
    clearAuth();
  },

  async refresh() {
    const token = await getAccessToken();
    return !!token;
  },

  async getUser() {
    return withToken(async (token) => {
      const response = await getUserData(token);
      if (!response.ok) {
        throw new Error(`user_fetch_failed:${response.status}`);
      }
      const data = await response.json();
      return { id: data.id, name: data.display_name ?? data.id };
    });
  },

  async searchTracks(keyword) {
    return withToken(async (token) => {
      const data = await searchForSong(keyword, token);
      return { items: data?.tracks?.items ?? [], raw: data };
    });
  },

  async createPlaylist({ title, isPublic }) {
    return withToken(async (token) => {
      const user = await this.getUser();
      const response = await createEmptyPlaylist(
        user.id,
        title,
        isPublic,
        token,
      );
      const data = await response.json();
      return {
        id: data.id,
        url: this.playlistUrlPrefix + data.id,
        ownerId: user.id,
      };
    });
  },

  async addTracks(playlistId, uris, { ownerId } = {}) {
    return withToken(async (token) => {
      const owner = ownerId ?? (await this.getUser()).id;
      const response = await addSongsToPlaylist(owner, playlistId, uris, token);
      const data = await response.json();
      return { ok: !!data?.snapshot_id };
    });
  },
};

export default spotifyProvider;
