---
title: while
part: 4
partTitle: 条件で決める
chapter: 3
summary: 条件が成り立つあいだ、繰り返す。終わらせ方も、考える。
concept: 条件の繰り返しと break
goal: while で、回数が決まっていない繰り返しを、書ける。
needs: 4-2 if
kind: ブロック文、ジャンプ文
words:
  - "while"
  - "break"
  - "continue"
  - "ジャンプ文"
  - "終わらない繰り返し"
---

<div class="say">

「条件が成り立つあいだ、ずっと」。これは、ぼくが、いちばん得意な繰り返しだよ。<strong>終わらせ方</strong>も、いっしょに考えようね！

</div>

## なぜ必要か

「3、2、1、発射！」と、カウントダウンをしたいとします。`for i 3 times`でも、できそうです。では、<strong>カウントの数が、前もって分からない</strong>ときは、どうでしょう。

たとえば、「正しい合言葉が入力されるまで、聞き続ける」。何回で終わるかは、あなたが答えるまで、分かりません。

<strong>条件が成り立つあいだ</strong>、繰り返す仕組みが必要です。

## やってみる

```kururi
function main = () {
    var count: int = 3
    while count > 0 {
        print(count)
        count -= 1
    }
    print("発射！")
}
```

<div class="chat" role="img" aria-label="くるりんが、3、2、1、発射！、と話している">
<p class="k">3</p>
<p class="k">2</p>
<p class="k">1</p>
<p class="k">発射！</p>
</div>

## しくみ

`while 条件 { ... }`は、条件が`true`の<strong>あいだ</strong>、`{ }`の中を、繰り返します。条件は、<strong>1周ごとに</strong>、調べ直します。

<figure class="diagram">
<svg viewBox="0 0 560 210" role="img" aria-label="条件を調べて、true なら本体を実行して、また条件に戻る。false になったら、ループを出る図">
<defs><marker id="ah3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" style="fill: var(--color-muted)" /></marker></defs>
<g style="fill: var(--color-panel); stroke: var(--color-accent); stroke-width: 1.6"><rect x="30" y="76" width="150" height="48" rx="24" /></g>
<g style="fill: color-mix(in srgb, var(--color-spark) 22%, var(--color-panel)); stroke: var(--color-spark); stroke-width: 1.6"><rect x="260" y="76" width="170" height="48" rx="12" /></g>
<g style="fill: var(--color-panel); stroke: var(--color-success); stroke-width: 1.6"><rect x="30" y="156" width="150" height="40" rx="20" /></g>
<g style="font: 700 14px var(--font-mono); fill: var(--color-ink)" text-anchor="middle"><text x="105" y="105">count > 0</text><text x="345" y="105">{ ... を実行 }</text></g>
<g style="font: 700 14px var(--font-sans); fill: var(--color-ink)" text-anchor="middle"><text x="105" y="181">ループを出る</text></g>
<g style="fill: none; stroke: var(--color-muted); stroke-width: 1.6"><path d="M182 100 H256" marker-end="url(#ah3)" /><path d="M345 74 C345 30 105 30 105 72" marker-end="url(#ah3)" /><path d="M105 126 V152" marker-end="url(#ah3)" /></g>
<g style="font: 12px var(--font-sans); fill: var(--color-muted)"><text x="204" y="94">true</text><text x="114" y="144">false</text><text x="190" y="30">また、条件を調べる</text></g>
</svg>
<figcaption>条件が<code>false</code>になるまで、「調べる → 実行する」を繰り返します。</figcaption>
</figure>

<strong>条件を、いつか`false`にする</strong>ことが、大事です。この例では、`count -= 1`で、`count`が、少しずつ減って、いつか`0`になります。

## 広げてみる

繰り返しの途中で、<strong>抜けたい</strong>ときは、`break`を使います。`break`は、繰り返し全体を、そこで終えます。

```kururi
function main = () {
    while true {
        print("合言葉は？")
        var word: string = input()
        if word == "くるくる" {
            break
        }
        print("ちがうよ")
    }
    print("あたり！")
}
```

<div class="chat" role="img" aria-label="くるりんが合言葉を聞き、ちがうと答えると、ちがうよ、と返し、くるくると答えると、あたり、と返す">
<p class="k">合言葉は？</p>
<p class="y">わからない</p>
<p class="k">ちがうよ</p>
<p class="k">合言葉は？</p>
<p class="y">くるくる</p>
<p class="k">あたり！</p>
</div>

`while true`は、条件が、いつも`true`なので、<strong>自分では終わりません</strong>。`break`で、抜け道を作ります。

`continue`は、<strong>今回の1周だけ</strong>を終えて、次の周に進みます。`break`と`continue`は、ジャンプ文です。

```kururi
function main = () {
    var n: int = 0
    while n < 5 {
        n += 1
        if n == 3 {
            continue
        }
        print(n)
    }
}
```

くるりんは、「1」「2」「4」「5」と話します（3は、飛ばします）。

## わざと間違える

`count`を減らすのを、書き忘れてみましょう。

```kururi-warning K0606
function main = () {
    var count: int = 3
    while count > 0 {
        print(count)
    }
}
```

これは、<strong>エラーではなく警告</strong>です。動かすと、`3`を話し続けて、終わりません（プレイグラウンドでは、10秒たつと、止めます）。

<div class="say">

「条件に使っている`count`が、繰り返しの中で、<strong>変わってない</strong>よ」って、先に教えてあげるね。`while true`なのに、`break`も`return`もないときも、警告するよ。

</div>

## まとめ

- `while 条件 { ... }`は、条件が`true`のあいだ、繰り返します。
- 繰り返しの中で、条件を、いつか`false`にします。忘れると、<strong>終わらない繰り返し</strong>になります。
- `break`は、繰り返しを抜ける、`continue`は、今回の周だけを終える、<strong>ジャンプ文</strong>です。

## 練習

1. `count`を、`5`から`1`まで、数えて、「おしまい！」と話させてください。
2. `n`を、`1`から始めて、2倍にしていき、`100`を超えたら、止まるようにしてください。
3. 合言葉のプログラムを、自分の合言葉に、変えてください。

<details>
<summary>答えの例</summary>

1つ目です。

```kururi
function main = () {
    var count: int = 5
    while count > 0 {
        print(count)
        count -= 1
    }
    print("おしまい！")
}
```

2つ目です。

```kururi
function main = () {
    var n: int = 1
    while n <= 100 {
        n *= 2
    }
    print(n)
}
```

くるりんは、「128」と話します。

</details>

## つぎへ

これで、第4部は、おしまいです。ここまで、`print`のような、<strong>用意されている</strong>関数を、使ってきました。自分で、<strong>関数を作る</strong>には、どうすればよいでしょう。第5部で、見ていきます。
