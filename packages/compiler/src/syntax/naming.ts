/** 名前の書き方の決まり。クラスはアッパーキャメルケース、const は大文字のスネークケース、それ以外はスネークケース。 */
export type NameStyle = "class" | "constant" | "snake"

export interface NamingProblem {
  /** 決まりの説明（「クラス名はアッパーキャメルケースで書きます」など） */
  readonly rule: string
  /** 直した名前の案 */
  readonly suggestion: string
}

const UPPER = /[A-Z]/
const LOWER = /[a-z]/

/** 単語に分ける（someVariable / SomeVariable / some_variable / SOME_VARIABLE → some, variable）。 */
function words(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .split("_")
    .filter((word) => word !== "")
    .map((word) => word.toLowerCase())
}

export function toSnakeCase(name: string): string {
  const lead = name.match(/^_+/)?.[0] ?? ""
  return lead + words(name).join("_")
}

export function toUpperSnakeCase(name: string): string {
  return toSnakeCase(name).toUpperCase()
}

export function toUpperCamelCase(name: string): string {
  return words(name)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")
}

/**
 * 決まりに合わないときだけ、直し方を返す。
 * 英字を含まない名前（ひらがな・カタカナ・漢字だけなど）には大文字・小文字がないので、決まりの対象にしない。
 */
export function namingProblem(name: string, style: NameStyle): NamingProblem | undefined {
  if (style === "class") {
    const first = name.charAt(0)
    const startsLower = LOWER.test(first)
    if (!startsLower && !name.includes("_")) return undefined
    return { rule: "クラス名はアッパーキャメルケース（例: ShoppingCart）で書きます", suggestion: toUpperCamelCase(name) }
  }
  if (style === "constant") {
    if (!LOWER.test(name)) return undefined
    return { rule: "const の名前は大文字のスネークケース（例: TAX_RATE）で書きます", suggestion: toUpperSnakeCase(name) }
  }
  if (!UPPER.test(name)) return undefined
  return { rule: "名前はスネークケース（例: total_price）で書きます", suggestion: toSnakeCase(name) }
}
