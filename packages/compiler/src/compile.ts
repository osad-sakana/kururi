import { createDiagnostic, positionAt } from "./diagnostics"
import type { Diagnostic } from "./diagnostics"

/** Kururi の行と、生成した Python の行の対応（並べて表示するための表）。 */
export interface LineMapping {
  readonly kururiLine: number
  readonly pythonLine: number
}

export interface CompileResult {
  readonly python: string
  readonly diagnostics: readonly Diagnostic[]
  readonly lineMap: readonly LineMapping[]
}

/**
 * Kururi のソースを Python に変換する。
 * ファイルや DOM には触れない純粋な関数。
 *
 * S0 時点では空のソースだけを扱い、それ以外は「未対応」の診断を返す。
 */
export function compile(source: string): CompileResult {
  const firstNonSpace = source.search(/\S/)
  if (firstNonSpace === -1) {
    return result("", [])
  }

  const text = /^\S+/.exec(source.slice(firstNonSpace))?.[0] ?? ""
  const end = firstNonSpace + Math.max(text.length, 1)
  const diagnostic = createDiagnostic(
    "K0001",
    { start: positionAt(source, firstNonSpace), end: positionAt(source, end) },
    { text },
  )
  return result("", [diagnostic])
}

function result(python: string, diagnostics: readonly Diagnostic[]): CompileResult {
  return Object.freeze({
    python,
    diagnostics: Object.freeze([...diagnostics]),
    lineMap: Object.freeze([]),
  })
}
