const keywords = {};

export const searchForSong = async (keyword, accessToken) => {
  if (!keywords.hasOwnProperty(keyword)) {
    keywords[keyword] = await fetch(
      `https://api.spotify.com/v1/search?q=${keyword}"&type=track`,
      {
        method: "GET",
        mode: "cors",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    ).then((response) => response.json());
    return keywords[keyword];
  } else {
    return await Promise.resolve(keywords[keyword]);
  }
};

export const getUserData = async (accessToken) =>
  await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    mode: "cors",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

export const createEmptyPlaylist = async (
  userId,
  name = "",
  isPublic = true,
  accessToken
) =>
  await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: "POST",
    mode: "cors",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, public: isPublic }),
  });

export const addSongsToPlaylist = async (
  userId,
  playlistId,
  uris,
  accessToken
) =>
  await fetch(
    `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
    {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ uris }),
    }
  );
