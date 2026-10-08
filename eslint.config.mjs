import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";

// Browser globals for the Vue 3 storefront scripts in public/vk/js
// (Vue / VueRouter / Chart / etc. come from <script> tags in public/vk/index.html).
const storeScriptGlobals = {
  window: "readonly", document: "readonly", localStorage: "readonly", sessionStorage: "readonly",
  navigator: "readonly", location: "readonly", history: "readonly", event: "readonly",
  fetch: "readonly", URL: "readonly", URLSearchParams: "readonly", Blob: "readonly", FileReader: "readonly",
  Image: "readonly", performance: "readonly", console: "readonly", alert: "readonly", confirm: "readonly",
  requestAnimationFrame: "readonly", cancelAnimationFrame: "readonly",
  setTimeout: "readonly", clearTimeout: "readonly", setInterval: "readonly", clearInterval: "readonly",
  matchMedia: "readonly", innerWidth: "readonly", innerHeight: "readonly", getComputedStyle: "readonly",
  CustomEvent: "readonly", Event: "readonly", MutationObserver: "readonly", ResizeObserver: "readonly",
  IntersectionObserver: "readonly", DOMParser: "readonly", FormData: "readonly", AbortController: "readonly",
  atob: "readonly", btoa: "readonly", crypto: "readonly", indexedDB: "readonly", TextEncoder: "readonly",
  TextDecoder: "readonly", structuredClone: "readonly", queueMicrotask: "readonly", globalThis: "readonly",
  Vue: "readonly", VueRouter: "readonly", Chart: "readonly", JsBarcode: "readonly", qrcode: "readonly",
  L: "readonly", XLSX: "readonly", jspdf: "readonly",
  VK: "readonly", VK_I18N: "readonly", VK_DATA: "readonly", VK_UTIL: "readonly", VK_UI: "readonly",
  VK_SHOP: "readonly", VK_PAGES: "readonly", VK_ADMIN: "readonly", VK_ADMIN_PAGES: "readonly", VK_DB: "readonly",
};

const nodeGlobals = {
  process: "readonly", console: "readonly", __dirname: "readonly", __filename: "readonly",
  Buffer: "readonly", URL: "readonly", URLSearchParams: "readonly",
};

export default defineConfig(
  [
    globalIgnores([
      "node_modules/**", "dist/**", "build/**", "out/**", ".next/**",
      "frontend/**", "public/app/**", "public/vk/data/**",
    ]),

    // Base ESLint recommended rules for every linted file.
    js.configs.recommended,

    // Plain browser scripts of the storefront (no build step, sourceType "script").
    // Legacy, frozen code: only report real errors (no-undef etc.), not style-level
    // unused variables or harmless regex escapes — existing Vue logic is never edited.
    {
      files: ["public/vk/js/**/*.js"],
      languageOptions: {
        sourceType: "script",
        globals: storeScriptGlobals,
      },
      rules: {
        "no-unused-vars": "off",
        "no-useless-escape": "off",
      },
    },

    // Node-side config files.
    {
      files: ["vite.config.js", "eslint.config.mjs"],
      languageOptions: {
        sourceType: "module",
        globals: nodeGlobals,
      },
    },
  ],
);
