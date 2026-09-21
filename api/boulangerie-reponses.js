const admin = require('firebase-admin')

function initAdmin() {
  if (admin.apps.length) return
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!b64 && !raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var missing')
  const json = b64 ? Buffer.from(b64, 'base64').toString('utf8') : raw
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) })
}

function generateId() {
  return 'br_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

async function notifyAll(title, body, url) {
  try {
    const db = admin.firestore()
    const tokensSnap = await db.collection('fcmTokens').get()
    const tokens = tokensSnap.docs.map((d) => d.data().token).filter(Boolean)
    if (!tokens.length) return
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: {
        notification: { icon: '/logo.jpg', badge: '/logo.jpg', vibrate: [200, 100, 200] },
        fcmOptions: { link: url },
      },
    })
  } catch (err) {
    // Never let a notification failure block saving the response.
    console.error('boulangerie-reponses: push notification failed:', err)
  }
}

module.exports = async (req, res) => {
  // CORS: the standalone survey form is redeployed via Vercel Drop, which
  // gives it a new URL each time, so the allowed origin is intentionally
  // left open ("*") rather than pinned to one hostname. This endpoint only
  // accepts writes to a single dedicated collection, so the exposure is
  // limited to that.
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    initAdmin()
    const db = admin.firestore()

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    const { reponses, resume, nomEtablissement, email, source, dateEnvoi } = body

    if (!reponses || typeof reponses !== 'object') {
      res.status(400).json({ error: 'Champ "reponses" manquant ou invalide' })
      return
    }

    const item = {
      id: generateId(),
      reponses,
      resume: resume || '',
      nomEtablissement: nomEtablissement || '',
      email: email || '',
      source: source || 'formulaire-boulangerie',
      dateEnvoi: dateEnvoi || new Date().toISOString(),
      lu: false,
      horodateur: new Date().toISOString(),
    }

    await db.collection('boulangerieReponses').doc(item.id).set(item)

    const title = '📋 Nouvelle réponse — enquête boulangeries'
    const bodyText = `${item.nomEtablissement || 'Une boulangerie'} a répondu au formulaire.`
    await notifyAll(title, bodyText, '/boulangerie-reponses')

    res.status(200).json({ ok: true, id: item.id })
  } catch (err) {
    console.error('boulangerie-reponses error:', err)
    res.status(500).json({ error: err.message })
  }
}
