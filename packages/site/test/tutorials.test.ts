import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { analyze } from "../src/playground/analyze"

const dir = new URL("../src/content/tutorials/", import.meta.url)
const all = readdirSync(dir).filter((name) => name.endsWith(".md")).sort()
/** 新しい構成の章（1-1-…）と、これまでの回（01-…）*/
const chapters = all.filter((name) => /^\d+-\d+-/.test(name))
const lessons = all.filter((name) => !/^\d+-\d+-/.test(name))

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

// ---- 新しい構成の章（N-M）----

type Kind = "ok" | "error" | "warning"

/** ```kururi（そのまま動く）・```kururi-error K0101（エラーになる）・```kururi-warning K0604（警告が出る） */
function chapterBlocks(markdown: string): { kind: Kind; code: string | undefined; source: string }[] {
  return [...markdown.matchAll(/```kururi(?:-(error|warning))?(?: (K\d{4}))?\n([\s\S]*?)```/g)].map((match) => ({
    kind: (match[1] ?? "ok") as Kind,
    code: match[2],
    source: match[3] ?? "",
  }))
}

/** main がない断片は、完全なプログラムにする */
function complete(source: string): string {
  return /^\s*function main\b/m.test(source) ? source : `function main = () {\n${source}\n}\n`
}

/** 章の本文の見出し。この順番で、すべて書く */
const SECTIONS = ["なぜ必要か", "やってみる", "しくみ", "広げてみる", "わざと間違える", "まとめ", "練習", "つぎへ"]

describe("新しい構成の章（N-M）", () => {
  it("第 1 部は 4 章ある", () => {
    expect(chapters.filter((name) => name.startsWith("1-")).length).toBe(4)
  })

  for (const chapter of chapters) {
    const markdown = readFileSync(new URL(chapter, dir), "utf8")

    it(`${chapter}: 決まった見出しが、この順番で並んでいる`, () => {
      const headings = [...markdown.matchAll(/^## (.+)$/gm)].map((match) => match[1])
      expect(headings).toEqual(SECTIONS)
    })

    it(`${chapter}: コードブロックが、種類のとおりに動く`, () => {
      const blocks = chapterBlocks(markdown)
      expect(blocks.length).toBeGreaterThan(0)
      for (const block of blocks) {
        const result = analyze(complete(block.source))
        const errors = result.markers.filter((m) => m.severity === "error").map((m) => m.code)
        const warnings = result.markers.filter((m) => m.severity !== "error").map((m) => m.code)
        if (block.kind === "ok") expect(errors, block.source).toEqual([])
        if (block.kind === "error") {
          expect(errors.length, block.source).toBeGreaterThan(0)
          if (block.code !== undefined) expect(errors, block.source).toContain(block.code)
        }
        if (block.kind === "warning") {
          expect(errors, block.source).toEqual([])
          expect(warnings, block.source).toContain(block.code)
        }
      }
    })

    it(`${chapter}: 練習の答えが、折りたたまれている`, () => {
      expect(markdown).toMatch(/<details>\s*<summary>答えの例<\/summary>/)
    })
  }
})
