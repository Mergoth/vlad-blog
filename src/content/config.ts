// CASCADE_HINT: Three collections map to src/content/{en,es,ru}
import { defineCollection, z } from 'astro:content'

const postSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  date: z.date(),
  draft: z.boolean().default(false),
  id: z.string().optional(), // CASCADE_TODO: use to link translations across locales
})

export const collections = {
  en: defineCollection({ type: 'content', schema: postSchema }),
  es: defineCollection({ type: 'content', schema: postSchema }),
  ru: defineCollection({ type: 'content', schema: postSchema }),
}
