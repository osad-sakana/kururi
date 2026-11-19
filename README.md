<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo/kururi-wordmark-on-dark.svg">
    <img src="assets/logo/kururi-wordmark-on-light.svg" alt="Kururi" width="240">
  </picture>
</p>

# 「Kururi」は学習用プログラミング言語！

**Scratch の次、Python の前**にある、テキストで書く最初のプログラミング言語です。書いたコードは Python に変換できます。以下では「Kururi」と呼びます。

```kururi
const GREETING: string = "こんにちは"

class Dog = {
    fields = {
        private name: string
        public age: int = 0
    }

    constructor = (name: string) {
        self.name = name
    }

    public method bark = () {
        print(`${GREETING}、${self.name} です`)
    }
}

function add = (a: int, b: int) -> int {
    return a + b
}

function main = () {
    var dog: Dog = new Dog("ポチ")
    var total: int = 0
    for i in 0..3 {
        dog.bark()
        total = add(total, i)
    }
    print(total)
}
```

## なぜ作るのか

Python は自由に書けます。そのため、**学ぶべきことをしなくても、動くプログラムは書けてしまいます**。けれど、それでは理解が進まず、上手くもなりません。

Python には、初学者にとって書きづらい要素もあります。たとえば `__init__` は、書きづらい上に意味も分かりづらいものです。

Kururi は、**少しルールの厳しい学習用言語を経由してから Python へ進む**という考え方に立ちます。

- 厳しさは、書き方の自由を減らすことで作ります。
- 「なぜ弾かれたか分からない」という障壁は作りません。間違いには、必ず直し方を添えたエラーを返します。

### Python だけのためではない

Kururi が身につけさせるのは、Python 専用の知識ではありません。**値には種類があること、名前の付け方をそろえること、手順・分岐・繰り返し・関数で分けて考えること、データと動きをクラスにまとめて守ること、「値がない」ことを意識すること**。これらは、他の言語を学ぶときにも、ほぼそのまま役に立ちます。

だから Kururi は、「Python の前」であると同時に、**どの言語にも通じる土台**でもあります。

### どの言語で役立つか

| 言語 | そのまま通じること | 違うこと（最初に戸惑う点） |
|---|---|---|
| Python | 変換先。`snake_case` とクラスの `UpperCamelCase` は、そのまま PEP 8 | 型は省略できる。ブロックは `{ }` でなくインデント。`self` を引数に書く |
| TypeScript | `名前: 型` の書き方、`T[]`、`null` の扱い、クラスと `private` / `public` | `T?` は `T \| null`。名前は `camelCase` |
| JavaScript | 手順・分岐・繰り返し・関数・クラス、`{ }` のブロック | 型がない。ループは `for…of`。名前は `camelCase` |
| Java | 型を書く習慣、クラス、`new`、constructor、`private` / `public`、`{ }` | 型を名前の前に書く（`int x`）。文末に `;`。名前は `camelCase` |
| C# | Java と同じ点に加え、`T?`（null 許容型） | 型を名前の前に書く。文末に `;` |
| Kotlin | `名前: 型`、`T?`、クラス、`for … in` | 範囲 `1..10` は終わりを含む。`val` / `var` の 2 種類 |
| Swift | `名前: 型`、`T?`、`->` で戻り値の型、`for … in` | 範囲は `0..<10`（終わりを含まない）と `0...10`（含む）を使い分ける |
| Rust | `名前: 型`、`->`、`for i in 0..10`（終わりを含まない）、`snake_case` | 所有権がある。`null` はなく `Option` を使う。変更するには `mut` が要る |
| Go | 静的な型、`for`、関数による分割 | クラスがない。名前の付け方（大文字で公開）が違う |
| C / C++ | 静的な型、分岐・繰り返し・関数、`{ }`（C++ はクラスも） | メモリを自分で管理する。型を名前の前に書く |
| Ruby | `snake_case`、クラスの `UpperCamelCase`、オブジェクト指向の考え方 | 型がない。ブロックの書き方が独特 |
| PHP | クラス、`new`、constructor（`__construct`）、`private` / `public`、`?int` のような null 許容、`{ }` | 変数名に `$` が付く。型は省略できる。型を名前の前に書く。文末に `;`。ループは `foreach ($xs as $x)` |

どの言語でも変わらないのは、**考え方**の部分です（型、名前、分けて考える、まとめて守る、値がない）。書き方（記号や語順）は言語ごとに違うので、そこは新しい言語で改めて覚えます。

