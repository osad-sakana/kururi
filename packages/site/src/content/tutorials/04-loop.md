---
title: 繰り返し
order: 4
concept: 繰り返し
summary: 同じことを何度も書かずに、forとwhileで繰り返す。
---

同じことを100回やりたいとき、100行書く人はいません。**繰り返し**を使います。

## 回数で繰り返す：for

```kururi
function main = () {
    for i in 0..5 {
        print(i)
    }
}
```

`for i in 0..5`は、`i`を`0`から`4`まで1つずつ増やしながら、`{ }`の中を繰り返します。**終わりの`5`は含みません**（`0`以上`5`未満）。

## 配列の要素を1つずつ：for

```kururi
function main = () {
    var fruits: string[] = ["りんご", "みかん", "ぶどう"]
    for fruit in fruits {
        print(fruit)
    }
}
```

## 条件が続くあいだ：while

```kururi
function main = () {
    var count: int = 3
    while count > 0 {
        print(count)
        count = count - 1
    }
}
```

`while`は、条件が成り立つあいだ繰り返します。**条件がいつか偽になるようにしないと、止まりません**（無限ループ）。プレイグラウンドは、10秒たつと止めてくれます。

## 概念：繰り返しと変数の変化

繰り返しの中で、変数の値は少しずつ変わっていきます。**ステップ実行**を使うと、1行ずつ進めながら`count`が変わっていく様子を見られます。

## ほかの言語では

```python
for i in range(5):
    print(i)
```

```typescript
for (let i = 0; i < 5; i++) {
  console.log(i)
}
```

## 練習

1. `1`から`10`までの合計を、`for`で求めてみましょう（変数に足していきます）。
2. `while`で、`count`が`0`になるまで2ずつ減らしてみましょう。
