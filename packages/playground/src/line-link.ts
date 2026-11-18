import type { LineMapping } from "@kururi/compiler"

/** Kururi の行に対応する、Python の行（複数ありうる） */
export function pythonLinesFor(kururiLine: number, lineMap: readonly LineMapping[]): readonly number[] {
  return lineMap.filter((entry) => entry.kururiLine === kururiLine).map((entry) => entry.pythonLine)
}

/** Python の行に対応する、Kururi の行。その行に対応がなければ null（手前の行にはさかのぼらない） */
export function kururiLineFor(pythonLine: number, lineMap: readonly LineMapping[]): number | null {
  return lineMap.find((entry) => entry.pythonLine === pythonLine)?.kururiLine ?? null
}
