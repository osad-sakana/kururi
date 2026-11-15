import { describe, expect, it } from "vitest"
import { compile } from "../src"

function codesOf(source: string): string[] {
  return compile(source).diagnostics.map((d) => d.code)
}

const main = (body: string): string => `function main(): void {\n${body}\n}\n`

describe("compile (S1): 生成", () => {
  it("hello を変換する", () => {
    const { python, diagnostics } = compile(main('  output("hello")'))
    expect(diagnostics).toEqual([])
    expect(python).toBe(
      [
        "from __future__ import annotations",
        "",
        "",
        "def main() -> None:",
        '    print("hello")',
        "",
        "",
        'if __name__ == "__main__":',
        "    main()",
        "",
      ].join("\n"),
    )
  })

  it("空の main は pass になる", () => {
    expect(compile("function main(): void {\n}\n").python).toContain("    pass")
  })

  it("let と const は型注釈つきの代入になる", () => {
    const { python } = compile(main("  let a: int = 1\n  const b: float = 2\n  let c: boolean = true"))
    expect(python).toContain("    a: int = 1")
    expect(python).toContain("    b: float = 2.0")
    expect(python).toContain("    c: bool = True")
  })

  it("int を float に入れるときは float に変換する", () => {
    const { python } = compile(main("  let a: int = 1\n  let b: float = a + 1\n  let c: float = 1.5"))
    expect(python).toContain("b: float = float(a + 1)")
    expect(python).toContain("c: float = 1.5")
  })

  it("トップレベルの変数を出力する", () => {
    const { python } = compile(`const rate: float = 0.5\n${main("  output(toString(rate))")}`)
    expect(python).toContain("rate: float = 0.5\n\n\ndef main()")
    expect(python).toContain("print(str(rate))")
  })

  it("括弧と演算子の順序を保つ", () => {
    const { python } = compile(main("  let a: int = (1 + 2) * 3 - -4 % 5"))
    expect(python).toContain("a: int = (1 + 2) * 3 - -4 % 5")
  })

  it("boolean は true / false と表示する", () => {
    const { python } = compile(main("  let a: boolean = 1 < 2 and not false\n  output(a)\n  output(toString(a))"))
    expect(python).toContain('print("true" if a else "false")')
    expect(python).toContain('print(("true" if a else "false"))')
  })

  it("文字列補間は f 文字列になり、{ } は二重にする", () => {
    const { python } = compile(main('  let n: int = 1\n  let b: boolean = false\n  output(`{n} ${n + 1} ${b} "x"`)'))
    expect(python).toContain('print(f"{{n}} {n + 1} {("true" if b else "false")} \\"x\\"")')
  })

  it("式を含まない補間は普通の文字列にする", () => {
    expect(compile(main("  output(`abc`)")).python).toContain('print("abc")')
  })

  it("行の対応表を作る", () => {
    const { lineMap } = compile(main('  output("a")\n  output("b")'))
    expect(lineMap).toEqual([
      { kururiLine: 1, pythonLine: 4 },
      { kururiLine: 2, pythonLine: 5 },
      { kururiLine: 3, pythonLine: 6 },
    ])
  })
})

