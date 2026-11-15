import type { Param, Stmt } from "../syntax/ast"
import type { Range } from "../syntax/tokens"
import { alwaysReturns, checkBlock, declare } from "./check-stmt"
import type { FunctionContext } from "./check-stmt"
import type { Local } from "./scope"
import type { Type } from "./types"

export interface Callable {
  readonly name: string
  readonly nameRange: Range
  readonly params: readonly Param[]
  readonly body: readonly Stmt[]
}

/** 関数・メソッド・constructor の中を調べて、書き換えたトップレベルの let の名前を返す。 */
export function checkCallable(
  fn: Callable,
  paramTypes: readonly Type[],
  ctx: FunctionContext,
  options: { readonly isMain: boolean },
): readonly string[] {
  let locals: ReadonlyMap<string, Local> = new Map()
  fn.params.forEach((param, i) => {
    locals = declare(param.name, paramTypes[i] ?? "error", "let", param.nameRange, locals, ctx)
  })
  checkBlock(fn.body, locals, 0, ctx)
  const { returnType } = ctx
  if (!options.isMain && returnType !== "void" && returnType !== "error" && !alwaysReturns(fn.body)) {
    ctx.reporter.report("K0322", fn.nameRange, { name: fn.name, expected: returnType })
  }
  return [...ctx.globalWrites]
}
