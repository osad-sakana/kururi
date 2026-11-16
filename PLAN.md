# 「Kururi」は学習用プログラミング言語！

## 概要

Pythonでは初学者向けに書きにくい要素が多々ある。例えば、`__init__` は初学者にとってはとても書きづらい上に意味も分かりづらい。また `def` の後のスペースをよく忘れるなどのことがある。

そのため、Kururiという言語を作成する。

KururiはPythonを学ぶ前にテキストコーディングを最も簡単な形で学習するための言語であり、Pythonにコンパイルすることができる。

## 思想

Python は自由に書ける。そのため、**学ぶべきことをしなくても、動くプログラムは書けてしまう**。けれど、それでは理解が進まず、上手くもならない。

Kururi は、**少しルールの厳しい学習用言語を経由してから Python へ進む**という考え方に立つ。厳しさは、書き方の自由を減らすことで作る。「なぜ弾かれたか分からない」という障壁は作らない。

### Python だけのためではない

Kururi が身につけさせるのは、Python 専用の知識ではない。値には種類があること、名前の付け方をそろえること、手順・分岐・繰り返し・関数で分けて考えること、データと動きをクラスにまとめて守ること、「値がない」ことを意識すること。これらは、**他の言語を学ぶときにも、ほぼそのまま役に立つ**。Kururi は「Python の前」であると同時に、どの言語にも通じる土台になることを目指す。

### 判断の基準

1. **Python で後から悪い癖になる自由は、ここで減らす**。例：型を省く、名前の付け方がばらばら、同じことを書く方法が何通りもある。
2. **減らすときは、必ず直し方を添えたエラーにする**。厳しいが、教えてくれる（K0114、K0506 など）。
3. **Python へ移るときに困る違いは作らない**。変換後の Python が、教材としてそのまま読めること。
4. **特定の言語の癖ではなく、どの言語にも通じる考え方を優先する**。

この基準で、型の明示、名前の書き方の強制（スネークケース・アッパーキャメルケース）、ループを `for` に統一、クラスの 3 部構成（`fields`・`constructor`・`method`）などを決めた。

## 位置づけ

**Scratch の次、Python の前**にあたる、テキストで書く最初の言語。手順・分岐・繰り返しの考え方を、文字で書く形に移す役割を持つ。

### 学ぶ対象

- 構造化プログラミング：順次、分岐、繰り返し、関数による分割
- オブジェクト指向の入口：クラス、インスタンス、カプセル化（`private` / `public`）、メソッド
- 「値がない」という概念（`null` と `T?`）

### 扱わないもの

ラムダ・クロージャ・関数を値として扱う機能（関数は `function 名前 = (...) -> 型 { }` の宣言形式のみ）、ジェネリクス、非同期、ライブラリ、性能、継承・ポリモーフィズム（入口としてはカプセル化まで。必要になったら後の段階で検討）。実用言語になることは目指さない。

### 強み

1. **型を明示させる**：「値には種類がある」という概念を先に身につけさせる。
2. **コンパイル時の丁寧なエラー**：書きながら間違いに気づける。
3. **Pythonへの橋渡し**：変換後のPython（型ヒントなし）を並べて見せ、「このKururiはこのPythonになる」と対応で学べるようにする。生成するPythonは、教材として読めることを重視する。

### 仕様を判断する基準

「その機能は、構造化プログラミングかオブジェクト指向のどちらかの概念を教えるか」。教えないものは入れない。

## 設計方針

- **コンパイル型**：Kururi → Python の変換器を作る。実行時の概念（`private`・`const`・型）は **コンパイル時にチェックし、Python出力では消えてよい**。
- **型チェックはコンパイラが行う**：型注釈は必須。型エラーはコンパイル時に検出する。
- **エラーメッセージは丁寧に**：初学者が自力で直せることを最優先にする（後述）。
- コンパイル型なので、**書いている間にもエラーを出せる**。
- 言語仕様は [GRAMMAR.ebnf](GRAMMAR.ebnf) に形式文法の草案がある。実装計画は後述。

## 言語仕様

