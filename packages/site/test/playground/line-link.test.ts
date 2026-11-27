import { describe, expect, it } from "vitest"
import { kururiLineFor, pythonLinesFor } from "../../src/playground/line-link"

const map = [
  { kururiLine: 1, pythonLine: 1 },
  { kururiLine: 3, pythonLine: 4 },
  { kururiLine: 3, pythonLine: 5 },
]

describe("line-link", () => {
  it("Kururi の行から Python の行を探す", () => {
    expect(pythonLinesFor(3, map)).toEqual([4, 5])
    expect(pythonLinesFor(2, map)).toEqual([])
  })
  it("Python の行から Kururi の行を探す", () => {
    expect(kururiLineFor(5, map)).toBe(3)
    expect(kururiLineFor(2, map)).toBeNull()
  })
})
