---
title: for（配列を 1 つずつ）
part: 3
partTitle: 並べて繰り返す
chapter: 2
summary: 配列の要素に、同じ処理を、1つずつ行う。
concept: 配列の繰り返し
goal: for を使って、配列の全部の要素を、順番に処理できる。
needs: 3-1 配列
kind: ブロック文
words:
  - "繰り返し"
  - "for"
  - "ブロック文"
  - "ループ変数"
---

<div class="say">

配列の中身を、**順番に**ぜんぶ読み上げるよ。何人いても、だいじょうぶ！

</div>

## なぜ必要か

3人の名前の配列に、あいさつをしたいとします。位置を、1つずつ書くと、こうなります。

```kururi
function main = () {
    var names: string[] = ["さくら", "たろう", "はなこ"]
    print("こんにちは、${names[0]}さん")
    print("こんにちは、${names[1]}さん")
    print("こんにちは、${names[2]}さん")
}
```

100人いたら、100行です。名前が増えるたびに、プログラムを書き足すことになります。

**同じ処理を、配列の全部の要素に**行うには、どう書けばよいでしょう。

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

名前が増えても、`for`の部分は、**そのまま**です。

## しくみ

`for name in names { ... }`は、`names`の要素を、**先頭から1つずつ**取り出して、`{ }`の中を実行します。取り出した要素は、`name`に入ります。この`name`を、**ループ変数**と呼びます。

<div class="eval" aria-label="1周目は name が さくら、2周目は たろう、3周目は はなこ">
<span>name = "さくら"</span><i>→</i><span>name = "たろう"</span><i>→</i><span>name = "はなこ"</span>
<small>{ } の中を、1周ずつ実行するたびに、name が、次の要素になります。</small>
</div>

`for`は、**ブロック文**です。`{ }`の中に、文を並べられます。ブロックの中に、ブロック文を入れることもできます。

## 広げてみる

繰り返しの中で、変数を書き換えると、**合計**を作れます。

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

`total`は、1周ごとに、`0 → 80 → 145 → 235`と、増えていきます。

<div class="eval" aria-label="total が、0、80、145、235、と増えていく">
<span>0</span><i>→</i><span>80</span><i>→</i><span>145</span><i>→</i><span>235</span>
<small>1周ごとに、score を足していきます。</small>
</div>

<div class="chat" role="img" aria-label="くるりんが、合計は、235点、と話している">
<p class="k">合計は、235点</p>
</div>

## わざと間違える

配列でないものを、`for`に渡してみましょう。

```kururi-error K0306
function main = () {
    var count: int = 5
    for x in count {
        print(x)
    }
}
```

<div class="say">

`for x in`の後ろには、**配列**を書くんだ。`5`のような、1つの数は、順番に取り出せないから、エラーになるよ。

</div>

## まとめ

- `for 変数 in 配列 { ... }`で、配列の要素を、1つずつ処理します。
- 取り出した要素は、**ループ変数**に入ります。
- `{ }`の中に、文を並べられます。これが、**ブロック文**です。

## 練習

1. 好きな食べ物の配列を、`for`で、1つずつ話させてください。
2. 点数の配列の、**平均**を、求めてください（ヒント：合計を、`length`で割ります。割り算は、`div`を使います）。
3. `for`の中で、`print`の代わりに、`total += 1`と書くと、何を数えられるでしょうか。

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

3つ目は、`total`が、要素の**数**になります。`length`と同じ答えです。

</details>

## つぎへ

`for ... in`は、配列の要素を、1つずつ取り出しました。では、「**3回**繰り返す」のように、回数で繰り返したいときは、どうすればよいでしょう。
