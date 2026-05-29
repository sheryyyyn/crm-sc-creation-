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

function initWebPush() {
  webpush.setVapidDetails(
    'mailto:sheryn.ait@icloud.com',
    process.env.VITE_FIREBASE_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { entries, tokens, title, body, data } = req.body || {}

  // Support ancien format (tokens array) et nouveau format (entries array)
  const allEntries = entries || (tokens ? tokens.map(t => ({ token: t, type: 'fcm' })) : [])
  if (!allEntries.length || !title) return res.status(400).json({ error: 'entries + title required' })

  const fcmTokens = allEntries.filter(e => e.type === 'fcm' || e.token).map(e => e.token).filter(Boolean)
  const webPushSubs = allEntries.filter(e => e.type === 'webpush' && e.endpoint)

  let results = { fcm: 0, webpush: 0, errors: [] }

  // Envoyer via FCM
  if (fcmTokens.length) {
    try {
      initAdmin()
      const result = await admin.messaging().sendEachForMulticast({
        tokens: fcmTokens,
        notification: { title, body: body || '' },
        webpush: {
          notification: { icon: '/logo.jpg', badge: '/logo.jpg', vibrate: [200, 100, 200] },
          fcmOptions: { link: data?.url || '/' },
        },
        data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
      })
      results.fcm = result.successCount
    } catch (err) {
      results.errors.push('FCM: ' + err.message)
    }
  }

  // Envoyer via Web Push natif (iOS Safari)
  if (webPushSubs.length && process.env.VAPID_PRIVATE_KEY) {
    try {
      initWebPush()
      const payload = JSON.stringify({ title, body: body || '', icon: '/logo.jpg', url: data?.url || '/' })
      for (const sub of webPushSubs) {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
          results.webpush++
        } catch (err) {
          results.errors.push('WebPush: ' + err.message)
        }
      }
    } catch (err) {
      results.errors.push('WebPush init: ' + err.message)
    }
  }

  res.json({ success: true, ...results })
}
