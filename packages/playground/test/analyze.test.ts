import { describe, expect, it, vi } from "vitest"
import { analyze, debounce, narapyUrl } from "../src/analyze"
import { monarchDefinition } from "../src/language"
import { SAMPLE } from "../src/sample"

describe("analyze", () => {
  it("エラーがなければ Python を返し、印は空", () => {
    const result = analyze('function main = () {\n    print("こんにちは")\n}\n')
    expect(result.errorCount).toBe(0)
    expect(result.markers).toEqual([])
    expect(result.python).toContain("print")
  })

  it("エラーは行・列つきの印になる", () => {
    const result = analyze("function main = () {\n    var x: int = 1\n    var x: int = 2\n}\n")
    expect(result.errorCount).toBeGreaterThan(0)
    const [marker] = result.markers
    expect(marker?.startLineNumber).toBe(3)
    expect(marker?.severity).toBe("error")
    expect(marker?.code).toMatch(/^K\d{4}$/)
    expect(marker?.message.length).toBeGreaterThan(0)
  })

  it("全角文字・絵文字のあとでも列が UTF-16 でずれない", () => {
    const result = analyze('function main = () {\n    var 😀a: int = 1\n}\n')
    const marker = result.markers[0]
    expect(marker).toBeDefined()
    expect(marker!.endColumn).toBeGreaterThan(marker!.startColumn)
    expect(marker!.endColumn).toBeLessThanOrEqual('    var 😀a: int = 1'.length + 2)
  })

  it("変換できないときは、Python 欄に出すエラーの文章を返す", () => {
    const bad = analyze("function main = () {\n    println(1)\n}\n")
    expect(bad.errorText).toContain("K0201")
    expect(bad.errorText).toContain("main.kururi")
    expect(analyze("function main = () {\n}\n").errorText).toBe("")
  })

  it("同梱のサンプルはエラーなく変換できる", () => {
    expect(analyze(SAMPLE).errorCount).toBe(0)
  })
})

describe("narapyUrl", () => {
  it("正常なら narapy の URL", () => {
    const source = 'function main = () {\n    print("hi")\n}\n'
    expect(narapyUrl(source, analyze(source))).toMatch(/#project=/)
  })

  it("エラー中・空のときは null", () => {
    const bad = "function main = () {\n    var x: int = \n}\n"
    expect(narapyUrl(bad, analyze(bad))).toBeNull()
    expect(narapyUrl("", analyze(""))).toBeNull()
  })
})

describe("debounce", () => {
  it("連続呼び出しを 1 回にまとめる", () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const run = debounce(fn, 100)
    run(1)
    run(2)
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(2)
    vi.useRealTimers()
  })
})

describe("monarchDefinition", () => {
  it("キーワード・型・定数・組み込みを分けて持つ", () => {
    const def = monarchDefinition()
    expect(def.keywords).toContain("function")
    expect(def.keywords).not.toContain("int")
    expect(def.typeKeywords).toContain("int")
    expect(def.constants).toContain("null")
    expect(def.builtins).toContain("print")
  })
})
