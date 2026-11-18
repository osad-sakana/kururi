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

/** 診断の範囲をこの文字に置き換えれば直る、というときの直し方。 */
export interface Fix {
  /** 「var に直す」のような、ボタンに出す名前 */
  readonly title: string
  /** 範囲に入れる文字 */
  readonly text: string
  /** true なら、同じ名前を使っているほかの所もまとめて直す（名前の変更用） */
  readonly renameAll?: boolean
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
  /** 1 クリックで直せるときの直し方 */
  readonly fix?: Fix
}
