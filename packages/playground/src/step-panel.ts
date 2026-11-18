import type { LineMapping } from "@kururi/compiler"
import type { TraceResult } from "./trace-types"
import { kururiLineOf } from "./runtime"
import { createStepper, kururiFunctionName, type Stepper } from "./stepper"

export interface StepPanelHooks {
  /** 今の行を、エディタ（Kururi）と Python 欄で強調する。null で消す */
  readonly highlight: (kururiLine: number | null, pythonLine: number | null) => void
  /** 出力を、この行数までに絞って見せる。null で元に戻す */
  readonly showOutput: (lines: number | null) => void
}

export interface StepPanel {
  readonly open: (trace: TraceResult, lineMap: readonly LineMapping[]) => boolean
  readonly close: () => void
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const element = document.createElement("button")
  element.type = "button"
  element.textContent = label
  element.addEventListener("click", onClick)
  return element
}

/** ステップ実行の操作盤：進む・戻る、いまの行、変数の一覧。 */
export function createStepPanel(root: HTMLElement, hooks: StepPanelHooks): StepPanel {
  const info = document.createElement("div")
  info.className = "step-info"
  const table = document.createElement("table")
  table.className = "step-vars"
  const note = document.createElement("div")
  note.className = "step-note"

  let stepper: Stepper | null = null
  let lineMap: readonly LineMapping[] = []

  function render(): void {
    if (stepper === null) return
    const { current, index, count, canBack, canForward } = stepper
    const kururiLine = kururiLineOf(current.line, lineMap)
    hooks.highlight(kururiLine, current.line)
    hooks.showOutput(current.out)
    info.textContent = `${index + 1} / ${count}　${kururiFunctionName(current.fn)}${kururiLine === null ? "" : `　${kururiLine} 行目`}（この行を実行する前）`
    const head = document.createElement("tr")
    for (const title of ["変数", "型", "値"]) {
      const cell = document.createElement("th")
      cell.textContent = title
      head.append(cell)
    }
    const rows = current.vars.map(([name, type, value]) => {
      const row = document.createElement("tr")
      for (const text of [name, type, value]) {
        const cell = document.createElement("td")
        cell.textContent = text
        row.append(cell)
      }
      return row
    })
    table.replaceChildren(head, ...rows)
    table.hidden = rows.length === 0
    for (const element of root.querySelectorAll<HTMLButtonElement>("[data-back]")) element.disabled = !canBack
    for (const element of root.querySelectorAll<HTMLButtonElement>("[data-forward]")) element.disabled = !canForward
  }

  function move(change: (current: Stepper) => Stepper): void {
    if (stepper === null) return
    stepper = change(stepper)
    render()
  }

  const controls = document.createElement("div")
  controls.className = "step-controls"
  const first = button("最初へ", () => move((s) => s.first()))
  const back = button("戻る", () => move((s) => s.back()))
  const forward = button("進む", () => move((s) => s.forward()))
  const last = button("最後へ", () => move((s) => s.last()))
  first.dataset.back = back.dataset.back = ""
  forward.dataset.forward = last.dataset.forward = ""
  const closeButton = button("閉じる", () => panel.close())
  closeButton.className = "step-close"
  controls.append(first, back, forward, last, closeButton)
  root.append(controls, info, table, note)

  // ←→ キーでも進める
  root.tabIndex = 0
  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") move((s) => s.forward())
    else if (event.key === "ArrowLeft") move((s) => s.back())
    else return
    event.preventDefault()
  })

  const panel: StepPanel = {
    open(trace, map) {
      if (trace.steps.length === 0) return false
      lineMap = map
      stepper = createStepper(trace.steps)
      note.textContent = trace.truncated ? "記録できる上限（3000 ステップ）に達したので、途中までです。" : ""
      root.hidden = false
      render()
      root.focus()
      return true
    },
    close() {
      stepper = null
      root.hidden = true
      hooks.highlight(null, null)
      hooks.showOutput(null)
    },
  }
  return panel
}
