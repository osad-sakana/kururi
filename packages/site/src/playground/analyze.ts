import { compile, diagnosticText, formatDiagnostics, toEditorRange } from "@kururi/compiler"
import type { Diagnostic, Fix, LineMapping } from "@kururi/compiler"
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
  /** 1 クリックで直せるときの直し方 */
  readonly fix?: Fix
}

export interface Analysis {
  readonly python: string
  readonly lineMap: readonly LineMapping[]
  /** 変換できないときに Python 欄へ出す、エラーの文章 */
  readonly errorText: string
  readonly markers: readonly EditorMarker[]
  readonly errorCount: number
}

function toMarker(diagnostic: Diagnostic, lines: readonly string[]): EditorMarker {
  const range = toEditorRange(diagnostic, lines)
  return {
    startLineNumber: range.startLine,
    startColumn: range.startColumn,
    endLineNumber: range.endLine,
    endColumn: range.endColumn,
    message: diagnosticText(diagnostic),
    severity: diagnostic.severity,
    code: diagnostic.code,
    ...(diagnostic.fix === undefined ? {} : { fix: diagnostic.fix }),
  }
}

/** ソースを変換し、エディタに出す印と Python をまとめて返す。 */
export function analyze(source: string): Analysis {
  const { python, diagnostics, lineMap } = compile(source, { warnings: true })
  const lines = source.split("\n")
  const markers = diagnostics.map((diagnostic) => toMarker(diagnostic, lines))
  const errorText = diagnostics.length === 0 ? "" : formatDiagnostics(diagnostics, { source, fileName: "main.kururi" })
  return { python, lineMap, errorText, markers, errorCount: diagnostics.filter((d) => d.severity === "error").length }
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
