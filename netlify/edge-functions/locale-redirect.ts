// CASCADE_HINT: Netlify Edge redirect from "/" to best locale
// Deno/Edge-compatible (no Node APIs)

function pickBestLocale(header: string | null): 'en' | 'es' | 'ru' {
  const supported: Array<'en' | 'es' | 'ru'> = ['en', 'es', 'ru']
  if (!header) return 'en'
  const parts = header.split(',')
  const codes: string[] = []
  for (const p of parts) {
    const base = p.trim().split(';')[0].toLowerCase()
    if (base) codes.push(base)
  }
  for (const c of codes) {
    const base = (c.split('-')[0] as 'en' | 'es' | 'ru')
    for (const s of supported) {
      if (s === base) return base
    }
  }
  return 'en'
}

export default async function handler(request: Request, context: any) {
  const url = new URL(request.url)
  if (url.pathname !== '/') return context.next()
  const best = pickBestLocale(request.headers.get('accept-language'))
  const location = `/${best}`
  // CASCADE: log crucial step
  console.log('CASCADE: edge redirect', { from: url.pathname, to: location })
  return new Response(null, { status: 307, headers: { Location: location } })
}
