import { describe, expect, it } from "vitest"
import { compile } from "../src"

describe("compile (基本)", () => {
  it("空のソースはエラーなしで空の Python を返す", () => {
    const result = compile("")
    expect(result.diagnostics).toEqual([])
    expect(result.python).toBe("")
    expect(result.lineMap).toEqual([])
  })

  it("空白と改行だけのソースも空として扱う", () => {
    const result = compile("  \n\t\n\r\n")
    expect(result.diagnostics).toEqual([])
    expect(result.python).toBe("")
  })

  it("まだ対応していない構文は K0001 を最初の文字に付けて返す", () => {
    const result = compile("function main(): void {\n  return\n}\n")
    expect(result.diagnostics).toHaveLength(1)
    const [d] = result.diagnostics
    expect(d?.code).toBe("K0001")
    expect(d?.severity).toBe("error")
    expect(d?.span.start).toEqual({ offset: 26, line: 2, column: 3 })
    expect(result.python).toBe("")
  })

  it("結果は凍結されている（不変）", () => {
    const result = compile("function main(): void {\n}\n")
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.diagnostics)).toBe(true)
  })
})
