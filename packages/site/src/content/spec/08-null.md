---
title: nullとT?
order: 8
summary: 値がないことの表し方と、null許容型を安全に使うための決まり。
---

## null

`null`は、値がないことを表す値です。

- ふつうの型（`int`、`string`、クラスなど）の変数には、`null`を入れられません。
- `null`を入れたいときは、型に`?`を付けます。`string?`は`string`か`null`です。
- `?`は配列にも付けられます。`int[]?`は配列か`null`で、`int?[]`は`int`か`null`が並ぶ配列です。

```kururi
function main = () {
    var name: string? = null
    var ages: int?[] = [20, null]
    print(name)
    print(ages)
}
```

## nullかもしれない値は、そのまま使えない

`T?`の値を、`T`として使おうとするとエラーです。

```kururi-error K0330
function main = () {
    var name: string? = null
    print(name.length)
}
```

使う前に、`null`でないことを確かめます。

```kururi
function main = () {
    var name: string? = "kururi"
    if name != null {
        print(name.length)
    }
}
```

## 絞り込み

`if x != null { ... }`の`{ }`の中では、`x`が`null`でないと分かっているので、`T`として使えます。これを<strong>絞り込み</strong>と呼びます。

絞り込める形は次のとおりです。

| 書き方 | 絞り込まれる範囲 |
|---|---|
| `if x != null { ... }` | `{ }`の中 |
| `if x == null { ... } else { ... }` | `else`の中（`else if`があるときは絞り込まない） |
| `while x != null { ... }` | `{ }`の中 |
| `x != null and ...` | `and`の右側 |
| `x == null or ...` | `or`の右側 |

`x`に書けるのは、ローカル変数、引数、フィールドです。フィールドは、`self.next`や`a.b`のように`.`でたどったものを指します。トップレベルの変数は、どの関数からでも書き換えられるので、絞り込めません。

```kururi
class Node = {
    fields = {
        public next: Node? = null
        public value: int = 0
    }

    public method next_value = () -> int {
        if self.next != null {
            return self.next.value
        }
        return -1
    }
}

function main = () {
    var node: Node = new Node()
    print(node.next_value())
}
```

### 絞り込みが外れるとき

値が変わるかもしれない操作をすると、絞り込みは外れます。

- その変数やフィールドに代入したあと。
- ループの中で代入されるとき。2周目には`null`かもしれないためです。
- フィールドの絞り込みは、メソッドや自作の関数、`new`を呼んだあとにも外れます。呼んだ先でフィールドが書き換わるかもしれないためです。`print`などの組み込み関数と、`push`・`remove_at`では外れません。

## 比べる

- `null`と比べられるのは、`T?`の値だけです。`int`の値と`null`は比べられません。
- `==`と`!=`で比べます。

## 値を返さない関数と null

`->`を書かない関数は、`null`を返します。この`null`は、`T?`の`null`と同じ値です。ただ、値を返さない関数の値を使うことはほとんど間違いなので、警告が出ます。詳しくは[関数](functions)を見てください。
