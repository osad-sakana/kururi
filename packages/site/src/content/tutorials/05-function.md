---
title: 関数
order: 5
concept: 関数・引数・戻り値
summary: 手順に名前を付けて、引数を渡し、結果を受け取る。
---

何度も使う手順には、**名前を付けて**まとめます。これが関数です。

```kururi
function add = (a: int, b: int) -> int {
    return a + b
}

function greet = (name: string) {
    print("こんにちは、${name}さん")
}

function main = () {
    greet("たろう")
    print(add(3, 4))
}
```

## 何が書いてあるか

- `function 名前 = (引数) -> 戻り値の型 { ... }`が、関数の作り方です。
- **引数**は、関数に渡す値です。`名前: 型`で書きます。
- **戻り値**は、関数が返す結果です。`return 値`で返します。返す値がなければ`->`は書きません。
- 関数は`名前(値)`で呼び出します。

## 概念：入力と出力で考える

関数は「何を受け取って、何を返すか」で考えます。`add`は2つの整数を受け取って、整数を返します。中身を知らなくても、使い方が分かります。これが「分けて考える」ことの強みです。

## 概念：変数の有効範囲

関数の中で作った変数は、その関数の中だけで使えます。`if`や`for`の`{ }`の中で作った変数も、その外では使えません。範囲を小さく保つと、バグが減ります。

## ほかの言語では

```python
def add(a: int, b: int) -> int:
    return a + b
```

```typescript
function add(a: number, b: number): number {
  return a + b
}
```

```java
static int add(int a, int b) {
    return a + b;
}
```

## 練習

1. 2つの数のうち大きいほうを返す`max_of`関数を作ってみましょう。
2. `main`の中で、作った関数を2回呼び出してみましょう。
