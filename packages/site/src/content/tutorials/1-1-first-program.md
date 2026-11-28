---
title: 最初のプログラム
part: 1
partTitle: 文と式
chapter: 1
summary: くるりんに、あいさつをさせる。プログラムが動くところを、まず見てみる。
concept: プログラムと手順
goal: くるりんに、好きな言葉を話させることができる。
kind: 式文
words:
  - "プログラム"
  - "main"
  - "print"
  - "関数"
  - "文字列"
---

<div class="say">

はじめまして、くるりんです！　これから、あなたの書いたプログラムの通りに、ぼくが話すよ。まずは、ぼくに声を出させてみてね。

</div>

## なぜ必要か

コンピューターは、自分では何もしません。**何を、どの順番でするか**を、人が書いて渡したとき、はじめて動きます。その書いたものが**プログラム**です。

この教材では、くるりんが、あなたの書いたプログラムの通りに話します。

## やってみる

右のプレイグラウンドを開いて、次のコードを**書き写して**、実行してみましょう。コピーせずに、自分の手で書くと、覚えやすくなります。

```kururi
function main = () {
    print("こんにちは、くるりん！")
}
```

実行すると、くるりんが、吹き出しで話します。

<div class="chat" role="img" aria-label="くるりんが「こんにちは、くるりん！」と話している">
<p class="k">こんにちは、くるりん！</p>
</div>

## しくみ

このプログラムは、2つの部分でできています。

<figure class="diagram">
<svg viewBox="0 0 560 190" role="img" aria-label="function main の行が入口、print の行が手順であることを示す図">
<rect x="10" y="20" width="350" height="140" rx="12" style="fill: var(--color-editor); stroke: var(--color-line)" />
<g style="font: 15px var(--font-mono); fill: var(--color-ink)">
<text x="28" y="58"><tspan fill="#D73A49">function</tspan> <tspan fill="#6F42C1">main</tspan> = () {</text>
<text x="28" y="94">&#160;&#160;&#160;&#160;<tspan fill="#005CC5">print</tspan>(<tspan fill="#032F62">"こんにちは、くるりん！"</tspan>)</text>
<text x="28" y="130">}</text>
</g>
<g style="fill: none; stroke: var(--color-accent); stroke-width: 2">
<path d="M368 54 H398" /><path d="M368 94 H398" />
</g>
<g style="font: 700 14px var(--font-sans); fill: var(--color-ink)">
<circle cx="412" cy="54" r="12" style="fill: var(--color-accent)" /><text x="412" y="59" text-anchor="middle" style="fill: var(--color-accent-ink); font-size: 13px">1</text>
<text x="434" y="59">入口</text>
<circle cx="412" cy="94" r="12" style="fill: var(--color-accent)" /><text x="412" y="99" text-anchor="middle" style="fill: var(--color-accent-ink); font-size: 13px">2</text>
<text x="434" y="99">手順</text>
</g>
<g style="font: 12px var(--font-sans); fill: var(--color-muted)">
<text x="434" y="76">ここから始まる</text>
<text x="434" y="116">くるりんに話させる</text>
</g>
</svg>
<figcaption>1行目が「入口」、2行目が「手順」です。</figcaption>
</figure>

- `function main = () { ... }`：プログラムの**入口**です。実行すると、ここから始まります。`{ }`の中に、してほしいことを書きます。
- `print("こんにちは、くるりん！")`：くるりんに、言葉を話させる手順です。

`print`のように、「名前の付いた手順のまとまり」を**関数**と呼びます。`print(...)`と書くと、その手順が実行されます（これを「呼び出す」と言います）。

`"こんにちは、くるりん！"`のように、`"`で囲んだものは**文字列**です。`print`は、渡された文字列を、くるりんに話させます。

## 広げてみる

文字列の中身を変えると、くるりんの言葉が変わります。日本語でも、ほかの文字でも、書けます。

```kururi
function main = () {
    print("きょうは、いい天気だね")
}
```

`"`で囲むのを忘れないでください。囲まないと、ただの名前だと思われて、エラーになります。

## わざと間違える

エラーも、プログラミングの大事な道具です。わざと、かっこの閉じ忘れをしてみましょう。

<div class="say">

エラーは、怒っているんじゃなくて、**直し方を教えてくれている**んだよ。

</div>

```kururi-error K0101
function main = () {
    print("こんにちは"
}
```

エラーのカードには、次のことが書いてあります。

- **何が起きたか**：「ここには「)」が必要ですが、改行がありました」
- **どこで起きたか**：カードの右上と、コードの波線が示す場所
- **どう直すか**：カードの「直し方」

読み方が分かれば、エラーは怖くありません。「)」を足して、直してみてください。

## まとめ

<div class="say">

やったね、最初のプログラムが動いた！　ぼくの声、ちゃんと聞こえたかな？

</div>

- プログラムは、コンピューターへの**手順**です。
- `function main = () { ... }`が入口で、`{ }`の中に手順を書きます。
- `print("...")`は、くるりんに言葉を話させる、**関数**の呼び出しです。

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

3つ目は、名前の大文字・小文字も区別されるため、「`Print`という名前は宣言されていません」というエラーになります。

```kururi-error K0201
function main = () {
    Print("こんにちは")
}
```

</details>

## つぎへ

1つの`print`だけでは、くるりんは1言しか話せません。**何回も話させたい**ときは、どうすればよいでしょう。次は、プログラムの動く順番を見ていきます。
