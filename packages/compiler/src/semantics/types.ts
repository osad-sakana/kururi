/** Kururi の型。"error" は、すでに診断を出した式の型（連鎖してエラーを出さないための印）。 */
export type Type = "int" | "float" | "string" | "boolean" | "void" | "error"

export const VALUE_TYPE_NAMES: ReadonlySet<string> = new Set(["int", "float", "string", "boolean"])

export function isNumeric(type: Type): boolean {
  return type === "int" || type === "float"
}

/** value の型の値を、declared の型の場所に入れられるか（int → float だけ暗黙変換できる）。 */
export function isAssignable(declared: Type, value: Type): boolean {
  return declared === value || (declared === "float" && value === "int")
}
