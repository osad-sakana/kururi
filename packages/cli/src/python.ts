import { execFileSync } from "node:child_process"

export type PythonLookup = { readonly command: string } | { readonly error: string }

/** 生成するコードは f 文字列の中で " を再利用するので、Python 3.12 以上が必要。 */
const MIN_MINOR = 12

function versionOf(command: string): string | undefined {
  try {
    const out = execFileSync(command, ["-c", "import platform;print(platform.python_version())"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
    return out.trim()
  } catch {
    return undefined
  }
}

function uvPython312(): string | undefined {
  try {
    const out = execFileSync("uv", ["python", "find", "3.12"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
    return out.trim() || undefined
  } catch {
    return undefined
  }
}

function isSupported(version: string): boolean {
  const [major, minor] = version.split(".").map(Number)
  return major === 3 && (minor ?? 0) >= MIN_MINOR
}

/**
 * 実行に使う Python を決める。KURURI_PYTHON → python3.12 → uv の 3.12 → python3 の順に探し、
 * 3.12 以上のものだけを使う。probe と findUv は差し替えられる（テスト用）。
 */
export function resolvePython(
  env: Readonly<Record<string, string | undefined>>,
  probe: (command: string) => string | undefined = versionOf,
  findUv: () => string | undefined = uvPython312,
): PythonLookup {
  const candidates = [env["KURURI_PYTHON"], "python3.12", findUv(), "python3"].filter(
    (c): c is string => c !== undefined && c !== "",
  )
  const seen: string[] = []
  for (const command of candidates) {
    const version = probe(command)
    if (version === undefined) continue
    if (isSupported(version)) return { command }
    seen.push(`${command} (${version})`)
  }
  const suffix =
    seen.length === 0
      ? "Python が見つかりません"
      : `見つかった Python が古すぎます: ${seen.join(", ")}`
  return { error: `${suffix}。Python 3.12 以上が必要です。KURURI_PYTHON に 3.12 以上の Python のパスを指定してください` }
}
