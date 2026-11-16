import { describe, expect, it } from "vitest"
import { compile } from "@kururi/compiler"
import { kururiLineOf, mapRuntimeError } from "../src/runtime"

const MAP = [
  { kururiLine: 1, pythonLine: 3 },
  { kururiLine: 2, pythonLine: 4 },
  { kururiLine: 5, pythonLine: 7 },
]

describe("kururiLineOf", () => {
  it("対応する行をそのまま返す", () => expect(kururiLineOf(4, MAP)).toBe(2))
  it("対応がない行は、手前で一番近い行にする", () => expect(kururiLineOf(6, MAP)).toBe(2))
  it("最初の対応より前や、対応表が空のときは null", () => {
    expect(kururiLineOf(1, MAP)).toBeNull()
    expect(kururiLineOf(4, [])).toBeNull()
  })
})

describe("mapRuntimeError", () => {
  const traceback = [
    "Traceback (most recent call last):",
    '  File "/lib/python312.zip/_pyodide/_base.py", line 574, in eval_code_async',
    '  File "<exec>", line 9, in <module>',
    '  File "<exec>", line 7, in main',
    "ZeroDivisionError: division by zero",
    "",
  ].join("\n")

  it("一番内側の <exec> のフレームを Kururi の行にする", () => {
    expect(mapRuntimeError(traceback, MAP)).toEqual({
      kururiLine: 5,
      summary: "ZeroDivisionError: division by zero",
    })
  })

  it("<exec> のフレームがなければ行は null", () => {
    expect(mapRuntimeError("EOFError: EOF when reading a line", MAP)).toEqual({
      kururiLine: null,
      summary: "EOFError: EOF when reading a line",
    })
  })

  it("実際に変換した Python の行と対応する", () => {
    const source = "function main = () {\n    var a: int = 1\n    output(div(a, 0))\n}\n"
    const { python, lineMap, diagnostics } = compile(source)
    expect(diagnostics).toEqual([])
    const pythonLine = python.split("\n").findIndex((line) => line.includes("print")) + 1
    expect(kururiLineOf(pythonLine, lineMap)).toBe(3)
  })
})
