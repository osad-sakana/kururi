import type { Reporter } from "../reporter"
import type { AssignStmt, Expr, Stmt } from "../syntax/ast"
import type { Range } from "../syntax/tokens"
import type { ExprChecker } from "./check-expr"
import type { ClassInfo, Local, Scope, Symbol } from "./scope"
import { VALUE_TYPE_NAMES, elementType, isArray, isAssignable, isClassType, typeLabel } from "./types"
import type { Type } from "./types"

type Locals = ReadonlyMap<string, Local>

/** 1 つの関数をチェックしているあいだ共有する状態。 */
export interface FunctionContext {
  readonly globals: ReadonlyMap<string, Symbol>
  /** 今チェックしているクラス */
  readonly cls: ClassInfo | undefined
  readonly exprs: ExprChecker
  readonly reporter: Reporter
  /** この関数の戻り値の型 */
  readonly returnType: Type
  /** この関数で宣言した名前と型（兄弟のブロックで型が食い違わないか調べる用） */
  readonly declared: Map<string, Type>
  /** この関数の中で書き換えるトップレベルの let（global 宣言が必要） */
  readonly globalWrites: Set<string>
}

/** 型の名前を型にする。クラスは、定義より前の行では使えない（本体の中は使える）。 */
export function resolveType(
  name: string,
  range: Range,
  reporter: Reporter,
  allowVoid: boolean,
  globals: ReadonlyMap<string, Symbol>,
): Type {
  const base = name.replace(/(\[\])+$/, "")
  if (VALUE_TYPE_NAMES.has(base) || (allowVoid && name === "void")) return name as Type
  const symbol = globals.get(base)
  if (symbol?.kind === "class") {
    if (range.start >= symbol.info.start) return name as Type
    reporter.report("K0403", range, { name: base })
    return "error"
  }
  reporter.report("K0208", range, { name: base })
  return "error"
}

/** ブロックの中の文を順に調べる。ブロックの中の変数は、ブロックの外へ出ると見えなくなる。 */
export function checkBlock(stmts: readonly Stmt[], outer: Locals, loopDepth: number, ctx: FunctionContext): void {
  let locals = outer
  for (const stmt of stmts) {
    locals = checkStatement(stmt, locals, loopDepth, ctx)
  }
}

function scopeOf(locals: Locals, ctx: FunctionContext): Scope {
  return { globals: ctx.globals, locals, visibleBefore: undefined, cls: ctx.cls }
}

function checkStatement(stmt: Stmt, locals: Locals, loopDepth: number, ctx: FunctionContext): Locals {
  const scope = scopeOf(locals, ctx)
  switch (stmt.kind) {
    case "var":
      return checkVar(stmt, locals, scope, ctx)
    case "exprStmt":
      ctx.exprs.typeOf(stmt.expr, scope)
      if (stmt.expr.kind !== "call") ctx.reporter.report("K0307", stmt.expr.range)
      return locals
    case "assign":
      checkAssign(stmt, scope, ctx)
      return locals
    case "if":
      for (const branch of stmt.branches) {
        checkCondition(branch.condition, "条件", "boolean", scope, ctx)
        checkBlock(branch.body, locals, loopDepth, ctx)
      }
      if (stmt.otherwise !== undefined) checkBlock(stmt.otherwise, locals, loopDepth, ctx)
      return locals
    case "while":
      checkCondition(stmt.condition, "条件", "boolean", scope, ctx)
      checkBlock(stmt.body, locals, loopDepth + 1, ctx)
      return locals
    case "repeat": {
      checkCondition(stmt.count, "repeat の回数", "int", scope, ctx)
      const inner = declare(stmt.name, "int", "loop", stmt.nameRange, locals, ctx)
      checkBlock(stmt.body, inner, loopDepth + 1, ctx)
      return locals
    }
    case "foreach": {
      const iterable = ctx.exprs.valueType(stmt.iterable, scope)
      if (iterable !== "error" && !isArray(iterable)) {
        ctx.reporter.report("K0306", stmt.iterable.range, { what: "foreach の対象", expected: "配列", actual: iterable })
      }
      const element = isArray(iterable) ? elementType(iterable) : "error"
      const inner = declare(stmt.name, element, "loop", stmt.nameRange, locals, ctx)
      checkBlock(stmt.body, inner, loopDepth + 1, ctx)
      return locals
    }
    case "return":
      checkReturn(stmt, scope, ctx)
      return locals
    case "break":
    case "continue":
      if (loopDepth === 0) ctx.reporter.report("K0210", stmt.range, { name: stmt.kind })
      return locals
  }
}

function checkVar(stmt: Extract<Stmt, { kind: "var" }>, locals: Locals, scope: Scope, ctx: FunctionContext): Locals {
  const declared = resolveType(stmt.type.name, stmt.type.range, ctx.reporter, false, ctx.globals)
  ctx.exprs.checkAssignable(stmt.init, scope, declared)
  return declare(stmt.name, declared, stmt.mutable ? "let" : "const", stmt.nameRange, locals, ctx)
}

