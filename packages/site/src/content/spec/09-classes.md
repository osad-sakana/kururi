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

クラスは、プログラムの直下に書きます。型や`new`に使えるのは、定義より後ろの行だけです。クラス自身の中では使えます。

## 3つの部分

| 部分 | 書き方 | 意味 |
|---|---|---|
| `fields` | `fields = { ... }` | 持っているデータ。クラスの中で1回だけ、最初に書く |
| `constructor` | `constructor = (引数) { ... }` | `new`で作るときの手順 |
| `method` | `public method 名前 = (引数) -> 型 { ... }` | できること |

### フィールド

`アクセス 名前: 型 = 初期値`の形です。初期値は省けます。ただし、省いたフィールドの型が`T?`でなければ、`constructor`で必ず代入します。

### constructor

- 外から常に呼べるので、`public`も`private`も付けられません。
- 1つのクラスに1つだけ書けます。
- 戻り値はありません。

### method

関数と同じ書き方に、前から`method`を付けます。戻り値の決まりも関数と同じで、`->`を省くと`null`を返します。

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

値を変える入口をメソッドに絞れば、おかしな値になるのを防げます。これがカプセル化です。

## new と self

- `new クラス名(引数)`でインスタンスを作ります。`()`は省けません。
- `self`は、クラスの中でそのインスタンス自身を指します。フィールドは`self.名前`で読み書きします。
- インスタンスは変数に入れて、関数に渡せます。渡した側と受け取った側は、同じインスタンスを指します。
