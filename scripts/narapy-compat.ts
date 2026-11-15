/**
 * narapy との互換テスト。narapy 自身のデコード処理で、Kururi が作る受け渡しデータを読めるか確かめる。
 *   NARAPY_SRC=<narapy を取得した場所> pnpm narapy-compat
 * narapy の形式が変わって読めなくなると、ここで失敗する。
 */
import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { compile } from "../packages/compiler/src"
import { buildNarapyArchive, buildProjectUrl, projectFiles } from "../packages/narapy/src"

interface NarapyProject {
  readonly activeFile: string
  readonly files: readonly { readonly path: string; readonly content: { readonly kind: string; readonly data: string } }[]
}

interface Narapy {
  readonly decodeProjectParam: (value: string) => NarapyProject
  readonly parseNarapyArchive: (bytes: Uint8Array) => NarapyProject
}

async function loadNarapy(root: string): Promise<Narapy> {
  const load = async (path: string): Promise<Record<string, unknown>> =>
    (await import(pathToFileURL(join(root, path)).href)) as Record<string, unknown>
  const decode = await load("src/urlload/decode.ts")
  const fileio = await load("src/fileio/index.ts")
  const decodeProjectParam = decode["decodeProjectParam"]
  const parseNarapyArchive = fileio["parseNarapyArchive"]
  if (typeof decodeProjectParam !== "function" || typeof parseNarapyArchive !== "function") {
    throw new Error("narapy の decodeProjectParam / parseNarapyArchive が見つかりません。narapy の構成が変わった可能性があります")
  }
  return {
    decodeProjectParam: decodeProjectParam as Narapy["decodeProjectParam"],
    parseNarapyArchive: parseNarapyArchive as Narapy["parseNarapyArchive"],
  }
}

function check(project: NarapyProject, expected: Record<string, string>, label: string): void {
  const actual = Object.fromEntries(project.files.map((file) => [file.path, file.content.data]))
  for (const [path, content] of Object.entries(expected)) {
    if (actual[path] !== content) throw new Error(`${label}: ${path} の中身が一致しません`)
  }
  if (project.activeFile !== "main.py") {
    throw new Error(`${label}: activeFile が main.py ではありません（${project.activeFile}）`)
  }
}

async function main(): Promise<void> {
  const root = process.env["NARAPY_SRC"]
  if (root === undefined || root === "") throw new Error("NARAPY_SRC に narapy を取得した場所を指定してください")
  const narapy = await loadNarapy(resolve(root))

  for (const name of ["s1-hello", "s3-functions", "s4-classes"]) {
    const kururi = readFileSync(join("tests/cases", name, "input.kururi"), "utf8")
    const { python, diagnostics } = compile(kururi)
    if (diagnostics.length > 0) throw new Error(`${name}: コンパイルできません`)
    const files = projectFiles({ python, kururi })

    const url = buildProjectUrl(files)
    check(narapy.decodeProjectParam(url.split("#project=")[1] ?? ""), files, `${name} (#project=)`)
    check(narapy.parseNarapyArchive(buildNarapyArchive(files)), files, `${name} (.narapy)`)
    console.log(`ok: ${name}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
