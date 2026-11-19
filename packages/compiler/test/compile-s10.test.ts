import { describe, expect, it } from "vitest"
import { compile } from "../src"

const codesOf = (source: string): string[] => compile(source).diagnostics.map((d) => d.code)
const main = (body: string): string => `function main = () {\n${body}\n}\n`

describe("compile (S10): 新しい書き方", () => {
  it("戻り値がない関数は -> を省ける。-> void と書いてもよい", () => {
    expect(codesOf("function f = () {\n}\nfunction main = () -> void {\n}\n")).toEqual([])
  })

  it("for i in a..b は range になる。始まりが 0 なら省く", () => {
    const { python } = compile(main("  for i in 0..3 {\n    print(i)\n  }\n  for j in 2..5 {\n    print(j)\n  }"))
    expect(python).toContain("for i in range(3):")
    expect(python).toContain("for j in range(2, 5):")
  })

  it("範囲の端には式を書ける。int でなければ K0306", () => {
    expect(codesOf(main("  var n: int = 4\n  for i in 0..n + 1 {\n  }"))).toEqual([])
    expect(codesOf(main('  for i in 0.."x" {\n  }'))).toEqual(["K0306"])
    expect(codesOf(main("  for i in 1.5..3 {\n  }"))).toEqual(["K0306"])
  })

  it("for x in 配列 は for のまま。配列でなければ K0306", () => {
    expect(compile(main("  var xs: int[] = [1]\n  for x in xs {\n    print(x)\n  }")).python).toContain("for x in xs:")
    expect(codesOf(main("  var n: int = 1\n  for x in n {\n  }"))).toEqual(["K0306"])
  })

  it("ループの変数には代入できない", () => {
    expect(codesOf(main("  for i in 0..3 {\n    i = 1\n  }"))).toEqual(["K0213"])
  })

  it("else if は elif になる", () => {
    const { python } = compile(main("  var a: int = 1\n  if a == 1 {\n  } else if a == 2 {\n  } else {\n  }"))
    expect(python).toContain("elif a == 2:")
    expect(python).toContain("else:")
  })

  it("クラスと constructor は = を使う", () => {
    const { python, diagnostics } = compile("class P = {\n  constructor = (x: int) {\n  }\n}\n" + main(""))
    expect(diagnostics).toEqual([])
    expect(python).toContain("def __init__(self, x):")
  })

  it("fields の中のフィールドは __init__ の先頭に出る。method は def になる", () => {
    const { python, diagnostics } = compile(
      "class D = {\n  fields = {\n    private name: string\n    public age: int = 0\n  }\n  constructor = (name: string) {\n    self.name = name\n  }\n  public method bark = () {\n  }\n}\n" + main(""),
    )
    expect(diagnostics).toEqual([])
    expect(python).toContain("self.age = 0\n        self.name = name")
    expect(python).toContain("def bark(self):")
  })

  it("fields は省ける。フィールドがなくてもよい", () => {
    expect(codesOf("class A = {\n  method f = () {\n  }\n}\n" + main(""))).toEqual([])
  })

  it("fields は 1 回だけ、constructor と method より前（K0115）", () => {
    const fields = "  fields = {\n    x: int = 1\n  }\n"
    expect(codesOf("class A = {\n" + fields + fields.replace("x:", "y:") + "}\n" + main(""))).toEqual(["K0115"])
    expect(codesOf("class A = {\n  method f = () {\n  }\n" + fields + "}\n" + main(""))).toEqual(["K0115"])
  })

  it("継承の書き方はまだ使えない（K0002）", () => {
    expect(codesOf("class A = {\n}\nclass B = (A) {\n}\n" + main(""))).toEqual(["K0002"])
  })
})

describe("compile (S10): 古い書き方への案内（K0114）", () => {
  it("let は var に変わった。案内を出しつつ読み進める", () => {
    expect(codesOf(main("  let a: int = 1"))).toEqual(["K0114"])
    expect(codesOf("let a: int = 1\n" + main(""))).toEqual(["K0114"])
  })

  it("repeat は for i in 0..n に変わった", () => {
    expect(codesOf(main("  repeat i: 3 {\n  }"))).toEqual(["K0114"])
  })

  it("foreach は for に変わった。案内を出しつつ読み進める", () => {
    expect(codesOf(main("  foreach x in [1] {\n  }"))).toEqual(["K0114"])
  })

  it("elseif は else if に変わった。案内を出しつつ読み進める", () => {
    expect(codesOf(main("  if true {\n  } elseif false {\n  }"))).toEqual(["K0114"])
  })

  it("C 言語風の for には案内を出す", () => {
    expect(codesOf(main("  for (var i: int = 0; i < 3; i += 1) {\n  }")).includes("K0114")).toBe(true)
  })

  it("クラスの直下のフィールドと、クラスの中の function は案内を出しつつ読み進める", () => {
    expect(codesOf("class A = {\n  x: int = 1\n}\n" + main(""))).toEqual(["K0114"])
    expect(codesOf("class A = {\n  public function f = () {\n  }\n}\n" + main(""))).toEqual(["K0114"])
  })

  it("関数・constructor・クラスの古い書き方は = が必要と案内する", () => {
    expect(codesOf("function main(): void {\n}\n")).toEqual(["K0101"])
    expect(codesOf("class A {\n}\n" + main(""))).toEqual(["K0101"])
    expect(codesOf("class A = {\n  constructor(x: int) {\n  }\n}\n" + main(""))).toEqual(["K0101"])
  })

  it("let / repeat / foreach / elseif は予約語のまま（名前には使えない）", () => {
    for (const word of ["let", "repeat", "foreach", "elseif"]) {
      expect(codesOf(main(`  var ${word}: int = 1`))).toEqual(["K0501"])
    }
  })
})
