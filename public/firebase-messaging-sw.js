// Service worker de notifications push.
// Gère à la fois les push FCM (Android/Chrome) et les push web natifs
// (iOS/Safari, envoyés directement via le protocole Web Push standard)
// avec un seul et même listener générique 'push' — plus fiable que le
// helper firebase-messaging-compat qui ne couvre que le format FCM.

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (err) {
    payload = {}
  }

  const notif = payload.notification || payload
  const title = notif.title || 'SC Création'
  const body = notif.body || ''
  const icon = notif.icon || '/logo.jpg'
  const url = payload.data?.url || payload.fcmOptions?.link || payload.url || '/'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/logo.jpg',
      vibrate: [200, 100, 200],
      data: { url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
