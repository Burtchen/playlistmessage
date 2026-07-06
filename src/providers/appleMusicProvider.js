// Apple Music provider via MusicKit JS v3.
// https://developer.apple.com/documentation/musickitjs
//
// Requires a developer JWT in VITE_APPLE_MUSIC_DEV_TOKEN (build-time).
// User grants access via a popup — MusicKit handles the user token itself.

const DEV_TOKEN = import.meta.env.VITE_APPLE_MUSIC_DEV_TOKEN;
const MUSICKIT_SRC = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";

let musicKitPromise = null;

function loadMusicKit() {
  if (!DEV_TOKEN) {
    return Promise.reject(new Error("missing_dev_token"));
  }
  if (musicKitPromise) {
    return musicKitPromise;
  }
  musicKitPromise = new Promise((resolve, reject) => {
    document.addEventListener("musickitloaded", async () => {
      try {
        await window.MusicKit.configure({
          developerToken: DEV_TOKEN,
          app: { name: "PlaylistMessage", build: "1.0.0" },
        });
        resolve(window.MusicKit.getInstance());
      } catch (error) {
        reject(error);
      }
    });
    const script = document.createElement("script");
    script.src = MUSICKIT_SRC;
    script.async = true;
    script.onerror = () => reject(new Error("musickit_load_failed"));
    document.head.appendChild(script);
  });
  return musicKitPromise;
}

async function instance() {
  return loadMusicKit();
}

async function apiFetch(path, { method = "GET", body } = {}) {
  const music = await instance();
  const url = `https://api.music.apple.com${path}`;
  const headers = {
    Authorization: `Bearer ${DEV_TOKEN}`,
    "Music-User-Token": music.musicUserToken,
  };
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`apple_api_${response.status}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

const appleMusicProvider = {
  id: "appleMusic",
  displayName: "Apple Music",
  playlistUrlPrefix: "https://music.apple.com/library/playlist/",

  isSignedIn() {
    return !!window.MusicKit?.getInstance?.().isAuthorized;
  },

  async beginSignIn() {
    const music = await instance();
    await music.authorize();
  },

  async handleRedirectCallback() {
    // MusicKit uses a popup, not a redirect. Nothing to handle on load.
    if (!DEV_TOKEN) {
      return { signedIn: false };
    }
    try {
      const music = await instance();
      return { signedIn: !!music.isAuthorized };
    } catch (error) {
      return { signedIn: false, error: error.message };
    }
  },

  signOut() {
    if (window.MusicKit) {
      try {
        window.MusicKit.getInstance().unauthorize();
      } catch {
        // ignore
      }
    }
  },

  async refresh() {
    const music = await instance();
    return !!music.isAuthorized;
  },

  async getUser() {
    const music = await instance();
    const storefront = music.storefrontId ?? "us";
    return { id: storefront, name: `Apple Music (${storefront})` };
  },

  async searchTracks(keyword) {
    const music = await instance();
    const storefront = music.storefrontId ?? "us";
    const data = await apiFetch(
      `/v1/catalog/${storefront}/search?types=songs&limit=25&term=${encodeURIComponent(keyword)}`,
    );
    const songs = data?.results?.songs?.data ?? [];
    const items = songs.map((song) => ({
      uri: song.id,
      name: song.attributes?.name ?? "",
      artists: [{ name: song.attributes?.artistName ?? "" }],
      popularity: undefined,
      available_markets: undefined,
    }));
    return { items, raw: data };
  },

  async createPlaylist({ title }) {
    const data = await apiFetch("/v1/me/library/playlists", {
      method: "POST",
      body: {
        attributes: { name: title, description: "Made with PlaylistMessage" },
      },
    });
    const id = data?.data?.[0]?.id;
    return {
      id,
      url: this.playlistUrlPrefix + id,
    };
  },

  async addTracks(playlistId, uris) {
    await apiFetch(`/v1/me/library/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: {
        data: uris.map((id) => ({ id, type: "songs" })),
      },
    });
    return { ok: true };
  },
};

export default appleMusicProvider;
