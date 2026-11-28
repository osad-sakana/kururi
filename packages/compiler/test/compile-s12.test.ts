import { describe, expect, it } from "vitest"
import { compile } from "../src"

const main = (body: string): string => `function main = () {\n${body}\n}\n`
const codesOf = (source: string): string[] => compile(source).diagnostics.map((d) => d.code)
const pyOf = (source: string): string => {
  const { python, diagnostics } = compile(source)
  expect(diagnostics).toEqual([])
  return python
}

const node = (method: string): string =>
  `class Node = {\n  fields = {\n    public next: Node? = null\n    public value: int = 0\n  }\n  public method run = () {\n  }\n  public method show = () {\n${method}\n  }\n}\n` + main("")

describe("compile (S12): フィールドの絞り込み", () => {
  it("if self.next != null の中では、self.next を使える", () => {
    expect(codesOf(node("    if self.next != null {\n      print(self.next.value)\n    }"))).toEqual([])
  })

  it("a.b のように、変数からたどったフィールドも絞り込める", () => {
    const source = node("").replace("function main = () {\n}", "function main = () {\n  var n: Node = new Node()\n  if n.next != null {\n    print(n.next.value)\n  }\n}")
    expect(codesOf(source)).toEqual([])
  })

  it("and の右側でも使える", () => {
    expect(codesOf(node("    if self.next != null and self.next.value > 0 {\n      print(1)\n    }"))).toEqual([])
  })

  it("そのフィールドに代入すると、絞り込みは外れる", () => {
    expect(codesOf(node("    if self.next != null {\n      self.next = null\n      print(self.next.value)\n    }"))).toEqual(["K0330"])
  })

  it("メソッドを呼ぶと、フィールドが変わったかもしれないので外れる", () => {
    expect(codesOf(node("    if self.next != null {\n      self.run()\n      print(self.next.value)\n    }"))).toEqual(["K0330"])
  })

  it("print や push のような組み込みの呼び出しでは外れない", () => {
    expect(codesOf(node("    if self.next != null {\n      print(1)\n      print(self.next.value)\n    }"))).toEqual([])
  })

  it("絞り込んでいるフィールドに null を代入するのは、型が T? なので書ける", () => {
    expect(codesOf(node("    if self.next != null {\n      self.next = null\n    }"))).toEqual([])
  })
})

describe("compile (S12): 添字は 0 以上だけ（負の数は実行時に止める）", () => {
  it("for の変数・リテラル・length を使った添字は、検査なしの素直な添字になる", () => {
    const python = pyOf(main("  var xs: int[] = [1, 2]\n  for i xs.length times {\n    print(xs[i])\n  }\n  print(xs[0])\n  print(xs[xs.length])"))
    expect(python).toContain("xs[i]")
    expect(python).toContain("xs[0]")
    expect(python).not.toContain("__kururi_index")
  })

  it("負になるかもしれない添字は、検査の関数を通す", () => {
    const python = pyOf(main("  var xs: int[] = [1, 2]\n  var n: int = 1\n  print(xs[n - 3])"))
    expect(python).toContain("xs[__kururi_index(n - 3)]")
    expect(python).toContain("def __kururi_index(i):")
  })

  it("代入先の添字と remove_at の位置も検査する", () => {
    const python = pyOf(main("  var xs: int[] = [1, 2]\n  var n: int = 1\n  xs[n] = 3\n  xs.remove_at(n)"))
    expect(python).toContain("xs[__kururi_index(n)] = 3")
    expect(python).toContain("xs.pop(__kururi_index(n))")
  })

  it("負のリテラルは、これまでどおりコンパイルエラー", () => {
    expect(codesOf(main("  var xs: int[] = [1]\n  print(xs[-1])"))).toEqual(["K0315"])
  })
})

describe("compile (S12): main は特別な関数", () => {
  it("引数を付けられない。-> を付けるとエラー", () => {
    expect(codesOf("function main = (a: int) {\n}\n")).toEqual(["K0207"])
    expect(codesOf("function main = () -> int {\n  return 1\n}\n")).toEqual(["K0207"])
    expect(codesOf("function main = () -> null {\n}\n")).toEqual(["K0207"])
  })
})

describe("compile (S12): 戻り値がない関数は null を返す", () => {
  it("return だけ、または return なしで null を返す。値を返すとエラー", () => {
    expect(codesOf("function f = () {\n  return\n}\n" + main(""))).toEqual([])
    expect(codesOf("function f = () {\n  return 1\n}\n" + main(""))).toEqual(["K0321"])
    expect(codesOf("function f = () -> null {\n  return null\n}\n" + main(""))).toEqual([])
  })

  it("T? を返す関数の return 抜けは、null が返るだけでもエラーにする", () => {
    expect(codesOf("function f = () -> string? {\n}\n" + main(""))).toEqual(["K0322"])
  })

  it("null を返す関数の値は、null を入れられる場所には入る（警告は lint）", () => {
    expect(codesOf(main('  var x: string? = print("a")'))).toEqual([])
  })
})
