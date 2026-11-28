---
title: 型が合わないと弾かれる
part: 2
partTitle: 値と名前
chapter: 3
summary: 変数の型と、入れる値の型は、そろえる。間違いは、実行する前に見つかる。
concept: 型の一致と変換
goal: 型が合わないときのエラーを読んで、直せる。
needs: 2-2 変数
kind: 宣言代入文
words:
  - "型の一致"
  - "型変換"
  - "to_int"
  - "to_string"
  - "to_float"
---

<div class="say">

変数には、入れていい値の<strong>型</strong>が決まっているよ。合わない値を入れようとすると、ぼくが、すぐに教えてあげる！

</div>

## なぜ必要か

ある学校の、テストの点数を、記録するとします。うっかり、点数の所に、文字を入れてしまったら、どうなるでしょう。

もし、動かしてから気づいたら、<strong>どこで間違えたか</strong>を、探すのが大変です。間違いは、<strong>実行する前</strong>に、見つけたいものです。

Kururiは、型が合わないと、実行する前に、エラーで教えてくれます。

## やってみる

型が合っているプログラムを、書いてみましょう。

```kururi
function main = () {
    var name: string = "さくら"
    var score: int = 85
    var average: float = 72.5
    print("${name}さんの点数は、${score}点（平均は${average}点）")
}
```

<div class="chat" role="img" aria-label="くるりんが、さくらさんの点数は、85点（平均は72.5点）、と話している">
<p class="k">さくらさんの点数は、85点（平均は72.5点）</p>
</div>

## しくみ

変数を作るとき、`: 型`で、入れる値の型を決めました。この型と、`=`の右の値の型が、<strong>同じ</strong>でなければなりません。

<div class="vars">
<div class="var"><b>score: int</b><span>85</span><i>int の値なので、OK</i></div>
<div class="var old"><b>score: int</b><span>"八十五"</span><i>string の値は、入れられない</i></div>
</div>

例外は、1つだけです。`int`の値は、`float`の変数に、そのまま入れられます（`1`が`1.0`として入ります）。

```kururi
function main = () {
    var price: float = 100
    print(price)
}
```

くるりんは、「100.0」と話します。

型を<strong>自分で変えたい</strong>ときは、変換の関数を使います。

| 関数 | 意味 | 例 | 値 |
|---|---|---|---|
| `to_int(x)` | `int`にする | `to_int("12")` | `12` |
| `to_float(x)` | `float`にする | `to_float(3)` | `3.0` |
| `to_string(x)` | `string`にする | `to_string(12)` | `"12"` |

## 広げてみる

`input()`は、文字列を返します。計算に使うときは、`to_int`で、数に変えます。

```kururi
function main = () {
    print("年齢は？")
    var age: int = to_int(input())
    print("来年は、${age + 1}歳だね")
}
```

<div class="chat" role="img" aria-label="くるりんが年齢を聞き、10と答えると、来年は、11歳だね、と返す">
<p class="k">年齢は？</p>
<p class="y">10</p>
<p class="k">来年は、11歳だね</p>
</div>

## わざと間違える

`int`の変数に、文字列を入れてみましょう。

```kururi-error K0301
function main = () {
    var count: int = "three"
    print(count)
}
```

エラーのカードには、「string の値を int には入れられません」と書いてあります。「直し方」は、「int の値を書くか、型を string に変えてください」です。

<div class="say">

どっちを直すかは、<strong>あなたが決める</strong>んだ。数を入れたいなら`3`、文字を入れたいなら、型を`string`にしてね。

</div>

## まとめ

- 変数の<strong>型</strong>と、入れる値の型は、そろえます。例外は、`int`を`float`に入れるときだけです。
- 型が合わないと、実行する前に、エラーで教えてくれます。
- 型を変えたいときは、`to_int`、`to_float`、`to_string`を使います。

## 練習

1. `var age: int = "10"`を、エラーが出ないように、2通りの方法で直してください。
2. `to_string`を使って、`123`を文字列にして、`"番号は"`とつなげてください。
3. `var a: int = 3.5`は、エラーになるでしょうか。`to_int`で直してください。

<details>
<summary>答えの例</summary>

1つ目は、値を数にするか、型を`string`にします。

```kururi
function main = () {
    var age: int = 10
    var age_text: string = "10"
    print(age)
    print(age_text)
}
```

2つ目です。

```kururi
function main = () {
    print("番号は" + to_string(123))
}
```

3つ目は、`float`の値を、`int`には入れられないので、エラーになります。`to_int`で、小数点以下を切り捨てて、変換します。

```kururi
function main = () {
    var a: int = to_int(3.5)
    print(a)
}
```

</details>

## つぎへ

変数が増えてくると、名前を<strong>どう付けるか</strong>が、大事になってきます。次は、名前の付け方を見ていきます。
