// CASCADE_HINT: Sitemap index pointing to per-locale sitemaps
import type { APIRoute } from 'astro'

const LOCALES = ['en','es','ru'] as const

export const GET: APIRoute = async ({ site }) => {
  const base = site ? String(site) : ''
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${LOCALES
    .map((l) => `  <sitemap><loc>${base}/sitemap/${l}.xml</loc></sitemap>`)
    .join('\n')}\n</sitemapindex>`
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
