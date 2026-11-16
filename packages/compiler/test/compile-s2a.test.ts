import { describe, expect, it } from "vitest"
import { compile } from "../src"

const main = (body: string): string => `function main = () {\n${body}\n}\n`
const codesOf = (source: string): string[] => compile(source).diagnostics.map((d) => d.code)
const pyBody = (body: string): string => {
  const { python, diagnostics } = compile(main(body))
  expect(diagnostics).toEqual([])
  return python
}

describe("compile (S2a): 生成", () => {
  it("if / else if / else", () => {
    const py = pyBody("  var a: int = 1\n  if a < 0 {\n    output(\"n\")\n  } else if a == 0 {\n    output(\"z\")\n  } else {\n    output(\"p\")\n  }")
    expect(py).toContain('    if a < 0:\n        print("n")\n    elif a == 0:\n        print("z")\n    else:\n        print("p")')
  })

  it("else が次の行から始まっても同じ if として扱う", () => {
    expect(codesOf(main("  if true {\n  }\n  else {\n  }"))).toEqual([])
  })

  it("while と break / continue", () => {
    const py = pyBody("  var i: int = 0\n  while i < 10 {\n    i += 1\n    if i == 3 { continue }\n    if i == 5 { break }\n  }")
    expect(py).toContain("    while i < 10:\n        i += 1\n        if i == 3:\n            continue\n        if i == 5:\n            break")
  })

  it("repeat は range になる", () => {
    expect(pyBody("  for i in 0..3 + 1 {\n    output(i)\n  }")).toContain("    for i in range(3 + 1):\n        print(i)")
  })

  it("空のブロックは pass", () => {
    expect(pyBody("  if true {\n  }")).toContain("    if True:\n        pass")
  })

  it("代入と複合代入", () => {
    const py = pyBody("  var a: int = 1\n  a = 2\n  a += 1\n  a -= 1\n  a *= 2\n  a %= 3\n  var f: float = 1.5\n  f /= 2\n  f = a")
    expect(py).toContain("    a = 2\n    a += 1\n    a -= 1\n    a *= 2\n    a %= 3")
    expect(py).toContain("    f /= 2\n    f = float(a)")
  })

  it("関数の中で書き換えるトップレベルの var に global を付ける", () => {
    const { python } = compile(`var count: int = 0\nvar other: int = 1\nfunction main = () {\n  count += 1\n  output(other)\n}\n`)
    expect(python).toContain("def main():\n    global count\n    count += 1")
    expect(python).not.toContain("global count, other")
  })

  it("兄弟のブロックで同じ型の同名変数を宣言できる", () => {
    expect(codesOf(main("  if true {\n    var a: int = 1\n  } else {\n    var a: int = 2\n  }"))).toEqual([])
  })

  it("行の対応表に if の中の文も入る", () => {
    const { lineMap } = compile(main("  if true {\n    output(\"a\")\n  }"))
    expect(lineMap.map((m) => m.kururiLine)).toEqual([1, 2, 3])
  })
})

describe("compile (S2a): 診断", () => {
  it("条件が boolean でないと K0306", () => {
    expect(codesOf(main("  if 1 {\n  }"))).toEqual(["K0306"])
    expect(codesOf(main("  while \"a\" {\n  }"))).toEqual(["K0306"])
    expect(codesOf(main("  for i in 0..1.5 {\n  }"))).toEqual(["K0306"])
    expect(codesOf(main("  for i in 0..true {\n  }"))).toEqual(["K0306"])
  })

  it("条件に = を書くと K0111", () => {
    expect(codesOf(main("  var a: int = 1\n  if a = 1 {\n  }"))).toEqual(["K0111"])
  })

  it("代入の左辺が変数でなければ K0112", () => {
    expect(codesOf(main("  1 = 2"))).toEqual(["K0112"])
    expect(codesOf(main("  var a: int = 1\n  a + 1 = 2"))).toEqual(["K0112"])
  })

  it("const への再代入は K0212、repeat の変数への代入は K0213", () => {
    expect(codesOf(main("  const a: int = 1\n  a = 2"))).toEqual(["K0212"])
    expect(codesOf(`const a: int = 1\n${main("  a += 2")}`)).toEqual(["K0212"])
    expect(codesOf(main("  for i in 0..3 {\n    i = 1\n  }"))).toEqual(["K0213"])
  })

  it("代入の型が合わなければ K0301 / K0302 / K0303", () => {
    expect(codesOf(main('  var a: int = 1\n  a = "x"'))).toEqual(["K0301"])
    expect(codesOf(main("  var a: int = 1\n  a /= 2"))).toEqual(["K0301"])
    expect(codesOf(main('  var s: string = "a"\n  s += 1'))).toEqual(["K0302"])
    expect(codesOf(main('  var s: string = "a"\n  s -= "b"'))).toEqual(["K0303"])
  })

  it("break / continue がループの外にあると K0210", () => {
    expect(codesOf(main("  break"))).toEqual(["K0210"])
    expect(codesOf(main("  if true {\n    continue\n  }"))).toEqual(["K0210"])
  })

  it("ブロックの外で変数を使うと K0201", () => {
    expect(codesOf(main("  if true {\n    var a: int = 1\n  }\n  output(a)"))).toEqual(["K0201"])
    expect(codesOf(main("  for i in 0..2 {\n  }\n  output(i)"))).toEqual(["K0201"])
  })

  it("入れ子での再宣言（シャドーイング）は K0202", () => {
    expect(codesOf(main("  var a: int = 1\n  if true {\n    var a: int = 2\n  }"))).toEqual(["K0202"])
    expect(codesOf(main("  for i in 0..2 {\n    for i in 0..2 {\n    }\n  }"))).toEqual(["K0202"])
  })

  it("兄弟のブロックで型が違う同名変数は K0211", () => {
    expect(codesOf(main('  if true {\n    var a: int = 1\n  } else {\n    var a: string = "x"\n  }'))).toEqual(["K0211"])
  })

  it("else が単独で現れると K0101", () => {
    expect(codesOf(main("  else {\n  }"))).toEqual(["K0101"])
  })
})
