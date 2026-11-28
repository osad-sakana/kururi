---
title: 配列と文字列
order: 7
summary: 配列と文字列の書き方、添字、使えるメソッドの一覧。
---

## 配列

`T[]`は、`T`の値を並べた配列です。**要素の型は1種類だけ**です。

```kururi
function main = () {
    var scores: int[] = [80, 65, 90]
    var grid: int[][] = [[1, 2], [3, 4]]
    var empty: string[] = []
    print(scores)
    print(grid)
    print(empty)
}
```

### 添字

`xs[i]`で、`i`番目の要素を読み書きします。**位置は0から**数えます。

```kururi
function main = () {
    var xs: int[] = [10, 20, 30]
    xs[0] = 11
    print(xs[0])
    print(xs[xs.length - 1])
}
```

- 添字は`int`です。
- 負の数のリテラル（`xs[-1]`）は、コンパイルエラーです。
- 添字が負になったり、長さ以上になったりしたときは、**実行時エラー**で止まります。Pythonのように、後ろから数えることはしません。

```kururi-error K0315
function main = () {
    var xs: int[] = [1, 2, 3]
    print(xs[-1])
}
```

### 配列のメンバー

| メンバー | 意味 |
|---|---|
| `xs.length` | 要素の数（フィールド） |
| `xs.push(x)` | 末尾に`x`を足す |
| `xs.remove_at(i)` | `i`番目の要素を取り除く |
| `xs.contains(x)` | `x`が入っているか（`boolean`） |
| `xs.join(sep)` | `string[]`の要素を、`sep`でつないだ`string` |

`push`と`remove_at`は、値を返しません（呼び出しは`null`になります）。

```kururi
function main = () {
    var xs: int[] = [1, 2]
    xs.push(3)
    xs.remove_at(0)
    print(xs)
    print(xs.contains(3))
    var names: string[] = ["a", "b"]
    print(names.join(", "))
}
```

### 配列を渡すとき

配列は、関数に渡しても**同じもの**を指します。関数の中で書き換えると、呼び出し元の配列も変わります。

## 文字列

文字列は`"`で囲みます。中身は**変更できません**。`s[i] = "x"`のような代入はエラーです。

```kururi
function main = () {
    var s: string = "hello"
    print(s[1])
    print(s.length)
    print(s.upper())
}
```

### 文字列のメンバー

| メンバー | 意味 |
|---|---|
| `s.length` | 文字数（フィールド） |
| `s.upper()` | 大文字にした`string` |
| `s.lower()` | 小文字にした`string` |
| `s.trim()` | 前後の空白を取った`string` |
| `s.contains(t)` | `t`が入っているか |
| `s.starts_with(t)` | `t`で始まるか |
| `s.ends_with(t)` | `t`で終わるか |
| `s.index_of(t)` | `t`が最初に出る位置（なければ`-1`） |
| `s.replace(a, b)` | `a`を`b`に置き換えた`string` |
| `s.split(sep)` | `sep`で区切った`string[]` |

文字列のメソッドは、どれも**新しい値を返します**。元の文字列は変わりません。
