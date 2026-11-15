import { compile, formatDiagnostics } from "@kururi/compiler"

export interface CliIo {
  readonly readFile: (path: string) => string
}

export interface CliResult {
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}

const USAGE = "使い方: kururi check <ファイル.kururi>"

function result(exitCode: number, stdout: string, stderr: string): CliResult {
  return { exitCode, stdout, stderr }
}

/**
 * コマンドライン本体。入出力は呼び出し側から受け取り、結果を返すだけにする（テストしやすくするため）。
 * 終了コード: 0 成功 / 1 コンパイルエラー / 2 使い方やファイルの誤り
 */
export function runCli(args: readonly string[], io: CliIo): CliResult {
  const [command, file] = args
  if (command === undefined || file === undefined) {
    return result(2, "", `${USAGE}\n`)
  }
  if (command !== "check") {
    return result(2, "", `不明なコマンドです: ${command}\n${USAGE}\n`)
  }
  return check(file, io)
}

function check(file: string, io: CliIo): CliResult {
  let source: string
  try {
    source = io.readFile(file)
  } catch {
    return result(2, "", `ファイルを読めません: ${file}\n`)
  }

  const { diagnostics } = compile(source)
  if (diagnostics.length === 0) {
    return result(0, `${file}: エラーはありません\n`, "")
  }
  return result(1, "", `${formatDiagnostics(diagnostics, { source, fileName: file })}\n`)
}
