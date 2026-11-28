import type { Fix } from "@kururi/compiler"

/** エディタの範囲（行・列は 1 始まり、end は含まない。列は UTF-16 単位） */
export interface FixRange {
  readonly startLineNumber: number
  readonly startColumn: number
  readonly endLineNumber: number
  readonly endColumn: number
}

function offsetOf(source: string, line: number, column: number): number {
  let offset = 0
  for (let current = 1; current < line; current += 1) {
    const next = source.indexOf("\n", offset)
    if (next < 0) return source.length
    offset = next + 1
  }
  return Math.min(source.length, offset + column - 1)
}

const IDENTIFIER = /[\p{L}_][\p{L}\p{N}_]*/uy

/** 文字列とコメントの中は変えずに、名前（識別子）だけを置き換える。補間 "${ }" の中は、コードとして扱う。 */
export function renameIdentifier(source: string, from: string, to: string): string {
  let out = ""
  let i = 0
  // 補間の中にいるあいだ、${ に対応する `}` を探すための深さ（外側から順に積む）
  const braceStack: number[] = []
  let depth = 0
  let inTemplate = false

  while (i < source.length) {
    const ch = source[i] as string
    if (inTemplate) {
      if (ch === "\\") {
        out += source.slice(i, i + 2)
        i += 2
      } else if (ch === '"' || ch === "\n") {
        inTemplate = false
        out += ch
        i += 1
      } else if (ch === "$" && source[i + 1] === "{") {
        braceStack.push(depth)
        depth = 0
        inTemplate = false
        out += "${"
        i += 2
      } else {
        out += ch
        i += 1
      }
      continue
    }
    if (ch === "/" && source[i + 1] === "/") {
      const end = source.indexOf("\n", i)
      const stop = end < 0 ? source.length : end
      out += source.slice(i, stop)
      i = stop
    } else if (ch === '"') {
      inTemplate = true
      out += ch
      i += 1
    } else if (ch === "{") {
      depth += 1
      out += ch
      i += 1
    } else if (ch === "}") {
      if (depth === 0 && braceStack.length > 0) {
        depth = braceStack.pop() ?? 0
        inTemplate = true
      } else depth = Math.max(0, depth - 1)
      out += ch
      i += 1
    } else {
      IDENTIFIER.lastIndex = i
      const match = IDENTIFIER.exec(source)
      if (match === null) {
        out += ch
        i += 1
      } else {
        out += match[0] === from ? to : match[0]
        i += match[0].length
      }
    }
  }
  return out
}

/** 直し方を適用した、新しいソースを返す。 */
export function applyFix(source: string, range: FixRange, fix: Fix): string {
  const start = offsetOf(source, range.startLineNumber, range.startColumn)
  const end = offsetOf(source, range.endLineNumber, range.endColumn)
  if (fix.renameAll === true) return renameIdentifier(source, source.slice(start, end), fix.text)
  return source.slice(0, start) + fix.text + source.slice(end)
}
