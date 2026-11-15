import type { Diagnostic, Severity, Span } from "./types"

/**
 * 診断コードの体系：K + 4 桁。上位 2 桁がカテゴリ。
 *   K00xx 内部（未対応など）  K01xx 構文  K02xx 名前・スコープ
 *   K03xx 型                  K04xx クラス・アクセス  K05xx 予約語
 */
export type DiagnosticCategory =
  | "internal"
  | "syntax"
  | "name"
  | "type"
  | "class"
  | "reserved"
  | "unknown"

const CATEGORY_BY_PREFIX: Readonly<Record<string, DiagnosticCategory>> = {
  "00": "internal",
  "01": "syntax",
  "02": "name",
  "03": "type",
  "04": "class",
  "05": "reserved",
}

export function categoryOf(code: string): DiagnosticCategory {
  const match = /^K(\d{2})\d{2}$/.exec(code)
  if (match === null) return "unknown"
  return CATEGORY_BY_PREFIX[match[1] ?? ""] ?? "unknown"
}

type Params = Readonly<Record<string, string>>

interface CatalogEntry {
  readonly code: string
  readonly severity: Severity
  readonly message: (params: Params) => string
  readonly label?: (params: Params) => string
  readonly hint?: (params: Params) => string
}

/** 診断の文言はここに集める。文言の見直しはこのファイルだけで済むようにする。 */
export const DIAGNOSTIC_CATALOG = {
  K0001: {
    code: "K0001",
    severity: "error",
    message: ({ text = "" }) => `「${text}」から始まる書き方には、まだ対応していません`,
    hint: () => "Kururi は開発中です。対応している書き方は PLAN.md を見てください",
  },
} as const satisfies Readonly<Record<string, CatalogEntry>>

export type DiagnosticCode = keyof typeof DIAGNOSTIC_CATALOG

export function createDiagnostic(code: DiagnosticCode, span: Span, params: Params = {}): Diagnostic {
  const entry: CatalogEntry = DIAGNOSTIC_CATALOG[code]
  const diagnostic: Diagnostic = {
    code: entry.code,
    severity: entry.severity,
    message: entry.message(params),
    span,
    ...(entry.label === undefined ? {} : { label: entry.label(params) }),
    ...(entry.hint === undefined ? {} : { hint: entry.hint(params) }),
  }
  return Object.freeze(diagnostic)
}
