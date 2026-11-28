import type { Reporter } from "../reporter"
import type { Expr, Stmt } from "../syntax/ast"
import { childrenOf } from "./walk"

/** 組み込みの関数のうち、呼んでも値が変わらないもの（条件の中に書いてよいもの）。 */
const PURE_BUILTINS: ReadonlySet<string> = new Set(["to_string", "to_int", "to_float", "div"])
/** 呼んでも、変数を書き換えない組み込みの関数。 */
const HARMLESS_BUILTINS: ReadonlySet<string> = new Set(["print", "input", "to_string", "to_int", "to_float", "div", "random"])

function bodiesOf(stmt: Stmt): readonly (readonly Stmt[])[] {
  switch (stmt.kind) {
    case "if":
      return [...stmt.branches.map((branch) => branch.body), ...(stmt.otherwise === undefined ? [] : [stmt.otherwise])]
    case "while":
    case "times":
    case "foreach":
      return [stmt.body]
    default:
      return []
  }
}

/** 文の中の式（直下だけ。入れ子のブロックは含まない）。 */
function exprsOf(stmt: Stmt): readonly Expr[] {
  switch (stmt.kind) {
    case "var":
      return [stmt.init]
    case "exprStmt":
      return [stmt.expr]
    case "assign":
      return [stmt.target, stmt.value]
    case "if":
      return stmt.branches.map((branch) => branch.condition)
    case "while":
      return [stmt.condition]
    case "times":
      return [stmt.count]
    case "foreach":
      return [stmt.iterable]
    case "return":
      return stmt.value === undefined ? [] : [stmt.value]
    default:
      return []
  }
}

/** 式の中の名前（self も 1 つの名前として数える）。 */
function readNames(expr: Expr, names: Set<string>): void {
  if (expr.kind === "ident") names.add(expr.name)
  else if (expr.kind === "self") names.add("self")
  // 呼び出しの関数の名前（f(x) の f）は、値を読んでいるわけではない
  const children = expr.kind === "call" && expr.callee.kind === "ident" ? expr.args : childrenOf(expr)
  children.forEach((child) => readNames(child, names))
}

/** a、a[i]、a.b.c、a.run() の、いちばん元の名前（a）。 */
function rootName(expr: Expr): string | undefined {
  switch (expr.kind) {
    case "ident":
      return expr.name
    case "self":
      return "self"
    case "paren":
      return rootName(expr.inner)
    case "index":
      return rootName(expr.target)
    case "member":
      return rootName(expr.object)
    default:
      return undefined
  }
}

/** この繰り返しの本体から、繰り返しを抜ける break があるか（入れ子の繰り返しの break は数えない）。return は、どこにあっても出口になる。 */
function hasExit(stmts: readonly Stmt[], insideNested = false): boolean {
  return stmts.some((stmt) => {
    if (stmt.kind === "return") return true
    if (stmt.kind === "break" && !insideNested) return true
    const nested = insideNested || stmt.kind === "while" || stmt.kind === "times" || stmt.kind === "foreach"
    return bodiesOf(stmt).some((body) => hasExit(body, nested))
  })
}

interface Effects {
  /** 書き換えられるかもしれない名前 */
  readonly modified: Set<string>
  /** 自作の関数・new を呼んでいる（グローバルの変数やフィールドが変わるかもしれない） */
  opaque: boolean
}

function collectEffects(stmts: readonly Stmt[], effects: Effects): void {
  const visit = (expr: Expr): void => {
    if (expr.kind === "new") effects.opaque = true
    if (expr.kind === "call") {
      const callee = expr.callee
      const harmless = callee.kind === "ident" && HARMLESS_BUILTINS.has(callee.name)
      if (callee.kind === "ident" && !harmless) effects.opaque = true
      if (!harmless) {
        // 呼び出した先で、渡した値や、メソッドを呼んだ相手が書き換わるかもしれない
        const receiver = callee.kind === "member" ? rootName(callee.object) : undefined
        if (receiver !== undefined) effects.modified.add(receiver)
        for (const arg of expr.args) {
          const name = rootName(arg)
          if (name !== undefined) effects.modified.add(name)
        }
      }
    }
    childrenOf(expr).forEach(visit)
  }
  for (const stmt of stmts) {
    if (stmt.kind === "assign") {
      const name = rootName(stmt.target)
      if (name !== undefined) effects.modified.add(name)
    }
    exprsOf(stmt).forEach(visit)
    bodiesOf(stmt).forEach((body) => collectEffects(body, effects))
  }
}

/** 条件に、呼ぶたびに値が変わるかもしれない関数（input、random、自作の関数）があるか。 */
function hasOpaqueCall(expr: Expr): boolean {
  if (expr.kind === "call" && expr.callee.kind === "ident" && !PURE_BUILTINS.has(expr.callee.name)) return true
  return childrenOf(expr).some(hasOpaqueCall)
}

function isTrueLiteral(expr: Expr): boolean {
  return expr.kind === "bool" ? expr.value : expr.kind === "paren" && isTrueLiteral(expr.inner)
}

/**
 * 終わらない繰り返しを、コードの形から見つけて警告する（判定できる範囲だけ。見逃しはあるが、誤って警告しないほうを選ぶ）。
 *   K0605  while true なのに、break も return もない
 *   K0606  条件の中の値が、繰り返しの中で変わらない（break も return もない）
 * globalVars は、トップレベルの var の名前（自作の関数が書き換えるかもしれないもの）。
 */
export function lintLoops(stmts: readonly Stmt[], reporter: Reporter, globalVars: ReadonlySet<string>): void {
  for (const stmt of stmts) {
    if (stmt.kind === "while" && !hasExit(stmt.body)) lintWhile(stmt, reporter, globalVars)
    bodiesOf(stmt).forEach((body) => lintLoops(body, reporter, globalVars))
  }
}

function lintWhile(stmt: Extract<Stmt, { kind: "while" }>, reporter: Reporter, globalVars: ReadonlySet<string>): void {
  if (isTrueLiteral(stmt.condition)) {
    reporter.report("K0605", stmt.condition.range)
    return
  }
  if (hasOpaqueCall(stmt.condition)) return
  const reads = new Set<string>()
  readNames(stmt.condition, reads)
  const effects: Effects = { modified: new Set(), opaque: false }
  collectEffects(stmt.body, effects)
  const changes = [...reads].some((name) => effects.modified.has(name) || (effects.opaque && (globalVars.has(name) || name === "self")))
  if (changes) return
  reporter.report("K0606", stmt.condition.range, { names: [...reads].join("、") })
}
