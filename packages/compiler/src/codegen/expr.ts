import type { Expr } from "../syntax/ast"
import type { Type } from "../semantics/types"

export type TypeTable = ReadonlyMap<Expr, Type>

/** boolean は true / false と表示する（Python の True / False のままにしない）。 */
function showBoolean(code: string): string {
  return `"true" if ${code} else "false"`
}

/** 式を Python のコードにする。括弧はソースのとおりに残す。 */
export function emitExpr(expr: Expr, types: TypeTable): string {
  switch (expr.kind) {
    case "int":
    case "float":
      return expr.text
    case "string":
      return JSON.stringify(expr.value)
    case "bool":
      return expr.value ? "True" : "False"
    case "ident":
      return expr.name
    case "paren":
      return `(${emitExpr(expr.inner, types)})`
    case "unary":
      return expr.op === "not" ? `not ${emitExpr(expr.operand, types)}` : `-${emitExpr(expr.operand, types)}`
    case "binary":
      return `${emitExpr(expr.left, types)} ${expr.op} ${emitExpr(expr.right, types)}`
    case "template":
      return emitTemplate(expr, types)
    case "call":
      return emitCall(expr, types)
  }
}

/** 値を target の型の場所に入れるコード。int を float に入れるときは、Python では自動で変わらないので変換する。 */
export function emitCoerced(expr: Expr, target: Type | undefined, types: TypeTable): string {
  const code = emitExpr(expr, types)
  if (target !== "float" || types.get(expr) !== "int") return code
  return expr.kind === "int" ? `${code}.0` : `float(${code})`
}

/** 文字列として表示するときの Python コード（括弧なし）。 */
function emitShown(expr: Expr, types: TypeTable): string {
  const code = emitExpr(expr, types)
  return types.get(expr) === "boolean" ? showBoolean(code) : code
}

function emitCall(expr: Extract<Expr, { kind: "call" }>, types: TypeTable): string {
  const name = expr.callee.kind === "ident" ? expr.callee.name : ""
  const arg = expr.args[0]
  if (arg === undefined) return ""
  if (name === "output") return `print(${emitShown(arg, types)})`
  const type = types.get(arg)
  if (type === "string") return emitExpr(arg, types)
  if (type === "boolean") return `(${showBoolean(emitExpr(arg, types))})`
  return `str(${emitExpr(arg, types)})`
}

function escapeText(text: string): string {
  return JSON.stringify(text).slice(1, -1).replaceAll("{", "{{").replaceAll("}", "}}")
}

function emitTemplate(expr: Extract<Expr, { kind: "template" }>, types: TypeTable): string {
  if (expr.parts.every((part) => part.kind === "text")) {
    return JSON.stringify(expr.parts.map((part) => (part.kind === "text" ? part.value : "")).join(""))
  }
  const body = expr.parts
    .map((part) => {
      if (part.kind === "text") return escapeText(part.value)
      const code = emitExpr(part.expr, types)
      return types.get(part.expr) === "boolean" ? `{(${showBoolean(code)})}` : `{${code}}`
    })
    .join("")
  return `f"${body}"`
}
