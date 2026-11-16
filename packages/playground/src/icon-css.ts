import { ICON_KINDS, type IconKind } from "./line-icons"

/** 線画アイコン（24x24、線の太さ 2）。形は Lucide の考え方に倣った。 */
const SHAPES: Readonly<Record<IconKind, string>> = {
  var: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  const: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  function: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3"/><path d="M9 11.2h5.7"/>',
  class: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
  constructor: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  method: '<path d="M9 20c2.5 0 3.5-1 3.5-3.5V8c0-2.5 1-3.8 3.5-4"/><path d="M8 12h8"/>',
  fields: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  if: '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/>',
  else: '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/>',
  for: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  while:
    '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M10.5 10.5a1.5 1.5 0 1 1 2 1.4c-.6.3-1 .7-1 1.3"/><path d="M12 15.5h.01"/>',
  return: '<polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
}

/** 宣言は寒色、制御構文は暖色。else は薄くする。 */
const COLORS: Readonly<Record<IconKind, string>> = {
  var: "#3b82f6",
  const: "#8b5cf6",
  function: "#10b981",
  class: "#06b6d4",
  constructor: "#6366f1",
  method: "#14b8a6",
  fields: "#0ea5e9",
  if: "#f59e0b",
  else: "#f59e0b",
  for: "#f97316",
  while: "#f97316",
  return: "#ef4444",
}

function dataUri(shape: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shape}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/** アイコンは CSS の mask で描く（色を変えやすく、ダークテーマにも合う）。 */
export function iconCss(): string {
  const base = ".kururi-icon { width: 14px !important; margin-left: 4px; height: 100%; max-height: 18px; background-color: currentColor; mask: center / 14px 14px no-repeat; -webkit-mask: center / 14px 14px no-repeat; cursor: help; }"
  const rules = ICON_KINDS.map((kind) => {
    const uri = dataUri(SHAPES[kind])
    const opacity = kind === "else" ? " opacity: 0.55;" : ""
    return `.kururi-icon-${kind} { color: ${COLORS[kind]}; mask-image: ${uri}; -webkit-mask-image: ${uri};${opacity} }`
  })
  return [base, ...rules].join("\n")
}
