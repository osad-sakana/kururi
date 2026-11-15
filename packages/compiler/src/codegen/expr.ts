import type { Expr } from "../syntax/ast"
import { isArray } from "../semantics/types"
import type { Type } from "../semantics/types"

/** 型検査の結果のうち、Python の生成に要るもの。 */
export interface TypeInfo {
  readonly types: ReadonlyMap<Expr, Type>
  /** int → float の変換が要る式 */
  readonly widened: ReadonlySet<Expr>
}

/** boolean は true / false と表示する（Python の True / False のままにしない）。 */
function showBoolean(code: string): string {
  return `"true" if ${code} else "false"`
}

/** 式を Python のコードにする。括弧はソースのとおりに残す。 */
export function emitExpr(expr: Expr, info: TypeInfo): string {
  const code = emitRaw(expr, info)
  if (!info.widened.has(expr)) return code
  return expr.kind === "int" ? `${code}.0` : `float(${code})`
}

function emitRaw(expr: Expr, info: TypeInfo): string {
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
      return `(${emitExpr(expr.inner, info)})`
    case "unary":
      return expr.op === "not" ? `not ${emitExpr(expr.operand, info)}` : `-${emitExpr(expr.operand, info)}`
    case "binary":
      return `${emitExpr(expr.left, info)} ${expr.op} ${emitExpr(expr.right, info)}`
    case "template":
      return emitTemplate(expr, info)
    case "array":
      return `[${expr.elements.map((e) => emitExpr(e, info)).join(", ")}]`
    case "index":
      return `${emitExpr(expr.target, info)}[${emitExpr(expr.index, info)}]`
    case "member":
      return isLength(expr, info) ? `len(${emitExpr(expr.object, info)})` : `${emitExpr(expr.object, info)}.${expr.name}`
    case "self":
      return "self"
    case "new":
      return `${expr.className}(${expr.args.map((a) => emitExpr(a, info)).join(", ")})`
    case "call":
      return emitCall(expr, info)
  }
}

/** 文字列として表示するときの Python コード（括弧なし）。 */
function emitShown(expr: Expr, info: TypeInfo): string {
  const code = emitExpr(expr, info)
  return info.types.get(expr) === "boolean" ? showBoolean(code) : code
}

/** 配列・文字列の .length か（クラスのフィールド名が length のときは違う）。 */
function isLength(expr: Extract<Expr, { kind: "member" }>, info: TypeInfo): boolean {
  const type = info.types.get(expr.object)
  return expr.name === "length" && type !== undefined && (type === "string" || isArray(type))
}

function emitMethodCall(expr: Extract<Expr, { kind: "call" }>, callee: Extract<Expr, { kind: "member" }>, info: TypeInfo): string {
  const object = emitExpr(callee.object, info)
  const objectType = info.types.get(callee.object)
  if (objectType === undefined || !isArray(objectType)) {
    return `${object}.${callee.name}(${expr.args.map((a) => emitExpr(a, info)).join(", ")})`
  }
  const [arg] = expr.args
  if (arg === undefined) return ""
  if (callee.name === "removeAt") return `${object}.pop(${emitExpr(arg, info)})`
  return `${object}.append(${emitExpr(arg, info)})`
}

function emitCall(expr: Extract<Expr, { kind: "call" }>, info: TypeInfo): string {
  if (expr.callee.kind === "member") return emitMethodCall(expr, expr.callee, info)
  const name = expr.callee.kind === "ident" ? expr.callee.name : ""
  const arg = expr.args[0]
  if (name !== "output" && name !== "toString") {
    return `${name}(${expr.args.map((a) => emitExpr(a, info)).join(", ")})`
  }
  if (arg === undefined) return ""
  if (name === "output") return `print(${emitShown(arg, info)})`
  const type = info.types.get(arg)
  if (type === "string") return emitExpr(arg, info)
  if (type === "boolean") return `(${showBoolean(emitExpr(arg, info))})`
  return `str(${emitExpr(arg, info)})`
}

function escapeText(text: string): string {
  return JSON.stringify(text).slice(1, -1).replaceAll("{", "{{").replaceAll("}", "}}")
}

function emitTemplate(expr: Extract<Expr, { kind: "template" }>, info: TypeInfo): string {
  if (expr.parts.every((part) => part.kind === "text")) {
    return JSON.stringify(expr.parts.map((part) => (part.kind === "text" ? part.value : "")).join(""))
  }
  const body = expr.parts
    .map((part) => {
      if (part.kind === "text") return escapeText(part.value)
      const code = emitExpr(part.expr, info)
      return info.types.get(part.expr) === "boolean" ? `{(${showBoolean(code)})}` : `{${code}}`
    })
    .join("")
  return `f"${body}"`
}
