const admin = require('firebase-admin')

function initAdmin() {
  if (admin.apps.length) return
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var missing')
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) })
}

async function sendToAll(tokens, notification, url = '/rdv') {
  if (!tokens.length) return
  await admin.messaging().sendEachForMulticast({
    tokens,
    notification,
    webpush: {
      notification: { icon: '/logo.jpg', badge: '/logo.jpg', vibrate: [200, 100, 200] },
      fcmOptions: { link: url },
    },
  })
}

module.exports = async (req, res) => {
  try {
    initAdmin()
    const db = admin.firestore()

    const tokensSnap = await db.collection('fcmTokens').get()
    const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean)
    if (!tokens.length) return res.json({ sent: 0, reason: 'no tokens' })

    const rdvsSnap = await db.collection('rdvs').get()
    const rdvs = rdvsSnap.docs.map(d => d.data())

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0]
    let sent = 0

    for (const rdv of rdvs) {
      if (!rdv.date || !rdv.heure) continue
      const rdvTime = new Date(`${rdv.date}T${rdv.heure}`)
      const diffMin = (rdvTime - now) / 60000
      const label = rdv.sujet || 'Rendez-vous'

      // Rappel veille entre 18h00 et 18h29
      if (rdv.date === tomorrow && now.getHours() === 18 && now.getMinutes() < 30) {
        await sendToAll(tokens, { title: '📅 RDV demain', body: `${label} à ${rdv.heure}` })
        sent++
      }
      // Rappel 1h avant (fenêtre 55–65 min)
      else if (diffMin > 55 && diffMin <= 65) {
        await sendToAll(tokens, { title: '⏰ RDV dans 1 heure', body: `${label} à ${rdv.heure}` })
        sent++
      }
      // Rappel 30 min avant (fenêtre 25–35 min)
      else if (diffMin > 25 && diffMin <= 35) {
        await sendToAll(tokens, { title: '⏰ RDV dans 30 min', body: `${label} à ${rdv.heure}` })
        sent++
      }
    }

    res.json({ sent })
  } catch (err) {
    console.error('reminders error:', err)
    res.status(500).json({ error: err.message })
  }
}
