// Simple re-export from firebase.client
// Nuxt requires a default plugin export when the file lives in /plugins, even if
// we just want to expose helpers. We provide a no-op plugin and still re-export
// everything from firebase.client so existing imports keep working.

import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin(() => {
  // firebase.client.ts registers the actual Firebase app; nothing to do here.
});

export * from "./firebase.client";
