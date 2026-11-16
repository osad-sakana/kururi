import { describe, expect, it } from "vitest"
import { compile } from "../src"
import { namingProblem, toSnakeCase, toUpperCamelCase, toUpperSnakeCase } from "../src/syntax/naming"

const codesOf = (source: string): string[] => compile(source).diagnostics.map((d) => d.code)
const main = (body: string): string => `function main = () {\n${body}\n}\n`

describe("名前の変換", () => {
  it("単語に分けて、スネークケース・大文字・キャメルケースにする", () => {
    expect(toSnakeCase("someVariable")).toBe("some_variable")
    expect(toSnakeCase("SomeVariable")).toBe("some_variable")
    expect(toSnakeCase("HTTPServer")).toBe("http_server")
    expect(toSnakeCase("_hidden")).toBe("_hidden")
    expect(toUpperSnakeCase("taxRate")).toBe("TAX_RATE")
    expect(toUpperCamelCase("shopping_cart")).toBe("ShoppingCart")
    expect(toUpperCamelCase("dog")).toBe("Dog")
  })
})

describe("namingProblem", () => {
  it("決まりに合う名前は問題なし", () => {
    expect(namingProblem("total_price", "snake")).toBeUndefined()
    expect(namingProblem("i", "snake")).toBeUndefined()
    expect(namingProblem("x2", "snake")).toBeUndefined()
    expect(namingProblem("TAX_RATE", "constant")).toBeUndefined()
    expect(namingProblem("MAX", "constant")).toBeUndefined()
    expect(namingProblem("ShoppingCart", "class")).toBeUndefined()
    expect(namingProblem("HTTPServer", "class")).toBeUndefined()
  })

  it("英字を含まない名前（日本語など）は対象外", () => {
    expect(namingProblem("合計", "snake")).toBeUndefined()
    expect(namingProblem("税率", "constant")).toBeUndefined()
    expect(namingProblem("犬", "class")).toBeUndefined()
  })

  it("合わない名前は直し方を返す", () => {
    expect(namingProblem("someVariable", "snake")?.suggestion).toBe("some_variable")
    expect(namingProblem("rate", "constant")?.suggestion).toBe("RATE")
    expect(namingProblem("shopping_cart", "class")?.suggestion).toBe("ShoppingCart")
    expect(namingProblem("dog", "class")?.suggestion).toBe("Dog")
  })
})

describe("compile: 名前の書き方（K0506）", () => {
  it("変数・関数・引数・ループ変数・フィールド・メソッドはスネークケース", () => {
    expect(codesOf(main("  var someValue: int = 1"))).toEqual(["K0506"])
    expect(codesOf("function addAll = (aB: int) {\n}\n" + main(""))).toEqual(["K0506", "K0506"])
    expect(codesOf(main("  for loopIndex in 0..3 {\n  }"))).toEqual(["K0506"])
    expect(codesOf("class A = {\n  fields = {\n    someField: int = 1\n  }\n  method doIt = () {\n  }\n}\n" + main(""))).toEqual(["K0506", "K0506"])
  })

  it("const は大文字のスネークケース", () => {
    expect(codesOf("const tax_rate: float = 0.1\n" + main(""))).toEqual(["K0506"])
    expect(codesOf("const TAX_RATE: float = 0.1\n" + main(""))).toEqual([])
    expect(codesOf(main("  const limit: int = 3"))).toEqual(["K0506"])
  })

  it("クラスはアッパーキャメルケース", () => {
    expect(codesOf("class shopping_cart = {\n}\n" + main(""))).toEqual(["K0506"])
    expect(codesOf("class ShoppingCart = {\n}\n" + main(""))).toEqual([])
  })

  it("案内を出しても、続きの構文は読み進める（構文の診断があるあいだは型検査に進まない）", () => {
    expect(codesOf(main('  var someValue: int = 1\n  var other: int = ')).includes("K0506")).toBe(true)
    expect(codesOf(main('  var someValue: int = "x"'))).toEqual(["K0506"])
  })

  it("直し方を案内する", () => {
    const [d] = compile(main("  var someValue: int = 1")).diagnostics
    expect(d?.hint).toContain("some_value")
    expect(d?.hint).toContain("スネークケース")
  })

  it("日本語の名前はそのまま使える", () => {
    expect(codesOf(main("  var 合計: int = 1"))).toEqual([])
  })
})
