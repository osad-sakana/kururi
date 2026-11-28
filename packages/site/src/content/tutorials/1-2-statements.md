---
title: プログラムは文の並び
part: 1
partTitle: 文と式
chapter: 2
summary: 書いた順に、上から実行される。1行が、1つの文。
concept: 文と実行の順番
goal: 文が、上から順に実行されることを、説明できる。
needs: 1-1 最初のプログラム
kind: 式文
words:
  - "文"
  - "式文"
  - "コメント"
---

<div class="say">

ぼくは、書いてある順番に、ひとつずつ話すよ。順番を入れ替えると、どうなるかな？

</div>

## なぜ必要か

手順は、**順番**が大事です。たとえば、朝の支度で「家を出る」の後に「顔を洗う」と書いたら、困ります。

プログラムも同じで、書いた順番に、動きます。順番のルールを知らないと、書いたものが、どう動くかを予想できません。

## やってみる

次のコードを書き写して、実行してみましょう。

```kururi
function main = () {
    print("おはよう")
    print("今日もがんばろう")
    print("いってらっしゃい")
}
```

くるりんが、書いた順に、1つずつ話します。

<div class="chat" role="img" aria-label="くるりんが、おはよう、今日もがんばろう、いってらっしゃい、の順に話している">
<p class="k">おはよう</p>
<p class="k">今日もがんばろう</p>
<p class="k">いってらっしゃい</p>
</div>

## しくみ

`print(...)`の1行は、**文**です。文は、**1行に1つ**書きます。改行が、文の終わりの印です（`;`は書きません）。

`main`の`{ }`の中には、文を何行でも並べられます。プログラムは、**上から下へ、1つずつ**文を実行します。

<figure class="diagram">
<svg viewBox="0 0 560 200" role="img" aria-label="3つの文が、上から順に実行され、くるりんが順番に話す図">
<rect x="10" y="14" width="330" height="172" rx="12" style="fill: var(--color-editor); stroke: var(--color-line)" />
<g style="font: 14px var(--font-mono); fill: var(--color-ink)">
<text x="64" y="60">print("おはよう")</text>
<text x="64" y="104">print("今日もがんばろう")</text>
<text x="64" y="148">print("いってらっしゃい")</text>
</g>
<g style="font: 700 13px var(--font-sans); fill: var(--color-accent-ink)">
<circle cx="38" cy="55" r="12" style="fill: var(--color-accent)" /><text x="38" y="60" text-anchor="middle">1</text>
<circle cx="38" cy="99" r="12" style="fill: var(--color-accent)" /><text x="38" y="104" text-anchor="middle">2</text>
<circle cx="38" cy="143" r="12" style="fill: var(--color-accent)" /><text x="38" y="148" text-anchor="middle">3</text>
</g>
<g style="fill: none; stroke: var(--color-muted); stroke-width: 1.6; stroke-linecap: round"><path d="M38 70 V84 M33 79 L38 85 L43 79" /><path d="M38 114 V128 M33 123 L38 129 L43 123" /></g>
<g style="fill: none; stroke: var(--color-line); stroke-width: 1.6; stroke-dasharray: 4 4"><path d="M346 55 H380" /><path d="M346 99 H380" /><path d="M346 143 H380" /></g>
<g style="fill: var(--color-panel); stroke: var(--color-line)">
<rect x="386" y="38" width="150" height="34" rx="16" /><rect x="386" y="82" width="150" height="34" rx="16" /><rect x="386" y="126" width="150" height="34" rx="16" />
</g>
<g style="font: 13px var(--font-sans); fill: var(--color-ink)">
<text x="461" y="60" text-anchor="middle">おはよう</text><text x="461" y="104" text-anchor="middle">今日もがんばろう</text><text x="461" y="148" text-anchor="middle">いってらっしゃい</text>
</g>
</svg>
<figcaption>書いた順に、1、2、3と実行されて、くるりんが話します。</figcaption>
</figure>

`print(...)`のように、関数の呼び出しだけを書いた文を、**式文**と呼びます。この教材の最初の何章かは、式文だけでプログラムを作ります。

## 広げてみる

文の順番を入れ替えると、くるりんの話す順番も、入れ替わります。

```kururi
function main = () {
    print("いってらっしゃい")
    print("今日もがんばろう")
    print("おはよう")
}
```

プログラムに、メモを残したいときは、**コメント**を使います。`//`から行の終わりまでは、実行されません。

```kururi
function main = () {
    // あいさつの順番を決める
    print("おはよう")
    print("いってらっしゃい")
}
```

## わざと間違える

1つの文は、1行に書きます。2つの文を、同じ行に書いてみましょう。

```kururi-error K0101
function main = () {
    print("おはよう") print("いってらっしゃい")
}
```

<div class="say">

「ここには改行が必要です」って教えてくれたね。**1行に、1つの文**、がルールだよ。

</div>

「ここには改行が必要ですが、「print」がありました」と教えてくれます。文と文のあいだには、**改行**が必要です。

## まとめ

- プログラムは、**文の並び**で、上から順に実行されます。
- 文は、1行に1つ書きます。改行が、文の終わりです。
- `print(...)`のような、呼び出しだけの文を、**式文**と呼びます。

## 練習

1. 自己紹介を、3行のくるりんの言葉にしてください。
2. 次のコードを実行する前に、くるりんが話す順番を、予想してください。

   ```kururi
   function main = () {
       print("3")
       print("1")
       print("2")
   }
   ```

3. 2行を、1行にまとめて書き、エラーを読んでください。

<details>
<summary>答えの例</summary>

2つ目は、書いた順に、「3」「1」「2」と話します。「小さい順」や「数の大きい順」のような、並べ替えは、勝手にされません。

1つ目の例です。

```kururi
function main = () {
    print("はじめまして")
    print("わたしは、さくらです")
    print("よろしくお願いします")
}
```

</details>

## つぎへ

ここまでの`print`は、決まった言葉を話すだけでした。**計算の結果**を、くるりんに話させるには、どうすればよいでしょう。次は、式を見ていきます。
