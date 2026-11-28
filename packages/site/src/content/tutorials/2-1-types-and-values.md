---
title: 値と型
part: 2
partTitle: 値と名前
chapter: 1
summary: 数と文字は、別のしゅるい。値には「型」がある。
concept: 型
goal: int、float、string の違いを、説明できる。
needs: 1-4 関数の呼び出しも式
kind: 式文
words:
  - "型"
  - "int"
  - "float"
  - "string"
  - "文字列補間"
---

<div class="say">

第2部では、値のことを、もっと知っていこう。まずは、値の<strong>しゅるい</strong>の話だよ！

</div>

## なぜ必要か

`1 + 2`と、`"1" + "2"`を、くるりんに計算させてみます。見た目は、よく似ています。

```kururi
function main = () {
    print(1 + 2)
    print("1" + "2")
}
```

<div class="chat" role="img" aria-label="くるりんが、3、12の順に話している">
<p class="k">3</p>
<p class="k">12</p>
</div>

答えが、違いました。`1`は<strong>数</strong>、`"1"`は<strong>文字</strong>だからです。数なら足し算になり、文字ならつなぎ合わせになります。

コンピューターは、値が<strong>何のしゅるいか</strong>を知らないと、どう扱えばよいか分かりません。

## やってみる

```kururi
function main = () {
    print(42)
    print(3.14)
    print("42")
    print("1 + 2 は ${1 + 2} です")
}
```

<div class="chat" role="img" aria-label="くるりんが、42、3.14、42、1 + 2 は 3 です、の順に話している">
<p class="k">42</p>
<p class="k">3.14</p>
<p class="k">42</p>
<p class="k">1 + 2 は 3 です</p>
</div>

## しくみ

値の「しゅるい」を、<strong>型</strong>と呼びます。この教材で、まず使う型は3つです。

<div class="vars">
<div class="var"><b>int</b><span>42</span><i>整数</i></div>
<div class="var"><b>float</b><span>3.14</span><i>小数</i></div>
<div class="var"><b>string</b><span>"こんにちは"</span><i>文字列</i></div>
</div>

- `int`：`42`や`-3`のような、<strong>整数</strong>です。
- `float`：`3.14`のような、<strong>小数</strong>です。
- `string`：`"..."`で囲んだ、<strong>文字列</strong>です。

文字列の中の`${式}`は、式を評価した値に置き換わります。これを<strong>文字列補間</strong>と呼びます。

<div class="eval" aria-label="1 + 2 は ${1 + 2} です が、1 + 2 は 3 です になる">
<span>"1 + 2 は ${1 + 2} です"</span><i>→</i><span>"1 + 2 は 3 です"</span>
<small>${ } の中の式を、先に評価して、文字列に入れます。</small>
</div>

## 広げてみる

`/`は、割り切れなくても、小数で答えます。`int`と`float`を混ぜた計算は、答えが`float`になります。

```kururi
function main = () {
    print(10 / 4)
    print(1 + 2.5)
    print("くる" + "りん")
}
```

<div class="chat" role="img" aria-label="くるりんが、2.5、3.5、くるりん、の順に話している">
<p class="k">2.5</p>
<p class="k">3.5</p>
<p class="k">くるりん</p>
</div>

## わざと間違える

数と文字を、`+`でつなげてみましょう。

```kururi-error K0302
function main = () {
    print("年齢は" + 20)
}
```

<div class="say">

文字と数は、<strong>混ぜられない</strong>んだ。数を文字の中に入れたいときは、`"年齢は${20}"`のように、補間を使うといいよ。

</div>

## まとめ

- 値には<strong>型</strong>があります。`int`（整数）、`float`（小数）、`string`（文字列）です。
- `"1"`と`1`は、別の値です。足し算の動きも、変わります。
- `"... ${式} ..."`で、文字列の中に、式の値を入れられます。

## 練習

1. `"くる" + "くる" + "りん"`を、くるりんに話させてください。
2. 自分の年齢を使って、`"わたしは、○歳です"`と話させてください（補間を使います）。
3. `7 / 2`と`7 / 2.0`は、同じ答えになるでしょうか。

<details>
<summary>答えの例</summary>

1つ目です。

```kururi
function main = () {
    print("くる" + "くる" + "りん")
}
```

2つ目です。

```kururi
function main = () {
    print("わたしは、${10 + 5}歳です")
}
```

3つ目は、どちらも`3.5`になります。`/`は、いつも小数で答えるからです。

</details>

## つぎへ

`"さくら"`のような値を、何度も書くのは、大変です。<strong>値に名前を付けて</strong>、取っておくには、どうすればよいでしょう。
