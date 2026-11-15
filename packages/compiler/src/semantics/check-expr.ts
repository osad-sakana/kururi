import type { Reporter } from "../reporter"
import type { Expr } from "../syntax/ast"
import type { Scope } from "./scope"
import { PLANNED_BUILTINS } from "./scope"
import { isNumeric } from "./types"
import type { Type } from "./types"

const ARITHMETIC: ReadonlySet<string> = new Set(["-", "*", "%"])
const ORDERING: ReadonlySet<string> = new Set(["<", "<=", ">", ">="])

/** 式の型を調べる。調べた型は types に記録する（Python 生成が使う）。 */
export class ExprChecker {
  readonly types = new Map<Expr, Type>()

  constructor(private readonly reporter: Reporter) {}

  /** 値として使う式の型。値を返さない呼び出し（output など）は、ここでエラーにする。 */
  valueType(expr: Expr, scope: Scope): Type {
    const type = this.typeOf(expr, scope)
    if (type !== "void") return type
    this.reporter.report("K0304", expr.range, { name: calleeName(expr) })
    this.types.set(expr, "error")
    return "error"
  }

  typeOf(expr: Expr, scope: Scope): Type {
    const type = this.compute(expr, scope)
    this.types.set(expr, type)
    return type
  }

  private compute(expr: Expr, scope: Scope): Type {
    switch (expr.kind) {
      case "int":
        return "int"
      case "float":
        return "float"
      case "string":
        return "string"
      case "bool":
        return "boolean"
      case "template":
        for (const part of expr.parts) {
          if (part.kind === "expr") this.valueType(part.expr, scope)
        }
        return "string"
      case "ident":
        return this.identType(expr.name, expr, scope)
      case "paren":
        return this.typeOf(expr.inner, scope)
      case "unary":
        return this.unaryType(expr, scope)
      case "binary":
        return this.binaryType(expr, scope)
      case "call":
        return this.callType(expr, scope)
    }
  }

  private identType(name: string, expr: Expr, scope: Scope): Type {
    const local = scope.locals.get(name)
    if (local !== undefined) return local
    const global = scope.globals.get(name)
    if (global?.kind === "variable") {
      if (scope.visibleBefore !== undefined && global.order >= scope.visibleBefore) {
        this.reporter.report("K0203", expr.range, { name })
        return "error"
      }
      return global.type
    }
    if (global?.kind === "function" || isBuiltin(name)) {
      this.reporter.report("K0309", expr.range, { name })
      return "error"
    }
    this.reporter.report("K0201", expr.range, { name })
    return "error"
  }

  private unaryType(expr: Extract<Expr, { kind: "unary" }>, scope: Scope): Type {
    const operand = this.valueType(expr.operand, scope)
    if (operand === "error") return "error"
    const ok = expr.op === "not" ? operand === "boolean" : isNumeric(operand)
    if (ok) return operand
    this.reporter.report("K0303", expr.range, { op: expr.op, left: operand })
    return "error"
  }

  private binaryType(expr: Extract<Expr, { kind: "binary" }>, scope: Scope): Type {
    const left = this.valueType(expr.left, scope)
    const right = this.valueType(expr.right, scope)
    if (left === "error" || right === "error") return "error"
    const result = binaryResult(expr.op, left, right)
    if (result !== undefined) return result
    if (expr.op === "+" && (left === "string") !== (right === "string")) {
      const [number, numberType] = left === "string" ? [expr.right, right] : [expr.left, left]
      if (isNumeric(numberType)) {
        this.reporter.report("K0302", number.range, { actual: numberType })
        return "error"
      }
    }
    this.reporter.report("K0303", expr.range, { op: expr.op, left, right })
    return "error"
  }

  private callType(expr: Extract<Expr, { kind: "call" }>, scope: Scope): Type {
    const callee = expr.callee
    if (callee.kind !== "ident") {
      this.reporter.report("K0308", callee.range, { name: "この式" })
      return "error"
    }
    const name = callee.name
    const global = scope.globals.get(name)
    if (scope.locals.has(name) || global?.kind === "variable") {
      this.reporter.report("K0308", callee.range, { name })
      return "error"
    }
    if (name === "output" || name === "toString") return this.builtinCall(name, expr, scope)
    if (PLANNED_BUILTINS.has(name)) {
      this.reporter.report("K0002", callee.range, { text: `${name}()` })
      return "error"
    }
    if (global?.kind === "function") {
      if (name === "main") this.reporter.report("K0205", expr.range)
      return "error"
    }
    this.reporter.report("K0201", callee.range, { name })
    return "error"
  }

  private builtinCall(name: "output" | "toString", expr: Extract<Expr, { kind: "call" }>, scope: Scope): Type {
    const argTypes = expr.args.map((arg) => this.valueType(arg, scope))
    if (expr.args.length !== 1) {
      this.reporter.report("K0305", expr.range, { name, expected: "1", actual: String(expr.args.length) })
      return "error"
    }
    if (argTypes[0] === "error") return "error"
    return name === "output" ? "void" : "string"
  }
}

function isBuiltin(name: string): boolean {
  return name === "output" || name === "toString" || PLANNED_BUILTINS.has(name)
}

function calleeName(expr: Expr): string {
  return expr.kind === "call" && expr.callee.kind === "ident" ? expr.callee.name : "この式"
}

/** 二項演算の結果の型。その組み合わせが使えなければ undefined。 */
function binaryResult(op: string, left: Type, right: Type): Type | undefined {
  const bothNumeric = isNumeric(left) && isNumeric(right)
  const widest: Type = left === "float" || right === "float" ? "float" : "int"
  if (op === "and" || op === "or") return left === "boolean" && right === "boolean" ? "boolean" : undefined
  if (op === "==" || op === "!=") return bothNumeric || left === right ? "boolean" : undefined
  if (ORDERING.has(op)) return bothNumeric || (left === "string" && right === "string") ? "boolean" : undefined
  if (op === "+") return left === "string" && right === "string" ? "string" : bothNumeric ? widest : undefined
  if (op === "/") return bothNumeric ? "float" : undefined
  if (ARITHMETIC.has(op)) return bothNumeric ? widest : undefined
  return undefined
}
