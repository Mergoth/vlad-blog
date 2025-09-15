import React, { useEffect, useMemo, useState } from 'react'

// CASCADE: Small, self-contained reactions UI
// - Shows thumbs up/down and a few emojis
// - Fetches counts from /api/reactions?slug=...
// - Posts increment on click
// - Prevents multiple votes per type via localStorage key per slug

type Counts = { up: number; down: number; emojis: Record<string, number> }

const EMOJIS = ['❤️', '🎉', '😄'] as const

function lsKey(slug: string) {
  return `reactions:v1:${slug}`
}

function getSlugFromProps(slug?: string) {
  if (slug && slug.startsWith('/')) return slug
  return slug || (typeof window !== 'undefined' ? window.location.pathname : '')
}

export default function Reactions({ slug: slugProp, lang = 'en' }: { slug?: string; lang?: 'en' | 'es' | 'ru' }) {
  const slug = useMemo(() => getSlugFromProps(slugProp), [slugProp])
  const [counts, setCounts] = useState<Counts>({ up: 0, down: 0, emojis: {} })
  const [voted, setVoted] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // i18n-lite labels
  const t = {
    en: { title: 'Was this helpful?', up: 'Thumbs up', down: 'Thumbs down', thanks: 'Thanks!', add: 'Add' },
    es: { title: '¿Fue útil?', up: 'Pulgar arriba', down: 'Pulgar abajo', thanks: '¡Gracias!', add: 'Añadir' },
    ru: { title: 'Это было полезно?', up: 'Лайк', down: 'Дизлайк', thanks: 'Спасибо!', add: 'Добавить' },
  }[lang]

  useEffect(() => {
    // Load prior votes
    try {
      const raw = localStorage.getItem(lsKey(slug))
      setVoted(raw ? JSON.parse(raw) : {})
    } catch {}

    // Fetch counts
    const url = `/api/reactions?slug=${encodeURIComponent(slug)}`
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return (await r.json()).counts as Counts
      })
      .then((c) => setCounts({ up: c.up || 0, down: c.down || 0, emojis: c.emojis || {} }))
      .catch((e) => {
        console.error('reactions fetch error', e)
        setError('load')
      })
      .finally(() => setLoading(false))
  }, [slug])

  function rememberVote(key: string) {
    try {
      const next = { ...(voted || {}), [key]: true }
      setVoted(next)
      localStorage.setItem(lsKey(slug), JSON.stringify(next))
    } catch {
      // CASCADE_HINT: Ignore storage errors silently
    }
  }

  async function send(reaction: string) {
    if (voted[reaction]) return
    try {
      const r = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, reaction }),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = (await r.json()) as { counts: Counts }
      setCounts({ up: data.counts.up || 0, down: data.counts.down || 0, emojis: data.counts.emojis || {} })
      rememberVote(reaction)
      // CASCADE_HINT: Optionally emit GA event if present
      if (typeof window !== 'undefined' && (window as any).gtag) {
        ;(window as any).gtag('event', 'reaction', { reaction, slug })
      }
    } catch (e) {
      console.error('reactions post error', e)
      setError('post')
    }
  }

  const btnBase = 'inline-flex items-center px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-sm text-gray-700'
  const badge = 'ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700'

  return (
    <section aria-labelledby="reactions-title" className="mt-8">
      <h2 id="reactions-title" className="sr-only">{t.title}</h2>
      <div className="flex flex-wrap gap-3 items-center justify-center">
        <button className={btnBase + (voted['up'] ? ' opacity-60' : '')} onClick={() => send('up')} disabled={!!voted['up']} aria-label={t.up}>
          <span>👍</span>
          <span className={badge}>{counts.up}</span>
        </button>
        <button className={btnBase + (voted['down'] ? ' opacity-60' : '')} onClick={() => send('down')} disabled={!!voted['down']} aria-label={t.down}>
          <span>👎</span>
          <span className={badge}>{counts.down}</span>
        </button>
        {EMOJIS.map((e) => (
          <button key={e} className={btnBase + (voted[e] ? ' opacity-60' : '')} onClick={() => send(e)} disabled={!!voted[e]} aria-label={`${t.add} ${e}`}>
            <span>{e}</span>
            <span className={badge}>{counts.emojis?.[e] || 0}</span>
          </button>
        ))}
      </div>
      {loading && (
        <p className="mt-2 text-center text-xs text-gray-500">Loading…</p>
      )}
      {error && (
        <p className="mt-2 text-center text-xs text-red-500">Something went wrong. Please try later.</p>
      )}
      <p className="mt-2 text-center text-sm text-gray-600">{t.title}</p>
    </section>
  )
}
