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
  return 'sp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

// Ces champs sont des cases à cocher (plusieurs réponses possibles) dans le
// formulaire — on force toujours un tableau, même à une seule valeur, sinon
// le graphique de synthèse de la page "Boulangerie Manager" (qui attend un
// tableau pour ces champs-là) ne compte pas correctement. Doit rester en
// phase avec MULTI côté src/data/saasConfig.js (boulangerie.prospectFields).
const MULTI_FIELDS = ['canal_commande', 'elements_essentiels', 'priorites']

function normaliseReponses(reponses) {
  const out = {}
  Object.keys(reponses).forEach((key) => {
    const val = reponses[key]
    if (MULTI_FIELDS.includes(key)) {
      out[key] = Array.isArray(val) ? val : (val === undefined || val === null || val === '' ? [] : [val])
    } else {
      out[key] = Array.isArray(val) ? val[0] : val
    }
  })
  return out
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
  // CORS: le formulaire autonome est redéployé via Vercel Drop, ce qui lui
  // donne une nouvelle URL à chaque fois, donc l'origine autorisée est
  // volontairement laissée ouverte ("*") plutôt que fixée à un seul nom
  // d'hôte. Cet endpoint n'accepte que des écritures dans saasProspects
  // avec produitId="boulangerie", donc l'exposition reste limitée.
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
    const { reponses, resume, nomEtablissement, email, dateEnvoi } = body

    if (!reponses || typeof reponses !== 'object') {
      res.status(400).json({ error: 'Champ "reponses" manquant ou invalide' })
      return
    }

    // Écrit directement dans la collection saasProspects, avec
    // produitId="boulangerie" — c'est la même collection que lit la page
    // "Boulangerie Manager" → onglet "Prospection" du CRM, donc les réponses
    // apparaissent automatiquement là-bas, sans page dédiée.
    const item = {
      id: generateId(),
      produitId: 'boulangerie',
      ...normaliseReponses(reponses),
      resume: resume || '',
      nomEtablissement: nomEtablissement || reponses.contact_nom || '',
      email: email || reponses.contact_email || '',
      lu: false,
      horodateur: dateEnvoi || new Date().toISOString(),
    }

    await db.collection('saasProspects').doc(item.id).set(item)

    const title = '📋 Nouvelle réponse — enquête boulangeries'
    const bodyText = `${item.nomEtablissement || 'Une boulangerie'} a répondu au formulaire.`
    await notifyAll(title, bodyText, '/saas/boulangerie')

    res.status(200).json({ ok: true, id: item.id })
  } catch (err) {
    console.error('boulangerie-reponses error:', err)
    res.status(500).json({ error: err.message })
  }
}
