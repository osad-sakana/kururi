/** 行の先頭の語から、行番号の右に出すアイコンの種類を決める（宣言と if / for / while / return）。 */
export const ICON_KINDS = ["var", "const", "function", "class", "constructor", "method", "fields", "if", "else", "for", "while", "return"] as const
export type IconKind = (typeof ICON_KINDS)[number]

export interface LineIcon {
  readonly line: number
  readonly kind: IconKind
  readonly hint: string
}

export const HINTS: Readonly<Record<IconKind, string>> = {
  var: "var: あとから変えられる値を入れる",
  const: "const: 変えられない値（定数）",
  function: "function: 処理にまとめて名前を付ける",
  class: "class: データと動きをひとまとめにする設計図",
  constructor: "constructor: インスタンスを作るときの手順",
  method: "method: クラスの動き",
  fields: "fields: クラスが持つデータの宣言",
  if: "if: 条件が成り立つときだけ実行する",
  else: "else: if の条件が成り立たないときに実行する",
  for: "for: 範囲や配列の要素を順に繰り返す",
  while: "while: 条件が成り立つあいだ繰り返す",
  return: "return: 値を返して関数を終える",
}

const ELSE_IF_HINT = "else if: 前の条件が成り立たず、この条件が成り立つときに実行する"

/** 行頭の `}`、`public` / `private` を外した最初の語（とその続き）を取る */
const LINE_HEAD = /^\s*(?:\}\s*)?(?:(?:public|private)\s+)?([A-Za-z_]+)\b(.*)$/

function kindOf(word: string, rest: string): IconKind | null {
  if (word === "fields") return /^\s*=/.test(rest) ? "fields" : null
  return (ICON_KINDS as readonly string[]).includes(word) ? (word as IconKind) : null
}

export function classifyLines(source: string): readonly LineIcon[] {
  const icons: LineIcon[] = []
  source.split("\n").forEach((text, index) => {
    const match = LINE_HEAD.exec(text)
    if (match === null || text.trimStart().startsWith("//")) return
    const word = match[1] ?? ""
    const rest = match[2] ?? ""
    const kind = kindOf(word, rest)
    if (kind === null) return
    const hint = kind === "else" && /^\s+if\b/.test(rest) ? ELSE_IF_HINT : HINTS[kind]
    icons.push({ line: index + 1, kind, hint })
  })
  return icons
}
