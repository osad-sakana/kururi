/**
 * Kururi の型。配列は "int[]" のように文字列で表す（入れ子は "int[][]"）。
 * "[]" は、型がまだ決まっていない空の配列リテラル。
 * "error" は、すでに診断を出した式の型（連鎖してエラーを出さないための印）。
 */
export type Type = "int" | "float" | "string" | "boolean" | "null" | "error" | `${string}[]` | (string & {})

export const VALUE_TYPE_NAMES: ReadonlySet<string> = new Set(["int", "float", "string", "boolean"])
export const EMPTY_ARRAY: Type = "[]"

export function isNumeric(type: Type): boolean {
  return type === "int" || type === "float"
}

export function isArray(type: Type): boolean {
  return type.endsWith("[]")
}

/** 配列の要素の型（"int[][]" → "int[]"）。 */
export function elementType(type: Type): Type {
  return type.slice(0, -2) as Type
}

/** value の型の値を、declared の型の場所に入れられるか。同じ型か、null → T?、空の配列 → 配列だけ（int → float などの暗黙の変換はない）。 */
export function isAssignable(declared: Type, value: Type): boolean {
  if (declared === value) return true
  if (isNullable(declared)) return value === NULL_TYPE || isAssignable(nonNull(declared), value)
  return value === EMPTY_ARRAY && isArray(declared)
}

/** メッセージに出す型の名前。 */
export function typeLabel(type: Type): string {
  return type === EMPTY_ARRAY ? "空の配列" : type
}

const NON_CLASS_TYPES: ReadonlySet<string> = new Set(["int", "float", "string", "boolean", "error", "null"])

/** クラスのオブジェクトの型か（配列と組み込みの型以外）。 */
export function isClassType(type: Type): boolean {
  return !isArray(type) && !isNullable(type) && !NON_CLASS_TYPES.has(type)
}

/** null の型。null リテラルと、値を返さない関数の呼び出しがこの型を持つ。 */
export const NULL_TYPE: Type = "null"

/** T? の型か（"int?"、"string[]?"）。"string?[]" は配列なので違う。 */
export function isNullable(type: Type): boolean {
  return type.endsWith("?")
}

/** T? から T を取り出す。T? でなければそのまま。 */
export function nonNull(type: Type): Type {
  return isNullable(type) ? (type.slice(0, -1) as Type) : type
}
