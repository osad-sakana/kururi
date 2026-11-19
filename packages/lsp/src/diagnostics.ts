import { compile, diagnosticText, toEditorRange } from "@kururi/compiler"

/** LSP の診断（行・列は 0 始まり、列は UTF-16。severity は 1 = Error, 2 = Warning）。 */
export interface LspDiagnostic {
  readonly range: {
    readonly start: { readonly line: number; readonly character: number }
    readonly end: { readonly line: number; readonly character: number }
  }
  readonly severity: 1 | 2
  readonly code: string
  readonly source: "kururi"
  readonly message: string
}

/** Kururi のソースを調べ、エディタに出す診断にする。 */
export function toLspDiagnostics(source: string): LspDiagnostic[] {
  const lines = source.split("\n")
  return compile(source, { warnings: true }).diagnostics.map((diagnostic) => {
    const range = toEditorRange(diagnostic, lines)
    return {
      range: {
        start: { line: range.startLine - 1, character: range.startColumn - 1 },
        end: { line: range.endLine - 1, character: range.endColumn - 1 },
      },
      severity: diagnostic.severity === "error" ? 1 : 2,
      code: diagnostic.code,
      source: "kururi",
      message: diagnosticText(diagnostic),
    }
  })
}
