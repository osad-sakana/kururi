import type { Diagnostic, Severity, Span } from "./types"

/**
 * 診断コードの体系：K + 4 桁。上位 2 桁がカテゴリ。
 *   K00xx 内部（未対応など）  K01xx 構文  K02xx 名前・スコープ
 *   K03xx 型                  K04xx クラス・アクセス  K05xx 予約語
 */
export type DiagnosticCategory =
  | "internal"
  | "syntax"
  | "name"
  | "type"
  | "class"
  | "reserved"
  | "unknown"

const CATEGORY_BY_PREFIX: Readonly<Record<string, DiagnosticCategory>> = {
  "00": "internal",
  "01": "syntax",
  "02": "name",
  "03": "type",
  "04": "class",
  "05": "reserved",
}

export function categoryOf(code: string): DiagnosticCategory {
  const match = /^K(\d{2})\d{2}$/.exec(code)
  if (match === null) return "unknown"
  return CATEGORY_BY_PREFIX[match[1] ?? ""] ?? "unknown"
}

type Params = Readonly<Record<string, string>>

interface CatalogEntry {
  readonly code: string
  readonly severity: Severity
  readonly message: (params: Params) => string
  readonly label?: (params: Params) => string | undefined
  readonly hint?: (params: Params) => string | undefined
}

const COMPARISON_OPS: ReadonlySet<string> = new Set(["<", "<=", ">", ">=", "==", "!="])
const LOGICAL_OPS: ReadonlySet<string> = new Set(["and", "or", "not"])

function operatorHint(op: string): string {
  if (LOGICAL_OPS.has(op)) return "and / or / not は boolean（true か false）どうしで使います"
  if (COMPARISON_OPS.has(op)) return "比べられるのは、数値どうしか、同じ型どうしです"
  return "「+」は数値どうしか文字列どうし、「- * / %」は数値（int か float）だけで使えます"
}

function unknownCharHint(text: string): string | undefined {
  if (text === "!") return "「でない」は not と書きます（例: not x）"
  if (text === "&&") return "「かつ」は and と書きます"
  if (text === "||") return "「または」は or と書きます"
  if (text === ";") return "Kururi では文の終わりに ; は要りません。改行で文が終わります"
  return undefined
}

