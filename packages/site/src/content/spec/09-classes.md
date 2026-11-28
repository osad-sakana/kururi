---
title: クラス
order: 9
summary: クラスの宣言、フィールド、constructor、メソッド、public と private。
---

## 宣言

```kururi
class Counter = {
    fields = {
        private count: int = 0
        public label: string = "カウンター"
    }

    constructor = (start: int) {
        self.count = start
    }

    public method up = () {
        self.count += 1
    }

    public method show = () {
        print("${self.label}: ${self.count}")
    }
}

function main = () {
    var counter: Counter = new Counter(10)
    counter.up()
    counter.show()
}
```

クラスは、プログラムの直下に書きます。クラスは、<strong>定義より後ろの行</strong>でだけ、型や`new`に使えます（自分自身の中は使えます）。

## 3つの部分

| 部分 | 書き方 | 意味 |
|---|---|---|
| `fields` | `fields = { ... }` | 持っているデータ。クラスの中で1回だけ、最初に書く |
| `constructor` | `constructor = (引数) { ... }` | `new`で作るときの手順 |
| `method` | `public method 名前 = (引数) -> 型 { ... }` | できること |

### フィールド

`アクセス 名前: 型 = 初期値`の形です。初期値は省けますが、省いたフィールドは、<strong>`T?`でなければ、`constructor`で必ず代入する</strong>必要があります。

### constructor

- 常に外から呼べます（`public` / `private`は付けられません）。
- 1つのクラスに、1つだけです。
- 戻り値はありません。

### method

関数と同じ書き方で、`method`を前に付けます。戻り値の決まりも関数と同じです（`->`を省くと`null`を返す）。

## アクセス

| 書き方 | 意味 |
|---|---|
| `public` | クラスの外からも使える |
| `private` | クラスの中だけで使える（省略したとき） |

`private`のフィールドやメソッドを外から使うと、エラーです。

```kururi-error K0401
class Counter = {
    fields = {
        private count: int = 0
    }
}

function main = () {
    var counter: Counter = new Counter()
    counter.count = 100
}
```

値を変える入口をメソッドに絞ることで、おかしな値になるのを防ぎます（カプセル化）。

## new と self

- `new クラス名(引数)`で、インスタンスを作ります。`()`は省けません。
- `self`は、クラスの中で、そのインスタンス自身を指します。フィールドは`self.名前`で読み書きします。
- インスタンスは、変数に入れて、関数に渡せます。渡したものと、受け取ったものは、<strong>同じインスタンス</strong>です。
