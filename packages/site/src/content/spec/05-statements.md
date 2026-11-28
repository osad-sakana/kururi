---
title: 文
order: 5
summary: 文の4つの種類と、それぞれの書き方。変数、代入、if、while、for、return。
---

関数の中は、文の並びです。文は4つの種類に分かれます。

| 種類 | 中身 | 該当する文 |
|---|---|---|
| 式文 | 式だけ | 関数・メソッドの呼び出し |
| 宣言代入文 | 名前に値を入れる | `var`、`const`、代入 |
| ブロック文 | 式とブロック | `if`、`while`、`for` |
| ジャンプ文 | 流れを飛ばす | `return`、`break`、`continue` |

## 式文

式だけを書いた文です。関数やメソッドの呼び出しを、結果を使わずに書くときに使います。

```kururi
function main = () {
    var xs: int[] = []
    xs.push(1)
    print(xs)
}
```

呼び出し以外の式、たとえば`1 + 2`だけの文も書けます。ただし値が使われないので、警告になります。

```kururi-warning K0603
function main = () {
    var a: int = 1
    a == 2
}
```

## 宣言代入文

### 変数と定数

```kururi
function main = () {
    var count: int = 0
    const LIMIT: int = 10
    count = count + 1
    print(count)
    print(LIMIT)
}
```

- `var 名前: 型 = 初期値`は、あとから代入できる変数。
- `const 名前: 型 = 初期値`は、代入できない定数。
- 初期値は必ず書く。

### 代入

`左辺 = 式`で、左辺に値を入れます。左辺に書けるのは、変数、`a[i]`、`obj.field`だけです。

複合代入の`+=`、`-=`、`*=`、`/=`、`%=`も使えます。`x += 1`は`x = x + 1`と同じ意味です。`++`と`--`はありません。

代入は式ではないので、`if x = 1 { ... }`のように条件の中には書けません。条件には`==`を使います。

```kururi-error K0111
function main = () {
    var x: int = 1
    if x = 1 {
        print(x)
    }
}
```

## ブロック文

ブロック文は、`{ }`の中に文を入れられます。条件や回数の式は、`( )`で囲みません。

### if

```kururi
function main = () {
    var score: int = 75
    if score >= 90 {
        print("とてもよい")
    } else if score >= 60 {
        print("よい")
    } else {
        print("もう少し")
    }
}
```

条件は`boolean`でなければなりません。`if score`（`int`）はエラーです。

### while

条件が`true`のあいだ、`{ }`の中を繰り返します。

```kururi
function main = () {
    var n: int = 1
    while n < 100 {
        n = n * 2
    }
    print(n)
}
```

### for（回数）

`for 変数 回数 times { ... }`と書きます。変数は`0`から`回数 - 1`まで、1つずつ増えます。

```kururi
function main = () {
    for i 3 times {
        print(i)
    }
}
```

- 回数は`int`の式で、繰り返しに入るときに1回だけ評価される。`0`以下なら、1回も回らない。
- ループ変数は読み取り専用で、ループの外では使えない。
- `1`から数えたいときは、`i + 1`と書く。

### for（配列）

`for 変数 in 配列 { ... }`と書くと、配列の要素を先頭から1つずつ取り出します。

```kururi
function main = () {
    var names: string[] = ["a", "b"]
    for name in names {
        print(name)
    }
}
```

## ジャンプ文

### break と continue

`break`は繰り返し全体を、`continue`は今回の周回だけを終えます。どちらも、繰り返しの外では使えません。

```kururi
function main = () {
    for i 10 times {
        if i == 2 {
            continue
        }
        if i == 4 {
            break
        }
        print(i)
    }
}
```

### return

`return 式`は、関数を終えて、式の値を呼び出し元に返します。値を返さない関数では、`return`だけを書けます。

詳しくは[関数](functions)を参照してください。
