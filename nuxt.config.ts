// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import vuetify from "vite-plugin-vuetify";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const appDir = resolve(__dirname, "app");

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  ssr: false,
  srcDir: "app",
  devtools: { enabled: false },

  app: {
    baseURL: "/",
    buildAssetsDir: "/_nuxt/",
  },

  css: ["@mdi/font/css/materialdesignicons.css", "vuetify/styles"],

  alias: {
    "@": appDir,
    "~": appDir,
  },

  modules: [
    "@nuxt/eslint",
    // Temporarily disable hydration hints spam while migrating to SPA mode
    // "@nuxt/hints",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxt/test-utils",
    "@nuxt/ui",
    "@nuxt/content",
    "@pinia/nuxt",
  ],

  build: {
    transpile: ["vuetify", "@vue/apollo-composable"],
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@/*": ["./app/*"],
          "~/*": ["./app/*"],
        },
      },
    },
  },

  vite: {
    base: "/",
    ssr: {
      noExternal: ["vuetify"],
    },
    optimizeDeps: {
      exclude: ["better-sqlite3"],
    },
    plugins: [
      vuetify({ autoImport: true }),
      VueI18nPlugin({
        include: [resolve(appDir, "./locales/**")],
      }),
    ],
  },
});
