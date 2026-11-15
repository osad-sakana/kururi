import { describe, expect, it } from "vitest"
import { formatDiagnostic, formatDiagnostics, displayWidth, positionAt } from "../src/diagnostics"
import type { Diagnostic } from "../src/diagnostics"

function diag(source: string, startOffset: number, endOffset: number, extra: Partial<Diagnostic> = {}): Diagnostic {
  return {
    code: "K0301",
    severity: "error",
    message: "文字列と数値は + でつなげません",
    span: { start: positionAt(source, startOffset), end: positionAt(source, endOffset) },
    ...extra,
  }
}

describe("positionAt", () => {
  it("1 始まりの行・列を返す", () => {
    const src = "ab\ncd"
    expect(positionAt(src, 0)).toEqual({ offset: 0, line: 1, column: 1 })
    expect(positionAt(src, 4)).toEqual({ offset: 4, line: 2, column: 2 })
  })

  it("列は文字（コードポイント）で数える", () => {
    const src = "あい𠮷う"
    expect(positionAt(src, src.indexOf("う")).column).toBe(4)
  })
})

describe("displayWidth", () => {
  it("半角は 1、全角は 2", () => {
    expect(displayWidth("a")).toBe(1)
    expect(displayWidth("あ")).toBe(2)
    expect(displayWidth("漢")).toBe(2)
    expect(displayWidth("ａ")).toBe(2)
  })
})

describe("formatDiagnostic", () => {
  it("位置・抜粋・下線・ヒントを整形する", () => {
    const src = "let a: int = 1\nrow = row + result\n"
    const start = src.indexOf("result")
    const d = diag(src, start, start + "result".length, {
      label: "この値は int です",
      hint: "toString(result) で文字列に変換してください",
    })
    expect(formatDiagnostic(d, { source: src, fileName: "x.kururi" })).toBe(
      [
        "error[K0301]: 文字列と数値は + でつなげません",
        " --> x.kururi:2:13",
        "  |",
        "2 | row = row + result",
        "  |             ^^^^^^ この値は int です",
        "  |",
        "help: toString(result) で文字列に変換してください",
      ].join("\n"),
    )
  })

  it("行番号の桁が増えると枠の幅も増える", () => {
    const src = `${"\n".repeat(9)}abc\n`
    const d = diag(src, 9 + 0 + 1 - 1 + 0 + 0, 9 + 1)
    const out = formatDiagnostic(d, { source: src, fileName: "x.kururi" })
    expect(out).toContain("10 | abc")
    expect(out).toContain("   | ^")
  })

  it("全角文字の分だけ下線の位置をずらす", () => {
    const src = "名前 = 1 + x"
    const start = src.indexOf("x")
    const d = diag(src, start, start + 1)
    const lines = formatDiagnostic(d, { source: src, fileName: "x.kururi" }).split("\n")
    // "名前 = 1 + " は 全角2文字(幅4) + 半角7文字 = 幅 11
    expect(lines[4]).toBe(`  | ${" ".repeat(11)}^`)
  })

  it("ヒントやラベルが無ければ省略する", () => {
    const src = "abc"
    const d = diag(src, 0, 1)
    expect(formatDiagnostic(d, { source: src, fileName: "x.kururi" })).toBe(
      [
        "error[K0301]: 文字列と数値は + でつなげません",
        " --> x.kururi:1:1",
        "  |",
        "1 | abc",
        "  | ^",
      ].join("\n"),
    )
  })

  it("複数行にまたがる範囲は最初の行の末尾までを下線にする", () => {
    const src = "abc\ndef"
    const d = diag(src, 1, 6)
    const lines = formatDiagnostic(d, { source: src, fileName: "x.kururi" }).split("\n")
    expect(lines[4]).toBe("  |  ^^")
  })

  it("警告は warning と表示する", () => {
    const src = "abc"
    const d = diag(src, 0, 1, { severity: "warning" })
    expect(formatDiagnostic(d, { source: src, fileName: "x.kururi" }).startsWith("warning[K0301]")).toBe(true)
  })
})

describe("formatDiagnostics", () => {
  it("複数の診断を空行でつなぎ、件数を末尾に付ける", () => {
    const src = "abc"
    const out = formatDiagnostics([diag(src, 0, 1), diag(src, 1, 2)], { source: src, fileName: "x.kururi" })
    expect(out.split("\n\n")).toHaveLength(3)
    expect(out.endsWith("エラー 2 件")).toBe(true)
  })

  it("診断がなければ空文字を返す", () => {
    expect(formatDiagnostics([], { source: "", fileName: "x.kururi" })).toBe("")
  })
})
