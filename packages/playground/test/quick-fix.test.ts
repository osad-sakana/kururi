import { describe, expect, it } from "vitest"
import { analyze } from "../src/analyze"
import { applyFix, renameIdentifier } from "../src/quick-fix"

describe("renameIdentifier", () => {
  it("名前だけを置き換え、文字列とコメントは変えない", () => {
    const source = 'var someValue: int = 1\n// someValue\noutput("someValue")\noutput(someValue)\n'
    expect(renameIdentifier(source, "someValue", "some_value")).toBe('var some_value: int = 1\n// someValue\noutput("someValue")\noutput(some_value)\n')
  })

  it("テンプレート文字列は、文字の部分は変えず、${ } の中だけ置き換える", () => {
    expect(renameIdentifier("output(`someValue ${someValue}`)", "someValue", "some_value")).toBe("output(`someValue ${some_value}`)")
  })

  it("別の名前の一部は変えない", () => {
    expect(renameIdentifier("someValue2 = someValue", "someValue", "x")).toBe("someValue2 = x")
  })
})

describe("applyFix", () => {
  it("診断の直し方を当てると、そのエラーがなくなる", () => {
    const sources = [
      "function main = () {\n    let x: int = 1\n    output(x)\n}\n",
      "function main = () {\n    var someValue: int = 1\n    output(someValue)\n}\n",
      "function main = () {\n    var count: int = 0\n    count++\n}\n",
      "function main = () {\n    var a: boolean = true && false\n}\n",
    ]
    for (const source of sources) {
      const marker = analyze(source).markers.find((m) => m.fix !== undefined)
      expect(marker, source).toBeDefined()
      const fixed = applyFix(source, marker!, marker!.fix!)
      expect(analyze(fixed).errorCount, fixed).toBe(0)
    }
  })
})
