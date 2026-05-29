importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyB0EZsUfj2rAw4UZm9wv_0m09lYwc2F_X0",
  authDomain: "sccreation-b6aa0.firebaseapp.com",
  projectId: "sccreation-b6aa0",
  storageBucket: "sccreation-b6aa0.firebasestorage.app",
  messagingSenderId: "32364190871",
  appId: "1:32364190871:web:42125ce2b67eac6fd19dd2"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {}
  self.registration.showNotification(title || 'SC Création', {
    body: body || '',
    icon: icon || '/logo.jpg',
    badge: '/logo.jpg',
    vibrate: [200, 100, 200],
    data: payload.data || {},
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
