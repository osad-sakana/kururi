import type { Diagnostic, Position } from "./types"

/** エディタ向けの範囲（行・列は 1 始まり、end は含まない。列は UTF-16 単位）。 */
export interface EditorRange {
  readonly startLine: number
  readonly startColumn: number
  readonly endLine: number
  readonly endColumn: number
}

/** 診断の列は文字（コードポイント）単位。エディタは UTF-16 単位なので、その行の中で数え直す。 */
function utf16Column(lines: readonly string[], position: Position): number {
  const line = lines[position.line - 1] ?? ""
  let units = 0
  let points = 0
  for (const char of line) {
    if (points >= position.column - 1) break
    units += char.length
    points += 1
  }
  return units + 1
}

/** 診断の範囲をエディタの座標にする。幅のない範囲は、1 文字ぶんに広げて見えるようにする。 */
export function toEditorRange(diagnostic: Diagnostic, lines: readonly string[]): EditorRange {
  const { start, end } = diagnostic.span
  const startColumn = utf16Column(lines, start)
  const endColumn = utf16Column(lines, end)
  return {
    startLine: start.line,
    startColumn,
    endLine: end.line,
    endColumn: end.line === start.line && endColumn <= startColumn ? startColumn + 1 : endColumn,
  }
}

/** 診断のメッセージと直し方を 1 つの文字列にする。 */
export function diagnosticText(diagnostic: Diagnostic): string {
  return [diagnostic.message, diagnostic.hint].filter((part) => part !== undefined && part !== "").join("\n")
}
