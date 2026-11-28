import type { Expr, Stmt } from "../syntax/ast"

/**
 * 絞り込み（T? を T として使える範囲）の判定。式の形だけで決める。
 * 対象はローカル変数と引数だけで、フィールドや式は絞り込まない。
 */

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
  if (a.kind === "ident" && b.kind === "null") return new Set([a.name])
  if (b.kind === "ident" && a.kind === "null") return new Set([b.name])
  return new Set()
}

export function union(a: ReadonlySet<string>, b: ReadonlySet<string>): ReadonlySet<string> {
  return new Set([...a, ...b])
}

export function without(set: ReadonlySet<string>, removed: ReadonlySet<string>): ReadonlySet<string> {
  return new Set([...set].filter((name) => !removed.has(name)))
}

/** 文の並びの中（入れ子を含む）で、代入されている変数の名前。 */
export function assignedNames(stmts: readonly Stmt[]): ReadonlySet<string> {
  const names = new Set<string>()
  const visit = (list: readonly Stmt[]): void => {
    for (const stmt of list) {
      if (stmt.kind === "assign" && stmt.target.kind === "ident") names.add(stmt.target.name)
      else if (stmt.kind === "if") {
        stmt.branches.forEach((branch) => visit(branch.body))
        if (stmt.otherwise !== undefined) visit(stmt.otherwise)
      } else if (stmt.kind === "while" || stmt.kind === "times" || stmt.kind === "foreach") visit(stmt.body)
    }
  }
  visit(stmts)
  return names
}
