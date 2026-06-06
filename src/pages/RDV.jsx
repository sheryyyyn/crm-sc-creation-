import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Video, Calendar, Clock, Edit, Trash2, List, ChevronLeft, ChevronRight, MessageSquare, X, Wifi, WifiOff, PackageOpen, Send, Mail, Copy, Check } from 'lucide-react'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import useStore from '../store/useStore'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const emptyRDV = { clientId: '', date: '', heure: '', lienMeet: '', sujet: '', objectif: '', notes: '', questionsPreparees: '', compteRendu: '', prochainesActions: [] }

const TAGS_DEMANDE = [
  { id: 'charte', label: 'Charte graphique' },
  { id: 'moodboard', label: 'Mood board' },
  { id: 'photos', label: 'Photos' },
  { id: 'textes', label: 'Textes' },
  { id: 'logo', label: 'Logo' },
  { id: 'couleurs', label: 'Palette de couleurs' },
  { id: 'police', label: 'Police / typo' },
]

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

// ── Panneau collaboratif temps réel ─────────────────────────────────────────
function PanneauQuestions({ rdv, client, onClose, onDocumentDemande }) {
  const questions = (rdv.questionsPreparees || '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  const [reponses, setReponses] = useState({})
  const [notesLibres, setNotesLibres] = useState('')
  const [synced, setSynced] = useState(false)
  const [derniereMAJ, setDerniereMAJ] = useState(null)
  const [selectedTags, setSelectedTags] = useState([])
  const [autresChamps, setAutresChamps] = useState([])
  const [autreInput, setAutreInput] = useState('')
  const [demandeModal, setDemandeModal] = useState(false)
  const [mailCopied, setMailCopied] = useState(false)
  const [tutoiement, setTutoiement] = useState(false)

  function toggleTag(label) {
    setSelectedTags(prev => prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label])
  }

  function ajouterAutre() {
    const val = autreInput.trim()
    if (val && !autresChamps.includes(val)) {
      setAutresChamps(prev => [...prev, val])
      setAutreInput('')
    }
  }

  function supprimerAutre(val) {
    setAutresChamps(prev => prev.filter(v => v !== val))
  }

  const clientEmail = client?.email || ''
  const tousLesElements = [...selectedTags, ...autresChamps]

  function buildCorps(tu) {
    const elementsList = tousLesElements.map(t => `• ${t}`).join('\n')
    if (tu) {
      return `ReBonjour,

On tenait à te remercier pour cet appel, c'était un plaisir d'échanger avec toi et on est super motivées à l'idée de travailler sur ce projet !

Comme évoqué lors de l'appel, pourrais-tu nous transmettre les informations suivantes :

${elementsList}

Pour pouvoir te préparer le devis et le contrat dans les meilleures conditions, on aurait besoin de quelques informations :

• Ton nom et prénom (ou le nom du responsable de la société)
• Ton adresse postale complète
• Ton adresse email principale
• Ton numéro de téléphone
• Ton numéro SIRET

Dès qu'on reçoit tout ça, on t'envoie les documents rapidement !

À très vite,
L'équipe SC Création`
    }
    return `ReBonjour,

On tenait à vous remercier pour cet appel, c'était un plaisir d'échanger avec vous et on est super motivées à l'idée de travailler sur ce projet !

Comme évoqué lors de l'appel, pourriez-vous nous transmettre les informations suivantes :

${elementsList}

Pour pouvoir vous préparer le devis et le contrat dans les meilleures conditions, on aurait besoin de quelques informations :

• Vos noms et prénoms (ou le nom du responsable de la société)
• Votre adresse postale complète
• Votre adresse email principale
• Votre numéro de téléphone
• Votre numéro SIRET

Dès qu'on reçoit tout ça, on vous envoie les documents rapidement !

À très vite,
L'équipe SC Création`
  }

  const demandeCorps = buildCorps(tutoiement)
  const { updateRDV, addTache } = useStore()
  const debounceRefs = useRef({})
  const focusedField = useRef(null)

  // Écoute temps réel Firestore — mise à jour champ par champ pour éviter les écrasements
  useEffect(() => {
    const ref = doc(db, 'rdv_notes', rdv.id)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        // Ne pas écraser les champs que l'utilisateur est en train de taper
        setReponses(prev => {
          const remote = data.reponses || {}
          const merged = { ...remote }
          // Conserver la valeur locale pour le champ actif (ex: "rep_0")
          if (focusedField.current?.startsWith('rep_')) {
            const idx = focusedField.current.replace('rep_', '')
            if (prev[idx] !== undefined) merged[idx] = prev[idx]
          }
          return merged
        })
        if (focusedField.current !== 'notes') {
          setNotesLibres(data.notesLibres || '')
        }
        setDerniereMAJ(data.updatedAt?.toDate?.() || null)
        setSynced(true)
      } else {
        setSynced(true)
      }
    })
    return () => unsub()
  }, [rdv.id])

  // Sauvegarde par champ individuel pour éviter les écrasements croisés
  function saveReponse(idx, val) {
    if (debounceRefs.current[`rep_${idx}`]) clearTimeout(debounceRefs.current[`rep_${idx}`])
    debounceRefs.current[`rep_${idx}`] = setTimeout(async () => {
      const ref = doc(db, 'rdv_notes', rdv.id)
      try {
        await updateDoc(ref, { [`reponses.${idx}`]: val, updatedAt: new Date() })
      } catch {
        // Document n'existe pas encore — création initiale
        await setDoc(ref, { reponses: { [idx]: val }, notesLibres: '', rdvId: rdv.id, updatedAt: new Date() })
      }
    }, 400)
  }

  function saveNotes(val) {
    if (debounceRefs.current['notes']) clearTimeout(debounceRefs.current['notes'])
    debounceRefs.current['notes'] = setTimeout(async () => {
      const ref = doc(db, 'rdv_notes', rdv.id)
      try {
        await updateDoc(ref, { notesLibres: val, updatedAt: new Date() })
      } catch {
        await setDoc(ref, { reponses: {}, notesLibres: val, rdvId: rdv.id, updatedAt: new Date() })
      }
    }, 400)
  }

  function handleReponse(idx, val) {
    setReponses(prev => ({ ...prev, [idx]: val }))
    saveReponse(idx, val)
  }

  function handleNotes(val) {
    setNotesLibres(val)
    saveNotes(val)
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#f8f9ff,#eef2ff)' }}>
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-600" />
              <p className="font-bold text-gray-900 text-sm">Questions · {rdv.sujet || 'RDV'}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {synced
                ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /><span className="text-[11px] text-emerald-600 font-medium">Synchronisé en temps réel</span></>
                : <><span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" /><span className="text-[11px] text-gray-400">Connexion...</span></>
              }
              {derniereMAJ && (
                <span className="text-[11px] text-gray-400 ml-2">
                  · modifié à {derniereMAJ.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/80 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {questions.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucune question préparée pour ce RDV.</p>
              <p className="text-xs mt-1">Modifie le RDV pour en ajouter.</p>
            </div>
          )}

          {questions.map((q, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-indigo-50/60 border-b border-indigo-100/60">
                <p className="text-sm font-semibold text-indigo-800 leading-snug">{q}</p>
              </div>
              <div className="px-3 py-2">
                <textarea
                  className="w-full text-sm text-gray-700 bg-transparent outline-none resize-none placeholder-gray-300 leading-relaxed"
                  rows={3}
                  placeholder="Réponse..."
                  value={reponses[i] || ''}
                  onFocus={() => { focusedField.current = `rep_${i}` }}
                  onBlur={() => { focusedField.current = null }}
                  onChange={e => handleReponse(i, e.target.value)}
                />
              </div>
            </div>
          ))}

          {/* Notes libres */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes libres pendant l'appel</p>
            <textarea
              className="w-full input resize-none text-sm"
              rows={5}
              placeholder="Tout ce qui vient pendant l'appel..."
              value={notesLibres}
              onChange={e => handleNotes(e.target.value)}
            />
          </div>

          {/* À demander au client */}
          <div className="pt-1">
            <div className="flex items-center gap-2 mb-3">
              <PackageOpen size={13} className="text-violet-500" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">À demander au client</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {TAGS_DEMANDE.map(({ id, label }) => {
                const active = selectedTags.includes(label)
                return (
                  <button key={id} onClick={() => toggleTag(label)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${active ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-500 hover:border-violet-300 hover:text-violet-600'}`}>
                    {active && <span className="mr-1">✓</span>}{label}
                  </button>
                )
              })}
            </div>

            {/* Autres champs ajoutés */}
            {autresChamps.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {autresChamps.map(val => (
                  <span key={val} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-violet-500 bg-violet-50 text-violet-700">
                    ✓ {val}
                    <button onClick={() => supprimerAutre(val)} className="hover:text-red-500 transition-colors ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Champ libre "Autre" */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={autreInput}
                onChange={e => setAutreInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && ajouterAutre()}
                placeholder="Autre élément à demander…"
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder-gray-300"
              />
              <button onClick={ajouterAutre}
                disabled={!autreInput.trim()}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                + Ajouter
              </button>
            </div>

            {tousLesElements.length > 0 && (
              <button onClick={() => setDemandeModal(true)}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl text-white w-full justify-center"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                <Send size={12} />
                Préparer le mail · {tousLesElements.length} élément{tousLesElements.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>

        {/* Modal demande */}
        {demandeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
                style={{ background: 'linear-gradient(135deg,#f8f9ff,#eef2ff)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                    <PackageOpen size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">Demande d'éléments</p>
                    <p className="text-[11px] text-gray-400">{clientEmail || 'Aucun email renseigné'}</p>
                  </div>
                </div>
                <button onClick={() => setDemandeModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>

              {/* Toggle vouvoiement / tutoiement */}
              <div className="flex gap-2 px-6 pt-4">
                <button onClick={() => setTutoiement(false)}
                  className={`flex-1 text-xs font-bold py-2 rounded-xl border transition-all ${!tutoiement ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-400 hover:border-violet-300'}`}>
                  Vouvoiement
                </button>
                <button onClick={() => setTutoiement(true)}
                  className={`flex-1 text-xs font-bold py-2 rounded-xl border transition-all ${tutoiement ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-400 hover:border-violet-300'}`}>
                  Tutoiement
                </button>
              </div>

              <div className="px-6 py-4">
                <div className="bg-gray-50 rounded-xl p-4 text-gray-700 whitespace-pre-wrap font-mono leading-relaxed border border-gray-200" style={{ fontSize: '11.5px', maxHeight: '320px', overflowY: 'auto' }}>
                  {demandeCorps}
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                {clientEmail ? (
                  <a href={`mailto:${clientEmail}?subject=${encodeURIComponent('SC Création — Éléments à nous transmettre pour votre projet')}&body=${encodeURIComponent(buildCorps(tutoiement))}`}
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl text-white"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
                    onClick={() => {
                      updateRDV(rdv.id, { documentDemande: true })
                      addTache({
                        titre: `Envoyer document à ${client?.nom || rdv.sujet || 'client'}`,
                        description: `Éléments demandés : ${tousLesElements.join(', ')}`,
                        clientId: rdv.clientId || '',
                        assignee: 'Les deux',
                        priorite: 'haute',
                        statut: 'a_faire',
                        deadline: '',
                        notes: '',
                      })
                      if (onDocumentDemande) onDocumentDemande()
                      setDemandeModal(false)
                    }}>
                    <Mail size={14} />Ouvrir dans la messagerie
                  </a>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl bg-gray-100 text-gray-400">
                    Aucun email client renseigné
                  </div>
                )}
                <button onClick={() => { navigator.clipboard.writeText(buildCorps(tutoiement)); setMailCopied(true); setTimeout(() => setMailCopied(false), 2000) }}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                  {mailCopied ? <><Check size={14} className="text-emerald-600" />Copié !</> : <><Copy size={14} />Copier</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <p className="text-[11px] text-gray-400 text-center">
            Chainez et Sheryn voient les modifications en direct · chaque frappe est sauvegardée automatiquement
          </p>
        </div>
      </div>
    </>
  )
}

// ── Vue Calendrier ───────────────────────────────────────────────────────────
function VueCalendrier({ rdvs, clients, today, onEdit, onDelete, onNewRDV, onQuestions }) {
  const now = new Date()
  const [annee, setAnnee] = useState(now.getFullYear())
  const [mois, setMois] = useState(now.getMonth())
  const [jourSelectionne, setJourSelectionne] = useState(null)

  const getClient = (id) => clients.find(c => c.id === id)

  function prevMois() {
    if (mois === 0) { setMois(11); setAnnee(a => a - 1) }
    else setMois(m => m - 1)
    setJourSelectionne(null)
  }
  function nextMois() {
    if (mois === 11) { setMois(0); setAnnee(a => a + 1) }
    else setMois(m => m + 1)
    setJourSelectionne(null)
  }

  const premierJour = new Date(annee, mois, 1)
  const dernierJour = new Date(annee, mois + 1, 0)
  const debutGrille = (premierJour.getDay() + 6) % 7
  const nbJours = dernierJour.getDate()

  const rdvDuMois = rdvs.filter(r => {
    if (!r.date) return false
    const [y, m] = r.date.split('-').map(Number)
    return y === annee && m === mois + 1
  })

  const rdvParJour = {}
  rdvDuMois.forEach(r => {
    const jour = parseInt(r.date.split('-')[2])
    if (!rdvParJour[jour]) rdvParJour[jour] = []
    rdvParJour[jour].push(r)
  })

  const rdvJourSelectionne = jourSelectionne ? (rdvParJour[jourSelectionne] || []) : []
  const dateJourStr = jourSelectionne ? `${annee}-${String(mois + 1).padStart(2, '0')}-${String(jourSelectionne).padStart(2, '0')}` : ''
  const isToday = (j) => `${annee}-${String(mois + 1).padStart(2, '0')}-${String(j).padStart(2, '0')}` === today

  const cellules = []
  for (let i = 0; i < debutGrille; i++) cellules.push(null)
  for (let j = 1; j <= nbJours; j++) cellules.push(j)

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="flex-1 bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prevMois} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <h2 className="font-bold text-gray-900">{MOIS[mois]} {annee}</h2>
          <button onClick={nextMois} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-7 border-b border-gray-100">
          {JOURS.map(j => (
            <div key={j} className="py-2 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wide">{j}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cellules.map((jour, i) => {
            if (!jour) return <div key={`empty-${i}`} className="min-h-[72px] border-b border-r border-gray-50" />
            const rdvsJour = rdvParJour[jour] || []
            const selectionne = jourSelectionne === jour
            const aujd = isToday(jour)
            return (
              <button key={jour} onClick={() => setJourSelectionne(selectionne ? null : jour)}
                className={`min-h-[72px] p-2 border-b border-r border-gray-50 text-left transition-all hover:bg-indigo-50/50 ${selectionne ? 'bg-indigo-50 border-indigo-200' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${aujd ? 'bg-indigo-600 text-white' : selectionne ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'}`}>
                  {jour}
                </div>
                <div className="space-y-0.5">
                  {rdvsJour.slice(0, 2).map(r => (
                    <div key={r.id} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate"
                      style={{ background: '#eef2ff', color: '#4f46e5' }}>
                      {r.heure ? r.heure.slice(0, 5) + ' ' : ''}{r.sujet || 'RDV'}
                    </div>
                  ))}
                  {rdvsJour.length > 2 && (
                    <div className="text-[10px] text-gray-400 font-medium pl-1">+{rdvsJour.length - 2} autre{rdvsJour.length - 2 > 1 ? 's' : ''}</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="w-full lg:w-72 flex-shrink-0">
        {jourSelectionne ? (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#f8f9ff,#eef2ff)' }}>
              <div>
                <p className="font-bold text-gray-900 text-sm">{jourSelectionne} {MOIS[mois].toLowerCase()}</p>
                <p className="text-[11px] text-gray-400">{rdvJourSelectionne.length} rendez-vous</p>
              </div>
              <button onClick={() => onNewRDV(dateJourStr)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                <Plus size={14} />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {rdvJourSelectionne.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <Calendar size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun RDV ce jour</p>
                  <button onClick={() => onNewRDV(dateJourStr)} className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                    + Ajouter un RDV
                  </button>
                </div>
              )}
              {rdvJourSelectionne.map(r => {
                const client = getClient(r.clientId)
                return (
                  <div key={r.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{r.sujet || 'Rendez-vous'}</p>
                        {client && <p className="text-xs text-gray-500 mt-0.5">{client.nom}</p>}
                        {r.heure && (
                          <p className="text-xs text-indigo-600 font-medium mt-1 flex items-center gap-1">
                            <Clock size={10} />{r.heure}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {r.questionsPreparees && (
                          <button onClick={() => onQuestions(r)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                            title="Questions d'appel">
                            <MessageSquare size={12} />
                          </button>
                        )}
                        {r.lienMeet && (
                          <a href={r.lienMeet} target="_blank" rel="noreferrer"
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                            <Video size={12} />
                          </a>
                        )}
                        <button onClick={() => onEdit(r)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <Edit size={12} className="text-gray-400" />
                        </button>
                        <button onClick={() => { if (confirm('Supprimer ce RDV ?')) onDelete(r.id) }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                          <Trash2 size={12} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                    {r.notes && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{r.notes}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <Calendar size={28} className="text-indigo-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Sélectionne un jour</p>
            <p className="text-xs text-gray-400 mt-1">pour voir les RDV de la journée</p>
            <div className="mt-5 pt-4 border-t border-gray-100 text-left">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">Ce mois-ci</p>
              {rdvDuMois.length === 0 ? (
                <p className="text-xs text-gray-400">Aucun RDV ce mois</p>
              ) : (
                <div className="space-y-2">
                  {rdvDuMois.slice(0, 5).map(r => {
                    const client = getClient(r.clientId)
                    return (
                      <div key={r.id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-indigo-600">
                          {r.date?.split('-')[2]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate">{r.sujet || 'RDV'}</p>
                          {client && <p className="text-[10px] text-gray-400 truncate">{client.nom}</p>}
                        </div>
                      </div>
                    )
                  })}
                  {rdvDuMois.length > 5 && <p className="text-[11px] text-gray-400">+{rdvDuMois.length - 5} autres</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Récap formulaire ─────────────────────────────────────────────────────────
function RecapFormulaire({ formReponse }) {
  const [open, setOpen] = useState(true)
  if (!formReponse) return null

  function badge(val) {
    if (!val || val === 'Non' || val === 'Non souhaité') return { icon: '✕', cls: 'text-red-500' }
    if (val === 'Oui' || val === 'Disponible') return { icon: '✓', cls: 'text-emerald-600' }
    return { icon: null, cls: 'text-gray-700' }
  }

  const champs = [
    { label: 'Site actuel', val: formReponse.siteActuel || '—' },
    { label: 'Logo / Charte', val: formReponse.logoCharte === 'Oui' ? 'Disponible' : (formReponse.logoCharte || '—') },
    { label: 'Contenu & Textes', val: formReponse.contenuPret === 'Oui' ? 'Prêt' : (formReponse.contenuPret === 'Non' ? 'Non produit' : (formReponse.contenuPret || '—')) },
    { label: 'Date de lancement', val: formReponse.dateButoir || '—' },
    { label: 'Nom de domaine', val: formReponse.nomDomaine === 'Oui' ? 'Acheté' : (formReponse.nomDomaine || '—') },
    { label: 'Formulaire de contact', val: formReponse.formulaireContact === 'Non' ? 'Non souhaité' : (formReponse.formulaireContact || '—') },
    { label: 'Concurrents cités', val: formReponse.concurrents || '—' },
    { label: 'Sites inspirants', val: formReponse.sitesInspirants || '—' },
    { label: 'Budget', val: formReponse.budget || '—' },
    { label: 'Objectif', val: formReponse.objectif || '—' },
    { label: 'Cible', val: formReponse.cible || '—' },
  ]

  return (
    <div className="mb-5 rounded-2xl border border-indigo-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ background: 'linear-gradient(135deg,#f8f9ff,#eef2ff)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">F</span>
          </div>
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Récap formulaire — {formReponse.nomEntreprise}</span>
        </div>
        <span className="text-indigo-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 border-t border-indigo-100">
          {champs.map(({ label, val }) => {
            const b = badge(val)
            return (
              <div key={label} className="px-4 py-3 bg-white">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-xs font-medium leading-snug ${b.icon ? b.cls : 'text-gray-700'}`}>
                  {b.icon && <span className="mr-1">{b.icon}</span>}{val}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function RDV() {
  const { rdvs, clients, addRDV, updateRDV, deleteRDV, formReponses } = useStore()
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState(emptyRDV)
  const [editForm, setEditForm] = useState(null)
  const [tab, setTab] = useState('a_venir')
  const [vue, setVue] = useState('liste')
  const [panneauRDV, setPanneauRDV] = useState(null)

  const today = new Date().toISOString().split('T')[0]
  const getClient = (id) => clients.find(c => c.id === id)

  const sorted = [...rdvs].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const aVenir = sorted.filter(r => r.date >= today)
  const passes = sorted.filter(r => r.date < today).reverse()
  const displayed = tab === 'a_venir' ? aVenir : passes

  function handleSubmit(e) {
    e.preventDefault()
    addRDV(form)
    setModal(false)
    setForm(emptyRDV)
  }

  function openEdit(r) {
    setEditForm({ ...r })
    setEditModal(r.id)
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    updateRDV(editModal, editForm)
    setEditModal(null)
  }

  function openNewWithDate(date) {
    setForm({ ...emptyRDV, date })
    setModal(true)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rendez-vous</h1>
          <p className="text-sm text-gray-500 mt-1">{aVenir.length} à venir · {passes.length} passé{passes.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-lg">
            <button onClick={() => setVue('liste')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${vue === 'liste' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              <List size={13} /> Liste
            </button>
            <button onClick={() => setVue('calendrier')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${vue === 'calendrier' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Calendar size={13} /> Calendrier
            </button>
          </div>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /><span className="hidden sm:inline">Nouveau RDV</span><span className="sm:hidden">RDV</span>
          </button>
        </div>
      </div>

      {/* Vue calendrier */}
      {vue === 'calendrier' && (
        <VueCalendrier
          rdvs={rdvs}
          clients={clients}
          today={today}
          onEdit={openEdit}
          onDelete={deleteRDV}
          onNewRDV={openNewWithDate}
          onQuestions={setPanneauRDV}
        />
      )}

      {/* Vue liste */}
      {vue === 'liste' && (
        <>
          <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-lg p-1 w-fit">
            {[['a_venir', `À venir (${aVenir.length})`], ['passes', `Passés (${passes.length})`]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${tab === k ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {displayed.length === 0 && (
              <div className="card p-12 text-center text-gray-400">Aucun rendez-vous {tab === 'a_venir' ? 'à venir' : 'passé'}</div>
            )}
            {displayed.map(r => {
              const client = getClient(r.clientId)
              const isToday = r.date === today
              return (
                <div key={r.id} className={`card p-5 ${isToday ? 'border-indigo-300 bg-indigo-50/30' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex gap-4">
                      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
                        <span className={`text-lg font-bold leading-none ${isToday ? 'text-white' : 'text-gray-800'}`}>
                          {r.date ? new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit' }) : '?'}
                        </span>
                        <span className={`text-[10px] uppercase font-semibold ${isToday ? 'text-indigo-200' : 'text-gray-500'}`}>
                          {r.date ? new Date(r.date).toLocaleDateString('fr-FR', { month: 'short' }) : ''}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-gray-900">{r.sujet || 'Rendez-vous'}</p>
                          {isToday && <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">AUJOURD'HUI</span>}
                          {r.documentDemande
                            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ Document demandé</span>
                            : tab === 'passes' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Document à fournir</span>
                          }
                        </div>
                        {client && <p className="text-sm text-gray-600 mb-1">{client.nom}</p>}
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {r.heure && <span className="flex items-center gap-1"><Clock size={11} />{r.heure}</span>}
                          {r.objectif && <span>{r.objectif}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                      {r.questionsPreparees && (
                        <button onClick={() => setPanneauRDV(r)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-100">
                          <MessageSquare size={13} /> Questions
                        </button>
                      )}
                      {r.lienMeet && (
                        <a href={r.lienMeet} target="_blank" rel="noreferrer" className="btn-primary text-xs py-1.5">
                          <Video size={13} /> Rejoindre
                        </a>
                      )}
                      <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100"><Edit size={15} /></button>
                      <button onClick={() => { if (confirm('Supprimer ce RDV ?')) deleteRDV(r.id) }} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"><Trash2 size={15} /></button>
                    </div>
                  </div>

                  {(r.notes || r.compteRendu || r.prochainesActions?.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {r.notes && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
                          <p className="text-sm text-gray-700">{r.notes}</p>
                        </div>
                      )}
                      {r.compteRendu && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Compte rendu</p>
                          <p className="text-sm text-gray-700">{r.compteRendu}</p>
                        </div>
                      )}
                      {r.prochainesActions?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Prochaines actions</p>
                          <ul className="space-y-1">
                            {r.prochainesActions.map((a, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-1"><span className="text-indigo-400 mt-0.5">→</span>{a}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Create Modal */}
          <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouveau rendez-vous" size="lg">
            <form onSubmit={handleSubmit}>
              <FormField label="Client" required>
                <select className="select mb-4" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required>
                  <option value="">— Choisir un client —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </FormField>
              <FormRow cols={2}>
                <FormField label="Date">
                  <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </FormField>
                <FormField label="Heure">
                  <input type="time" className="input" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} />
                </FormField>
              </FormRow>
              <FormField label="Sujet">
                <input className="input mb-4" value={form.sujet} onChange={e => setForm({ ...form, sujet: e.target.value })} />
              </FormField>
              <FormField label="Objectif">
                <input className="input mb-4" value={form.objectif} onChange={e => setForm({ ...form, objectif: e.target.value })} />
              </FormField>
              <FormField label="Lien Google Meet">
                <input className="input mb-4" value={form.lienMeet} onChange={e => setForm({ ...form, lienMeet: e.target.value })} placeholder="https://meet.google.com/..." />
              </FormField>
              <FormField label="Notes de préparation">
                <textarea className="input resize-none mb-4" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </FormField>
              <FormField label="Questions préparées pour l'appel">
                <textarea className="input resize-none" rows={5} value={form.questionsPreparees} onChange={e => setForm({ ...form, questionsPreparees: e.target.value })}
                  placeholder={"1. Quels sont tes objectifs pour les 3 prochains mois ?\n2. Quel est ton budget ?\n3. Qu'est-ce qui t'a motivé à nous contacter ?\n..."} />
                <p className="text-[11px] text-gray-400 mt-1">Une question par ligne — elles apparaîtront dans le panneau collaboratif pendant l'appel</p>
              </FormField>
              <div className="flex justify-end gap-2 mt-5">
                <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Créer le RDV</button>
              </div>
            </form>
          </Modal>

          {/* Edit Modal */}
          {editForm && (
            <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Modifier le RDV" size="lg">
              <form onSubmit={handleEditSubmit}>
                {(() => {
                  const client = clients.find(c => c.id === editForm.clientId)
                  const fr = client && formReponses.find(r =>
                    r.nomEntreprise?.toLowerCase().includes(client.nom?.toLowerCase()) ||
                    client.nom?.toLowerCase().includes(r.nomEntreprise?.toLowerCase())
                  )
                  return <RecapFormulaire formReponse={fr} />
                })()}
                <FormRow cols={2}>
                  <FormField label="Date">
                    <input type="date" className="input" value={editForm.date || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                  </FormField>
                  <FormField label="Heure">
                    <input type="time" className="input" value={editForm.heure || ''} onChange={e => setEditForm({ ...editForm, heure: e.target.value })} />
                  </FormField>
                </FormRow>
                <FormField label="Sujet">
                  <input className="input mb-4" value={editForm.sujet || ''} onChange={e => setEditForm({ ...editForm, sujet: e.target.value })} />
                </FormField>
                <FormField label="Lien Meet">
                  <input className="input mb-4" value={editForm.lienMeet || ''} onChange={e => setEditForm({ ...editForm, lienMeet: e.target.value })} />
                </FormField>
                <FormField label="Notes">
                  <textarea className="input resize-none mb-4" rows={2} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                </FormField>
                <FormField label="Questions préparées pour l'appel">
                  <textarea className="input resize-none mb-4" rows={5} value={editForm.questionsPreparees || ''} onChange={e => setEditForm({ ...editForm, questionsPreparees: e.target.value })}
                    placeholder={"1. Quels sont tes objectifs ?\n2. ..."} />
                  <p className="text-[11px] text-gray-400 -mt-3 mb-1">Une question par ligne</p>
                </FormField>
                <FormField label="Compte rendu">
                  <textarea className="input resize-none mb-4" rows={3} value={editForm.compteRendu || ''} onChange={e => setEditForm({ ...editForm, compteRendu: e.target.value })} />
                </FormField>
                <div className="flex justify-end gap-2 mt-5">
                  <button type="button" className="btn-secondary" onClick={() => setEditModal(null)}>Annuler</button>
                  <button type="submit" className="btn-primary">Enregistrer</button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}

      {/* Panneau collaboratif */}
      {panneauRDV && (
        <PanneauQuestions rdv={panneauRDV} client={getClient(panneauRDV.clientId)} onClose={() => setPanneauRDV(null)} />
      )}
    </div>
  )
}
