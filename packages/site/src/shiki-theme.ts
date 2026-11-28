import type { Palette } from "./playground/palette"
import { DARK_PALETTE, LIGHT_PALETTE } from "./playground/palette"

/**
 * コードブロック（Shiki）のテーマ。プレイグラウンドのエディタと同じパレットで、同じ種類の語を同じ色にする。
 * 対応は playground/theme.ts の Monaco の rules と同じ：
 *   keyword → codeKeyword、string → codeString、number・constant → codeNumber、comment → codeComment、
 *   type → codeBuiltin、predefined（print など）→ codeFunc、それ以外 → code
 */
export function kururiShikiTheme(name: string, type: "light" | "dark", c: Palette) {
  const color = (scopes: string[], foreground: string, fontStyle?: string) => ({
    scope: scopes,
    settings: fontStyle === undefined ? { foreground } : { foreground, fontStyle },
  })
  return {
    name,
    type,
    fg: c.code,
    bg: c.editor,
    settings: [
      color(["comment", "comment.line", "comment.block"], c.codeComment, "italic"),
      color(["string", "string.quoted.double", "constant.character.escape"], c.codeString),
      color(["constant.numeric", "constant.language"], c.codeNumber),
      color(["keyword", "keyword.control", "keyword.operator.word", "storage.type", "storage.type.function", "storage.type.class", "storage.modifier", "variable.language"], c.codeKeyword),
      color(["support.type"], c.codeBuiltin),
      color(["support.function", "support.function.builtin"], c.codeFunc),
      color(["entity.name.function", "entity.name.class"], c.code),
      color(["punctuation.section.embedded", "meta.interpolation"], c.muted),
    ],
  }
}

export const KURURI_SHIKI_THEMES = {
  light: kururiShikiTheme("kururi-light", "light", LIGHT_PALETTE),
  dark: kururiShikiTheme("kururi-dark", "dark", DARK_PALETTE),
}
