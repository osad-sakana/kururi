import type { EditorMarker } from "./analyze"
import { problemView } from "./problem-view"
import type { ProblemView } from "./problem-view"

export interface ProblemHooks {
  /** その問題の位置へ移る */
  readonly jump: (marker: EditorMarker) => void
  /** 直し方を当てる */
  readonly fix: (marker: EditorMarker) => void
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const created = document.createElement(tag)
  if (className !== undefined) created.className = className
  if (text !== undefined) created.textContent = text
  return created
}

/** 行番号つきの 1 行（コードの抜粋の部品） */
function codeLine(number: number, content: Node | string, className = "ex-line"): HTMLElement {
  const row = element("div", className)
  row.append(element("span", "ex-no", String(number)), element("span", "ex-code"))
  const code = row.querySelector(".ex-code")
  if (code !== null) code.append(content)
  return row
}

/** エラーの行と、その前の行を抜き出し、間違った所に印を付ける。下の線は、見えない同じ文字で位置をそろえる（日本語の幅に左右されない）。 */
function excerpt(view: ProblemView): HTMLElement {
  const box = element("div", "excerpt")
  const { previous, line: target } = view
  if (previous !== undefined) box.append(codeLine(previous.no, previous.text, "ex-line ex-dim"))

  const line = document.createDocumentFragment()
  line.append(target.before, Object.assign(element("span", "ex-hl"), { textContent: target.range === "" ? "\u00a0" : target.range }), target.after)
  box.append(codeLine(target.no, line))

  const under = document.createDocumentFragment()
  const ghost = element("span", "ex-ghost", target.before)
  ghost.setAttribute("aria-hidden", "true")
  const mark = element("span", "ex-under", target.range === "" ? "\u00a0" : target.range)
  under.append(ghost, mark)
  if (view.label !== undefined) under.append(element("span", "ex-label", ` ${view.label}`))
  const underRow = codeLine(0, under, "ex-line ex-underline")
  const no = underRow.querySelector(".ex-no")
  if (no !== null) no.textContent = ""
  box.append(underRow)
  return box
}

/** 問題の一覧。1 件ずつ、見出し・場所・コードの抜粋・直し方を、カードで見せる。問題がないときは隠す。 */
export function renderProblems(list: HTMLElement, markers: readonly EditorMarker[], hooks: ProblemHooks, lines: readonly string[]): void {
  list.hidden = markers.length === 0
  list.replaceChildren(
    ...markers.map((marker) => {
      const view = problemView(marker, lines)
      const item = element("li", marker.severity === "error" ? "problem error" : "problem warning")

      const head = element("div", "problem-head")
      const code = element("button", "problem-code", view.code)
      code.type = "button"
      code.title = "この位置へ移る"
      code.addEventListener("click", () => hooks.jump(marker))
      const where = element("span", "problem-where", view.where)
      head.append(code, element("strong", "problem-title", view.title), where)
      if (marker.fix !== undefined) {
        const fix = element("button", "problem-fix", marker.fix.title)
        fix.type = "button"
        fix.addEventListener("click", () => hooks.fix(marker))
        head.append(fix)
      }
      item.append(head, excerpt(view))

      if (view.hint !== undefined) {
        const help = element("div", "problem-help")
        help.append(element("span", "problem-help-tag", "直し方"), element("span", "problem-help-text", view.hint))
        item.append(help)
      }
      return item
    }),
  )
}
