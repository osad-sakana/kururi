import type { Reporter } from "../reporter"
import type { ClassMember, ConstructorDecl, Expr, FunctionDecl, Program, TopLevel, VarDecl } from "../syntax/ast"
import { checkClass, registerMembers } from "./check-class"
import { ExprChecker } from "./check-expr"
import { checkCallable } from "./check-function"
import { resolveType } from "./check-stmt"
import type { FunctionContext } from "./check-stmt"
import type { Scope, Symbol } from "./scope"
import type { Type } from "./types"

export interface CheckResult {
  /** 式ごとの型 */
  readonly types: ReadonlyMap<Expr, Type>
  /** int → float の変換が要る式 */
  readonly widened: ReadonlySet<Expr>
  /** 0 以上と分かっている添字の式 */
  readonly safeIndexes: ReadonlySet<Expr>
  /** 関数・メソッド・constructor ごとの、中で書き換えるトップレベルの let（global 宣言が必要なもの） */
  readonly globalWrites: ReadonlyMap<FunctionDecl | ConstructorDecl, readonly string[]>
}

/** 名前の解決と型の検査。診断は reporter にためる。 */
export function check(program: Program, reporter: Reporter): CheckResult {
  const exprs = new ExprChecker(reporter)
  const { globals, primary, members } = registerTopLevel(program, reporter)
  const globalWrites = new Map<object, readonly string[]>()
  const base = { globals, exprs, reporter }

  program.items.forEach((item, order) => {
    if (!primary.has(item)) return
    const symbol = globals.get(item.name)
    if (item.kind === "var") {
      const scope: Scope = { globals, locals: new Map(), visibleBefore: order }
      const declared = symbol?.kind === "variable" && symbol.order === order ? symbol.type : "error"
      exprs.checkAssignable(item.init, scope, declared)
    } else if (item.kind === "function" && symbol?.kind === "function") {
      const ctx: FunctionContext = {
        ...base,
        cls: undefined,
        returnType: symbol.returnType,
        declared: new Map(),
        globalWrites: new Set(),
      }
      reportMainShape(item, reporter)
      globalWrites.set(item, checkCallable(item, symbol.params, ctx, { isMain: item.name === "main" }))
    } else if (item.kind === "class" && symbol?.kind === "class") {
      checkClass(item, symbol.info, members.get(item) ?? new Set(), base, globalWrites)
    }
  })

  const first = program.items[0]
  const hasMain = program.items.some((item) => item.kind === "function" && item.name === "main")
  if (first !== undefined && !hasMain) reporter.report("K0204", first.nameRange)

  return { types: exprs.types, widened: exprs.widened, safeIndexes: exprs.safeIndexes, globalWrites: globalWrites as CheckResult["globalWrites"] }
}

/** main は引数なしで、戻り値はなし（-> を書かない）。 */
function reportMainShape(fn: FunctionDecl, reporter: Reporter): void {
  if (fn.name !== "main") return
  const [firstParam] = fn.params
  if (firstParam !== undefined) reporter.report("K0207", firstParam.nameRange)
  // -> を書いたら（範囲が空でなければ）、型が何であってもエラー
  if (fn.returnType.name !== "null" || fn.returnType.range.end > fn.returnType.range.start) reporter.report("K0207", fn.returnType.range)
}

interface Registry {
  readonly globals: ReadonlyMap<string, Symbol>
  /** 名前が重複していない宣言（重複した 2 つ目以降は中身を調べない） */
  readonly primary: ReadonlySet<TopLevel>
  /** クラスごとの、登録できたメンバ */
  readonly members: ReadonlyMap<TopLevel, ReadonlySet<ClassMember>>
}

/**
 * トップレベルの名前を先に集める（重複の検査と、関数の順序を問わない呼び出しのため）。
 * 1 回目で名前だけ登録し、2 回目で型を決める（型にクラスの名前が使えるように）。
 */
function registerTopLevel(program: Program, reporter: Reporter): Registry {
  const globals = new Map<string, Symbol>()
  const primary = new Set<TopLevel>()
  program.items.forEach((item, order) => {
    if (globals.has(item.name)) {
      reporter.report("K0202", item.nameRange, { name: item.name })
      return
    }
    primary.add(item)
    globals.set(item.name, placeholder(item, order))
  })

  const members = new Map<TopLevel, ReadonlySet<ClassMember>>()
  program.items.forEach((item, order) => {
    if (!primary.has(item)) return
    if (item.kind === "var") {
      const type = resolveType(item.type.name, item.type.range, reporter, globals)
      globals.set(item.name, { kind: "variable", type, order, mutable: item.mutable })
    } else if (item.kind === "function") {
      globals.set(item.name, {
        kind: "function",
        name: item.name,
        params: item.params.map((p) => resolveType(p.type.name, p.type.range, reporter, globals)),
        returnType: resolveType(item.returnType.name, item.returnType.range, reporter, globals),
      })
    } else {
      const symbol = globals.get(item.name)
      if (symbol?.kind === "class") members.set(item, registerMembers(item, symbol.info, globals, reporter))
    }
  })
  return { globals, primary, members }
}

function placeholder(item: TopLevel, order: number): Symbol {
  if (item.kind === "class") {
    const info = { name: item.name, start: item.range.start, fields: new Map(), methods: new Map(), ctorParams: [] }
    return { kind: "class", info }
  }
  if (item.kind === "var") return { kind: "variable", type: "error", order, mutable: item.mutable }
  return { kind: "function", name: item.name, params: [], returnType: "error" }
}

export type { VarDecl }
