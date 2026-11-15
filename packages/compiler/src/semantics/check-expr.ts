import type { Reporter } from "../reporter"
import type { Expr } from "../syntax/ast"
import type { Range } from "../syntax/tokens"
import type { Scope } from "./scope"
import { PLANNED_BUILTINS } from "./scope"
import { EMPTY_ARRAY, elementType, isArray, isAssignable, isNumeric, typeLabel } from "./types"
import type { Type } from "./types"

type Node<K extends Expr["kind"]> = Extract<Expr, { kind: K }>

const ARITHMETIC: ReadonlySet<string> = new Set(["-", "*", "%"])
const ORDERING: ReadonlySet<string> = new Set(["<", "<=", ">", ">="])

/** 式の型を調べる。調べた型は types に記録する（Python 生成が使う）。 */
export class ExprChecker {
  readonly types = new Map<Expr, Type>()

  constructor(private readonly reporter: Reporter) {}

  /**
   * 値として使う式の型。値を返さない呼び出し（output など）は、ここでエラーにする。
   * 空の配列 [] は、型が決まる場所（allowEmpty）でだけ使える。
   */
  valueType(expr: Expr, scope: Scope, allowEmpty = false): Type {
    const type = this.typeOf(expr, scope)
    if (type === "void") {
      this.reporter.report("K0304", expr.range, { name: calleeName(expr) })
      return this.fail(expr)
    }
    if (type === EMPTY_ARRAY && !allowEmpty) {
      this.reporter.report("K0314", expr.range)
      return this.fail(expr)
    }
    return type
  }

  /**
   * 値を expected の型の場所に入れられるか調べ、だめなら K0301 を出す。
   * 配列リテラルは要素ごとに調べるので、[1, 2] を float[] に入れられる。
   */
  checkAssignable(expr: Expr, scope: Scope, expected: Type): Type {
    if (expected !== "error" && expr.kind === "array" && isArray(expected)) {
      const element = elementType(expected)
      const results = expr.elements.map((e) => this.checkAssignable(e, scope, element))
      const type = results.includes("error") ? "error" : expected
      this.types.set(expr, type)
      return type
    }
    const actual = this.valueType(expr, scope, true)
    if (expected !== "error" && actual !== "error" && !isAssignable(expected, actual)) {
      this.reporter.report("K0301", expr.range, { expected, actual: typeLabel(actual) })
      return this.fail(expr)
    }
    return actual
  }

  /** 画面に出せる値の型（配列は出せない）。output・toString・補間で使う。 */
  displayType(expr: Expr, scope: Scope): Type {
    const type = this.valueType(expr, scope)
    if (!isArray(type)) return type
    this.reporter.report("K0313", expr.range)
    return this.fail(expr)
  }

  typeOf(expr: Expr, scope: Scope): Type {
    const type = this.compute(expr, scope)
    this.types.set(expr, type)
    return type
  }

