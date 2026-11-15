import type { Position } from "./types"

/** ソースの UTF-16 オフセットから、1 始まりの行・列（コードポイント数）を求める。 */
export function positionAt(source: string, offset: number): Position {
  const clamped = Math.max(0, Math.min(offset, source.length))
  const before = source.slice(0, clamped)
  const lastNewline = before.lastIndexOf("\n")
  const line = before.split("\n").length
  const lineStart = lastNewline + 1
  const column = Array.from(before.slice(lineStart)).length + 1
  return { offset: clamped, line, column }
}
