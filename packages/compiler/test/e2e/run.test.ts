import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { compile } from "../../src"

/** Python 3.12 を探す。KURURI_PYTHON → python3.12 → uv の順。見つからなければ E2E は飛ばす。 */
function findPython312(): string | undefined {
  const candidates: (() => string | undefined)[] = [
    () => process.env["KURURI_PYTHON"],
    () => "python3.12",
    () => execFileSync("uv", ["python", "find", "3.12"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(),
  ]
  for (const candidate of candidates) {
    try {
      const path = candidate()
      if (path === undefined || path === "") continue
      const version = execFileSync(path, ["-c", "import sys;print(sys.version_info[:2])"], { encoding: "utf8" })
      if (version.trim() === "(3, 12)") return path
    } catch {
      // 次の候補へ
    }
  }
  return undefined
}

const python = findPython312()

function run(source: string): string {
  const { python: code, diagnostics } = compile(source)
  expect(diagnostics).toEqual([])
  return execFileSync(python as string, ["-c", code], { encoding: "utf8" })
}

const main = (body: string): string => `function main(): void {\n${body}\n}\n`

describe.skipIf(python === undefined)("E2E: 生成した Python を 3.12 で実行する", () => {
  it("hello", () => {
    expect(run(main('  output("hello")'))).toBe("hello\n")
  })

  it("算術は Python と同じ結果になる", () => {
    const out = run(main("  output(7 / 2)\n  output(-7 % 3)\n  output(2 + 3 * 4)\n  output((2 + 3) * 4)\n  output(1 + 2.5)"))
    expect(out).toBe("3.5\n2\n14\n20\n3.5\n")
  })

  it("boolean は true / false と表示する", () => {
    const out = run(main("  output(1 < 2)\n  output(toString(2 < 1))\n  output(`${true and false} ${not false}`)"))
    expect(out).toBe("true\nfalse\nfalse true\n")
  })

  it("文字列補間・{ } ・エスケープ・日本語名", () => {
    const out = run(
      main('  let 名前: string = "太郎"\n  let n: int = 3\n  output(`{${名前}} は ${n * 2} 点 "引用" \\\\ \\${x}`)\n  output("a\\tb\\nc")'),
    )
    expect(out).toBe('{太郎} は 6 点 "引用" \\ ${x}\na\tb\nc\n')
  })

  it("入れ子の補間", () => {
    expect(run(main("  let a: int = 1\n  output(`x${`y${a}`}z`)"))).toBe("xy1z\n")
  })

  it("トップレベルの変数と float への暗黙変換", () => {
    const out = run(`const rate: float = 2\nlet base: int = 10\n${main("  output(base * rate)")}`)
    expect(out).toBe("20.0\n")
  })

  it("掛け算の連結行（行末演算子で複数行にした式）", () => {
    expect(run(main('  output("a" +\n    "b" +\n    "c")'))).toBe("abc\n")
  })
})

describe.skipIf(python === undefined)("E2E: 制御構文", () => {
  it("example.kururi の掛け算九九", () => {
    const source = readFileSync(join(__dirname, "../../../../example.kururi"), "utf8")
    const lines = run(source).split("\n")
    expect(lines[0]).toBe("掛け算九九の表")
    expect(lines).toHaveLength(12)
    expect(lines[2]).toBe(" 1  2  3  4  5  6  7  8  9 ")
    expect(lines[10]).toBe(" 9 18 27 36 45 54 63 72 81 ")
  })

  it("repeat は回数を 1 回だけ評価し、continue / break が効く", () => {
    const out = run(
      main(
        "  let n: int = 3\n  repeat i: n {\n    n += 10\n    if i == 1 { continue }\n    output(i)\n  }\n  let k: int = 0\n  while true {\n    k += 1\n    if k > 2 { break }\n  }\n  output(k)",
      ),
    )
    expect(out).toBe("0\n2\n3\n")
  })

  it("global 宣言でトップレベルの変数を更新できる", () => {
    expect(run(`let total: int = 0\nfunction main(): void {\n  repeat i: 4 {\n    total += i\n  }\n  output(total)\n}\n`)).toBe("6\n")
  })

  it("float への代入は float になる", () => {
    expect(run(main("  let f: float = 1.5\n  let n: int = 4\n  f = n\n  output(f)\n  f /= 8\n  output(f)"))).toBe("4.0\n0.5\n")
  })
})
