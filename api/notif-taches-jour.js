// Rappel quotidien des tâches du jour, envoyé séparément à Sheryn et à Chaïnez
// (chacune ne reçoit que le décompte de SES tâches, sur SES appareils, grâce au
// champ `profil` enregistré avec chaque token — voir src/utils/fcm.js).
// Déclenché par deux crons Vercel (12h et 16h, voir vercel.json).
const admin = require('firebase-admin')
const webpush = require('web-push')

function initAdmin() {
  if (admin.apps.length) return
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!b64 && !raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var missing')
  const json = b64 ? Buffer.from(b64, 'base64').toString('utf8') : raw
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) })
}

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

// Envoie à un sous-ensemble de tokens/abonnements (déjà filtrés par profil)
async function sendToEntries(entries, title, body, url = '/taches') {
  const fcmTokens = entries.filter(e => e.type === 'fcm' || (e.token && !e.type)).map(e => e.token).filter(Boolean)
  const webPushSubs = entries.filter(e => e.type === 'webpush' && e.endpoint)
  let sent = 0

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
      sent += result.successCount
    } catch (err) {
      console.error('notif-taches-jour FCM error:', err.message)
    }
  }

  if (webPushSubs.length) {
    initWebPush()
    if (webpushInitialized) {
      const payload = JSON.stringify({ title, body, icon: '/logo.jpg', url })
      for (const sub of webPushSubs) {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
          sent++
        } catch (err) {
          console.error('notif-taches-jour webpush error:', err.message)
        }
      }
    }
  }

  return sent
}

const PROFILS = ['Sheryn', 'Chainez']

module.exports = async (req, res) => {
  try {
    initAdmin()
    const db = admin.firestore()

    const [tokensSnap, tachesSnap] = await Promise.all([
      db.collection('fcmTokens').get(),
      db.collection('taches').get(),
    ])
    const tokenEntries = tokensSnap.docs.map(d => d.data()).filter(Boolean)
    const taches = tachesSnap.docs.map(d => d.data())

    const today = new Date().toISOString().split('T')[0]
    const results = {}

    for (const profil of PROFILS) {
      const duJour = taches.filter(t =>
        t.statut !== 'termine' &&
        t.deadline === today &&
        (t.assignee === profil || t.assignee === 'Les deux')
      )
      if (duJour.length === 0) { results[profil] = { taches: 0, sent: 0 }; continue }

      const urgentes = duJour.filter(t => t.priorite === 'urgente' || t.priorite === 'haute').length
      const s = duJour.length > 1 ? 's' : ''
      const body = urgentes > 0
        ? `${profil}, tu as ${duJour.length} tâche${s} à faire aujourd'hui, dont ${urgentes} urgente${urgentes > 1 ? 's' : ''} !`
        : `${profil}, tu as ${duJour.length} tâche${s} à faire aujourd'hui !`

      const entries = tokenEntries.filter(e => e.profil === profil)
      const sent = await sendToEntries(entries, '📋 Tâches du jour', body)
      results[profil] = { taches: duJour.length, sent }
    }

    res.json({ ok: true, results })
  } catch (err) {
    console.error('notif-taches-jour error:', err)
    res.status(500).json({ error: err.message })
  }
}
