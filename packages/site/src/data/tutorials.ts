/** チュートリアルの並べ方・呼び方。章は「第 N 部の M 番目」で、N-M と呼ぶ。 */
export interface LessonData {
  readonly part: number
  readonly chapter: number
}

/** URL の部分（ファイル名の頭の番号を除く）。 */
export const slugOf = (id: string): string => id.replace(/^\d+-\d+-/, "")

/** 並べ替えの値（1-1, 1-2, …, 2-1, …の順）。 */
export const sortKey = (data: LessonData): number => data.part * 100 + data.chapter

/** 「1-3」のような、番号の呼び方。 */
export const labelOf = (data: LessonData): string => `${data.part}-${data.chapter}`
