import { describe, expect, it } from "vitest"
import { compile } from "@kururi/compiler"
import { analyze } from "../../src/playground/analyze"
import { applyFix, renameIdentifier } from "../../src/playground/quick-fix"

describe("renameIdentifier", () => {
  it("名前だけを置き換え、文字列とコメントは変えない", () => {
    const source = 'var someValue: int = 1\n// someValue\noutput("someValue")\noutput(someValue)\n'
    expect(renameIdentifier(source, "someValue", "some_value")).toBe('var some_value: int = 1\n// someValue\noutput("someValue")\noutput(some_value)\n')
  })

  it("文字列の補間は、文字の部分は変えず、${ } の中だけ置き換える", () => {
    expect(renameIdentifier('print("someValue ${someValue}")', "someValue", "some_value")).toBe('print("someValue ${some_value}")')
  })

  it("補間の中の文字列と、そのあとの文字列も正しく読む", () => {
    expect(renameIdentifier('print("a ${f("someValue")} someValue") someValue', "someValue", "x")).toBe('print("a ${f("someValue")} someValue") x')
  })

  it("別の名前の一部は変えない", () => {
    expect(renameIdentifier("someValue2 = someValue", "someValue", "x")).toBe("someValue2 = x")
  })
})

describe("applyFix", () => {
  it("診断の直し方を当てると、そのエラーがなくなる", () => {
    const sources = [
      "function main = () {\n    let x: int = 1\n    print(x)\n}\n",
      "function main = () {\n    var someValue: int = 1\n    print(someValue)\n}\n",
      "function main = () {\n    var count: int = 0\n    count++\n}\n",
      "function main = () {\n    var is_a: boolean = true && false\n}\n",
    ]
    for (const source of sources) {
      const marker = analyze(source).markers.find((m) => m.fix !== undefined)
      expect(marker, source).toBeDefined()
      const fixed = applyFix(source, marker!, marker!.fix!)
      expect(analyze(fixed).errorCount, fixed).toBe(0)
    }
  })
})

describe("比較の連鎖（K0106）の直し方", () => {
  it("a < b < c を a < b and b < c にする", () => {
    const source = "function main = () {\n    var b: int = 2\n    print(1 < b < 3)\n}\n"
    const diagnostic = compile(source).diagnostics[0]
    expect(diagnostic?.code).toBe("K0106")
    const fix = diagnostic?.fix
    const span = diagnostic?.span
    if (fix === undefined || span === undefined) throw new Error("直し方がありません")
    const range = { startLineNumber: span.start.line, startColumn: span.start.column, endLineNumber: span.end.line, endColumn: span.end.column }
    const fixed = applyFix(source, range, fix)
    expect(fixed).toContain("print(1 < b and b < 3)")
    expect(compile(fixed).diagnostics).toEqual([])
  })
})
