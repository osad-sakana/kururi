/** どの言語で役立つか（README の表と同じ内容） */
export interface LanguageRow {
  readonly name: string
  /** ファイルの拡張子（ロゴの代わりに札として見せる） */
  readonly ext: string
  readonly shared: string
  readonly differs: string
}

export const LANGUAGES: readonly LanguageRow[] = [
  { name: "Python", ext: ".py", shared: "変換先。`snake_case` とクラスの `UpperCamelCase` は、そのまま PEP 8", differs: "型は省略できる。ブロックは `{ }` でなくインデント。`self` を引数に書く" },
  { name: "TypeScript", ext: ".ts", shared: "`名前: 型` の書き方、`T[]`、`null` の扱い、クラスと `private` / `public`", differs: "`T?` は `T | null`。名前は `camelCase`" },
  { name: "JavaScript", ext: ".js", shared: "手順・分岐・繰り返し・関数・クラス、`{ }` のブロック", differs: "型がない。ループは `for…of`。名前は `camelCase`" },
  { name: "Java", ext: ".java", shared: "型を書く習慣、クラス、`new`、constructor、`private` / `public`、`{ }`", differs: "型を名前の前に書く（`int x`）。文末に `;`。名前は `camelCase`" },
  { name: "C#", ext: ".cs", shared: "Java と同じ点に加え、`T?`（null 許容型）", differs: "型を名前の前に書く。文末に `;`" },
  { name: "Kotlin", ext: ".kt", shared: "`名前: 型`、`T?`、クラス、`for … in`", differs: "範囲 `1..10` は終わりを含む。`val` / `var` の 2 種類" },
  { name: "Swift", ext: ".swift", shared: "`名前: 型`、`T?`、`->` で戻り値の型、`for … in`", differs: "範囲は `0..<10`（終わりを含まない）と `0...10`（含む）を使い分ける" },
  { name: "Rust", ext: ".rs", shared: "`名前: 型`、`->`、`for i in 0..10`（終わりを含まない）、`snake_case`", differs: "所有権がある。`null` はなく `Option` を使う。変更するには `mut` が要る" },
  { name: "Go", ext: ".go", shared: "静的な型、`for`、関数による分割", differs: "クラスがない。名前の付け方（大文字で公開）が違う" },
  { name: "C / C++", ext: ".c .cpp", shared: "静的な型、分岐・繰り返し・関数、`{ }`（C++ はクラスも）", differs: "メモリを自分で管理する。型を名前の前に書く" },
  { name: "Ruby", ext: ".rb", shared: "`snake_case`、クラスの `UpperCamelCase`、オブジェクト指向の考え方", differs: "型がない。ブロックの書き方が独特" },
  { name: "PHP", ext: ".php", shared: "クラス、`new`、constructor（`__construct`）、`private` / `public`、`?int` のような null 許容、`{ }`", differs: "変数名に `$` が付く。型は省略できる。型を名前の前に書く。文末に `;`。ループは `foreach ($xs as $x)`" },
]
