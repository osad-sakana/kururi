/** チュートリアルの並べ方・呼び方。新しい構成（第 N 部の N-M 章）と、これまでの 8 回が、いっしょにある間の橋渡し。 */
export interface LessonData {
  readonly order?: number | undefined
  readonly part?: number | undefined
  readonly chapter?: number | undefined
}

/** URL の部分（ファイル名の頭の番号を除く）。 */
export const slugOf = (id: string): string => id.replace(/^\d+-(?:\d+-)?/, "")

/** 新しい構成の章か。 */
export const isChapter = (data: LessonData): boolean => data.part !== undefined && data.chapter !== undefined

/** 並べ替えの値。新しい章（1-1, 1-2, …）を先に、これまでの回をそのあとに並べる。 */
export function sortKey(data: LessonData): number {
  return isChapter(data) ? (data.part ?? 0) * 100 + (data.chapter ?? 0) : 10_000 + (data.order ?? 0)
}

/** 「1-3」や「第 4 回」のような、番号の呼び方。 */
export function labelOf(data: LessonData): string {
  return isChapter(data) ? `${data.part}-${data.chapter}` : `第 ${data.order} 回`
}
