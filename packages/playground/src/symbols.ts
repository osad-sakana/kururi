import { HINTS } from "./line-icons"

export type SymbolKind = "var" | "const" | "function" | "class" | "method" | "constructor" | "field" | "param"

export interface KSymbol {
  readonly name: string
  readonly kind: SymbolKind
  /** var / const / field / param の型。function / method では戻り値の型 */
  readonly type?: string
  /** function / method / constructor の引数（書いたままの文字列） */
  readonly params?: string
  /** method / field の public / private */
  readonly access?: "public" | "private"
  /** method / field / constructor を持つクラス */
  readonly owner?: string
  readonly line: number
}

const BUILTIN_DOCS: Readonly<Record<string, string>> = {
  print: "print(x): 値を画面に出す",
  input: "input(): キーボードから 1 行を文字列で受け取る",
  to_string: "to_string(x): 値を string にする",
  to_int: "to_int(s): string を int にする（失敗すると実行時エラー）",
  to_float: "to_float(s): string を float にする（失敗すると実行時エラー）",
  div: "div(a, b): 整数の割り算（切り捨て）",
  random: "random(a, b): a 以上 b 以下のランダムな整数",
}

const TYPE_DOCS: Readonly<Record<string, string>> = {
  int: "int: 整数",
  float: "float: 小数",
  string: "string: 文字列",
  boolean: "boolean: true か false",
  void: "void: 値を返さない",
}

const ARRAY_MEMBERS: Readonly<Record<string, string>> = {
  push: "push(x): 配列の末尾に追加する",
  remove_at: "remove_at(i): 位置 i の要素を削除する",
  contains: "contains(x): x が入っているか（boolean）",
  length: "length: 配列の長さ",
}

const STRING_ARRAY_MEMBERS: Readonly<Record<string, string>> = {
  join: "join(sep): 要素を sep でつないだ string",
}

const STRING_MEMBERS: Readonly<Record<string, string>> = {
  length: "length: 文字数",
  upper: "upper(): 大文字にした string",
  lower: "lower(): 小文字にした string",
  trim: "trim(): 前後の空白を取った string",
  contains: "contains(t): t が入っているか（boolean）",
  starts_with: "starts_with(t): t で始まるか（boolean）",
  ends_with: "ends_with(t): t で終わるか（boolean）",
  index_of: "index_of(t): t が最初に出る位置（なければ -1）",
  replace: "replace(a, b): a を b に置き換えた string",
  split: "split(sep): sep で区切った string[]",
}

const VAR = /^\s*(var|const)\s+([\p{L}_][\p{L}\p{N}_]*)\s*:\s*([^=\n]+?)\s*(?:=|$)/u
const FIELD = /^\s*(public|private)\s+([\p{L}_][\p{L}\p{N}_]*)\s*:\s*([^=\n]+?)\s*(?:=|$)/u
const FUNCTION = /^\s*function\s+([\p{L}_][\p{L}\p{N}_]*)\s*=\s*\(([^)]*)\)\s*(?:->\s*([^\s{]+))?/u
const METHOD = /^\s*(?:(public|private)\s+)?method\s+([\p{L}_][\p{L}\p{N}_]*)\s*=\s*\(([^)]*)\)\s*(?:->\s*([^\s{]+))?/u
const CONSTRUCTOR = /^\s*constructor\s*=\s*\(([^)]*)\)/u
const CLASS = /^class\s+([\p{L}_][\p{L}\p{N}_]*)/u
const PARAM = /([\p{L}_][\p{L}\p{N}_]*)\s*:\s*([^,]+)/gu

function paramSymbols(params: string, line: number, owner: string | undefined): KSymbol[] {
  return [...params.matchAll(PARAM)].map((match) => ({
    name: match[1] as string,
    kind: "param" as const,
    type: (match[2] as string).trim(),
    line,
    ...(owner === undefined ? {} : { owner }),
  }))
}

/** ソースから、宣言をざっと拾う（変数・定数・関数・クラス・メソッド・フィールド・引数）。スコープは見ない。 */
export function indexSymbols(source: string): readonly KSymbol[] {
  const symbols: KSymbol[] = []
  let owner: string | undefined
  source.split("\n").forEach((text, index) => {
    const line = index + 1
    const klass = CLASS.exec(text)
    if (klass !== null) {
      owner = klass[1] as string
      symbols.push({ name: owner, kind: "class", line })
      return
    }
    if (/^\S/.test(text) && !text.startsWith("}")) owner = undefined
    const fn = FUNCTION.exec(text)
    if (fn !== null) {
      symbols.push({ name: fn[1] as string, kind: "function", params: fn[2] ?? "", type: fn[3] ?? "void", line })
      symbols.push(...paramSymbols(fn[2] ?? "", line, undefined))
      return
    }
    const method = METHOD.exec(text)
    if (method !== null) {
      symbols.push({
        name: method[2] as string,
        kind: "method",
        params: method[3] ?? "",
        type: method[4] ?? "void",
        access: method[1] === "private" ? "private" : "public",
        line,
        ...(owner === undefined ? {} : { owner }),
      })
      symbols.push(...paramSymbols(method[3] ?? "", line, owner))
      return
    }
    const ctor = CONSTRUCTOR.exec(text)
    if (ctor !== null) {
      symbols.push({ name: "constructor", kind: "constructor", params: ctor[1] ?? "", line, ...(owner === undefined ? {} : { owner }) })
      symbols.push(...paramSymbols(ctor[1] ?? "", line, owner))
      return
    }
    const field = FIELD.exec(text)
    if (field !== null) {
      symbols.push({ name: field[2] as string, kind: "field", type: field[3] as string, access: field[1] as "public" | "private", line, ...(owner === undefined ? {} : { owner }) })
      return
    }
    const variable = VAR.exec(text)
    if (variable !== null) symbols.push({ name: variable[2] as string, kind: variable[1] as "var" | "const", type: variable[3] as string, line })
  })
  return symbols
}

