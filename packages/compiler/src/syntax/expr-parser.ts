import type { BinaryOp, Expr, TemplateNodePart } from "./ast"
import type { Cursor } from "./cursor"
import type { Token } from "./tokens"

const COMPARE_OPS: ReadonlySet<string> = new Set(["==", "!=", "<", "<=", ">", ">="])

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
    const again = c.peek()
    if (ADDITIVE.has(op.text) && again.kind === "op" && again.text === op.text && c.peek(1).kind === "nl") {
      // x++ / x-- のように、増やす・減らす書き方
      c.next()
      c.report("K0113", { start: op.range.start, end: again.range.end }, { op: op.text }, { title: `${op.text}= 1 に直す`, text: `${op.text}= 1` })
      return undefined
    }
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
    } else if (c.isOp("[")) {
      expr = parseIndex(c, expr)
    } else if (c.isOp(".")) {
      expr = parseMember(c, expr)
    } else {
      break
    }
  }
  return expr
}

function parseIndex(c: Cursor, target: Expr): Expr | undefined {
  c.next()
  const index = parseExpr(c)
  if (index === undefined) return undefined
  const close = c.expectOp("]")
  if (close === undefined) return undefined
  return { kind: "index", target, index, range: { start: target.range.start, end: close.range.end } }
}

function parseMember(c: Cursor, object: Expr): Expr | undefined {
  c.next()
  const name = c.peek()
  if (name.kind !== "ident") {
    c.expected("名前", "「.」のあとには、メンバの名前を書きます（例: a.length）")
    return undefined
  }
  c.next()
  return { kind: "member", object, name: name.text, nameRange: name.range, range: { start: object.range.start, end: name.range.end } }
}

function parseArray(c: Cursor): Expr | undefined {
  const open = c.next()
  const elements: Expr[] = []
  while (!c.isOp("]")) {
    const element = parseExpr(c)
    if (element === undefined) return undefined
    elements.push(element)
    if (!c.isOp(",")) break
    c.next()
  }
  const close = c.expectOp("]")
  if (close === undefined) return undefined
  return { kind: "array", elements, range: { start: open.range.start, end: close.range.end } }
}

/** ( の次から ) までの引数を読む。 */
function parseArgs(c: Cursor): { args: readonly Expr[]; end: number } | undefined {
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
  return close === undefined ? undefined : { args, end: close.range.end }
}

function parseCall(c: Cursor, callee: Expr): Expr | undefined {
  const parsed = parseArgs(c)
  if (parsed === undefined) return undefined
  return { kind: "call", callee, args: parsed.args, range: { start: callee.range.start, end: parsed.end } }
}

function parseNew(c: Cursor): Expr | undefined {
  const keyword = c.next()
  const name = c.peek()
  if (name.kind !== "ident") {
    c.expected("クラスの名前", "new のあとにクラスの名前を書きます（例: new Player(\"taro\")）")
    return undefined
  }
  c.next()
  if (!c.isOp("(")) {
    c.expected("「(」", "new には ( ) が必要です。引数がなくても new Player() と書きます")
    return undefined
  }
  const parsed = parseArgs(c)
  if (parsed === undefined) return undefined
  return {
    kind: "new",
    className: name.text,
    classRange: name.range,
    args: parsed.args,
    range: { start: keyword.range.start, end: parsed.end },
  }
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
  if (tok.kind === "keyword" && tok.text === "self") {
    c.next()
    return { kind: "self", range: tok.range }
  }
  if (tok.kind === "keyword" && tok.text === "new") return parseNew(c)
  if (tok.kind === "keyword" && tok.text === "null") {
    c.next()
    return { kind: "null", range: tok.range }
  }
  if (tok.kind === "op" && tok.text === "[") return parseArray(c)
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
