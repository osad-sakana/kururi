const ESCAPES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }

/** `...` で囲んだ部分を <code> にする（ほかの文字は HTML として安全にする）。 */
export function renderInline(text: string): string {
  return text
    .split("`")
    .map((part, index) => {
      const safe = part.replace(/[&<>"]/g, (char) => ESCAPES[char] ?? char)
      return index % 2 === 1 ? `<code>${safe}</code>` : safe
    })
    .join("")
}
