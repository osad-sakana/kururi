import type { LineMapping } from "../compile"
import type { FunctionDecl, Program, Stmt, VarDecl } from "../syntax/ast"
import { emitExpr } from "./expr"
import type { TypeInfo } from "./expr"

export interface PythonOutput {
  readonly python: string
  readonly lineMap: readonly LineMapping[]
}

/** Kururi の型の名前を Python の型注釈にする（int[] → list[int]）。 */
function pyType(name: string): string {
  if (name.endsWith("[]")) return `list[${pyType(name.slice(0, -2))}]`
  return PYTHON_TYPES[name] ?? name
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
export function emitPython(
  program: Program,
  info: TypeInfo,
  globalWrites: ReadonlyMap<FunctionDecl, readonly string[]>,
  source: string,
): PythonOutput {
  if (program.items.length === 0) return { python: "", lineMap: [] }

  const blocks: Line[][] = [[{ text: "from __future__ import annotations" }]]
  let previousWasVar = false
  for (const item of program.items) {
    if (item.kind === "var") {
      const line = emitVar(item, info, 0)
      // 続けて並んだトップレベルの変数は、空行を空けずにひとかたまりにする
      if (previousWasVar) blocks[blocks.length - 1]?.push(line)
      else blocks.push([line])
    } else {
      blocks.push(emitFunction(item, info, globalWrites.get(item) ?? []))
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

function emitVar(decl: VarDecl, info: TypeInfo, indent: number): Line {
  const type = pyType(decl.type.name)
  const init = emitExpr(decl.init, info)
  return { text: `${" ".repeat(indent)}${decl.name}: ${type} = ${init}`, offset: decl.range.start }
}

function emitBlock(stmts: readonly Stmt[], info: TypeInfo, indent: number): Line[] {
  const lines = stmts.flatMap((stmt) => emitStatement(stmt, info, indent))
  return lines.length === 0 ? [{ text: `${" ".repeat(indent)}pass` }] : lines
}

function emitStatement(stmt: Stmt, info: TypeInfo, indent: number): Line[] {
  const pad = " ".repeat(indent)
  const at = (text: string, offset: number): Line => ({ text: `${pad}${text}`, offset })
  switch (stmt.kind) {
    case "var":
      return [emitVar(stmt, info, indent)]
    case "exprStmt":
      return [at(emitExpr(stmt.expr, info), stmt.range.start)]
    case "assign": {
      const value = emitExpr(stmt.value, info)
      return [at(`${emitExpr(stmt.target, info)} ${stmt.op} ${value}`, stmt.range.start)]
    }
    case "if":
      return [
        ...stmt.branches.flatMap((branch, i) => [
          at(`${i === 0 ? "if" : "elif"} ${emitExpr(branch.condition, info)}:`, branch.condition.range.start),
          ...emitBlock(branch.body, info, indent + 4),
        ]),
        ...(stmt.otherwise === undefined ? [] : [{ text: `${pad}else:` }, ...emitBlock(stmt.otherwise, info, indent + 4)]),
      ]
    case "while":
      return [at(`while ${emitExpr(stmt.condition, info)}:`, stmt.range.start), ...emitBlock(stmt.body, info, indent + 4)]
    case "repeat":
      return [
        at(`for ${stmt.name} in range(${emitExpr(stmt.count, info)}):`, stmt.range.start),
        ...emitBlock(stmt.body, info, indent + 4),
      ]
    case "foreach":
      return [at(`for ${stmt.name} in ${emitExpr(stmt.iterable, info)}:`, stmt.range.start), ...emitBlock(stmt.body, info, indent + 4)]
    case "return":
      return [at(stmt.value === undefined ? "return" : `return ${emitExpr(stmt.value, info)}`, stmt.range.start)]
    case "break":
    case "continue":
      return [at(stmt.kind, stmt.range.start)]
  }
}

function emitFunction(fn: FunctionDecl, info: TypeInfo, globalWrites: readonly string[]): Line[] {
  const params = fn.params.map((p) => `${p.name}: ${pyType(p.type.name)}`).join(", ")
  const header: Line = { text: `def ${fn.name}(${params}) -> ${pyType(fn.returnType.name)}:`, offset: fn.range.start }
  const declaration: Line[] = globalWrites.length === 0 ? [] : [{ text: `    global ${globalWrites.join(", ")}` }]
  const body = emitBlock(fn.body, info, 4)
  return [header, ...declaration, ...body]
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
