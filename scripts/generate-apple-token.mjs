#!/usr/bin/env node
// Generates an Apple Music developer JWT to use as VITE_APPLE_MUSIC_DEV_TOKEN.
//
// Requires:
//   - Node >= 18
//   - jsonwebtoken (npm i -D jsonwebtoken)
//   - .env.local with APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY_PATH
//     (the .p8 file MUST stay outside the repo).
//
// Usage:
//   node scripts/generate-apple-token.mjs
//   # or via npm run apple-token
//
// The printed JWT lasts up to 180 days; copy it into .env.local as
// VITE_APPLE_MUSIC_DEV_TOKEN=... and rebuild.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import jwt from "jsonwebtoken";

function envOr(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing env var: ${name}`);
    process.exit(1);
  }
  return value;
}

// Poor-man's .env.local loader — enough for a local script.
try {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"|"$/g, "");
    }
  }
} catch {
  // ignore if no .env.local
}

const teamId = envOr("APPLE_TEAM_ID");
const keyId = envOr("APPLE_KEY_ID");
const keyPath = resolve(envOr("APPLE_PRIVATE_KEY_PATH"));
const privateKey = readFileSync(keyPath, "utf8");

const now = Math.floor(Date.now() / 1000);
const sixMonths = 60 * 60 * 24 * 180;

const token = jwt.sign({}, privateKey, {
  algorithm: "ES256",
  header: { alg: "ES256", kid: keyId },
  issuer: teamId,
  expiresIn: sixMonths,
  notBefore: 0,
});

// Print raw token so it can be piped into a file or copied.
process.stdout.write(token + "\n");
process.stderr.write(
  `\nGenerated. Expires at ${new Date((now + sixMonths) * 1000).toISOString()}\n`,
);
