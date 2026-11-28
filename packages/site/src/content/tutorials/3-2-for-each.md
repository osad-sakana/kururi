---
title: for（配列を 1 つずつ）
part: 3
partTitle: 並べて繰り返す
chapter: 2
summary: 配列の要素に、同じ処理を1つずつ行う。
concept: 配列の繰り返し
goal: for を使って、配列の全部の要素を順番に処理できる。
needs: 3-1 配列
kind: ブロック文
words:
  - "繰り返し"
  - "for"
  - "ブロック文"
  - "ループ変数"
---

<div class="say">

配列の中身を、順番にぜんぶ読み上げるよ。何人いても大丈夫！

</div>

## なぜ必要か

3人の名前が入った配列に、あいさつをさせたいとします。位置を1つずつ書くと、こうなります。

```kururi
function main = () {
    var names: string[] = ["さくら", "たろう", "はなこ"]
    print("こんにちは、${names[0]}さん")
    print("こんにちは、${names[1]}さん")
    print("こんにちは、${names[2]}さん")
}
```

100人なら100行です。名前が増えるたびに、書き足さなければなりません。

同じ処理を配列の全部の要素に行うには、どう書けばよいのでしょう。

## やってみる

```kururi
function main = () {
    var names: string[] = ["さくら", "たろう", "はなこ"]
    for name in names {
        print("こんにちは、${name}さん")
    }
}
```

<div class="chat" role="img" aria-label="くるりんが、さくらさん、たろうさん、はなこさんの順に、あいさつをしている">
<p class="k">こんにちは、さくらさん</p>
<p class="k">こんにちは、たろうさん</p>
<p class="k">こんにちは、はなこさん</p>
</div>

名前が増えても、`for`の部分は書き換えなくて済みます。

## しくみ

`for name in names { ... }`は、`names`の要素を先頭から1つずつ取り出して、`{ }`の中を実行します。取り出した要素が入る`name`が、<strong>ループ変数</strong>です。

<div class="eval" aria-label="1周目は name が さくら、2周目は たろう、3周目は はなこ">
<span>name = "さくら"</span><i>→</i><span>name = "たろう"</span><i>→</i><span>name = "はなこ"</span>
<small>{ } の中を1周実行するたびに、name は次の要素に替わります。</small>
</div>

`for`は<strong>ブロック文</strong>で、`{ }`の中に文を並べられます。その中にブロック文を入れることもできます。

## 広げてみる

繰り返しの中で変数を書き換えれば、合計を作れます。

```kururi
function main = () {
    var scores: int[] = [80, 65, 90]
    var total: int = 0
    for score in scores {
        total += score
    }
    print("合計は、${total}点")
}
```

`total`は、1周ごとに`0 → 80 → 145 → 235`と増えていきます。

<div class="eval" aria-label="total が、0、80、145、235、と増えていく">
<span>0</span><i>→</i><span>80</span><i>→</i><span>145</span><i>→</i><span>235</span>
<small>1周ごとに score が足されます。</small>
</div>

<div class="chat" role="img" aria-label="くるりんが、合計は、235点、と話している">
<p class="k">合計は、235点</p>
</div>

## わざと間違える

配列ではないものを`for`に渡してみます。

```kururi-error K0306
function main = () {
    var count: int = 5
    for x in count {
        print(x)
    }
}
```

<div class="say">

`for x in`の後ろに書けるのは配列だけだよ。`5`のような1つの数は順番に取り出せないから、エラーになるんだ。

</div>

## まとめ

- `for 変数 in 配列 { ... }`は、配列の要素を1つずつ処理します。
- 取り出した要素は、ループ変数に入ります。
- `{ }`の中には文を並べられます。こうした文がブロック文です。

## 練習

1. 好きな食べ物の配列を、`for`で1つずつ話させてください。
2. 点数の配列の平均を求めてください。合計を`length`で割ります。割り算には`div`を使います。
3. `for`の中で`print`の代わりに`total += 1`と書くと、何を数えられるでしょうか。

<details>
<summary>答えの例</summary>

1つ目です。

```kururi
function main = () {
    var foods: string[] = ["カレー", "すし", "ラーメン"]
    for food in foods {
        print("${food}が好き")
    }
}
```

2つ目です。`div(a, b)`は、整数の割り算です。

```kururi
function main = () {
    var scores: int[] = [80, 65, 90]
    var total: int = 0
    for score in scores {
        total += score
    }
    print(div(total, scores.length))
}
```

3つ目は、`total`が要素の数になります。`length`と同じ答えです。

</details>

## つぎへ

`for ... in`は、配列の要素を1つずつ取り出しました。では、3回繰り返すように、回数を決めて繰り返したいときは、どうするのでしょう。
