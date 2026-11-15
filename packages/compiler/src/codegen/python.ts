import type { LineMapping } from "../compile"
import type { FunctionDecl, Program, Stmt, VarDecl } from "../syntax/ast"
import { emitExpr } from "./expr"
import type { TypeTable } from "./expr"

export interface PythonOutput {
  readonly python: string
  readonly lineMap: readonly LineMapping[]
}

const PYTHON_TYPES: Readonly<Record<string, string>> = {
  int: "int",
  float: "float",
  string: "str",
  boolean: "bool",
  void: "None",
}

interface Line {
  readonly text: string
  /** 元の Kururi のソースの位置（行の対応づけ用）。 */
  readonly offset?: number
}

/** 型検査を通ったプログラムを Python にする。 */
export function emitPython(program: Program, types: TypeTable, source: string): PythonOutput {
  if (program.items.length === 0) return { python: "", lineMap: [] }

  const blocks: Line[][] = [[{ text: "from __future__ import annotations" }]]
  let previousWasVar = false
  for (const item of program.items) {
    if (item.kind === "var") {
      const line = emitVar(item, types, 0)
      // 続けて並んだトップレベルの変数は、空行を空けずにひとかたまりにする
      if (previousWasVar) blocks[blocks.length - 1]?.push(line)
      else blocks.push([line])
    } else {
      blocks.push(emitFunction(item, types))
    }
    previousWasVar = item.kind === "var"
  }
  if (program.items.some((item) => item.kind === "function" && item.name === "main")) {
    blocks.push([{ text: 'if __name__ == "__main__":' }, { text: "    main()" }])
  }

  const lines: Line[] = []
  blocks.forEach((block, index) => {
    if (index > 0) lines.push({ text: "" }, { text: "" })
    lines.push(...block)
  })

  const starts = lineStarts(source)
  const lineMap = lines.flatMap((line, index) =>
    line.offset === undefined ? [] : [{ kururiLine: lineOf(starts, line.offset), pythonLine: index + 1 }],
  )
  return { python: `${lines.map((line) => line.text).join("\n")}\n`, lineMap }
}

/** int の値を float の場所に入れるとき、Python では自動で float にならないので変換を足す。 */
function emitInit(decl: VarDecl, types: TypeTable): string {
  const code = emitExpr(decl.init, types)
  if (decl.type.name !== "float" || types.get(decl.init) !== "int") return code
  return decl.init.kind === "int" ? `${code}.0` : `float(${code})`
}

function emitVar(decl: VarDecl, types: TypeTable, indent: number): Line {
  const type = PYTHON_TYPES[decl.type.name] ?? decl.type.name
  return {
    text: `${" ".repeat(indent)}${decl.name}: ${type} = ${emitInit(decl, types)}`,
    offset: decl.range.start,
  }
}

function emitStatement(stmt: Stmt, types: TypeTable, indent: number): Line {
  if (stmt.kind === "var") return emitVar(stmt, types, indent)
  return { text: `${" ".repeat(indent)}${emitExpr(stmt.expr, types)}`, offset: stmt.range.start }
}

function emitFunction(fn: FunctionDecl, types: TypeTable): Line[] {
  const header: Line = { text: `def ${fn.name}() -> None:`, offset: fn.range.start }
  const body = fn.body.map((stmt) => emitStatement(stmt, types, 4))
  return [header, ...(body.length === 0 ? [{ text: "    pass" }] : body)]
}

function lineStarts(source: string): readonly number[] {
  const starts = [0]
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === "\n") starts.push(i + 1)
  }
  return starts
}

/** オフセットが何行目か（1 始まり）。 */
function lineOf(starts: readonly number[], offset: number): number {
  let line = 0
  while (line + 1 < starts.length && (starts[line + 1] ?? Infinity) <= offset) line += 1
  return line + 1
}
