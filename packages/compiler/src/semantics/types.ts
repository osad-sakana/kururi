/**
 * Kururi の型。配列は "int[]" のように文字列で表す（入れ子は "int[][]"）。
 * "[]" は、型がまだ決まっていない空の配列リテラル。
 * "error" は、すでに診断を出した式の型（連鎖してエラーを出さないための印）。
 */
export type Type = "int" | "float" | "string" | "boolean" | "void" | "error" | `${string}[]`

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

/** value の型の値を、declared の型の場所に入れられるか（int → float と、空の配列だけ特別扱い）。 */
export function isAssignable(declared: Type, value: Type): boolean {
  if (declared === value || (declared === "float" && value === "int")) return true
  return value === EMPTY_ARRAY && isArray(declared)
}

/** メッセージに出す型の名前。 */
export function typeLabel(type: Type): string {
  return type === EMPTY_ARRAY ? "空の配列" : type
}
