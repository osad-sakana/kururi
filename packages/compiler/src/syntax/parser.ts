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
  if (tok.kind === "keyword" && (tok.text === "var" || tok.text === "let" || tok.text === "const")) return parseVarDecl(c)
  if (tok.kind === "keyword" && tok.text === "function") return parseFunction(c)
  if (tok.kind === "keyword" && tok.text === "class") return parseClass(c)
  c.report("K0110", tok.range, { text: tok.text })
  if (c.isOp("}")) c.next()
  c.recover()
  return undefined
}

function parseClass(c: Cursor): ClassDecl | undefined {
  const keyword = c.next()
  const nameTok = c.peek()
  if (!c.checkDeclName(nameTok, "class")) {
    c.recover()
    return undefined
  }
  c.next()
  if (c.expectOp("=", "クラスは class Player = { ... } と書きます") === undefined) {
    c.recover()
    return undefined
  }
  if (c.isOp("(")) {
    c.report("K0002", c.peek().range, { text: "継承（class A = (B) { }）" })
    c.recover()
    return undefined
  }
  if (c.expectOp("{", "クラスの中身は { } で囲みます（例: class Player = { ... }）") === undefined) {
    c.recover()
    return undefined
  }
  const members: ClassMember[] = []
  const state: ClassState = { fieldsSeen: false, behaviorSeen: false }
  c.skipNewlines()
  while (!c.isOp("}")) {
    if (c.atEof()) {
      c.expected("「}」", "クラスを閉じる } が足りません")
      return undefined
    }
    members.push(...parseMembers(c, state))
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

interface ClassState {
  fieldsSeen: boolean
  /** constructor か method を読んだあとは、fields を書けない */
  behaviorSeen: boolean
}

/** fields = { ... } を読む。フィールドを 1 つずつ並べる。 */
function parseFieldsBlock(c: Cursor, state: ClassState): ClassMember[] {
  const keyword = c.next()
  if (state.fieldsSeen || state.behaviorSeen) c.report("K0115", keyword.range)
  state.fieldsSeen = true
  c.next() // =
  if (c.expectOp("{", "フィールドは fields = { ... } の中に書きます") === undefined) {
    c.recover()
    return []
  }
  const fields: ClassMember[] = []
  c.skipNewlines()
  while (!c.isOp("}")) {
    if (c.atEof()) {
      c.expected("「}」", "fields を閉じる } が足りません")
      return fields
    }
    const field = parseField(c)
    if (field !== undefined) fields.push(field)
    c.skipNewlines()
  }
  c.next()
  if (!c.atEof()) c.expectNewline()
  return fields
}

/** クラスの直下の中身を読む。fields は複数のフィールドを返す。失敗したら次の行まで読み飛ばす。 */
function parseMembers(c: Cursor, state: ClassState): ClassMember[] {
  const tok = c.peek()
  if (tok.kind === "ident" && tok.text === "fields" && c.peek(1).kind === "op" && c.peek(1).text === "=") {
    return parseFieldsBlock(c, state)
  }
  const accessTok = c.isKeyword("public") || c.isKeyword("private") ? c.next() : undefined
  const access: Access = accessTok?.text === "public" ? "public" : "private"
  if (c.isKeyword("constructor")) {
    state.behaviorSeen = true
    const ctor = parseConstructor(c, accessTok)
    return ctor === undefined ? [] : [ctor]
  }
  if (c.isKeyword("method") || c.isKeyword("function")) {
    state.behaviorSeen = true
    if (c.isKeyword("function")) {
      c.report("K0114", c.peek().range, { old: "function", hint: "クラスの中の関数は method と書きます（例: public method run = () { ... }）" })
    }
    const fn = parseFunction(c)
    return fn === undefined ? [] : [{ kind: "method", access, fn }]
  }
  // クラスの直下のフィールドは、fields の外なので案内を出す（読み進めて、続きのエラーを増やさない）
  if (tok.kind === "ident" || accessTok !== undefined) {
    c.report("K0114", accessTok?.range ?? tok.range, { old: "クラスの直下のフィールド", hint: "フィールドは fields = { ... } の中に書きます" })
  }
  const field = parseFieldAfterAccess(c, accessTok, access)
  return field === undefined ? [] : [field]
}

/** fields の中の 1 行（public / private は省略できる）。 */
function parseField(c: Cursor): ClassMember | undefined {
  const accessTok = c.isKeyword("public") || c.isKeyword("private") ? c.next() : undefined
  return parseFieldAfterAccess(c, accessTok, accessTok?.text === "public" ? "public" : "private")
}

function parseFieldAfterAccess(c: Cursor, accessTok: Token | undefined, access: Access): ClassMember | undefined {
  const nameTok = c.peek()
  if (nameTok.kind !== "ident" || !c.checkDeclName(nameTok)) {
    if (nameTok.kind !== "ident" && nameTok.kind !== "keyword") c.expected("フィールドか method")
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
  if (c.expectOp("=", "constructor は constructor = (引数) { ... } と書きます") === undefined) {
    c.recover()
    return undefined
  }
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

/** var / const を読む。古い let は、案内を出したうえで var として読み進める。 */
function takeVarKeyword(c: Cursor): Token {
  const keyword = c.next()
  if (keyword.text === "let") c.report("K0114", keyword.range, { old: "let", hint: "変数は var と書きます（例: var a: int = 1）" })
  return keyword
}

function parseVarDecl(c: Cursor): VarDecl | undefined {
  const keyword = takeVarKeyword(c)
  const nameTok = c.peek()
  if (!c.checkDeclName(nameTok, keyword.text === "const" ? "constant" : "snake")) {
    c.recover()
    return undefined
  }
  c.next()
  const decl = parseVarRest(c, keyword, nameTok)
  if (decl === undefined) c.recover()
  return decl
}

function parseVarRest(c: Cursor, keyword: Token, nameTok: Token): VarDecl | undefined {
  if (c.expectOp(":", "型を書いてください（例: var a: int = 1）") === undefined) return undefined
  const type = parseType(c)
  if (type === undefined) return undefined
  if (c.expectOp("=", "初期値が必要です（例: var a: int = 1）") === undefined) return undefined
  const init = parseExpr(c)
  if (init === undefined) return undefined
  if (!c.expectNewline()) return undefined
  return {
    kind: "var",
    mutable: keyword.text !== "const",
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
  if (c.expectOp("=", "関数は function 名前 = (引数) -> 戻り値の型 { ... } と書きます（戻り値がなければ -> は不要です）") === undefined) {
    c.recover()
    return undefined
  }
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
  const close = c.peek(-1)
  if (!c.isOp("->")) {
    // 戻り値がなければ -> は書かない（void）
    return { params, returnType: { name: "void", range: { start: close.range.end, end: close.range.end } } }
  }
  c.next()
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
    case "var":
    case "let":
    case "const":
      return parseVarDeclBody(c)
    case "if":
      return parseIf(c)
    case "while":
      return parseWhile(c)
    case "repeat":
      c.report("K0114", tok.range, { old: "repeat", hint: "回数で回すときは for i in 0..10 { ... } と書きます" })
      return undefined
    case "foreach":
      c.report("K0114", tok.range, { old: "foreach", hint: "配列を 1 つずつ取り出すときは for x in xs { ... } と書きます" })
      return parseFor(c)
    case "for":
      return parseFor(c)
    case "return":
      return parseReturn(c)
    case "break":
    case "continue":
      c.next()
      return c.expectNewline() ? { kind: tok.text, range: tok.range } : undefined
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
  const keyword = takeVarKeyword(c)
  const nameTok = c.peek()
  if (!c.checkDeclName(nameTok, keyword.text === "const" ? "constant" : "snake")) return undefined
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
  for (let more = true; more; ) {
    const condition = parseCondition(c)
    const body = condition === undefined ? undefined : parseBlock(c)
    if (condition === undefined || body === undefined) return undefined
    branches.push({ condition, body: body.statements })
    end = body.end
    more = false
    if (c.isKeyword("elseif")) {
      // 古い elseif は、案内を出したうえで else if として読み進める
      c.report("K0114", c.next().range, { old: "elseif", hint: "else if と、2 つに分けて書きます" })
      more = true
    } else if (c.isKeyword("else")) {
      c.next()
      if (c.isKeyword("if")) {
        c.next()
        more = true
      } else {
        const last = parseBlock(c)
        if (last === undefined) return undefined
        otherwise = last.statements
        end = last.end
      }
    }
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

/** for i in 0..10 { }（回数）または for x in xs { }（配列）。 */
function parseFor(c: Cursor): Stmt | undefined {
  const keyword = c.next()
  if (c.isOp("(")) {
    c.report("K0114", c.peek().range, { old: "for (…; …; …)", hint: "回数で回すときは for i in 0..10 { ... }、配列を 1 つずつ取り出すときは for x in xs { ... } と書きます" })
    return undefined
  }
  const nameTok = c.peek()
  if (!c.checkDeclName(nameTok)) return undefined
  c.next()
  if (!c.isKeyword("in")) {
    c.expected("「in」", "回数で回すときは for i in 0..10 { ... }、配列を 1 つずつ取り出すときは for x in xs { ... } と書きます")
    return undefined
  }
  c.next()
  const first = parseExpr(c)
  if (first === undefined) return undefined
  if (c.isOp("..")) {
    c.next()
    const end = parseExpr(c)
    const body = end === undefined ? undefined : parseBlock(c)
    if (end === undefined || body === undefined) return undefined
    if (!c.expectNewline()) return undefined
    return {
      kind: "range",
      name: nameTok.text,
      nameRange: nameTok.range,
      start: first,
      end,
      body: body.statements,
      range: { start: keyword.range.start, end: body.end },
    }
  }
  const body = parseBlock(c)
  if (body === undefined) return undefined
  if (!c.expectNewline()) return undefined
  return {
    kind: "foreach",
    name: nameTok.text,
    nameRange: nameTok.range,
    iterable: first,
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
