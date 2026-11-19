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
    expect(warningsOf(main("  for i in 0..3 {\n    var x: int = i\n  }"))).toEqual(["K0601"])
    expect(warningsOf(main("  for i in 0..3 {\n    print(\"a\")\n  }"))).toEqual([])
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
