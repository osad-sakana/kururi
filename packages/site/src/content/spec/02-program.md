---
title: プログラムの構造
order: 2
summary: プログラム全体の形、main、文の区切り、コメント、名前の付け方。
---

## 宣言と文

プログラムは宣言の並びで、宣言はプログラムの直下に書きます。宣言には次の3つがあります。

- `function`は関数
- `class`はクラス
- `var`と`const`はトップレベルの変数と定数

関数の中は文の並びです。文は関数の中にだけ書けます。

```kururi
const GREETING: string = "こんにちは"

function main = () {
    print(GREETING)
}
```

トップレベルに書けるのは宣言だけです。`print(...)`のような文を、関数の外には書けません。

```kururi-error K0110
print("こんにちは")

function main = () {
}
```

## main

`function main = () { ... }`が、プログラムの入口です。必ず1つ書きます。

- 引数は付けられない。
- 戻り値はない。`->`を付けるとエラーになる。
- 自分で`main()`を呼ぶこともできない。

## 文の区切り

文は改行で終わります。`;`は書きません。

行末が次のどれかなら、文は次の行へ続きます。

- `+`、`-`、`and`などの二項演算子
- `=`や`+=`などの代入の記号
- `,`と`.`

```kururi
function main = () {
    var total: int = 1 +
        2 +
        3
    print(total)
}
```

`( )`と`[ ]`の中の改行は無視され、`{ }`の中の改行は文の区切りになります。

## コメント

```kururi
// 行の終わりまでがコメント
function main = () {
    /* ここから、ここまでがコメント
       何行にまたがってもよい（入れ子にはできない） */
    print("hello") // 文のあとにも書ける
}
```

## 名前の付け方

名前の書き方は、種類ごとに決まっています。守らないと、警告ではなくエラーになります。

| 種類 | 書き方 | 例 |
|---|---|---|
| クラス | 先頭が大文字、`_`を含まない | `BankAccount` |
| `const` | 小文字を含まない | `MAX_COUNT` |
| それ以外（`var`、関数、メソッド、引数、フィールド、ループ変数） | 大文字を含まない | `total_count`、`add_item` |

### boolean の名前

型が`boolean`の名前は、`is_`か`has_`で始めます。`if is_ready`のように条件が文として読め、真偽の値だと名前から分かるからです。

- 対象は、`boolean`型の変数・引数・フィールドと、`-> boolean`の関数・メソッド。
- `const`は、`IS_`か`HAS_`で始める（`IS_DEBUG`）。
- `boolean[]`と`boolean?`は対象外。

```kururi
const IS_DEBUG: boolean = false

function is_even = (n: int) -> boolean {
    return n % 2 == 0
}

function main = () {
    var has_items: boolean = true
    print(is_even(4) and has_items)
    print(IS_DEBUG)
}
```

```kururi-error K0507
function main = () {
    var ready: boolean = true
    print(ready)
}
```

名前には、ほかにも次の決まりがあります。

- ひらがな、カタカナ、漢字の名前も使える。英字を含まない名前は、上の書き方の決まりの対象外になる。
- `__`で始まる名前は使えない。
- 全角の英数字や半角のカタカナなど、正規化で形が変わる文字は使えない。

```kururi-error K0506
function main = () {
    var totalCount: int = 0
    print(totalCount)
}
```

## 予約語

次の語は、名前に使えません。

```text
const var function method return class public private new constructor self
if else while for in times break continue
true false null and or not
int float string boolean
```

古い書き方を案内するために、`let`、`repeat`、`foreach`、`elseif`、`void`も予約語のままです。組み込みの関数名である`print`、`input`、`to_string`、`to_int`、`to_float`、`div`、`random`も、名前には使えません。

## リテラル

| 種類 | 書き方 | 備考 |
|---|---|---|
| 整数 | `0`、`42` | `007`のように0から始める書き方はできません |
| 小数 | `1.5`、`0.25` | `.5`や`5.`のように、小数点の片側だけでは書けません |
| 文字列 | `"こんにちは"` | 1行に書きます。エスケープは`\"`、`\\`、`\$`、`\n`、`\t`の5つだけです |
| 真偽 | `true`、`false` | |
| 値がない | `null` | |
| 配列 | `[1, 2, 3]` | 末尾に`,`を付けてもかまいません |
| 文字列補間 | `"x は ${x}"` | 文字列の中の`${式}`が、値に置き換わります |
