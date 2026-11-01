import { useEffect, useState } from 'react'
import { TYPES_ECHEANCE, DEMARCHES } from '../data/fiscalConfig'

// ─── Calcul des rappels fiscaux ───────────────────────────────────────────────
// Tout est dérivé des dates et statuts stockés dans Firestore (collection
// echeancesFiscales) : rien n'est mémorisé côté navigateur, les rappels
// réapparaissent donc à chaque connexion tant que les démarches ne sont pas faites.

// Dates 'YYYY-MM-DD' lues en heure locale (new Date('2026-01-24') serait en UTC).
export function parseLocalDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayLocalStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Recalcule "aujourd'hui" chaque minute pour que les rappels basculent à minuit
// même si l'onglet reste ouvert.
export function useToday() {
  const [today, setToday] = useState(todayLocalStr)
  useEffect(() => {
    const interval = setInterval(() => setToday(todayLocalStr()), 60000)
    return () => clearInterval(interval)
  }, [])
  return today
}

export const formatDateCourte = (str) =>
  str ? parseLocalDate(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export function getType(e) {
  return TYPES_ECHEANCE[e.type] || { label: e.type, demarches: ['declaration', 'paiement'], periodes: [] }
}

export function getPeriode(e) {
  return getType(e).periodes.find(p => p.id === e.periode) || { id: e.periode, label: e.periode, mois: '' }
}

export const libelleEcheance = (e) => `${getType(e).label} · ${getPeriode(e).label} ${e.annee}`

// Indication du mois attendu (ex. "janvier 2027" pour T4 2026) — jamais une date imposée.
export function moisAttendu(e) {
  const p = getPeriode(e)
  if (!p.moisEcheance) return null
  return new Date(Number(e.annee) + (p.decalageAnnee || 0), p.moisEcheance - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

// Démarches restant à faire, avec leur date limite (null si non renseignée).
export function demarchesEnAttente(e) {
  return getType(e).demarches
    .map(id => ({ id, ...DEMARCHES[id] }))
    .filter(d => !e[d.doneField])
    .map(d => ({ ...d, date: e[d.dateField] || null }))
}

export const estTerminee = (e) => demarchesEnAttente(e).length === 0

// Palette alignée sur utils/joursRestants.js
const NIVEAUX = {
  terminee: { color: '#1a9a5b', bg: '#e6f6ee', rang: 9 },
  sans_date: { color: '#8a5a2b', bg: '#f5f4f1', rang: 6 },
  a_venir: { color: '#241512', bg: '#f5f4f1', rang: 7 },
  j15: { color: '#8a7a1f', bg: '#fcf7cf', rang: 5 },
  j7: { color: '#b8860b', bg: '#fdf4dc', rang: 4 },
  j3: { color: '#a1402d', bg: '#f5e6e3', rang: 3 },
  jour_j: { color: '#ef4444', bg: '#fee2e2', rang: 2 },
  retard: { color: '#ef4444', bg: '#fee2e2', rang: 1 },
}

const plur = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`

// État d'une échéance à la date `today` : niveau d'urgence, compte à rebours,
// message de rappel (null hors fenêtre de rappel).
export function getEtatEcheance(e, today = todayLocalStr()) {
  const label = getType(e).label
  const enAttente = demarchesEnAttente(e)
  if (enAttente.length === 0) {
    return { niveau: 'terminee', ...NIVEAUX.terminee, badge: 'Terminée', message: null, date: null, diff: null, enAttente }
  }

  const datees = enAttente.filter(d => d.date).sort((a, b) => a.date.localeCompare(b.date))
  if (datees.length === 0) {
    return { niveau: 'sans_date', ...NIVEAUX.sans_date, badge: 'Date à renseigner', message: null, date: null, diff: null, enAttente }
  }

  const date = datees[0].date
  const diff = Math.round((parseLocalDate(date) - parseLocalDate(today)) / 86400000)
  const base = { date, diff, enAttente, prochaine: datees[0] }
  // Messages adaptés à ce qui reste à faire (déclaration et/ou paiement).
  const ids = enAttente.map(d => d.id)
  const seulPaiement = ids.length === 1 && ids[0] === 'paiement'
  const verbes = ids.length === 1 ? (seulPaiement ? 'payer' : 'déclarer') : 'déclarer et payer'
  const objet = seulPaiement ? `paiement de ${label}` : `déclaration de ${label}`

  if (diff < 0) {
    const restant = enAttente.map(d => d.label.toLowerCase()).join(' et ')
    return { ...base, niveau: 'retard', ...NIVEAUX.retard, badge: `Retard ${Math.abs(diff)} j`,
      message: `Échéance dépassée de ${plur(Math.abs(diff), 'jour')} : ${restant} de la ${label} à finaliser.` }
  }
  if (diff === 0) {
    return { ...base, niveau: 'jour_j', ...NIVEAUX.jour_j, badge: "Aujourd'hui", message: `Dernier jour pour ${verbes} votre ${label}.` }
  }
  if (diff <= 3) {
    return { ...base, niveau: 'j3', ...NIVEAUX.j3, badge: `J-${diff}`, message: `Plus ${diff === 1 ? "qu'un jour" : `que ${diff} jours`} pour ${verbes} votre ${label}.` }
  }
  if (diff <= 7) {
    return { ...base, niveau: 'j7', ...NIVEAUX.j7, badge: `J-${diff}`, message: `Pensez à préparer votre ${objet}.` }
  }
  if (diff <= 15) {
    return { ...base, niveau: 'j15', ...NIVEAUX.j15, badge: `J-${diff}`, message: `Votre ${objet} approche.` }
  }
  return { ...base, niveau: 'a_venir', ...NIVEAUX.a_venir, badge: `J-${diff}`, message: null }
}

// Tri : les plus urgentes d'abord, puis par date.
export function trierParUrgence(items, today) {
  return items
    .map(e => ({ e, etat: getEtatEcheance(e, today) }))
    .sort((a, b) => a.etat.rang - b.etat.rang || (a.etat.date || '9999').localeCompare(b.etat.date || '9999'))
}

// Rappels à afficher sur le dashboard (fenêtre J-15 → retard).
export const getRappelsActifs = (items, today) =>
  trierParUrgence(items, today).filter(({ etat }) => etat.message)