/** 説明用の 1 行（コードの形）。 */
export function signature(symbol: KSymbol): string {
  switch (symbol.kind) {
    case "var":
    case "const":
      return `${symbol.kind} ${symbol.name}: ${symbol.type ?? ""}`
    case "field":
      return `${symbol.access ?? "public"} ${symbol.name}: ${symbol.type ?? ""}`
    case "param":
      return `${symbol.name}: ${symbol.type ?? ""}（引数）`
    case "function":
      return `function ${symbol.name}(${symbol.params ?? ""}) -> ${symbol.type ?? "void"}`
    case "method":
      return `${symbol.access ?? "public"} method ${symbol.owner === undefined ? "" : `${symbol.owner}.`}${symbol.name}(${symbol.params ?? ""}) -> ${symbol.type ?? "void"}`
    case "constructor":
      return `constructor(${symbol.params ?? ""})`
    case "class":
      return `class ${symbol.name}`
  }
}

/** その行にいちばん近い（直前の）クラスの名前 */
export function enclosingClass(symbols: readonly KSymbol[], line: number): string | undefined {
  let found: KSymbol | undefined
  for (const symbol of symbols) if (symbol.kind === "class" && symbol.line <= line) found = symbol
  return found?.name
}

/** 名前にカーソルを置いたときの説明。見つからなければ undefined。 */
export function helpFor(word: string, symbols: readonly KSymbol[], line: number): string | undefined {
  const declared = symbols.filter((symbol) => symbol.name === word)
  // 同じ名前が複数あれば、カーソルより手前で、いちばん近いものを使う
  const symbol = [...declared].reverse().find((candidate) => candidate.line <= line) ?? declared[0]
  if (symbol !== undefined) return signature(symbol)
  return BUILTIN_DOCS[word] ?? TYPE_DOCS[word] ?? HINTS[word as keyof typeof HINTS] ?? STRING_MEMBERS[word] ?? ARRAY_MEMBERS[word] ?? STRING_ARRAY_MEMBERS[word]
}

export interface Suggestion {
  readonly label: string
  readonly detail: string
  readonly kind: "keyword" | "type" | "builtin" | "variable" | "function" | "class" | "member"
  /** 挿入する文字（省略すると label） */
  readonly insert?: string
}

const KEYWORD_LABELS = ["var", "const", "function", "class", "constructor", "method", "fields", "public", "private", "if", "else", "for", "while", "return", "break", "continue", "new", "self", "in", "true", "false", "null", "and", "or", "not"]

function typeOfObject(symbols: readonly KSymbol[], object: string, line: number): string | undefined {
  if (object === "self") return enclosingClass(symbols, line)
  const declared = symbols.filter((symbol) => symbol.name === object && symbol.type !== undefined && symbol.kind !== "function" && symbol.kind !== "method")
  const symbol = [...declared].reverse().find((candidate) => candidate.line <= line) ?? declared[0]
  if (symbol !== undefined) return symbol.type
  return symbols.some((candidate) => candidate.kind === "class" && candidate.name === object) ? object : undefined
}

/** `x.` のあとに出す候補（配列のメソッド、クラスのメンバー）。 */
export function memberSuggestions(symbols: readonly KSymbol[], object: string, line: number): readonly Suggestion[] {
  const type = typeOfObject(symbols, object, line)
  if (type === undefined) return []
  const builtin = type === "string" ? STRING_MEMBERS : type === "string[]" ? { ...ARRAY_MEMBERS, ...STRING_ARRAY_MEMBERS } : type.endsWith("[]") ? ARRAY_MEMBERS : undefined
  if (builtin !== undefined) return Object.entries(builtin).map(([label, detail]) => ({ label, detail, kind: "member" as const }))
  const inside = object === "self"
  return symbols
    .filter((symbol) => symbol.owner === type && (symbol.kind === "method" || symbol.kind === "field") && (inside || symbol.access !== "private"))
    .map((symbol) => ({ label: symbol.name, detail: signature(symbol), kind: "member" as const }))
}

/** ふつうの場所で出す候補（キーワード・型・組み込み・宣言した名前）。 */
export function generalSuggestions(symbols: readonly KSymbol[]): readonly Suggestion[] {
  const seen = new Set<string>()
  const named: Suggestion[] = []
  for (const symbol of symbols) {
    if (symbol.kind === "constructor" || symbol.kind === "method" || symbol.kind === "field" || seen.has(symbol.name)) continue
    seen.add(symbol.name)
    named.push({ label: symbol.name, detail: signature(symbol), kind: symbol.kind === "class" ? "class" : symbol.kind === "function" ? "function" : "variable" })
  }
  return [
    ...KEYWORD_LABELS.map((label) => ({ label, detail: HINTS[label as keyof typeof HINTS] ?? label, kind: "keyword" as const })),
    ...Object.entries(TYPE_DOCS).map(([label, detail]) => ({ label, detail, kind: "type" as const })),
    ...Object.entries(BUILTIN_DOCS).map(([label, detail]) => ({ label, detail, kind: "builtin" as const })),
    ...named,
  ]
}
