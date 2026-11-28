/** ソース上の範囲（UTF-16 オフセット。end は含まない）。 */
export interface Range {
  readonly start: number
  readonly end: number
}

export type TokenKind = "ident" | "keyword" | "int" | "float" | "string" | "template" | "op" | "nl" | "eof"

export type TemplatePart =
  | { readonly kind: "text"; readonly value: string; readonly range: Range }
  | { readonly kind: "expr"; readonly tokens: readonly Token[]; readonly range: Range }

export interface Token {
  readonly kind: TokenKind
  readonly text: string
  readonly range: Range
  /** string トークンの、エスケープを解いた中身 */
  readonly value?: string
  /** template トークンの部品 */
  readonly parts?: readonly TemplatePart[]
}

export const KEYWORDS: ReadonlySet<string> = new Set([
  "const", "var", "let", "function", "method", "return", "class", "public", "private", "new", "constructor", "self",
  "if", "elseif", "else", "while", "repeat", "foreach", "in", "break", "continue", "for",
  "true", "false", "null", "and", "or", "not", "int", "float", "string", "boolean", "void", "times",
])

/** 組み込みの名前。キーワードではないが、変数名などには使えない。 */
export const BUILTIN_NAMES: ReadonlySet<string> = new Set([
  "print", "input", "to_string", "to_int", "to_float", "div", "random",
])

/** Kururi のキーワードではないが、Python の予約語・変換後のコードが使う名前。 */
export const PYTHON_RESERVED: ReadonlySet<string> = new Set([
  "False", "None", "True", "as", "assert", "async", "await", "def", "del", "elif", "except",
  "finally", "from", "global", "import", "is", "lambda", "nonlocal", "pass", "raise", "try",
  "with", "yield", "len", "str", "range", "bool", "list", "__kururi_show",
])

/** 行末にあると、次の行へ文が続く記号。 */
export const CONTINUATION_TEXTS: ReadonlySet<string> = new Set([
  "+", "-", "*", "/", "%", "==", "!=", "<", "<=", ">", ">=",
  "=", "+=", "-=", "*=", "/=", "%=", ",", ".", "and", "or",
])
