// CASCADE_HINT: Simple dynamic OG SVG (no deps)
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const title = decodeURIComponent(String(params.title ?? 'Vlad Blog'))
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" x2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="system-ui, -apple-system, Segoe UI, Roboto" font-weight="700" font-size="64">${
    title.replace(/[<>]/g, '')
  }</text>
  <text x="50%" y="80%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" opacity="0.85" font-family="system-ui, -apple-system, Segoe UI, Roboto" font-size="28">vlad-blog</text>
</svg>`
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  })
}