### 判断の基準

1. **Python で後から悪い癖になる自由は、ここで減らす**。例：型を省く、名前の付け方がばらばら、同じことを書く方法が何通りもある。
2. **減らすときは、必ず直し方を添えたエラーにする**。厳しいが、教えてくれる。
3. **Python へ移るときに困る違いは作らない**。変換後の Python が、教材としてそのまま読めること。
4. **特定の言語の癖ではなく、どの言語にも通じる考え方を優先する**。

## 何を学べるか

- 構造化プログラミング：順次、分岐、繰り返し、関数による分割
- オブジェクト指向の入口：クラス、インスタンス、カプセル化（`private` / `public`）、メソッド
- 「値がない」という概念（`null` と `T?`）

ラムダ・クロージャ、ジェネリクス、非同期、継承などは扱いません。実用言語になることは目指さない、学習用の言語です。

## 言語の特徴

| 特徴 | 内容 |
|---|---|
| 型を明示する | `var total: int = 0` のように、値の種類を必ず書く。型の間違いはコンパイル時に分かる |
| 形がそろっている | 宣言は「種類 名前 = 中身」。`var`、`function`、`class` で同じ形 |
| ループは `for` だけ | `for i in 0..10`（範囲）と `for x in xs`（配列） |
| クラスは 3 部構成 | `fields`（データ）、`constructor`（作り方）、`method`（動き） |
| 名前の書き方を決める | クラスは `ShoppingCart`、`const` は `TAX_RATE`、それ以外は `total_price` |
| 丁寧なエラー | 何が・どこで・なぜ・どう直すかを日本語で示す。エラーコード付き |
| Python に変換できる | 型やアクセス制御はコンパイル時に検査し、変換後の Python は型ヒントなしの読みやすい形 |

## エラーの例

```
error[K0506]: 「someValue」は、名前の書き方の決まりに合っていません
 --> main.kururi:2:9
  |
2 |     var someValue: int = 1
  |         ^^^^^^^^^ 書き方が違います
  |
help: 名前はスネークケース（例: total_price）で書きます。「some_value」のように直してください
```

```
error[K0301]: string の値を int には入れられません
 --> main.kururi:2:22
  |
2 |     var count: int = "three"
  |                      ^^^^^^^ この値は string です
  |
help: int の値を書くか、型を string に変えてください
```

## 使い方

必要なもの：Node.js 22 以上、pnpm 10。`run` を使うには Python 3.12 以上も必要です。

```bash
pnpm install
```

### ブラウザで試す（プレイグラウンド）

```bash
pnpm playground
```

`http://localhost:5173` を開くと、左に Kururi、右に変換後の Python が並びます。書いている間にエラーが赤線で出ます。「実行」でその場で動かせ、`input()` は出力欄の中で入力できます。エラーがあるあいだは、Python 欄にエラーの内容が出ます。

### コマンドラインで使う

```bash
pnpm kururi check example.kururi     # エラーを調べる
pnpm kururi run example.kururi       # Python に変換して実行する
pnpm kururi export example.kururi    # narapy で開く URL を出す
```

- `export` は、[narapy](https://github.com/osad-sakana/narapy)（ブラウザで動く Python 学習環境）で開く URL を出します。`--out ファイル.narapy` で `.narapy` ファイルも書き出せます。
- 終了コード：`0` 成功、`1` コンパイルエラー、`2` 使い方やファイルの誤り。

### エディタで使う

`packages/lsp` に、診断（エラー表示）を返す言語サーバーがあります。`tsx packages/lsp/src/bin.ts --stdio` で起動します。エディタ側の拡張機能はまだありません。

## 開発

```bash
pnpm test        # 全テスト
pnpm typecheck   # 型検査
```

- 構成：`packages/compiler`（変換器）、`packages/cli`、`packages/playground`、`packages/lsp`、`packages/narapy`（narapy への受け渡し）
- テストは、単体テスト、ゴールデンテスト（`tests/cases/` に、入力と期待する Python・エラーを置く）、生成した Python を実際に動かす E2E テストからなります。
- narapy の形式変更を検知する互換テストを、CI で毎日動かしています。

## ドキュメント

- [PLAN.md](PLAN.md)：思想、言語仕様、Python への変換規則、エラーメッセージの方針、実装計画
- [GRAMMAR.ebnf](GRAMMAR.ebnf)：形式文法

## 状況

開発中です。構文は学習効果を優先して、大きく変えることがあります。

## ライセンス

まだ決めていません。
