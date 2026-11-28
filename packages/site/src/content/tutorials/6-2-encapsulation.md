---
title: 外から守る
part: 6
partTitle: 設計と安全
chapter: 2
summary: 大事なデータを、外から勝手に書き換えられないようにする。
concept: カプセル化
goal: public と private を、使い分けられる。
needs: 6-1 クラスの 3 つの部分
kind: 宣言
words:
  - "public"
  - "private"
  - "カプセル化"
---

<div class="say">

ぼくの大事なところは、勝手にさわらないでね。さわっていい所だけ、決めておくよ！

</div>

## なぜ必要か

カウンターの数がマイナスになったら、おかしいですね。ところが`count`が`public`だと、外からこんなことができてしまいます。

```kururi
class Counter = {
    fields = {
        public count: int = 0
    }
}

function main = () {
    var counter: Counter = new Counter()
    counter.count = -999
    print(counter.count)
}
```

作った人は`count`を増やすだけのつもりでも、使う人は好きに書き換えられます。大きなプログラムになると、だれがいつ書き換えたのか、追えなくなります。

## やってみる

```kururi
class Counter = {
    fields = {
        private count: int = 0
    }

    public method up = () {
        self.count += 1
    }

    public method show = () {
        print("いまの数は${self.count}")
    }
}

function main = () {
    var counter: Counter = new Counter()
    counter.up()
    counter.up()
    counter.show()
}
```

<div class="chat" role="img" aria-label="くるりんが、いまの数は2、と話している">
<p class="k">いまの数は2</p>
</div>

## しくみ

クラスの中のフィールドとメソッドには、だれが使えるかを決める印を付けられます。

| 印 | 意味 |
|---|---|
| `public` | クラスの外からも使える |
| `private` | クラスの中だけで使える |

印を省くと、`private`になります。

<figure class="diagram">
<svg viewBox="0 0 560 200" role="img" aria-label="private のフィールドは、外から直接さわれず、public のメソッドを通して、読み書きする図">
<rect x="150" y="14" width="250" height="172" rx="14" style="fill: var(--color-editor); stroke: var(--color-line)" />
<text x="170" y="40" style="font: 700 14px var(--font-mono); fill: var(--color-code)">Counter</text>
<rect x="170" y="108" width="210" height="60" rx="10" style="fill: color-mix(in srgb, var(--color-danger) 12%, var(--color-panel)); stroke: var(--color-danger); stroke-width: 1.6" />
<text x="186" y="134" style="font: 700 13px var(--font-mono); fill: var(--color-danger)">private count</text>
<text x="186" y="154" style="font: 12px var(--font-sans); fill: var(--color-muted)">中だけで使える</text>
<rect x="170" y="52" width="210" height="40" rx="10" style="fill: color-mix(in srgb, var(--color-success) 16%, var(--color-panel)); stroke: var(--color-success); stroke-width: 1.6" />
<text x="186" y="77" style="font: 700 13px var(--font-mono); fill: var(--color-success)">public up()</text>
<g style="fill: none; stroke-width: 2"><path d="M20 72 H166" style="stroke: var(--color-success)" /><path d="M20 138 H100" style="stroke: var(--color-danger)" /></g>
<g style="stroke: var(--color-danger); stroke-width: 3; stroke-linecap: round"><path d="M104 130 L120 146 M120 130 L104 146" /></g>
<g style="font: 12px var(--font-sans); fill: var(--color-muted)"><text x="20" y="64">外から、OK</text><text x="20" y="168">外から、直接は、さわれない</text></g>
</svg>
<figcaption>外からは、<code>public</code>のメソッドを通してだけ、大事なデータを動かせます。</figcaption>
</figure>

`count`を`private`にして、`up`のような入口だけを`public`で用意すれば、「数を増やす」以外の変え方は禁止できます。大事なデータをこうしてメソッドで守ることを、<strong>カプセル化</strong>と呼びます。

## 広げてみる

入口になるメソッドの中で、おかしな値をはじくこともできます。

```kururi
class Counter = {
    fields = {
        private count: int = 0
    }

    public method add = (amount: int) {
        if amount > 0 {
            self.count += amount
        }
    }

    public method show = () {
        print("いまの数は${self.count}")
    }
}

function main = () {
    var counter: Counter = new Counter()
    counter.add(5)
    counter.add(-3)
    counter.show()
}
```

<div class="chat" role="img" aria-label="くるりんが、いまの数は5、と話している">
<p class="k">いまの数は5</p>
</div>

`add(-3)`はマイナスなので、無視されました。`count`がおかしな値にならないよう、クラス自身が守っています。

## わざと間違える

`private`のフィールドを、外から書き換えてみます。

```kururi-error K0401
class Counter = {
    fields = {
        private count: int = 0
    }
}

function main = () {
    var counter: Counter = new Counter()
    counter.count = 100
}
```

<div class="say">

「`count`は`private`なので、クラスの外からは使えません」って、ぼくが止めるよ。数を変えたいときは、`up`のような`public`のメソッドを使ってね。

</div>

## まとめ

- `public`は外からも使え、`private`はクラスの中だけで使えます。印を省くと`private`です。
- 大事なデータは`private`にして、入口を`public`のメソッドで用意します。
- この守り方がカプセル化です。

## 練習

1. `count`を`private`にした`Counter`に、現在の数を返す`get_count`メソッドを足してください。
2. `get_count`を使って、外から数を話させてください。
3. `private`のメソッドを作ると、外から呼べるでしょうか。考えてから試してください。

<details>
<summary>答えの例</summary>

1つ目と、2つ目です。

```kururi
class Counter = {
    fields = {
        private count: int = 3
    }

    public method get_count = () -> int {
        return self.count
    }
}

function main = () {
    var counter: Counter = new Counter()
    print(counter.get_count())
}
```

3つ目は、`private`のメソッドを外から呼ぶとエラーになります。クラスの中のほかのメソッドからなら、呼べます。

</details>

## つぎへ

クラスは設計図でした。1つの設計図からたくさんのモノを作るには、どうすればよいのか。次は、そこを見ていきます。
