import { compile, formatDiagnostics } from "@kururi/compiler"
import { buildNarapyArchive, buildProjectUrl, projectFiles } from "@kururi/narapy"

export interface CliIo {
  readonly readFile: (path: string) => string
  /** Python のコードを実行して、終了コードを返す。出力はそのまま画面に出す。 */
  readonly runPython: (code: string) => number
  /** バイト列をファイルに書く（export --out 用） */
  readonly writeFile: (path: string, data: Uint8Array) => void
}

export interface CliResult {
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}

const USAGE = [
  "使い方:",
  "  kururi check <ファイル.kururi>    エラーを調べる",
  "  kururi run <ファイル.kururi>      Python に変換して実行する",
  "  kururi export <ファイル.kururi> [--base-url URL] [--out ファイル.narapy]",
  "                                    narapy で開く URL を出す（--out で .narapy ファイルを書く）",
].join("\n")

function result(exitCode: number, stdout: string, stderr: string): CliResult {
  return { exitCode, stdout, stderr }
}

/**
 * コマンドライン本体。入出力は呼び出し側から受け取り、結果を返すだけにする（テストしやすくするため）。
 * 終了コード: 0 成功 / 1 コンパイルエラー / 2 使い方やファイルの誤り
 */
export function runCli(args: readonly string[], io: CliIo): CliResult {
  const [command, file, ...options] = args
  if (command === undefined || file === undefined) {
    return result(2, "", `${USAGE}\n`)
  }
  if (command === "export") return exportProject(file, options, io)
  if (command !== "check" && command !== "run") {
    return result(2, "", `不明なコマンドです: ${command}\n${USAGE}\n`)
  }
  return build(command, file, io)
}

type Compiled = { readonly source: string; readonly python: string } | CliResult

function compileFile(file: string, io: CliIo): Compiled {
  let source: string
  try {
    source = io.readFile(file)
  } catch {
    return result(2, "", `ファイルを読めません: ${file}\n`)
  }
  const { python, diagnostics } = compile(source)
  if (diagnostics.length > 0) {
    return result(1, "", `${formatDiagnostics(diagnostics, { source, fileName: file })}\n`)
  }
  return { source, python }
}

function build(command: "check" | "run", file: string, io: CliIo): CliResult {
  const compiled = compileFile(file, io)
  if ("exitCode" in compiled) return compiled
  if (command === "check") return result(0, `${file}: エラーはありません\n`, "")
  return result(compiled.python === "" ? 0 : io.runPython(compiled.python), "", "")
}

interface ExportOptions {
  readonly baseUrl?: string
  readonly out?: string
}

function parseExportOptions(options: readonly string[]): ExportOptions | string {
  let parsed: ExportOptions = {}
  for (let i = 0; i < options.length; i += 2) {
    const [flag, value] = [options[i], options[i + 1]]
    if (flag !== "--base-url" && flag !== "--out") return `不明なオプションです: ${flag}`
    if (value === undefined) return `${flag} には値が必要です`
    parsed = flag === "--out" ? { ...parsed, out: value } : { ...parsed, baseUrl: value }
  }
  return parsed
}

/** narapy で開く URL（または .narapy ファイル）を作る。 */
function exportProject(file: string, rawOptions: readonly string[], io: CliIo): CliResult {
  const options = parseExportOptions(rawOptions)
  if (typeof options === "string") return result(2, "", `${options}\n${USAGE}\n`)
  const compiled = compileFile(file, io)
  if ("exitCode" in compiled) return compiled
  if (compiled.python === "") return result(1, "", `${file}: 変換する内容がありません\n`)

  const files = projectFiles({ python: compiled.python, kururi: compiled.source })
  if (options.out !== undefined) {
    io.writeFile(options.out, buildNarapyArchive(files))
    return result(0, `${options.out} に書き出しました\n`, "")
  }
  try {
    const url = buildProjectUrl(files, options.baseUrl === undefined ? {} : { baseUrl: options.baseUrl })
    return result(0, `${url}\n`, "")
  } catch (error) {
    return result(1, "", `${error instanceof Error ? error.message : String(error)}\n`)
  }
}