```kururi
// 変数宣言（型必須・セミコロン不要）
const TEST: string = "Hello World"
var   price: int = 123
var   rate: float = 0.5

// 配列（T[] 形式・リテラルは []）
var fruits: string[] = ["apple", "banana", "cherry"]
var matrix: int[][] = [
  [1, 2, 3],
  [4, 5, 6],
]

// 配列操作
output(fruits[0])                // 要素アクセス
fruits[1] = "melon"              // 要素更新
fruits.push("grape")             // 末尾に追加
fruits.remove_at(0)               // 位置を指定して削除
var count: int = fruits.length   // 長さ取得
for fruit in fruits {
  output(fruit)
}

// 条件分岐（論理演算は and / or / not、比較は ==）
if price < 300 and price != 0 {
  output("hoge")
} else if price < 600 {
  output("fuga")
} else {
  output("hohe")
}

// while ループ（条件で回す。break / continue が使える）
while true {
  break
}

// 回数で回す（i は 0 から 9 まで。終わりの 10 は含まない）
for i in 0..10 {
  output(to_string(i))     // 0, 1, ..., 9
}

// 文字列補間（バッククォートと ${ }）
var message: string = `${fruits[0]} は ${price} 円です`

// null（値がない）。T? と書いた型だけ null を入れられる
var nickname: string? = null
if nickname != null {
  output(nickname)
}

// 関数宣言（TypeScript 風の戻り値型注釈）
function greet = (name: string) -> string {
  return "こんにちは、" + name
}

// クラス宣言（フィールド・メソッドともデフォルト private。外から使うものに public を付ける。private と明示してもよい）
class Player = {
  fields = {
    name: string
    public age: int = 20
    private nickname: string? = null     // T? で初期値がなければ null
  }

  // コンストラクタ（Python の __init__ に相当）
  // new Player("taro") と書くと自動で呼ばれる。省略すると引数なしの new Player() が使える
  constructor = (name: string) {
    self.name = name
  }

  // 外から呼びたいメソッドだけ public
  public method run = () {
    self.draw()
    self.update()
  }

  method draw = ()   { /* private */ }
  method update = () { /* private */ }
}

// エントリポイントは必ず main()
function main = () {
  var pl: Player = new Player("taro")
  pl.run()
}
```

## 型

| 型 | 説明 | Python |
|---|---|---|
| `int` | 整数 | `int` |
| `float` | 小数 | `float` |
| `string` | 文字列（変更不可） | `str` |
| `boolean` | `true` / `false` | `bool` |
| `T[]` | 配列 | `list[T]` |
| `T?` | `T` または `null` | `T \| None` |
| `void` | 戻り値なし（戻り値の型にだけ書ける） | `None` |

- `null` はリテラル（値）であり、型の名前ではない。
- `int` → `float` への暗黙変換は許可する。`float` → `int` は不可（`to_int` を使う）。配列は型が一致するものだけ渡せる（`int[]` を `float[]` に渡すのは不可）。
- 文字列と数値は `+` で連結できない。`to_string()` か文字列補間を使う（型エラーとして案内する）。
- `/` は常に `float` を返す（`7 / 2` は `3.5`）。整数除算は組み込みの `div(a, b)` を使う。`%` と `div` は Python と同じ（負の数では切り下げ：`-7 % 3` は `2`）。
- 整数の桁数に上限はない（Python と同じ）。数値リテラルは `0` 以外で先頭が `0` のものを許さない（`007` はエラー）。
- `const` は再代入のみ禁止。配列の要素変更（`a[0] = 2`、`push` など）は許す。
- 文字列は変更できない。`s[i]` で読めるが `s[i] = "x"` はエラー。
- 添字に負の整数リテラルを書くとコンパイルエラー（`a[-1]` は Python と違い末尾を指さないため、混乱のもと）。変数の値が負になった場合は、Python と同じ動きになる（実行時の検査は入れない。生成コードを読みやすく保つため）。
- 空の配列 `[]` は、型が決まる場所（宣言の型注釈、引数、戻り値、代入先）でだけ書ける。
- `T?`
  - `T` には `null` を入れられない。`T?` を `T` が必要な場所（引数・代入・メンバアクセス・演算）で使うとコンパイルエラー。
  - **絞り込み（v0.1 は最小限）**：ローカル変数と引数 `x` に限り、次の範囲で `T` として使える。
    - `if x != null { ... }` の `{ }` の中（`and` でつないだ `x != null and ...` でも可）。
    - `while x != null { ... }` の `{ }` の中（毎回条件を確かめ直すので、本体の中で `x` に代入しても、次の周の頭では絞り込まれる）。
    - `x != null and 式` の、右側の `式`（`x == null or 式` の右側も同じ）。
    - `if x == null { ... } else { ... }` の `else` の中。
    - 範囲の中で `x` に代入すると、その後は `T?` に戻る。
    - フィールド（`self.x`）や式（`a[0]`）は絞り込まない（いったんローカル変数に入れて使う）。早期 `return` の後の絞り込みもしない。
  - `T?` のフィールドは、初期値がなければ `null` になる。

