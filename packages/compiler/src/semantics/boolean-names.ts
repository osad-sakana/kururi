import type { Reporter } from "../reporter"
import type { ClassMember, FunctionDecl, Param, Program, Stmt, VarDecl } from "../syntax/ast"
import { namingProblem } from "../syntax/naming"
import type { Range } from "../syntax/tokens"

/**
 * boolean の名前は、is_ か has_ で始める（const は IS_ か HAS_）。
 * 対象は、型が boolean の変数・定数・引数・フィールドと、-> boolean の関数・メソッド。
 * boolean[] や boolean? は対象外。英字を含まない名前（日本語など）も対象外。
 * 名前の書き方（スネークケースなど）の違反と重なるときは、そちらを先に直してもらうので、ここでは出さない。
 */
export function checkBooleanNames(program: Program, reporter: Reporter): void {
  const check = (name: string, range: Range, constant: boolean): void => {
    if (!/[A-Za-z]/.test(name)) return
    if (namingProblem(name, constant ? "constant" : "snake") !== undefined) return
    const prefixes = constant ? ["IS_", "HAS_"] : ["is_", "has_"]
    if (prefixes.some((prefix) => name.startsWith(prefix))) return
    const suggestion = `${prefixes[0]}${name}`
    reporter.report("K0507", range, { name, suggestion, constant: constant ? "1" : "" }, { title: `「${suggestion}」に直す`, text: suggestion, renameAll: true })
  }

  const checkVar = (decl: VarDecl): void => {
    if (decl.type.name === "boolean") check(decl.name, decl.nameRange, !decl.mutable)
  }
  const checkParams = (params: readonly Param[]): void => {
    for (const param of params) if (param.type.name === "boolean") check(param.name, param.nameRange, false)
  }
  const checkStatements = (stmts: readonly Stmt[]): void => {
    for (const stmt of stmts) {
      if (stmt.kind === "var") checkVar(stmt)
      else if (stmt.kind === "if") {
        stmt.branches.forEach((branch) => checkStatements(branch.body))
        if (stmt.otherwise !== undefined) checkStatements(stmt.otherwise)
      } else if (stmt.kind === "while" || stmt.kind === "times" || stmt.kind === "foreach") checkStatements(stmt.body)
    }
  }
  const checkFunction = (fn: FunctionDecl): void => {
    if (fn.returnType.name === "boolean") check(fn.name, fn.nameRange, false)
    checkParams(fn.params)
    checkStatements(fn.body)
  }
  const checkMember = (member: ClassMember): void => {
    if (member.kind === "field") {
      if (member.type.name === "boolean") check(member.name, member.nameRange, false)
    } else if (member.kind === "method") checkFunction(member.fn)
    else {
      checkParams(member.params)
      checkStatements(member.body)
    }
  }

  for (const item of program.items) {
    if (item.kind === "var") checkVar(item)
    else if (item.kind === "function") checkFunction(item)
    else item.members.forEach(checkMember)
  }
}
