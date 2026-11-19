import type { Type } from "./types"

/** 組み込みのメソッド 1 つぶん：引数の型、戻り値の型、Python での書き方。 */
export interface MethodSpec {
  readonly params: readonly Type[]
  readonly returns: Type
  /** obj は対象のコード、args は引数のコード（どちらも括弧つきで安全に使える形） */
  readonly python: (obj: string, args: readonly string[]) => string
}

/** string のメソッド。文字列は変更できないので、どれも新しい値を返す。 */
export const STRING_METHODS: Readonly<Record<string, MethodSpec>> = {
  upper: { params: [], returns: "string", python: (obj) => `${obj}.upper()` },
  lower: { params: [], returns: "string", python: (obj) => `${obj}.lower()` },
  trim: { params: [], returns: "string", python: (obj) => `${obj}.strip()` },
  contains: { params: ["string"], returns: "boolean", python: (obj, [a]) => `(${a} in ${obj})` },
  starts_with: { params: ["string"], returns: "boolean", python: (obj, [a]) => `${obj}.startswith(${a})` },
  ends_with: { params: ["string"], returns: "boolean", python: (obj, [a]) => `${obj}.endswith(${a})` },
  index_of: { params: ["string"], returns: "int", python: (obj, [a]) => `${obj}.find(${a})` },
  replace: { params: ["string", "string"], returns: "string", python: (obj, [a, b]) => `${obj}.replace(${a}, ${b})` },
  split: { params: ["string"], returns: "string[]", python: (obj, [a]) => `${obj}.split(${a})` },
}

/** 配列のメソッド（push / remove_at は別に扱う）。要素の型は検査のときに決まる。 */
export const ARRAY_EXTRA_METHODS: ReadonlySet<string> = new Set(["contains", "join"])
