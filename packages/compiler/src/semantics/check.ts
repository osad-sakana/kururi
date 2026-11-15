import type { Reporter } from "../reporter"
import type { Expr, FunctionDecl, Program, VarDecl } from "../syntax/ast"
import { ExprChecker } from "./check-expr"
import { checkBlock, resolveType } from "./check-stmt"
import type { FunctionContext } from "./check-stmt"
import type { Scope, Symbol } from "./scope"
import type { Type } from "./types"

export interface CheckResult {
  /** 式ごとの型 */
  readonly types: ReadonlyMap<Expr, Type>
  /** 関数ごとの、中で書き換えるトップレベルの let（global 宣言が必要なもの） */
  readonly globalWrites: ReadonlyMap<FunctionDecl, readonly string[]>
}

/** 名前の解決と型の検査。診断は reporter にためる。 */
export function check(program: Program, reporter: Reporter): CheckResult {
  const exprs = new ExprChecker(reporter)
  const globals = registerTopLevel(program, reporter)
  const globalWrites = new Map<FunctionDecl, readonly string[]>()

  program.items.forEach((item, order) => {
    if (item.kind === "var") {
      const scope: Scope = { globals, locals: new Map(), visibleBefore: order }
      const symbol = globals.get(item.name)
      const declared = symbol?.kind === "variable" && symbol.order === order ? symbol.type : "error"
      checkInit(item, declared, scope, exprs)
    } else {
      const writes = checkFunction(item, { globals, exprs, reporter, declared: new Map(), globalWrites: new Set() })
      globalWrites.set(item, writes)
    }
  })

  const first = program.items[0]
  const hasMain = program.items.some((item) => item.kind === "function" && item.name === "main")
  if (first !== undefined && !hasMain) reporter.report("K0204", first.nameRange)

  return { types: exprs.types, globalWrites }
}

/** トップレベルの名前を先に集める（重複の検査と、関数の順序を問わない呼び出しのため）。 */
function registerTopLevel(program: Program, reporter: Reporter): ReadonlyMap<string, Symbol> {
  const globals = new Map<string, Symbol>()
  program.items.forEach((item, order) => {
    if (globals.has(item.name)) {
      reporter.report("K0202", item.nameRange, { name: item.name })
      return
    }
    globals.set(
      item.name,
      item.kind === "var"
        ? { kind: "variable", type: resolveType(item.type.name, item.type.range, reporter, false), order, mutable: item.mutable }
        : { kind: "function", name: item.name },
    )
  })
  return globals
}

function checkInit(decl: VarDecl, declared: Type, scope: Scope, exprs: ExprChecker): void {
  exprs.checkAssignable(decl.init, scope, declared)
}

/** 関数の中を調べて、書き換えたトップレベルの let の名前を返す。 */
function checkFunction(fn: FunctionDecl, ctx: FunctionContext): readonly string[] {
  if (fn.name !== "main") {
    ctx.reporter.report("K0002", fn.nameRange, { text: `function ${fn.name}` })
    return []
  }
  const [firstParam] = fn.params
  if (firstParam !== undefined) ctx.reporter.report("K0207", firstParam.nameRange)
  if (fn.returnType.name !== "void") ctx.reporter.report("K0207", fn.returnType.range)
  checkBlock(fn.body, new Map(), 0, ctx)
  return [...ctx.globalWrites]
}
