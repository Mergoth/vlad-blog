/* CASCADE: Simple service worker for Web Push notifications */
/* CASCADE_HINT: Keep this tiny and framework-agnostic. */

self.addEventListener('install', (event) => {
  // CASCADE_HINT: Activate immediately for quick updates
  // @ts-ignore - service worker global
  self.skipWaiting && self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // CASCADE_HINT: Take control of uncontrolled clients immediately
  // @ts-ignore - service worker global
  self.clients && self.clients.claim && self.clients.claim();
});

self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'New post on Vlad Blog';
    const body = data.body || 'Click to read the latest update.';
    const url = data.url || '/';
    const icon = data.icon || '/favicon.svg';
    const tag = data.tag || 'blog-update';

    event.waitUntil(
      // @ts-ignore - service worker global
      self.registration.showNotification(title, {
        body,
        icon,
        tag,
        data: { url },
      })
    );
  } catch (e) {
    // CASCADE: Best-effort only
    console.error('SW push error', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  const n = event.notification;
  const url = (n && n.data && n.data.url) || '/';
  event.notification.close();
  event.waitUntil(
    // @ts-ignore - service worker global
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // @ts-ignore
        if (client.url === url && 'focus' in client) return client.focus();
      }
      // @ts-ignore - service worker global
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
