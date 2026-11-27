import { describe, expect, it } from "vitest"
import { codeHash, decodeSource, encodeSource, sourceFromHash } from "../../src/playground/share"

const source = 'function main = () {\n    print("こんにちは ${1} 😀")\n}\n'

describe("share", () => {
  it("日本語や絵文字を含むソースを往復できる", () => {
    expect(decodeSource(encodeSource(source))).toBe(source)
  })

  it("URL に載せても安全な文字だけになる", () => {
    expect(encodeSource(source)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it("ハッシュから取り出せる。形が違えば null", () => {
    expect(sourceFromHash(codeHash(source))).toBe(source)
    expect(sourceFromHash("#other")).toBeNull()
    expect(decodeSource("!!!")).toBeNull()
  })
})
