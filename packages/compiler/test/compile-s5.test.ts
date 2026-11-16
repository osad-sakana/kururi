import { describe, expect, it } from "vitest"
import { compile } from "../src"

const main = (body: string): string => `function main = () {\n${body}\n}\n`
const codesOf = (source: string): string[] => compile(source).diagnostics.map((d) => d.code)
const pyOf = (source: string): string => {
  const { python, diagnostics } = compile(source)
  expect(diagnostics).toEqual([])
  return python
}

describe("compile (S5): T? と null の生成", () => {
  it("T? の変数は None で始まる（型ヒントは出さない）", () => {
    const py = pyOf(main('  var a: string? = null\n  var b: int?[] = [1, null]\n  var c: string[]? = null\n  a = "x"'))
    expect(py).toContain("a = None")
    expect(py).toContain("b = [1, None]")
    expect(py).toContain("c = None")
    expect(py).toContain('a = "x"')
  })

  it("null との比較は is None / is not None になる", () => {
    const py = pyOf(main("  var a: int? = null\n  if a == null {\n  }\n  if a != null {\n  }"))
    expect(py).toContain("if a is None:")
    expect(py).toContain("if a is not None:")
  })

  it("T? と boolean の表示には補助関数を使い、必要なときだけ出す", () => {
    const py = pyOf(main("  var a: int? = null\n  output(a)\n  output(to_string(a))\n  output(`${a}`)"))
    expect(py).toContain("def __kururi_show(value):")
    expect(py).toContain("print(__kururi_show(a))")
    expect(compile(main('  output("x")')).python).not.toContain("__kururi_show")
  })

  it("T? のフィールドは初期値がなければ None になる", () => {
    const py = pyOf("class A = {\n  fields = {\n    next: A?\n    public v: int = 1\n  }\n}\n" + main(""))
    expect(py).toContain("self.next = None\n        self.v = 1")
  })

  it("連結リストのような自分自身の型", () => {
    expect(codesOf("class Node = {\n  fields = {\n    public next: Node? = null\n    public v: int = 0\n  }\n}\n" + main("  var n: Node = new Node()\n  n.next = new Node()\n  n.next = null"))).toEqual([])
  })
})

describe("compile (S5): 組み込み関数", () => {
  it("input / to_int / to_float / div / random", () => {
    const py = pyOf(main('  var s: string = input()\n  var n: int = to_int(s)\n  var f: float = to_float("1.5")\n  output(div(n, 2) * 3)\n  output(div(n + 1, 2 + n))\n  output(random(1, 6))\n  output(to_int(2.5))'))
    expect(py).toContain("import random\n")
    expect(py).toContain("s = input()")
    expect(py).toContain("n = int(s)")
    expect(py).toContain('f = float("1.5")')
    expect(py).toContain("print((n // 2) * 3)")
    expect(py).toContain("print(((n + 1) // (2 + n)))")
    expect(py).toContain("print(random.randint(1, 6))")
    expect(py).toContain("print(int(2.5))")
  })

  it("引数の数・型が違うと K0305 / K0301", () => {
    expect(codesOf(main("  var s: string = input(1)"))).toEqual(["K0305"])
    expect(codesOf(main("  var n: int = to_int()"))).toEqual(["K0305"])
    expect(codesOf(main("  var n: int = to_int(true)"))).toEqual(["K0301"])
    expect(codesOf(main("  var n: int = div(1.5, 2)"))).toEqual(["K0301"])
    expect(codesOf(main("  var n: int = random(1)"))).toEqual(["K0305"])
    expect(codesOf(main('  var n: int = to_int("1") + "a"'))).toEqual(["K0302"])
  })

  it("random を使わなければ import しない", () => {
    expect(compile(main("  output(1)")).python).not.toContain("import random")
  })
})

