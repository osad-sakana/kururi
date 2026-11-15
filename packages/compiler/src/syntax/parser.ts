import type { Diagnostic } from "../diagnostics"
import { Reporter } from "../reporter"
import type { AssignOp, Expr, FunctionDecl, IfBranch, Param, Program, Stmt, TopLevel, TypeRef, VarDecl } from "./ast"
import { Cursor } from "./cursor"
import { parseExpr } from "./expr-parser"
import type { Token } from "./tokens"

export interface ParseResult {
  readonly program: Program
  readonly diagnostics: readonly Diagnostic[]
}

const ASSIGN_OPS: ReadonlySet<string> = new Set(["=", "+=", "-=", "*=", "/=", "%="])
/** 文の先頭に書けるが、まだ対応していないキーワード */
const UNSUPPORTED_STATEMENTS: ReadonlySet<string> = new Set([
  "foreach", "return", "class", "public", "private", "function", "constructor",
])

export function parse(tokens: readonly Token[], source: string): ParseResult {
  const reporter = new Reporter(source)
  const c = new Cursor(tokens, reporter)
  const items: TopLevel[] = []
  c.skipNewlines()
  while (!c.atEof()) {
    const item = parseTopLevel(c)
    if (item !== undefined) items.push(item)
    c.skipNewlines()
  }
  return { program: { items }, diagnostics: reporter.list() }
}

function parseTopLevel(c: Cursor): TopLevel | undefined {
  const tok = c.peek()
  if (tok.kind === "keyword" && (tok.text === "let" || tok.text === "const")) return parseVarDecl(c)
  if (tok.kind === "keyword" && tok.text === "function") return parseFunction(c)
  if (tok.kind === "keyword" && tok.text === "class") {
    c.report("K0001", tok.range, { text: tok.text })
  } else if (tok.kind === "keyword" && tok.text === "for") {
    c.report("K0503", tok.range)
  } else {
    c.report("K0110", tok.range, { text: tok.text })
  }
  if (c.isOp("}")) c.next()
  c.recover()
  return undefined
}

function parseType(c: Cursor): TypeRef | undefined {
  const tok = c.peek()
  const isType = tok.kind === "ident" || (tok.kind === "keyword" && ["int", "float", "string", "boolean", "void"].includes(tok.text))
  if (!isType) {
    c.expected("型", "使える型は int、float、string、boolean です")
    return undefined
  }
  c.next()
  if (c.isOp("[") || c.isOp("?")) {
    c.report("K0002", c.peek().range, { text: c.peek().text === "?" ? "T?" : "T[]" })
    return undefined
  }
  return { name: tok.text, range: tok.range }
}

function parseVarDecl(c: Cursor): VarDecl | undefined {
  const keyword = c.next()
  const nameTok = c.peek()
  if (!c.checkDeclName(nameTok)) {
    c.recover()
    return undefined
  }
  c.next()
  const decl = parseVarRest(c, keyword, nameTok)
  if (decl === undefined) c.recover()
  return decl
}

function parseVarRest(c: Cursor, keyword: Token, nameTok: Token): VarDecl | undefined {
  if (c.expectOp(":", "型を書いてください（例: let a: int = 1）") === undefined) return undefined
  const type = parseType(c)
  if (type === undefined) return undefined
  if (c.expectOp("=", "初期値が必要です（例: let a: int = 1）") === undefined) return undefined
  const init = parseExpr(c)
  if (init === undefined) return undefined
  if (!c.expectNewline()) return undefined
  return {
    kind: "var",
    mutable: keyword.text === "let",
    name: nameTok.text,
    nameRange: nameTok.range,
    type,
    init,
    range: { start: keyword.range.start, end: init.range.end },
  }
}

function parseFunction(c: Cursor): FunctionDecl | undefined {
  const keyword = c.next()
  const nameTok = c.peek()
  if (!c.checkDeclName(nameTok)) {
    c.recover()
    return undefined
  }
  c.next()
  const header = parseFunctionHeader(c)
  if (header === undefined) {
    c.recover()
    return undefined
  }
  const body = parseBlock(c)
  if (body === undefined) {
    c.recover()
    return undefined
  }
  const end = c.peek()
  if (end.kind !== "eof") c.expectNewline()
  return {
    kind: "function",
    name: nameTok.text,
    nameRange: nameTok.range,
    params: header.params,
    returnType: header.returnType,
    body: body.statements,
    range: { start: keyword.range.start, end: body.end },
  }
}

function parseFunctionHeader(c: Cursor): { params: readonly Param[]; returnType: TypeRef } | undefined {
  if (c.expectOp("(") === undefined) return undefined
  const params: Param[] = []
  while (!c.isOp(")")) {
    const nameTok = c.peek()
    if (!c.checkDeclName(nameTok)) return undefined
    c.next()
    if (c.expectOp(":", "引数には型を書きます（例: a: int）") === undefined) return undefined
    const type = parseType(c)
    if (type === undefined) return undefined
    params.push({ name: nameTok.text, nameRange: nameTok.range, type })
    if (!c.isOp(",")) break
    c.next()
  }
  if (c.expectOp(")") === undefined) return undefined
  if (c.expectOp(":", "戻り値の型を書いてください（例: function main(): void）") === undefined) return undefined
  const returnType = parseType(c)
  if (returnType === undefined) return undefined
  return { params, returnType }
}

