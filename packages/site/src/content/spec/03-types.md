---
title: 値と型
order: 3
summary: Kururiの型の一覧と、型が合うかどうかの決まり。
---

Kururiは<strong>静的型付け</strong>の言語です。変数、引数、フィールドには必ず型を書き、型の間違いは実行の前に見つかります。

## 型の一覧

| 型 | 値の例 | 備考 |
|---|---|---|
| `int` | `42`、`-3` | 整数。大きさの上限はありません（Pythonの`int`） |
| `float` | `3.14`、`-0.5` | 小数 |
| `string` | `"abc"` | 文字列。中身は変更できません |
| `boolean` | `true`、`false` | 真偽 |
| `null` | `null` | 値がないこと。値を返さない関数の型でもあります |
| `T[]` | `[1, 2, 3]` | `T`の配列。`int[]`、`string[][]`など |
| `T?` | `null`か`T`の値 | `null`かもしれない値 |
| クラス名 | `new Point(1, 2)` | クラスから作ったオブジェクト |

## 型を書く場所

```kururi
function add = (a: int, b: int) -> int {
    return a + b
}

function main = () {
    var count: int = add(1, 2)
    const NAME: string = "kururi"
    print("${NAME}: ${count}")
}
```

- 変数は`var 名前: 型 = 初期値`と書く。初期値は必須。
- 引数は`名前: 型`と書く。
- 戻り値は`-> 型`と書く。値を返さないときは省く。

型の推論はありません。型を省いた`var x = 1`はエラーです。

## 型が合うかどうか

値を入れる場所の型と値の型は、同じでなければなりません。例外は次の3つだけです。

1. `int`の値を、`float`の場所に入れられる。`1`は`1.0`になる。
2. `null`を、`T?`の場所に入れられる。
3. 空の配列`[]`を、配列の型が決まる場所に入れられる。

```kururi
function main = () {
    var a: float = 1
    var b: string? = null
    var xs: int[] = []
    print(a)
    print(b)
    print(xs)
}
```

```kururi-error K0301
function main = () {
    var count: int = "three"
}
```

`float`の値を`int`に入れることも、文字列と数を`+`でつなぐこともできません。

```kururi-error K0302
function main = () {
    print("年齢は" + 20)
}
```

## 型を変える

| 関数 | 意味 | 備考 |
|---|---|---|
| `to_string(x)` | 文字列にする | 配列も`null`も`boolean`も、文字列にできます |
| `to_int(x)` | `int`にする | `string`、`float`、`int`を受けます。`float`は小数点以下を切り捨て、0に近いほうへ丸めます。整数でない文字列を渡すと、実行時エラーです |
| `to_float(x)` | `float`にする | `string`、`int`、`float`を受けます |

## 表示のされ方

`print`、`to_string`、文字列補間は、同じ規則で値を文字列にします。

| 値 | 表示 |
|---|---|
| `true` / `false` | `true` / `false` |
| `null` | `null` |
| 配列 | `[1, 2, 3]`、`["a", "b"]`（文字列には`"`が付きます） |
| 小数 | Pythonと同じ（`0.1 + 0.2`は`0.30000000000000004`） |

クラスのオブジェクトは、そのままでは表示できません。表示したいフィールドを取り出して`print`します。
