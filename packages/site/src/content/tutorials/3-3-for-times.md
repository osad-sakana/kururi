---
title: for（回数で繰り返す）
part: 3
partTitle: 並べて繰り返す
chapter: 3
summary: n 回繰り返す。繰り返した回数も使える。
concept: 回数の繰り返し
goal: for i n times で、回数を決めて繰り返せる。
needs: 3-2 for（配列を 1 つずつ）
kind: ブロック文
words:
  - "times"
  - "回数"
  - "ループ変数"
---

<div class="say">

3回言って、10回数えて、と頼まれたら、回数で繰り返すよ！

</div>

## なぜ必要か

くるりんに「がんばれ」を3回言わせたいとします。`print`を3回書けば済みます。

```kururi
function main = () {
    print("がんばれ")
    print("がんばれ")
    print("がんばれ")
}
```

では100回なら。回数だけを変えられたら、楽ですよね。

## やってみる

```kururi
function main = () {
    for i 3 times {
        print("がんばれ")
    }
}
```

`3`を`10`に変えれば、10回になります。

<div class="chat" role="img" aria-label="くるりんが、がんばれ、と3回話している">
<p class="k">がんばれ</p>
<p class="k">がんばれ</p>
<p class="k">がんばれ</p>
</div>

## しくみ

`for i 3 times { ... }`は、`{ }`の中を3回繰り返します。回数には、`3`のような数のほか、式も書けます。

`i`は、繰り返した回数を数える<strong>ループ変数</strong>です。`0`から始まり、1周ごとに1ずつ増えます。

<div class="eval" aria-label="3回繰り返すと、i は、0、1、2、になる">
<span>i = 0</span><i>→</i><span>i = 1</span><i>→</i><span>i = 2</span>
<small>3回なので、i は 0、1、2 になります。3 にはなりません。</small>
</div>

`i`を使えば、何周目かを話させることもできます。

```kururi
function main = () {
    for i 3 times {
        print("${i}周目")
    }
}
```

<div class="chat" role="img" aria-label="くるりんが、0周目、1周目、2周目、と話している">
<p class="k">0周目</p>
<p class="k">1周目</p>
<p class="k">2周目</p>
</div>

0周目では、ちょっと変ですね。1から数えたいときは、`i + 1`と書きます。

## 広げてみる

`i`は、配列の位置としても使えます。位置も0から始まるからです。

```kururi
function main = () {
    var names: string[] = ["さくら", "たろう", "はなこ"]
    for i names.length times {
        print("${i + 1}番目は、${names[i]}さん")
    }
}
```

回数には、式の`names.length`を書きました。配列の長さの回数だけ繰り返して、全部の要素を位置で取り出します。

<div class="chat" role="img" aria-label="くるりんが、1番目は、さくらさん、2番目は、たろうさん、3番目は、はなこさん、と話している">
<p class="k">1番目は、さくらさん</p>
<p class="k">2番目は、たろうさん</p>
<p class="k">3番目は、はなこさん</p>
</div>

`for 変数 in 配列`と`for i n times`は、場面で使い分けます。

| 書き方 | 向いているとき |
|---|---|
| `for x in xs { ... }` | 配列の要素を1つずつ使うとき |
| `for i n times { ... }` | 回数を決めて繰り返すとき、位置も使いたいとき |

## わざと間違える

ループ変数の中身を書き換えてみます。

```kururi-error K0213
function main = () {
    for i 3 times {
        i = 10
    }
}
```

<div class="say">

`i`は、ぼくが数えている回数だよ。書き換えられたら数えられなくなっちゃうから、エラーにするんだ。

</div>

## まとめ

- `for i n times { ... }`は、`n`回繰り返します。
- `i`は、0から始まる回数のループ変数です。1から数えたいときは`i + 1`と書きます。
- 回数には式も書けます。`names.length`がその例です。

## 練習

1. 「おはよう」をくるりんに5回言わせてください。
2. 1から5までの数を順番に話させてください。
3. 配列の合計を、`for i ... times`で求めてください。

<details>
<summary>答えの例</summary>

1つ目です。

```kururi
function main = () {
    for i 5 times {
        print("おはよう")
    }
}
```

2つ目です。

```kururi
function main = () {
    for i 5 times {
        print(i + 1)
    }
}
```

3つ目です。

```kururi
function main = () {
    var scores: int[] = [80, 65, 90]
    var total: int = 0
    for i scores.length times {
        total += scores[i]
    }
    print(total)
}
```

</details>

## つぎへ

ここまでのプログラムは、いつも同じ順番で全部を実行してきました。点数が60点以上なら、のように場合によってやることを変えたいときは、第4部で見ていきます。
