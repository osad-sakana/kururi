import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { analyze } from "../src/playground/analyze"

const dir = new URL("../src/content/tutorials/", import.meta.url)
const chapters = readdirSync(dir).filter((name) => name.endsWith(".md")).sort()

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

describe("チュートリアルの章（N-M）", () => {
  it("全部で 6 部・20 章ある（1: 4 章、2: 4 章、3: 3 章、4: 3 章、5: 2 章、6: 4 章）", () => {
    const count = (part: number): number => chapters.filter((name) => name.startsWith(`${part}-`)).length
    expect([1, 2, 3, 4, 5, 6].map(count)).toEqual([4, 4, 3, 3, 2, 4])
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
