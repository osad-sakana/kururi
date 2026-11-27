// Kururi のカラーパレット（単一の真実）。narapy と同じ構造で、アクセントだけ色違いにしている。
// Monaco のテーマ定義は CSS 変数を解釈できず hex を直接要求するため、style.css と同じ値をここにも持つ。
// 両者のずれは palette.test.ts が検査する。キー名は CSS カスタムプロパティ名に対応する（codeKeyword → --color-code-keyword）。
export interface Palette {
  readonly canvas: string
  readonly panel: string
  readonly line: string
  readonly ink: string
  readonly muted: string
  readonly hover: string
  /** 単一アクセント（実行ボタン・カーソル・選択） */
  readonly accent: string
  readonly accentInk: string
  readonly danger: string
  readonly success: string
  readonly warn: string
  readonly editor: string
  readonly code: string
  readonly codeKeyword: string
  readonly codeString: string
  readonly codeNumber: string
  readonly codeComment: string
  readonly codeBuiltin: string
  readonly codeFunc: string
}

export const DARK_PALETTE: Palette = {
  canvas: "#08080a",
  panel: "#151519",
  line: "#33333b",
  ink: "#e6e6ea",
  muted: "#8c8d94",
  hover: "#232329",
  accent: "#a3e635",
  accentInk: "#0d1117",
  danger: "#ed5350",
  success: "#45b164",
  warn: "#f1944f",
  editor: "#000000",
  code: "#d7d8dd",
  codeKeyword: "#b28fef",
  codeString: "#6dba70",
  codeNumber: "#f1944f",
  codeComment: "#6b6c73",
  codeBuiltin: "#b5e655",
  codeFunc: "#d8b349",
}

export const LIGHT_PALETTE: Palette = {
  canvas: "#f6f6f7",
  panel: "#ffffff",
  line: "#e3e3e6",
  ink: "#202124",
  muted: "#75767d",
  hover: "#eef0f2",
  accent: "#4d7c0f",
  accentInk: "#ffffff",
  danger: "#be222a",
  success: "#00722e",
  warn: "#9a3e00",
  editor: "#fbfbfc",
  code: "#2a2b2f",
  codeKeyword: "#6d41a9",
  codeString: "#045e17",
  codeNumber: "#9a3e00",
  codeComment: "#9a9ba1",
  codeBuiltin: "#3f6212",
  codeFunc: "#734e00",
}

export type ResolvedTheme = "light" | "dark"
export const PALETTES: Readonly<Record<ResolvedTheme, Palette>> = { dark: DARK_PALETTE, light: LIGHT_PALETTE }

/** Monaco の rules.foreground は先頭 `#` を受け付けない */
export function bareHex(palette: Palette, key: keyof Palette): string {
  return palette[key].slice(1)
}

export function toCssVarName(key: string): string {
  return `--color-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`
}