function parseBlock(c: Cursor): { statements: readonly Stmt[]; end: number } | undefined {
  if (c.expectOp("{") === undefined) return undefined
  const statements: Stmt[] = []
  c.skipNewlines()
  while (!c.isOp("}")) {
    if (c.atEof()) {
      c.expected("「}」", "ブロックを閉じる } が足りません")
      return undefined
    }
    const stmt = parseStatement(c)
    if (stmt !== undefined) statements.push(stmt)
    c.skipNewlines()
  }
  const close = c.next()
  return { statements, end: close.range.end }
}

function parseStatement(c: Cursor): Stmt | undefined {
  const stmt = parseStatementBody(c)
  if (stmt === undefined) c.recover()
  return stmt
}

/** 失敗したら診断を出して undefined を返す（読み飛ばしは呼び出し側）。 */
function parseStatementBody(c: Cursor): Stmt | undefined {
  const tok = c.peek()
  if (tok.kind !== "keyword") return parseSimpleStatement(c)
  switch (tok.text) {
    case "let":
    case "const":
      return parseVarDeclBody(c)
    case "if":
      return parseIf(c)
    case "while":
      return parseWhile(c)
    case "repeat":
      return parseRepeat(c)
    case "break":
    case "continue":
      c.next()
      return c.expectNewline() ? { kind: tok.text, range: tok.range } : undefined
    case "for":
      c.report("K0503", tok.range)
      return undefined
    case "elseif":
    case "else":
      c.expected("文", `${tok.text} は、if のブロックを閉じた直後にだけ書けます`)
      return undefined
    default:
      if (UNSUPPORTED_STATEMENTS.has(tok.text)) c.report("K0001", tok.range, { text: tok.text })
      else return parseSimpleStatement(c)
      return undefined
  }
}

function parseVarDeclBody(c: Cursor): VarDecl | undefined {
  const keyword = c.next()
  const nameTok = c.peek()
  if (!c.checkDeclName(nameTok)) return undefined
  c.next()
  return parseVarRest(c, keyword, nameTok)
}

/** 条件の式。if x = 1 { のように = が来たら、専用のメッセージを出す。 */
function parseCondition(c: Cursor): Expr | undefined {
  const expr = parseExpr(c)
  if (expr === undefined) return undefined
  const next = c.peek()
  if (next.kind === "op" && ASSIGN_OPS.has(next.text)) {
    c.report("K0111", next.range)
    return undefined
  }
  return expr
}

function parseIf(c: Cursor): Stmt | undefined {
  const keyword = c.next()
  const branches: IfBranch[] = []
  let otherwise: readonly Stmt[] | undefined
  let end = keyword.range.end
  for (let first = true; first || c.isKeyword("elseif"); first = false) {
    if (!first) c.next()
    const condition = parseCondition(c)
    const body = condition === undefined ? undefined : parseBlock(c)
    if (condition === undefined || body === undefined) return undefined
    branches.push({ condition, body: body.statements })
    end = body.end
  }
  if (c.isKeyword("else")) {
    c.next()
    const body = parseBlock(c)
    if (body === undefined) return undefined
    otherwise = body.statements
    end = body.end
  }
  if (!c.expectNewline()) return undefined
  return { kind: "if", branches, otherwise, range: { start: keyword.range.start, end } }
}

function parseWhile(c: Cursor): Stmt | undefined {
  const keyword = c.next()
  const condition = parseCondition(c)
  const body = condition === undefined ? undefined : parseBlock(c)
  if (condition === undefined || body === undefined) return undefined
  if (!c.expectNewline()) return undefined
  return { kind: "while", condition, body: body.statements, range: { start: keyword.range.start, end: body.end } }
}

function parseRepeat(c: Cursor): Stmt | undefined {
  const keyword = c.next()
  const nameTok = c.peek()
  if (!c.checkDeclName(nameTok)) return undefined
  c.next()
  if (c.expectOp(":", "回数を書いてください（例: repeat i: 10 { ... }）") === undefined) return undefined
  const count = parseExpr(c)
  const body = count === undefined ? undefined : parseBlock(c)
  if (count === undefined || body === undefined) return undefined
  if (!c.expectNewline()) return undefined
  return {
    kind: "repeat",
    name: nameTok.text,
    nameRange: nameTok.range,
    count,
    body: body.statements,
    range: { start: keyword.range.start, end: body.end },
  }
}

/** 式の文、または代入。 */
function parseSimpleStatement(c: Cursor): Stmt | undefined {
  const expr = parseExpr(c)
  if (expr === undefined) return undefined
  const next = c.peek()
  if (next.kind === "op" && ASSIGN_OPS.has(next.text)) {
    if (expr.kind !== "ident") {
      c.report("K0112", expr.range)
      return undefined
    }
    c.next()
    const value = parseExpr(c)
    if (value === undefined || !c.expectNewline()) return undefined
    return { kind: "assign", op: next.text as AssignOp, target: expr, value, range: { start: expr.range.start, end: value.range.end } }
  }
  if (!c.expectNewline()) return undefined
  return { kind: "exprStmt", expr, range: expr.range }
}
