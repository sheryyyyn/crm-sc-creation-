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

// La Push API attend applicationServerKey en Uint8Array (BufferSource) — passer
// directement la chaîne base64url échoue silencieusement sur Safari/iOS.
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Identifiant Firestore stable dérivé de l'endpoint (au lieu de Date.now(),
// qui créait un nouveau document à chaque ouverture de l'app et a fini par
// accumuler des centaines d'abonnements périmés).
function stableIdFromEndpoint(endpoint) {
  let hash = 0
  for (let i = 0; i < endpoint.length; i++) {
    hash = (hash * 31 + endpoint.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

// Enregistrement Web Push natif (iOS Safari PWA)
async function registerNativeWebPush(profil) {
  try {
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    await navigator.serviceWorker.ready

    // Un abonnement existant signé avec une ancienne clé VAPID fait échouer
    // subscribe() (InvalidStateError) — on le retire avant de recréer.
    const existing = await swReg.pushManager.getSubscription()
    if (existing) await existing.unsubscribe()

    const sub = await swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const subJson = sub.toJSON()
    await setDoc(doc(db, 'fcmTokens', `${profil}_native_${stableIdFromEndpoint(subJson.endpoint)}`), {
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
