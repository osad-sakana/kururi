import logoSvg from "../../../../assets/logo/kururi-wordmark.svg?raw"
import iconUrl from "../../../../assets/logo/kururi-icon.svg?url"

/** ヘッダーにロゴ（文字色は currentColor）を出し、ファビコンを設定する */
export function applyBrand(): void {
  const heading = document.querySelector("header h1")
  if (heading !== null) {
    heading.innerHTML = logoSvg
    prepareBulb(heading)
  }
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.head.appendChild(Object.assign(document.createElement("link"), { rel: "icon" }))
  link.type = "image/svg+xml"
  link.href = iconUrl
}

const SVG_NS = "http://www.w3.org/2000/svg"
const RAYS = "M0 -17V-13M-12.7 -11.9L-9.9 -9.1M12.7 -11.9L9.9 -9.1"

/** ロゴの電球を、実行中にピカピカさせられるよう、光る面と光線を足して、動かす部分に印を付ける */
function prepareBulb(heading: Element): void {
  const svg = heading.querySelector("svg")
  const outer = svg?.querySelector<SVGGElement>("g[transform^='translate(276 20)']")
  const bulb = outer?.querySelector<SVGGElement>("g")
  if (svg === null || svg === undefined || outer === null || outer === undefined || bulb === null || bulb === undefined) return
  bulb.classList.add("logo-bulb")
  const glass = document.createElementNS(SVG_NS, "path")
  glass.setAttribute("class", "logo-glass")
  glass.setAttribute("d", "M-6 0V4A11 11 0 1 0 6 4V0Z")
  bulb.prepend(glass)
  const rays = document.createElementNS(SVG_NS, "g")
  rays.setAttribute("class", "logo-rays")
  rays.setAttribute("transform", "translate(276 20) scale(1.15)")
  const path = document.createElementNS(SVG_NS, "path")
  path.setAttribute("d", RAYS)
  rays.append(path)
  outer.after(rays)
}
