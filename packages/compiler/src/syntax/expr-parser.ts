import type { BinaryOp, Expr, TemplateNodePart } from "./ast"
import type { Cursor } from "./cursor"
import type { Token } from "./tokens"

const COMPARE_OPS: ReadonlySet<string> = new Set(["==", "!=", "<", "<=", ">", ">="])
const UNSUPPORTED_PRIMARY: ReadonlySet<string> = new Set(["null", "self", "new"])

/** 式の構文解析（優先順位は Python に準拠）。失敗したら診断を出して undefined を返す。 */
export function parseExpr(c: Cursor): Expr | undefined {
  return parseOr(c)
}

function binary(op: BinaryOp, left: Expr, right: Expr): Expr {
  return { kind: "binary", op, left, right, range: { start: left.range.start, end: right.range.end } }
}

function parseOr(c: Cursor): Expr | undefined {
  let left = parseAnd(c)
  while (left !== undefined && c.isKeyword("or")) {
    c.next()
    const right = parseAnd(c)
    left = right === undefined ? undefined : binary("or", left, right)
  }
  return left
}

function parseAnd(c: Cursor): Expr | undefined {
  let left = parseNot(c)
  while (left !== undefined && c.isKeyword("and")) {
    c.next()
    const right = parseNot(c)
    left = right === undefined ? undefined : binary("and", left, right)
  }
  return left
}

function parseNot(c: Cursor): Expr | undefined {
  if (!c.isKeyword("not")) return parseComparison(c)
  const op = c.next()
  const operand = parseNot(c)
  if (operand === undefined) return undefined
  return { kind: "unary", op: "not", operand, range: { start: op.range.start, end: operand.range.end } }
}

function parseComparison(c: Cursor): Expr | undefined {
  const left = parseAdditive(c)
  if (left === undefined || !COMPARE_OPS.has(c.peek().text) || c.peek().kind !== "op") return left
  const op = c.next()
  const right = parseAdditive(c)
  if (right === undefined) return undefined
  const next = c.peek()
  if (next.kind === "op" && COMPARE_OPS.has(next.text)) {
    c.report("K0106", next.range)
    return undefined
  }
  return binary(op.text as BinaryOp, left, right)
}

function parseLeftAssoc(c: Cursor, ops: ReadonlySet<string>, operand: (c: Cursor) => Expr | undefined): Expr | undefined {
  let left = operand(c)
  while (left !== undefined && c.peek().kind === "op" && ops.has(c.peek().text)) {
    const op = c.next()
    const right = operand(c)
    left = right === undefined ? undefined : binary(op.text as BinaryOp, left, right)
  }
  return left
}

const ADDITIVE: ReadonlySet<string> = new Set(["+", "-"])
const MULTIPLICATIVE: ReadonlySet<string> = new Set(["*", "/", "%"])

function parseAdditive(c: Cursor): Expr | undefined {
  return parseLeftAssoc(c, ADDITIVE, parseMultiplicative)
}

function parseMultiplicative(c: Cursor): Expr | undefined {
  return parseLeftAssoc(c, MULTIPLICATIVE, parseUnary)
}

function parseUnary(c: Cursor): Expr | undefined {
  if (!c.isOp("-")) return parsePostfix(c)
  const op = c.next()
  const operand = parseUnary(c)
  if (operand === undefined) return undefined
  return { kind: "unary", op: "-", operand, range: { start: op.range.start, end: operand.range.end } }
}

function parsePostfix(c: Cursor): Expr | undefined {
  let expr = parsePrimary(c)
  while (expr !== undefined) {
    if (c.isOp("(")) {
      expr = parseCall(c, expr)
    } else if (c.isOp("[") || c.isOp(".")) {
      c.report("K0002", c.peek().range, { text: c.peek().text })
      return undefined
    } else {
      break
    }
  }
  return expr
}

function parseCall(c: Cursor, callee: Expr): Expr | undefined {
  c.next()
  const args: Expr[] = []
  if (!c.isOp(")")) {
    for (;;) {
      const arg = parseExpr(c)
      if (arg === undefined) return undefined
      args.push(arg)
      if (!c.isOp(",")) break
      c.next()
    }
  }
  const close = c.expectOp(")")
  if (close === undefined) return undefined
  return { kind: "call", callee, args, range: { start: callee.range.start, end: close.range.end } }
}

function parsePrimary(c: Cursor): Expr | undefined {
  const tok = c.peek()
  switch (tok.kind) {
    case "int":
    case "float":
      c.next()
      return { kind: tok.kind, text: tok.text, range: tok.range }
    case "string":
      c.next()
      return { kind: "string", value: tok.value ?? "", range: tok.range }
    case "template":
      c.next()
      return parseTemplate(c, tok)
    case "ident":
      c.next()
      return { kind: "ident", name: tok.text, range: tok.range }
    default:
      return parseKeywordOrParen(c, tok)
  }
}

function parseKeywordOrParen(c: Cursor, tok: Token): Expr | undefined {
  if (tok.kind === "keyword" && (tok.text === "true" || tok.text === "false")) {
    c.next()
    return { kind: "bool", value: tok.text === "true", range: tok.range }
  }
  if (tok.kind === "keyword" && UNSUPPORTED_PRIMARY.has(tok.text)) {
    c.report("K0002", tok.range, { text: tok.text })
    return undefined
  }
  if (tok.kind === "op" && tok.text === "[") {
    c.report("K0002", tok.range, { text: "[" })
    return undefined
  }
  if (tok.kind === "op" && tok.text === "(") {
    c.next()
    const inner = parseExpr(c)
    if (inner === undefined) return undefined
    const close = c.expectOp(")")
    if (close === undefined) return undefined
    return { kind: "paren", inner, range: { start: tok.range.start, end: close.range.end } }
  }
  c.expected("式")
  return undefined
}

function parseTemplate(c: Cursor, tok: Token): Expr | undefined {
  const parts: TemplateNodePart[] = []
  for (const part of tok.parts ?? []) {
    if (part.kind === "text") {
      parts.push({ kind: "text", value: part.value })
      continue
    }
    const expr = c.parseNested(part.tokens, parseExpr)
    if (expr === undefined) return undefined
    parts.push({ kind: "expr", expr })
  }
  return { kind: "template", parts, range: tok.range }
}
