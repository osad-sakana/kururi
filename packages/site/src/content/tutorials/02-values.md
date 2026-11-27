---
title: 値と型
order: 2
concept: 値・型・変数
summary: 値には種類（型）がある。名前を付けて値を入れる入れ物が変数。
---

プログラムが扱うのは「値」です。値には**種類**があり、これを**型**と呼びます。

| 型 | 意味 | 例 |
|---|---|---|
| `int` | 整数 | `12` |
| `float` | 小数 | `3.14` |
| `string` | 文字列 | `"さくら"` |
| `boolean` | 真偽 | `true` / `false` |

## 変数：名前を付けて値を入れる

```kururi
function main = () {
    var name: string = "さくら"
    var age: int = 12
    const PI: float = 3.14
    var is_student: boolean = true

    print(`${name}さんは ${age} 歳です`)
    print(PI)
    print(is_student)

    age = age + 1
    print(age)
}
```

- `var 名前: 型 = 値`で、**あとから変えられる**入れ物を作ります。
- `const`は、**変えられない**入れ物（定数）です。名前は大文字にします。
- `` `... ${式} ...` ``は、文字列の中に値を埋め込みます（補間）。

## 概念：型が合わないと弾かれる

型は、うっかりを減らすためのものです。たとえば、整数の入れ物に文字を入れようとすると、実行する前にエラーになります。

```kururi
function main = () {
    var count: int = 3
    print(count)
}
```

上のコードの`3`を`"three"`に変えて、エラーを読んでみましょう。「何が違うか」と「どう直すか」が出ます。

## 概念：名前の付け方にも決まりがある

Kururiでは、変数や関数は`total_price`（スネークケース）、クラスは`ShoppingCart`、定数は`TAX_RATE`と書きます。決まりに合わないと、直し方つきのエラーになります。名前をそろえるのは、多くの言語で読みやすいコードの基本です。

## ほかの言語では

```python
age: int = 12        # Python（型は省略できる）
```

```typescript
let age: number = 12  // TypeScript
```

```java
int age = 12;         // Java（型を名前の前に書く）
```

## 練習

1. 好きな食べ物を`string`の変数に入れて、`print`で出してみましょう。
2. `age`を`const`に変えて、`age = age + 1`がエラーになることを確かめましょう。
