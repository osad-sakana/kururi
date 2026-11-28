---
title: 値と型
part: 2
partTitle: 値と名前
chapter: 1
summary: 数と文字は別の種類で、値には型がある。
concept: 型
goal: int、float、string の違いを説明できる。
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

第2部では、値のことをもっと知っていこう。まずは、値のしゅるいの話だよ！

</div>

## なぜ必要か

`1 + 2`と`"1" + "2"`を、くるりんに計算させてみます。見た目はよく似ています。

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

答えが違いました。`1`は数で、`"1"`は文字だからです。数なら足し算になり、文字ならつなぎ合わせになります。

コンピューターは、値が何の種類かを知らないと、どう扱えばよいか分かりません。

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

値の種類を<strong>型</strong>と呼びます。この教材で最初に使う型は3つです。

<div class="vars">
<div class="var"><b>int</b><span>42</span><i>整数</i></div>
<div class="var"><b>float</b><span>3.14</span><i>小数</i></div>
<div class="var"><b>string</b><span>"こんにちは"</span><i>文字列</i></div>
</div>

- `int`は、`42`や`-3`のような整数です。
- `float`は、`3.14`のような小数です。
- `string`は、`"..."`で囲んだ文字列です。

文字列の中の`${式}`は、式を評価した値に置き換わります。これを<strong>文字列補間</strong>と呼びます。

<div class="eval" aria-label="1 + 2 は ${1 + 2} です が、1 + 2 は 3 です になる">
<span>"1 + 2 は ${1 + 2} です"</span><i>→</i><span>"1 + 2 は 3 です"</span>
<small>${ } の中の式を先に評価して、文字列に入れます。</small>
</div>

## 広げてみる

`/`は、割り切れなくても小数で答えます。`int`と`float`を混ぜた計算は、答えが`float`になります。

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

数と文字を、`+`でつなげてみます。

```kururi-error K0302
function main = () {
    print("年齢は" + 20)
}
```

<div class="say">

文字と数は、混ぜられないんだ。数を文字の中に入れたいなら、`"年齢は${20}"`のように、補間を使ってね。

</div>

## まとめ

- 値には型があります。整数の`int`、小数の`float`、文字列の`string`です。
- `"1"`と`1`は別の値で、足し算の動きも変わります。
- `"... ${式} ..."`で、文字列の中に式の値を入れられます。

## 練習

1. `"くる" + "くる" + "りん"`を、くるりんに話させてください。
2. 補間を使って、自分の年齢入りで`"わたしは、○歳です"`と話させてください。
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

`"さくら"`のような値を何度も書くのは、大変です。値に名前を付けて取っておくには、どうすればよいでしょう。
