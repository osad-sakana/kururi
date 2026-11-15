import { strToU8, zipSync, zlibSync } from "fflate"

/** narapy の公開サイト。別の場所の narapy を使うときは baseUrl で変える。 */
export const DEFAULT_BASE_URL = "https://narapy.shisui.tokyo/"

/** narapy の共有リンクの長さの上限（narapy の MAX_SHARE_URL_LENGTH に合わせる）。 */
export const MAX_URL_LENGTH = 32_000

export interface UrlOptions {
  readonly baseUrl?: string
  /** narapy で最初に開くファイル（既定は main.py） */
  readonly activeFile?: string
}

/** narapy に渡すファイル一式。実行する main.py と、元の Kururi を参照用の main.kururi.txt として入れる。 */
export function projectFiles(source: { readonly python: string; readonly kururi: string }): Record<string, string> {
  return { "main.py": source.python, "main.kururi.txt": source.kururi }
}

/** .narapy アーカイブ（zip）。narapy.json を根に置き、各ファイルは files/<パス> に入れる。 */
export function buildNarapyArchive(files: Readonly<Record<string, string>>, activeFile = "main.py"): Uint8Array {
  const entries: Record<string, Uint8Array> = {
    "narapy.json": strToU8(JSON.stringify({ version: 2, activeFile, directories: [] })),
  }
  for (const [path, content] of Object.entries(files)) {
    entries[`files/${path}`] = strToU8(content)
  }
  return zipSync(entries)
}

/** バイト列を base64url（+ → -、/ → _、末尾の = なし）にする。 */
export function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** narapy で開く URL（#project=<zlib 圧縮した .narapy を base64url にしたもの>）を作る。 */
export function buildProjectUrl(files: Readonly<Record<string, string>>, options: UrlOptions = {}): string {
  const archive = buildNarapyArchive(files, options.activeFile)
  const base = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "")
  const url = `${base}/#project=${toBase64Url(zlibSync(archive, { level: 9 }))}`
  if (url.length > MAX_URL_LENGTH) {
    throw new Error(`narapy に渡す URL が長すぎます（${url.length} 文字、上限は約 ${MAX_URL_LENGTH} 文字）。プログラムを短くするか、.narapy ファイルで渡してください`)
  }
  return url
}
