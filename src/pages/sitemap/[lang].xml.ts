// CASCADE_HINT: Simple per-locale sitemap
import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

const LOCALES = ['en','es','ru'] as const

export function getStaticPaths() {
  return LOCALES.map(lang => ({ params: { lang } }))
}

export const GET: APIRoute = async ({ params, site }) => {
  const lang = params.lang as (typeof LOCALES)[number]
  let valid = false
  for (const l of LOCALES) { if (l === lang) { valid = true; break } }
  if (!valid) return new Response('Not Found', { status: 404 })

  const base = site ? String(site) : ''
  const urls: string[] = []
  urls.push(`${base}/${lang}`)
  const posts = (await getCollection(lang)).filter((e) => e.slug.startsWith('posts/') && !e.data.draft)
  for (const e of posts) {
    const shortSlug = e.slug.replace(/^posts\//, '')
    urls.push(`${base}/${lang}/posts/${shortSlug}`)
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc></url>`) 
    .join('\n')}\n</urlset>`
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
