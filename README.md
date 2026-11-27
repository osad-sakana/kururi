<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo/kururi-wordmark-on-dark.svg">
    <img src="assets/logo/kururi-wordmark-on-light.svg" alt="Kururi" width="240">
  </picture>
</p>

# 「Kururi」は学習用プログラミング言語！

**プログラミングの概念を学ぶことに特化した、最初の言語**です。ここで概念を身につければ、Python をはじめ、多くの言語への入り口になります。書いたコードは Python に変換できます。以下では「Kururi」と呼びます。

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

AI がコードを書く時代に、人に必要なのは、書き方（文法）の暗記ではなく、**プログラミングの概念を理解すること**です。AI が出したコードを読み、直し、指示するには、その土台が要ります。

概念とは、たとえば次のようなものです。**値には種類（型）があること。名前の付け方をそろえること。手順・分岐・繰り返し・関数で分けて考えること。データと動きをクラスにまとめて守ること。「値がない」ことを意識すること。エラーを読むこと。** これらは、言語が変わってもほぼそのまま通じます。

Kururi は、この概念を学ぶことに特化した言語です。

- 文法を最小にして、**1 つの概念を 1 つの形**で見せます。
- 自由を減らして、**概念の理解を妨げる書き方ができない**ようにします。
- 「なぜ弾かれたか分からない」という障壁は作りません。間違いには、必ず直し方を添えたエラーを返します。
- 書いたコードは、読みやすい Python に変換できます。

Python は、いちばん近い出口です。Python には自由に書ける良さがありますが、**学ぶべきことをしなくても動くプログラムは書けてしまう**ので、理解が進みにくい面もあります。そこで、少しルールの厳しい Kururi で概念を身につけてから、Python をはじめ、ほかの言語へ進みます。

### Python だけのためではない

Kururi が身につけさせるのは、特定の言語の知識ではありません。**どの言語にも共通する概念**です。だから Kururi は、「Python の前」であると同時に、**どの言語への入り口**にもなります。ただし「全部を教える」とは言いません。扱わない概念は、下の「何を学べるか」に書いています。

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

1. **概念の理解を妨げる自由は、ここで減らす**。例：型を省く、名前の付け方がばらばら、同じことを書く方法が何通りもある。
2. **減らすときは、必ず直し方を添えたエラーにする**。厳しいが、概念を教えてくれる。
3. **どの言語でも通じる形を優先する**。そのうえで、変換後の Python が、教材としてそのまま読めること。
4. **特定の言語の癖ではなく、どの言語にも通じる考え方を優先する**。

## 何を学べるか

- 構造化プログラミング：順次、分岐、繰り返し、関数による分割
- オブジェクト指向の入口：クラス、インスタンス、カプセル化（`private` / `public`）、メソッド
- 「値がない」という概念（`null` と `T?`）

ラムダ・クロージャ、ジェネリクス、非同期・並行処理、メモリ管理、継承などは扱いません。「入り口」であって、「全部」ではありません。実用言語になることは目指さない、学習用の言語です。

## 言語の特徴

| 特徴 | 内容 |
|---|---|
| 型を明示する | `var total: int = 0` のように、値の種類を必ず書く。型の間違いはコンパイル時に分かる |
| 形がそろっている | 宣言は「種類 名前 = 中身」。`var`、`function`、`class` で同じ形 |
| ループは `for` だけ | `for i in 0..10`（範囲）と `for x in xs`（配列） |
| クラスは 3 部構成 | `fields`（データ）、`constructor`（作り方）、`method`（動き） |
| 名前の書き方を決める | クラスは `ShoppingCart`、`const` は `TAX_RATE`、それ以外は `total_price` |
| 丁寧なエラー | 何が・どこで・なぜ・どう直すかを日本語で示す。エラーコード付き。直せるものは 1 クリックで直せる |
| 警告 | 使っていない変数や、実行されない行を知らせる（動きはする） |
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

### サイトを動かす（トップ・チュートリアル・プレイグラウンド）

```bash
pnpm dev
```

`http://localhost:4321` を開くと、次の 3 つのページがあります。

| パス | 内容 |
|---|---|
| `/` | トップ。Kururi の考え方と、どの言語で役立つか |
| `/tutorials` | チュートリアル（概念を順番に学ぶ 8 回）。コードはボタン 1 つでプレイグラウンドに送れます |
| `/playground` | プログラミングのページ。左に Kururi、右に変換後の Python が並びます |

プレイグラウンドでは、書いている間にエラーが赤線で出ます。「実行」でその場で動かせ、`input()` は出力欄の中で入力できます。「ステップ実行」で、1 行ずつ進めながら変数の値を見られます。エラーは一覧に出て、直し方が分かるものは 1 クリックで直せます。

`pnpm build` で、公開用のサイトを `packages/site/dist` に作ります。公開先の URL とパスは、環境変数 `SITE_URL`・`SITE_BASE` で渡します。

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

- 構成：`packages/compiler`（変換器）、`packages/cli`、`packages/site`（トップ・チュートリアル・プレイグラウンド）、`packages/lsp`、`packages/narapy`（narapy への受け渡し）
- テストは、単体テスト、ゴールデンテスト（`tests/cases/` に、入力と期待する Python・エラーを置く）、生成した Python を実際に動かす E2E テストからなります。
- narapy の形式変更を検知する互換テストを、CI で毎日動かしています。

## ドキュメント

- [PLAN.md](PLAN.md)：思想、言語仕様、Python への変換規則、エラーメッセージの方針、実装計画
- [GRAMMAR.ebnf](GRAMMAR.ebnf)：形式文法

## 状況

開発中です。構文は学習効果を優先して、大きく変えることがあります。

## ライセンス

まだ決めていません。
