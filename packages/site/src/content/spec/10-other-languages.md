---
title: ほかの言語から来た人へ
order: 10
summary: Python・JavaScript・Javaの書き方との対応と、迷いやすい点。
---

ほかの言語を知っている人が、Kururiの書き方を引くための対応表です。

## 書き方の対応

| やりたいこと | Kururi | Python | JavaScript | Java |
|---|---|---|---|---|
| 変数 | `var x: int = 1` | `x = 1` | `let x = 1` | `int x = 1;` |
| 定数 | `const X: int = 1` | `X = 1`（慣習） | `const X = 1` | `final int X = 1;` |
| 関数 | `function f = (a: int) -> int { ... }` | `def f(a): ...` | `function f(a) { ... }` | `int f(int a) { ... }` |
| 入口 | `function main = () { ... }` | `if __name__ == "__main__":` | （なし） | `public static void main(...)` |
| 分岐 | `if a { } else if b { } else { }` | `if / elif / else` | `if / else if / else` | `if / else if / else` |
| 回数で繰り返す | `for i 10 times { }` | `for i in range(10):` | `for (let i = 0; i < 10; i++)` | `for (int i = 0; i < 10; i++)` |
| 配列を回す | `for x in xs { }` | `for x in xs:` | `for (const x of xs)` | `for (int x : xs)` |
| 条件で繰り返す | `while a { }` | `while a:` | `while (a)` | `while (a)` |
| 配列 | `var xs: int[] = [1, 2]` | `xs = [1, 2]` | `const xs = [1, 2]` | `int[] xs = {1, 2};` |
| 長さ | `xs.length` | `len(xs)` | `xs.length` | `xs.length` |
| 末尾に足す | `xs.push(1)` | `xs.append(1)` | `xs.push(1)` | `list.add(1)` |
| 値がない | `null`、型は`T?` | `None` | `null` / `undefined` | `null` |
| 文字列に埋め込む | `"x は ${x}"` | `f"x は {x}"` | `` `x は ${x}` `` | `"x は " + x` |
| 整数の割り算 | `div(a, b)` | `a // b` | `Math.floor(a / b)` | `a / b` |
| 型の変換 | `to_int(s)`、`to_string(n)` | `int(s)`、`str(n)` | `parseInt(s)`、`String(n)` | `Integer.parseInt(s)` |
| クラス | `class A = { ... }` | `class A:` | `class A { }` | `class A { }` |
| 自分自身 | `self` | `self` | `this` | `this` |

## 迷いやすい点

### 条件は boolean だけ

`if 0`や`if name`のように、数や文字列を条件には使えません。`if count != 0`のように、`boolean`になる式を書きます。

### 型は必ず書く

変数・引数・フィールドの型は、省けません。型の推論はありません。

### 文字列と数は混ざらない

`"年齢は" + 20`はエラーです。`to_string(20)`か、文字列補間（`"年齢は${20}"`）を使います。`int`から`float`だけが、自動で変わります。

### `/` は常に小数

`7 / 2`は`3.5`です。整数の割り算は、`div(7, 2)`（`3`）です。

### 添字は0以上だけ

Pythonのように、`xs[-1]`で最後の要素は取れません。`xs[xs.length - 1]`と書きます。範囲の外は、実行時エラーです。

### 論理演算は英語

`and`、`or`、`not`を使います。`&&`、`||`、`!`はエラーです。

### 代入は式ではない

`if (x = 1)`のような書き方も、`a = b = c`のような連続代入もできません。`x++`もありません（`x += 1`）。

### 範囲の書き方はない

`range(10)`や`0..10`はありません。回数で繰り返すときは、`for i 10 times { }`です。`i`は`0`から`9`までです。

### 関数は値として渡せない

関数を変数に入れたり、引数に渡したりはできません。

### 文の終わりに `;` は書かない

改行が文の終わりです。`{ }`の位置に決まりはありません（`}`の直前の改行は、1行に書くときのために、自動で補われます）。

### 名前の付け方が決まっている

変数・関数は`snake_case`、クラスは`UpperCamelCase`、定数は`UPPER_SNAKE_CASE`です。`boolean`の名前は、`is_`か`has_`で始めます。違うとエラーになります。

### 値を返さない関数も式

`print(...)`も式で、`null`に評価されます。ただし、その値を使うのは、たいてい間違いなので、警告が出ます。

## 書き方を案内してもらえるもの

ほかの言語の書き方をしたときは、Kururiの書き方を案内します。

| 書いたもの | 案内 |
|---|---|
| `let x = 1` | `var`と書きます |
| `x++`、`x--` | `x += 1`、`x -= 1`と書きます |
| `&&`、`||`、`!` | `and`、`or`、`not`と書きます |
| `elseif` | `else if`と、2つに分けて書きます |
| `repeat`、`foreach`、`for (;;)` | `for`の書き方を案内します |
| `for i in 0..10` | `for i 10 times`と書きます |
| `function f = () -> void` | `->`を書かずに済ませます |
| `println`、`len`、`str`、`range`など | `print`、`.length`、`to_string`などを案内します |
