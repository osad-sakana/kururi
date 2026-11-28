import type { Expr, Stmt } from "../syntax/ast"
import { BUILTIN_NAMES } from "../syntax/tokens"
import { childrenOf } from "./walk"

/**
 * 絞り込み（T? を T として使える範囲）の判定。式の形だけで決める。
 * 対象は、ローカル変数・引数と、そこから . でたどったフィールド（x、self.next、a.b.c）。
 * 絞り込みは、名前（x）や道すじ（self.next）の文字列で表す。
 */

/** 絞り込みの対象になる式の道すじ（x、self.next、a.b）。対象でなければ undefined。 */
export function pathOf(expr: Expr): string | undefined {
  if (expr.kind === "ident") return expr.name
  if (expr.kind === "self") return "self"
  if (expr.kind === "member") {
    const base = pathOf(expr.object)
    return base === undefined ? undefined : `${base}.${expr.name}`
  }
  return undefined
}

/** その式が true のとき、null でないと分かる変数。 */
export function whenTrue(expr: Expr): ReadonlySet<string> {
  switch (expr.kind) {
    case "paren":
      return whenTrue(expr.inner)
    case "unary":
      return expr.op === "not" ? whenFalse(expr.operand) : new Set()
    case "binary":
      if (expr.op === "and") return union(whenTrue(expr.left), whenTrue(expr.right))
      return nullComparison(expr, "!=")
    default:
      return new Set()
  }
}

/** その式が false のとき、null でないと分かる変数。 */
export function whenFalse(expr: Expr): ReadonlySet<string> {
  switch (expr.kind) {
    case "paren":
      return whenFalse(expr.inner)
    case "unary":
      return expr.op === "not" ? whenTrue(expr.operand) : new Set()
    case "binary":
      if (expr.op === "or") return union(whenFalse(expr.left), whenFalse(expr.right))
      return nullComparison(expr, "==")
    default:
      return new Set()
  }
}

/** x == null / x != null（null が左でもよい）の x。op が合うときだけ。 */
function nullComparison(expr: Extract<Expr, { kind: "binary" }>, op: "==" | "!="): ReadonlySet<string> {
  if (expr.op !== op) return new Set()
  const [a, b] = [expr.left, expr.right]
  const left = pathOf(a)
  const right = pathOf(b)
  if (left !== undefined && b.kind === "null") return new Set([left])
  if (right !== undefined && a.kind === "null") return new Set([right])
  return new Set()
}

export function union(a: ReadonlySet<string>, b: ReadonlySet<string>): ReadonlySet<string> {
  return new Set([...a, ...b])
}

/** removed の道すじと、その下の道すじ（x を外すなら x.next も）を外す。 */
export function without(set: ReadonlySet<string>, removed: ReadonlySet<string>): ReadonlySet<string> {
  return new Set([...set].filter((path) => ![...removed].some((gone) => path === gone || path.startsWith(`${gone}.`))))
}

/** フィールドの絞り込み（道すじに . があるもの）だけを外す。メソッドの呼び出しなどでフィールドが変わるかもしれないとき用。 */
export function withoutFields(set: ReadonlySet<string>): ReadonlySet<string> {
  return new Set([...set].filter((path) => !path.includes(".")))
}

/** 文の並びの中（入れ子を含む）で、代入されている変数の名前。 */
export function assignedNames(stmts: readonly Stmt[]): ReadonlySet<string> {
  const names = new Set<string>()
  const visit = (list: readonly Stmt[]): void => {
    for (const stmt of list) {
      if (stmt.kind === "assign") {
        const path = pathOf(stmt.target)
        if (path !== undefined) names.add(path)
      } else if (stmt.kind === "if") {
        stmt.branches.forEach((branch) => visit(branch.body))
        if (stmt.otherwise !== undefined) visit(stmt.otherwise)
      } else if (stmt.kind === "while" || stmt.kind === "times" || stmt.kind === "foreach") visit(stmt.body)
    }
  }
  visit(stmts)
  return names
}

/** メソッドや自作の関数を呼ぶ（フィールドが書き換わるかもしれない）式か。配列の push / remove_at と組み込み関数は除く。 */
function changesFields(expr: Expr): boolean {
  if (expr.kind === "new") return true
  if (expr.kind === "call") {
    if (expr.callee.kind === "ident") return !BUILTIN_NAMES.has(expr.callee.name)
    if (expr.callee.kind === "member") return expr.callee.name !== "push" && expr.callee.name !== "remove_at"
  }
  return childrenOf(expr).some(changesFields)
}

function statementExprs(stmt: Stmt): readonly Expr[] {
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

/** 文の並び（入れ子を含む）のどこかで、フィールドが書き換わるかもしれない呼び出しをしているか。 */
export function mayChangeFields(stmts: readonly Stmt[]): boolean {
  return stmts.some((stmt) => {
    if (statementExprs(stmt).some(changesFields)) return true
    if (stmt.kind === "if") {
      return stmt.branches.some((branch) => mayChangeFields(branch.body)) || (stmt.otherwise !== undefined && mayChangeFields(stmt.otherwise))
    }
    return (stmt.kind === "while" || stmt.kind === "times" || stmt.kind === "foreach") && mayChangeFields(stmt.body)
  })
}
