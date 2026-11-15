import { readFileSync } from "node:fs"
import { runCli } from "./cli"

const { exitCode, stdout, stderr } = runCli(process.argv.slice(2), {
  readFile: (path) => readFileSync(path, "utf8"),
})

if (stdout !== "") process.stdout.write(stdout)
if (stderr !== "") process.stderr.write(stderr)
process.exitCode = exitCode
