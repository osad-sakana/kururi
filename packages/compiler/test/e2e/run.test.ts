import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { compile } from "../../src"

/** Python 3.12 を探す。KURURI_PYTHON → python3.12 → uv の順。見つからなければ E2E は飛ばす。 */
function findPython312(): string | undefined {
  const candidates: (() => string | undefined)[] = [
    () => process.env["KURURI_PYTHON"],
    () => "python3.12",
    () => execFileSync("uv", ["python", "find", "3.12"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(),
  ]
  for (const candidate of candidates) {
    try {
      const path = candidate()
      if (path === undefined || path === "") continue
      const version = execFileSync(path, ["-c", "import sys;print(sys.version_info[:2])"], { encoding: "utf8" })
      if (version.trim() === "(3, 12)") return path
    } catch {
      // 次の候補へ
    }
  }
  return undefined
}

const python = findPython312()

function run(source: string): string {
  const { python: code, diagnostics } = compile(source)
  expect(diagnostics).toEqual([])
  return execFileSync(python as string, ["-c", code], { encoding: "utf8" })
}

const main = (body: string): string => `function main = () {\n${body}\n}\n`

describe.skipIf(python === undefined)("E2E: 生成した Python を 3.12 で実行する", () => {
  it("hello", () => {
    expect(run(main('  output("hello")'))).toBe("hello\n")
  })

  it("算術は Python と同じ結果になる", () => {
    const out = run(main("  output(7 / 2)\n  output(-7 % 3)\n  output(2 + 3 * 4)\n  output((2 + 3) * 4)\n  output(1 + 2.5)"))
    expect(out).toBe("3.5\n2\n14\n20\n3.5\n")
  })

  it("boolean は true / false と表示する", () => {
    const out = run(main("  output(1 < 2)\n  output(toString(2 < 1))\n  output(`${true and false} ${not false}`)"))
    expect(out).toBe("true\nfalse\nfalse true\n")
  })

  it("文字列補間・{ } ・エスケープ・日本語名", () => {
    const out = run(
      main('  var 名前: string = "太郎"\n  var n: int = 3\n  output(`{${名前}} は ${n * 2} 点 "引用" \\\\ \\${x}`)\n  output("a\\tb\\nc")'),
    )
    expect(out).toBe('{太郎} は 6 点 "引用" \\ ${x}\na\tb\nc\n')
  })

  it("入れ子の補間", () => {
    expect(run(main("  var a: int = 1\n  output(`x${`y${a}`}z`)"))).toBe("xy1z\n")
  })

  it("トップレベルの変数と float への暗黙変換", () => {
    const out = run(`const rate: float = 2\nvar base: int = 10\n${main("  output(base * rate)")}`)
    expect(out).toBe("20.0\n")
  })

  it("掛け算の連結行（行末演算子で複数行にした式）", () => {
    expect(run(main('  output("a" +\n    "b" +\n    "c")'))).toBe("abc\n")
  })
})

describe.skipIf(python === undefined)("E2E: 制御構文", () => {
  it("example.kururi の掛け算九九", () => {
    const source = readFileSync(join(__dirname, "../../../../example.kururi"), "utf8")
    const lines = run(source).split("\n")
    expect(lines[0]).toBe("掛け算九九の表")
    expect(lines).toHaveLength(12)
    expect(lines[2]).toBe(" 1  2  3  4  5  6  7  8  9 ")
    expect(lines[10]).toBe(" 9 18 27 36 45 54 63 72 81 ")
  })

  it("repeat は回数を 1 回だけ評価し、continue / break が効く", () => {
    const out = run(
      main(
        "  var n: int = 3\n  for i in 0..n {\n    n += 10\n    if i == 1 { continue }\n    output(i)\n  }\n  var k: int = 0\n  while true {\n    k += 1\n    if k > 2 { break }\n  }\n  output(k)",
      ),
    )
    expect(out).toBe("0\n2\n3\n")
  })

  it("global 宣言でトップレベルの変数を更新できる", () => {
    expect(run(`var total: int = 0\nfunction main = () {\n  for i in 0..4 {\n    total += i\n  }\n  output(total)\n}\n`)).toBe("6\n")
  })

  it("float への代入は float になる", () => {
    expect(run(main("  var f: float = 1.5\n  var n: int = 4\n  f = n\n  output(f)\n  f /= 8\n  output(f)"))).toBe("4.0\n0.5\n")
  })
})

describe.skipIf(python === undefined)("E2E: 配列", () => {
  it("README の配列の例", () => {
    const out = run(
      main(
        '  var fruits: string[] = ["apple", "banana"]\n  fruits[1] = "melon"\n  fruits.push("grape")\n  fruits.removeAt(0)\n  output(fruits.length)\n  for fruit in fruits {\n    output(fruit)\n  }',
      ),
    )
    expect(out).toBe("2\nmelon\ngrape\n")
  })

  it("float の配列は float として表示される", () => {
    expect(run(main("  var a: float[] = [1, 2]\n  a.push(3)\n  for x in a {\n    output(x)\n  }"))).toBe("1.0\n2.0\n3.0\n")
  })

  it("入れ子の配列と合計", () => {
    const out = run(
      main(
        "  var grid: int[][] = [[1, 2], [3, 4]]\n  var sum: int = 0\n  for row in grid {\n    for v in row {\n      sum += v\n    }\n  }\n  grid[1][0] += 10\n  output(sum)\n  output(grid[1][0])",
      ),
    )
    expect(out).toBe("10\n13\n")
  })

  it("文字列の添字と長さ", () => {
    expect(run(main('  var s: string = "こんにちは"\n  output(s[1])\n  output(s.length)'))).toBe("ん\n5\n")
  })
})

describe.skipIf(python === undefined)("E2E: 関数", () => {
  it("再帰（階乗とフィボナッチ）", () => {
    const out = run(
      `function fact = (n: int) -> int {\n  if n <= 1 {\n    return 1\n  }\n  return n * fact(n - 1)\n}\nfunction fib = (n: int) -> int {\n  if n < 2 { return n }\n  return fib(n - 1) + fib(n - 2)\n}\n${main("  output(fact(10))\n  output(fib(15))")}`,
    )
    expect(out).toBe("3628800\n610\n")
  })

  it("float の引数・戻り値", () => {
    expect(run(`function half = (x: float) -> float {\n  return x / 2\n}\nfunction one = () -> float {\n  return 1\n}\n${main("  output(half(5))\n  output(one())")}`)).toBe("2.5\n1.0\n")
  })

  it("配列を渡して書き換える・グローバルを更新する", () => {
    const out = run(
      `var calls: int = 0\nfunction addAll = (xs: int[], v: int) {\n  calls += 1\n  for i in 0..xs.length {\n    xs[i] += v\n  }\n}\n${main("  var a: int[] = [1, 2]\n  addAll(a, 10)\n  addAll(a, 1)\n  output(a[0] + a[1])\n  output(calls)")}`,
    )
    expect(out).toBe("25\n2\n")
  })
})

describe.skipIf(python === undefined)("E2E: クラス", () => {
  it("PLAN のクラスの例", () => {
    const out = run(
      `class Player = {\n  fields = {\n    name: string\n    public age: int = 20\n    private nickname: string = "none"\n  }\n  constructor = (name: string) {\n    self.name = name\n  }\n  public method run = () {\n    self.draw()\n    self.age += 1\n  }\n  public method show = () -> string {\n    return \`\${self.name} (\${self.age}) \${self.nickname}\`\n  }\n  method draw = () {\n    output("draw")\n  }\n}\n${main('  var pl: Player = new Player("taro")\n  pl.run()\n  output(pl.show())')}`,
    )
    expect(out).toBe("draw\ntaro (21) none\n")
  })

  it("配列のフィールドはインスタンスごとに別になる", () => {
    const out = run(
      `class Bag = {\n  fields = {\n    items: int[] = []\n  }\n  public method add = (v: int) {\n    self.items.push(v)\n  }\n  public method size = () -> int {\n    return self.items.length\n  }\n}\n${main("  var a: Bag = new Bag()\n  var b: Bag = new Bag()\n  a.add(1)\n  a.add(2)\n  b.add(9)\n  output(a.size())\n  output(b.size())")}`,
    )
    expect(out).toBe("2\n1\n")
  })

  it("クラスのリストと再帰的な型", () => {
    const out = run(
      `class Counter = {\n  fields = {\n    public n: int = 0\n  }\n  public method inc = () -> Counter {\n    self.n += 1\n    return self\n  }\n}\n${main("  var cs: Counter[] = [new Counter(), new Counter()]\n  for c in cs {\n    c.inc().inc()\n  }\n  output(cs[0].n + cs[1].n)")}`,
    )
    expect(out).toBe("4\n")
  })
})

describe.skipIf(python === undefined)("E2E: null・組み込み", () => {
  it("null と boolean の表示", () => {
    const out = run(
      main('  var a: string? = null\n  var b: int? = 5\n  var c: boolean? = false\n  output(a)\n  output(b)\n  output(c)\n  output(`${a} ${b} ${c}`)\n  a = "x"\n  output(toString(a))'),
    )
    expect(out).toBe("null\n5\nfalse\nnull 5 false\nx\n")
  })

  it("絞り込みと連結リスト", () => {
    const out = run(
      `class Node = {\n  fields = {\n    public value: int\n    public next: Node? = null\n  }\n  constructor = (value: int) {\n    self.value = value\n  }\n}\n${main("  var head: Node = new Node(1)\n  head.next = new Node(2)\n  var cur: Node? = head\n  var sum: int = 0\n  while cur != null {\n    sum += cur.value\n    cur = cur.next\n  }\n  output(sum)")}`,
    )
    expect(out).toBe("3\n")
  })

  it("div は切り下げ、% と対になる", () => {
    expect(run(main("  output(div(7, 2))\n  output(div(-7, 2))\n  output(-7 % 3)\n  output(2 * div(9, 4) + 1)"))).toBe("3\n-4\n2\n5\n")
  })

  it("toInt / toFloat / random", () => {
    const out = run(main('  output(toInt("42") + 1)\n  output(toFloat("1.5") * 2)\n  var r: int = random(3, 3)\n  output(r)\n  output(toInt(2.9))'))
    expect(out).toBe("43\n3.0\n3\n2\n")
  })

  it("input を受けて計算する", () => {
    const { python: code } = compile(main('  var a: int = toInt(input())\n  var b: int = toInt(input())\n  output(a + b)'))
    const out = execFileSync(python as string, ["-c", code], { encoding: "utf8", input: "3\n4\n" })
    expect(out).toBe("7\n")
  })
})
