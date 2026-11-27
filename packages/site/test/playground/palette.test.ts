import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { DARK_PALETTE, LIGHT_PALETTE, toCssVarName, type Palette } from "../../src/playground/palette"

const css = readFileSync(new URL("../../src/styles/tokens.css", import.meta.url), "utf8")

function variablesIn(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/(--color-[a-z-]+):\s*(#[0-9a-fA-F]+);/g)].map((m) => [m[1], m[2]]))
}

function expectMatches(palette: Palette, vars: Record<string, string>): void {
  for (const [key, value] of Object.entries(palette)) expect(vars[toCssVarName(key)], key).toBe(value)
}

describe("palette", () => {
  it("style.css（ダーク）と palette.ts が同じ値を持つ", () => {
    expectMatches(DARK_PALETTE, variablesIn(css.slice(0, css.indexOf("@media"))))
  })

  it("style.css（ライト）と palette.ts が同じ値を持つ", () => {
    const start = css.indexOf("@media (prefers-color-scheme: light)")
    expectMatches(LIGHT_PALETTE, variablesIn(css.slice(start)))
  })

  it("キー名を CSS 変数名に変える", () => {
    expect(toCssVarName("codeKeyword")).toBe("--color-code-keyword")
  })
})
