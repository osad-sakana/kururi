import { describe, expect, it } from "vitest"
import { compile } from "../src"

const codesOf = (source: string): string[] => compile(source).diagnostics.map((d) => d.code)
const main = (body: string): string => `function main = () {\n${body}\n}\n`
const pythonOf = (body: string): string => compile(main(body)).python

describe("compile (S11): 文字列と配列のメソッド", () => {
  it("string のメソッドが Python の書き方になる", () => {
    const python = pythonOf(
      [
        '  var s: string = " Hello "',
        "  var a: string = s.upper()",
        "  var b: string = s.lower()",
        "  var c: string = s.trim()",
        '  var d: boolean = s.contains("H")',
        '  var e: boolean = s.starts_with("H")',
        '  var f: boolean = s.ends_with("o")',
        '  var g: int = s.index_of("l")',
        '  var h: string = s.replace("l", "L")',
        '  var parts: string[] = s.split(" ")',
      ].join("\n"),
    )
    expect(python).toContain("a = s.upper()")
    expect(python).toContain("b = s.lower()")
    expect(python).toContain("c = s.strip()")
    expect(python).toContain('d = ("H" in s)')
    expect(python).toContain('e = s.startswith("H")')
    expect(python).toContain('f = s.endswith("o")')
    expect(python).toContain('g = s.find("l")')
    expect(python).toContain('h = s.replace("l", "L")')
    expect(python).toContain('parts = s.split(" ")')
  })

  it("メソッドはつなげて呼べる", () => {
    expect(pythonOf('  var s: string = "a"\n  var t: string = s.trim().upper()')).toContain("t = s.strip().upper()")
  })

  it("配列の contains と join", () => {
    const python = pythonOf('  var xs: int[] = [1, 2]\n  var ok: boolean = xs.contains(2)\n  var names: string[] = ["a", "b"]\n  var text: string = names.join(", ")')
    expect(python).toContain("ok = (2 in xs)")
    expect(python).toContain('text = ", ".join(names)')
  })

  it("引数の型が違えば K0301、数が違えば K0305", () => {
    expect(codesOf(main('  var s: string = "a"\n  var b: boolean = s.contains(1)'))).toEqual(["K0301"])
    expect(codesOf(main('  var s: string = "a"\n  var t: string = s.upper(1)'))).toEqual(["K0305"])
    expect(codesOf(main('  var s: string = "a"\n  var t: string = s.replace("a")'))).toEqual(["K0305"])
    expect(codesOf(main("  var xs: int[] = [1]\n  var ok: boolean = xs.contains(\"a\")"))).toEqual(["K0301"])
  })

  it("戻り値の型で検査される", () => {
    expect(codesOf(main('  var s: string = "a"\n  var n: int = s.upper()'))).toEqual(["K0301"])
  })

  it("ないメソッドは K0317。join は string[] だけ", () => {
    expect(codesOf(main('  var s: string = "a"\n  var t: string = s.shout()'))).toEqual(["K0317"])
    expect(codesOf(main("  var xs: int[] = [1]\n  var t: string = xs.join(\",\")"))).toEqual(["K0317"])
    expect(codesOf(main("  var n: int = 1\n  var t: string = n.upper()"))).toEqual(["K0317"])
  })
})
