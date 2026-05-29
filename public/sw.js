const CACHE_NAME = 'betfriends-v1'

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim())
})

self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  const title = data.title || 'BetFriends'
  const options = {
    body: data.body || 'Una apuesta necesita tu atención',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/',
    vibrate: [200, 100, 200],
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    clients.openWindow(e.notification.data || '/')
  )
})
