---
title: if
part: 4
partTitle: 条件で決める
chapter: 2
summary: 条件が成り立つときだけ、決めたことを実行する。
concept: 分岐
goal: if / else if / else で進む道を分けられる。
needs: 4-1 条件は真か偽
kind: ブロック文
words:
  - "if"
  - "else if"
  - "else"
  - "分岐"
---

<div class="say">

道が分かれたら、条件を見て、どっちに進むか決めるよ！

</div>

## なぜ必要か

点数に応じて、くるりんの言うことを変えたいとします。90点以上なら「すごい！」、60点以上なら「よくできました」、それ以外は「もう少し」です。

やることを条件で選ぶ仕組みがないと、どの点数にも同じことしか言えません。

## やってみる

```kururi
function main = () {
    var score: int = 75

    if score >= 90 {
        print("すごい！")
    } else if score >= 60 {
        print("よくできました")
    } else {
        print("もう少し")
    }
}
```

<div class="chat" role="img" aria-label="くるりんが、よくできました、と話している">
<p class="k">よくできました</p>
</div>

`score`の数を変えて、くるりんの言葉が変わるか試してみてください。

## しくみ

`if 条件 { ... }`は、条件が`true`のときだけ`{ }`の中を実行します。条件を`( )`で囲む必要はありません。

<figure class="diagram">
<svg viewBox="0 0 560 250" role="img" aria-label="score が 90 以上なら すごい、60 以上なら よくできました、それ以外は もう少し、と、上から順に調べて進む図">
<defs><marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill: var(--color-muted)" /></marker></defs>
<g style="fill: var(--color-panel); stroke: var(--color-accent); stroke-width: 1.6">
<rect x="20" y="20" width="170" height="40" rx="20" /><rect x="20" y="95" width="170" height="40" rx="20" /><rect x="20" y="170" width="170" height="40" rx="20" />
</g>
<g style="font: 700 14px var(--font-mono); fill: var(--color-ink)" text-anchor="middle">
<text x="105" y="45">score >= 90</text><text x="105" y="120">score >= 60</text><text x="105" y="195">どれでもない</text>
</g>
<g style="fill: none; stroke: var(--color-muted); stroke-width: 1.6" >
<path d="M105 62 V92" marker-end="url(#ah2)" /><path d="M105 137 V167" marker-end="url(#ah2)" />
<path d="M192 40 H300" marker-end="url(#ah2)" /><path d="M192 115 H300" marker-end="url(#ah2)" /><path d="M192 190 H300" marker-end="url(#ah2)" />
</g>
<g style="font: 12px var(--font-sans); fill: var(--color-muted)">
<text x="116" y="82">false</text><text x="116" y="157">false</text><text x="226" y="34">true</text><text x="226" y="109">true</text>
</g>
<g style="fill: var(--color-accent)"><rect x="304" y="22" width="150" height="36" rx="10" /></g>
<g style="fill: var(--color-spark)"><rect x="304" y="97" width="150" height="36" rx="10" /></g>
<g style="fill: var(--color-success)"><rect x="304" y="172" width="150" height="36" rx="10" /></g>
<g style="font: 700 14px var(--font-sans); fill: #fff" text-anchor="middle">
<text x="379" y="45">すごい！</text><text x="379" y="120">よくできました</text><text x="379" y="195">もう少し</text>
</g>
<text x="20" y="238" style="font: 12px var(--font-sans); fill: var(--color-muted)">上から順に調べて、最初に成り立った 1 つだけを実行します。</text>
</svg>
<figcaption>score が 75 なら、1つ目は false、2つ目は true なので、よくできました、になります。</figcaption>
</figure>

- `if 条件 { ... }`は、条件が`true`のときに実行されます。
- `else if 条件 { ... }`は、前の条件が`false`で、この条件が`true`のときに実行されます。
- `else { ... }`は、どの条件も`false`のときに実行されます。

上から順に調べて、最初に成り立った1つだけを実行します。`else if`はいくつでも書けて、`else`は省いても構いません。

`if`もブロック文です。`{ }`の中には、ほかの文や、もう1つの`if`を入れられます。

## 広げてみる

`else`のない`if`は、条件が成り立たなければ何もしません。

```kururi
function main = () {
    var temperature: int = 32
    print("今日は、${temperature}度")
    if temperature >= 30 {
        print("暑いね。水をのんでね")
    }
}
```

<div class="chat" role="img" aria-label="くるりんが、今日は、32度、暑いね。水をのんでね、と話している">
<p class="k">今日は、32度</p>
<p class="k">暑いね。水をのんでね</p>
</div>

`and`や`or`で組み合わせた条件も書けます。

```kururi
function main = () {
    var age: int = 15
    var has_ticket: boolean = true
    if age < 18 and has_ticket {
        print("子ども料金だよ")
    } else {
        print("大人料金だよ")
    }
}
```

## わざと間違える

条件に、`boolean`ではなく数を書いてみます。

```kururi-error K0306
function main = () {
    var score: int = 75
    if score {
        print("合格")
    }
}
```

<div class="say">

`if`の後ろには、`true`か`false`になる式しか書けないんだ。`score >= 60`のように、比べる式にしてね。

</div>

`if x = 1 {`と書いてしまう間違いもよくあります。そのときは、条件の中に`=`は書けないと教えてくれます。

```kururi-error K0111
function main = () {
    var x: int = 1
    if x = 1 {
        print("1です")
    }
}
```

## まとめ

- `if`は、条件が`true`のときだけ`{ }`の中を実行するブロック文です。
- `else if`と`else`で、道を増やせます。実行するのは、最初に成り立った1つだけです。
- 条件に書けるのは、`true`か`false`になる式です。数や文字列はそのままでは書けません。

## 練習

1. 年齢が`20`以上なら「大人」、そうでなければ「子ども」と話させてください。
2. 数が偶数か奇数かを判定してください。`%`で2で割った余りを使います。
3. 点数が`0`未満か`100`より大きいときは、「おかしな点数」と話させてください。

<details>
<summary>答えの例</summary>

1つ目です。

```kururi
function main = () {
    var age: int = 25
    if age >= 20 {
        print("大人")
    } else {
        print("子ども")
    }
}
```

2つ目です。

```kururi
function main = () {
    var number: int = 7
    if number % 2 == 0 {
        print("偶数")
    } else {
        print("奇数")
    }
}
```

3つ目です。

```kururi
function main = () {
    var score: int = 120
    if score < 0 or score > 100 {
        print("おかしな点数")
    }
}
```

</details>

## つぎへ

`if`が条件を調べるのは1回だけです。回数は決まっていなくても、条件が成り立つあいだはずっと繰り返したい。そんなときは、どうするのでしょう。
