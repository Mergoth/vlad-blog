import React from 'react'

// CASCADE: Tiny push subscription bell component
// CASCADE_HINT: Client-side only, uses PUBLIC_VAPID_PUBLIC_KEY

const VAPID = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY as string | undefined

async function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

async function getOrRegisterSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
  } catch (e) {
    console.error('CASCADE push SW register error', e)
    return null
  }
}

async function subscribe(reg: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    const existing = await reg.pushManager.getSubscription()
    if (existing) return existing
    if (!VAPID) {
      console.warn('CASCADE push: missing PUBLIC_VAPID_PUBLIC_KEY')
      return null
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: await urlBase64ToUint8Array(VAPID),
    })
    return sub
  } catch (e) {
    console.error('CASCADE push subscribe error', e)
    return null
  }
}

async function saveSubscription(sub: PushSubscription) {
  try {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sub),
    })
  } catch (e) {
    console.error('CASCADE push save error', e)
  }
}

async function deleteSubscription(sub: PushSubscription) {
  try {
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })
  } catch (e) {
    console.error('CASCADE push delete error', e)
  }
}

type Lang = 'en' | 'es' | 'ru'

export default function PushBell({ lang = 'en' as Lang }: { lang?: Lang }) {
  const [supported, setSupported] = React.useState<boolean>(false)
  const [permission, setPermission] = React.useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = React.useState<boolean>(false)
  const [busy, setBusy] = React.useState<boolean>(false)
  const [hint, setHint] = React.useState<boolean>(false)

  React.useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined'
    setSupported(ok)
    if (!ok) return
    setPermission(Notification.permission)
    getOrRegisterSW().then(async (reg) => {
      if (!reg) return
      const existing = await reg.pushManager.getSubscription()
      setSubscribed(!!existing)
    })
  }, [])

  // CASCADE: Subtle pulse on first visit to draw attention
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const seen = localStorage.getItem('push_hint_seen') === '1'
      if (!seen) {
        setHint(true)
        const t = setTimeout(() => {
          setHint(false)
          localStorage.setItem('push_hint_seen', '1')
        }, 5000)
        return () => clearTimeout(t)
      }
    } catch {}
  }, [])

  const onClick = async () => {
    if (!supported || busy) return
    try { localStorage.setItem('push_hint_seen', '1') } catch {}
    setHint(false)
    setBusy(true)
    try {
      if (Notification.permission === 'denied') {
        alert('Notifications are blocked in your browser settings.')
        return
      }
      const reg = await getOrRegisterSW()
      if (!reg) return
      let sub = await reg.pushManager.getSubscription()
      if (sub) {
        // Toggle off
        await deleteSubscription(sub)
        await sub.unsubscribe().catch(() => {})
        setSubscribed(false)
        return
      }
      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission()
        setPermission(perm)
        if (perm !== 'granted') return
      }
      sub = await subscribe(reg)
      if (sub) {
        await saveSubscription(sub)
        setSubscribed(true)
      }
    } finally {
      setBusy(false)
    }
  }

  if (!supported) return null

  const labelsOff: Record<Lang, string> = {
    en: 'Subscribe to updates',
    es: 'Suscríbete a las actualizaciones',
    ru: 'Подписаться на обновления',
  }
  const labelsOn: Record<Lang, string> = {
    en: 'Subscribed',
    es: 'Suscrito',
    ru: 'Подписан',
  }
  const label = (subscribed ? labelsOn : labelsOff)[lang] || labelsOff.en
  const aria = subscribed ? 'Disable notifications' : 'Enable notifications'

  const gradient = subscribed ? 'from-emerald-500 to-green-600' : 'from-indigo-500 to-violet-600'

  return (
    <div className="flex flex-col items-end select-none">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-pressed={subscribed}
        aria-label={aria}
        title={aria}
        className={[
          'inline-flex items-center gap-0 md:gap-2',
          'rounded-full shadow-md ring-1 ring-black/5',
          'bg-gradient-to-br text-white',
          gradient,
          // CASCADE_HINT: on mobile show a neat circle with no horizontal padding, pill on md+
          'h-8 md:h-9 px-0 md:px-3',
          'transition-transform duration-150 ease-out hover:scale-105 active:scale-95',
          hint && !busy ? 'animate-pulse' : '',
          busy ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span
          className="flex items-center justify-center w-8 h-8 md:w-8 md:h-8 rounded-full bg-white/20"
          aria-hidden
        >
          <span className="text-base md:text-lg">{subscribed ? '🔕' : '🔔'}</span>
        </span>
        <span className="hidden md:inline text-xs md:text-sm font-medium">{label}</span>
      </button>
    </div>
  )
}
