import { describe, expect, it } from "vitest"
import { resolvePython } from "../src/python"

/** 実行できる Python とそのバージョンの表から、probe（バージョンを調べる関数）を作る。 */
function probeFrom(versions: Record<string, string>) {
  return (command: string): string | undefined => versions[command]
}

describe("resolvePython", () => {
  it("KURURI_PYTHON を最優先で使う", () => {
    const found = resolvePython({ KURURI_PYTHON: "/x/py" }, probeFrom({ "/x/py": "3.12.4", python3: "3.9.6" }), () => undefined)
    expect(found).toEqual({ command: "/x/py" })
  })

  it("python3.12 → uv → python3 の順に探す", () => {
    expect(resolvePython({}, probeFrom({ "python3.12": "3.12.1" }), () => undefined)).toEqual({ command: "python3.12" })
    expect(resolvePython({}, probeFrom({ "/uv/py": "3.12.2" }), () => "/uv/py")).toEqual({ command: "/uv/py" })
    expect(resolvePython({}, probeFrom({ python3: "3.13.0" }), () => undefined)).toEqual({ command: "python3" })
  })

  it("3.12 未満しかなければエラーのメッセージを返す", () => {
    const found = resolvePython({}, probeFrom({ python3: "3.9.6" }), () => undefined)
    expect(found).toEqual({ error: expect.stringContaining("3.12") })
    expect(found).toEqual({ error: expect.stringContaining("3.9.6") })
  })

  it("Python が見つからなければエラーのメッセージを返す", () => {
    expect(resolvePython({}, probeFrom({}), () => undefined)).toEqual({ error: expect.stringContaining("見つかりません") })
  })
})
