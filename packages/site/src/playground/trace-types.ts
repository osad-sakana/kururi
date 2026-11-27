// ステップ実行で記録する途中経過の型（画面にもワーカーにも依存しない）
export interface TraceStep {
  /** Python の行 */
  readonly line: number
  /** 実行中の関数名（Python 側の名前） */
  readonly fn: string
  /** 変数：[名前, 型, 値] */
  readonly vars: readonly (readonly [string, string, string])[]
  /** この時点までに出た出力の行数 */
  readonly out: number
}

export interface TraceResult {
  readonly steps: readonly TraceStep[]
  /** 記録の上限を超えて、途中までしか残していない */
  readonly truncated: boolean
}
