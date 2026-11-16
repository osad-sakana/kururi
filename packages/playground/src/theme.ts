import * as monaco from "monaco-editor/esm/vs/editor/editor.api"
import { PALETTES, bareHex, type Palette, type ResolvedTheme } from "./palette"

const THEME_NAMES: Readonly<Record<ResolvedTheme, string>> = { dark: "kururi-dark", light: "kururi-light" }
const DARK_QUERY = "(prefers-color-scheme: dark)"

function themeData(theme: ResolvedTheme, c: Palette): monaco.editor.IStandaloneThemeData {
  return {
    base: theme === "dark" ? "vs-dark" : "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: bareHex(c, "codeKeyword") },
      { token: "string", foreground: bareHex(c, "codeString") },
      { token: "number", foreground: bareHex(c, "codeNumber") },
      { token: "comment", foreground: bareHex(c, "codeComment"), fontStyle: "italic" },
      { token: "identifier", foreground: bareHex(c, "code") },
      { token: "delimiter", foreground: bareHex(c, "muted") },
      { token: "type", foreground: bareHex(c, "codeBuiltin") },
      { token: "predefined", foreground: bareHex(c, "codeFunc") },
      { token: "constant", foreground: bareHex(c, "codeNumber") },
    ],
    colors: {
      "editor.background": c.editor,
      "editor.foreground": c.code,
      "editor.lineHighlightBackground": c.panel,
      "editor.selectionBackground": `${c.accent}3d`,
      "editor.inactiveSelectionBackground": `${c.accent}1f`,
      "editorLineNumber.foreground": c.codeComment,
      "editorLineNumber.activeForeground": c.ink,
      "editorCursor.foreground": c.accent,
      "editorIndentGuide.background1": c.line,
      "editorIndentGuide.activeBackground1": c.muted,
      "scrollbarSlider.background": `${c.line}80`,
      "scrollbarSlider.hoverBackground": c.muted,
      "editorWidget.background": c.panel,
      "editorWidget.border": c.line,
      "editorWidget.foreground": c.ink,
      "descriptionForeground": c.muted,
      "list.hoverBackground": c.hover,
      "list.hoverForeground": c.ink,
    },
  }
}

export function currentTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light"
}

/** 両方のテーマを登録し、OS の明暗に合わせて切り替える。 */
export function installThemes(): void {
  for (const theme of ["dark", "light"] as const) monaco.editor.defineTheme(THEME_NAMES[theme], themeData(theme, PALETTES[theme]))
  const apply = () => monaco.editor.setTheme(THEME_NAMES[currentTheme()])
  apply()
  window.matchMedia(DARK_QUERY).addEventListener("change", apply)
}

