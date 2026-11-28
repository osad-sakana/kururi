import { describe, expect, it } from "vitest"
import { compile } from "../src"

const main = (body: string): string => `function main = () {\n${body}\n}\n`
const warningsOf = (source: string): string[] => compile(source, { warnings: true }).diagnostics.map((d) => d.code)

describe("警告（K0601 使っていない変数 / K0602 実行されない行）", () => {
  it("警告は、頼んだときだけ返す（ふつうの compile には出ない）", () => {
    const source = main("  var unused: int = 1")
    expect(compile(source).diagnostics).toEqual([])
    expect(warningsOf(source)).toEqual(["K0601"])
  })

  it("警告だけなら、Python は作る", () => {
    const result = compile(main("  var unused: int = 1"), { warnings: true })
    expect(result.python).toContain("unused = 1")
    expect(result.diagnostics[0]?.severity).toBe("warning")
  })

  it("読んでいる変数には出ない（式・条件・引数・補間・複合代入）", () => {
    expect(warningsOf(main("  var a: int = 1\n  print(a)"))).toEqual([])
    expect(warningsOf(main("  var a: int = 1\n  if a > 0 {\n    print(1)\n  }"))).toEqual([])
    expect(warningsOf(main("  var a: int = 1\n  print(`${a}`)"))).toEqual([])
    expect(warningsOf(main("  var a: int = 1\n  a += 1"))).toEqual([])
    expect(warningsOf(main("  var xs: int[] = [1]\n  xs[0] = 2"))).toEqual([])
  })

  it("代入するだけで読まない変数には出る", () => {
    expect(warningsOf(main("  var a: int = 1\n  a = 2"))).toEqual(["K0601"])
  })

  it("入れ子のブロックの中の変数も調べる。for の変数・引数には出ない", () => {
    expect(warningsOf(main("  for i 3 times {\n    var x: int = i\n  }"))).toEqual(["K0601"])
    expect(warningsOf(main("  for i 3 times {\n    print(\"a\")\n  }"))).toEqual([])
    expect(warningsOf("function f = (a: int) {\n}\nfunction main = () {\n  f(1)\n}\n")).toEqual([])
  })

  it("クラスのメソッドと constructor の中も調べる", () => {
    const source = "class A = {\n  constructor = () {\n    var x: int = 1\n  }\n  public method m = () {\n    var y: int = 2\n  }\n}\nfunction main = () {\n}\n"
    expect(warningsOf(source)).toEqual(["K0601", "K0601"])
  })

  it("return・break・continue のあとの行は K0602", () => {
    expect(warningsOf("function f = () -> int {\n  return 1\n  print(2)\n}\nfunction main = () {\n  f()\n}\n")).toEqual(["K0602"])
    expect(warningsOf(main("  while true {\n    break\n    print(1)\n  }"))).toEqual(["K0602"])
  })

  it("エラーがあるときは、警告は出さない", () => {
    expect(warningsOf(main("  var a: int = \"x\""))).toEqual(["K0301"])
  })
})

describe("警告（K0603 値を使わない式 / K0604 値を返さない関数の値）", () => {
  it("値を使わない式を単独で書くと K0603（エラーではなく警告）", () => {
    const result = compile(main("  1 + 2"), { warnings: true })
    expect(result.diagnostics.map((d) => d.code)).toEqual(["K0603"])
    expect(result.diagnostics[0]?.severity).toBe("warning")
    expect(result.python).toContain("1 + 2")
  })

  it("関数の呼び出しを単独で書くのは警告しない", () => {
    expect(warningsOf(main('  print("a")'))).toEqual([])
    expect(warningsOf(main("  var xs: int[] = [1]\n  xs.push(2)\n  xs.remove_at(0)"))).toEqual([])
    expect(warningsOf("function f = () {\n}\nfunction main = () {\n  f()\n}\n")).toEqual([])
  })

  it("値を返さない関数の値を使うと K0604", () => {
    expect(warningsOf(main('  var x: null = print("a")\n  print(x)'))).toEqual(["K0604"])
    expect(warningsOf(main('  var x: string? = print("a")\n  print(x)'))).toEqual(["K0604"])
    expect(warningsOf(main('  print(print("a"))'))).toEqual(["K0604"])
  })

  it("値を返す関数の値を使うのは警告しない", () => {
    expect(warningsOf(main('  var n: int = to_int("1")\n  print(n)'))).toEqual([])
    expect(warningsOf("function f = () -> int {\n  return 1\n}\nfunction main = () {\n  print(f())\n}\n")).toEqual([])
  })
})
