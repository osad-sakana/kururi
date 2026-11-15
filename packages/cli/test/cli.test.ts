import { describe, expect, it } from "vitest"
import { runCli } from "../src/cli"
import type { CliIo } from "../src/cli"

const UNSUPPORTED = "function main(): void {\n  class\n}\n"
const HELLO = 'function main(): void {\n  output("hi")\n}\n'

function io(
  files: Record<string, string>,
  ran: string[] = [],
  pythonExit = 0,
  written: Record<string, Uint8Array> = {},
): CliIo {
  return {
    writeFile: (path, data) => {
      written[path] = data
    },
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

describe("kururi export", () => {
  it("narapy で開く URL を標準出力に出す", () => {
    const r = runCli(["export", "a.kururi"], io({ "a.kururi": HELLO }))
    expect(r.exitCode).toBe(0)
    expect(r.stdout.startsWith("https://narapy.shisui.tokyo/#project=")).toBe(true)
    expect(r.stdout.trim().split("\n")).toHaveLength(1)
  })

  it("--base-url で narapy の場所を変えられる", () => {
    const r = runCli(["export", "a.kururi", "--base-url", "http://localhost:5173"], io({ "a.kururi": HELLO }))
    expect(r.stdout.startsWith("http://localhost:5173/#project=")).toBe(true)
  })

  it("--out で .narapy ファイルを書き出す", () => {
    const written: Record<string, Uint8Array> = {}
    const r = runCli(["export", "a.kururi", "--out", "a.narapy"], io({ "a.kururi": HELLO }, [], 0, written))
    expect(r.exitCode).toBe(0)
    expect(r.stdout).toContain("a.narapy")
    expect(written["a.narapy"]?.length).toBeGreaterThan(0)
  })

  it("コンパイルエラーがあれば出力せず終了コード 1", () => {
    const r = runCli(["export", "a.kururi"], io({ "a.kururi": UNSUPPORTED }))
    expect(r.exitCode).toBe(1)
    expect(r.stdout).toBe("")
    expect(r.stderr).toContain("error[K0001]")
  })

  it("空のプログラム・読めないファイル・不明なオプションは案内して失敗する", () => {
    expect(runCli(["export", "a.kururi"], io({ "a.kururi": "" })).exitCode).toBe(1)
    expect(runCli(["export", "none.kururi"], io({})).exitCode).toBe(2)
    const bad = runCli(["export", "a.kururi", "--nope"], io({ "a.kururi": HELLO }))
    expect(bad.exitCode).toBe(2)
    expect(bad.stderr).toContain("--nope")
    expect(runCli(["export", "a.kururi", "--out"], io({ "a.kururi": HELLO })).exitCode).toBe(2)
  })

  it("URL が長すぎるときは .narapy を使うよう案内する", () => {
    const body = Array.from({ length: 6000 }, (_, i) => `  output(${i * 7919})`).join("\n")
    const r = runCli(["export", "a.kururi"], io({ "a.kururi": `function main(): void {\n${body}\n}\n` }))
    expect(r.exitCode).toBe(1)
    expect(r.stderr).toContain("長すぎ")
  })
})
