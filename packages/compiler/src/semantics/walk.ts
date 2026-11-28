import type { Expr } from "../syntax/ast"

/** 式の直下の部分式。 */
export function childrenOf(expr: Expr): readonly Expr[] {
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
