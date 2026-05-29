import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, collection, getDocs } from 'firebase/firestore'
import { db, getMessagingInstance } from '../firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || VAPID_KEY

// Détecte si on est sur Safari/iOS qui n'utilise pas FCM
function isSafariPWA() {
  return navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

function isApple() {
  return /iPhone|iPad|iPod|Mac/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent)
}

// Enregistrement Web Push natif (iOS Safari PWA)
async function registerNativeWebPush(profil) {
  try {
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    await navigator.serviceWorker.ready

    const sub = await swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    })

    const subJson = sub.toJSON()
    await setDoc(doc(db, 'fcmTokens', `${profil}_native_${Date.now()}`), {
      endpoint: subJson.endpoint,
      keys: subJson.keys,
      profil,
      type: 'webpush',
      updatedAt: new Date().toISOString(),
    })
    console.log('Web Push natif enregistré ✅', subJson.endpoint?.slice(-20))
    return subJson
  } catch (err) {
    console.error('Web Push natif erreur:', err.message)
    return null
  }
}

export async function registerFCMToken(profil) {
  try {
    if (!('Notification' in window)) { console.warn('FCM: Notifications not supported'); return null }
    if (Notification.permission !== 'granted') { console.warn('FCM: Permission not granted:', Notification.permission); return null }
    if (!VAPID_KEY) { console.error('FCM: VITE_FIREBASE_VAPID_KEY manquante !'); return null }

    // Sur Apple/Safari → Web Push natif
    if (isApple()) {
      return await registerNativeWebPush(profil)
    }

    // Sur les autres navigateurs → FCM
    const messaging = await getMessagingInstance()
    if (!messaging) { console.warn('FCM: Messaging not supported'); return null }

    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    await navigator.serviceWorker.ready

    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })
    if (token) {
      await setDoc(doc(db, 'fcmTokens', `${profil}_${token.slice(-8)}`), {
        token,
        profil,
        type: 'fcm',
        updatedAt: new Date().toISOString(),
      })
      console.log('FCM token enregistré ✅')
    } else {
      console.warn('FCM: token vide')
    }
    return token
  } catch (err) {
    console.error('FCM token erreur:', err.message)
    return null
  }
}

export async function getAllFCMTokens() {
  try {
    const snap = await getDocs(collection(db, 'fcmTokens'))
    return snap.docs.map(d => d.data()).filter(Boolean)
  } catch {
    return []
  }
}

export async function sendPushNotification(title, body, url = '/') {
  try {
    const entries = await getAllFCMTokens()
    if (!entries.length) return
    await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries, title, body, data: { url } }),
    })
  } catch (err) {
    console.warn('Push notification failed:', err.message)
  }
}

export async function setupForegroundMessages() {
  try {
    const messaging = await getMessagingInstance()
    if (!messaging) return () => {}
    return onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {}
      if (title && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/logo.jpg', badge: '/logo.jpg' })
      }
    })
  } catch {
    return () => {}
  }
}
