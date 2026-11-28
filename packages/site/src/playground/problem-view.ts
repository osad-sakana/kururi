import type { EditorMarker } from "./analyze"

/** エラーカードの 1 件ぶんの中身（画面の部品ではなく、ただのデータ）。プレイグラウンドと、トップページの両方が使う。 */
export interface ProblemView {
  readonly severity: "error" | "warning"
  readonly code: string
  readonly title: string
  readonly where: string
  readonly fix: string | undefined
  /** 直前の行（あれば）。行番号と中身 */
  readonly previous: { readonly no: number; readonly text: string } | undefined
  readonly line: { readonly no: number; readonly before: string; readonly range: string; readonly after: string }
  readonly label: string | undefined
  readonly hint: string | undefined
}

/** マーカーと、ソースの行から、カードの中身を作る。 */
export function problemView(marker: EditorMarker, lines: readonly string[]): ProblemView {
  const index = marker.startLineNumber - 1
  const text = lines[index] ?? ""
  const before = text.slice(0, marker.startColumn - 1)
  const range = marker.endLineNumber === marker.startLineNumber ? text.slice(marker.startColumn - 1, marker.endColumn - 1) : text.slice(marker.startColumn - 1)
  const after = text.slice(before.length + range.length)
  const previous = lines[index - 1]
  const [title = ""] = marker.message.split("\n")
  return {
    severity: marker.severity,
    code: marker.code,
    title,
    where: `main.kururi:${marker.startLineNumber}:${marker.startColumn}`,
    fix: marker.fix?.title,
    previous: previous !== undefined && previous.trim() !== "" ? { no: marker.startLineNumber - 1, text: previous } : undefined,
    line: { no: marker.startLineNumber, before, range, after },
    label: marker.label,
    hint: marker.hint !== undefined && marker.hint !== "" ? marker.hint : undefined,
  }
}
