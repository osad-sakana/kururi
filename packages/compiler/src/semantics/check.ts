import type { Reporter } from "../reporter"
import type { Expr, FunctionDecl, Program, Stmt, TypeRef, VarDecl } from "../syntax/ast"
import { ExprChecker } from "./check-expr"
import type { Scope, Symbol } from "./scope"
import { VALUE_TYPE_NAMES, isAssignable } from "./types"
import type { Type } from "./types"

export interface CheckResult {
  /** 式ごとの型 */
  readonly types: ReadonlyMap<Expr, Type>
}

/** 名前の解決と型の検査。診断は reporter にためる。 */
export function check(program: Program, reporter: Reporter): CheckResult {
  const exprs = new ExprChecker(reporter)
  const globals = registerTopLevel(program, reporter)

  program.items.forEach((item, order) => {
    if (item.kind === "var") {
      const scope: Scope = { globals, locals: new Map(), visibleBefore: order }
      const symbol = globals.get(item.name)
      const declared = symbol?.kind === "variable" && symbol.order === order ? symbol.type : "error"
      checkInit(item, declared, scope, exprs, reporter)
    } else {
      checkFunction(item, globals, exprs, reporter)
    }
  })

  const first = program.items[0]
  const hasMain = program.items.some((item) => item.kind === "function" && item.name === "main")
  if (first !== undefined && !hasMain) reporter.report("K0204", first.nameRange)

  return { types: exprs.types }
}

function resolveType(ref: TypeRef, reporter: Reporter, allowVoid: boolean): Type {
  if (VALUE_TYPE_NAMES.has(ref.name) || (allowVoid && ref.name === "void")) return ref.name as Type
  reporter.report("K0208", ref.range, { name: ref.name })
  return "error"
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
        ? { kind: "variable", type: resolveType(item.type, reporter, false), order }
        : { kind: "function", name: item.name },
    )
  })
  return globals
}

function checkInit(decl: VarDecl, declared: Type, scope: Scope, exprs: ExprChecker, reporter: Reporter): void {
  const actual = exprs.valueType(decl.init, scope)
  if (declared !== "error" && actual !== "error" && !isAssignable(declared, actual)) {
    reporter.report("K0301", decl.init.range, { expected: declared, actual })
  }
}

function checkFunction(fn: FunctionDecl, globals: ReadonlyMap<string, Symbol>, exprs: ExprChecker, reporter: Reporter): void {
  if (fn.name !== "main") {
    reporter.report("K0002", fn.nameRange, { text: `function ${fn.name}` })
    return
  }
  const [firstParam] = fn.params
  if (firstParam !== undefined) reporter.report("K0207", firstParam.nameRange)
  if (fn.returnType.name !== "void") reporter.report("K0207", fn.returnType.range)

  let locals: ReadonlyMap<string, Type> = new Map()
  for (const stmt of fn.body) {
    locals = checkStatement(stmt, { globals, locals, visibleBefore: undefined }, exprs, reporter)
  }
}

/** 文を調べて、次の文から見えるローカル変数の表を返す。 */
function checkStatement(stmt: Stmt, scope: Scope, exprs: ExprChecker, reporter: Reporter): ReadonlyMap<string, Type> {
  if (stmt.kind === "exprStmt") {
    exprs.typeOf(stmt.expr, scope)
    if (stmt.expr.kind !== "call") reporter.report("K0307", stmt.expr.range)
    return scope.locals
  }
  const declared = resolveType(stmt.type, reporter, false)
  checkInit(stmt, declared, scope, exprs, reporter)
  if (scope.locals.has(stmt.name) || scope.globals.has(stmt.name)) {
    reporter.report("K0202", stmt.nameRange, { name: stmt.name })
    return scope.locals
  }
  return new Map([...scope.locals, [stmt.name, declared]])
}
