---
title: 自作の関数
part: 5
partTitle: 手順に名前を付ける
chapter: 1
summary: 同じ手順に名前を付けて、何度でも使えるようにする。
concept: 関数と戻り値
goal: 引数と戻り値のある関数を、作って、呼び出せる。
needs: 4-3 while
kind: ジャンプ文
words:
  - "関数"
  - "引数"
  - "戻り値"
  - "return"
  - "ジャンプ文"
---

<div class="say">

ぼくに新しい技を教えてくれないかな。名前を付けて教えてくれたら、何度でも使えるよ！

</div>

## なぜ必要か

何人かに、同じ形であいさつしたいとします。

```kururi
function main = () {
    print("こんにちは、さくらさん！ 今日もよろしくね")
    print("こんにちは、たろうさん！ 今日もよろしくね")
    print("こんにちは、はなこさん！ 今日もよろしくね")
}
```

あいさつの文を変えたくなったら、3か所を直すことになります。同じ手順に名前を付けてまとめられたら、楽そうです。

## やってみる

```kururi
function greet = (name: string) {
    print("こんにちは、${name}さん！ 今日もよろしくね")
}

function main = () {
    greet("さくら")
    greet("たろう")
    greet("はなこ")
}
```

あいさつの文を変えたいなら、`greet`の中を1か所直せば済みます。

<div class="chat" role="img" aria-label="くるりんが、さくらさん、たろうさん、はなこさんに、順番にあいさつをしている">
<p class="k">こんにちは、さくらさん！ 今日もよろしくね</p>
<p class="k">こんにちは、たろうさん！ 今日もよろしくね</p>
<p class="k">こんにちは、はなこさん！ 今日もよろしくね</p>
</div>

## しくみ

`function greet = (name: string) { ... }`と書くと、<strong>関数</strong>ができます。

<figure class="diagram">
<svg viewBox="0 0 560 150" role="img" aria-label="function 名前 = (引数) -> 戻り値の型 の、それぞれの部分を示す図">
<rect x="10" y="30" width="540" height="60" rx="12" style="fill: var(--color-editor); stroke: var(--color-line)" />
<g style="font: 15px var(--font-mono); fill: var(--color-code)"><text x="28" y="67"><tspan style="fill: var(--color-code-keyword)">function</tspan> double = (n: int) -&gt; int { ... }</text></g>
<g style="stroke: none">
<rect x="143" y="40" width="68" height="3" style="fill: var(--color-accent)" />
<rect x="236" y="40" width="80" height="3" style="fill: var(--color-spark)" />
<rect x="345" y="40" width="54" height="3" style="fill: var(--color-success)" />
</g>
<g style="font: 700 13px var(--font-sans)" text-anchor="middle">
<text x="177" y="115" style="fill: var(--color-accent)">名前</text>
<text x="276" y="115" style="fill: var(--color-spark)">引数</text>
<text x="372" y="115" style="fill: var(--color-success)">戻り値の型</text>
</g>
<g style="font: 12px var(--font-sans); fill: var(--color-muted)" text-anchor="middle">
<text x="177" y="133">呼ぶときの名前</text><text x="276" y="133">受け取る値と型</text><text x="372" y="133">返す値の型</text>
</g>
</svg>
<figcaption>名前、引数、戻り値の型の3つで、関数の形が決まります。</figcaption>
</figure>

- 名前は、呼ぶときに使う名前です。`snake_case`で付けます。
- 引数は、関数が受け取る値です。`名前: 型`の形で書き、複数あるときは`,`で区切ります。
- 戻り値の型は、関数が返す値の型です。`->`のあとに書きます。

関数に値を返させるには、`return`を使います。`return 式`と書くと、関数はそこで終わり、式の値が呼び出し元に返ります。`return`はジャンプ文です。

```kururi
function double = (n: int) -> int {
    return n * 2
}

function main = () {
    print(double(21))
}
```

関数の呼び出しは式でした。評価すると、戻り値になります。

<div class="eval" aria-label="double(21) が、21 * 2 を経て、42 になる">
<span>double(21)</span><i>→</i><span>21 * 2</span><i>→</i><span>42</span>
<small>n に 21 が入り、return の式が評価されます。</small>
</div>

`->`を書かない関数は、値を返しません。呼び出しを評価すると`null`になります。`greet`がこちらです。

## 広げてみる

`boolean`を返す関数には、`is_`か`has_`で始まる名前を付けます。

```kururi
function is_even = (n: int) -> boolean {
    return n % 2 == 0
}

function main = () {
    print(is_even(4))
    print(is_even(7))
}
```

関数の中から別の関数を呼ぶこともできます。呼び出しは、定義より前に書いてもかまいません。

<div class="chat" role="img" aria-label="くるりんが、true、false、と話している">
<p class="k">true</p>
<p class="k">false</p>
</div>

## わざと間違える

引数の数をわざと間違えて、呼んでみます。

```kururi-error K0305
function add = (a: int, b: int) -> int {
    return a + b
}

function main = () {
    print(add(1))
}
```

<div class="say">

`add`は2つの値を受け取る関数だよ。1つしかないと足し算ができないから、ぼくが教えるんだ。

</div>

## まとめ

- `function 名前 = (引数) -> 戻り値の型 { ... }`で、関数を作ります。
- `return 式`で値を返します。`->`を書かない関数は、値を返しません。
- 関数の呼び出しは式で、評価すると戻り値になります。

## 練習

1. 名前を受け取って、「おはよう、〇〇さん」と話す関数を作ってください。
2. 2つの数を受け取って、大きいほうを返す関数を作ってください。
3. 数を受け取って、その3倍を返す関数を作ってください。

<details>
<summary>答えの例</summary>

1つ目です。

```kururi
function say_morning = (name: string) {
    print("おはよう、${name}さん")
}

function main = () {
    say_morning("さくら")
}
```

2つ目です。

```kururi
function bigger = (a: int, b: int) -> int {
    if a > b {
        return a
    }
    return b
}

function main = () {
    print(bigger(3, 8))
}
```

3つ目です。

```kururi
function triple = (n: int) -> int {
    return n * 3
}

function main = () {
    print(triple(5))
}
```

</details>

## つぎへ

関数の中で作った変数は、関数の外でも使えるのでしょうか。名前はどこまで届くのか、次は変数の有効範囲を見ていきます。
