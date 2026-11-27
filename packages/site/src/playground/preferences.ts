import type { ResolvedTheme } from "./palette"

export type ThemePreference = "system" | "light" | "dark"

export const FONT_SIZE = { min: 10, max: 24, step: 1, initial: 13 } as const
const THEME_ORDER: readonly ThemePreference[] = ["system", "light", "dark"]
const FONT_KEY = "kururi.fontSize"
const THEME_KEY = "kururi.theme"

export function clampFontSize(size: number): number {
  if (!Number.isFinite(size)) return FONT_SIZE.initial
  return Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, Math.round(size)))
}

/** 自動 → ライト → ダーク → 自動 の順に切り替える */
export function nextThemePreference(current: ThemePreference): ThemePreference {
  return THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length] ?? "system"
}

export function resolveTheme(preference: ThemePreference, systemIsDark: boolean): ResolvedTheme {
  if (preference === "system") return systemIsDark ? "dark" : "light"
  return preference
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 保存できなくても、その場の表示は変えられる
  }
}

export function loadFontSize(): number {
  const saved = read(FONT_KEY)
  return saved === null ? FONT_SIZE.initial : clampFontSize(Number(saved))
}

export function saveFontSize(size: number): void {
  write(FONT_KEY, String(size))
}

export function loadThemePreference(): ThemePreference {
  const saved = read(THEME_KEY)
  return THEME_ORDER.find((value) => value === saved) ?? "system"
}

export function saveThemePreference(preference: ThemePreference): void {
  write(THEME_KEY, preference)
}
