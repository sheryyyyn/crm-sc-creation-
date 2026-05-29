const admin = require('firebase-admin')

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Init Firebase Admin (singleton avec gestion d'erreur)
  try {
    if (!admin.apps.length) {
      const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
      if (!b64) return res.status(500).json({ error: 'Missing FIREBASE_SERVICE_ACCOUNT_B64' })
      const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    }
  } catch (err) {
    return res.status(500).json({ error: 'Firebase init failed', detail: err.message })
  }

  const db = admin.firestore()
  const { triggerEvent, payload } = req.body || {}

  // On traite uniquement les nouvelles réservations
  if (triggerEvent !== 'BOOKING_CREATED') {
    return res.status(200).json({ ok: true, skipped: true })
  }

  try {
    const attendee = payload?.attendees?.[0] || {}
    const startTime = payload?.startTime ? new Date(payload.startTime) : null

    const date = startTime
      ? startTime.toISOString().split('T')[0]
      : ''

    const heure = startTime
      ? startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
      : ''

    const rdv = {
      id: generateId('cal'),
      sujet: payload?.title || 'Appel découverte — Cal.com',
      clientId: '',
      date,
      heure,
      lienMeet: payload?.location || payload?.meetingUrl || '',
      objectif: 'Appel découverte',
      notes: `Client : ${attendee.name || '—'}\nEmail : ${attendee.email || '—'}${payload?.description ? '\n\n' + payload.description : ''}`,
      compteRendu: '',
      prochainesActions: [],
      source: 'cal.com',
      attendeeNom: attendee.name || '',
      attendeeEmail: attendee.email || '',
      createdAt: new Date().toISOString(),
    }

    await db.collection('rdvs').doc(rdv.id).set(rdv)

    return res.status(200).json({ ok: true, id: rdv.id })
  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ error: err.message })
  }
}
