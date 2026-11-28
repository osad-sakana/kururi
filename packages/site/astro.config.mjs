import { readFileSync } from "node:fs"
import { defineConfig } from "astro/config"

// コードブロックの色付け。Kururi の文法（TextMate 形式）は、サイトの中に置いてある
const kururi = JSON.parse(readFileSync(new URL("./src/kururi.tmLanguage.json", import.meta.url), "utf8"))

// input() の入力待ち（SharedArrayBuffer）に必要なヘッダー。公開先では coi-serviceworker.js が代わりに付ける
const isolation = { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" }

export default defineConfig({
  // 公開先の URL とパス（例: https://example.github.io の /kururi/）は、環境変数で渡す
  ...(process.env.SITE_URL === undefined ? {} : { site: process.env.SITE_URL }),
  base: process.env.SITE_BASE ?? "/",
  trailingSlash: "ignore",
  server: { headers: isolation },
  markdown: { shikiConfig: { langs: [kururi], langAlias: { "kururi-error": "kururi", "kururi-warning": "kururi" }, themes: { light: "github-light", dark: "github-dark" } } },
})
