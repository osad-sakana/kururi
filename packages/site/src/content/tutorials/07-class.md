---
title: クラス
order: 7
concept: オブジェクトとカプセル化
summary: データと動きをひとまとめにして、外から守る。
---

関連するデータと動きを、ひとまとめにして扱いたいとき、**クラス**を使います。クラスは「設計図」で、そこから作ったものを**インスタンス**と呼びます。

```kururi
class Counter = {
    fields = {
        private count: int = 0
    }

    constructor = (start: int) {
        self.count = start
    }

    public method up = () {
        self.count += 1
    }

    public method show = () {
        print("いまの数は ${self.count}")
    }
}

function main = () {
    var counter: Counter = new Counter(10)
    counter.up()
    counter.up()
    counter.show()
}
```

## クラスの3つの部分

- `fields`：持っているデータ（フィールド）。
- `constructor`：インスタンスを作るときの手順。`new Counter(10)`で呼ばれます。
- `method`：できること（動き）。`counter.up()`のように呼びます。
- `self`は「このインスタンス自身」です。

## 概念：外から守る（カプセル化）

`private`のフィールドは、クラスの外から触れません。`counter.count = 100`と書くと、エラーになります。値を変える入口を`up`のようなメソッドに絞ることで、**おかしな値になるのを防げます**。`public`は、外から使ってよいものです。

## 概念：1つの設計図から、たくさん作る

`new Counter(10)`と`new Counter(0)`は、別々のインスタンスです。それぞれが自分の`count`を持ちます。

## ほかの言語では

```python
class Counter:
    def __init__(self, start):
        self.count = start
```

```typescript
class Counter {
  private count: number
  constructor(start: number) {
    this.count = start
  }
}
```

```java
class Counter {
    private int count;
    Counter(int start) {
        this.count = start;
    }
}
```

Pythonの`__init__`が`constructor`です。`self`はPythonでは引数に書きますが、Kururiでは書かなくて済みます。

## 練習

1. `down`メソッドを足して、数を1減らせるようにしましょう。
2. `Counter`を2つ作って、別々に増やしてみましょう。
