import type { APIRoute } from 'astro'
import { getStore } from '@netlify/blobs'

// CASCADE: Store Push API subscriptions in Netlify Blobs
const STORE = getStore('push-subscribers')

function keyForEndpoint(endpoint: string) {
  // CASCADE_HINT: Keep deterministic key based on endpoint
  return encodeURIComponent(endpoint)
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const sub = await request.json().catch(() => null)
    if (!sub || !sub.endpoint) {
      return new Response(JSON.stringify({ error: 'invalid subscription' }), { status: 400 })
    }
    const key = keyForEndpoint(sub.endpoint)
    await STORE.setJSON(key, sub)
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } })
  } catch (err) {
    console.error('push subscribe error', err)
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500 })
  }
}

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const sub = await request.json().catch(() => null)
    const endpoint = sub?.endpoint || ''
    if (!endpoint) {
      return new Response(JSON.stringify({ error: 'missing endpoint' }), { status: 400 })
    }
    const key = keyForEndpoint(endpoint)
    // @ts-ignore - types may not include delete yet
    await STORE.delete?.(key)
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } })
  } catch (err) {
    console.error('push unsubscribe error', err)
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500 })
  }
}
