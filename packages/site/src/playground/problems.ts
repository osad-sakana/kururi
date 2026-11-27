import type { EditorMarker } from "./analyze"

export interface ProblemHooks {
  /** その問題の位置へ移る */
  readonly jump: (marker: EditorMarker) => void
  /** 直し方を当てる */
  readonly fix: (marker: EditorMarker) => void
}

/** 問題の一覧（行・メッセージ・直し方・「直す」ボタン）。問題がないときは隠す。 */
export function renderProblems(list: HTMLElement, markers: readonly EditorMarker[], hooks: ProblemHooks): void {
  list.hidden = markers.length === 0
  list.replaceChildren(
    ...markers.map((marker) => {
      const item = document.createElement("li")
      item.className = marker.severity === "error" ? "problem error" : "problem warning"
      const where = document.createElement("button")
      where.type = "button"
      where.className = "problem-where"
      where.textContent = `${marker.startLineNumber} 行目　${marker.code}`
      where.addEventListener("click", () => hooks.jump(marker))
      const [message = "", ...rest] = marker.message.split("\n")
      const text = document.createElement("div")
      text.className = "problem-text"
      const title = document.createElement("div")
      title.textContent = message
      text.append(title)
      if (rest.length > 0) {
        const help = document.createElement("div")
        help.className = "problem-help"
        help.textContent = rest.join("\n")
        text.append(help)
      }
      item.append(where, text)
      if (marker.fix !== undefined) {
        const fix = document.createElement("button")
        fix.type = "button"
        fix.className = "problem-fix"
        fix.textContent = marker.fix.title
        fix.addEventListener("click", () => hooks.fix(marker))
        item.append(fix)
      }
      return item
    }),
  )
}