describe("compile (S1): 型・名前の診断", () => {
  it("型が合わない代入は K0301", () => {
    expect(codesOf(main('  let a: int = "x"'))).toEqual(["K0301"])
    expect(codesOf(main("  let a: int = 1.5"))).toEqual(["K0301"])
  })

  it("int を float に入れるのは許す", () => {
    expect(codesOf(main("  let a: float = 1"))).toEqual([])
  })

  it("文字列と数値の + は K0302", () => {
    expect(codesOf(main('  let a: int = 1\n  output("x" + a)'))).toEqual(["K0302"])
  })

  it("演算が使えない型は K0303", () => {
    expect(codesOf(main('  output("a" - "b")'))).toEqual(["K0303"])
    expect(codesOf(main("  output(1 and 2)"))).toEqual(["K0303"])
    expect(codesOf(main("  output(not 1)"))).toEqual(["K0303"])
    expect(codesOf(main('  output(1 < "a")'))).toEqual(["K0303"])
    expect(codesOf(main("  output(-true)"))).toEqual(["K0303"])
  })

  it("値のない呼び出しを値として使うと K0304", () => {
    expect(codesOf(main('  let a: int = output("x")'))).toEqual(["K0304"])
  })

  it("引数の数が違うと K0305", () => {
    expect(codesOf(main("  output()"))).toEqual(["K0305"])
    expect(codesOf(main("  output(1, 2)"))).toEqual(["K0305"])
  })

  it("意味のない式は K0307", () => {
    expect(codesOf(main("  1 + 2"))).toEqual(["K0307"])
  })

  it("関数でないものを呼ぶと K0308、関数を値にすると K0309", () => {
    expect(codesOf(main("  let a: int = 1\n  a()"))).toEqual(["K0308"])
    expect(codesOf(main("  let a: int = toString"))).toEqual(["K0309"])
  })

  it("宣言していない名前は K0201", () => {
    expect(codesOf(main("  output(x)"))).toEqual(["K0201"])
    expect(codesOf(main("  output(x)\n  let x: int = 1"))).toEqual(["K0201"])
  })

  it("同じ名前の再宣言・シャドーイングは K0202", () => {
    expect(codesOf(main("  let a: int = 1\n  let a: int = 2"))).toEqual(["K0202"])
    expect(codesOf(`let a: int = 1\n${main("  let a: int = 2")}`)).toEqual(["K0202"])
  })

  it("トップレベルの初期値で後ろの変数を使うと K0203", () => {
    expect(codesOf(`let a: int = b\nlet b: int = 1\n${main("")}`)).toEqual(["K0203"])
  })

  it("トップレベルの初期値で let の変数を使うと K0206、const は使える", () => {
    expect(codesOf(`let a: int = 1\nlet b: int = a\n${main("")}`)).toEqual(["K0206"])
    expect(codesOf(`const a: int = 1\nlet b: int = a + 1\n${main("")}`)).toEqual([])
  })

  it("main がない・形が違う・呼んだ場合", () => {
    expect(codesOf("let a: int = 1\n")).toEqual(["K0204"])
    expect(codesOf(main("  main()"))).toEqual(["K0205"])
    expect(codesOf("function main(): int {\n}\n")).toEqual(["K0207"])
    expect(codesOf("function main(x: int): void {\n}\n")).toEqual(["K0207"])
  })

  it("知らない型は K0208", () => {
    expect(codesOf(main("  let a: Foo = 1"))).toEqual(["K0208"])
  })

  it("まだ使えない機能は K0001 / K0002", () => {
    expect(codesOf(main("  class"))).toEqual(["K0001"])
  })
})

describe("compile (S1): 構文・予約語の診断", () => {
  it("1 行に 2 つの文があると K0101", () => {
    expect(codesOf(main('  output("a") output("b")'))).toEqual(["K0101"])
  })

  it("比較の連鎖は K0106", () => {
    expect(codesOf(main("  output(1 < 2 < 3)"))).toEqual(["K0106"])
  })

  it("トップレベルに文を書くと K0110", () => {
    expect(codesOf('output("a")\n')).toEqual(["K0110"])
  })

  it("予約語を名前にすると K0501 / K0502 / K0503", () => {
    expect(codesOf(main("  let class: int = 1"))).toEqual(["K0501"])
    expect(codesOf(main("  let output: int = 1"))).toEqual(["K0501"])
    expect(codesOf(main("  let lambda: int = 1"))).toEqual(["K0502"])
    expect(codesOf(main("  let print: int = 1"))).toEqual(["K0502"])
    expect(codesOf(main("  for"))).toEqual(["K0503"])
  })

  it("構文エラーが複数あれば、まとめて報告する", () => {
    expect(codesOf(main("  let a = 1\n  let b: int\n  output(")).length).toBeGreaterThanOrEqual(2)
  })

  it("診断のあるソースは python を空で返す", () => {
    expect(compile(main('  let a: int = "x"')).python).toBe("")
  })
})
