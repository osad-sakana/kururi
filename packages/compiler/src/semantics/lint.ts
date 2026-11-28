import type { Expr, FunctionDecl, Program, Stmt } from "../syntax/ast"
import type { Reporter } from "../reporter"
import type { Type } from "./types"
import { NULL_TYPE } from "./types"

/** 式の中にある名前を、読むものとして全部集める。 */
function collectReads(expr: Expr, reads: Set<string>): void {
  switch (expr.kind) {
    case "ident":
      reads.add(expr.name)
      return
    case "template":
      for (const part of expr.parts) if (part.kind === "expr") collectReads(part.expr, reads)
      return
    case "unary":
      collectReads(expr.operand, reads)
      return
    case "binary":
      collectReads(expr.left, reads)
      collectReads(expr.right, reads)
      return
    case "paren":
      collectReads(expr.inner, reads)
      return
    case "array":
      expr.elements.forEach((e) => collectReads(e, reads))
      return
    case "index":
      collectReads(expr.target, reads)
      collectReads(expr.index, reads)
      return
    case "member":
      collectReads(expr.object, reads)
      return
    case "new":
      expr.args.forEach((e) => collectReads(e, reads))
      return
    case "call":
      collectReads(expr.callee, reads)
      expr.args.forEach((e) => collectReads(e, reads))
      return
    default:
      return
  }
}

/** 式の直下の部分式。 */
function childrenOf(expr: Expr): readonly Expr[] {
  switch (expr.kind) {
    case "template":
      return expr.parts.flatMap((part) => (part.kind === "expr" ? [part.expr] : []))
    case "unary":
      return [expr.operand]
    case "binary":
      return [expr.left, expr.right]
    case "paren":
      return [expr.inner]
    case "array":
      return expr.elements
    case "index":
      return [expr.target, expr.index]
    case "member":
      return [expr.object]
    case "new":
      return expr.args
    case "call":
      return [expr.callee, ...expr.args]
    default:
      return []
  }
}

function calleeName(expr: Extract<Expr, { kind: "call" }>): string {
  return expr.callee.kind === "ident" || expr.callee.kind === "member" ? expr.callee.name : "この関数"
}

/** 値として使われている式を調べる。値を返さない関数（null になる呼び出し）の値を使っていたら警告する。 */
function lintValueUse(expr: Expr, types: ReadonlyMap<Expr, Type>, reporter: Reporter, isStatement = false): void {
  if (expr.kind === "call" && !isStatement && types.get(expr) === NULL_TYPE) {
    reporter.report("K0604", expr.range, { name: calleeName(expr) })
  }
  // 文として単独で書いた呼び出しは、callee（関数の名前）は見ないで、引数だけ見る
  const children = expr.kind === "call" && expr.callee.kind === "ident" ? expr.args : childrenOf(expr)
  children.forEach((child) => lintValueUse(child, types, reporter))
}

/** 文の中の式を、すべて調べる。 */
function lintStatementExprs(stmts: readonly Stmt[], types: ReadonlyMap<Expr, Type>, reporter: Reporter): void {
  for (const stmt of stmts) {
    switch (stmt.kind) {
      case "var":
        lintValueUse(stmt.init, types, reporter)
        break
      case "exprStmt":
        if (stmt.expr.kind === "call") lintValueUse(stmt.expr, types, reporter, true)
        else {
          const comparison = stmt.expr.kind === "binary" && stmt.expr.op === "=="
          reporter.report("K0603", stmt.expr.range, comparison ? { op: "==" } : {})
          lintValueUse(stmt.expr, types, reporter)
        }
        break
      case "assign":
        lintValueUse(stmt.target, types, reporter)
        lintValueUse(stmt.value, types, reporter)
        break
      case "if":
        stmt.branches.forEach((branch) => lintValueUse(branch.condition, types, reporter))
        break
      case "while":
        lintValueUse(stmt.condition, types, reporter)
        break
      case "times":
        lintValueUse(stmt.count, types, reporter)
        break
      case "foreach":
        lintValueUse(stmt.iterable, types, reporter)
        break
      case "return":
        if (stmt.value !== undefined) lintValueUse(stmt.value, types, reporter)
        break
      default:
        break
    }
    bodiesOf(stmt).forEach((body) => lintStatementExprs(body, types, reporter))
  }
}

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

function collectStmtReads(stmts: readonly Stmt[], reads: Set<string>): void {
  for (const stmt of stmts) {
    switch (stmt.kind) {
      case "var":
        collectReads(stmt.init, reads)
        break
      case "exprStmt":
        collectReads(stmt.expr, reads)
        break
      case "assign":
        // `x = 1` は書くだけ（読んだことにしない）。`x += 1` や `a[0] = 1`、`self.x = 1` は対象の中を読む
        if (!(stmt.op === "=" && stmt.target.kind === "ident")) collectReads(stmt.target, reads)
        collectReads(stmt.value, reads)
        break
      case "if":
        stmt.branches.forEach((branch) => collectReads(branch.condition, reads))
        break
      case "while":
        collectReads(stmt.condition, reads)
        break
      case "times":
        collectReads(stmt.count, reads)
        break
      case "foreach":
        collectReads(stmt.iterable, reads)
        break
      case "return":
        if (stmt.value !== undefined) collectReads(stmt.value, reads)
        break
      default:
        break
    }
    bodiesOf(stmt).forEach((body) => collectStmtReads(body, reads))
  }
}

function declaredLocals(stmts: readonly Stmt[]): readonly Extract<Stmt, { kind: "var" }>[] {
  return stmts.flatMap((stmt) => [...(stmt.kind === "var" ? [stmt] : []), ...bodiesOf(stmt).flatMap(declaredLocals)])
}

function lintBody(body: readonly Stmt[], reporter: Reporter): void {
  const reads = new Set<string>()
  collectStmtReads(body, reads)
  for (const decl of declaredLocals(body)) {
    if (!reads.has(decl.name)) reporter.report("K0601", decl.nameRange, { name: decl.name })
  }
  lintReachability(body, reporter)
}

const JUMP_WORDS: Readonly<Record<string, string>> = { return: "return", break: "break", continue: "continue" }

function lintReachability(body: readonly Stmt[], reporter: Reporter): void {
  const jumpAt = body.findIndex((stmt) => stmt.kind === "return" || stmt.kind === "break" || stmt.kind === "continue")
  const next = jumpAt >= 0 ? body[jumpAt + 1] : undefined
  const jump = jumpAt >= 0 ? body[jumpAt] : undefined
  if (next !== undefined && jump !== undefined) reporter.report("K0602", next.range, { after: JUMP_WORDS[jump.kind] ?? "" })
  for (const stmt of body) bodiesOf(stmt).forEach((inner) => lintReachability(inner, reporter))
}

function lintFunction(fn: FunctionDecl, reporter: Reporter, types: ReadonlyMap<Expr, Type>): void {
  lintBody(fn.body, reporter)
  lintStatementExprs(fn.body, types, reporter)
}

/** 動くが見直したほうがよい書き方を、警告として集める（使っていない変数、実行されない行）。エラーがないときだけ呼ぶ。 */
export function lint(program: Program, reporter: Reporter, types: ReadonlyMap<Expr, Type>): void {
  for (const item of program.items) {
    if (item.kind === "function") lintFunction(item, reporter, types)
    else if (item.kind === "class") {
      for (const member of item.members) {
        if (member.kind === "method") lintFunction(member.fn, reporter, types)
        else if (member.kind === "constructor") {
          lintBody(member.body, reporter)
          lintStatementExprs(member.body, types, reporter)
        }
      }
    }
  }
}
