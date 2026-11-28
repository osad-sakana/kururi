---
title: nullとT?
order: 8
summary: 値がないことの表し方と、null許容型を安全に使うための決まり。
---

## null

`null`は、「値がない」ことを表す値です。

- ふつうの型（`int`、`string`、クラスなど）の変数には、`null`を入れられません。
- `null`を入れたいときは、型に`?`を付けます。`string?`は、「`string`、または`null`」です。
- `?`は、配列にも付けられます。`int[]?`は「配列か`null`」、`int?[]`は「`int`か`null`の配列」です。

```kururi
function main = () {
    var name: string? = null
    var ages: int?[] = [20, null]
    print(name)
    print(ages)
}
```

## null かもしれない値は、そのまま使えない

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

`if x != null { ... }`の`{ }`の中では、`x`は`null`でないと分かっているので、`T`として使えます。これを<strong>絞り込み</strong>と呼びます。

絞り込めるのは、次の形です。

| 書き方 | 絞り込まれる範囲 |
|---|---|
| `if x != null { ... }` | `{ }`の中 |
| `if x == null { ... } else { ... }` | `else`の中（`else if`があるときは絞り込まない） |
| `while x != null { ... }` | `{ }`の中 |
| `x != null and ...` | `and`の右側 |
| `x == null or ...` | `or`の右側 |

`x`には、ローカル変数、引数、<strong>フィールド</strong>（`self.next`、`a.b`のように、`.`でたどったもの）を書けます。トップレベルの変数は絞り込めません（どの関数からでも書き換えられるため）。

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

絞り込みは、その値が変わるかもしれない操作で外れます。

- その変数やフィールドに<strong>代入した</strong>あと。
- ループの中で代入されるとき（2周目には`null`かもしれないため）。
- フィールドの絞り込みは、メソッドや自作の関数、`new`を<strong>呼んだ</strong>あと（呼んだ先でフィールドが書き換わるかもしれないため）。`print`などの組み込みの関数と、`push`・`remove_at`では外れません。

## 比べる

- `null`と比べられるのは、`T?`の値だけです。`int`の値と`null`は比べられません。
- `==`と`!=`で比べます。

## 値を返さない関数と null

`->`を書かない関数は、`null`を返します。この`null`は、`T?`の`null`と同じ値です。ただし、値を返さない関数の値を使うのは、たいてい間違いなので、警告で知らせます。詳しくは[関数](functions)を見てください。
