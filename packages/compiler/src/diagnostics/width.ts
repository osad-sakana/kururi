/** 端末での表示幅。全角（東アジアの全角・広い文字）は 2、それ以外は 1。 */
export function displayWidth(text: string): number {
  let width = 0
  for (const ch of text) {
    width += isWide(ch.codePointAt(0) ?? 0) ? 2 : 1
  }
  return width
}

function isWide(cp: number): boolean {
  return (
    (cp >= 0x1100 && cp <= 0x115f) || // ハングル字母
    (cp >= 0x2e80 && cp <= 0x303e) || // CJK 部首・記号
    (cp >= 0x3041 && cp <= 0x33ff) || // ひらがな・カタカナ・CJK 記号
    (cp >= 0x3400 && cp <= 0x4dbf) || // CJK 拡張 A
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK 統合漢字
    (cp >= 0xa000 && cp <= 0xa4cf) || // イ語
    (cp >= 0xac00 && cp <= 0xd7a3) || // ハングル音節
    (cp >= 0xf900 && cp <= 0xfaff) || // CJK 互換漢字
    (cp >= 0xfe30 && cp <= 0xfe6f) || // CJK 互換形
    (cp >= 0xff00 && cp <= 0xff60) || // 全角形
    (cp >= 0xffe0 && cp <= 0xffe6) || // 全角記号
    (cp >= 0x20000 && cp <= 0x3fffd) // CJK 拡張 B 以降
  )
}
