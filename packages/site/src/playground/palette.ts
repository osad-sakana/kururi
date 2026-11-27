// Kururi のカラーパレット（単一の真実）。narapy と同じ構造で、ロゴ（深い青緑の地に、琥珀色の電球）の色にそろえている。
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
  /** ロゴの電球の色（ひらめき・強調） */
  readonly spark: string
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
  canvas: "#051820",
  panel: "#0a2430",
  line: "#174050",
  ink: "#e8f2f5",
  muted: "#8aa6b1",
  hover: "#123240",
  accent: "#fbbf24",
  accentInk: "#1c1300",
  danger: "#f2706d",
  success: "#45b164",
  warn: "#f1944f",
  spark: "#fbbf24",
  editor: "#031219",
  code: "#d5e4ea",
  codeKeyword: "#b9a0f5",
  codeString: "#6dba70",
  codeNumber: "#f1944f",
  codeComment: "#5f7f8c",
  codeBuiltin: "#fbbf24",
  codeFunc: "#5ec8e0",
}

export const LIGHT_PALETTE: Palette = {
  canvas: "#f3f8fa",
  panel: "#ffffff",
  line: "#d3e3e9",
  ink: "#10252d",
  muted: "#587480",
  hover: "#e6f0f3",
  accent: "#0e7490",
  accentInk: "#ffffff",
  danger: "#be222a",
  success: "#00722e",
  warn: "#9a3e00",
  spark: "#d97706",
  editor: "#fafdfe",
  code: "#1f3640",
  codeKeyword: "#6d41a9",
  codeString: "#045e17",
  codeNumber: "#9a3e00",
  codeComment: "#8aa0a9",
  codeBuiltin: "#8a5a00",
  codeFunc: "#0b6179",
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