## 演算子・制御構文

- 算術：`+ - * / %`、比較：`== != < <= > >=`、論理：`and or not`
- **優先順位は Python に準拠**（高い順に `* / %` → `+ -` → 比較 → `not` → `and` → `or`）。
- 比較の連鎖（`a < b < c`）はコンパイルエラーにし、`a < b and b < c` と書くよう案内する。
- `if x = 1 {` のように条件に `=` を書いたときは、「`==` と書くと比べられます」と専用のメッセージを出す。
- `if / else if / else`、`while`、`for i in a..b`、`for x in xs`、`break`、`continue`
- `for i in 0..n { }`：
  - `i` はこのループで作る新しい `int` 変数で、`0` から `n - 1` まで 1 ずつ増える。
  - `n` は `int` の式で、ループに入るときに **1 回だけ評価する**。`n` が 0 以下なら 1 回も回らない。
  - `i` は読み取り専用（代入はコンパイルエラー）で、ループの外では使えない。
  - 条件で回したいときは `while` を使う。
- 複合代入 `+= -= *= /= %=` を使える（`x += 1` は `x = x + 1` と同じ。型は展開後と同じ規則で検査）。
- 識別子に日本語（ひらがな・カタカナ・漢字）を使える。全角英数字や半角カナなど、Python の正規化（NFKC）で形が変わる文字はエラーにする。`__` で始まる識別子は使えない。
- 文の終わりは改行（セミコロン不要。**決定**）。初学者が忘れやすい記号を増やさないため。継続行の規則は [GRAMMAR.ebnf](GRAMMAR.ebnf) の 1-1 を参照。

## 名前とスコープ

- **関数の中ではシャドーイング禁止**：引数、ローカル変数、トップレベルの変数と同じ名前を、入れ子の中や関数の中で宣言できない。兄弟のブロック（別々の `if` の中など）で同じ名前を宣言するのは、型が同じ場合に限り許す（Python では同じ変数になるため）。
- **トップレベル**には `function`、`class`、`var`、`const` を書ける。
  - トップレベルの変数の初期値には、リテラル・演算・他のトップレベルの `const`・組み込み関数だけを書ける（自作の関数やクラスは呼べない）。
  - 関数の中でトップレベルの `var` に代入するときは、コンパイラが自動で `global` 宣言を出力する（読むだけなら不要）。
- **クラスは先に定義してから使う**：型としても `new` でも、定義より前の行では使えない。クラス自身の本体の中では自分の名前を使える（`next: Node?` など）。関数は順序を問わず呼べる（`main` を先頭に書いてよい）。
- `self` はクラスの中（constructor とメソッド）でだけ使える。
- `main()` はエントリポイントなので、自分で呼べない。
- 同じクラスの中で、フィールドとメソッドを同名にできない。

## クラスのフィールド

- 初期値のあるフィールドは、Python では `__init__` の先頭（constructor 本体より前）で `self.x = 初期値` と代入する（クラス属性にはしない。配列の初期値が全インスタンスで共有されるのを避けるため）。constructor がなければ `__init__` を生成する。
- 初期値がなく `T?` でもないフィールドは、constructor が必ず代入しなければならない（しなければコンパイルエラー）。

## 組み込み

Python側の詳細な対応は後ほど整理する。現時点で分かっている範囲のみ記載。

