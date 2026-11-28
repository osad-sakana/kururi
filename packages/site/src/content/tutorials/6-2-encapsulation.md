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

ぼくの**大事なところ**は、勝手にさわらないでね！　さわっていい所だけ、決めておくよ。

</div>

## なぜ必要か

カウンターの数が、**マイナス**になったら、おかしいですね。ところが、`count`が`public`だと、外から、こんなことができてしまいます。

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

クラスを作った人は、`count`を、**増やすだけ**のつもりでも、使う人が、勝手に書き換えられます。大きなプログラムでは、**だれが、いつ書き換えたか**が、分からなくなります。

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

クラスの中の、フィールドとメソッドには、**だれが使えるか**を決める、印を付けられます。

| 印 | 意味 |
|---|---|
| `public` | クラスの**外からも**、使える |
| `private` | クラスの**中だけ**で、使える |

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
<figcaption>外からは、<code>public</code>のメソッドだけを通して、大事なデータを動かします。</figcaption>
</figure>

`count`を`private`にして、`up`のような**入口**を、`public`で用意すると、「数を増やす」以外の、変え方を、**禁止**できます。このように、大事なデータを、メソッドで守ることを、**カプセル化**と呼びます。

## 広げてみる

入口になるメソッドの中で、**おかしな値を、はじく**こともできます。

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

`add(-3)`は、マイナスなので、無視されました。`count`が、おかしな値にならないことを、**クラスが、自分で守っています**。

## わざと間違える

`private`のフィールドを、外から書き換えてみましょう。

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

「`count`は`private`なので、クラスの外からは使えません」って、**ぼくが、止める**よ。数を変えたいときは、`up`のような、`public`のメソッドを使ってね。

</div>

## まとめ

- `public`は外からも使える、`private`はクラスの中だけです。印を省くと、`private`です。
- 大事なデータは`private`にして、入口を`public`のメソッドで用意します。
- 大事なデータを守る、この考え方を、**カプセル化**と呼びます。

## 練習

1. `count`を、`private`にした`Counter`に、現在の数を返す`get_count`メソッドを、足してください。
2. `get_count`を使って、外から、数を話させてください。
3. `private`のメソッドを作ると、外から呼べるでしょうか。考えてから、試してください。

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

3つ目は、`private`のメソッドは、クラスの外からは呼べず、エラーになります。クラスの中の、ほかのメソッドからは、呼べます。

</details>

## つぎへ

クラスは、**設計図**でした。1つの設計図から、**たくさんのモノ**を作るには、どうすればよいでしょう。次は、それを見ていきます。
