import { describe, expect, it } from "vitest"
import { compile } from "../src"

const codesOf = (source: string): string[] => compile(source).diagnostics.map((d) => d.code)
const withMain = (defs: string, body = ""): string => `${defs}\nfunction main = () {\n${body}\n}\n`

describe("compile (S3): 生成", () => {
  it("引数と戻り値のある関数", () => {
    const { python, diagnostics } = compile(
      withMain(
        "function add = (a: int, b: int) -> int {\n  return a + b\n}\nfunction greet = (names: string[], flag: boolean) {\n  return\n}",
        "  output(add(1, 2))",
      ),
    )
    expect(diagnostics).toEqual([])
    expect(python).toContain("def add(a, b):\n    return a + b")
    expect(python).toContain("def greet(names, flag):\n    return")
    expect(python).toContain("print(add(1, 2))")
  })

  it("int を float の引数・戻り値・代入に渡すと float に変換する", () => {
    const { python } = compile(
      withMain(
        "function half = (x: float) -> float {\n  return 1\n}",
        "  var n: int = 3\n  output(half(2))\n  output(half(n))\n  var xs: float[] = [1, 2]\n  xs.push(n)",
      ),
    )
    expect(python).toContain("return 1.0")
    expect(python).toContain("print(half(2.0))")
    expect(python).toContain("print(half(float(n)))")
    expect(python).toContain("xs = [1.0, 2.0]")
    expect(python).toContain("xs.append(float(n))")
  })

  it("関数は定義の順序を問わず呼べる（相互再帰もよい）", () => {
    expect(
      codesOf(
        withMain(
          "function even = (n: int) -> boolean {\n  if n == 0 { return true }\n  return odd(n - 1)\n}\nfunction odd = (n: int) -> boolean {\n  if n == 0 { return false }\n  return even(n - 1)\n}",
          "  output(even(4))",
        ),
      ),
    ).toEqual([])
  })

  it("関数ごとに必要な global だけ付ける", () => {
    const { python } = compile(
      withMain("var c: int = 0\nvar d: int = 0\nfunction bump = () {\n  c += 1\n}\nfunction read = () -> int {\n  return d\n}", "  bump()"),
    )
    expect(python).toContain("def bump():\n    global c\n    c += 1")
    expect(python).toContain("def read():\n    return d")
  })

  it("全ての分岐が return すれば return 抜けではない", () => {
    expect(
      codesOf(withMain("function sign = (n: int) -> int {\n  if n < 0 {\n    return -1\n  } else if n == 0 {\n    return 0\n  } else {\n    return 1\n  }\n}")),
    ).toEqual([])
    expect(codesOf(withMain("function loop = () -> int {\n  while true {\n    return 1\n  }\n}"))).toEqual([])
  })
})

describe("compile (S3): 診断", () => {
  it("引数の数と型が違うと K0305 / K0301", () => {
    const f = "function f = (a: int, b: string) {\n}"
    expect(codesOf(withMain(f, "  f(1)"))).toEqual(["K0305"])
    expect(codesOf(withMain(f, '  f(1, "x", 3)'))).toEqual(["K0305"])
    expect(codesOf(withMain(f, "  f(1, 2)"))).toEqual(["K0301"])
    expect(codesOf(withMain(f, '  f(1.5, "x")'))).toEqual(["K0301"])
  })

  it("戻り値の型が違うと K0301、値の有無が違うと K0320 / K0321", () => {
    expect(codesOf(withMain('function f = () -> int {\n  return "x"\n}'))).toEqual(["K0301"])
    expect(codesOf(withMain("function f = () -> int {\n  return\n}"))).toEqual(["K0320"])
    expect(codesOf(withMain("function f = () {\n  return 1\n}"))).toEqual(["K0321"])
  })

  it("return 抜けは K0322", () => {
    expect(codesOf(withMain("function f = (n: int) -> int {\n  if n > 0 {\n    return 1\n  }\n}"))).toEqual(["K0322"])
    expect(codesOf(withMain("function f = () -> int {\n}"))).toEqual(["K0322"])
    expect(codesOf(withMain("function f = () -> int {\n  while true {\n    break\n  }\n}"))).toEqual(["K0322"])
  })

  it("関数の戻り値は値として使える、void は使えない", () => {
    expect(codesOf(withMain("function f = () {\n}", "  var a: int = f()"))).toEqual(["K0304"])
  })

  it("引数・ローカル・トップレベルと同じ名前は K0202", () => {
    expect(codesOf(withMain("function f = (a: int) {\n  var a: int = 1\n}"))).toEqual(["K0202"])
    expect(codesOf(withMain("function f = (a: int, a: int) {\n}"))).toEqual(["K0202"])
    expect(codesOf(withMain("var a: int = 1\nfunction f = (a: int) {\n}"))).toEqual(["K0202"])
    expect(codesOf(withMain("function f = () {\n}\nfunction f = () {\n}"))).toEqual(["K0202"])
  })

  it("型の書き方の誤りは K0208", () => {
    expect(codesOf(withMain("function f = (a: Foo) {\n}"))).toEqual(["K0208"])
    expect(codesOf(withMain("function f = (a: void) {\n}"))).toEqual(["K0208"])
    expect(codesOf(withMain("function f = () -> Foo {\n}"))).toEqual(["K0208"])
  })

  it("トップレベルの初期値で自作の関数は呼べない（K0323）", () => {
    expect(codesOf(withMain("function f = () -> int {\n  return 1\n}\nconst a: int = f()"))).toEqual(["K0323"])
  })

  it("main は引数なし・void、呼べない", () => {
    expect(codesOf("function main = (x: int) {\n}\n")).toEqual(["K0207"])
    expect(codesOf(withMain("function f = () {\n  main()\n}"))).toEqual(["K0205"])
  })
})
