import type { LineMapping } from "@kururi/compiler"

export interface RuntimeError {
  /** 実行時エラーが起きた Kururi の行（対応が見つからなければ null） */
  readonly kururiLine: number | null
  /** 「ZeroDivisionError: division by zero」のような、トレースバックの最後の行 */
  readonly summary: string
}

const FRAME = /File "<exec>", line (\d+)/g

/** Python の行から、対応する Kururi の行を探す。その行に対応がなければ、手前で一番近い行を使う。 */
export function kururiLineOf(pythonLine: number, lineMap: readonly LineMapping[]): number | null {
  let best: LineMapping | undefined
  for (const entry of lineMap) {
    if (entry.pythonLine <= pythonLine && (best === undefined || entry.pythonLine > best.pythonLine)) best = entry
  }
  return best?.kururiLine ?? null
}

/** Python のトレースバックから、Kururi の行とエラーの要約を取り出す（一番内側のフレームを使う）。 */
export function mapRuntimeError(traceback: string, lineMap: readonly LineMapping[]): RuntimeError {
  const frames = [...traceback.matchAll(FRAME)]
  const innermost = frames[frames.length - 1]?.[1]
  const lines = traceback.split("\n").map((line) => line.trim()).filter((line) => line !== "")
  return {
    kururiLine: innermost === undefined ? null : kururiLineOf(Number(innermost), lineMap),
    summary: lines[lines.length - 1] ?? traceback,
  }
}
