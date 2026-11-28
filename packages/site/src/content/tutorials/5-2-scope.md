---
title: 変数の有効範囲
part: 5
partTitle: 手順に名前を付ける
chapter: 2
summary: 変数は、作った場所の中だけで使える。名前がぶつからないための決まり。
concept: スコープ
goal: 変数が、どこまで使えるかを、説明できる。
needs: 5-1 自作の関数
kind: 宣言代入文
words:
  - "有効範囲（スコープ）"
  - "ブロック"
  - "トップレベルの変数"
---

<div class="say">

名前には、**届く範囲**があるんだ。範囲の外からは、見えないよ。かくれんぼみたいだね！

</div>

## なぜ必要か

100個の関数がある、大きなプログラムを、想像してみましょう。どの関数でも、`count`や`total`のような、よくある名前を、使いたくなります。

もし、**すべての名前が、プログラム全体から見える**としたら、名前が、すぐにぶつかってしまいます。そこで、変数には、**使える範囲**が、決められています。

## やってみる

```kururi
function main = () {
    var message: string = "外の変数"
    if message == "外の変数" {
        var inner: string = "中の変数"
        print(inner)
    }
    print(message)
}
```

<div class="chat" role="img" aria-label="くるりんが、中の変数、外の変数、と話している">
<p class="k">中の変数</p>
<p class="k">外の変数</p>
</div>

## しくみ

変数は、作った**`{ }`の中**で、使えます。この`{ }`が、変数の**有効範囲**（スコープ）です。外側の変数は、内側から見えますが、内側の変数は、**外側から見えません**。

<figure class="diagram">
<svg viewBox="0 0 560 230" role="img" aria-label="main の外側のブロックでは message が見え、if の内側のブロックでは message と inner の両方が見える図">
<rect x="10" y="10" width="400" height="210" rx="14" style="fill: color-mix(in srgb, var(--color-accent) 8%, var(--color-panel)); stroke: var(--color-accent); stroke-width: 1.6" />
<text x="26" y="34" style="font: 700 13px var(--font-mono); fill: var(--color-accent)">main の { }</text>
<rect x="30" y="50" width="200" height="34" rx="8" style="fill: var(--color-editor); stroke: var(--color-line)" />
<text x="44" y="72" style="font: 14px var(--font-mono); fill: var(--color-code)">var message ...</text>
<rect x="30" y="100" width="360" height="104" rx="12" style="fill: color-mix(in srgb, var(--color-spark) 12%, var(--color-panel)); stroke: var(--color-spark); stroke-width: 1.6" />
<text x="46" y="124" style="font: 700 13px var(--font-mono); fill: var(--color-spark)">if の { }</text>
<rect x="50" y="138" width="200" height="34" rx="8" style="fill: var(--color-editor); stroke: var(--color-line)" />
<text x="64" y="160" style="font: 14px var(--font-mono); fill: var(--color-code)">var inner ...</text>
<g style="font: 13px var(--font-sans); fill: var(--color-ink)">
<text x="430" y="66">message は</text><text x="430" y="84" style="font-weight: 700; fill: var(--color-accent)">どこからでも使える</text>
<text x="430" y="150">inner は</text><text x="430" y="168" style="font-weight: 700; fill: var(--color-spark)">オレンジの枠の中だけ</text>
</g>
</svg>
<figcaption>内側の枠からは、外側の変数が見えます。外側の枠からは、内側の変数は見えません。</figcaption>
</figure>

引数も、その関数の中だけで、使えます。関数の中で作った変数は、**ほかの関数からは、見えません**。

## 広げてみる

関数の**外**（プログラムの、いちばん外側）に書いた変数は、**どの関数からでも**、使えます。

```kururi
var counter: int = 0

function bump = () {
    counter += 1
}

function main = () {
    bump()
    bump()
    print(counter)
}
```

<div class="chat" role="img" aria-label="くるりんが、2、と話している">
<p class="k">2</p>
</div>

ただし、どの関数からでも書き換えられる変数は、**どこで変わったか**が、分かりにくくなります。なるべく、**引数と戻り値**で、値を受け渡す書き方を、選びましょう。

同じ名前を、**外側と内側**で、重ねて作ることは、できません。どちらの変数か、分からなくなるからです。

## わざと間違える

`{ }`の中で作った変数を、**外側**から使ってみましょう。

```kururi-error K0201
function main = () {
    if 1 < 2 {
        var inner: int = 1
    }
    print(inner)
}
```

<div class="say">

`inner`は、`if`の`{ }`の中の**ひみつの名前**。外に出ると、ぼくも、「そんな名前は、知らないよ」って、なっちゃうんだ。

</div>

外側と同じ名前を、内側で作ると、こうなります。

```kururi-error K0202
function main = () {
    var a: int = 1
    if a == 1 {
        var a: int = 2
    }
}
```

## まとめ

- 変数は、作った`{ }`の中で、使えます。これが、**有効範囲**です。
- 内側から外側の変数は見えますが、外側から内側の変数は見えません。
- 外側と内側で、同じ名前の変数は、作れません。

## 練習

1. `for`の中で作った変数を、`for`の外で使うと、どうなるでしょう。実際に、試してください。
2. 関数の引数と、同じ名前の変数を、関数の中で作ると、どうなるでしょう。
3. 2つの関数で、同じ名前の変数を、それぞれ作ってください。ぶつかるでしょうか。

<details>
<summary>答えの例</summary>

1つ目は、`for`の`{ }`の中の変数は、外から見えないので、「宣言されていません」というエラーになります。

2つ目は、引数も、関数の中の名前なので、同じ名前の変数は作れず、エラーになります。

```kururi-error K0202
function f = (n: int) {
    var n: int = 1
}

function main = () {
}
```

3つ目は、別々の関数の中の変数は、**ぶつかりません**。

```kururi
function first = () {
    var total: int = 1
    print(total)
}

function second = () {
    var total: int = 2
    print(total)
}

function main = () {
    first()
    second()
}
```

</details>

## つぎへ

これで、第5部は、おしまいです。次の第6部では、**データと手順を、ひとまとめにする**、新しい方法を見ていきます。
