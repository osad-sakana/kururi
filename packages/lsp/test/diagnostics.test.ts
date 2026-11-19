import { describe, expect, it } from "vitest"
import { toLspDiagnostics } from "../src/diagnostics"

describe("toLspDiagnostics", () => {
  it("エラーがなければ空", () => {
    expect(toLspDiagnostics("function main = () {\n    print(1)\n}\n")).toEqual([])
  })

  it("行・列を 0 始まりにして、コードと出どころを付ける", () => {
    const [diagnostic] = toLspDiagnostics("function main = () {\n    println(1)\n}\n")
    expect(diagnostic?.code).toBe("K0201")
    expect(diagnostic?.source).toBe("kururi")
    expect(diagnostic?.severity).toBe(1)
    expect(diagnostic?.range.start).toEqual({ line: 1, character: 4 })
    expect(diagnostic?.range.end).toEqual({ line: 1, character: 11 })
    expect(diagnostic?.message).toContain("print(...)")
  })

  it("絵文字のあとでも列が UTF-16 で数えられる", () => {
    const [diagnostic] = toLspDiagnostics("function main = () {\n    var 😀a: int = \"x\"\n}\n")
    expect(diagnostic).toBeDefined()
    expect(diagnostic!.range.start.character).toBeGreaterThanOrEqual(4)
  })
})
