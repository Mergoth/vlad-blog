import type { APIRoute } from 'astro'
import { getStore } from '@netlify/blobs'
import { createHash } from 'node:crypto'

// CASCADE: Reactions API with rate limiting using Netlify Blobs
// Data shape per key: { up: number; down: number; emojis: Record<string, number> }

export const prerender = false

const STORE_NAME = 'reactions'
const RATE_LIMIT_STORE = 'reaction-limits'
const MAX_VOTES_PER_IP_PER_HOUR = 10

function getReactionsStore() {
  // CASCADE_HINT: Lazy init to avoid build-time blobs env requirement
  return getStore(STORE_NAME)
}

function getRateLimitStore() {
  return getStore(RATE_LIMIT_STORE)
}

function hashIP(ip: string): string {
  // CASCADE_HINT: Hash IP for privacy, keep rate limiting effective
  return createHash('sha256').update(ip + 'reactions-salt').digest('hex').slice(0, 16)
}

function keyFor(slug: string) {
  // CASCADE_HINT: Keep key simple and deterministic, strip leading slash for Blobs
  const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug
  // Replace slashes with dashes to avoid Blobs key validation issues
  return cleanSlug.replace(/\//g, '-')
}

async function readCounts(slug: string) {
  const key = keyFor(slug)
  const raw = await getReactionsStore().get(key, { type: 'json' })
  if (raw && typeof raw === 'object') {
    return raw as { up: number; down: number; emojis: Record<string, number> }
  }
  return { up: 0, down: 0, emojis: {} as Record<string, number> }
}

async function checkRateLimit(ipHash: string): Promise<boolean> {
  try {
    const now = Date.now()
    const hourAgo = now - 60 * 60 * 1000
    const raw = await getRateLimitStore().get(ipHash, { type: 'json' })
    const votes = (raw as number[]) || []
    
    // Remove votes older than 1 hour
    const recentVotes = votes.filter(timestamp => timestamp > hourAgo)
    
    if (recentVotes.length >= MAX_VOTES_PER_IP_PER_HOUR) {
      return false // Rate limited
    }
    
    // Update with current vote
    recentVotes.push(now)
    await getRateLimitStore().setJSON(ipHash, recentVotes)
    return true
  } catch (err) {
    console.error('rate limit check error', err)
    return true // Allow on error
  }
}

async function writeCounts(slug: string, data: { up: number; down: number; emojis: Record<string, number> }) {
  const key = keyFor(slug)
  await getReactionsStore().setJSON(key, data)
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

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const body = await request.json().catch(() => ({})) as { slug?: string; reaction?: string }
    const slug = body.slug || ''
    const reaction = body.reaction || ''
    if (!slug || !reaction) {
      return new Response(JSON.stringify({ error: 'missing slug or reaction' }), { status: 400 })
    }

    // CASCADE: Rate limiting check using hashed IP
    const ip = clientAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const ipHash = hashIP(ip)
    
    const allowed = await checkRateLimit(ipHash)
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'rate limited', message: 'Too many votes from this IP. Try again later.' }), { 
        status: 429,
        headers: { 'content-type': 'application/json' }
      })
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
