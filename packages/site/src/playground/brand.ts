import logoSvg from "../../../../assets/logo/kururi-wordmark.svg?raw"
import iconUrl from "../../../../assets/logo/kururi-icon.svg?url"

/** ヘッダーにロゴ（文字色は currentColor）を出し、ファビコンを設定する */
export function applyBrand(): void {
  const heading = document.querySelector("header h1")
  if (heading !== null) heading.innerHTML = logoSvg
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.head.appendChild(Object.assign(document.createElement("link"), { rel: "icon" }))
  link.type = "image/svg+xml"
  link.href = iconUrl
}
