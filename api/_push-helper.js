// Helper partagé : envoie une notification push à TOUS les appareils enregistrés
// (fcmTokens collection), qu'ils soient FCM (Android/Chrome) ou Web Push natif
// (iOS/Safari). Utilisé par les routes qui créent des données côté serveur
// (webhooks) et doivent donc déclencher elles-mêmes le push, contrairement aux
// actions faites depuis l'app qui passent par src/utils/fcm.js → /api/send-push.
const admin = require('firebase-admin')
const webpush = require('web-push')

let webpushInitialized = false
function initWebPush() {
  if (webpushInitialized) return
  if (!process.env.VAPID_PRIVATE_KEY) return
  webpush.setVapidDetails(
    'mailto:sheryn.ait@icloud.com',
    process.env.VITE_VAPID_PUBLIC_KEY || process.env.VITE_FIREBASE_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
  webpushInitialized = true
}

// db : instance Firestore Admin déjà initialisée par l'appelant
async function sendPushToAllDevices(db, title, body, url = '/') {
  const snap = await db.collection('fcmTokens').get()
  const entries = snap.docs.map(d => d.data()).filter(Boolean)
  if (!entries.length) return { fcm: 0, webpush: 0 }

  const fcmTokens = entries.filter(e => e.type === 'fcm' || (e.token && !e.type)).map(e => e.token).filter(Boolean)
  const webPushSubs = entries.filter(e => e.type === 'webpush' && e.endpoint)

  let fcmSent = 0
  let webpushSent = 0

  if (fcmTokens.length) {
    try {
      const result = await admin.messaging().sendEachForMulticast({
        tokens: fcmTokens,
        notification: { title, body },
        webpush: {
          notification: { icon: '/logo.jpg', badge: '/logo.jpg', vibrate: [200, 100, 200] },
          fcmOptions: { link: url },
        },
        data: { url },
      })
      fcmSent = result.successCount
    } catch (err) {
      console.error('sendPushToAllDevices FCM error:', err.message)
    }
  }

  if (webPushSubs.length) {
    initWebPush()
    if (webpushInitialized) {
      const payload = JSON.stringify({ title, body, icon: '/logo.jpg', url })
      for (const sub of webPushSubs) {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
          webpushSent++
        } catch (err) {
          console.error('sendPushToAllDevices webpush error:', err.message)
        }
      }
    }
  }

  return { fcm: fcmSent, webpush: webpushSent }
}

module.exports = { sendPushToAllDevices }
