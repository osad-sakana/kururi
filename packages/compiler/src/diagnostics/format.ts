import { displayWidth } from "./width"
import type { Diagnostic } from "./types"

export interface FormatContext {
  readonly source: string
  readonly fileName: string
}

const TAB_AS_SPACES = "    "

/** 1 件の診断を、位置・抜粋・下線・ヒントつきの文字列にする。 */
export function formatDiagnostic(diagnostic: Diagnostic, context: FormatContext): string {
  const { span } = diagnostic
  const lineNumber = span.start.line
  const rawLine = context.source.split(/\r?\n/)[lineNumber - 1] ?? ""
  const chars = Array.from(rawLine)

  const startIndex = span.start.column - 1
  const endIndex = span.end.line === lineNumber ? span.end.column - 1 : chars.length
  const expand = (part: readonly string[]): string => part.join("").replaceAll("\t", TAB_AS_SPACES)

  const indent = displayWidth(expand(chars.slice(0, startIndex)))
  const covered = displayWidth(expand(chars.slice(startIndex, Math.max(endIndex, startIndex))))
  const carets = "^".repeat(Math.max(covered, 1))

  const gutterWidth = String(lineNumber).length
  const blank = `${" ".repeat(gutterWidth + 1)}|`

  const lines = [
    `${diagnostic.severity}[${diagnostic.code}]: ${diagnostic.message}`,
    `${" ".repeat(gutterWidth)}--> ${context.fileName}:${lineNumber}:${span.start.column}`,
    blank,
    `${lineNumber} | ${expand(chars)}`,
    `${blank} ${" ".repeat(indent)}${carets}${diagnostic.label === undefined ? "" : ` ${diagnostic.label}`}`,
  ]
  if (diagnostic.hint !== undefined) {
    lines.push(blank, `help: ${diagnostic.hint}`)
  }
  return lines.join("\n")
}

/** 複数の診断を空行でつなぎ、末尾に件数を付ける。診断がなければ空文字。 */
export function formatDiagnostics(diagnostics: readonly Diagnostic[], context: FormatContext): string {
  if (diagnostics.length === 0) return ""
  const errors = diagnostics.filter((d) => d.severity === "error").length
  const warnings = diagnostics.length - errors
  const counts = [
    ...(errors > 0 ? [`エラー ${errors} 件`] : []),
    ...(warnings > 0 ? [`警告 ${warnings} 件`] : []),
  ].join("、")
  return [...diagnostics.map((d) => formatDiagnostic(d, context)), counts].join("\n\n")
}
