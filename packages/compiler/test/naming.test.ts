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
    expect(codesOf(main("  for loopIndex 3 times {\n  }"))).toEqual(["K0506"])
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

describe("compile: boolean の名前（K0507）", () => {
  const main = (body: string): string => `function main = () {\n${body}\n}\n`
  const codesOf = (source: string): string[] => compile(source).diagnostics.map((d) => d.code)

  it("boolean の変数・引数・フィールド・関数・メソッドは is_ か has_ で始める", () => {
    expect(codesOf(main("  var ready: boolean = true\n  print(ready)"))).toEqual(["K0507"])
    expect(codesOf(main("  var is_ready: boolean = true\n  var has_items: boolean = false\n  print(is_ready and has_items)"))).toEqual([])
    expect(codesOf("function check = (flag: boolean) {\n}\n" + main(""))).toEqual(["K0507"])
    expect(codesOf("function even = (n: int) -> boolean {\n  return n % 2 == 0\n}\n" + main(""))).toEqual(["K0507"])
    expect(codesOf("class A = {\n  fields = {\n    public open: boolean = true\n  }\n  public method done = () -> boolean {\n    return true\n  }\n}\n" + main(""))).toEqual(["K0507", "K0507"])
  })

  it("const は IS_ か HAS_ で始める", () => {
    expect(codesOf("const DEBUG: boolean = true\n" + main(""))).toEqual(["K0507"])
    expect(codesOf("const IS_DEBUG: boolean = true\n" + main(""))).toEqual([])
  })

  it("boolean 以外・boolean の配列・boolean? は対象外。日本語の名前も対象外", () => {
    expect(codesOf(main("  var ready: int = 1\n  var flags: boolean[] = [true]\n  var maybe: boolean? = null\n  var 準備: boolean = true\n  print(ready)\n  print(flags)\n  print(maybe)\n  print(準備)"))).toEqual([])
  })

  it("1 クリックで is_ を付けて直せる（名前の使われている所もまとめて直す）", () => {
    const [diagnostic] = compile(main("  var ready: boolean = true\n  print(ready)")).diagnostics
    expect(diagnostic?.fix).toEqual({ title: "「is_ready」に直す", text: "is_ready", renameAll: true })
  })

  it("名前の書き方（スネークケース）の違反があるときは、そちらだけを出す", () => {
    expect(codesOf(main("  var isReady: boolean = true\n  print(isReady)"))).toEqual(["K0506"])
  })
})
