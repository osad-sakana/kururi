---
title: 値がないこと
order: 8
concept: null と null 許容型
summary: 「ない」かもしれない値を、型で意識する。
---

探しているものが、見つからないことがあります。そのとき「**値がない**」ことを表すのが `null` です。

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
        print(`こんにちは、${name}さん`)
    } else {
        print("見つかりません")
    }
}
```

## 何が書いてあるか

- `string?` は「`string`、または `null`」という型です。
- `string` には `null` を入れられません。`null` が入りうるときだけ `?` を付けます。
- `if name != null { ... }` の中では、`name` を `string` として使えます（確かめたので安全です）。

## 概念：「ない」を型で表す

`null` のまま使うとプログラムが止まるのは、多くの言語で起きる、よくある間違いです。Kururi は、`?` の付いた値を**確かめずに使うとエラー**にします。実行して初めて分かる間違いを、書いている途中で見つけられます。

## ほかの言語では

```typescript
let name: string | null = findName(2)
if (name !== null) {
  console.log(name)
}
```

```kotlin
val name: String? = findName(2)
if (name != null) {
    println(name)
}
```

```python
name: str | None = find_name(2)
if name is not None:
    print(name)
```

言語によって書き方（`?`、`| null`、`Option` など）は違いますが、「ないかもしれない」を意識する考え方は共通です。

## 練習

1. `find_name(1)` に変えて、結果が変わることを確かめましょう。
2. `if name != null` の確認を消して、エラーを読んでみましょう。