| Kururi | 説明 | Python |
|---|---|---|
| `output(x)` | 出力（改行あり） | `print(...)`（表示の規則は下） |
| `input()` | 1行入力（常に `string`） | `input()` |
| `to_string(x)` | 文字列へ変換 | 型による（下） |
| `to_int(s)` | 整数へ変換（失敗すると実行時エラー） | `int(s)` |
| `to_float(s)` | 小数へ変換（失敗すると実行時エラー） | `float(s)` |
| `a.length` | 配列・文字列の長さ | `len(a)` |
| `a.push(x)` | 配列の末尾に追加 | `a.append(x)` |
| `a.remove_at(i)` | 位置 `i` の要素を削除 | `a.pop(i)` |
| `div(a, b)` | 整数除算 | `a // b` |
| `random(a, b)` | `a` 以上 `b` 以下のランダムな整数（`int`） | `random.randint(a, b)`（ファイル先頭に `import random` を出す） |

- 文字列補間：`` `${式}` ``。式は何でも書け、結果は自動で文字列化される（`to_string` 不要）。バッククォートや `${` を文字として書くときは `\`` と `\${`。`{` と `}` はそのまま文字として書ける。

### 表示の規則（`output`・`to_string`・補間）

Kururi に書いた見た目のとおりに表示する。

| 値の型 | 表示 | 生成する Python |
|---|---|---|
| `string` | そのまま | そのまま |
| `int` / `float` | Python と同じ（`3`、`3.5`） | `str(x)` または f 文字列 |
| `boolean` | `true` / `false` | `__kururi_show(x)` |
| `T?` | `null` または `T` の表示 | `__kururi_show(x)` |
| 配列・オブジェクト | **v0.1 ではコンパイルエラー**（「配列はそのまま表示できません。`for` で 1 つずつ出力してください」） | — |

- `__kururi_show` は小さな補助関数で、`boolean` または `T?` を表示するプログラムの先頭にだけ出力する（`True` → `"true"`、`False` → `"false"`、`None` → `"null"`、それ以外は `str(x)`）。
- 変数だけを表示する場合など、式が単純なときは `("true" if x else "false")` のように補助関数なしで出してよい。

### 実行時エラー

`to_int("abc")`、配列の範囲外アクセス、0 での割り算などは、Python の実行時エラーになる。メッセージは実行環境（narapy など）の日本語訳に任せる。narapy に渡した場合は Python の行番号で出る。プレイグラウンドでは、コンパイラの行対応表（lineMap）で Kururi の行に直して、エディタの該当行に印を付ける（S9）。

## Pythonへの変換

| Kururi | Python |
|---|---|
| ファイルの先頭 | 何も出さない（初学者が混乱しないよう、`from __future__` も型ヒントも出さない）。`random` を使うときだけ `import random` |
| `var x: int = 1` / `const` | `x = 1`（型と `const` の制約は消える） |
| `else if` | `elif` |
| `true` / `false` / `null` | `True` / `False` / `None` |
| `for i in 0..n { }` | `for i in range(n):` |
| `` `a ${x}` `` | `f"a {x}"`（文字としての `{` `}` は `{{` `}}` にする） |
| `for x in xs { }` | `for x in xs:` |
| `function f(a: int): int` | `def f(a):`（型は消える） |
| `constructor = (...)` | `def __init__(self, ...):`（フィールドの初期値を先頭に出す） |
| `new Player("taro")` | `Player("taro")` |
| 空の本体 `{ }` | `pass` |
| 関数内でのトップレベル `var` への代入 | 関数の先頭に `global x` |
| `main()` の定義 | 末尾に `if __name__ == "__main__": main()` を出力 |

- 変換先の Python は **3.12**（narapy の Pyodide 0.27 に合わせる）。テストも 3.12 に固定する。
- `private` / `public` は変換後に概念が消える（名前もそのまま）。フィールドもメソッドもデフォルトは private で、`public` を付けたものだけ外から使える（`private` と明示してもよい）。違反はコンパイルエラー（例：「`name` は private なので、クラスの外からは使えません。`public` を付けるか、public なメソッド経由で使ってください」）。コンストラクタは常に外から呼べる。

## 名前の書き方

名前の付け方を 1 つに決め、違反はエラー（K0506）にする。直し方（例: `someVariable` → `some_variable`）を添える。

