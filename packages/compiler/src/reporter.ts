import { createDiagnostic, positionAt } from "./diagnostics"
import type { Diagnostic, DiagnosticCode, Fix } from "./diagnostics"
import type { Range } from "./syntax/tokens"

/** 診断をためておく入れ物。各段階が同じソースに対する診断を集める。 */
export class Reporter {
  private readonly items: Diagnostic[] = []

  constructor(private readonly source: string) {}

  report(code: DiagnosticCode, range: Range, params: Readonly<Record<string, string>> = {}, fix?: Fix): void {
    const span = {
      start: positionAt(this.source, range.start),
      end: positionAt(this.source, Math.max(range.end, range.start + 1)),
    }
    this.items.push(createDiagnostic(code, span, params, fix))
  }

  get count(): number {
    return this.items.length
  }

  list(): readonly Diagnostic[] {
    return [...this.items]
  }
}
