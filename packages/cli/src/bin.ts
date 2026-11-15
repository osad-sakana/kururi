import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { runCli } from "./cli"

/** 実行に使う Python。環境変数 KURURI_PYTHON で変えられる（既定は python3）。 */
function runPython(code: string): number {
  const python = process.env["KURURI_PYTHON"] ?? "python3"
  const run = spawnSync(python, ["-c", code], { stdio: "inherit" })
  if (run.error !== undefined) {
    process.stderr.write(`Python を起動できませんでした（${python}）。KURURI_PYTHON で Python 3.12 のパスを指定できます\n`)
    return 2
  }
  return run.status ?? 1
}

const { exitCode, stdout, stderr } = runCli(process.argv.slice(2), {
  readFile: (path) => readFileSync(path, "utf8"),
  runPython,
})

if (stdout !== "") process.stdout.write(stdout)
if (stderr !== "") process.stderr.write(stderr)
process.exitCode = exitCode
