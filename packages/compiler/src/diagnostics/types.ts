export type Severity = "error" | "warning"

/** ソース上の位置。行・列は 1 始まり。列は文字（コードポイント）で数える。 */
export interface Position {
  readonly offset: number
  readonly line: number
  readonly column: number
}

export interface Span {
  readonly start: Position
  readonly end: Position
}

export interface Diagnostic {
  readonly code: string
  readonly severity: Severity
  readonly message: string
  readonly span: Span
  /** 下線の横に出す短い説明 */
  readonly label?: string
  /** 直し方の案内 */
  readonly hint?: string
}
