import spotifyProvider from "./spotifyProvider";
import appleMusicProvider from "./appleMusicProvider";

export const PROVIDERS = [spotifyProvider, appleMusicProvider];

export function getProvider(id) {
  return PROVIDERS.find((p) => p.id === id) ?? null;
}
