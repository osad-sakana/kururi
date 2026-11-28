---
title: プログラムは文の並び
part: 1
partTitle: 文と式
chapter: 2
summary: 書いた順に、上から実行される。1行が1つの文になる。
concept: 文と実行の順番
goal: 文が上から順に実行されることを説明できる。
needs: 1-1 最初のプログラム
kind: 式文
words:
  - "文"
  - "式文"
  - "コメント"
---

<div class="say">

ぼくは、書いてある順番に、ひとつずつ話すよ。順番を入れ替えたら、どうなるかな？

</div>

## なぜ必要か

手順には、順番があります。朝の支度で、家を出たあとに顔を洗うと書いてあったら、困ります。

プログラムも、書いた順番に動きます。このルールを知らないと、書いたものがどう動くか、予想できません。

## やってみる

次のコードを書き写して、実行してみてください。

```kururi
function main = () {
    print("おはよう")
    print("今日もがんばろう")
    print("いってらっしゃい")
}
```

くるりんが、書いた順に1つずつ話します。

<div class="chat" role="img" aria-label="くるりんが、おはよう、今日もがんばろう、いってらっしゃい、の順に話している">
<p class="k">おはよう</p>
<p class="k">今日もがんばろう</p>
<p class="k">いってらっしゃい</p>
</div>

## しくみ

`print(...)`の1行は、<strong>文</strong>です。文は1行に1つ書き、改行が文の終わりの印になります。`;`は書きません。

`main`の`{ }`の中には、文を何行でも並べられます。プログラムは、上から下へ、1つずつ文を実行します。

<figure class="diagram">
<svg viewBox="0 0 560 200" role="img" aria-label="3つの文が、上から順に実行され、同じ色の吹き出しで、くるりんが順番に話す図">
<rect x="10" y="14" width="330" height="172" rx="12" style="fill: var(--color-editor); stroke: var(--color-line)" />
<g style="stroke: none"><rect x="11" y="34" width="328" height="40" rx="6" style="fill: color-mix(in srgb, var(--color-accent) 18%, transparent)" /><rect x="11" y="78" width="328" height="40" rx="6" style="fill: color-mix(in srgb, var(--color-spark) 18%, transparent)" /><rect x="11" y="122" width="328" height="40" rx="6" style="fill: color-mix(in srgb, var(--color-success) 18%, transparent)" /></g>
<g style="font: 14px var(--font-mono); fill: var(--color-code)"><text x="64" y="60"><tspan style="fill: var(--color-code-func)">print</tspan>(<tspan style="fill: var(--color-code-string)">"おはよう"</tspan>)</text><text x="64" y="104"><tspan style="fill: var(--color-code-func)">print</tspan>(<tspan style="fill: var(--color-code-string)">"今日もがんばろう"</tspan>)</text><text x="64" y="148"><tspan style="fill: var(--color-code-func)">print</tspan>(<tspan style="fill: var(--color-code-string)">"いってらっしゃい"</tspan>)</text></g>
<g style="stroke: none"><circle cx="38" cy="55" r="12" style="fill: var(--color-accent)" /><text x="38" y="60" text-anchor="middle" style="fill: #fff; font: 700 13px var(--font-sans)">1</text><circle cx="38" cy="99" r="12" style="fill: var(--color-spark)" /><text x="38" y="104" text-anchor="middle" style="fill: #fff; font: 700 13px var(--font-sans)">2</text><circle cx="38" cy="143" r="12" style="fill: var(--color-success)" /><text x="38" y="148" text-anchor="middle" style="fill: #fff; font: 700 13px var(--font-sans)">3</text></g>
<g style="fill: none; stroke: var(--color-muted); stroke-width: 1.6; stroke-linecap: round"><path d="M38 70 V84 M33 79 L38 85 L43 79" /><path d="M38 114 V128 M33 123 L38 129 L43 123" /></g>
<g style="fill: none; stroke-width: 1.8; stroke-dasharray: 4 4"><path d="M346 55 H380" style="stroke: var(--color-accent)" /><path d="M346 99 H380" style="stroke: var(--color-spark)" /><path d="M346 143 H380" style="stroke: var(--color-success)" /></g>
<g style="stroke-width: 1.4"><rect x="386" y="38" width="160" height="34" rx="16" style="fill: color-mix(in srgb, var(--color-accent) 18%, var(--color-panel)); stroke: var(--color-accent)" /><text x="466" y="60" text-anchor="middle" style="font: 13px var(--font-sans); fill: var(--color-ink)">おはよう</text><rect x="386" y="82" width="160" height="34" rx="16" style="fill: color-mix(in srgb, var(--color-spark) 18%, var(--color-panel)); stroke: var(--color-spark)" /><text x="466" y="104" text-anchor="middle" style="font: 13px var(--font-sans); fill: var(--color-ink)">今日もがんばろう</text><rect x="386" y="126" width="160" height="34" rx="16" style="fill: color-mix(in srgb, var(--color-success) 18%, var(--color-panel)); stroke: var(--color-success)" /><text x="466" y="148" text-anchor="middle" style="font: 13px var(--font-sans); fill: var(--color-ink)">いってらっしゃい</text></g>
</svg>
<figcaption>書いた順に、1、2、3と実行されます。同じ色の文と吹き出しが対応しています。</figcaption>
</figure>

`print(...)`のように、関数の呼び出しだけを書いた文を、<strong>式文</strong>と呼びます。この教材の最初の何章かは、式文だけでプログラムを作ります。

## 広げてみる

文の順番を入れ替えると、くるりんが話す順番も入れ替わります。

```kururi
function main = () {
    print("いってらっしゃい")
    print("今日もがんばろう")
    print("おはよう")
}
```

プログラムにメモを残したいときは、<strong>コメント</strong>を使います。`//`から行の終わりまでは、実行されません。

```kururi
function main = () {
    // あいさつの順番を決める
    print("おはよう")
    print("いってらっしゃい")
}
```

## わざと間違える

1つの文は1行に書きます。2つの文を、同じ行に書いてみます。

```kururi-error K0101
function main = () {
    print("おはよう") print("いってらっしゃい")
}
```

<div class="say">

ここには改行が必要です、って教えてくれたね。1行に1つの文、がルールだよ。

</div>

改行が必要な場所に`print`があった、と教えてくれます。文と文のあいだには、改行が要ります。

## まとめ

- プログラムは文の並びで、上から順に実行されます。
- 文は1行に1つ書きます。改行が文の終わりです。
- `print(...)`のような、呼び出しだけの文を式文と呼びます。

## 練習

1. 自己紹介を、3行のくるりんの言葉にしてください。
2. 次のコードを実行する前に、くるりんが話す順番を予想してください。

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

2つ目は、書いた順に、3、1、2と話します。小さい順や大きい順への並べ替えは、勝手にされません。

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

ここまでの`print`は、決まった言葉を話すだけでした。計算の結果を話させるには、どうすればよいでしょう。次は、式を見ます。
