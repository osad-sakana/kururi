---
title: 配列
part: 3
partTitle: 並べて繰り返す
chapter: 1
summary: 同じ種類の値を順番に並べて、ひとまとめにする。
concept: 配列と位置
goal: 配列を作り、位置を指定して値を取り出せる。
needs: 2-4 名前の付け方
kind: 宣言代入文
words:
  - "配列"
  - "要素"
  - "位置（添字）"
  - "length"
  - "push"
---

<div class="say">

第3部では、たくさんの値をまとめて扱うよ。数えるのは、ぼくの得意技なんだ！

</div>

## なぜ必要か

クラス5人の点数を記録したいとします。変数を人数ぶん作るしかないのでしょうか。

```kururi
function main = () {
    var score1: int = 80
    var score2: int = 65
    var score3: int = 90
    var score4: int = 72
    var score5: int = 88
    print(score1 + score2 + score3 + score4 + score5)
}
```

100人なら変数が100個。人数が変わるたびに、プログラムを書き直すことになります。

同じ種類の値なら、1つの入れ物に並べて入れたいところです。

## やってみる

```kururi
function main = () {
    var scores: int[] = [80, 65, 90]
    print(scores)
    print(scores[0])
    print(scores.length)
    scores.push(75)
    print(scores)
}
```

<div class="chat" role="img" aria-label="くるりんが、[80, 65, 90]、80、3、[80, 65, 90, 75]、の順に話している">
<p class="k">[80, 65, 90]</p>
<p class="k">80</p>
<p class="k">3</p>
<p class="k">[80, 65, 90, 75]</p>
</div>

## しくみ

`int[]`は、`int`の<strong>配列</strong>を表す型です。`[80, 65, 90]`のように、`[ ]`の中に値を`,`で区切って並べます。並んだ1つ1つが<strong>要素</strong>です。

<div class="cells" role="img" aria-label="80、65、90の3つの要素が、位置0、1、2に並んでいる">
<span data-i="0">80</span><span data-i="1">65</span><span data-i="2">90</span>
</div>

要素は、<strong>位置</strong>で取り出します。添字とも呼びます。`scores[0]`は先頭の要素で、位置は0から数えます。

| 書き方 | 意味 | 値 |
|---|---|---|
| `scores[0]` | 0番目の要素 | `80` |
| `scores[2]` | 2番目の要素 | `90` |
| `scores.length` | 要素の数 | `3` |
| `scores.push(75)` | 末尾に要素を足す | 値は返さない |

入れられる要素は、同じ型だけです。`int[]`なら、`int`の値しか入りません。

## 広げてみる

足した要素は、末尾に付きます。

<div class="cells" role="img" aria-label="80、65、90の後ろに、75が足された">
<span data-i="0">80</span><span data-i="1">65</span><span data-i="2">90</span><span data-i="3" class="new">75</span>
</div>

位置を指定すれば、要素を書き換えられます。`remove_at(位置)`なら、その要素を取り除けます。

```kururi
function main = () {
    var scores: int[] = [80, 65, 90]
    scores[1] = 70
    scores.remove_at(0)
    print(scores)
    print(scores[scores.length - 1])
}
```

最後の要素は、`scores[scores.length - 1]`で取り出せます。位置は`0`から数えるので、長さより1つ小さい位置が最後になります。

<div class="chat" role="img" aria-label="くるりんが、[70, 90]、90、の順に話している">
<p class="k">[70, 90]</p>
<p class="k">90</p>
</div>

## わざと間違える

位置にマイナスの数を書いてみます。

```kururi-error K0315
function main = () {
    var scores: int[] = [80, 65, 90]
    print(scores[-1])
}
```

<div class="say">

位置は0以上の数だけだよ。長さを超えた位置を指定したときは、実行中にぼくが止まって教えるね。

</div>

## まとめ

- 配列は、同じ型の値を順番に並べたものです。`int[]`がその一例です。
- 要素は位置で取り出し、位置は0から数えます。
- `length`は要素の数、`push`は要素を足す、`remove_at`は要素を取り除くものです。

## 練習

1. 好きな食べ物を3つ`string[]`に入れて、2番目を話させてください。
2. その配列にもう1つ足して、`length`を話させてください。
3. 配列の最後の要素を取り出してください。

<details>
<summary>答えの例</summary>

```kururi
function main = () {
    var foods: string[] = ["カレー", "すし", "ラーメン"]
    print(foods[1])
    foods.push("ピザ")
    print(foods.length)
    print(foods[foods.length - 1])
}
```

くるりんは、すし、4、ピザの順に話します。

</details>

## つぎへ

配列の値を全部使いたいとき、`scores[0]`、`scores[1]`と1つずつ書いていくのは大変です。次は繰り返しで、これを楽にします。
