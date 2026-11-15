import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { runCli } from "./cli"
import { resolvePython } from "./python"

function runPython(code: string): number {
  const python = resolvePython(process.env)
  if ("error" in python) {
    process.stderr.write(`${python.error}\n`)
    return 2
  }
  const run = spawnSync(python.command, ["-c", code], { stdio: "inherit" })
  return run.error === undefined ? (run.status ?? 1) : 2
}

const { exitCode, stdout, stderr } = runCli(process.argv.slice(2), {
  readFile: (path) => readFileSync(path, "utf8"),
  runPython,
  writeFile: (path, data) => writeFileSync(path, data),
})

if (stdout !== "") process.stdout.write(stdout)
if (stderr !== "") process.stderr.write(stderr)
process.exitCode = exitCode
