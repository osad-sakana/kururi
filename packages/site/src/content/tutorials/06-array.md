---
title: データの並び（配列）
order: 6
concept: 配列
summary: 同じ種類の値を、順番つきでまとめて扱う。
---

たくさんの値を扱うとき、1つずつ変数を作るのは大変です。**配列**を使うと、同じ種類の値をまとめて扱えます。

```kururi
function main = () {
    var numbers: int[] = [10, 20, 30]
    numbers.push(40)
    numbers.remove_at(0)

    var total: int = 0
    for n in numbers {
        total = total + n
    }
    print("${numbers.length} 個の合計は ${total}")
}
```

## 何が書いてあるか

- 型は`int[]`のように、要素の型の後ろに`[]`を付けます。
- `numbers[0]`で、先頭の要素を読めます。**位置は0から数えます**。
- `numbers.push(40)`：末尾に追加。`numbers.remove_at(0)`：位置を指定して削除。
- `numbers.length`：要素の数。
- `numbers.contains(20)`：入っているか（`boolean`）。

## 概念：同じ種類だけ入れられる

`int[]`には`int`だけを入れられます。文字を混ぜようとするとエラーです。種類をそろえると、取り出した値をどう使えるかが分かります。

## 概念：位置は0から

最初の要素の位置は`0`です。`for i numbers.length times`のように、`length`の回数だけ回すと、全要素を回れます。多くの言語で同じ決まりです。

## ほかの言語では

```python
numbers = [10, 20, 30]
numbers.append(40)
```

```typescript
const numbers: number[] = [10, 20, 30]
numbers.push(40)
```

## 練習

1. 配列の中の最大の値を探すプログラムを書いてみましょう。
2. `["りんご", "みかん"]`の`string[]`を作って、`join(", ")`で1つの文字列にしてみましょう。