describe("compile (S5): null の検査", () => {
  it("T? を T の場所に使うと K0301（null には ? を付ける案内）", () => {
    expect(codesOf(main("  var a: int? = null\n  var b: int = a"))).toEqual(["K0301"])
    expect(codesOf(main("  var b: int = null"))).toEqual(["K0301"])
    const [d] = compile(main("  var b: int = null")).diagnostics
    expect(d?.hint).toContain("?")
  })

  it("null かもしれない値を演算・添字・メンバ・条件に使うと K0330", () => {
    expect(codesOf(main("  var a: int? = null\n  output(a + 1)"))).toEqual(["K0330"])
    expect(codesOf(main("  var a: int? = null\n  output(-a)"))).toEqual(["K0330"])
    expect(codesOf(main('  var s: string? = null\n  output(s.length)'))).toEqual(["K0330"])
    expect(codesOf(main("  var xs: int[]? = null\n  output(xs[0])"))).toEqual(["K0330"])
    expect(codesOf(main("  var xs: int[]? = null\n  for x in xs {\n  }"))).toEqual(["K0330"])
    expect(codesOf(main("  var b: boolean? = null\n  if b {\n  }"))).toEqual(["K0330"])
    expect(codesOf(main("  var a: int? = null\n  a += 1"))).toEqual(["K0330"])
  })

  it("== と != で null と比べられる。T と null は比べられない", () => {
    expect(codesOf(main("  var a: int? = null\n  var b: int? = 1\n  output(a == null)\n  output(a != b)\n  output(a == 1)"))).toEqual([])
    expect(codesOf(main("  var a: int = 1\n  output(a == null)"))).toEqual(["K0303"])
  })

  it("T? と T の配列は別の型", () => {
    expect(codesOf(main("  var a: int[] = [1]\n  var b: int?[] = a"))).toEqual(["K0301"])
    expect(codesOf(main("  var a: int?[] = [1, null]\n  var b: int[] = a"))).toEqual(["K0301"])
  })

  it("配列・オブジェクトの T? も表示できない", () => {
    expect(codesOf(main("  var a: int[]? = null\n  output(a)"))).toEqual(["K0313"])
  })
})

describe("compile (S5): 絞り込み", () => {
  it("if x != null の中では T として使える", () => {
    expect(codesOf(main('  var s: string? = null\n  if s != null {\n    output(s.length)\n  }'))).toEqual([])
    expect(codesOf(main("  var s: string? = null\n  if s != null and s.length > 1 {\n  }"))).toEqual([])
    expect(codesOf(main("  var s: string? = null\n  if s == null or s.length > 1 {\n  }"))).toEqual([])
    expect(codesOf(main("  var s: string? = null\n  if not (s == null) {\n    output(s.length)\n  }"))).toEqual([])
  })

  it("if x == null の else の中では T として使える", () => {
    expect(codesOf(main('  var s: string? = null\n  if s == null {\n  } else {\n    output(s.length)\n  }'))).toEqual([])
  })

  it("範囲の外・早期 return の後・else if では絞り込まれない", () => {
    expect(codesOf(main("  var s: string? = null\n  if s != null {\n  }\n  output(s.length)"))).toEqual(["K0330"])
    expect(codesOf(main("  var s: string? = null\n  if s == null {\n    output(1)\n  }\n  output(s.length)"))).toEqual(["K0330"])
    expect(codesOf(main("  var s: string? = null\n  if s == null {\n  } else if true {\n    output(s.length)\n  }"))).toEqual(["K0330"])
  })

  it("範囲の中で代入すると、その後は T? に戻る", () => {
    const body = "  var s: string? = null\n  if s != null {\n    output(s.length)\n    s = null\n    output(s.length)\n  }"
    expect(codesOf(main(body))).toEqual(["K0330"])
  })

  it("ループの中で代入されるなら、ループの本体では絞り込まない", () => {
    const body = "  var s: string? = null\n  if s != null {\n    for i in 0..2 {\n      output(s.length)\n      s = null\n    }\n  }"
    expect(codesOf(main(body))).toEqual(["K0330"])
  })

  it("引数も絞り込める。フィールドとトップレベルの変数は絞り込まない", () => {
    expect(codesOf("function f = (s: string?) -> int {\n  if s != null {\n    return s.length\n  }\n  return 0\n}\n" + main(""))).toEqual([])
    expect(
      codesOf("class A = {\n  fields = {\n    public s: string? = null\n  }\n  public method f = () {\n    if self.s != null {\n      output(self.s.length)\n    }\n  }\n}\n" + main("")),
    ).toEqual(["K0330"])
    expect(codesOf('var g: string? = null\n' + main("  if g != null {\n    output(g.length)\n  }"))).toEqual(["K0330"])
  })

  it("絞り込んだ変数は、T が必要な場所に渡せる", () => {
    expect(codesOf(main("  var n: int? = 3\n  if n != null {\n    var m: int = n + 1\n    output(m)\n  }"))).toEqual([])
  })
})
