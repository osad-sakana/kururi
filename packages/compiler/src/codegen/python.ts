import type { LineMapping } from "../compile"
import type { ClassDecl, ConstructorDecl, FieldDecl, FunctionDecl, Param, Program, Stmt, VarDecl } from "../syntax/ast"
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
  globalWrites: WriteTable,
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
    } else if (item.kind === "class") {
      blocks.push(emitClass(item, info, globalWrites))
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

interface DefSpec {
  readonly name: string
  readonly params: readonly Param[]
  readonly returnType: string
  readonly body: readonly Stmt[]
  readonly offset: number
  readonly indent: number
  /** メソッドと constructor なら true（最初の引数に self を付ける） */
  readonly isMethod: boolean
  /** 本体の先頭に出す行（フィールドの初期値） */
  readonly prelude?: readonly Line[]
}

function emitDef(spec: DefSpec, info: TypeInfo, globalWrites: readonly string[]): Line[] {
  const pad = " ".repeat(spec.indent)
  const params = [
    ...(spec.isMethod ? ["self"] : []),
    ...spec.params.map((p) => `${p.name}: ${pyType(p.type.name)}`),
  ].join(", ")
  const header: Line = { text: `${pad}def ${spec.name}(${params}) -> ${spec.returnType}:`, offset: spec.offset }
  const declaration: Line[] = globalWrites.length === 0 ? [] : [{ text: `${pad}    global ${globalWrites.join(", ")}` }]
  const body = emitBlock(spec.body, info, spec.indent + 4)
  const prelude = spec.prelude ?? []
  // 本体が pass だけで、前置きがあるときは pass を出さない
  const statements = prelude.length > 0 && spec.body.length === 0 ? [] : body
  return [header, ...declaration, ...prelude, ...statements]
}

function emitFunction(fn: FunctionDecl, info: TypeInfo, globalWrites: readonly string[]): Line[] {
  return emitDef(
    { name: fn.name, params: fn.params, returnType: pyType(fn.returnType.name), body: fn.body, offset: fn.range.start, indent: 0, isMethod: false },
    info,
    globalWrites,
  )
}

type WriteTable = ReadonlyMap<FunctionDecl | ConstructorDecl, readonly string[]>

/** クラスを class にする。フィールドの初期値は __init__ の先頭に出す。 */
function emitClass(decl: ClassDecl, info: TypeInfo, writes: WriteTable): Line[] {
  const fields = decl.members.filter((m): m is FieldDecl => m.kind === "field" && m.init !== undefined)
  const initLines: Line[] = fields.map((f) => ({
    text: `        self.${f.name} = ${f.init === undefined ? "" : emitExpr(f.init, info)}`,
    offset: f.range.start,
  }))
  const constructor = decl.members.find((m): m is ConstructorDecl => m.kind === "constructor")
  const parts: Line[][] = []
  if (constructor !== undefined) {
    parts.push(
      emitDef(
        { name: "__init__", params: constructor.params, returnType: "None", body: constructor.body, offset: constructor.range.start, indent: 4, isMethod: true, prelude: initLines },
        info,
        writes.get(constructor) ?? [],
      ),
    )
  } else if (initLines.length > 0) {
    parts.push([{ text: "    def __init__(self) -> None:" }, ...initLines])
  }
  for (const member of decl.members) {
    if (member.kind !== "method") continue
    const fn = member.fn
    parts.push(
      emitDef(
        { name: fn.name, params: fn.params, returnType: pyType(fn.returnType.name), body: fn.body, offset: fn.range.start, indent: 4, isMethod: true },
        info,
        writes.get(fn) ?? [],
      ),
    )
  }
  const header: Line = { text: `class ${decl.name}:`, offset: decl.range.start }
  if (parts.length === 0) return [header, { text: "    pass" }]
  return [header, ...parts.flatMap((part, i) => (i === 0 ? part : [{ text: "" }, ...part]))]
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
