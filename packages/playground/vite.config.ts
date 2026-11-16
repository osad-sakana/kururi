import { defineConfig } from "vite"

// input() の入力待ち（SharedArrayBuffer）に必要なヘッダー。公開先では coi-serviceworker.js が代わりに付ける
const isolation = { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" }

export default defineConfig({ base: "./", server: { headers: isolation }, preview: { headers: isolation } })
