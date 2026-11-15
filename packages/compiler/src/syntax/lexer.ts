import type { Diagnostic } from "../diagnostics"
import { Reporter } from "../reporter"
import { CONTINUATION_TEXTS, KEYWORDS } from "./tokens"
import type { Range, TemplatePart, Token, TokenKind } from "./tokens"

export interface LexResult {
  readonly tokens: readonly Token[]
  readonly diagnostics: readonly Diagnostic[]
}

const TWO_CHAR_OPS: ReadonlySet<string> = new Set(["==", "!=", "<=", ">=", "+=", "-=", "*=", "/=", "%="])
const ONE_CHAR_OPS: ReadonlySet<string> = new Set("+-*/%=<>()[]{},.:?".split(""))
const STRING_ESCAPES: Readonly<Record<string, string>> = { '"': '"', "\\": "\\", n: "\n", t: "\t" }
const TEMPLATE_ESCAPES: Readonly<Record<string, string>> = { "`": "`", $: "$", "\\": "\\", n: "\n", t: "\t" }
const IDENT_START = /[\p{XID_Start}_]/uy
const IDENT_REST = /\p{XID_Continue}*/uy
const DIGITS = /[0-9]+/y

/**
 * ソースをトークンに分ける。改行の扱い（GRAMMAR.ebnf 1-1）もここで済ませる。
 * 失敗しても止まらず、診断をためながら最後まで読む。
 */
