import { compile } from "@kururi/compiler"
import type { Diagnostic, Position } from "@kururi/compiler"
import { buildProjectUrl, projectFiles } from "@kururi/narapy"

/** Monaco の setModelMarkers に渡す形（行・列は 1 始まり、end は含まない）。 */
export interface EditorMarker {
  readonly startLineNumber: number
  readonly startColumn: number
  readonly endLineNumber: number
  readonly endColumn: number
  readonly message: string
  readonly severity: "error" | "warning"
  readonly code: string
}

export interface Analysis {
  readonly python: string
  readonly markers: readonly EditorMarker[]
  readonly errorCount: number
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

function toMarker(diagnostic: Diagnostic, lines: readonly string[]): EditorMarker {
  const { start, end } = diagnostic.span
  const startColumn = utf16Column(lines, start)
  const endColumn = utf16Column(lines, end)
  const message = [diagnostic.message, diagnostic.hint].filter((part) => part !== undefined && part !== "").join("\n")
  return {
    startLineNumber: start.line,
    startColumn,
    endLineNumber: end.line,
    // 幅のない範囲は、1 文字ぶん下線を引いて見えるようにする
    endColumn: end.line === start.line && endColumn <= startColumn ? startColumn + 1 : endColumn,
    message,
    severity: diagnostic.severity,
    code: diagnostic.code,
  }
}

/** ソースを変換し、エディタに出す印と Python をまとめて返す。 */
export function analyze(source: string): Analysis {
  const { python, diagnostics } = compile(source)
  const lines = source.split("\n")
  const markers = diagnostics.map((diagnostic) => toMarker(diagnostic, lines))
  return { python, markers, errorCount: diagnostics.filter((d) => d.severity === "error").length }
}

/** narapy で開く URL。エラーがあるときや内容が空のときは null。長すぎるときは例外。 */
export function narapyUrl(source: string, analysis: Analysis, baseUrl?: string): string | null {
  if (analysis.errorCount > 0 || analysis.python === "") return null
  const files = projectFiles({ python: analysis.python, kururi: source })
  return buildProjectUrl(files, baseUrl === undefined ? {} : { baseUrl })
}

/** 入力のたびに走らせないよう、最後の呼び出しから一定時間おいて 1 回だけ実行する。 */
export function debounce<A extends readonly unknown[]>(fn: (...args: A) => void, waitMs: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args) => {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), waitMs)
  }
}
