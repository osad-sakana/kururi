---
title: 条件は真か偽
part: 4
partTitle: 条件で決める
chapter: 1
summary: 「そうか、そうでないか」を、true と false で表す。
concept: boolean と比較
goal: 比較や and / or / not で、条件を作れる。
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

第4部は、<strong>「もし〜なら」</strong>の話だよ。ぼくに、考えさせてみて！

</div>

## なぜ必要か

「20歳以上なら、お酒を買える」。こんなふうに、<strong>場合によって</strong>、答えが変わることを、プログラムで扱いたくなります。

そのためには、まず、「そうか、そうでないか」を、<strong>値として</strong>表せなければなりません。`3 > 2`は、成り立つでしょうか。

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

`3 > 2`のような、<strong>比べる式</strong>を評価すると、`true`（本当）か`false`（うそ）の、どちらかの値になります。この、2つの値だけを持つ型を、`boolean`と呼びます。

| 演算子 | 意味 | 例 | 値 |
|---|---|---|---|
| `==` | 等しい | `3 == 3` | `true` |
| `!=` | 等しくない | `3 != 3` | `false` |
| `<` `<=` | より小さい、以下 | `3 < 5` | `true` |
| `>` `>=` | より大きい、以上 | `3 >= 5` | `false` |

「等しい」は、`=`ではなく、`==`と、2つ書きます。`=`は、変数に値を入れる記号でしたね。

<div class="eval" aria-label="20 >= 20 が、true になる">
<span>age >= 20</span><i>→</i><span>20 >= 20</span><i>→</i><span>true</span>
<small>age が 20 のとき。比べる式も、評価すると、値になります。</small>
</div>

`boolean`の変数を作ったときは、名前を、`is_`か`has_`で始めます。「〜である」「〜を持っている」という、質問になるように、読めるからです。

```kururi
function main = () {
    var age: int = 20
    var is_adult: boolean = age >= 20
    print(is_adult)
}
```

## 広げてみる

条件を、<strong>組み合わせる</strong>には、`and`（かつ）、`or`（または）、`not`（でない）を使います。

| 式 | 意味 | `a`が`true`、`b`が`false`のとき |
|---|---|---|
| `a and b` | 両方が`true` | `false` |
| `a or b` | どちらかが`true` | `true` |
| `not a` | 反対にする | `false` |

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

`and`と`or`は、<strong>左だけで答えが決まる</strong>ときは、右を、評価しません。

## わざと間違える

`10 < age < 20`のように、比較を、2つ続けて書いてみましょう。

```kururi-error K0106
function main = () {
    var age: int = 15
    print(10 < age < 20)
}
```

<div class="say">

比較は、<strong>2つの値のあいだ</strong>にしか、書けないよ。「10より大きくて、20より小さい」は、`10 < age and age < 20`と、`and`でつなぐんだ。プレイグラウンドなら、ボタンで直せるよ！

</div>

## まとめ

- 比べる式の値は、`true`か`false`です。この型を、<strong>boolean</strong>と呼びます。
- 等しいかは`==`で比べます。`=`は、代入です。
- `and`、`or`、`not`で、条件を組み合わせます。`boolean`の名前は、`is_`か`has_`で始めます。

## 練習

1. `5 > 3 and 2 > 4`の値を、予想してください。
2. 自分の年齢が、`10`以上`20`未満か、調べる式を書いてください。
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

`true`か`false`が分かっても、まだ、<strong>やることは</strong>変わりません。条件によって、<strong>進む道を分ける</strong>には、どうすればよいでしょう。
