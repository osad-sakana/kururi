import type { Type } from "./types"

export interface FieldInfo {
  readonly type: Type
  readonly access: "public" | "private"
  readonly hasInit: boolean
}

export interface MethodInfo {
  readonly params: readonly Type[]
  readonly returnType: Type
  readonly access: "public" | "private"
}

/** クラスの形。登録の途中で中身を足していくので、Map は作る側だけが書き換える。 */
export interface ClassInfo {
  readonly name: string
  /** クラスの宣言が始まる位置。これより前では使えない（本体の中は使える）。 */
  readonly start: number
  readonly fields: Map<string, FieldInfo>
  readonly methods: Map<string, MethodInfo>
  ctorParams: readonly Type[]
}

export type Symbol =
  | { readonly kind: "class"; readonly info: ClassInfo }
  | { readonly kind: "variable"; readonly type: Type; readonly order: number; readonly mutable: boolean }
  | {
      readonly kind: "function"
      readonly name: string
      readonly params: readonly Type[]
      readonly returnType: Type
    }

export interface Local {
  readonly type: Type
  /** let / const / ループ（repeat・foreach）の変数（代入できない） */
  readonly kind: "let" | "const" | "loop"
  /** 0 以上と分かっている整数（for i n times の i）。添字の検査を省ける */
  readonly nonNegative?: boolean
}

/** 名前の表。トップレベルの名前と、今チェックしている関数のローカル変数を持つ。 */
export interface Scope {
  readonly globals: ReadonlyMap<string, Symbol>
  readonly locals: ReadonlyMap<string, Local>
  /** この番号より前に宣言されたトップレベルの変数だけ使える。関数の中では制限なし（undefined）。 */
  readonly visibleBefore: number | undefined
  /** 今チェックしているクラス（クラスの外では undefined） */
  readonly cls?: ClassInfo | undefined
  /** いま null でないと分かっているローカル変数・引数（T? を T として使える） */
  readonly narrowed?: ReadonlySet<string> | undefined
}

/** 組み込み関数の名前（print と to_string は表示できる値なら何でも受ける特別な関数）。 */
export const BUILTIN_FUNCTIONS: ReadonlySet<string> = new Set(["print", "to_string", "input", "to_int", "to_float", "div", "random"])