| 対象 | 形 | 例 |
|---|---|---|
| クラス | アッパーキャメルケース | `Dog`、`ShoppingCart` |
| `const` | 大文字のスネークケース | `TAX_RATE` |
| 上以外（`var`、関数、`method`、引数、フィールド、ループ変数） | スネークケース | `total_price`、`bark`、`i` |

- 検査するのは宣言の名前だけ。使う側は、宣言が正しければ合う。
- 英字を含まない名前（ひらがな・カタカナ・漢字だけ）は大文字・小文字がないので対象外。
- 組み込み名も同じ決まりに合わせた：`to_string`、`to_int`、`to_float`、配列の `remove_at`（`output`、`input`、`div`、`random`、`push`、`length` は変更なし）。
- 構文の診断（K0506 を含む）があるあいだは、型検査には進まない。

## 予約語

識別子（変数名・関数名など）には予約語を使えない。**Kururiの予約語**と**Pythonの予約語**でエラーメッセージを分ける。

### Kururiの予約語

`const var function method return class public private new constructor self if else while for in break continue true false null and or not int float string boolean void` と組み込み名（`output input to_string to_int to_float div random`）。

古い書き方（`let` `repeat` `foreach` `elseif`）は、予約語として残して「新しい書き方はこうです」と案内する（K0114）。

### Pythonの予約語（Kururiでは使えるはずが、変換後に衝突するもの）

- キーワード：`False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield`
- 変換後のコードが使う組み込み名：`print len str int float input range bool list`
- 変換後のコードが出力する名前：`__kururi_show`（`__` で始まる名前は元々使えない）

これ以外の Python の組み込み名（`sum`、`max`、`id` など）は、生成コードが使わないので Kururi では使ってよい。`match` `case` `type` `_` も Python では普通の名前として使えるので、制限しない。

エラーメッセージの例：

- Kururi予約語：「`class` はKururiの予約語なので、変数名には使えません。別の名前にしてください。」
- Python予約語：「`lambda` はKururiでは予約語ではありませんが、Pythonの予約語です。変換後のPythonコードで動かなくなるため使えません。」

## エラーメッセージ方針

- 日本語で、**何が・どこで・なぜ・どう直すか**の4点を必ず示す。
- 初学者の語彙を使う（「型不一致」ではなく「`int` と `string` は足し算できません」のように）。
- ソース位置（ファイル・行・列）と該当箇所の抜粋・下線を出す。
- 最初の1件で止めず、可能な限りまとめて報告する。
- エラーコードを付けて、後から解説を引けるようにする。コードの体系は S0 で決める（案：`K01xx` 構文、`K02xx` 名前・スコープ、`K03xx` 型、`K04xx` クラス・アクセス、`K05xx` 予約語）。

```
error[K0301]: 文字列と数値は + でつなげません
  --> example.kururi:19:15
   |
19 |   row = row + " " + result
   |                     ^^^^^^ この値は int です
   |
help: to_string(result) で文字列に変換してください
```

## 実装計画

### 構成：narapy とは URL で受け渡す

