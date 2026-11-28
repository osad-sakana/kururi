import type { Diagnostic, Fix } from "../diagnostics"
import { Reporter } from "../reporter"
import { CONTINUATION_TEXTS, KEYWORDS } from "./tokens"
import type { Range, TemplatePart, Token, TokenKind } from "./tokens"

export interface LexResult {
  readonly tokens: readonly Token[]
  readonly diagnostics: readonly Diagnostic[]
}

const TWO_CHAR_OPS: ReadonlySet<string> = new Set(["==", "!=", "<=", ">=", "+=", "-=", "*=", "/=", "%=", "..", "->"])
const ONE_CHAR_OPS: ReadonlySet<string> = new Set("+-*/%=<>()[]{},.:?".split(""))
const STRING_ESCAPES: Readonly<Record<string, string>> = { '"': '"', "\\": "\\", $: "$", n: "\n", t: "\t" }
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
        readString(push, '"')
      } else if (ch === "`") {
        // 古い書き方。案内を出したうえで、最後まで読み進める
        reporter.report("K0114", { start, end: start + 1 }, { old: "バッククォートの文字列", hint: '文字列は "..." で囲みます。補間は "x は ${x}" と書きます' })
        readString(push, "`")
      } else if (ch >= "0" && ch <= "9") {
        readNumber(push)
      } else if (matchAt(IDENT_START) !== undefined) {
        readIdent(push)
        dropNewlineBeforeElse(tokens)
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
          const substitute = readUnknown()
          // 他の言語の演算子は、対応する Kururi の語として読み進める（診断は出したので、続きのエラーを増やさない）
          if (substitute !== undefined) tokens.push({ kind: "keyword", text: substitute, range: { start, end: pos } })
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

  /** } のあとの改行は、次が else / elseif なら捨てる（} else { と書けるように）。 */
  function dropNewlineBeforeElse(tokens: Token[]): void {
    const word = tokens[tokens.length - 1]
    const isElse = word?.kind === "keyword" && (word.text === "else" || word.text === "elseif")
    if (isElse && tokens[tokens.length - 2]?.kind === "nl" && tokens[tokens.length - 3]?.text === "}") {
      tokens.splice(tokens.length - 2, 1)
    }
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

  /**
   * 文字列を読む。"..." の中の ${式} は補間になる（文字として書くときは \$）。
   * 補間がなければ string、あれば template のトークンにする。
   * quote が ` のときは、古い書き方のバッククォートの文字列（複数行も読む）。
   */
  function readString(push: (kind: TokenKind, s: number, e: number, extra?: Partial<Token>) => void, quote: '"' | "`"): void {
    const escapes = quote === '"' ? STRING_ESCAPES : TEMPLATE_ESCAPES
    const start = pos
    pos += 1
    const parts: TemplatePart[] = []
    let text = ""
    let textStart = pos
    const flush = (end: number): void => {
      if (text !== "") parts.push({ kind: "text", value: text, range: { start: textStart, end } })
      text = ""
    }
    const finish = (): void => {
      if (parts.every((part) => part.kind === "text")) {
        push("string", start, pos, { value: parts.map((part) => (part.kind === "text" ? part.value : "")).join("") })
      } else {
        push("template", start, pos, { parts })
      }
    }
    while (pos < source.length) {
      const ch = source[pos] ?? ""
      if (ch === quote) {
        flush(pos)
        pos += 1
        finish()
        return
      }
      if (quote === '"' && (ch === "\n" || ch === "\r")) break
      if (ch === "\\") {
        const escaped = escapes[source[pos + 1] ?? ""]
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
    const hasInterpolation = parts.some((part) => part.kind === "expr")
    reporter.report("K0102", { start, end: start + 1 }, { kind: hasInterpolation ? "文字列補間" : "文字列", close: quote })
    flush(pos)
    finish()
  }

  let lastSemicolon = -1
  const SUBSTITUTES: Readonly<Record<string, string>> = { "&&": "and", "||": "or", "!": "not" }
  const WORD_FIXES: Readonly<Record<string, Fix>> = {
    "&&": { title: "and に直す", text: "and" },
    "||": { title: "or に直す", text: "or" },
    "!": { title: "not に直す", text: "not " },
  }

  function readUnknown(): string | undefined {
    const start = pos
    const two = source.slice(pos, pos + 2)
    const length = two === "&&" || two === "||" ? 2 : (String.fromCodePoint(source.codePointAt(pos) ?? 0).length)
    pos += length
    const text = source.slice(start, pos)
    // 1 行に ; が何度もあっても、診断は最初の 1 件だけ（for (...; ...; ...) などで同じ案内が並ばないように）
    const repeated = text === ";" && lastSemicolon >= 0 && !source.slice(lastSemicolon, start).includes("\n")
    if (text === ";") lastSemicolon = start
    if (!repeated) reporter.report("K0103", { start, end: pos }, { text }, WORD_FIXES[text])
    return SUBSTITUTES[text]
  }

  const tokens = readTokens(false)
  return { tokens, diagnostics: reporter.list() }
}