  private fail(expr: Expr): Type {
    this.types.set(expr, "error")
    return "error"
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
          if (part.kind === "expr") this.displayType(part.expr, scope)
        }
        return "string"
      case "ident":
        return this.identType(expr.name, expr, scope)
      case "paren":
        return this.typeOf(expr.inner, scope)
      case "unary":
        return this.unaryType(expr, scope)
      case "binary":
        return this.combine(
          expr.op,
          this.valueType(expr.left, scope),
          this.valueType(expr.right, scope),
          expr.left,
          expr.right,
          expr.range,
        )
      case "array":
        return this.arrayType(expr, scope)
      case "index":
        return this.indexType(expr, scope)
      case "member":
        return this.memberType(expr, scope)
      case "call":
        return this.callType(expr, scope)
    }
  }

  private identType(name: string, expr: Expr, scope: Scope): Type {
    const local = scope.locals.get(name)
    if (local !== undefined) return local.type
    const global = scope.globals.get(name)
    if (global?.kind === "variable") {
      if (scope.visibleBefore !== undefined && global.order >= scope.visibleBefore) {
        this.reporter.report("K0203", expr.range, { name })
        return "error"
      }
      if (scope.visibleBefore !== undefined && global.mutable) {
        this.reporter.report("K0206", expr.range, { name })
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

  private unaryType(expr: Node<"unary">, scope: Scope): Type {
    const operand = this.valueType(expr.operand, scope)
    if (operand === "error") return "error"
    const ok = expr.op === "not" ? operand === "boolean" : isNumeric(operand)
    if (ok) return operand
    this.reporter.report("K0303", expr.range, { op: expr.op, left: operand })
    return "error"
  }

  /** 二項演算（複合代入の展開後も含む）の型。使えない組み合わせなら診断を出して "error"。 */
  combine(op: string, left: Type, right: Type, leftExpr: Expr, rightExpr: Expr, range: Range): Type {
    if (left === "error" || right === "error") return "error"
    const result = binaryResult(op, left, right)
    if (result !== undefined) return result
    if (op === "+" && (left === "string") !== (right === "string")) {
      const [number, numberType] = left === "string" ? [rightExpr, right] : [leftExpr, left]
      if (isNumeric(numberType)) {
        this.reporter.report("K0302", number.range, { actual: numberType })
        return "error"
      }
    }
    this.reporter.report("K0303", range, { op, left: typeLabel(left), right: typeLabel(right) })
    return "error"
  }

  private arrayType(expr: Node<"array">, scope: Scope): Type {
    const types = expr.elements.map((element) => this.valueType(element, scope))
    if (types.includes("error")) return "error"
    const [first] = types
    if (first === undefined) return EMPTY_ARRAY
    // int と float が混ざっていれば float の配列にする
    let common: Type = first
    for (const [i, type] of types.entries()) {
      if (type === common) continue
      if (isNumeric(type) && isNumeric(common)) {
        common = "float"
        continue
      }
      this.reporter.report("K0301", expr.elements[i]?.range ?? expr.range, { expected: common, actual: type })
      return "error"
    }
    return `${common}[]`
  }

  private indexType(expr: Node<"index">, scope: Scope): Type {
    const base = this.valueType(expr.target, scope)
    this.checkIndex(expr.index, scope)
    if (base === "error") return "error"
    if (base === "string") return "string"
    if (isArray(base)) return elementType(base)
    this.reporter.report("K0319", expr.target.range, { type: base })
    return "error"
  }

  /** 添字は int で、負の数のリテラルは書けない。位置の引数（removeAt）でも使う。 */
  checkIndex(index: Expr, scope: Scope, what = "添字"): void {
    const type = this.valueType(index, scope)
    if (type !== "error" && type !== "int") {
      this.reporter.report("K0306", index.range, { what, expected: "int", actual: type })
    } else if (index.kind === "unary" && index.op === "-" && index.operand.kind === "int") {
      this.reporter.report("K0315", index.range)
    }
  }

  /** .length（メソッドの呼び出しは callType が扱う）。 */
  private memberType(expr: Node<"member">, scope: Scope): Type {
    const base = this.valueType(expr.object, scope)
    if (base === "error") return "error"
    if (expr.name === "length" && (base === "string" || isArray(base))) return "int"
    this.reporter.report("K0317", expr.nameRange, { type: base, name: expr.name })
    return "error"
  }

  private callType(expr: Node<"call">, scope: Scope): Type {
    const callee = expr.callee
    if (callee.kind === "member") return this.methodCall(expr, callee, scope)
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

  private builtinCall(name: "output" | "toString", expr: Node<"call">, scope: Scope): Type {
    const argTypes = expr.args.map((arg) => this.displayType(arg, scope))
    if (expr.args.length !== 1) {
      this.reporter.report("K0305", expr.range, { name, expected: "1", actual: String(expr.args.length) })
      return "error"
    }
    if (argTypes[0] === "error") return "error"
    return name === "output" ? "void" : "string"
  }

  /** a.push(x) と a.removeAt(i)。 */
  private methodCall(expr: Node<"call">, callee: Node<"member">, scope: Scope): Type {
    const base = this.valueType(callee.object, scope)
    if (base === "error") {
      expr.args.forEach((arg) => this.valueType(arg, scope, true))
      return "error"
    }
    const method = callee.name
    if (!isArray(base) || (method !== "push" && method !== "removeAt")) {
      this.reporter.report("K0317", callee.nameRange, { type: base, name: method })
      return "error"
    }
    const [arg] = expr.args
    if (arg === undefined || expr.args.length !== 1) {
      expr.args.forEach((a) => this.valueType(a, scope, true))
      this.reporter.report("K0305", expr.range, { name: method, expected: "1", actual: String(expr.args.length) })
      return "error"
    }
    if (method === "removeAt") {
      this.checkIndex(arg, scope, "位置")
      return "void"
    }
    this.checkAssignable(arg, scope, elementType(base))
    return "void"
  }
}

function isBuiltin(name: string): boolean {
  return name === "output" || name === "toString" || PLANNED_BUILTINS.has(name)
}

function calleeName(expr: Expr): string {
  if (expr.kind !== "call") return "この式"
  if (expr.callee.kind === "ident") return expr.callee.name
  return expr.callee.kind === "member" ? expr.callee.name : "この式"
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
