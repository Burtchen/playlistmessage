import spotifyProvider from "./spotifyProvider";
import tidalProvider from "./tidalProvider";
// Apple Music is disabled until we have an Apple Developer team with MusicKit access.
// import appleMusicProvider from "./appleMusicProvider";

export const PROVIDERS = [spotifyProvider, tidalProvider];

export function getProvider(id) {
  return PROVIDERS.find((p) => p.id === id) ?? null;
}
