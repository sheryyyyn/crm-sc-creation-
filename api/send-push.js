const admin = require('firebase-admin')

function initAdmin() {
  if (admin.apps.length) return
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var missing')
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) })
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { tokens, title, body, data } = req.body || {}
  if (!tokens?.length || !title) return res.status(400).json({ error: 'tokens + title required' })

  try {
    initAdmin()
    const result = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body: body || '' },
      webpush: {
        notification: {
          icon: '/logo.jpg',
          badge: '/logo.jpg',
          vibrate: [200, 100, 200],
        },
        fcmOptions: { link: data?.url || '/' },
      },
      data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
    })
    res.json({ success: true, successCount: result.successCount, failureCount: result.failureCount })
  } catch (err) {
    console.error('send-push error:', err)
    res.status(500).json({ error: err.message })
  }
}
