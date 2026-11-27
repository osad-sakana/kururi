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

export const collections = { tutorials }
