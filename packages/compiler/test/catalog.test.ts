import { describe, expect, it } from "vitest"
import { DIAGNOSTIC_CATALOG, categoryOf, createDiagnostic } from "../src/diagnostics"
import type { Span } from "../src/diagnostics"

const span: Span = {
  start: { offset: 0, line: 1, column: 1 },
  end: { offset: 1, line: 1, column: 2 },
}

describe("診断カタログ", () => {
  it("すべてのコードが K + 4 桁で、キーと code が一致する", () => {
    for (const [key, entry] of Object.entries(DIAGNOSTIC_CATALOG)) {
      expect(key).toMatch(/^K\d{4}$/)
      expect(entry.code).toBe(key)
    }
  })

  it("コードの上位 2 桁からカテゴリを引ける", () => {
    expect(categoryOf("K0001")).toBe("internal")
    expect(categoryOf("K0102")).toBe("syntax")
    expect(categoryOf("K0201")).toBe("name")
    expect(categoryOf("K0301")).toBe("type")
    expect(categoryOf("K0401")).toBe("class")
    expect(categoryOf("K0501")).toBe("reserved")
  })

  it("カタログのコードはカテゴリが決まっている", () => {
    for (const code of Object.keys(DIAGNOSTIC_CATALOG)) {
      expect(categoryOf(code as keyof typeof DIAGNOSTIC_CATALOG)).not.toBe("unknown")
    }
  })
})

describe("createDiagnostic", () => {
  it("カタログの雛形から診断を作る", () => {
    const d = createDiagnostic("K0001", span, { text: "let" })
    expect(d.code).toBe("K0001")
    expect(d.severity).toBe("error")
    expect(d.message).toContain("let")
    expect(d.span).toEqual(span)
  })

  it("作った診断は凍結されている（不変）", () => {
    const d = createDiagnostic("K0001", span, { text: "let" })
    expect(Object.isFrozen(d)).toBe(true)
  })
})
