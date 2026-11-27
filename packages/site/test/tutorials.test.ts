import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { analyze } from "../src/playground/analyze"

const dir = new URL("../src/content/tutorials/", import.meta.url)
const lessons = readdirSync(dir).filter((name) => name.endsWith(".md")).sort()

/** ```kururi ... ``` のコードブロックを取り出す */
function kururiBlocks(markdown: string): string[] {
  return [...markdown.matchAll(/```kururi\n([\s\S]*?)```/g)].map((match) => match[1] ?? "")
}

describe("チュートリアルのコード", () => {
  it("8 回ぶんある", () => {
    expect(lessons.length).toBe(8)
  })

  for (const lesson of lessons) {
    const blocks = kururiBlocks(readFileSync(new URL(lesson, dir), "utf8"))
    it(`${lesson}: Kururi のコードがあり、すべて警告もなく変換できる`, () => {
      expect(blocks.length).toBeGreaterThan(0)
      for (const block of blocks) {
        const result = analyze(block)
        expect(result.errorText, block).toBe("")
        expect(result.python, block).not.toBe("")
      }
    })
  }
})

describe("チュートリアルが「エラーになる」と書いていること", () => {
  const main = (body: string) => `function main = () {\n${body}\n}\n`
  const errorsOf = (source: string) => analyze(source).markers.filter((m) => m.severity === "error").map((m) => m.code)

  it("整数の変数に文字列を入れる（第 2 回）", () => {
    expect(errorsOf(main('    var count: int = "three"\n    print(count)'))).toContain("K0301")
  })

  it("const への代入（第 2 回）", () => {
    expect(errorsOf(main("    const AGE: int = 1\n    AGE = AGE + 1")).length).toBeGreaterThan(0)
  })

  it("条件が boolean でない（第 3 回）", () => {
    expect(errorsOf(main("    var x: int = 1\n    if x {\n        print(1)\n    }")).length).toBeGreaterThan(0)
    expect(errorsOf(main("    var x: int = 1\n    if x = 1 {\n        print(1)\n    }")).length).toBeGreaterThan(0)
  })

  it("private のフィールドを外から触る（第 7 回）", () => {
    const source = "class C = {\n    fields = {\n        private count: int = 0\n    }\n}\nfunction main = () {\n    var c: C = new C()\n    c.count = 100\n}\n"
    expect(errorsOf(source)).toContain("K0401")
  })

  it("T? を確かめずに使う（第 8 回）", () => {
    const source = "function f = () -> string? {\n    return null\n}\nfunction main = () {\n    var name: string? = f()\n    print(name.length)\n}\n"
    expect(errorsOf(source).length).toBeGreaterThan(0)
  })

  it("かっこを閉じ忘れる（第 1 回）", () => {
    expect(errorsOf(main('    print("こんにちは"')).length).toBeGreaterThan(0)
  })

  it("int[] に文字を入れる（第 6 回）", () => {
    expect(errorsOf(main('    var xs: int[] = [1]\n    xs.push("a")')).length).toBeGreaterThan(0)
  })
})
