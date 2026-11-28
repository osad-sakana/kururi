---
title: 条件は真か偽
part: 4
partTitle: 条件で決める
chapter: 1
summary: そうか、そうでないかを、true と false で表す。
concept: boolean と比較
goal: 比較や and / or / not で条件を作れる。
needs: 3-3 for（回数で繰り返す）
kind: 式文
words:
  - "boolean"
  - "true / false"
  - "比較演算子"
  - "and / or / not"
  - "is_ / has_"
---

<div class="say">

第4部は、もし〜なら、の話だよ。ぼくに考えさせてみて！

</div>

## なぜ必要か

20歳以上ならお酒を買える。こんなふうに、場合によって答えが変わることを、プログラムでも扱いたくなります。

そのためには、そうか、そうでないかを、値として表せなければなりません。たとえば`3 > 2`は成り立つのか、成り立たないのか。

## やってみる

```kururi
function main = () {
    print(3 > 2)
    print(3 == 4)
    print(10 != 5)
}
```

<div class="chat" role="img" aria-label="くるりんが、true、false、true、と話している">
<p class="k">true</p>
<p class="k">false</p>
<p class="k">true</p>
</div>

## しくみ

`3 > 2`のような比べる式を評価すると、値は`true`か`false`のどちらかになります。この2つの値だけを持つ型が、<strong>`boolean`</strong>です。`true`は本当、`false`はうそを表します。

| 演算子 | 意味 | 例 | 値 |
|---|---|---|---|
| `==` | 等しい | `3 == 3` | `true` |
| `!=` | 等しくない | `3 != 3` | `false` |
| `<` `<=` | より小さい、以下 | `3 < 5` | `true` |
| `>` `>=` | より大きい、以上 | `3 >= 5` | `false` |

等しいかどうかは、`=`ではなく`==`と2つ重ねて書きます。`=`は、変数に値を入れる記号でしたね。

<div class="eval" aria-label="20 >= 20 が、true になる">
<span>age >= 20</span><i>→</i><span>20 >= 20</span><i>→</i><span>true</span>
<small>age が 20 のとき。比べる式も、評価すれば値になります。</small>
</div>

`boolean`の変数の名前は、`is_`か`has_`で始めます。〜である、〜を持っている、という問いかけとして読めるからです。

```kururi
function main = () {
    var age: int = 20
    var is_adult: boolean = age >= 20
    print(is_adult)
}
```

## 広げてみる

条件を組み合わせるには、`and`、`or`、`not`を使います。かつ、または、でない、にあたります。

| 式 | 意味 | `a`が`true`、`b`が`false`のとき |
|---|---|---|
| `a and b` | 両方が`true` | `false` |
| `a or b` | どちらかが`true` | `true` |
| `not a` | 真偽を逆にする | `false` |

```kururi
function main = () {
    var age: int = 15
    var has_ticket: boolean = true
    print(age < 18 and has_ticket)
    print(age >= 20 or has_ticket)
    print(not has_ticket)
}
```

<div class="chat" role="img" aria-label="くるりんが、true、true、false、と話している">
<p class="k">true</p>
<p class="k">true</p>
<p class="k">false</p>
</div>

`and`と`or`は、左だけで答えが決まるなら、右を評価しません。

## わざと間違える

`10 < age < 20`のように、比較を2つ続けて書いてみます。

```kururi-error K0106
function main = () {
    var age: int = 15
    print(10 < age < 20)
}
```

<div class="say">

比較は、2つの値のあいだにしか書けないんだ。10より大きくて20より小さい、と言いたいなら、`10 < age and age < 20`と`and`でつなぐよ。プレイグラウンドなら、ボタンで直せるんだ！

</div>

## まとめ

- 比べる式の値は`true`か`false`で、この型が`boolean`です。
- 等しいかどうかは`==`で比べます。`=`は代入です。
- 条件は、`and`、`or`、`not`で組み合わせます。`boolean`の変数名は、`is_`か`has_`で始めます。

## 練習

1. `5 > 3 and 2 > 4`の値を予想してください。
2. 年齢が`10`以上`20`未満かを調べる式を書いてください。
3. `has_`で始まる名前の`boolean`の変数を作って、くるりんに話させてください。

<details>
<summary>答えの例</summary>

1つ目は、`true and false`で、`false`です。

2つ目です。

```kururi
function main = () {
    var age: int = 15
    var is_teen: boolean = age >= 10 and age < 20
    print(is_teen)
}
```

3つ目です。

```kururi
function main = () {
    var has_umbrella: boolean = true
    print(has_umbrella)
}
```

</details>

## つぎへ

`true`か`false`が分かっても、まだやることは変わりません。条件に応じて進む道を分けるには、どうするのでしょう。