/** 診断の文言はここに集める。文言の見直しはこのファイルだけで済むようにする。 */
export const DIAGNOSTIC_CATALOG = {
  K0001: {
    code: "K0001",
    severity: "error",
    message: ({ text = "" }) => `「${text}」から始まる書き方には、まだ対応していません`,
    hint: () => "Kururi は開発中です。対応している書き方は PLAN.md を見てください",
  },
  K0002: {
    code: "K0002",
    severity: "error",
    message: ({ text = "" }) => `「${text}」はまだ使えません`,
    hint: () => "Kururi は開発中です。この書き方は次の版で対応します",
  },
  K0101: {
    code: "K0101",
    severity: "error",
    message: ({ expected = "", found = "" }) => `ここには${expected}が必要ですが、${found}がありました`,
    label: ({ expected = "" }) => `${expected}が必要です`,
    hint: ({ hint }) => hint,
  },
  K0102: {
    code: "K0102",
    severity: "error",
    message: ({ kind = "" }) => `${kind}が閉じられていません`,
    label: () => "ここから始まっています",
    hint: ({ close = "" }) => `閉じる ${close} を書いてください`,
  },
  K0103: {
    code: "K0103",
    severity: "error",
    message: ({ text = "" }) => `「${text}」は Kururi では使えない文字です`,
    hint: ({ text = "" }) => unknownCharHint(text),
  },
  K0104: {
    code: "K0104",
    severity: "error",
    message: ({ text = "" }) => `文字列の中の「${text}」は使えない書き方です`,
    hint: () => "使えるのは \\\" \\\\ \\n \\t です。\\ そのものを書くときは \\\\ と書きます",
  },
  K0105: {
    code: "K0105",
    severity: "error",
    message: () => "整数の先頭に 0 は付けられません",
    label: () => "先頭の 0 が不要です",
    hint: () => "先頭の 0 を取って書いてください（例: 7）",
  },
  K0106: {
    code: "K0106",
    severity: "error",
    message: () => "比較は 2 つの値のあいだにしか書けません",
    label: () => "ここで比較が続いています",
    hint: () => "a < b and b < c のように、and でつないで書いてください",
  },
  K0111: {
    code: "K0111",
    severity: "error",
    message: () => "条件の中に = は書けません",
    label: () => "= は代入です",
    hint: () => "比べるときは == と書きます（例: if x == 1）",
  },
  K0112: {
    code: "K0112",
    severity: "error",
    message: () => "代入できるのは変数だけです",
    label: () => "ここには代入できません",
    hint: () => "左側には変数の名前を書いてください（例: x = 1）。比べるときは == です",
  },
  K0110: {
    code: "K0110",
    severity: "error",
    message: ({ text = "" }) => `トップレベルに「${text}」は書けません`,
    hint: () => "トップレベルに書けるのは function、class、let、const だけです。文は function の中に書いてください",
  },
  K0201: {
    code: "K0201",
    severity: "error",
    message: ({ name = "" }) => `「${name}」という名前は宣言されていません`,
    label: () => "この名前は見つかりません",
    hint: () => "先に let か const で宣言してください。綴りも見直してください",
  },
  K0202: {
    code: "K0202",
    severity: "error",
    message: ({ name = "" }) => `「${name}」はすでに宣言されています`,
    label: () => "同じ名前をもう一度宣言しています",
    hint: () => "別の名前にしてください（関数の中では、外の変数と同じ名前も使えません）",
  },
  K0203: {
    code: "K0203",
    severity: "error",
    message: ({ name = "" }) => `「${name}」は、この行より後ろで宣言されています`,
    label: () => "まだ宣言されていません",
    hint: () => "トップレベルの変数は、使う行より前に宣言してください",
  },
  K0204: {
    code: "K0204",
    severity: "error",
    message: () => "main 関数がありません",
    hint: () => "function main(): void { ... } を書いてください。プログラムはここから始まります",
  },
  K0205: {
    code: "K0205",
    severity: "error",
    message: () => "main は自分で呼び出せません",
    label: () => "ここで main を呼んでいます",
    hint: () => "main はプログラムの入り口で、自動で呼ばれます",
  },
  K0206: {
    code: "K0206",
    severity: "error",
    message: ({ name = "" }) => `「${name}」は let の変数なので、トップレベルの初期値には使えません`,
    label: () => "let の変数です",
    hint: () => "トップレベルの初期値に使えるのは、const で宣言した変数だけです。const にするか、main の中で使ってください",
  },
  K0210: {
    code: "K0210",
    severity: "error",
    message: ({ name = "" }) => `${name} はループ（while か repeat）の中でしか使えません`,
    label: () => "ループの外です",
  },
  K0211: {
    code: "K0211",
    severity: "error",
    message: ({ name = "", other = "" }) => `「${name}」は別の場所で ${other} として宣言されています`,
    label: ({ actual = "" }) => `ここでは ${actual} です`,
    hint: () => "同じ名前を使うなら、同じ型にしてください。別の名前にしてもかまいません",
  },
  K0212: {
    code: "K0212",
    severity: "error",
    message: ({ name = "" }) => `「${name}」は const なので、代入し直せません`,
    label: () => "ここで代入しています",
    hint: ({ name = "" }) => `値を変えたいときは、宣言を let ${name} に変えてください`,
  },
  K0213: {
    code: "K0213",
    severity: "error",
    message: ({ name = "" }) => `「${name}」はループ（repeat / foreach）の変数なので、代入できません`,
    label: () => "ここで代入しています",
    hint: () => "別の変数に入れて使ってください。条件で回したいときは while を使います",
  },
  K0207: {
    code: "K0207",
    severity: "error",
    message: () => "main は「function main(): void」と書きます",
    label: () => "ここが違います",
    hint: () => "main には引数を付けられず、戻り値の型は void にします",
  },
  K0208: {
    code: "K0208",
    severity: "error",
    message: ({ name = "" }) => `「${name}」という型はありません`,
    label: () => "知らない型です",
    hint: () => "使える型は int、float、string、boolean です",
  },
  K0301: {
    code: "K0301",
    severity: "error",
    message: ({ expected = "", actual = "" }) => `${actual} の値を ${expected} には入れられません`,
    label: ({ actual = "" }) => `この値は ${actual} です`,
    hint: ({ expected = "", actual = "" }) => `${expected} の値を書くか、型を ${actual} に変えてください`,
  },
  K0302: {
    code: "K0302",
    severity: "error",
    message: () => "文字列と数値は + でつなげません",
    label: ({ actual = "" }) => `この値は ${actual} です`,
    hint: () => "toString(値) で文字列にするか、文字列補間 `${値}` を使ってください",
  },
  K0303: {
    code: "K0303",
    severity: "error",
    message: ({ op = "", left = "", right }) =>
      right === undefined
        ? `${left} には「${op}」を使えません`
        : `${left} と ${right} には「${op}」を使えません`,
    label: ({ op = "" }) => `「${op}」が使えません`,
    hint: ({ op = "" }) => operatorHint(op),
  },
  K0304: {
    code: "K0304",
    severity: "error",
    message: ({ name = "" }) => `「${name}」は値を返さないので、値としては使えません`,
    label: () => "値がありません",
    hint: ({ name = "" }) => `${name} は文として、単独で書いてください`,
  },
  K0305: {
    code: "K0305",
    severity: "error",
    message: ({ name = "", expected = "", actual = "" }) =>
      `${name} には引数が ${expected} 個必要ですが、${actual} 個書かれています`,
    label: ({ expected = "" }) => `引数は ${expected} 個です`,
  },
  K0306: {
    code: "K0306",
    severity: "error",
    message: ({ what = "", expected = "", actual = "" }) => `${what}には ${expected} が必要ですが、${actual} です`,
    label: ({ actual = "" }) => `この値は ${actual} です`,
    hint: ({ what = "" }) => {
      if (what === "条件") return "比べるときは == や < を使います（例: if x == 1）"
      if (what.startsWith("foreach")) return "foreach の後ろには配列を書きます（例: foreach x in xs { ... }）"
      return "整数になる式を書いてください"
    },
  },
  K0313: {
    code: "K0313",
    severity: "error",
    message: () => "配列はそのまま表示できません",
    label: () => "配列です",
    hint: () => "foreach で 1 つずつ output してください（例: foreach x in xs { output(x) }）",
  },
  K0314: {
    code: "K0314",
    severity: "error",
    message: () => "空の配列 [] は、型が決まる場所でしか書けません",
    label: () => "何の配列か分かりません",
    hint: () => "let a: int[] = [] のように、型を書いた変数に入れてください",
  },
  K0315: {
    code: "K0315",
    severity: "error",
    message: () => "添字に負の数は書けません",
    label: () => "負の数です",
    hint: () => "Python と違い、a[-1] は末尾を指しません。末尾は a[a.length - 1] と書きます",
  },
  K0316: {
    code: "K0316",
    severity: "error",
    message: () => "文字列の 1 文字だけを書き換えることはできません",
    label: () => "文字列は変更できません",
    hint: () => "新しい文字列を作って、変数に代入し直してください",
  },
  K0317: {
    code: "K0317",
    severity: "error",
    message: ({ type = "", name = "" }) => `${type} には「${name}」がありません`,
    label: () => "使えません",
    hint: () => "配列で使えるのは length、push(x)、removeAt(i) です。文字列で使えるのは length だけです",
  },
  K0319: {
    code: "K0319",
    severity: "error",
    message: ({ type = "" }) => `${type} の値に [ ] は使えません`,
    label: () => "添字は使えません",
    hint: () => "[ ] が使えるのは、配列と文字列だけです",
  },
  K0307: {
    code: "K0307",
    severity: "error",
    message: () => "この式は何もしません",
    label: () => "値を計算するだけです",
    hint: () => "文として書けるのは、関数の呼び出し（例: output(...)）だけです",
  },
  K0308: {
    code: "K0308",
    severity: "error",
    message: ({ name = "" }) => `「${name}」は関数ではないので、呼び出せません`,
    label: () => "関数ではありません",
  },
  K0309: {
    code: "K0309",
    severity: "error",
    message: ({ name = "" }) => `「${name}」は関数です。値としては使えません`,
    hint: ({ name = "" }) => `呼び出すときは ${name}(...) と書きます`,
  },
  K0501: {
    code: "K0501",
    severity: "error",
    message: ({ name = "" }) => `「${name}」は Kururi の予約語なので、名前には使えません`,
    label: () => "予約語です",
    hint: () => "別の名前にしてください",
  },
  K0502: {
    code: "K0502",
    severity: "error",
    message: ({ name = "" }) =>
      `「${name}」は Kururi では予約語ではありませんが、Python の予約語です。変換後の Python で動かなくなるため使えません`,
    label: () => "Python の予約語です",
    hint: () => "別の名前にしてください",
  },
  K0503: {
    code: "K0503",
    severity: "error",
    message: () => "Kururi には for がありません",
    label: () => "for は使えません",
    hint: () => "回数で回すときは repeat i: 10 { ... } と書きます",
  },
  K0504: {
    code: "K0504",
    severity: "error",
    message: () => "「__」で始まる名前は使えません",
    label: () => "「__」で始まっています",
    hint: () => "変換後の Python が使う名前と重なるためです。「_」を 1 つにするか、別の名前にしてください",
  },
  K0505: {
    code: "K0505",
    severity: "error",
    message: ({ name = "" }) => `「${name}」は全角英数字や半角カナを含むため、名前に使えません`,
    label: () => "Python では別の文字に変わってしまいます",
    hint: ({ normalized = "" }) =>
      `「${normalized}」のように、半角の英数字か日本語（ひらがな・カタカナ・漢字）で書いてください`,
  },
} as const satisfies Readonly<Record<string, CatalogEntry>>

export type DiagnosticCode = keyof typeof DIAGNOSTIC_CATALOG

export function createDiagnostic(code: DiagnosticCode, span: Span, params: Params = {}): Diagnostic {
  const entry: CatalogEntry = DIAGNOSTIC_CATALOG[code]
  const label = entry.label?.(params)
  const hint = entry.hint?.(params)
  const diagnostic: Diagnostic = {
    code: entry.code,
    severity: entry.severity,
    message: entry.message(params),
    span,
    ...(label === undefined ? {} : { label }),
    ...(hint === undefined ? {} : { hint }),
  }
  return Object.freeze(diagnostic)
}
