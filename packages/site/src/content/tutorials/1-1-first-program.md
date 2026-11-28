---
title: 最初のプログラム
part: 1
partTitle: 文と式
chapter: 1
summary: くるりんにあいさつをさせて、プログラムが動くところをまず見る。
concept: プログラムと手順
goal: くるりんに好きな言葉を話させることができる。
kind: 式文
words:
  - "プログラム"
  - "main"
  - "print"
  - "関数"
  - "文字列"
---

<div class="say">

はじめまして、くるりんです！　これから、あなたが書いたプログラムの通りに、ぼくが話すよ。まず、ぼくに声を出させてみてね。

</div>

## なぜ必要か

コンピューターは、自分からは何もしません。何を、どの順番でするかを人が書いて渡すと、はじめて動きます。その書いたものが<strong>プログラム</strong>です。

この教材では、書いたプログラムの通りに、くるりんが話します。

## やってみる

右のプレイグラウンドを開いて、次のコードを書き写して、実行してみてください。コピーせず自分の手で書くほうが、覚えやすいです。

```kururi
function main = () {
    print("こんにちは、くるりん！")
}
```

実行すると、くるりんが吹き出しで話します。

<div class="chat" role="img" aria-label="くるりんが「こんにちは、くるりん！」と話している">
<p class="k">こんにちは、くるりん！</p>
</div>

## しくみ

このプログラムは、2つの部分でできています。

<figure class="diagram">
<svg viewBox="0 0 580 160" role="img" aria-label="function main の行と閉じかっこが入口（青）、print の行が手順（だいだい色）であることを示す図">
<rect x="10" y="14" width="370" height="132" rx="12" style="fill: var(--color-editor); stroke: var(--color-line)" />
<g style="stroke: none">
<rect x="11" y="26" width="368" height="36" style="fill: color-mix(in srgb, var(--color-accent) 16%, transparent)" />
<rect x="11" y="62" width="368" height="36" style="fill: color-mix(in srgb, var(--color-spark) 22%, transparent)" />
<rect x="11" y="98" width="368" height="36" style="fill: color-mix(in srgb, var(--color-accent) 16%, transparent)" />
</g>
<polygon points="22,37 22,51 34,44" style="fill: var(--color-accent)" />
<g style="font: 15px var(--font-mono); fill: var(--color-code)">
<text x="46" y="49"><tspan style="fill: var(--color-code-keyword)">function</tspan> main = () {</text>
<text x="46" y="85">&#160;&#160;&#160;&#160;<tspan style="fill: var(--color-code-func)">print</tspan>(<tspan style="fill: var(--color-code-string)">"こんにちは、くるりん！"</tspan>)</text>
<text x="46" y="121">}</text>
</g>
<g style="fill: none; stroke-width: 2"><path d="M386 44 H414" style="stroke: var(--color-accent)" /><path d="M386 80 H414" style="stroke: var(--color-spark)" /><path d="M386 116 H414" style="stroke: var(--color-accent)" /></g>
<g style="font: 700 15px var(--font-sans)">
<text x="424" y="42" style="fill: var(--color-accent)">入口</text>
<text x="424" y="78" style="fill: var(--color-spark)">手順</text>
<text x="424" y="114" style="fill: var(--color-accent)">入口の終わり</text>
</g>
<g style="font: 12px var(--font-sans); fill: var(--color-muted)">
<text x="424" y="58">ここから実行が始まる</text>
<text x="424" y="94">くるりんに話させる</text>
</g>
</svg>
<figcaption>青い行が入口（<code>main</code>）で、だいだい色の行が、入口の中の手順です。</figcaption>
</figure>

- `function main = () { ... }`は、プログラムの<strong>入口</strong>です。実行すると、ここから始まります。`{ }`の中に、してほしいことを書きます。
- `print("こんにちは、くるりん！")`は、くるりんに言葉を話させる手順です。

`print`のように、名前の付いた手順のまとまりを<strong>関数</strong>と呼びます。`print(...)`と書くと、その手順が実行されます。これを、関数を呼び出す、と言います。

`"こんにちは、くるりん！"`のように、`"`で囲んだものは<strong>文字列</strong>です。`print`は、渡された文字列をくるりんに話させます。

## 広げてみる

文字列の中身を変えれば、くるりんの言葉が変わります。日本語でも、ほかの文字でも書けます。

```kururi
function main = () {
    print("きょうは、いい天気だね")
}
```

`"`で囲むのを忘れると、ただの言葉ではなく、プログラムとして意味のある言葉（名前など）だと思われて、エラーになります。

## わざと間違える

エラーも、プログラミングの道具のひとつです。わざとかっこを閉じ忘れてみます。

<div class="say">

エラーは、怒っているんじゃなくて、直し方を教えてくれているんだよ。

</div>

```kururi-error K0101
function main = () {
    print("こんにちは"
}
```

エラーのカードには、次のことが書いてあります。

- 何が起きたか。ここでは、かっこが必要なのに改行があった、と書かれています。
- どこで起きたか。カードの右上と、コードの波線が示しています。
- どう直すか。カードの「直し方」に書かれています。

読み方が分かれば、エラーは怖くありません。`)`を足して直してみてください。

## まとめ

<div class="say">

やったね、最初のプログラムが動いた！　ぼくの声、ちゃんと聞こえたかな？

</div>

- プログラムは、コンピューターへの手順です。
- `function main = () { ... }`が入口で、`{ }`の中に手順を書きます。
- `print("...")`は、くるりんに言葉を話させる関数の呼び出しです。

## 練習

1. くるりんに、自分の好きな言葉を話させてください。
2. `"`を1つ消して実行し、エラーのカードを読んでみてください。
3. `print`を`Print`に書き換えて実行し、どんなエラーになるか見てください。

<details>
<summary>答えの例</summary>

1つ目は、文字列の中身を変えるだけです。

```kururi
function main = () {
    print("プログラミング、はじめました")
}
```

3つ目は、名前の大文字と小文字も区別されるので、`Print`という名前は宣言されていません、というエラーになります。

```kururi-error K0201
function main = () {
    Print("こんにちは")
}
```

</details>

## つぎへ

`print`が1つだけだと、くるりんは一言しか話せません。何回も話させるには、どうすればよいでしょう。次は、プログラムが動く順番を見ます。
