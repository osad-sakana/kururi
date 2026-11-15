import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { compile, formatDiagnostics } from "../src"

/**
 * ゴールデンテスト。tests/cases/<名前>/ に次のファイルを置く。
 *   input.kururi   入力
 *   expected.py    期待する Python（診断が 0 件のとき）
 *   expected.err   期待する診断の表示（診断があるとき）
 * 期待値を作り直すときは UPDATE_GOLDEN=1 で実行する。
 */
const casesDir = join(dirname(fileURLToPath(import.meta.url)), "../../../tests/cases")
const update = process.env["UPDATE_GOLDEN"] === "1"

const caseNames = readdirSync(casesDir)
  .filter((name) => statSync(join(casesDir, name)).isDirectory())
  .sort()

describe("ゴールデンテスト", () => {
  it("テストケースが 1 つ以上ある", () => {
    expect(caseNames.length).toBeGreaterThan(0)
  })

  for (const name of caseNames) {
    it(name, () => {
      const dir = join(casesDir, name)
      const source = readFileSync(join(dir, "input.kururi"), "utf8")
      const result = compile(source)
      const hasErrors = result.diagnostics.length > 0
      const expectedFile = join(dir, hasErrors ? "expected.err" : "expected.py")
      const actual = hasErrors
        ? formatDiagnostics(result.diagnostics, { source, fileName: "input.kururi" })
        : result.python

      if (update) {
        writeFileSync(expectedFile, actual, "utf8")
        return
      }

      expect(existsSync(expectedFile), `${expectedFile} がありません`).toBe(true)
      expect(actual).toBe(readFileSync(expectedFile, "utf8"))
    })
  }
})
