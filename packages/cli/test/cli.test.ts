import { describe, expect, it } from "vitest"
import { runCli } from "../src/cli"
import type { CliIo } from "../src/cli"

const UNSUPPORTED = "function main(): void {\n  class\n}\n"
const HELLO = 'function main(): void {\n  output("hi")\n}\n'

function io(files: Record<string, string>, ran: string[] = [], pythonExit = 0): CliIo {
  return {
    readFile: (path) => {
      const content = files[path]
      if (content === undefined) throw new Error(`ENOENT: ${path}`)
      return content
    },
    runPython: (code) => {
      ran.push(code)
      return pythonExit
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
    const r = runCli(["check", "a.kururi"], io({ "a.kururi": UNSUPPORTED }))
    expect(r.exitCode).toBe(1)
    expect(r.stderr).toContain("error[K0001]")
    expect(r.stderr).toContain("a.kururi:2:3")
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

  it("check は Python を実行しない", () => {
    const ran: string[] = []
    runCli(["check", "a.kururi"], io({ "a.kururi": HELLO }, ran))
    expect(ran).toEqual([])
  })
})

describe("kururi run", () => {
  it("変換した Python を実行し、その終了コードを返す", () => {
    const ran: string[] = []
    const r = runCli(["run", "a.kururi"], io({ "a.kururi": HELLO }, ran, 3))
    expect(r.exitCode).toBe(3)
    expect(ran).toHaveLength(1)
    expect(ran[0]).toContain('print("hi")')
  })

  it("コンパイルエラーがあれば実行せず終了コード 1", () => {
    const ran: string[] = []
    const r = runCli(["run", "a.kururi"], io({ "a.kururi": UNSUPPORTED }, ran))
    expect(r.exitCode).toBe(1)
    expect(r.stderr).toContain("error[K0001]")
    expect(ran).toEqual([])
  })

  it("空のファイルは何も実行せず終了コード 0", () => {
    const ran: string[] = []
    expect(runCli(["run", "a.kururi"], io({ "a.kururi": "" }, ran)).exitCode).toBe(0)
    expect(ran).toEqual([])
  })

  it("ファイルが読めなければ終了コード 2", () => {
    expect(runCli(["run", "none.kururi"], io({})).exitCode).toBe(2)
  })
})
