import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { analyze } from "../src/playground/analyze"

const dir = new URL("../src/content/spec/", import.meta.url)
const pages = readdirSync(dir).filter((name) => name.endsWith(".md")).sort()

type Kind = "ok" | "error" | "warning"
interface Block {
  readonly kind: Kind
  readonly code: string | undefined
  readonly source: string
}

/** ```kururi（そのまま動く）・```kururi-error K0301（エラーになる）・```kururi-warning K0603（警告が出る）を取り出す */
function blocksOf(markdown: string): Block[] {
  return [...markdown.matchAll(/```kururi(?:-(error|warning))?(?: (K\d{4}))?\n([\s\S]*?)```/g)].map((match) => ({
    kind: (match[1] ?? "ok") as Kind,
    code: match[2],
    source: match[3] ?? "",
  }))
}

/** main がない断片は、完全なプログラムにする（宣言だけなら空の main を足し、文なら main で包む） */
function complete(source: string): string {
  if (/^function main\b/m.test(source)) return source
  const topLevel = source
    .split("\n")
    .filter((line) => /^\S/.test(line) && !line.startsWith("//") && !line.startsWith("/*") && !line.startsWith("}"))
    .every((line) => /^(function|class|var|const)\b/.test(line))
  if (topLevel) return `${source}\nfunction main = () {\n}\n`
  return `function main = () {\n${source}\n}\n`
}

describe("言語仕様のコード", () => {
  it("11 ページある", () => {
    expect(pages.length).toBe(11)
  })

  for (const page of pages) {
    const blocks = blocksOf(readFileSync(new URL(page, dir), "utf8"))
    it(`${page}: コードブロックの種類どおりに動く`, () => {
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
  }
})
