import { describe, expect, it } from "vitest"
import { iconCss } from "../../src/playground/icon-css"
import { ICON_KINDS, classifyLines } from "../../src/playground/line-icons"

const kinds = (source: string) => classifyLines(source).map((icon) => `${icon.line}:${icon.kind}`)

describe("classifyLines", () => {
  it("宣言の行を種類ごとに見分ける", () => {
    const source = [
      "const LIMIT: int = 5",
      "function add = (a: int) -> int {",
      "class Dog = {",
      "    fields = {",
      "        private name: string",
      "    }",
      "    constructor = (name: string) {",
      "    }",
      "    public method bark = () {",
      "        var n: int = 1",
      "    }",
      "}",
    ].join("\n")
    expect(kinds(source)).toEqual(["1:const", "2:function", "3:class", "4:fields", "7:constructor", "9:method", "10:var"])
  })

  it("制御構文の行を見分ける", () => {
    const source = ["if a {", "} else if b {", "} else {", "}", "for i in 0..3 {", "while x {", "return 1"].join("\n")
    expect(kinds(source)).toEqual(["1:if", "2:else", "3:else", "5:for", "6:while", "7:return"])
  })

  it("コメント・空行・ふつうの式・フィールド宣言には付けない", () => {
    const source = ["// var x", "", "    print(1)", "x = 1", "private name: string", "variable = 2"].join("\n")
    expect(kinds(source)).toEqual([])
  })

  it("else if と else では説明が違う", () => {
    const [elseIf, plain] = classifyLines("} else if b {\n} else {")
    expect(elseIf?.hint).toContain("else if")
    expect(plain?.hint).not.toBe(elseIf?.hint)
  })

  it("どの種類にも説明がある", () => {
    for (const kind of ICON_KINDS) {
      const [icon] = classifyLines(kind === "else" ? "else {" : `${kind === "fields" ? "fields =" : kind} x`)
      expect(icon?.hint.length).toBeGreaterThan(0)
    }
  })
})

describe("iconCss", () => {
  it("全ての種類の CSS を作る", () => {
    const css = iconCss()
    for (const kind of ICON_KINDS) expect(css).toContain(`.kururi-icon-${kind}`)
  })
})
