import type { Type } from "./types"

export type Symbol =
  | { readonly kind: "variable"; readonly type: Type; readonly order: number; readonly mutable: boolean }
  | { readonly kind: "function"; readonly name: string }

export interface Local {
  readonly type: Type
  /** let / const / ループ（repeat・foreach）の変数（代入できない） */
  readonly kind: "let" | "const" | "loop"
}

/** 名前の表。トップレベルの名前と、今チェックしている関数のローカル変数を持つ。 */
export interface Scope {
  readonly globals: ReadonlyMap<string, Symbol>
  readonly locals: ReadonlyMap<string, Local>
  /** この番号より前に宣言されたトップレベルの変数だけ使える。関数の中では制限なし（undefined）。 */
  readonly visibleBefore: number | undefined
}

/** まだ対応していない組み込み関数 */
export const PLANNED_BUILTINS: ReadonlySet<string> = new Set(["input", "toInt", "toFloat", "div", "random"])
