import type { Range } from "./tokens"

/** 構文木。作った後は変更しない。 */
export interface TypeRef {
  readonly name: string
  readonly range: Range
}

export type TemplateNodePart =
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "expr"; readonly expr: Expr }

export type BinaryOp =
  | "+" | "-" | "*" | "/" | "%"
  | "==" | "!=" | "<" | "<=" | ">" | ">="
  | "and" | "or"

export type Expr =
  | { readonly kind: "int"; readonly text: string; readonly range: Range }
  | { readonly kind: "float"; readonly text: string; readonly range: Range }
  | { readonly kind: "string"; readonly value: string; readonly range: Range }
  | { readonly kind: "bool"; readonly value: boolean; readonly range: Range }
  | { readonly kind: "ident"; readonly name: string; readonly range: Range }
  | { readonly kind: "template"; readonly parts: readonly TemplateNodePart[]; readonly range: Range }
  | { readonly kind: "unary"; readonly op: "-" | "not"; readonly operand: Expr; readonly range: Range }
  | { readonly kind: "binary"; readonly op: BinaryOp; readonly left: Expr; readonly right: Expr; readonly range: Range }
  | { readonly kind: "paren"; readonly inner: Expr; readonly range: Range }
  | { readonly kind: "array"; readonly elements: readonly Expr[]; readonly range: Range }
  | { readonly kind: "index"; readonly target: Expr; readonly index: Expr; readonly range: Range }
  | { readonly kind: "member"; readonly object: Expr; readonly name: string; readonly nameRange: Range; readonly range: Range }
  | { readonly kind: "call"; readonly callee: Expr; readonly args: readonly Expr[]; readonly range: Range }

export interface VarDecl {
  readonly kind: "var"
  readonly mutable: boolean
  readonly name: string
  readonly nameRange: Range
  readonly type: TypeRef
  readonly init: Expr
  readonly range: Range
}

export interface ExprStmt {
  readonly kind: "exprStmt"
  readonly expr: Expr
  readonly range: Range
}

export type AssignOp = "=" | "+=" | "-=" | "*=" | "/=" | "%="

export interface AssignStmt {
  readonly kind: "assign"
  readonly op: AssignOp
  readonly target: Expr
  readonly value: Expr
  readonly range: Range
}

export interface IfBranch {
  readonly condition: Expr
  readonly body: readonly Stmt[]
}

export interface IfStmt {
  readonly kind: "if"
  /** if と、続く elseif の分（1 つ以上） */
  readonly branches: readonly IfBranch[]
  readonly otherwise: readonly Stmt[] | undefined
  readonly range: Range
}

export interface WhileStmt {
  readonly kind: "while"
  readonly condition: Expr
  readonly body: readonly Stmt[]
  readonly range: Range
}

export interface RepeatStmt {
  readonly kind: "repeat"
  readonly name: string
  readonly nameRange: Range
  readonly count: Expr
  readonly body: readonly Stmt[]
  readonly range: Range
}

export interface ForeachStmt {
  readonly kind: "foreach"
  readonly name: string
  readonly nameRange: Range
  readonly iterable: Expr
  readonly body: readonly Stmt[]
  readonly range: Range
}

export interface JumpStmt {
  readonly kind: "break" | "continue"
  readonly range: Range
}

export type Stmt = VarDecl | ExprStmt | AssignStmt | IfStmt | WhileStmt | RepeatStmt | ForeachStmt | JumpStmt

export interface Param {
  readonly name: string
  readonly nameRange: Range
  readonly type: TypeRef
}

export interface FunctionDecl {
  readonly kind: "function"
  readonly name: string
  readonly nameRange: Range
  readonly params: readonly Param[]
  readonly returnType: TypeRef
  readonly body: readonly Stmt[]
  readonly range: Range
}

export type TopLevel = VarDecl | FunctionDecl

export interface Program {
  readonly items: readonly TopLevel[]
}
