import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

const tutorials = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/tutorials" }),
  schema: z.object({
    title: z.string(),
    /** これまでの回の番号（新しい構成の章では書かない） */
    order: z.number().int().optional(),
    /** 新しい構成：第 N 部の、M 番目の章（N-M） */
    part: z.number().int().optional(),
    partTitle: z.string().optional(),
    chapter: z.number().int().optional(),
    /** 一覧に出す 1 行の説明 */
    summary: z.string(),
    /** この回で学ぶ概念 */
    concept: z.string(),
    /** 今回できるようになること（1 文） */
    goal: z.string().optional(),
    /** 使う前の章 */
    needs: z.string().optional(),
    /** この章で出る文の種類（式文・宣言代入文・ブロック文・ジャンプ文） */
    kind: z.string().optional(),
    /** 新しい言葉（リンクは付けない。学習者を、難しい言語仕様に飛ばさないため） */
    words: z.array(z.string()).optional(),
  }),
})

/** 言語仕様。他の言語を知っている人が、Kururi の書き方を引くためのページ */
const spec = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/spec" }),
  schema: z.object({
    title: z.string(),
    order: z.number().int(),
    /** 一覧に出す 1 行の説明 */
    summary: z.string(),
  }),
})

export const collections = { tutorials, spec }
