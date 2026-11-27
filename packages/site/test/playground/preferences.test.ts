import { describe, expect, it } from "vitest"
import { FONT_SIZE, clampFontSize, nextThemePreference, resolveTheme } from "../../src/playground/preferences"

describe("clampFontSize", () => {
  it("範囲に収め、整数にする", () => {
    expect(clampFontSize(3)).toBe(FONT_SIZE.min)
    expect(clampFontSize(99)).toBe(FONT_SIZE.max)
    expect(clampFontSize(13.4)).toBe(13)
  })
  it("数でない値は初期値に戻す", () => {
    expect(clampFontSize(Number.NaN)).toBe(FONT_SIZE.initial)
  })
})

describe("theme", () => {
  it("自動 → ライト → ダーク → 自動 と切り替わる", () => {
    expect(nextThemePreference("system")).toBe("light")
    expect(nextThemePreference("light")).toBe("dark")
    expect(nextThemePreference("dark")).toBe("system")
  })
  it("自動のときだけ OS の明暗に従う", () => {
    expect(resolveTheme("system", true)).toBe("dark")
    expect(resolveTheme("system", false)).toBe("light")
    expect(resolveTheme("light", true)).toBe("light")
    expect(resolveTheme("dark", false)).toBe("dark")
  })
})
