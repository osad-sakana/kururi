---
title: 名前の付け方
part: 2
partTitle: 値と名前
chapter: 4
summary: 読んで分かる名前を付ける。Kururiは、名前の書き方の決まりを、教えてくれる。
concept: 命名規則
goal: 変数や定数の名前を、決まりどおりに付けられる。
needs: 2-3 型が合わないと弾かれる
kind: 宣言代入文
words:
  - "snake_case"
  - "UPPER_SNAKE_CASE"
  - "命名規則"
---

<div class="say">

名前は、**あとで読む人**のためのものだよ。あとで読む人は、あなた自身かもしれないね！

</div>

## なぜ必要か

次の2つのコードは、同じ計算をしています。

```kururi
function main = () {
    var a: int = 1200
    var b: int = 3
    var c: int = a * b
    print(c)
}
```

```kururi
function main = () {
    var price: int = 1200
    var count: int = 3
    var total: int = price * count
    print(total)
}
```

どちらが、「何をしているか」が、すぐに分かるでしょうか。名前は、コードの**説明**になります。

## やってみる

```kururi
const TAX_PERCENT: int = 10

function main = () {
    var item_price: int = 1200
    var item_count: int = 3
    var subtotal: int = item_price * item_count
    var total: int = subtotal + div(subtotal * TAX_PERCENT, 100)
    print("合計は、${total}円です")
}
```

<div class="chat" role="img" aria-label="くるりんが、合計は、3960円です、と話している">
<p class="k">合計は、3960円です</p>
</div>

## しくみ

Kururiには、名前の書き方の**決まり**があります。

| 名前の種類 | 書き方 | 例 |
|---|---|---|
| 変数、関数、引数 | 小文字と`_`だけ（`snake_case`） | `item_price`、`total` |
| `const`の定数 | 大文字と`_`だけ（`UPPER_SNAKE_CASE`） | `TAX_PERCENT` |
| クラス（第6部） | 先頭が大文字（`UpperCamelCase`） | `ShoppingCart` |

- 単語は、`_`でつなぎます。`itemPrice`のように、大文字でつなぐ書き方は、エラーです。
- ひらがな、カタカナ、漢字の名前も使えます（`var 名前: string = "さくら"`）。
- `boolean`の名前は、`is_`か`has_`で始めます。詳しくは、第4部で見ます。

決まりがあるのは、**だれが書いても、同じ読み方になる**ようにするためです。

## 広げてみる

日本語の名前も、使えます。

```kururi
function main = () {
    var 名前: string = "さくら"
    var 年齢: int = 10
    print("${名前}さんは、${年齢}歳です")
}
```

ただし、日本語と英語の名前を、同じプログラムで混ぜると、読みにくくなります。どちらかに、そろえましょう。

## わざと間違える

大文字を使った名前を、付けてみましょう。

```kururi-error K0506
function main = () {
    var itemPrice: int = 1200
    print(itemPrice)
}
```

<div class="say">

プレイグラウンドでは、エラーのカードに「**`item_price`に直す**」というボタンが出るよ。押すと、名前が出てくる所を、全部まとめて直してくれるんだ。

</div>

## まとめ

- 名前は、コードの説明です。読んで分かる名前を付けます。
- 変数は`snake_case`、定数は`UPPER_SNAKE_CASE`、クラスは`UpperCamelCase`です。
- 決まりに合わない名前は、エラーで教えてくれて、ボタンで直せます。

## 練習

1. `var totalPrice: int = 100`を、決まりに合う名前に直してください。
2. 消費税率を入れる定数を、作ってください。
3. `var x: int = 3`の`x`を、何の値か分かる名前に変えてみてください（ほかの名前も、自由に考えてください）。

<details>
<summary>答えの例</summary>

1つ目です。

```kururi
function main = () {
    var total_price: int = 100
    print(total_price)
}
```

2つ目です。

```kururi
const TAX_PERCENT: int = 10

function main = () {
    print(TAX_PERCENT)
}
```

3つ目は、たとえば、りんごの数なら、`apple_count`のような名前です。

```kururi
function main = () {
    var apple_count: int = 3
    print(apple_count)
}
```

</details>

## つぎへ

これで、第2部は、おしまいです。次の第3部では、同じ種類の値を**たくさん並べて**、順番に扱う方法を見ていきます。
