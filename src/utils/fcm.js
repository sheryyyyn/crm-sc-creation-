import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, collection, getDocs } from 'firebase/firestore'
import { db, getMessagingInstance } from '../firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

export async function registerFCMToken(profil) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return null
    const messaging = await getMessagingInstance()
    if (!messaging) return null

    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (token) {
      await setDoc(doc(db, 'fcmTokens', `${profil}_${token.slice(-8)}`), {
        token,
        profil,
        updatedAt: new Date().toISOString(),
      })
    }
    return token
  } catch (err) {
    console.warn('FCM token:', err.message)
    return null
  }
}

export async function getAllFCMTokens() {
  try {
    const snap = await getDocs(collection(db, 'fcmTokens'))
    return snap.docs.map(d => d.data().token).filter(Boolean)
  } catch {
    return []
  }
}

export async function sendPushNotification(title, body, url = '/') {
  try {
    const tokens = await getAllFCMTokens()
    if (!tokens.length) return
    await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens, title, body, data: { url } }),
    })
  } catch (err) {
    console.warn('Push notification failed:', err.message)
  }
}

export async function setupForegroundMessages() {
  const messaging = await getMessagingInstance()
  if (!messaging) return () => {}
  return onMessage(messaging, (payload) => {
    const { title, body } = payload.notification || {}
    if (title && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo.jpg', badge: '/logo.jpg' })
    }
  })
}
