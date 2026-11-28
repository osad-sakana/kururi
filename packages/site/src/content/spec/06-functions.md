---
title: 関数
order: 6
summary: 関数の宣言と戻り値、null、main、スコープ、組み込み関数の一覧。
---

## 宣言

```kururi
function add = (a: int, b: int) -> int {
    return a + b
}

function main = () {
    print(add(1, 2))
}
```

- `function 名前 = (引数) -> 戻り値の型 { ... }`
- 引数には型が必要です。
- 関数は、プログラムの直下にだけ書けます（関数の中に関数は作れません）。
- 呼び出しは、定義より前に書いてもかまいません。

## 戻り値

**関数の呼び出しは式**で、評価すると戻り値になります。

`->`を省いた関数は、値を返しません。呼び出しを評価すると`null`になります。`return`だけを書いて、途中で終えることもできます。

```kururi
function greet = (name: string) {
    if name == "" {
        return
    }
    print("こんにちは、" + name)
}

function main = () {
    greet("Kururi")
}
```

`-> 型`を書いた関数は、**すべての道で値を返さなければなりません**。`return`が抜けている道があるとエラーです。

```kururi-error K0322
function sign = (n: int) -> int {
    if n > 0 {
        return 1
    } else if n < 0 {
        return -1
    }
}

function main = () {
}
```

値を返さない関数の呼び出しを、値として使うと、型が合わずにエラーになります（`int`に`null`は入れられません）。値として使う意味がないことが多いので、`null`を入れられる場所（`string?`など）に入れたときは、警告で知らせます。

```kururi-error K0301
function main = () {
    var x: int = print("a")
}
```

```kururi-warning K0604
function main = () {
    var x: string? = print("a")
    print(x)
}
```

## main

`main`は特別な関数です。プログラムの入口で、必ず1つ書きます。

- 引数なし、戻り値なし（`->`を書くとエラー）。
- 自分で呼ぶことはできません。

```kururi-error K0207
function main = (args: string[]) {
}
```

## 変数の有効範囲

- 関数の中で作った変数は、その関数の中だけで使えます。
- `{ }`の中で作った変数は、その`{ }`の外では使えません。
- 引数も、その関数の中だけで使えます。

### 同じ名前を使うとき

引数・ローカル変数・トップレベルの名前と**同じ名前の変数は作れません**（隠すことはできません）。

別々の`{ }`（`if`と`else`、続けて書いた2つの`for`など）で同じ名前を使うのは、**同じ型のときだけ**認められます。

```kururi
function main = () {
    var a: boolean = true
    if a {
        var x: int = 1
        print(x)
    } else {
        var x: int = 2
        print(x)
    }
    for i 2 times {
        print(i)
    }
    for i 2 times {
        print(i)
    }
}
```

```kururi-error K0211
function main = () {
    var a: boolean = true
    if a {
        var x: int = 1
        print(x)
    } else {
        var x: string = "a"
        print(x)
    }
}
```

### トップレベルの変数

トップレベルの`var`は、関数の中から読み書きできます。トップレベルの初期値には、自分で作った関数やクラスは使えません。

```kururi
var counter: int = 0

function bump = () {
    counter += 1
}

function main = () {
    bump()
    bump()
    print(counter)
}
```

## 組み込み関数

| 関数 | 戻り値 | 説明 |
|---|---|---|
| `print(x)` | `null` | 値を1行で表示する（引数は1つ） |
| `input()` | `string` | キーボードから1行を受け取る（引数なし） |
| `to_string(x)` | `string` | 値を文字列にする |
| `to_int(x)` | `int` | `string`・`float`を`int`にする |
| `to_float(x)` | `float` | `string`・`int`を`float`にする |
| `div(a, b)` | `int` | 整数の割り算（切り捨て） |
| `random(a, b)` | `int` | `a`以上`b`以下のランダムな整数 |
