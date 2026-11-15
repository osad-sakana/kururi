import { describe, expect, it } from "vitest"
import { lex } from "../../src/syntax/lexer"

function texts(source: string): string[] {
  return lex(source).tokens.map((t) => (t.kind === "nl" ? "NL" : t.kind === "eof" ? "EOF" : t.text))
}

function codes(source: string): string[] {
  return lex(source).diagnostics.map((d) => d.code)
}

describe("lex: 基本のトークン", () => {
  it("宣言を分解する", () => {
    expect(texts("let a: int = 1")).toEqual(["let", "a", ":", "int", "=", "1", "NL", "EOF"])
  })

  it("空のソースは EOF だけ", () => {
    expect(texts("")).toEqual(["EOF"])
    expect(texts("  \n\n ")).toEqual(["EOF"])
  })

  it("2 文字の演算子を 1 つにまとめる", () => {
    expect(texts("a == b != c <= d >= e")).toEqual([
      "a", "==", "b", "!=", "c", "<=", "d", ">=", "e", "NL", "EOF",
    ])
  })

  it("整数と小数を区別する", () => {
    const kinds = lex("0 12 3.5").tokens.map((t) => t.kind)
    expect(kinds).toEqual(["int", "int", "float", "nl", "eof"])
  })

  it("日本語の識別子を使える", () => {
    const result = lex("let 合計: int = 1")
    expect(result.diagnostics).toEqual([])
    expect(result.tokens[1]?.kind).toBe("ident")
    expect(result.tokens[1]?.text).toBe("合計")
  })

  it("キーワードは keyword になる", () => {
    expect(lex("true and not").tokens.map((t) => t.kind)).toEqual([
      "keyword", "keyword", "keyword", "nl", "eof",
    ])
  })

  it("コメントを読み飛ばす", () => {
    expect(texts("a // 行コメント\n/* 複数行\nコメント */ b")).toEqual(["a", "NL", "b", "NL", "EOF"])
  })
})

describe("lex: 改行の規則", () => {
  it("連続する改行は 1 つにまとめ、先頭の改行は捨てる", () => {
    expect(texts("\n\na\n\n\nb")).toEqual(["a", "NL", "b", "NL", "EOF"])
  })

  it("行末の二項演算子・カンマ・ドットでは次の行へ続く", () => {
    expect(texts("a +\nb")).toEqual(["a", "+", "b", "NL", "EOF"])
    expect(texts("a and\nb")).toEqual(["a", "and", "b", "NL", "EOF"])
    expect(texts("f(a,\nb)")).toEqual(["f", "(", "a", ",", "b", ")", "NL", "EOF"])
    expect(texts("a.\nb")).toEqual(["a", ".", "b", "NL", "EOF"])
  })

  it("行頭の演算子は新しい文になる", () => {
    expect(texts("a\n+ b")).toEqual(["a", "NL", "+", "b", "NL", "EOF"])
  })

  it("括弧の中の改行は無視する", () => {
    expect(texts("f(\n  a\n  + b\n)")).toEqual(["f", "(", "a", "+", "b", ")", "NL", "EOF"])
  })

  it("} の直前に改行がなければ補う", () => {
    expect(texts("{ a }")).toEqual(["{", "a", "NL", "}", "NL", "EOF"])
    expect(texts("{ }")).toEqual(["{", "}", "NL", "EOF"])
  })

  it("} と else / elseif のあいだの改行は捨てる", () => {
    expect(texts("}\nelse {")).toEqual(["}", "else", "{", "NL", "EOF"])
    expect(texts("}\nelseif x {")).toEqual(["}", "elseif", "x", "{", "NL", "EOF"])
    expect(texts("}\nlet")).toEqual(["}", "NL", "let", "NL", "EOF"])
  })

  it("CRLF も改行として扱う", () => {
    expect(texts("a\r\nb")).toEqual(["a", "NL", "b", "NL", "EOF"])
  })
})

describe("lex: 文字列", () => {
  it("エスケープを解釈する", () => {
    const token = lex(String.raw`"a\"b\\c\nd\te"`).tokens[0]
    expect(token?.kind).toBe("string")
    expect(token?.value).toBe('a"b\\c\nd\te')
  })

  it("未知のエスケープは K0104", () => {
    expect(codes(String.raw`"a\qb"`)).toEqual(["K0104"])
  })

  it("閉じていない文字列は K0102", () => {
    expect(codes('"abc')).toEqual(["K0102"])
    expect(codes('"abc\nlet')).toEqual(["K0102"])
  })

  it("閉じていないコメントは K0102", () => {
    expect(codes("/* abc")).toEqual(["K0102"])
  })
})

describe("lex: 文字列補間", () => {
  it("文字と式に分ける", () => {
    const token = lex("`a ${x + 1} b`").tokens[0]
    expect(token?.kind).toBe("template")
    const parts = token?.parts ?? []
    expect(parts.map((p) => p.kind)).toEqual(["text", "expr", "text"])
    expect(parts[0]?.kind === "text" && parts[0].value).toBe("a ")
    const expr = parts[1]
    expect(expr?.kind === "expr" && expr.tokens.map((t) => t.text)).toEqual(["x", "+", "1", ""])
  })

  it("{ } と エスケープを文字として書ける", () => {
    const token = lex("`{x} \\` \\${y}`").tokens[0]
    const parts = token?.parts ?? []
    expect(parts).toHaveLength(1)
    expect(parts[0]?.kind === "text" && parts[0].value).toBe("{x} ` ${y}")
  })

  it("補間の中に補間を入れられる", () => {
    const result = lex("`a ${`b ${c}`} d`")
    expect(result.diagnostics).toEqual([])
    expect(result.tokens[0]?.kind).toBe("template")
  })

  it("閉じていない補間は K0102", () => {
    expect(codes("`abc")).toEqual(["K0102"])
    expect(codes("`a ${b")).toEqual(["K0102"])
  })
})

describe("lex: 診断", () => {
  it("先頭が 0 の整数は K0105", () => {
    expect(codes("007")).toEqual(["K0105"])
  })

  it("使えない文字は K0103（! と ; と && には案内を付ける）", () => {
    const result = lex("a ! b; c && d @")
    expect(result.diagnostics.map((d) => d.code)).toEqual(["K0103", "K0103", "K0103", "K0103"])
    expect(result.diagnostics[0]?.hint).toContain("not")
    expect(result.diagnostics[1]?.hint).toContain("改行")
    expect(result.diagnostics[2]?.hint).toContain("and")
  })

  it("__ で始まる識別子は K0504", () => {
    expect(codes("__x")).toEqual(["K0504"])
  })

  it("NFKC で形が変わる文字は K0505", () => {
    expect(codes("ｘ")).toEqual(["K0505"])
    expect(codes("ｱ")).toEqual(["K0505"])
  })
})
