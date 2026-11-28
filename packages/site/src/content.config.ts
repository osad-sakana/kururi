import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

const tutorials = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/tutorials" }),
  schema: z.object({
    title: z.string(),
    order: z.number().int(),
    /** 一覧に出す 1 行の説明 */
    summary: z.string(),
    /** この回で学ぶ概念 */
    concept: z.string(),
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