/** 名前を宣言する。シャドーイングと、兄弟のブロックでの型の食い違いを調べる。 */
export function declare(name: string, type: Type, kind: Local["kind"], range: Range, locals: Locals, ctx: FunctionContext): Locals {
  if (locals.has(name) || ctx.globals.has(name)) {
    ctx.reporter.report("K0202", range, { name })
    return locals
  }
  const other = ctx.declared.get(name)
  if (other !== undefined && other !== type && type !== "error" && other !== "error") {
    ctx.reporter.report("K0211", range, { name, other, actual: type })
  }
  ctx.declared.set(name, type)
  return new Map([...locals, [name, { type, kind }]])
}

function checkCondition(expr: Expr, what: string, expected: Type, scope: Scope, ctx: FunctionContext): void {
  const actual = ctx.exprs.valueType(expr, scope)
  if (actual !== "error" && actual !== expected) {
    ctx.reporter.report("K0306", expr.range, { what, expected, actual })
  }
}

/** 代入先の型。代入できない先なら診断を出して "error"。 */
function targetType(target: Expr, scope: Scope, ctx: FunctionContext): Type {
  if (target.kind === "index") return elementTargetType(target, scope, ctx)
  if (target.kind === "member") return fieldTargetType(target, scope, ctx)
  if (target.kind !== "ident") return "error"
  const name = target.name
  const local = scope.locals.get(name)
  if (local !== undefined) {
    if (local.kind === "const") ctx.reporter.report("K0212", target.range, { name })
    if (local.kind === "loop") ctx.reporter.report("K0213", target.range, { name })
    return local.kind === "let" ? local.type : "error"
  }
  const global = ctx.globals.get(name)
  if (global?.kind === "variable") {
    if (!global.mutable) {
      ctx.reporter.report("K0212", target.range, { name })
      return "error"
    }
    ctx.globalWrites.add(name)
    return global.type
  }
  // 名前がない・関数の名前など：式として調べて、同じ診断を出す
  ctx.exprs.typeOf(target, scope)
  return "error"
}

/** a[i] への代入。const の配列でも要素は書き換えられるが、文字列は書き換えられない。 */
function elementTargetType(target: Extract<Expr, { kind: "index" }>, scope: Scope, ctx: FunctionContext): Type {
  const base = ctx.exprs.valueType(target.target, scope)
  if (base === "string") {
    ctx.reporter.report("K0316", target.range)
    return "error"
  }
  if (base === "error") return "error"
  return ctx.exprs.typeOf(target, scope)
}

/** obj.field への代入。クラスのフィールドだけが対象で、length などには代入できない。 */
function fieldTargetType(target: Extract<Expr, { kind: "member" }>, scope: Scope, ctx: FunctionContext): Type {
  const base = ctx.exprs.valueType(target.object, scope)
  if (base === "error") return "error"
  if (!isClassType(base)) {
    ctx.reporter.report("K0112", target.range)
    return "error"
  }
  return ctx.exprs.typeOf(target, scope)
}

function checkAssign(stmt: AssignStmt, scope: Scope, ctx: FunctionContext): void {
  const target = targetType(stmt.target, scope, ctx)
  ctx.exprs.types.set(stmt.target, target)
  if (stmt.op === "=") {
    ctx.exprs.checkAssignable(stmt.value, scope, target)
    return
  }
  const value = ctx.exprs.valueType(stmt.value, scope)
  if (target === "error" || value === "error") return
  const result = ctx.exprs.combine(stmt.op.slice(0, -1), target, value, stmt.target, stmt.value, stmt.range)
  if (result !== "error" && !isAssignable(target, result)) {
    ctx.reporter.report("K0301", stmt.value.range, { expected: target, actual: typeLabel(result) })
  }
}

function checkReturn(stmt: Extract<Stmt, { kind: "return" }>, scope: Scope, ctx: FunctionContext): void {
  const expected = ctx.returnType
  if (stmt.value === undefined) {
    if (expected !== "void" && expected !== "error") ctx.reporter.report("K0320", stmt.range, { expected })
    return
  }
  if (expected === "void") {
    ctx.exprs.valueType(stmt.value, scope, true)
    ctx.reporter.report("K0321", stmt.value.range)
    return
  }
  ctx.exprs.checkAssignable(stmt.value, scope, expected)
}

/** この文の並びを最後まで実行すると、必ず return に行き着くか（return 抜けの検出用）。 */
export function alwaysReturns(stmts: readonly Stmt[]): boolean {
  return stmts.some((stmt) => {
    if (stmt.kind === "return") return true
    if (stmt.kind === "if") {
      return (
        stmt.otherwise !== undefined &&
        alwaysReturns(stmt.otherwise) &&
        stmt.branches.every((branch) => alwaysReturns(branch.body))
      )
    }
    // while true で break がなければ、ループの外へは出ない
    return stmt.kind === "while" && stmt.condition.kind === "bool" && stmt.condition.value && !containsBreak(stmt.body)
  })
}

/** ループの本体から、そのループを抜ける break があるか（入れ子のループの break は数えない）。 */
function containsBreak(stmts: readonly Stmt[]): boolean {
  return stmts.some((stmt) => {
    if (stmt.kind === "break") return true
    if (stmt.kind === "if") {
      return stmt.branches.some((b) => containsBreak(b.body)) || (stmt.otherwise !== undefined && containsBreak(stmt.otherwise))
    }
    return false
  })
}
