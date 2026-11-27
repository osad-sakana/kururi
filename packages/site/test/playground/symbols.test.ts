import { describe, expect, it } from "vitest"
import { SAMPLE } from "../../src/playground/sample"
import { enclosingClass, generalSuggestions, helpFor, indexSymbols, memberSuggestions, signature } from "../../src/playground/symbols"

const source = [
  "const LIMIT: int = 3",
  "class Dog = {",
  "    fields = {",
  "        private name: string",
  "        public age: int = 0",
  "    }",
  "    constructor = (name: string) {",
  "        self.name = name",
  "    }",
  "    public method bark = (times: int) -> string {",
  "        return self.name",
  "    }",
  "}",
  "function add = (a: int, b: int) -> int {",
  "    return a + b",
  "}",
  "function main = () {",
  "    var dog: Dog = new Dog(\"p\")",
  "    var xs: int[] = [1]",
  "}",
].join("\n")
const symbols = indexSymbols(source)

describe("indexSymbols / signature", () => {
  it("宣言を拾って、コードの形で説明する", () => {
    expect(helpFor("LIMIT", symbols, 20)).toBe("const LIMIT: int")
    expect(helpFor("add", symbols, 20)).toBe("function add(a: int, b: int) -> int")
    expect(helpFor("bark", symbols, 20)).toBe("public method Dog.bark(times: int) -> string")
    expect(helpFor("age", symbols, 20)).toBe("public age: int")
    expect(helpFor("dog", symbols, 20)).toBe("var dog: Dog")
    expect(helpFor("Dog", symbols, 20)).toBe("class Dog")
  })

  it("キーワード・組み込み・型の説明も出す", () => {
    expect(helpFor("for", [], 1)).toContain("for")
    expect(helpFor("print", [], 1)).toContain("print")
    expect(helpFor("int", [], 1)).toContain("整数")
    expect(helpFor("nothing", [], 1)).toBeUndefined()
  })

  it("カーソルのあるクラスを見つける", () => {
    expect(enclosingClass(symbols, 11)).toBe("Dog")
    expect(enclosingClass(symbols, 1)).toBeUndefined()
  })

  it("プレイグラウンドのサンプルでも例外にならない", () => {
    expect(indexSymbols(SAMPLE).length).toBeGreaterThan(0)
    expect(symbols.map(signature).length).toBe(symbols.length)
  })
})

describe("suggestions", () => {
  it("self. ではクラスのメンバー、外からは public だけ", () => {
    expect(memberSuggestions(symbols, "self", 11).map((s) => s.label).sort()).toEqual(["age", "bark", "name"])
    expect(memberSuggestions(symbols, "dog", 18).map((s) => s.label).sort()).toEqual(["age", "bark"])
  })

  it("配列には push などが出る", () => {
    expect(memberSuggestions(symbols, "xs", 19).map((s) => s.label)).toEqual(["push", "remove_at", "contains", "length"])
  })

  it("string には文字列のメソッド、string[] には join も出る", () => {
    const text = indexSymbols('var s: string = "a"\nvar names: string[] = []')
    expect(memberSuggestions(text, "s", 3).map((x) => x.label)).toEqual(expect.arrayContaining(["upper", "split", "contains", "length"]))
    expect(memberSuggestions(text, "names", 3).map((x) => x.label)).toContain("join")
    expect(helpFor("upper", [], 1)).toContain("大文字")
  })

  it("ふつうの候補に、宣言した名前と組み込みが入る", () => {
    const labels = generalSuggestions(symbols).map((s) => s.label)
    expect(labels).toEqual(expect.arrayContaining(["var", "int", "print", "add", "Dog", "dog", "LIMIT"]))
  })
})
