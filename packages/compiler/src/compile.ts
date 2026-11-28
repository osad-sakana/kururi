import { emitPython } from "./codegen/python"
import type { Diagnostic } from "./diagnostics"
import { Reporter } from "./reporter"
import { check } from "./semantics/check"
import { lint } from "./semantics/lint"
import { lex } from "./syntax/lexer"
import { parse } from "./syntax/parser"

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
 * 字句・構文の診断があるときは、名前や型の検査には進まない（読み取れていない部分のせいで
 * 余計なエラーが連鎖するのを避けるため）。エラーが 1 件でもあれば python は空になる（警告だけなら作る）。
 */
export interface CompileOptions {
  /** true なら、使っていない変数などの警告も返す（警告があっても python は作る） */
  readonly warnings?: boolean
}

export function compile(source: string, options: CompileOptions = {}): CompileResult {
  const lexed = lex(source)
  const parsed = parse(lexed.tokens, source)
  const syntaxDiagnostics = [...lexed.diagnostics, ...parsed.diagnostics]
  if (syntaxDiagnostics.length > 0) return result("", syntaxDiagnostics, [])

  const reporter = new Reporter(source)
  const { types, safeIndexes, globalWrites } = check(parsed.program, reporter)
  if (reporter.count > 0) return result("", reporter.list(), [])

  const warnings = new Reporter(source)
  if (options.warnings === true) lint(parsed.program, warnings, types)
  const output = emitPython(parsed.program, { types, safeIndexes }, globalWrites, source)
  return result(output.python, warnings.list(), output.lineMap)
}

function result(
  python: string,
  diagnostics: readonly Diagnostic[],
  lineMap: CompileResult["lineMap"],
): CompileResult {
  const sorted = [...diagnostics].sort((a, b) => a.span.start.offset - b.span.start.offset)
  return Object.freeze({
    python,
    diagnostics: Object.freeze(sorted),
    lineMap: Object.freeze([...lineMap]),
  })
}
