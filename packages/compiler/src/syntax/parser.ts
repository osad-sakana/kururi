import type { Diagnostic } from "../diagnostics"
import { Reporter } from "../reporter"
import type { Access, AssignOp, ClassDecl, ClassMember, ConstructorDecl, Expr, FieldDecl, FunctionDecl, IfBranch, Param, Program, Stmt, TopLevel, TypeRef, VarDecl } from "./ast"
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
  "class", "public", "private", "function", "constructor",
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
  if (tok.kind === "keyword" && tok.text === "class") return parseClass(c)
  if (tok.kind === "keyword" && tok.text === "for") {
    c.report("K0503", tok.range)
  } else {
    c.report("K0110", tok.range, { text: tok.text })
  }
  if (c.isOp("}")) c.next()
  c.recover()
  return undefined
}

function parseClass(c: Cursor): ClassDecl | undefined {
  const keyword = c.next()
  const nameTok = c.peek()
  if (!c.checkDeclName(nameTok)) {
    c.recover()
    return undefined
  }
  c.next()
  if (c.expectOp("{", "クラスの中身は { } で囲みます（例: class Player { ... }）") === undefined) {
    c.recover()
    return undefined
  }
  const members: ClassMember[] = []
  c.skipNewlines()
  while (!c.isOp("}")) {
    if (c.atEof()) {
      c.expected("「}」", "クラスを閉じる } が足りません")
      return undefined
    }
    const member = parseMember(c)
    if (member !== undefined) members.push(member)
    c.skipNewlines()
  }
  const close = c.next()
  if (!c.atEof()) c.expectNewline()
  return {
    kind: "class",
    name: nameTok.text,
    nameRange: nameTok.range,
    members,
    range: { start: keyword.range.start, end: close.range.end },
  }
}

/** クラスの中身（フィールド・constructor・メソッド）を 1 つ読む。失敗したら次の行まで読み飛ばす。 */
function parseMember(c: Cursor): ClassMember | undefined {
  const accessTok = c.isKeyword("public") || c.isKeyword("private") ? c.next() : undefined
  const access: Access = accessTok?.text === "public" ? "public" : "private"
  if (c.isKeyword("constructor")) return parseConstructor(c, accessTok)
  if (c.isKeyword("function")) {
    const fn = parseFunction(c)
    return fn === undefined ? undefined : { kind: "method", access, fn }
  }
  const nameTok = c.peek()
  if (nameTok.kind !== "ident" || !c.checkDeclName(nameTok)) {
    if (nameTok.kind !== "ident" && nameTok.kind !== "keyword") c.expected("フィールドかメソッド")
    c.recover()
    return undefined
  }
  c.next()
  const field = parseFieldRest(c, nameTok, access, accessTok?.range.start)
  if (field === undefined) c.recover()
  return field
}

function parseFieldRest(c: Cursor, nameTok: Token, access: Access, accessStart: number | undefined): FieldDecl | undefined {
  if (c.expectOp(":", "フィールドには型を書きます（例: name: string）") === undefined) return undefined
  const type = parseType(c)
  if (type === undefined) return undefined
  let init: Expr | undefined
  if (c.isOp("=")) {
    c.next()
    init = parseExpr(c)
    if (init === undefined) return undefined
  }
  if (!c.expectNewline()) return undefined
  const end = init?.range.end ?? type.range.end
  return { kind: "field", access, name: nameTok.text, nameRange: nameTok.range, type, init, range: { start: accessStart ?? nameTok.range.start, end } }
}

function parseConstructor(c: Cursor, accessTok: Token | undefined): ConstructorDecl | undefined {
  const keyword = c.next()
  if (accessTok !== undefined) c.report("K0408", accessTok.range)
  const params = parseParamList(c)
  const body = params === undefined ? undefined : parseBlock(c)
  if (params === undefined || body === undefined) {
    c.recover()
    return undefined
  }
  if (!c.expectNewline()) c.recover()
  return { kind: "constructor", keywordRange: keyword.range, params, body: body.statements, range: { start: keyword.range.start, end: body.end } }
}

function parseType(c: Cursor): TypeRef | undefined {
  const tok = c.peek()
  const isType = tok.kind === "ident" || (tok.kind === "keyword" && ["int", "float", "string", "boolean", "void"].includes(tok.text))
  if (!isType) {
    c.expected("型", "使える型は int、float、string、boolean です")
    return undefined
  }
  c.next()
  let name = tok.text
  let end = tok.range.end
  // T?  T[]  T[]?  T?[]  のように、? と [] を続けて書ける
  for (;;) {
    if (c.isOp("?")) {
      end = c.next().range.end
      name += "?"
    } else if (c.isOp("[")) {
      c.next()
      const close = c.expectOp("]")
      if (close === undefined) return undefined
      end = close.range.end
      name += "[]"
    } else {
      break
    }
  }
  return { name, range: { start: tok.range.start, end } }
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

/** ( から ) までの引数の宣言を読む。 */
function parseParamList(c: Cursor): readonly Param[] | undefined {
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
  return c.expectOp(")") === undefined ? undefined : params
}

function parseFunctionHeader(c: Cursor): { params: readonly Param[]; returnType: TypeRef } | undefined {
  const params = parseParamList(c)
  if (params === undefined) return undefined
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
    case "foreach":
      return parseForeach(c)
    case "return":
      return parseReturn(c)
    case "break":
    case "continue":
      c.next()
      return c.expectNewline() ? { kind: tok.text, range: tok.range } : undefined
    case "for":
      c.report("K0503", tok.range)
      c.recover()
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

function parseReturn(c: Cursor): Stmt | undefined {
  const keyword = c.next()
  if (c.peek().kind === "nl") {
    c.next()
    return { kind: "return", value: undefined, range: keyword.range }
  }
  const value = parseExpr(c)
  if (value === undefined || !c.expectNewline()) return undefined
  return { kind: "return", value, range: { start: keyword.range.start, end: value.range.end } }
}

function parseForeach(c: Cursor): Stmt | undefined {
  const keyword = c.next()
  const nameTok = c.peek()
  if (!c.checkDeclName(nameTok)) return undefined
  c.next()
  if (!c.isKeyword("in")) {
    c.expected("「in」", "配列から 1 つずつ取り出します（例: foreach x in xs { ... }）")
    return undefined
  }
  c.next()
  const iterable = parseExpr(c)
  const body = iterable === undefined ? undefined : parseBlock(c)
  if (iterable === undefined || body === undefined) return undefined
  if (!c.expectNewline()) return undefined
  return {
    kind: "foreach",
    name: nameTok.text,
    nameRange: nameTok.range,
    iterable,
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
    if (expr.kind !== "ident" && expr.kind !== "index" && expr.kind !== "member") {
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
