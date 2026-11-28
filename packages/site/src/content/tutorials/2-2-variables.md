---
title: 変数
part: 2
partTitle: 値と名前
chapter: 2
summary: 値に名前を付けて、取っておく。あとから、中身を変えることもできる。
concept: 変数と代入
goal: 変数を作って、値を入れたり、変えたりできる。
needs: 2-1 値と型
kind: 宣言代入文
words:
  - "変数"
  - "var"
  - "const"
  - "代入"
  - "宣言代入文"
---

<div class="say">

値に名前を付けると、ぼくも、覚えておけるよ。名前を付けた値は、<strong>何度でも</strong>使えるんだ。

</div>

## なぜ必要か

名前を何度も使うプログラムを、考えてみましょう。

```kururi
function main = () {
    print("こんにちは、さくらさん")
    print("さくらさん、今日もがんばろう")
    print("さくらさん、またね")
}
```

名前を「たろう」に変えたいとき、3か所を、全部直さないといけません。1か所を、直し忘れるかもしれません。

## やってみる

```kururi
function main = () {
    var name: string = "さくら"
    print("こんにちは、${name}さん")
    print("${name}さん、今日もがんばろう")
    print("${name}さん、またね")
}
```

`"さくら"`を、`"たろう"`に変えてみましょう。直すのは、<strong>1か所だけ</strong>です。

<div class="chat" role="img" aria-label="くるりんが、こんにちは、さくらさん、さくらさん、今日もがんばろう、さくらさん、またね、と話している">
<p class="k">こんにちは、さくらさん</p>
<p class="k">さくらさん、今日もがんばろう</p>
<p class="k">さくらさん、またね</p>
</div>

## しくみ

`var name: string = "さくら"`は、「`name`という名前の入れ物を作って、`"さくら"`を入れる」という意味です。この入れ物を<strong>変数</strong>と呼びます。

<div class="vars">
<div class="var"><b>name</b><span>"さくら"</span><i>string の変数</i></div>
</div>

書き方は、`var 名前: 型 = 値`です。型は、必ず書きます。この1行は、<strong>宣言代入文</strong>です。

変数の中身は、あとから<strong>代入</strong>で変えられます。`=`は、「等しい」ではなく、「右の値を、左に入れる」という意味です。

```kururi
function main = () {
    var count: int = 0
    print(count)
    count = count + 1
    print(count)
}
```

`count = count + 1`は、<strong>右側を先に評価</strong>してから、結果を、左の変数に入れます。

<div class="eval" aria-label="count が 0 のとき、count + 1 が、0 + 1 を経て、1 になり、count に入る">
<span>count + 1</span><i>→</i><span>0 + 1</span><i>→</i><span>1</span>
<small>count が 0 のとき。評価した値 1 を、count に入れ直します。</small>
</div>

<div class="vars">
<div class="var old"><b>count</b><span>0</span><i>前</i></div>
<div class="var"><b>count</b><span>1</span><i>代入のあと</i></div>
</div>

## 広げてみる

`count = count + 1`は、`count += 1`と、短く書けます。`-=`、`*=`も、同じ仕組みです。

```kururi
function main = () {
    var score: int = 10
    score += 5
    score *= 2
    print(score)
}
```

くるりんは、「30」と話します。`(10 + 5) * 2`の答えです。

あとから<strong>変えない</strong>値には、`var`ではなく、`const`を使います。

```kururi
function main = () {
    const GREETING: string = "こんにちは"
    print(GREETING)
}
```

## わざと間違える

`const`の中身を、書き換えてみましょう。

```kururi-error K0212
function main = () {
    const GREETING: string = "こんにちは"
    GREETING = "おはよう"
}
```

<div class="say">

`const`は、<strong>変えちゃだめ</strong>の印だよ。うっかり書き換えたときに、エラーで教えてくれるんだ。

</div>

## まとめ

- `var 名前: 型 = 値`で、<strong>変数</strong>を作ります。
- `名前 = 式`で、変数の中身を変えます（<strong>代入</strong>）。右側を先に評価します。
- 変えない値には、`const`を使います。

## 練習

1. 自分の名前と年齢を、2つの変数に入れて、くるりんに話させてください。
2. `var n: int = 3`のあとで、`n`を2倍にして、話させてください。
3. 次のコードを実行する前に、最後に話す値を予想してください。

   ```kururi
   function main = () {
       var a: int = 1
       a = a + 10
       a = a * 2
       print(a)
   }
   ```

<details>
<summary>答えの例</summary>

1つ目です。

```kururi
function main = () {
    var name: string = "さくら"
    var age: int = 10
    print("${name}さんは、${age}歳です")
}
```

2つ目です。

```kururi
function main = () {
    var n: int = 3
    n *= 2
    print(n)
}
```

3つ目は、`22`です。`1 + 10`で`11`、それを2倍にして`22`です。

</details>

## つぎへ

変数には、<strong>型</strong>が決まっています。`int`の変数に、`"three"`を入れたら、どうなるでしょう。次は、型の約束を見ていきます。
