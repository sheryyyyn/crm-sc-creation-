

const admin = require('firebase-admin')
const { sendPushToAllDevices } = require('./_push-helper')
 
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}
 
function initFirebase() {
  if (admin.apps.length) return
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
  if (!b64) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_B64')
  const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}
 
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
 
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
 
  try {
    initFirebase()
  } catch (err) {
    return res.status(500).json({ error: 'Firebase init failed', detail: err.message })
  }
 
  const db = admin.firestore()
 
  // Champs envoyés depuis le questionnaire de satisfaction (sccreation.fr/avis)
  const {
    note = null,
    noteJustif = '',
    marquant = [],
    autre = '',
    communication = '',
    communicationJustif = '',
    resultat = '',
    resultatJustif = '',
    libre = '',
    progres = '',
    nps = null,
    npsJustif = '',
    temoignage = '',
    email = '',
    nomClient = '',
  } = req.body || {}
 
  if (typeof note !== 'number' || typeof nps !== 'number') {
    return res.status(400).json({ error: 'Note et NPS requis' })
  }
 
  try {
    const id = generateId('sat')
    const now = new Date()
 
    const reponse = {
      id,
      horodateur: now.toISOString(),
      lu: false,
      source: 'questionnaire_satisfaction',
 
      note,
      noteJustif,
      marquant,
      autre,
      communication,
      communicationJustif,
      resultat,
      resultatJustif,
      libre,
      progres,
      nps,
      npsJustif,
      temoignage,
      email,
      nomClient,
    }
 
    await db.collection('satisfactionReponses').doc(id).set(reponse)
 
    // Tâche de suivi automatique uniquement si le retour est actionnable
    // (note basse ou détracteur NPS) — pour ne pas noyer le CRM de tâches
    // sur des retours déjà positifs.
    const estActionnable = note <= 3 || nps <= 6
    if (estActionnable) {
      const tache = {
        id: generateId('t'),
        titre: nomClient
          ? `Suivi satisfaction — ${nomClient} (note ${note}/5, NPS ${nps}/10)`
          : `Suivi satisfaction — retour à améliorer (note ${note}/5, NPS ${nps}/10)`,
        description: [noteJustif, resultatJustif, npsJustif, libre, progres]
          .filter(Boolean)
          .join(' — ') || 'Voir le détail dans les réponses de satisfaction.',
        assignee: 'Chainez',
        priorite: 'haute',
        statut: 'a_faire',
        clientId: '',
        projetId: '',
        deadline: '',
        notes: '',
        checklist: [],
        createdAt: now.toISOString(),
        satisfactionReponseId: id,
      }
      await db.collection('taches').doc(tache.id).set(tache)
    }
 
    // Notification push vers tous les appareils enregistrés (Sheryn + Chaïnez).
    // Ne doit jamais faire échouer la réponse si l'envoi échoue.
    try {
      await sendPushToAllDevices(
        db,
        estActionnable ? '⚠️ Retour satisfaction à surveiller' : '⭐ Nouveau retour satisfaction !',
        nomClient ? `${nomClient} — Note ${note}/5 — NPS ${nps}/10` : `Note ${note}/5 — NPS ${nps}/10`,
        '/satisfaction'
      )
    } catch (pushErr) {
      console.error('Satisfaction webhook: push notification failed:', pushErr.message)
    }
 
    return res.status(200).json({ result: 'success', id })
  } catch (err) {
    console.error('Satisfaction webhook error:', err)
    return res.status(500).json({ error: err.message })
  }
}
 
