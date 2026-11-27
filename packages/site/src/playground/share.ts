/** ソースを URL の `#code=` に載せる／取り出すための変換（UTF-8 を base64url にする）。 */
const PREFIX = "#code="

export function encodeSource(source: string): string {
  const bytes = new TextEncoder().encode(source)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
}

export function decodeSource(encoded: string): string | null {
  try {
    const base64 = encoded.replaceAll("-", "+").replaceAll("_", "/")
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))
  } catch {
    return null
  }
}

/** プレイグラウンドへのリンクの末尾（`#code=...`） */
export function codeHash(source: string): string {
  return `${PREFIX}${encodeSource(source)}`
}

/** URL のハッシュに載っているソース。なければ null */
export function sourceFromHash(hash: string): string | null {
  return hash.startsWith(PREFIX) ? decodeSource(hash.slice(PREFIX.length)) : null
}
