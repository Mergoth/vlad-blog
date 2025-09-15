import type { APIRoute } from 'astro'
import { getStore } from '@netlify/blobs'

// CASCADE: Minimal reactions API using Netlify Blobs
// Data shape per key: { up: number; down: number; emojis: Record<string, number> }

const STORE_NAME = 'reactions'
const store = getStore(STORE_NAME)

function keyFor(slug: string) {
  // CASCADE_HINT: Keep key simple and deterministic
  return encodeURIComponent(slug)
}

async function readCounts(slug: string) {
  const key = keyFor(slug)
  const raw = await store.get(key, { type: 'json' })
  if (raw && typeof raw === 'object') {
    return raw as { up: number; down: number; emojis: Record<string, number> }
  }
  return { up: 0, down: 0, emojis: {} as Record<string, number> }
}

async function writeCounts(slug: string, data: { up: number; down: number; emojis: Record<string, number> }) {
  const key = keyFor(slug)
  await store.setJSON(key, data)
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const slug = url.searchParams.get('slug') || ''
    if (!slug) {
      return new Response(JSON.stringify({ error: 'missing slug' }), { status: 400 })
    }
    const counts = await readCounts(slug)
    return new Response(JSON.stringify({ slug, counts }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    // CASCADE: Log and fail gracefully
    console.error('reactions GET error', err)
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500 })
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({})) as { slug?: string; reaction?: string }
    const slug = body.slug || ''
    const reaction = body.reaction || ''
    if (!slug || !reaction) {
      return new Response(JSON.stringify({ error: 'missing slug or reaction' }), { status: 400 })
    }

    const counts = await readCounts(slug)

    if (reaction === 'up') counts.up += 1
    else if (reaction === 'down') counts.down += 1
    else {
      // treat as emoji key
      const key = String(reaction)
      counts.emojis[key] = (counts.emojis[key] || 0) + 1
    }

    await writeCounts(slug, counts)
    return new Response(JSON.stringify({ slug, counts }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    // CASCADE: Log and fail gracefully
    console.error('reactions POST error', err)
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500 })
  }
}
