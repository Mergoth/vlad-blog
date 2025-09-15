import type { APIRoute } from 'astro'
import { getStore } from '@netlify/blobs'
import webpush from 'web-push'

// CASCADE: Broadcast a notification to all saved Push API subscriptions
function getSubsStore() {
  // CASCADE_HINT: Lazy init to avoid build-time blobs env requirement
  return getStore('push-subscribers')
}

const SUBJECT = process.env.VAPID_CONTACT || 'mailto:admin@example.com'
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ''

// Simple protection to avoid abuse of the broadcast endpoint
const ADMIN_TOKEN = process.env.PUSH_ADMIN_TOKEN || ''

function ensureConfigured() {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    throw new Error('missing VAPID keys')
  }
  webpush.setVapidDetails(SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (ADMIN_TOKEN) {
      const token = request.headers.get('x-admin-token') || ''
      if (token !== ADMIN_TOKEN) return new Response('forbidden', { status: 403 })
    }

    ensureConfigured()

    const body = await request.json().catch(() => ({})) as {
      title?: string
      body?: string
      url?: string
      icon?: string
      tag?: string
    }

    const payload = JSON.stringify({
      title: body.title || 'New post on Vlad Blog',
      body: body.body || 'Click to read the latest update.',
      url: body.url || '/',
      icon: body.icon || '/favicon.svg',
      tag: body.tag || 'blog-update',
    })

    let sent = 0
    let removed = 0

    // Iterate over all saved subscriptions
    let cursor: string | undefined = undefined
    do {
      // @ts-ignore list types in blobs
      const res = await getSubsStore().list({ cursor })
      cursor = res.cursor
      const items: Array<{ key: string }> = res.blobs || res.items || []

      for (const item of items) {
        try {
          const sub = await getSubsStore().get(item.key, { type: 'json' })
          if (!sub) continue
          await webpush.sendNotification(sub as any, payload)
          sent++
        } catch (err: any) {
          const statusCode = err?.statusCode || err?.status || 0
          // Remove invalid/expired subscription
          if (statusCode === 404 || statusCode === 410) {
            try {
              // @ts-ignore delete may not be typed
              await getSubsStore().delete?.(item.key)
              removed++
            } catch {}
          } else {
            console.error('broadcast send error', err)
          }
        }
      }
    } while (cursor)

    return new Response(JSON.stringify({ ok: true, sent, removed }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    console.error('push broadcast error', err)
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500 })
  }
}
