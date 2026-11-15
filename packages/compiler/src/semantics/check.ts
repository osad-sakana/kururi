import type { Reporter } from "../reporter"
import type { Expr, FunctionDecl, Program, TopLevel, VarDecl } from "../syntax/ast"
import { ExprChecker } from "./check-expr"
import { alwaysReturns, checkBlock, declare, resolveType } from "./check-stmt"
import type { FunctionContext } from "./check-stmt"
import type { Local, Scope, Symbol } from "./scope"
import type { Type } from "./types"

export interface CheckResult {
  /** 式ごとの型 */
  readonly types: ReadonlyMap<Expr, Type>
  /** int → float の変換が要る式 */
  readonly widened: ReadonlySet<Expr>
  /** 関数ごとの、中で書き換えるトップレベルの let（global 宣言が必要なもの） */
  readonly globalWrites: ReadonlyMap<FunctionDecl, readonly string[]>
}

/** 名前の解決と型の検査。診断は reporter にためる。 */
export function check(program: Program, reporter: Reporter): CheckResult {
  const exprs = new ExprChecker(reporter)
  const { globals, primary } = registerTopLevel(program, reporter)
  const globalWrites = new Map<FunctionDecl, readonly string[]>()

  program.items.forEach((item, order) => {
    if (item.kind === "var") {
      const scope: Scope = { globals, locals: new Map(), visibleBefore: order }
      const symbol = globals.get(item.name)
      const declared = symbol?.kind === "variable" && symbol.order === order ? symbol.type : "error"
      checkInit(item, declared, scope, exprs)
    } else if (primary.has(item)) {
      const signature = globals.get(item.name)
      if (signature?.kind !== "function") return
      const ctx = { globals, exprs, reporter, returnType: signature.returnType, declared: new Map<string, Type>(), globalWrites: new Set<string>() }
      globalWrites.set(item, checkFunction(item, signature, ctx))
    }
  })

  const first = program.items[0]
  const hasMain = program.items.some((item) => item.kind === "function" && item.name === "main")
  if (first !== undefined && !hasMain) reporter.report("K0204", first.nameRange)

  return { types: exprs.types, widened: exprs.widened, globalWrites }
}

interface Registry {
  readonly globals: ReadonlyMap<string, Symbol>
  /** 名前が重複していない宣言（重複した 2 つ目以降は中身を調べない） */
  readonly primary: ReadonlySet<TopLevel>
}

/** トップレベルの名前を先に集める（重複の検査と、関数の順序を問わない呼び出しのため）。 */
function registerTopLevel(program: Program, reporter: Reporter): Registry {
  const globals = new Map<string, Symbol>()
  const primary = new Set<TopLevel>()
  program.items.forEach((item, order) => {
    if (globals.has(item.name)) {
      reporter.report("K0202", item.nameRange, { name: item.name })
      return
    }
    primary.add(item)
    globals.set(
      item.name,
      item.kind === "var"
        ? { kind: "variable", type: resolveType(item.type.name, item.type.range, reporter, false), order, mutable: item.mutable }
        : {
            kind: "function",
            name: item.name,
            params: item.params.map((p) => resolveType(p.type.name, p.type.range, reporter, false)),
            returnType: resolveType(item.returnType.name, item.returnType.range, reporter, true),
          },
    )
  })
  return { globals, primary }
}

function checkInit(decl: VarDecl, declared: Type, scope: Scope, exprs: ExprChecker): void {
  exprs.checkAssignable(decl.init, scope, declared)
}

/** 関数の中を調べて、書き換えたトップレベルの let の名前を返す。 */
function checkFunction(fn: FunctionDecl, signature: Extract<Symbol, { kind: "function" }>, ctx: FunctionContext): readonly string[] {
  if (fn.name === "main") {
    const [firstParam] = fn.params
    if (firstParam !== undefined) ctx.reporter.report("K0207", firstParam.nameRange)
    if (fn.returnType.name !== "void") ctx.reporter.report("K0207", fn.returnType.range)
  }
  let locals: ReadonlyMap<string, Local> = new Map()
  fn.params.forEach((param, i) => {
    locals = declare(param.name, signature.params[i] ?? "error", "let", param.nameRange, locals, ctx)
  })
  checkBlock(fn.body, locals, 0, ctx)
  const { returnType } = signature
  if (fn.name !== "main" && returnType !== "void" && returnType !== "error" && !alwaysReturns(fn.body)) {
    ctx.reporter.report("K0322", fn.nameRange, { name: fn.name, expected: returnType })
  }
  return [...ctx.globalWrites]
}
