---
title: プログラムの構造
order: 2
summary: プログラム全体の形、main、文の区切り、コメント、名前の付け方。
---

## 宣言と文

プログラムは、**宣言の並び**です。宣言は、プログラムの直下に書きます。

- `function`：関数
- `class`：クラス
- `var` / `const`：トップレベルの変数・定数

関数の中は、**文の並び**です。文は、関数の中に書きます。

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

- 引数は付けられません。
- 戻り値はありません（`->`を付けるとエラー）。
- 自分で`main()`を呼ぶこともできません。

## 文の区切り

文の終わりは**改行**です。`;`は書きません。

行の終わりが次のどれかのときは、次の行へ続きます。

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

`( )`と`[ ]`の中の改行は、無視されます。`{ }`の中の改行は、文の区切りです。

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

名前は、種類ごとに書き方が決まっています。違反は警告ではなくエラーです。

| 種類 | 書き方 | 例 |
|---|---|---|
| クラス | 先頭が大文字、`_`を含まない | `BankAccount` |
| `const` | 小文字を含まない | `MAX_COUNT` |
| それ以外（`var`、関数、メソッド、引数、フィールド、ループ変数） | 大文字を含まない | `total_count`、`add_item` |

### boolean の名前

型が`boolean`の名前は、`is_`か`has_`で始めます。`if is_ready`のように、条件が文として読めて、真偽の値だと名前から分かるようにするためです。

- 対象：`boolean`型の変数・引数・フィールドと、`-> boolean`の関数・メソッド。
- `const`は、`IS_`か`HAS_`で始めます（`IS_DEBUG`）。
- `boolean[]`と`boolean?`は、対象外です。

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

名前の書き方の決まりは、次のとおりです。

- ひらがな・カタカナ・漢字の名前も使えます（英字を含まない名前は、上の決まりの対象外です）。
- `__`で始まる名前は使えません。
- 全角の英数字や、半角のカタカナなど、正規化で形が変わる文字は使えません。

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

古い書き方の案内に使うため、`let`、`repeat`、`foreach`、`elseif`、`void`も予約語のままです。組み込みの関数名（`print`、`input`、`to_string`、`to_int`、`to_float`、`div`、`random`）も、名前には使えません。

## リテラル

| 種類 | 書き方 | 備考 |
|---|---|---|
| 整数 | `0`、`42` | `007`のように、0から始まる書き方はできません |
| 小数 | `1.5`、`0.25` | `.5`や`5.`のように、小数点の片側だけは書けません |
| 文字列 | `"こんにちは"` | 1行に書きます。エスケープは`\"`、`\\`、`\$`、`\n`、`\t`の5つだけです |
| 真偽 | `true`、`false` | |
| 値がない | `null` | |
| 配列 | `[1, 2, 3]` | 末尾の`,`を付けてもかまいません |
| 文字列補間 | `"x は ${x}"` | 文字列の中の`${式}`が、値に置き換わります |
