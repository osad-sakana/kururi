import { describe, expect, it } from "vitest"
import { runCli } from "../src/cli"
import type { CliIo } from "../src/cli"

function io(files: Record<string, string>): CliIo {
  return {
    readFile: (path) => {
      const content = files[path]
      if (content === undefined) throw new Error(`ENOENT: ${path}`)
      return content
    },
  }
}

describe("kururi check", () => {
  it("エラーがなければ終了コード 0", () => {
    const r = runCli(["check", "a.kururi"], io({ "a.kururi": "" }))
    expect(r.exitCode).toBe(0)
    expect(r.stderr).toBe("")
    expect(r.stdout).toContain("エラーはありません")
  })

  it("エラーがあれば診断を stderr に出して終了コード 1", () => {
    const r = runCli(["check", "a.kururi"], io({ "a.kururi": "let a: int = 1" }))
    expect(r.exitCode).toBe(1)
    expect(r.stderr).toContain("error[K0001]")
    expect(r.stderr).toContain("a.kururi:1:1")
  })

  it("ファイルが読めなければ終了コード 2", () => {
    const r = runCli(["check", "none.kururi"], io({}))
    expect(r.exitCode).toBe(2)
    expect(r.stderr).toContain("none.kururi")
  })

  it("引数が足りなければ使い方を出して終了コード 2", () => {
    const r = runCli(["check"], io({}))
    expect(r.exitCode).toBe(2)
    expect(r.stderr).toContain("使い方")
  })

  it("未知のコマンドは終了コード 2", () => {
    const r = runCli(["build", "a.kururi"], io({ "a.kururi": "" }))
    expect(r.exitCode).toBe(2)
    expect(r.stderr).toContain("build")
  })
})
