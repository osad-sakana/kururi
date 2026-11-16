import { strFromU8, unzipSync, unzlibSync } from "fflate"
import { describe, expect, it } from "vitest"
import { DEFAULT_BASE_URL, buildNarapyArchive, buildProjectUrl, projectFiles, toBase64Url } from "../src"

function decodeFragment(url: string): Record<string, string> {
  const value = url.split("#project=")[1] ?? ""
  const bytes = Uint8Array.from(Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64"))
  const entries = unzipSync(unzlibSync(bytes))
  return Object.fromEntries(Object.entries(entries).map(([name, data]) => [name, strFromU8(data)]))
}

describe("projectFiles", () => {
  it("main.py と参照用の main.kururi.txt を作る", () => {
    expect(projectFiles({ python: "print(1)\n", kururi: "// k\n" })).toEqual({
      "main.py": "print(1)\n",
      "main.kururi.txt": "// k\n",
    })
  })
})

describe("buildNarapyArchive", () => {
  it("narapy.json と files/<パス> を持つ zip になる", () => {
    const entries = unzipSync(buildNarapyArchive({ "main.py": "x", "main.kururi.txt": "y" }, "main.py"))
    expect(Object.keys(entries).sort()).toEqual(["files/main.kururi.txt", "files/main.py", "narapy.json"])
    expect(JSON.parse(strFromU8(entries["narapy.json"] ?? new Uint8Array()))).toEqual({
      version: 2,
      activeFile: "main.py",
      directories: [],
    })
    expect(strFromU8(entries["files/main.py"] ?? new Uint8Array())).toBe("x")
  })
})

describe("buildProjectUrl", () => {
  const files = { "main.py": 'print("こんにちは")\n', "main.kururi.txt": "function main = () {}\n" }

  it("#project= に zlib + base64url（パディングなし）で載せる", () => {
    const url = buildProjectUrl(files)
    expect(url.startsWith(`${DEFAULT_BASE_URL}#project=`)).toBe(true)
    const value = url.split("#project=")[1] ?? ""
    expect(value).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeFragment(url)["files/main.py"]).toBe(files["main.py"])
    expect(decodeFragment(url)["files/main.kururi.txt"]).toBe(files["main.kururi.txt"])
  })

  it("基準の URL を変えられる（末尾の / の有無は問わない）", () => {
    expect(buildProjectUrl(files, { baseUrl: "http://localhost:5173" }).startsWith("http://localhost:5173/#project=")).toBe(true)
    expect(buildProjectUrl(files, { baseUrl: "http://localhost:5173/" }).startsWith("http://localhost:5173/#project=")).toBe(true)
  })

  it("起動するファイルを指定できる", () => {
    const url = buildProjectUrl(files, { activeFile: "main.kururi.txt" })
    expect(JSON.parse(decodeFragment(url)["narapy.json"] ?? "{}").activeFile).toBe("main.kururi.txt")
  })

  it("圧縮後の URL が長すぎるときは分かりやすいエラーにする", () => {
    const big = { "main.py": Array.from({ length: 20000 }, (_, i) => `print(${i * 7919})`).join("\n") }
    expect(() => buildProjectUrl(big)).toThrow(/長すぎ/)
  })
})

describe("toBase64Url", () => {
  it("+ / = を使わない", () => {
    expect(toBase64Url(Uint8Array.from([251, 255, 254]))).toBe("-__-")
    expect(toBase64Url(Uint8Array.from([1]))).toBe("AQ")
  })
})
