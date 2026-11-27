import { describe, expect, it } from "vitest"
import { analyze } from "../../src/playground/analyze"
import { SAMPLES } from "../../src/playground/samples"

describe("SAMPLES", () => {
  it("id が重ならない", () => {
    expect(new Set(SAMPLES.map((sample) => sample.id)).size).toBe(SAMPLES.length)
  })

  for (const sample of SAMPLES) {
    it(`${sample.title} はエラーなく変換できる`, () => {
      const result = analyze(sample.source)
      expect(result.errorText).toBe("")
      expect(result.python).not.toBe("")
    })
  }
})
