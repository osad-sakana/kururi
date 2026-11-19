import type { Expr } from "../syntax/ast"
import { STRING_METHODS } from "../semantics/builtin-methods"
import { isArray, isNullable } from "../semantics/types"
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
    case "null":
      return "None"
    case "ident":
      return expr.name
    case "paren":
      return `(${emitExpr(expr.inner, info)})`
    case "unary":
      return expr.op === "not" ? `not ${emitExpr(expr.operand, info)}` : `-${emitExpr(expr.operand, info)}`
    case "binary":
      return emitBinary(expr, info)
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

/** null との比較は is None / is not None にする。 */
function emitBinary(expr: Extract<Expr, { kind: "binary" }>, info: TypeInfo): string {
  if ((expr.op === "==" || expr.op === "!=") && (expr.left.kind === "null" || expr.right.kind === "null")) {
    const value = expr.left.kind === "null" ? expr.right : expr.left
    return `${atom(value, info)} ${expr.op === "==" ? "is" : "is not"} None`
  }
  return `${emitExpr(expr.left, info)} ${expr.op} ${emitExpr(expr.right, info)}`
}

function isShownByHelper(expr: Expr, info: TypeInfo): boolean {
  const type = info.types.get(expr)
  return type === "null" || (type !== undefined && isNullable(type))
}

/** 文字列として表示するときの Python コード（括弧なし）。boolean と T? は true / false / null と表示する。 */
function emitShown(expr: Expr, info: TypeInfo): string {
  const code = emitExpr(expr, info)
  if (isShownByHelper(expr, info)) return `__kururi_show(${code})`
  return info.types.get(expr) === "boolean" ? showBoolean(code) : code
}

/** 演算の途中に入れるとき、括弧が要る式なら括弧を付ける。 */
function atom(expr: Expr, info: TypeInfo): string {
  const code = emitExpr(expr, info)
  return expr.kind === "binary" || expr.kind === "unary" ? `(${code})` : code
}

function emitConvert(name: string, args: readonly Expr[], info: TypeInfo): string {
  const [a, b] = args
  if (name === "input") return "input()"
  if (a === undefined) return ""
  if (name === "to_int") return `int(${emitExpr(a, info)})`
  if (name === "to_float") return `float(${emitExpr(a, info)})`
  if (b === undefined) return ""
  if (name === "div") return `(${atom(a, info)} // ${atom(b, info)})`
  return `random.randint(${emitExpr(a, info)}, ${emitExpr(b, info)})`
}

/** 配列・文字列の .length か（クラスのフィールド名が length のときは違う）。 */
function isLength(expr: Extract<Expr, { kind: "member" }>, info: TypeInfo): boolean {
  const type = info.types.get(expr.object)
  return expr.name === "length" && type !== undefined && (type === "string" || isArray(type))
}

function emitMethodCall(expr: Extract<Expr, { kind: "call" }>, callee: Extract<Expr, { kind: "member" }>, info: TypeInfo): string {
  const object = emitExpr(callee.object, info)
  const objectType = info.types.get(callee.object)
  const args = expr.args.map((a) => emitExpr(a, info))
  const stringMethod = objectType === "string" ? STRING_METHODS[callee.name] : undefined
  if (stringMethod !== undefined) return stringMethod.python(object, args)
  if (objectType !== undefined && isArray(objectType) && callee.name === "contains") return `(${args[0] ?? ""} in ${object})`
  if (objectType === "string[]" && callee.name === "join") return `${args[0] ?? ""}.join(${object})`
  if (objectType === undefined || !isArray(objectType)) {
    return `${object}.${callee.name}(${expr.args.map((a) => emitExpr(a, info)).join(", ")})`
  }
  const [arg] = expr.args
  if (arg === undefined) return ""
  if (callee.name === "remove_at") return `${object}.pop(${emitExpr(arg, info)})`
  return `${object}.append(${emitExpr(arg, info)})`
}

function emitCall(expr: Extract<Expr, { kind: "call" }>, info: TypeInfo): string {
  if (expr.callee.kind === "member") return emitMethodCall(expr, expr.callee, info)
  const name = expr.callee.kind === "ident" ? expr.callee.name : ""
  const arg = expr.args[0]
  if (["input", "to_int", "to_float", "div", "random"].includes(name)) return emitConvert(name, expr.args, info)
  if (name !== "print" && name !== "to_string") {
    return `${name}(${expr.args.map((a) => emitExpr(a, info)).join(", ")})`
  }
  if (arg === undefined) return ""
  if (name === "print") return `print(${emitShown(arg, info)})`
  const type = info.types.get(arg)
  if (isShownByHelper(arg, info)) return `__kururi_show(${emitExpr(arg, info)})`
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
      if (isShownByHelper(part.expr, info)) return `{__kururi_show(${code})}`
      return info.types.get(part.expr) === "boolean" ? `{(${showBoolean(code)})}` : `{${code}}`
    })
    .join("")
  return `f"${body}"`
}
