---
title: 値がないこと
part: 6
partTitle: 設計と安全
chapter: 4
summary: 「ない」かもしれない値を、型で表して、安全に扱う。
concept: null と T?
goal: 値が、ないかもしれないときの、安全な書き方が分かる。
needs: 6-3 設計図から作る
kind: ブロック文
words:
  - "null"
  - "T?（null になれる型）"
  - "絞り込み"
---

<div class="say">

ここが、最後だよ。探しものが、<strong>見つからなかった</strong>ときは、どうしよう？

</div>

## なぜ必要か

友だちの名前を、番号から、探す関数を作ったとします。番号が、<strong>登録されていない</strong>ときは、何を返せばよいのでしょう。

`""`（空の文字列）を返すと、「名前が、空の人」と、区別がつきません。<strong>「見つからなかった」ことそのもの</strong>を、表す値が、ほしくなります。

## やってみる

```kururi
function find_name = (id: int) -> string? {
    if id == 1 {
        return "さくら"
    }
    return null
}

function main = () {
    var name: string? = find_name(2)
    if name != null {
        print("こんにちは、${name}さん")
    } else {
        print("見つかりません")
    }
}
```

<div class="chat" role="img" aria-label="くるりんが、見つかりません、と話している">
<p class="k">見つかりません</p>
</div>

## しくみ

`null`は、<strong>「値がない」</strong>ことを表す値です。`string?`のように、型の後ろに`?`を付けると、「`string`、<strong>または`null`</strong>」という型になります。

<div class="vars">
<div class="var"><b>name: string</b><span>"さくら"</span><i>null は、入れられない</i></div>
<div class="var"><b>name: string?</b><span>null</span><i>"さくら"でも、null でも、入れられる</i></div>
</div>

`?`を付けていない型には、`null`を、入れられません。「ないかもしれない」ものだけに、`?`を付けるので、<strong>どこで「ない」を気にすればよいか</strong>が、型で分かります。

`T?`の値は、そのままでは、`T`として使えません。使う前に、`null`でないことを、確かめます。`if name != null { ... }`の`{ }`の中では、`name`は、`null`でないと、分かっているので、`string`として使えます。これを、<strong>絞り込み</strong>と呼びます。

<figure class="diagram">
<svg viewBox="0 0 560 170" role="img" aria-label="name が null かもしれないとき、name != null を確かめると、if の中で string として使える図">
<rect x="10" y="40" width="150" height="50" rx="12" style="fill: var(--color-panel); stroke: var(--color-spark); stroke-width: 1.6" />
<text x="85" y="70" text-anchor="middle" style="font: 700 14px var(--font-mono); fill: var(--color-ink)">name: string?</text>
<path d="M162 65 H214" style="fill: none; stroke: var(--color-muted); stroke-width: 1.6" />
<rect x="216" y="40" width="150" height="50" rx="25" style="fill: var(--color-panel); stroke: var(--color-accent); stroke-width: 1.6" />
<text x="291" y="70" text-anchor="middle" style="font: 700 14px var(--font-mono); fill: var(--color-ink)">name != null</text>
<path d="M368 65 H410" style="fill: none; stroke: var(--color-muted); stroke-width: 1.6" />
<rect x="412" y="40" width="138" height="50" rx="12" style="fill: color-mix(in srgb, var(--color-success) 18%, var(--color-panel)); stroke: var(--color-success); stroke-width: 1.6" />
<text x="481" y="70" text-anchor="middle" style="font: 700 14px var(--font-mono); fill: var(--color-ink)">string として使える</text>
<g style="font: 12px var(--font-sans); fill: var(--color-muted)"><text x="10" y="118">null かもしれない</text><text x="216" y="118">確かめる</text><text x="412" y="118">{ } の中だけ</text></g>
</svg>
<figcaption>確かめたあとの<code>{ }</code>の中では、<code>null</code>でないと、分かります。</figcaption>
</figure>

## 広げてみる

クラスの<strong>フィールド</strong>にも、`?`を付けられます。「まだ決まっていない」ものを、表せます。

```kururi
class Person = {
    fields = {
        public name: string = "さくら"
        public nickname: string? = null
    }

    public method show = () {
        print("名前は、${self.name}")
        if self.nickname != null {
            print("あだ名は、${self.nickname}")
        }
    }
}

function main = () {
    var person: Person = new Person()
    person.show()
    person.nickname = "さくちゃん"
    person.show()
}
```

<div class="chat" role="img" aria-label="くるりんが、名前は、さくら、のあと、もう1回、名前は、さくら、あだ名は、さくちゃん、と話している">
<p class="k">名前は、さくら</p>
<p class="k">名前は、さくら</p>
<p class="k">あだ名は、さくちゃん</p>
</div>

フィールドの絞り込みは、メソッドを呼んだり、代入したりすると、外れます。呼んだ先で、値が変わるかもしれないからです。

## わざと間違える

`null`かもしれない値を、確かめずに、使ってみましょう。

```kururi-error K0330
function find_name = (id: int) -> string? {
    if id == 1 {
        return "さくら"
    }
    return null
}

function main = () {
    var name: string? = find_name(2)
    print(name.length)
}
```

<div class="say">

「`string?`の値は、`null`かもしれないので、このまま使えません」。<strong>使う前に、確かめてね</strong>。ぼくが、いつも見張っているよ！

</div>

## まとめ

- `null`は、「値がない」ことを表す値です。`T?`は、「`T`または`null`」という型です。
- `T?`の値は、そのままでは使えません。`if x != null { ... }`で確かめた中では、使えます（<strong>絞り込み</strong>）。
- `?`を付けた所だけ、「ない」を気にすればよいので、安全です。

## 練習

1. 数が`0`のときは`null`、そうでなければ、その数を返す関数を、作ってください（戻り値は`int?`）。
2. その関数の結果を、`if`で確かめてから、くるりんに話させてください。
3. `null`のときは、「ないよ」と話すようにしてください。

<details>
<summary>答えの例</summary>

```kururi
function nonzero = (n: int) -> int? {
    if n == 0 {
        return null
    }
    return n
}

function main = () {
    var value: int? = nonzero(0)
    if value != null {
        print(value)
    } else {
        print("ないよ")
    }
}
```

</details>

## つぎへ

これで、最後まで、たどり着きました。おめでとう！

<div class="say">

ぼくと、ここまで、おつかれさま！　あとは、<strong>プレイグラウンド</strong>で、自由に、書いてみてね。分からなくなったら、言語仕様のページが、助けてくれるよ。

</div>
