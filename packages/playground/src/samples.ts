export interface SampleProgram {
  readonly id: string
  readonly title: string
  readonly source: string
}

/** 学ぶ順に並べた見本。どれもエラーなく変換でき、動かせる。 */
export const SAMPLES: readonly SampleProgram[] = [
  {
    id: "hello",
    title: "1. こんにちは（output）",
    source: `function main = () {
    output("こんにちは、Kururi！")
}
`,
  },
  {
    id: "variables",
    title: "2. 変数と型",
    source: `function main = () {
    var name: string = "さくら"
    var age: int = 12
    var height: float = 148.5
    var is_student: boolean = true

    output(\`\${name}さんは \${age} 歳、身長は \${height} cm です\`)
    output(is_student)

    age = age + 1
    output(\`来年は \${age} 歳\`)
}
`,
  },
  {
    id: "branch",
    title: "3. 分岐（if / else if / else）",
    source: `function main = () {
    var score: int = 75

    if score >= 90 {
        output("とてもよくできました")
    } else if score >= 60 {
        output("よくできました")
    } else {
        output("もう少しがんばろう")
    }
}
`,
  },
  {
    id: "loop",
    title: "4. 繰り返し（for / while）",
    source: `function main = () {
    // 0 から 4 まで（終わりの 5 は含まない）
    for i in 0..5 {
        output(i)
    }

    var fruits: string[] = ["りんご", "みかん", "ぶどう"]
    for fruit in fruits {
        output(fruit)
    }

    var count: int = 3
    while count > 0 {
        output(count)
        count = count - 1
    }
}
`,
  },
  {
    id: "array",
    title: "5. 配列（push / remove_at / length）",
    source: `function main = () {
    var numbers: int[] = [10, 20, 30]
    numbers.push(40)
    numbers.remove_at(0)

    var total: int = 0
    for n in numbers {
        total = total + n
    }
    output(\`\${numbers.length} 個の合計は \${total}\`)
}
`,
  },
  {
    id: "function",
    title: "6. 関数（引数と戻り値）",
    source: `function add = (a: int, b: int) -> int {
    return a + b
}

function greet = (name: string) {
    output(\`こんにちは、\${name}さん\`)
}

function main = () {
    greet("たろう")
    output(add(3, 4))
}
`,
  },
  {
    id: "class",
    title: "7. クラス（fields / constructor / method）",
    source: `class Counter = {
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
        output(\`いまの数は \${self.count}\`)
    }
}

function main = () {
    var counter: Counter = new Counter(10)
    counter.up()
    counter.up()
    counter.show()
}
`,
  },
  {
    id: "input",
    title: "8. 入力（input と to_int）",
    source: `function main = () {
    var text: string = input()
    var number: int = to_int(text)
    output(\`2 倍は \${number * 2}\`)
}
`,
  },
]
