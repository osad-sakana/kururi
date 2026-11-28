---
title: 関数の呼び出しも式
part: 1
partTitle: 文と式
chapter: 4
summary: 関数を呼び出すと、値が返ってくる。値を返さない関数もある。
concept: 戻り値と null
goal: 関数の呼び出しも式で、評価すると戻り値になることを、説明できる。
needs: 1-3 式と値
kind: 式文
words:
  - "戻り値"
  - "関数の呼び出し"
  - "input"
  - "null"
---

<div class="say">

ここまでは、ぼくが一方的に話していたね。今度は、<strong>あなたの答えを聞かせて</strong>！

</div>

## なぜ必要か

ここまでの`print`は、決まった言葉しか話せませんでした。くるりんと<strong>会話</strong>するには、こちらの答えを、プログラムが受け取る必要があります。

受け取った答えは、プログラムの中で、<strong>値</strong>として使いたいものです。その値は、計算ではなく、<strong>関数の呼び出し</strong>から返ってきます。

## やってみる

くるりんに名前を聞かれて、答えてみましょう。

```kururi
function main = () {
    print("お名前は？")
    print("こんにちは、" + input() + "さん")
}
```

実行すると、くるりんが名前を聞いて、入力する欄が出ます。名前を入れて Enter を押すと、くるりんが、その名前であいさつします。

<div class="chat" role="img" aria-label="くるりんが名前を聞き、さくらと答えると、こんにちは、さくらさん、と返す">
<p class="k">お名前は？</p>
<p class="y">さくら</p>
<p class="k">こんにちは、さくらさん</p>
</div>

## しくみ

`input()`は、キーボードから入力された1行を、文字列として<strong>返す</strong>関数です。呼び出した式は、評価すると、<strong>入力された文字列</strong>になります。

<div class="eval" aria-label="入力が「さくら」のとき、input() が「さくら」になり、文字列がつながる">
<span>"こんにちは、" + input() + "さん"</span><i>→</i><span>"こんにちは、" + "さくら" + "さん"</span><i>→</i><span>"こんにちは、さくらさん"</span>
<small>input() を評価すると、入力した文字列（ここでは「さくら」）になります。</small>
</div>

このように、関数の呼び出し`f(x)`は、<strong>式</strong>です。評価すると、関数が返す値（<strong>戻り値</strong>）になります。

<figure class="diagram">
<svg viewBox="0 0 560 210" role="img" aria-label="関数に値を渡すと戻り値が返る図。to_int は 12 を返し、print は null を返す">
<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill: var(--color-muted)" /></marker></defs>
<g style="font: 14px var(--font-mono); fill: var(--color-ink)">
<text x="20" y="52">"12"</text><text x="20" y="152">"こんにちは"</text>
</g>
<g style="fill: none; stroke: var(--color-muted); stroke-width: 1.6"><path d="M100 46 H168" marker-end="url(#ah)" /><path d="M148 146 H168" marker-end="url(#ah)" /><path d="M320 46 H388" marker-end="url(#ah)" /><path d="M320 146 H388" marker-end="url(#ah)" /></g>
<g style="fill: var(--color-panel); stroke: var(--color-line); stroke-width: 1.4"><rect x="172" y="22" width="148" height="48" rx="12" /><rect x="172" y="122" width="148" height="48" rx="12" /></g>
<g style="font: 700 14px var(--font-mono); fill: var(--color-ink)"><text x="246" y="52" text-anchor="middle">to_int</text><text x="246" y="152" text-anchor="middle">print</text></g>
<g style="fill: var(--color-accent)"><rect x="392" y="28" width="90" height="36" rx="10" /></g>
<g style="fill: var(--color-editor); stroke: var(--color-line)"><rect x="392" y="128" width="90" height="36" rx="10" /></g>
<g style="font: 700 15px var(--font-mono)"><text x="437" y="52" text-anchor="middle" style="fill: var(--color-accent-ink)">12</text><text x="437" y="152" text-anchor="middle" style="fill: var(--color-muted)">null</text></g>
<g style="font: 12px var(--font-sans); fill: var(--color-muted)"><text x="490" y="52">戻り値</text><text x="490" y="152">値は返さない</text><text x="20" y="196">くるりんが「こんにちは」と話すのが、print のしごとです。</text></g>
</svg>
<figcaption>関数に値を渡すと、戻り値が返ってきます。<code>print</code>は、値を返さないので<code>null</code>です。</figcaption>
</figure>

関数には、2種類あります。

| 種類 | 例 | 呼び出しの値 |
|---|---|---|
| 値を返す関数 | `input()`、`to_int("12")`、`div(7, 2)`、`random(1, 6)` | 戻り値 |
| 値を返さない関数 | `print("...")` | `null`（値がないこと） |

`print`は、くるりんに話させるのが仕事で、値は返しません。そのため、呼び出しを評価すると`null`になります。値を使わないので、普通は、1行の式文として書きます。

## 広げてみる

文字列を、数に変える関数が、`to_int`です。`input()`は、いつも文字列を返すので、計算に使いたいときは、`to_int`で数にします。

```kururi
function main = () {
    print("年齢は？")
    print("来年は、" + to_string(to_int(input()) + 1) + "歳ですね")
}
```

`to_string`は、数を文字列に変えます。文字列と数は、`+`では、そのままつなげません。

ほかにも、便利な関数があります。

```kururi
function main = () {
    print(div(7, 2))
    print(random(1, 6))
}
```

`div(7, 2)`は、7を2で割った、整数の答え（`3`）です。`random(1, 6)`は、1から6までの数を、ランダムに返します。

## わざと間違える

`print`の結果を、そのまま`print`に渡してみましょう。

```kururi-warning K0604
function main = () {
    print(print("こんにちは"))
}
```

<div class="say">

あれ？　ぼく、「null」って言っちゃった。`print`は、<strong>値を返さない</strong>から、中身が「ない」んだ。

</div>

くるりんは、「こんにちは」のあとに、「null」と話します。内側の`print`が、値を返さない関数だからです。エラーではありませんが、「値を返しません（nullになります）」という警告が出ます。

## まとめ

<div class="say">

関数を呼び出すのも、<strong>式</strong>。評価すると、<strong>戻り値</strong>になるよ。次は、その値に名前を付けて取っておこう！

</div>

- <strong>関数の呼び出しも、式</strong>です。評価すると、<strong>戻り値</strong>になります。
- `input()`は、入力された文字列を返します。
- `print`のように、値を返さない関数の呼び出しは、`null`になります。

## 練習

1. 好きな食べ物を聞いて、くるりんに、「〇〇、おいしいよね」と返させてください。
2. 年齢を聞いて、10年後の年齢を、くるりんに話させてください。
3. `random(1, 6)`で、サイコロを1回ふって、出た目を話させてください。

<details>
<summary>答えの例</summary>

1つ目です。

```kururi
function main = () {
    print("好きな食べ物は？")
    print(input() + "、おいしいよね")
}
```

2つ目です。

```kururi
function main = () {
    print("年齢は？")
    print(to_int(input()) + 10)
}
```

3つ目です。

```kururi
function main = () {
    print("サイコロをふるよ")
    print(random(1, 6))
}
```

</details>

## つぎへ

`input()`で受け取った答えは、1回使うと、なくなってしまいます。<strong>同じ値を、何度も使いたい</strong>ときは、どうすればよいでしょう。次の第2部で、値に名前を付ける方法を見ていきます。
