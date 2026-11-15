import { describe, expect, it } from "vitest"
import { compile } from "../src"

const main = (body: string): string => `function main(): void {\n${body}\n}\n`
const codesOf = (source: string): string[] => compile(source).diagnostics.map((d) => d.code)
const pyOf = (body: string): string => {
  const { python, diagnostics } = compile(main(body))
  expect(diagnostics).toEqual([])
  return python
}

describe("compile (S2b): 生成", () => {
  it("配列の宣言・添字・length・push・removeAt", () => {
    const py = pyOf(
      '  let fruits: string[] = ["apple", "banana"]\n  fruits[1] = "melon"\n  fruits.push("grape")\n  fruits.removeAt(0)\n  let n: int = fruits.length\n  output(fruits[0])\n  fruits[0] += "!"',
    )
    expect(py).toContain('fruits: list[str] = ["apple", "banana"]')
    expect(py).toContain('fruits[1] = "melon"')
    expect(py).toContain('fruits.append("grape")')
    expect(py).toContain("fruits.pop(0)")
    expect(py).toContain("n: int = len(fruits)")
    expect(py).toContain("print(fruits[0])")
    expect(py).toContain('fruits[0] += "!"')
  })

  it("入れ子の配列と空の配列", () => {
    const py = pyOf("  let grid: int[][] = [[1, 2], [3]]\n  let e: string[] = []\n  grid[0][1] = 5\n  output(grid[1][0])")
    expect(py).toContain("grid: list[list[int]] = [[1, 2], [3]]")
    expect(py).toContain("e: list[str] = []")
    expect(py).toContain("grid[0][1] = 5")
  })

  it("float の配列には int を float にして入れる", () => {
    const py = pyOf("  let a: float[] = [1, 2.5]\n  a.push(3)\n  a[0] = 4\n  let n: int = 2\n  a.push(n)")
    expect(py).toContain("a: list[float] = [1.0, 2.5]")
    expect(py).toContain("a.append(3.0)")
    expect(py).toContain("a[0] = 4.0")
    expect(py).toContain("a.append(float(n))")
  })

  it("foreach は for になり、文字列の長さと添字も使える", () => {
    const py = pyOf('  let xs: int[] = [1, 2]\n  foreach x in xs {\n    output(x)\n  }\n  let s: string = "abc"\n  output(s.length)\n  output(s[1])')
    expect(py).toContain("    for x in xs:\n        print(x)")
    expect(py).toContain("print(len(s))")
    expect(py).toContain("print(s[1])")
  })

  it("配列の要素は const の配列でも書き換えられる", () => {
    expect(codesOf(main("  const a: int[] = [1]\n  a[0] = 2\n  a.push(3)"))).toEqual([])
  })

  it("トップレベルの配列", () => {
    expect(codesOf(`const names: string[] = ["a"]\n${main("  output(names[0])")}`)).toEqual([])
  })
})

describe("compile (S2b): 診断", () => {
  it("配列の型が合わなければ K0301", () => {
    expect(codesOf(main('  let a: int[] = [1, "x"]'))).toEqual(["K0301"])
    expect(codesOf(main("  let a: float[] = [1]\n  let b: int[] = a"))).toEqual(["K0301"])
    expect(codesOf(main("  let a: int[] = [1]\n  let b: float[] = a"))).toEqual(["K0301"])
    expect(codesOf(main("  let a: int = []"))).toEqual(["K0301"])
    expect(codesOf(main('  let a: int[] = [1]\n  a.push("x")'))).toEqual(["K0301"])
    expect(codesOf(main('  let a: int[] = [1]\n  a[0] = "x"'))).toEqual(["K0301"])
  })

  it("型が決まらない空の配列は K0314（型が決まる場所では書ける）", () => {
    expect(codesOf(main("  output([])"))).toEqual(["K0314"])
    expect(codesOf(main("  foreach x in [] {\n  }"))).toEqual(["K0314"])
    expect(codesOf(main("  let a: int[] = [[]]"))).toEqual(["K0301"])
    expect(codesOf(main("  let a: int[][] = [[]]"))).toEqual([])
  })

  it("添字は int、負の数のリテラルは K0315", () => {
    expect(codesOf(main('  let a: int[] = [1]\n  output(a["x"])'))).toEqual(["K0306"])
    expect(codesOf(main("  let a: int[] = [1]\n  output(a[-1])"))).toEqual(["K0315"])
    expect(codesOf(main("  let a: int[] = [1]\n  let i: int = -1\n  output(a[i])"))).toEqual([])
  })

  it("文字列は書き換えられない（K0316）", () => {
    expect(codesOf(main('  let s: string = "ab"\n  s[0] = "x"'))).toEqual(["K0316"])
  })

  it("配列を表示すると K0313", () => {
    expect(codesOf(main("  let a: int[] = [1]\n  output(a)"))).toEqual(["K0313"])
    expect(codesOf(main("  let a: int[] = [1]\n  output(`${a}`)"))).toEqual(["K0313"])
    expect(codesOf(main("  let a: int[] = [1]\n  output(toString(a))"))).toEqual(["K0313"])
  })

  it("使えないメンバ・添字は K0317 / K0319", () => {
    expect(codesOf(main("  let a: int[] = [1]\n  a.size()"))).toEqual(["K0317"])
    expect(codesOf(main("  let a: int[] = [1]\n  output(a.size)"))).toEqual(["K0317"])
    expect(codesOf(main("  let n: int = 1\n  output(n.length)"))).toEqual(["K0317"])
    expect(codesOf(main("  let n: int = 1\n  output(n[0])"))).toEqual(["K0319"])
  })

  it("push・removeAt の引数の数は K0305、length には代入できない（K0112）", () => {
    expect(codesOf(main("  let a: int[] = [1]\n  a.push()"))).toEqual(["K0305"])
    expect(codesOf(main("  let a: int[] = [1]\n  a.removeAt(1, 2)"))).toEqual(["K0305"])
    expect(codesOf(main("  let a: int[] = [1]\n  a.length = 3"))).toEqual(["K0112"])
  })

  it("foreach の対象が配列でなければ K0306、ループ変数には代入できない", () => {
    expect(codesOf(main("  foreach x in 5 {\n  }"))).toEqual(["K0306"])
    expect(codesOf(main("  let a: int[] = [1]\n  foreach x in a {\n    x = 2\n  }"))).toEqual(["K0213"])
    expect(codesOf(main("  let a: int[] = [1]\n  let x: int = 0\n  foreach x in a {\n  }"))).toEqual(["K0202"])
  })

  it("push は値を返さないので値としては使えない", () => {
    expect(codesOf(main("  let a: int[] = [1]\n  let b: int = a.push(1)"))).toEqual(["K0304"])
  })

  it("break / continue は foreach の中でも使える", () => {
    expect(codesOf(main("  let a: int[] = [1]\n  foreach x in a {\n    if x == 1 { break }\n  }"))).toEqual([])
  })

  it("型の書き方の誤り", () => {
    expect(codesOf(main("  let a: Foo[] = []"))).toEqual(["K0208"])
    expect(codesOf(main("  let a: void[] = []"))).toEqual(["K0208"])
  })
})
