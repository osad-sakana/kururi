import type { Reporter } from "../reporter"
import type { DiagnosticCode } from "../diagnostics"
import { namingProblem } from "./naming"
import type { NameStyle } from "./naming"
import { BUILTIN_NAMES, PYTHON_RESERVED } from "./tokens"
import type { Range, Token } from "./tokens"

/** トークン列を前から読んでいくための道具。パーサーの各部分が共有する。 */
export class Cursor {
  private index = 0

  constructor(
    private readonly tokens: readonly Token[],
    private readonly reporter: Reporter,
    /** ファイルの終わりを、メッセージの中でどう呼ぶか */
    private readonly eofName: string = "ファイルの終わり",
  ) {}

  peek(offset = 0): Token {
    const last = this.tokens[this.tokens.length - 1] as Token
    return this.tokens[Math.min(this.index + offset, this.tokens.length - 1)] ?? last
  }

  next(): Token {
    const tok = this.peek()
    if (tok.kind !== "eof") this.index += 1
    return tok
  }

  atEof(): boolean {
    return this.peek().kind === "eof"
  }

  isOp(text: string): boolean {
    const tok = this.peek()
    return tok.kind === "op" && tok.text === text
  }

  isKeyword(text: string): boolean {
    const tok = this.peek()
    return tok.kind === "keyword" && tok.text === text
  }

  report(code: DiagnosticCode, range: Range, params: Readonly<Record<string, string>> = {}): void {
    this.reporter.report(code, range, params)
  }

  /** 診断を出すときの位置。改行やファイルの終わりは、直前のトークンを指す。 */
  private rangeOf(tok: Token): Range {
    if (tok.kind !== "nl" && tok.kind !== "eof") return tok.range
    const prev = this.tokens[this.index - 1]
    if (tok.kind === "nl" || prev === undefined) return tok.range
    return prev.kind === "nl" ? (this.tokens[this.index - 2]?.range ?? prev.range) : prev.range
  }

  describe(tok: Token): string {
    if (tok.kind === "nl") return "改行"
    if (tok.kind === "eof") return this.eofName
    if (tok.kind === "string") return "文字列"
    return `「${tok.text}」`
  }

  /** 「X が必要です」の診断を、今のトークンの位置に出す。 */
  expected(expected: string, hint?: string): void {
    const tok = this.peek()
    this.reporter.report("K0101", this.rangeOf(tok), {
      expected,
      found: this.describe(tok),
      ...(hint === undefined ? {} : { hint }),
    })
  }

  expectOp(text: string, hint?: string): Token | undefined {
    if (this.isOp(text)) return this.next()
    this.expected(`「${text}」`, hint)
    return undefined
  }

  /** 文の終わり（改行）を読む。なければ診断を出す。 */
  expectNewline(): boolean {
    if (this.peek().kind === "nl") {
      this.next()
      return true
    }
    const found = this.peek()
    const hint =
      found.kind === "ident" && found.text === "elif"
        ? "Kururi では elif ではなく else if と書きます"
        : "1 行に書く文は 1 つだけです。続きは次の行に書いてください"
    this.expected("改行", hint)
    return false
  }

  skipNewlines(): void {
    while (this.peek().kind === "nl") this.next()
  }

  /**
   * 診断を出したあと、次の文の先頭まで読み飛ばす。
   * { } の中身はまとめて飛ばす。ブロックを閉じる } の手前では止まる。
   */
  recover(): void {
    if (this.isOp("}")) return
    let depth = 0
    while (!this.atEof()) {
      const tok = this.next()
      if (tok.kind === "op" && tok.text === "{") depth += 1
      if (tok.kind === "op" && tok.text === "}") depth = Math.max(0, depth - 1)
      if (tok.kind === "nl" && depth === 0) return
    }
  }

  /**
   * 宣言する名前として使えるか調べる（予約語など）。使えなければ診断を出す。
   * 名前の書き方（スネークケースなど）が決まりに合わないときは、診断を出したうえで読み進める。
   */
  checkDeclName(tok: Token, style: NameStyle = "snake"): boolean {
    if (tok.kind === "keyword") {
      this.report("K0501", tok.range, { name: tok.text })
      return false
    }
    if (tok.kind !== "ident") {
      this.expected("名前")
      return false
    }
    if (BUILTIN_NAMES.has(tok.text)) {
      this.report("K0501", tok.range, { name: tok.text })
      return false
    }
    if (PYTHON_RESERVED.has(tok.text)) {
      this.report("K0502", tok.range, { name: tok.text })
      return false
    }
    const problem = namingProblem(tok.text, style)
    if (problem !== undefined) {
      this.report("K0506", tok.range, { name: tok.text, rule: problem.rule, suggestion: problem.suggestion })
    }
    return true
  }

  /** 補間 ${ } の中のトークン列を、同じ診断の入れ物で別に読む。 */
  parseNested<T>(tokens: readonly Token[], parse: (c: Cursor) => T | undefined): T | undefined {
    const nested = new Cursor(tokens, this.reporter, "「}」")
    const result = parse(nested)
    if (result === undefined) return undefined
    if (!nested.atEof()) {
      nested.expected("「}」")
      return undefined
    }
    return result
  }
}
