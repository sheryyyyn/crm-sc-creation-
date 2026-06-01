const admin = require('firebase-admin')

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

  // Champs envoyés depuis le formulaire du site sccreation.fr
  const {
    nomEntreprise = '',
    email = '',
    telephone = '',
    secteurActivite = '',
    siteActuel = '',
    histoire = '',
    produits = '',
    objectif = '',
    concurrents = '',
    contenuPret = '',
    formulaireContact = '',
    cible = '',
    nomDomaine = '',
    logoCharte = '',
    sitesInspirants = '',
    reseauContact = '',
    pseudoReseau = '',
    budget = '',
    dateButoir = '',
    demandesSpecifiques = '',
    remarques = '',
    _honeypot = '',
  } = req.body || {}

  // Anti-spam honeypot
  if (_honeypot) return res.status(200).json({ result: 'success' })
  if (!email) return res.status(400).json({ error: 'Email requis' })

  try {
    const id = generateId('fr')
    const now = new Date()

    const reponse = {
      id,
      horodateur: now.toISOString(),
      lu: false,
      source: 'site_sccreation',

      nomEntreprise: nomEntreprise || 'Inconnu',
      email,
      telephone,
      secteurActivite,
      siteActuel,
      histoire,
      produits,
      objectif,
      concurrents,
      contenuPret,
      formulaireContact,
      cible,
      nomDomaine,
      logoCharte,
      sitesInspirants,
      reseauContact,
      pseudoReseau,
      budget,
      dateButoir,
      demandesSpecifiques,
      remarques,
    }

    await db.collection('formReponses').doc(id).set(reponse)

    // Créer une tâche automatique
    const tache = {
      id: generateId('t'),
      titre: `Répondre au formulaire de ${reponse.nomEntreprise}`,
      description: `Formulaire reçu le ${now.toLocaleDateString('fr-FR')} — Budget : ${budget || '—'} — Type : ${type_projet || '—'}`,
      assignee: 'Les deux',
      priorite: 'haute',
      statut: 'a_faire',
      clientId: '',
      projetId: '',
      deadline: '',
      notes: '',
      checklist: [],
      createdAt: now.toISOString(),
      formReponseId: id,
    }

    await db.collection('taches').doc(tache.id).set(tache)

    return res.status(200).json({ result: 'success', id })
  } catch (err) {
    console.error('Formulaire webhook error:', err)
    return res.status(500).json({ error: err.message })
  }
}
