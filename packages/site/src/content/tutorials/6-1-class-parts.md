---
title: クラスの 3 つの部分
part: 6
partTitle: 設計と安全
chapter: 1
summary: 関連するデータと手順を、ひとまとめにする。クラスは「設計図」。
concept: クラス
goal: fields、constructor、method を持つ、クラスを作れる。
needs: 5-2 変数の有効範囲
kind: 宣言
words:
  - "クラス"
  - "フィールド"
  - "コンストラクタ（constructor）"
  - "メソッド（method）"
  - "self"
---

<div class="say">

最後の部は、ぼくみたいなものを作る話だよ。名前と、できることを、まとめて持っているんだ！

</div>

## なぜ必要か

数を数える「カウンター」を作りたいとします。数を入れる変数、増やす関数、表示する関数がばらばらにあると、どれがどれの仲間なのか分かりにくくなります。

```kururi
var count: int = 0

function count_up = () {
    count += 1
}

function show_count = () {
    print("いまの数は${count}")
}

function main = () {
    count_up()
    show_count()
}
```

カウンターを2つ使いたくなれば、変数も関数も2組ずつ要ります。関連するものをひとまとめにできたら、ずっと楽になります。

## やってみる

```kururi
class Counter = {
    fields = {
        public count: int = 0
    }

    constructor = (start: int) {
        self.count = start
    }

    public method up = () {
        self.count += 1
    }

    public method show = () {
        print("いまの数は${self.count}")
    }
}

function main = () {
    var counter: Counter = new Counter(10)
    counter.up()
    counter.up()
    counter.show()
}
```

<div class="chat" role="img" aria-label="くるりんが、いまの数は12、と話している">
<p class="k">いまの数は12</p>
</div>

## しくみ

`class Counter = { ... }`と書くと、<strong>クラス</strong>ができます。クラスはモノの設計図です。名前は`UpperCamelCase`で、先頭を大文字にします。

<figure class="diagram">
<svg viewBox="0 0 560 250" role="img" aria-label="Counter クラスの、fields、constructor、method の、3つの部分を示す図">
<rect x="10" y="10" width="360" height="230" rx="14" style="fill: var(--color-editor); stroke: var(--color-line)" />
<text x="28" y="38" style="font: 700 15px var(--font-mono); fill: var(--color-code)"><tspan style="fill: var(--color-code-keyword)">class</tspan> Counter</text>
<rect x="28" y="54" width="324" height="50" rx="8" style="fill: color-mix(in srgb, var(--color-accent) 16%, transparent)" />
<text x="44" y="84" style="font: 14px var(--font-mono); fill: var(--color-code)">fields: count</text>
<rect x="28" y="112" width="324" height="50" rx="8" style="fill: color-mix(in srgb, var(--color-spark) 22%, transparent)" />
<text x="44" y="142" style="font: 14px var(--font-mono); fill: var(--color-code)">constructor: 作るときの手順</text>
<rect x="28" y="170" width="324" height="52" rx="8" style="fill: color-mix(in srgb, var(--color-success) 18%, transparent)" />
<text x="44" y="200" style="font: 14px var(--font-mono); fill: var(--color-code)">method: up、show</text>
<g style="font: 700 14px var(--font-sans)">
<text x="390" y="84" style="fill: var(--color-accent)">フィールド</text><text x="390" y="142" style="fill: var(--color-spark)">コンストラクタ</text><text x="390" y="200" style="fill: var(--color-success)">メソッド</text>
</g>
<g style="font: 12px var(--font-sans); fill: var(--color-muted)">
<text x="390" y="102">持っているデータ</text><text x="390" y="160">new で作るときの手順</text><text x="390" y="218">できること（動き）</text>
</g>
</svg>
<figcaption>クラスは3つの部分でできています。同じ色の部分どうしが対応しています。</figcaption>
</figure>

- `fields`には、クラスが持つデータ、つまりフィールドを書きます。`名前: 型 = 初期値`の形です。
- `constructor`は、`new Counter(10)`のようにモノを作るとき、最初に実行される手順です。
- `method`は、できること、つまり動きです。書き方は関数と同じで、`counter.up()`のように呼び出します。

クラスの中では、`self`がそのモノ自身を指します。フィールドは、`self.count`のように`self.`を付けて読み書きします。

## 広げてみる

`new クラス名(引数)`と書くと、クラスからモノを作れます。`var counter: Counter = new Counter(10)`の`Counter`は、変数の型です。クラスも型になるわけです。

<div class="eval" aria-label="new Counter(10) を評価すると、count が 10 の Counter になる">
<span>new Counter(10)</span><i>→</i><span>count が 10 の Counter</span>
<small>new も式です。評価すると、新しいモノができあがります。</small>
</div>

メソッドも、関数と同じ書き方で値を返せます。

```kururi
class Counter = {
    fields = {
        public count: int = 0
    }

    public method next_value = () -> int {
        self.count += 1
        return self.count
    }
}

function main = () {
    var counter: Counter = new Counter()
    print(counter.next_value())
    print(counter.next_value())
}
```

<div class="chat" role="img" aria-label="くるりんが、1、2、と話している">
<p class="k">1</p>
<p class="k">2</p>
</div>

## わざと間違える

メソッドの中で、`self.`をわざと付け忘れてみます。

```kururi-error K0201
class Counter = {
    fields = {
        public count: int = 0
    }

    public method up = () {
        count += 1
    }
}

function main = () {
}
```

<div class="say">

`count`だけだと、「どこの`count`？」って迷っちゃう。このモノの`count`は、`self.count`って書いてね。

</div>

## まとめ

- クラスは、データ（`fields`）と手順（`method`）をひとまとめにした設計図です。
- `constructor`は、`new`で作るときの手順です。`self`は、そのモノ自身を指します。
- クラスから作ったモノにも、型があります。

## 練習

1. `name`と`say_hello`メソッドを持つ`Robot`クラスを作ってください。
2. 作ったクラスから`new`でモノを作り、`say_hello`を呼んでください。
3. `Counter`に`reset`メソッドを足して、`count`を`0`に戻してください。

<details>
<summary>答えの例</summary>

1つ目と、2つ目です。

```kururi
class Robot = {
    fields = {
        public name: string = "ロボ"
    }

    public method say_hello = () {
        print("ぼくは、${self.name}だよ")
    }
}

function main = () {
    var robot: Robot = new Robot()
    robot.say_hello()
}
```

3つ目です。

```kururi
class Counter = {
    fields = {
        public count: int = 5
    }

    public method reset = () {
        self.count = 0
    }
}

function main = () {
    var counter: Counter = new Counter()
    counter.reset()
    print(counter.count)
}
```

</details>

## つぎへ

`public`を付けると、だれでも`counter.count = 100`のように書き換えられます。勝手に書き換えられては困るとき、どうすればよいのでしょう。
