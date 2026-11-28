/** 実行結果を、キャラクター「くるりん」とのチャットとして組み立てる部品 */

const AVATAR_URL = `${import.meta.env.BASE_URL}kururin.png`

function bubble(side: "kururin" | "you", className?: string): { readonly row: HTMLElement; readonly body: HTMLElement } {
  const row = document.createElement("div")
  row.className = `chat-row ${side}`
  const body = document.createElement("div")
  body.className = className === undefined ? "bubble" : `bubble ${className}`
  if (side === "kururin") {
    const avatar = document.createElement("img")
    avatar.className = "avatar"
    avatar.src = AVATAR_URL
    avatar.alt = "くるりん"
    avatar.width = 32
    avatar.height = 32
    row.append(avatar)
  }
  row.append(body)
  return { row, body }
}

/** print の出力：くるりんの発言 */
export function kururinBubble(text: string, className?: string): HTMLElement {
  const { row, body } = bubble("kururin", className)
  body.textContent = text
  return row
}

/** input() の答え：こちらの発言 */
export function youBubble(text: string): HTMLElement {
  const { row, body } = bubble("you")
  body.textContent = text
  return row
}

/** 入力待ちの欄（こちらの発言になる）。Enter で確定する */
export function youInput(label: string, onSubmit: (value: string) => void): { readonly row: HTMLElement; readonly focus: () => void } {
  const { row, body } = bubble("you", "typing")
  const field = document.createElement("input")
  field.type = "text"
  field.placeholder = "ここに入力して Enter"
  field.setAttribute("aria-label", label === "" ? "入力" : label)
  body.append(field)
  field.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return
    onSubmit(field.value)
  })
  return { row, focus: () => field.focus() }
}
