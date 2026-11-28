---
title: 配列
part: 3
partTitle: 並べて繰り返す
chapter: 1
summary: 同じ種類の値を、順番に並べて、ひとまとめにする。
concept: 配列と位置
goal: 配列を作って、位置を指定して、値を取り出せる。
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

第3部は、<strong>たくさんの値</strong>を、まとめて扱う話だよ。ぼくは、数えるのが得意なんだ！

</div>

## なぜ必要か

クラスの5人の点数を、記録したいとします。変数を、人数ぶん作るのでしょうか。

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

100人になったら、変数が100個です。<strong>数が変わる</strong>たびに、プログラムを書き直すことになります。

同じ種類の値は、<strong>1つの入れ物に、並べて</strong>入れたいものです。

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

`int[]`は、「`int`の<strong>配列</strong>」という型です。`[80, 65, 90]`のように、`[ ]`の中に、値を`,`で区切って並べます。並べた1つ1つを、<strong>要素</strong>と呼びます。

<div class="cells" role="img" aria-label="80、65、90の3つの要素が、位置0、1、2に並んでいる">
<span data-i="0">80</span><span data-i="1">65</span><span data-i="2">90</span>
</div>

要素は、<strong>位置</strong>（添字）で取り出します。`scores[0]`は、先頭の要素です。位置は、<strong>0から</strong>数えます。

| 書き方 | 意味 | 値 |
|---|---|---|
| `scores[0]` | 0番目の要素 | `80` |
| `scores[2]` | 2番目の要素 | `90` |
| `scores.length` | 要素の数 | `3` |
| `scores.push(75)` | 末尾に、要素を足す | （値は返さない） |

要素は、<strong>同じ型だけ</strong>入れられます。`int[]`には、`int`の値だけです。

## 広げてみる

足した要素は、末尾に並びます。

<div class="cells" role="img" aria-label="80、65、90の後ろに、75が足された">
<span data-i="0">80</span><span data-i="1">65</span><span data-i="2">90</span><span data-i="3" class="new">75</span>
</div>

位置を指定して、要素を<strong>書き換える</strong>こともできます。`remove_at(位置)`で、取り除けます。

```kururi
function main = () {
    var scores: int[] = [80, 65, 90]
    scores[1] = 70
    scores.remove_at(0)
    print(scores)
    print(scores[scores.length - 1])
}
```

最後の要素は、`scores[scores.length - 1]`で取り出せます。位置は`0`から数えるので、<strong>長さより1つ小さい</strong>位置が、最後です。

<div class="chat" role="img" aria-label="くるりんが、[70, 90]、90、の順に話している">
<p class="k">[70, 90]</p>
<p class="k">90</p>
</div>

## わざと間違える

位置に、マイナスの数を、書いてみましょう。

```kururi-error K0315
function main = () {
    var scores: int[] = [80, 65, 90]
    print(scores[-1])
}
```

<div class="say">

位置は、<strong>0以上</strong>だけだよ。長さを超えた位置を指定すると、実行したときに、ぼくが止まって、教えるんだ。

</div>

## まとめ

- <strong>配列</strong>は、同じ型の値を、順番に並べたものです（`int[]`など）。
- 要素は、<strong>位置</strong>で取り出します。位置は、0から数えます。
- `length`は要素の数、`push`は足す、`remove_at`は取り除く、です。

## 練習

1. 好きな食べ物を、3つ、`string[]`に入れて、2番目を話させてください。
2. その配列に、もう1つ足して、`length`を話させてください。
3. 配列の、最後の要素を、取り出してください。

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

くるりんは、「すし」「4」「ピザ」と話します。

</details>

## つぎへ

配列に入っている値を、<strong>1つずつ全部</strong>使いたいときは、どうすればよいでしょう。`scores[0]`、`scores[1]`と、1つずつ書くのでしょうか。次は、繰り返しを見ていきます。