export function lex(source: string): LexResult {
  const reporter = new Reporter(source)
  let pos = 0

  const matchAt = (re: RegExp): string | undefined => {
    re.lastIndex = pos
    return re.exec(source)?.[0]
  }

  /** inTemplateExpr が true のときは ${ ... } の中で、対応する } で終わる。 */
  function readTokens(inTemplateExpr: boolean): readonly Token[] {
    const tokens: Token[] = []
    let depth = inTemplateExpr ? 1 : 0
    let braces = 0

    const push = (kind: TokenKind, start: number, end: number, extra: Partial<Token> = {}): void => {
      tokens.push({ kind, text: source.slice(start, end), range: { start, end }, ...extra })
    }
    const last = (): Token | undefined => tokens[tokens.length - 1]
    const newline = (at: number): void => {
      const prev = last()
      if (depth > 0 || prev === undefined || prev.kind === "nl") return
      if ((prev.kind === "op" || prev.kind === "keyword") && CONTINUATION_TEXTS.has(prev.text)) return
      tokens.push({ kind: "nl", text: "\n", range: { start: at, end: at + 1 } })
    }

    while (pos < source.length) {
      const ch = source[pos] ?? ""
      const start = pos

      if (ch === "\n" || ch === "\r") {
        pos += ch === "\r" && source[pos + 1] === "\n" ? 2 : 1
        newline(start)
      } else if (ch === " " || ch === "\t") {
        pos += 1
      } else if (ch === "/" && source[pos + 1] === "/") {
        while (pos < source.length && source[pos] !== "\n" && source[pos] !== "\r") pos += 1
      } else if (ch === "/" && source[pos + 1] === "*") {
        skipBlockComment()
      } else if (ch === '"') {
        readString(push)
      } else if (ch === "`") {
        readTemplate(push)
      } else if (ch >= "0" && ch <= "9") {
        readNumber(push)
      } else if (matchAt(IDENT_START) !== undefined) {
        readIdent(push)
      } else {
        const two = source.slice(pos, pos + 2)
        if (TWO_CHAR_OPS.has(two)) {
          pos += 2
          push("op", start, pos)
        } else if (ch === "}" && inTemplateExpr && braces === 0) {
          break
        } else if (ONE_CHAR_OPS.has(ch)) {
          if (ch === "}") insertNewlineBeforeBrace(tokens, start)
          pos += 1
          push("op", start, pos)
          if (ch === "(" || ch === "[") depth += 1
          if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1)
          if (ch === "{") braces += 1
          if (ch === "}") braces = Math.max(0, braces - 1)
        } else {
          readUnknown()
        }
      }
    }

    if (inTemplateExpr) {
      tokens.push({ kind: "eof", text: "", range: { start: pos, end: pos } })
    } else {
      newline(pos)
      tokens.push({ kind: "eof", text: "", range: { start: pos, end: pos } })
    }
    return tokens
  }

  /** "}" の直前に改行がなければ補う（{ return 1 } のような 1 行のブロックのため）。 */
  function insertNewlineBeforeBrace(tokens: Token[], at: number): void {
    const prev = tokens[tokens.length - 1]
    if (prev === undefined || prev.kind === "nl" || prev.text === "{") return
    tokens.push({ kind: "nl", text: "\n", range: { start: at, end: at } })
  }

  function skipBlockComment(): void {
    const start = pos
    const close = source.indexOf("*/", pos + 2)
    if (close === -1) {
      reporter.report("K0102", { start, end: start + 2 }, { kind: "コメント", close: "*/" })
      pos = source.length
    } else {
      pos = close + 2
    }
  }

  function readNumber(push: (kind: TokenKind, s: number, e: number) => void): void {
    const start = pos
    const digits = matchAt(DIGITS) ?? ""
    pos += digits.length
    if (digits.length > 1 && digits.startsWith("0")) {
      reporter.report("K0105", { start, end: pos })
    }
    const next = source[pos + 1] ?? ""
    if (source[pos] === "." && next >= "0" && next <= "9") {
      pos += 1
      pos += (matchAt(DIGITS) ?? "").length
      push("float", start, pos)
    } else {
      push("int", start, pos)
    }
  }

  function readIdent(push: (kind: TokenKind, s: number, e: number) => void): void {
    const start = pos
    const first = matchAt(IDENT_START) ?? ""
    pos += first.length
    pos += (matchAt(IDENT_REST) ?? "").length
    const text = source.slice(start, pos)
    const range: Range = { start, end: pos }
    const normalized = text.normalize("NFKC")
    if (normalized !== text) {
      reporter.report("K0505", range, { name: text, normalized })
    } else if (text.startsWith("__")) {
      reporter.report("K0504", range, { name: text })
    }
    push(KEYWORDS.has(text) ? "keyword" : "ident", start, pos)
  }

  function readString(push: (kind: TokenKind, s: number, e: number, extra?: Partial<Token>) => void): void {
    const start = pos
    pos += 1
    let value = ""
    while (pos < source.length) {
      const ch = source[pos] ?? ""
      if (ch === '"') {
        pos += 1
        push("string", start, pos, { value })
        return
      }
      if (ch === "\n" || ch === "\r") break
      if (ch === "\\") {
        const escaped = STRING_ESCAPES[source[pos + 1] ?? ""]
        if (escaped === undefined) {
          const text = source.slice(pos, pos + 2)
          reporter.report("K0104", { start: pos, end: pos + text.length }, { text })
        }
        value += escaped ?? ""
        pos += 2
      } else {
        value += ch
        pos += 1
      }
    }
    reporter.report("K0102", { start, end: start + 1 }, { kind: "文字列", close: '"' })
    push("string", start, pos, { value })
  }

  function readTemplate(push: (kind: TokenKind, s: number, e: number, extra?: Partial<Token>) => void): void {
    const start = pos
    pos += 1
    const parts: TemplatePart[] = []
    let text = ""
    let textStart = pos
    const flush = (end: number): void => {
      if (text !== "") parts.push({ kind: "text", value: text, range: { start: textStart, end } })
      text = ""
    }
    while (pos < source.length) {
      const ch = source[pos] ?? ""
      if (ch === "`") {
        flush(pos)
        pos += 1
        push("template", start, pos, { parts })
        return
      }
      if (ch === "\\") {
        const escaped = TEMPLATE_ESCAPES[source[pos + 1] ?? ""]
        if (escaped === undefined) {
          const bad = source.slice(pos, pos + 2)
          reporter.report("K0104", { start: pos, end: pos + bad.length }, { text: bad })
        }
        text += escaped ?? ""
        pos += 2
      } else if (ch === "$" && source[pos + 1] === "{") {
        flush(pos)
        const exprStart = pos
        pos += 2
        const tokens = readTokens(true)
        if (source[pos] !== "}") break
        pos += 1
        parts.push({ kind: "expr", tokens, range: { start: exprStart, end: pos } })
        textStart = pos
      } else {
        text += ch
        pos += 1
      }
    }
    reporter.report("K0102", { start, end: start + 1 }, { kind: "文字列補間", close: "`" })
    push("template", start, pos, { parts })
  }

  function readUnknown(): void {
    const start = pos
    const two = source.slice(pos, pos + 2)
    const length = two === "&&" || two === "||" ? 2 : (String.fromCodePoint(source.codePointAt(pos) ?? 0).length)
    pos += length
    reporter.report("K0103", { start, end: pos }, { text: source.slice(start, pos) })
  }

  const tokens = readTokens(false)
  return { tokens, diagnostics: reporter.list() }
}
