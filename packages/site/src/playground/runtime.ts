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
  const frames = [...traceback.matchAll(FRAME)].map((match) => Number(match[1]))
  // 一番内側から外へ、Kururi の行に対応が付くフレームを探す（補助関数の中で起きたエラーは、呼んだ行にする）
  const kururiLine = [...frames].reverse().map((line) => kururiLineOf(line, lineMap)).find((line) => line !== null) ?? null
  const lines = traceback.split("\n").map((line) => line.trim()).filter((line) => line !== "")
  return { kururiLine, summary: translate(lines[lines.length - 1] ?? traceback) }
}

const TRANSLATIONS: readonly (readonly [string, string])[] = [
  ["IndexError: list index out of range", "IndexError: 位置が配列の長さを超えています"],
  ["IndexError: string index out of range", "IndexError: 位置が文字列の長さを超えています"],
  ["IndexError: pop index out of range", "IndexError: 位置が配列の長さを超えています"],
  ["ZeroDivisionError: division by zero", "ZeroDivisionError: 0 では割れません"],
  ["ZeroDivisionError: integer division or modulo by zero", "ZeroDivisionError: 0 では割れません"],
  ["ZeroDivisionError: integer modulo by zero", "ZeroDivisionError: 0 では割れません"],
]

/** よく起きるエラーの Python の英語を、Kururi の言葉にする。 */
function translate(summary: string): string {
  return TRANSLATIONS.find(([english]) => summary === english)?.[1] ?? summary
}
