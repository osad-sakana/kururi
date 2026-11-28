---
title: if
part: 4
partTitle: 条件で決める
chapter: 2
summary: 条件が成り立つときだけ、やることを実行する。
concept: 分岐
goal: if / else if / else で、進む道を分けられる。
needs: 4-1 条件は真か偽
kind: ブロック文
words:
  - "if"
  - "else if"
  - "else"
  - "分岐"
---

<div class="say">

道が分かれたら、<strong>条件</strong>を見て、どっちに進むか決めるよ！

</div>

## なぜ必要か

点数によって、くるりんの言うことを、変えたいとします。90点以上は「すごい！」、60点以上は「よくできました」、それ以外は「もう少し」です。

条件によって、<strong>やることを選ぶ</strong>仕組みが、なければ、どの点数でも、同じことしか言えません。

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

`score`の数を、いろいろ変えて、くるりんの言葉が変わるか、試してみましょう。

## しくみ

`if 条件 { ... }`は、条件が`true`のときだけ、`{ }`の中を実行します。条件を、`( )`で囲む必要は、ありません。

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
<figcaption>score が 75 のとき、1つ目は false、2つ目が true なので、「よくできました」になります。</figcaption>
</figure>

- `if 条件 { ... }`：条件が`true`のとき。
- `else if 条件 { ... }`：前の条件が`false`で、この条件が`true`のとき。
- `else { ... }`：どれも`false`のとき。

上から順に調べて、<strong>最初に成り立った1つだけ</strong>を実行します。`else if`は、何個でも書けます。`else`は、なくてもかまいません。

`if`も、<strong>ブロック文</strong>です。`{ }`の中に、ほかの文や、もう1つの`if`を入れられます。

## 広げてみる

`else`がない`if`は、成り立たなければ、<strong>何もしません</strong>。

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

`and`や`or`で、条件を組み合わせられます。

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

条件に、`boolean`ではなく、数を書いてみましょう。

```kururi-error K0306
function main = () {
    var score: int = 75
    if score {
        print("合格")
    }
}
```

<div class="say">

`if`の後ろは、<strong>`true`か`false`</strong>になる式じゃないとだめなんだ。`score >= 60`のように、<strong>比べる式</strong>にしてね。

</div>

`if x = 1 {`と書いてしまうのも、よくある間違いです。「条件の中に`=`は書けません」と、教えてくれます。

```kururi-error K0111
function main = () {
    var x: int = 1
    if x = 1 {
        print("1です")
    }
}
```

## まとめ

- `if`は、条件が`true`のときだけ、`{ }`の中を実行する、<strong>ブロック文</strong>です。
- `else if`と`else`で、道を増やせます。<strong>最初に成り立った1つだけ</strong>を実行します。
- 条件は、`true`か`false`になる式です。数や文字は、そのまま書けません。

## 練習

1. 年齢が`20`以上なら「大人」、そうでなければ「子ども」と、話させてください。
2. 数が、偶数か奇数かを、判定してください（ヒント：`%`で、2で割った余りを使います）。
3. 点数が`0`未満か`100`より大きいときは、「おかしな点数」と話すようにしてください。

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

`if`は、<strong>1回だけ</strong>調べます。「回数が決まっていないけれど、条件が成り立つあいだ、<strong>ずっと</strong>繰り返したい」ときは、どうすればよいでしょう。