[narapy](https://github.com/osad-sakana/narapy)（ブラウザ完結の Python 学習環境。TypeScript・Vite・Monaco・Pyodide）は、同じ作者が別に管理している。**Kururi のために narapy を変更せず、narapy の公開されている入口だけを使う**。

- narapy は postMessage を使えず（COOP `same-origin`）、外から渡せるのは URL の `#code=` / `#project=` / `?project=` だけ（narapy の README・docs より）。
- そこで Kururi は独自のプレイグラウンドを持ち、実行したいときに「narapy で開く」で生成した Python を `#project=` に載せて渡す。`.narapy` 形式（zip + `narapy.json`）を zlib + base64url にしたもので、`main.py` と参照用の `main.kururi.txt`（narapy は未知の拡張子をバイナリ扱いするため、.txt を付ける）を入れる。
- 変更の追従：
  - CI で narapy の `main` を取得し、Kururi が作った受け渡しデータを narapy 自身のデコード処理で読めるかテストする（毎日と PR ごと）。
  - narapy の変更で壊れたら、そのテストが落ちる。同じ作者なので、Kururi 側を直す／narapy の URL 形式を明文化してもらう／必要なら narapy 側に入口を足す、のどれで解消するかをその時に選ぶ。
- iframe での埋め込みやフォークは採らない（再読み込みごとに Pyodide が立ち上がる・更新の衝突が続くため）。
- 受け渡しの代償（学習者に伝える）：実行はタブを移って行う。押すたびに narapy 側にプロジェクトが増える。実行時エラーは Python の行番号で出る。

```
kururi/
  packages/
    compiler/    純粋な TypeScript（DOM なし）。字句解析 → Python 生成。診断を返す
    cli/         kururi build / run / check / export（.narapy 出力）
  apps/
    playground/  Kururi 独自のブラウザアプリ（Monaco、診断の赤線、Python の並べて表示、narapy へ受け渡し）
  tests/
    cases/       *.kururi + 期待する *.py または *.err（ゴールデンテスト）
    narapy/      narapy の受け渡し形式の互換テスト
```

### 技術選定

- **TypeScript（Node.js 22 以上）、`pnpm`、`vitest`**：narapy の技術構成に合わせる。
- 変換先は Python 3.12。
- コマンド名 `kururi`、拡張子 `.kururi`。

### コンパイラの処理の流れ

```
ソース → 字句解析 → 構文解析 → 名前解決（2 パス）→ 型検査 → Python生成
              ↘ 各段階が診断（エラー）を集めて返す。途中で止まらない ↙
```

- 各段階は例外を投げず、`診断` のリストを返す。構文解析は `NL` / `}` まで読み飛ばして続行し、**1回の実行で複数のエラーを出す**。
- AST の全ノードにソース位置（行・列・範囲）を持たせる。エラー表示とエディタの赤線の土台になる。
- AST と診断は不変（immutable）なデータとして扱う。
- 診断の種類は一箇所（コード + 日本語メッセージの雛形 + ヒント）にまとめる。メッセージの品質がこの言語の価値なので、文言を直しやすくする。
- 名前解決は 2 パス（先に関数・クラスの名前を集めてから本体を解決）。関数は順序を問わず呼べるため。
- Python生成時に「Kururi の行 ↔ Python の行」の対応表を作る（並べて表示用）。生成する Python は、Kururi の 1 文が Python の 1〜数行に対応する素直な形にする。
- コンパイラは入力文字列から結果（Python コード・診断・行対応表）を返す純粋な関数として公開する。ファイルやDOMには触れない。

### 進め方：縦に薄く通してから広げる

段階ごとに全部作ると、動くものが最後まで見えない。**最小の機能を字句解析から生成まで通し、機能を足しながら各段階を育てる**。各スライスはテストを先に書く（TDD）。

| スライス | 内容 | 完了の目安 |
|---|---|---|
| S0 | 土台：リポジトリ、診断の仕組み、エラーコードの体系、ゴールデンテストの枠 | `kururi check` が空ファイルで動く |
| S1 | `output`、`var`/`const`、`int`/`float`/`string`/`boolean`、四則演算、`to_string`、文字列補間、**引数なしの `function main = () { }`**、`if __name__`、`kururi run`（最小） | `output("hello")` と簡単な計算が実行できる |
| S2a | `if`/`else if`/`else`、`while`、`for i in a..b`、`break`/`continue`、複合代入 | **example.kururi が正しい出力で動く** |
| S2b | 配列、`for`、`push`/`remove_at`/`length`、文字列の添字 | 配列を使う例が動く |
| S3 | 関数（引数・戻り値）、型検査、`return` 抜けの検出、シャドーイング禁止、トップレベル変数と `global` | 再帰（階乗など）が動く |
| S4 | クラス、`constructor`、`self`、`new`、フィールド初期値、`public`/`private` 検査 | 簡単なクラスの例が動く |
| S5 | `T?` と `null`、絞り込み（最小）、`input`/`to_int`/`to_float`/`div`、`boolean` と `T?` の表示 | 入力を受けて計算する例が動く |
| S6 | narapy への受け渡し：`kururi export`（`.narapy` と URL を出力）、互換テストの CI | 生成した URL を narapy で開くと実行できる |
| S7 | Playground：Monaco の言語登録、診断の赤線表示、Python の並べて表示 | ブラウザで書きながらエラーが出る |
| S8 | エラーメッセージの磨き込み、予約語（Kururi/Python）の別メッセージ、`for` 案内、`=` と `==` の取り違え | 代表的な間違いごとに期待したメッセージが出る |
| S9 | プレイグラウンド内の最小の Pyodide 実行（`output` と `input` のみ）と、実行時エラーの Kururi の行への対応づけ、LSP | その場で実行でき、エディタでも診断が出る |

- v0.1 のゴールは **S0〜S6**。
- エラーメッセージの品質は S8 だけに任せず、S0 で診断の仕組みを作り、各スライスで文言も同時に書く。

### テスト方針

- 各段階の単体テスト + ゴールデンテスト（`.kururi` → 期待する `.py` / 期待する診断）。
- 生成した Python は「教材として読める形か」を基準に、ゴールデンテストのレビューで確認する。
- **E2E**：生成した Python をローカルの `python3`（3.12）で実行し、標準出力が期待値と一致することを確認する（example.kururi など）。無限ループ対策に、実行にはタイムアウトを付ける。
- 受け渡しの互換テスト：narapy の `main` を取得し、その URL / `.narapy` のデコード処理で Kururi の出力を読めることを確認する。
- エラーメッセージはスナップショットで固定し、文言変更が意図したものか確認できるようにする。
- カバレッジ 80% 以上。

### リスク

- **改行の規則**（字句解析）：継続行の判定が最も壊れやすい。早い段階（S1〜S2）で網羅的にテストする。
- **文字列補間の字句解析**：`${ }` の入れ子と改行規則の兼ね合い。専用のモードを持たせる。
- **nullable の絞り込み**：範囲が広がりやすい。最小（`if x != null { }` の中だけ）で止める。
- **narapy の形式変更**：互換テストで検知する。
- **`input()` を使う例**：narapy の採点モード（`.exercise`）では失敗する。受け渡しの対象は通常の `.narapy` のみとする。
- **実行時エラーが Python の行で出る**：プレイグラウンドでは S9 で解消済み。narapy 側では Python の行のままなので、教材で説明する。
- **ブラウザでの毎回コンパイル**：入力のたびに実行するため、コンパイラは軽く保つ（デバウンスは Playground 側）。

## 未決事項

仕様として残っている未決事項はない。次は v0.2 以降の検討。

- 配列・オブジェクトの表示（v0.1 はコンパイルエラー。`[a, b]` 形式を許すか）
- 絞り込みの拡張（早期 `return` の後、フィールドなど）
- 継承・静的メンバ・辞書型（当面スコープ外）

### S9 の実装メモ

- 実行：Pyodide 0.27.0（narapy と同じ）を Web Worker で動かす。画面を固めず、10 秒を超えたらワーカーごと止める（「止める」ボタンもある）。
- `input()`：出力欄の中にインラインで入力欄を出し、Enter で確定する（narapy と同じく SharedArrayBuffer と Atomics.wait で待つ。公開先でも動くよう `coi-serviceworker.js` を同梱）。
- Python 欄：編集不可。変換できない間は、エラーの文章を出し続ける。
- LSP：`packages/lsp`（`pnpm kururi-lsp` 相当は `tsx packages/lsp/src/bin.ts --stdio`）。診断のみ（全文同期）。エディタ側の拡張機能は含まない。

### S10：構文の統一

目的は「障壁なく学ぶ」こと。宣言を「種類 名前 = 中身」の形にそろえ、Python と違う書き方を減らした。

- 変数 `var`（`let` をやめた）。型は `名前: 型` で変数・引数・フィールドに共通。
- 関数 `function f = (a: int) -> int { }`。戻り値がなければ `->` を省く。
- クラス `class C = { }`、`constructor = (...) { }`。継承 `class D = (C) { }` は予約のみ（K0002）。
- ループ：`for i in 0..10`（範囲）と `for x in xs`（配列）の 2 つに統一。`repeat` / `foreach` はやめた。
- 分岐：`else if`（`elseif` をやめた）。
- 古い書き方は K0114 で「新しい書き方はこうです」と案内する。
- クラスの中は `fields = { ... }`（データ）、`constructor = (...) { }`（作り方）、`method 名前 = (...) { }`（動き）の 3 部構成。`fields` は 1 回だけ、constructor と method より前（K0115）。クラスの直下にフィールドを書いたり、クラスの中で `function` と書いたりすると K0114 で案内する。
