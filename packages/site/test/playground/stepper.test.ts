import { describe, expect, it } from "vitest"
import type { TraceStep } from "../../src/playground/trace-types"
import { createStepper, kururiFunctionName } from "../../src/playground/stepper"

const step = (line: number): TraceStep => ({ line, fn: "main", vars: [], out: 0 })
const steps = [step(1), step(2), step(3)]

describe("createStepper", () => {
  it("進む・戻る・最初・最後に動ける", () => {
    const s = createStepper(steps)
    expect(s.index).toBe(0)
    expect(s.canBack).toBe(false)
    expect(s.forward().forward().current.line).toBe(3)
    expect(s.forward().forward().canForward).toBe(false)
    expect(s.last().back().index).toBe(1)
    expect(s.last().first().index).toBe(0)
  })

  it("端を越えては動かない", () => {
    expect(createStepper(steps).back().index).toBe(0)
    expect(createStepper(steps).last().forward().index).toBe(2)
  })

  it("ステップが空なら例外", () => {
    expect(() => createStepper([])).toThrow()
  })
})

describe("kururiFunctionName", () => {
  it("__init__ は constructor、モジュールは「最初」", () => {
    expect(kururiFunctionName("__init__")).toBe("constructor")
    expect(kururiFunctionName("<module>")).toBe("最初")
    expect(kururiFunctionName("add")).toBe("add")
  })
})
