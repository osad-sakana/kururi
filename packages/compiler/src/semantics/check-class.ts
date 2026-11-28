import type { Reporter } from "../reporter"
import type { ClassDecl, ClassMember, ConstructorDecl, Stmt } from "../syntax/ast"
import type { ExprChecker } from "./check-expr"
import { checkCallable } from "./check-function"
import { resolveType } from "./check-stmt"
import type { FunctionContext } from "./check-stmt"
import type { ClassInfo, Scope, Symbol } from "./scope"
import { NULL_TYPE, isNullable } from "./types"
import type { Type } from "./types"

type Globals = ReadonlyMap<string, Symbol>

/** クラスのメンバの署名を、クラスの形（ClassInfo）に登録する。名前の重複は最初の 1 つだけ残す。 */
export function registerMembers(decl: ClassDecl, info: ClassInfo, globals: Globals, reporter: Reporter): ReadonlySet<ClassMember> {
  const accepted = new Set<ClassMember>()
  const names = new Set<string>()
  let hasConstructor = false
  const types = (list: readonly { type: { name: string; range: ClassDecl["range"] } }[]): Type[] =>
    list.map((p) => resolveType(p.type.name, p.type.range, reporter, globals))

  for (const member of decl.members) {
    if (member.kind === "constructor") {
      if (hasConstructor) {
        reporter.report("K0202", member.keywordRange, { name: "constructor" })
        continue
      }
      hasConstructor = true
      info.ctorParams = types(member.params)
    } else {
      const [name, nameRange] = member.kind === "field" ? [member.name, member.nameRange] : [member.fn.name, member.fn.nameRange]
      if (names.has(name)) {
        reporter.report("K0202", nameRange, { name })
        continue
      }
      names.add(name)
      if (member.kind === "field") {
        info.fields.set(name, {
          type: resolveType(member.type.name, member.type.range, reporter, globals),
          access: member.access,
          hasInit: member.init !== undefined,
        })
      } else {
        info.methods.set(name, {
          params: types(member.fn.params),
          returnType: resolveType(member.fn.returnType.name, member.fn.returnType.range, reporter, globals),
          access: member.access,
        })
      }
    }
    accepted.add(member)
  }
  return accepted
}

/** 初期値の式、メソッド、constructor の中を調べる。書き換えるトップレベルの let は globalWrites に入れる。 */
export function checkClass(
  decl: ClassDecl,
  info: ClassInfo,
  accepted: ReadonlySet<ClassMember>,
  base: Omit<FunctionContext, "returnType" | "declared" | "globalWrites" | "cls">,
  globalWrites: Map<object, readonly string[]>,
): void {
  const newContext = (returnType: Type): FunctionContext => ({
    ...base,
    cls: info,
    returnType,
    declared: new Map<string, Type>(),
    globalWrites: new Set<string>(),
  })
  const fieldScope: Scope = { globals: base.globals, locals: new Map(), visibleBefore: undefined, cls: info }
  let constructor: ConstructorDecl | undefined

  for (const member of decl.members) {
    if (!accepted.has(member)) continue
    if (member.kind === "field") {
      const field = info.fields.get(member.name)
      if (member.init !== undefined && field !== undefined) base.exprs.checkAssignable(member.init, fieldScope, field.type)
    } else if (member.kind === "method") {
      const signature = info.methods.get(member.fn.name)
      if (signature === undefined) continue
      globalWrites.set(member.fn, checkCallable(member.fn, signature.params, newContext(signature.returnType), { isMain: false }))
    } else {
      constructor = member
      const callable = { name: "constructor", nameRange: member.keywordRange, params: member.params, body: member.body }
      globalWrites.set(member, checkCallable(callable, info.ctorParams, newContext(NULL_TYPE), { isMain: false }))
    }
  }
  checkFieldsAssigned(decl, info, accepted, constructor, base.reporter)
}

/** 初期値のないフィールドは、constructor が必ず代入しなければならない。 */
function checkFieldsAssigned(
  decl: ClassDecl,
  info: ClassInfo,
  accepted: ReadonlySet<ClassMember>,
  constructor: ConstructorDecl | undefined,
  reporter: Reporter,
): void {
  for (const member of decl.members) {
    if (member.kind !== "field" || !accepted.has(member) || member.init !== undefined) continue
    const type = info.fields.get(member.name)?.type
    // T? のフィールドは、初期値がなければ null になる
    if (type === "error" || (type !== undefined && isNullable(type))) continue
    if (constructor === undefined || !definitelyAssigns(constructor.body, member.name)) {
      reporter.report("K0405", member.nameRange, { name: member.name })
    }
  }
}

/** 文の並びを実行すると、必ず self.name への代入を通るか（if は全部の分岐が通る場合だけ）。 */
function definitelyAssigns(stmts: readonly Stmt[], name: string): boolean {
  return stmts.some((stmt) => {
    if (stmt.kind === "assign") {
      const { target } = stmt
      return stmt.op === "=" && target.kind === "member" && target.object.kind === "self" && target.name === name
    }
    return (
      stmt.kind === "if" &&
      stmt.otherwise !== undefined &&
      definitelyAssigns(stmt.otherwise, name) &&
      stmt.branches.every((branch) => definitelyAssigns(branch.body, name))
    )
  })
}

export type { ExprChecker }
