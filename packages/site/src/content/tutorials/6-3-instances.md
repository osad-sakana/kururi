---
title: 設計図から作る
part: 6
partTitle: 設計と安全
chapter: 3
summary: 1つのクラスから、同じ形のモノを、いくつでも作る。
concept: インスタンス
goal: 1つのクラスから、独立した複数のモノを作れる。
needs: 6-2 外から守る
kind: 宣言
words:
  - "インスタンス"
  - "new"
  - "オブジェクト"
---

<div class="say">

ぼくと**そっくりの友だち**を、何人でも作れるよ。でも、みんな、別々の「ぼく」なんだ！

</div>

## なぜ必要か

ゲームで、プレイヤーを、3人出したいとします。それぞれ、**自分の点数**を、持っていなければなりません。

3人ぶんの、変数と関数を、手で書くのは、大変です。クラスが、**設計図**なら、そこから、何人でも、作れるはずです。

## やってみる

```kururi
class Player = {
    fields = {
        private name: string = ""
        private score: int = 0
    }

    constructor = (name: string) {
        self.name = name
    }

    public method add_score = (points: int) {
        self.score += points
    }

    public method show = () {
        print("${self.name}の点数は、${self.score}点")
    }
}

function main = () {
    var sakura: Player = new Player("さくら")
    var taro: Player = new Player("たろう")
    sakura.add_score(10)
    sakura.add_score(5)
    taro.add_score(20)
    sakura.show()
    taro.show()
}
```

<div class="chat" role="img" aria-label="くるりんが、さくらの点数は、15点、たろうの点数は、20点、と話している">
<p class="k">さくらの点数は、15点</p>
<p class="k">たろうの点数は、20点</p>
</div>

## しくみ

`new Player("さくら")`と、`new Player("たろう")`は、**別々のモノ**を作ります。クラスから作ったモノを、**インスタンス**と呼びます。それぞれが、**自分の**`name`と`score`を、持っています。

<figure class="diagram">
<svg viewBox="0 0 560 210" role="img" aria-label="Player という設計図から、さくらとたろうの、2つのインスタンスが作られ、それぞれが、自分の score を持っている図">
<rect x="10" y="76" width="140" height="62" rx="12" style="fill: var(--color-editor); stroke: var(--color-line)" />
<text x="80" y="112" text-anchor="middle" style="font: 700 14px var(--font-mono); fill: var(--color-code)">class Player</text>
<g style="fill: none; stroke: var(--color-muted); stroke-width: 1.6"><path d="M152 96 C200 96 200 50 246 50" /><path d="M152 118 C200 118 200 160 246 160" /></g>
<text x="190" y="30" style="font: 12px var(--font-sans); fill: var(--color-muted)">new</text>
<rect x="250" y="14" width="290" height="76" rx="12" style="fill: color-mix(in srgb, var(--color-accent) 12%, var(--color-panel)); stroke: var(--color-accent); stroke-width: 1.6" />
<text x="270" y="42" style="font: 700 13px var(--font-mono); fill: var(--color-accent)">sakura</text>
<text x="270" y="68" style="font: 14px var(--font-mono); fill: var(--color-code)">name: "さくら"　score: 15</text>
<rect x="250" y="122" width="290" height="76" rx="12" style="fill: color-mix(in srgb, var(--color-spark) 14%, var(--color-panel)); stroke: var(--color-spark); stroke-width: 1.6" />
<text x="270" y="150" style="font: 700 13px var(--font-mono); fill: var(--color-spark)">taro</text>
<text x="270" y="176" style="font: 14px var(--font-mono); fill: var(--color-code)">name: "たろう"　score: 20</text>
</svg>
<figcaption>1つの設計図から、独立した2つのモノが、作られます。<code>sakura</code>の点数を変えても、<code>taro</code>は、変わりません。</figcaption>
</figure>

## 広げてみる

インスタンスは、**配列に入れて**、まとめて扱えます。`for`と組み合わせると、何人いても、同じ書き方で済みます。

```kururi
class Player = {
    fields = {
        private name: string = ""
    }

    constructor = (name: string) {
        self.name = name
    }

    public method say_hello = () {
        print("ぼくは、${self.name}です")
    }
}

function main = () {
    var players: Player[] = [new Player("さくら"), new Player("たろう"), new Player("はなこ")]
    for player in players {
        player.say_hello()
    }
}
```

<div class="chat" role="img" aria-label="くるりんが、ぼくは、さくらです、ぼくは、たろうです、ぼくは、はなこです、と話している">
<p class="k">ぼくは、さくらです</p>
<p class="k">ぼくは、たろうです</p>
<p class="k">ぼくは、はなこです</p>
</div>

インスタンスを、関数に渡したり、別の変数に入れたりしたときは、**同じモノ**を指します。コピーされるわけではありません。

## わざと間違える

`new`を付けずに、クラスを呼んでみましょう。

```kururi-error K0309
class Player = {
    fields = {
        private score: int = 0
    }
}

function main = () {
    var player: Player = Player()
}
```

<div class="say">

「`Player`はクラスです。値としては使えません」って、言われるよ。クラスは**設計図**だから、`new`を付けて、**モノを作る**んだ。

</div>

## まとめ

- クラスから、`new`で作ったモノを、**インスタンス**と呼びます。
- インスタンスは、それぞれ**自分の**フィールドを持ちます。別のインスタンスには、影響しません。
- インスタンスは、配列に入れて、`for`で、まとめて扱えます。

## 練習

1. `Counter`クラスから、2つの`Counter`を作って、別々に`up`してください。
2. 2つの結果が、**ぶつからない**ことを、確かめてください。
3. `Robot`クラスを、3体、配列に入れて、全員に、あいさつをさせてください。

<details>
<summary>答えの例</summary>

1つ目と、2つ目です。

```kururi
class Counter = {
    fields = {
        private count: int = 0
    }

    public method up = () {
        self.count += 1
    }

    public method show = () {
        print(self.count)
    }
}

function main = () {
    var first: Counter = new Counter()
    var second: Counter = new Counter()
    first.up()
    first.up()
    second.up()
    first.show()
    second.show()
}
```

くるりんは、「2」「1」と話します。それぞれの`count`が、別々だからです。

3つ目は、このページの、`Player`の例を、参考にしてください。

</details>

## つぎへ

最後に、もう1つだけ、大事なことを見ていきます。**「ない」**かもしれない値を、安全に扱うには、どうすればよいでしょう。
