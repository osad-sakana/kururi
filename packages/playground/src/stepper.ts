import type { TraceStep } from "./trace-types"

export interface Stepper {
  readonly count: number
  readonly index: number
  readonly current: TraceStep
  readonly canBack: boolean
  readonly canForward: boolean
  readonly first: () => Stepper
  readonly back: () => Stepper
  readonly forward: () => Stepper
  readonly last: () => Stepper
}

/** 記録した途中経過を、行き来するための状態（変更せず、新しい状態を返す）。steps は 1 つ以上必要。 */
export function createStepper(steps: readonly TraceStep[], index = 0): Stepper {
  if (steps.length === 0) throw new Error("ステップがありません")
  const at = Math.min(steps.length - 1, Math.max(0, index))
  const current = steps[at] as TraceStep
  return {
    count: steps.length,
    index: at,
    current,
    canBack: at > 0,
    canForward: at < steps.length - 1,
    first: () => createStepper(steps, 0),
    back: () => createStepper(steps, at - 1),
    forward: () => createStepper(steps, at + 1),
    last: () => createStepper(steps, steps.length - 1),
  }
}

/** Python の関数名を、Kururi での呼び名に直す（`__init__` → constructor） */
export function kururiFunctionName(pythonName: string): string {
  if (pythonName === "<module>") return "最初"
  return pythonName === "__init__" ? "constructor" : pythonName
}
