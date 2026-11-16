import { describe, expect, it } from "vitest"
import { compile } from "../src"

const main = (body: string): string => `function main = () {\n${body}\n}\n`
const codesOf = (source: string): string[] => compile(source).diagnostics.map((d) => d.code)
const pyOf = (body: string): string => {
  const { python, diagnostics } = compile(main(body))
  expect(diagnostics).toEqual([])
  return python
}

describe("compile (S2b): 生成", () => {
  it("配列の宣言・添字・length・push・remove_at", () => {
    const py = pyOf(
      '  var fruits: string[] = ["apple", "banana"]\n  fruits[1] = "melon"\n  fruits.push("grape")\n  fruits.remove_at(0)\n  var n: int = fruits.length\n  output(fruits[0])\n  fruits[0] += "!"',
    )
    expect(py).toContain('fruits = ["apple", "banana"]')
    expect(py).toContain('fruits[1] = "melon"')
    expect(py).toContain('fruits.append("grape")')
    expect(py).toContain("fruits.pop(0)")
    expect(py).toContain("n = len(fruits)")
    expect(py).toContain("print(fruits[0])")
    expect(py).toContain('fruits[0] += "!"')
  })

  it("入れ子の配列と空の配列", () => {
    const py = pyOf("  var grid: int[][] = [[1, 2], [3]]\n  var e: string[] = []\n  grid[0][1] = 5\n  output(grid[1][0])")
    expect(py).toContain("grid = [[1, 2], [3]]")
    expect(py).toContain("e = []")
    expect(py).toContain("grid[0][1] = 5")
  })

  it("float の配列には int を float にして入れる", () => {
    const py = pyOf("  var a: float[] = [1, 2.5]\n  a.push(3)\n  a[0] = 4\n  var n: int = 2\n  a.push(n)")
    expect(py).toContain("a = [1.0, 2.5]")
    expect(py).toContain("a.append(3.0)")
    expect(py).toContain("a[0] = 4.0")
    expect(py).toContain("a.append(float(n))")
  })

  it("for は for になり、文字列の長さと添字も使える", () => {
    const py = pyOf('  var xs: int[] = [1, 2]\n  for x in xs {\n    output(x)\n  }\n  var s: string = "abc"\n  output(s.length)\n  output(s[1])')
    expect(py).toContain("    for x in xs:\n        print(x)")
    expect(py).toContain("print(len(s))")
    expect(py).toContain("print(s[1])")
  })

  it("配列の要素は const の配列でも書き換えられる", () => {
    expect(codesOf(main("  const A: int[] = [1]\n  A[0] = 2\n  A.push(3)"))).toEqual([])
  })

  it("トップレベルの配列", () => {
    expect(codesOf(`const NAMES: string[] = ["a"]\n${main("  output(NAMES[0])")}`)).toEqual([])
  })
})

describe("compile (S2b): 診断", () => {
  it("配列の型が合わなければ K0301", () => {
    expect(codesOf(main('  var a: int[] = [1, "x"]'))).toEqual(["K0301"])
    expect(codesOf(main("  var a: float[] = [1]\n  var b: int[] = a"))).toEqual(["K0301"])
    expect(codesOf(main("  var a: int[] = [1]\n  var b: float[] = a"))).toEqual(["K0301"])
    expect(codesOf(main("  var a: int = []"))).toEqual(["K0301"])
    expect(codesOf(main('  var a: int[] = [1]\n  a.push("x")'))).toEqual(["K0301"])
    expect(codesOf(main('  var a: int[] = [1]\n  a[0] = "x"'))).toEqual(["K0301"])
  })

  it("型が決まらない空の配列は K0314（型が決まる場所では書ける）", () => {
    expect(codesOf(main("  output([])"))).toEqual(["K0314"])
    expect(codesOf(main("  for x in [] {\n  }"))).toEqual(["K0314"])
    expect(codesOf(main("  var a: int[] = [[]]"))).toEqual(["K0301"])
    expect(codesOf(main("  var a: int[][] = [[]]"))).toEqual([])
  })

  it("添字は int、負の数のリテラルは K0315", () => {
    expect(codesOf(main('  var a: int[] = [1]\n  output(a["x"])'))).toEqual(["K0306"])
    expect(codesOf(main("  var a: int[] = [1]\n  output(a[-1])"))).toEqual(["K0315"])
    expect(codesOf(main("  var a: int[] = [1]\n  var i: int = -1\n  output(a[i])"))).toEqual([])
  })

  it("文字列は書き換えられない（K0316）", () => {
    expect(codesOf(main('  var s: string = "ab"\n  s[0] = "x"'))).toEqual(["K0316"])
  })

  it("配列を表示すると K0313", () => {
    expect(codesOf(main("  var a: int[] = [1]\n  output(a)"))).toEqual(["K0313"])
    expect(codesOf(main("  var a: int[] = [1]\n  output(`${a}`)"))).toEqual(["K0313"])
    expect(codesOf(main("  var a: int[] = [1]\n  output(to_string(a))"))).toEqual(["K0313"])
  })

  it("使えないメンバ・添字は K0317 / K0319", () => {
    expect(codesOf(main("  var a: int[] = [1]\n  a.size()"))).toEqual(["K0317"])
    expect(codesOf(main("  var a: int[] = [1]\n  output(a.size)"))).toEqual(["K0317"])
    expect(codesOf(main("  var n: int = 1\n  output(n.length)"))).toEqual(["K0317"])
    expect(codesOf(main("  var n: int = 1\n  output(n[0])"))).toEqual(["K0319"])
  })

  it("push・remove_at の引数の数は K0305、length には代入できない（K0112）", () => {
    expect(codesOf(main("  var a: int[] = [1]\n  a.push()"))).toEqual(["K0305"])
    expect(codesOf(main("  var a: int[] = [1]\n  a.remove_at(1, 2)"))).toEqual(["K0305"])
    expect(codesOf(main("  var a: int[] = [1]\n  a.length = 3"))).toEqual(["K0112"])
  })

  it("for の対象が配列でなければ K0306、ループ変数には代入できない", () => {
    expect(codesOf(main("  for x in 5 {\n  }"))).toEqual(["K0306"])
    expect(codesOf(main("  var a: int[] = [1]\n  for x in a {\n    x = 2\n  }"))).toEqual(["K0213"])
    expect(codesOf(main("  var a: int[] = [1]\n  var x: int = 0\n  for x in a {\n  }"))).toEqual(["K0202"])
  })

  it("push は値を返さないので値としては使えない", () => {
    expect(codesOf(main("  var a: int[] = [1]\n  var b: int = a.push(1)"))).toEqual(["K0304"])
  })

  it("break / continue は for の中でも使える", () => {
    expect(codesOf(main("  var a: int[] = [1]\n  for x in a {\n    if x == 1 { break }\n  }"))).toEqual([])
  })

  it("型の書き方の誤り", () => {
    expect(codesOf(main("  var a: Foo[] = []"))).toEqual(["K0208"])
    expect(codesOf(main("  var a: void[] = []"))).toEqual(["K0208"])
  })
})
