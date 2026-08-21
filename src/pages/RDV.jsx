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
function parseQuestion(line) {
  const match = line.match(/^\[([^\]]+)\]\s*(.+)/)
  if (match) return { categorie: match[1].trim(), texte: match[2].trim() }
  return { categorie: null, texte: line }
}

function PanneauQuestions({ rdv, client, onClose, onDocumentDemande }) {
  const rawQuestions = (rdv.questionsPreparees || '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  const questions = rawQuestions.map(parseQuestion)
  const categories = ['Voir tout', ...Array.from(new Set(questions.map(q => q.categorie).filter(Boolean)))]
  const [categorieActive, setCategorieActive] = useState('Voir tout')

  const questionsFiltrees = categorieActive === 'Voir tout'
    ? questions
    : questions.filter(q => q.categorie === categorieActive)

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7e5e1] flex-shrink-0"
          style={{ background: '#f5f4f1' }}>
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[#241512]" />
              <p className="font-bold text-[#241512] text-sm">Questions · {rdv.sujet || 'RDV'}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {synced
                ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /><span className="text-[11px] text-emerald-600 font-medium">Synchronisé en temps réel</span></>
                : <><span className="w-1.5 h-1.5 rounded-full bg-[#e7e5e1] inline-block" /><span className="text-[11px] text-[#a89b8c]">Connexion...</span></>
              }
              {derniereMAJ && (
                <span className="text-[11px] text-[#a89b8c] ml-2">
                  · modifié à {derniereMAJ.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/80 transition-colors">
            <X size={16} className="text-[#a89b8c]" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {questions.length === 0 && (
            <div className="text-center py-8 text-[#a89b8c]">
              <MessageSquare size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucune question préparée pour ce RDV.</p>
              <p className="text-xs mt-1">Modifie le RDV pour en ajouter.</p>
            </div>
          )}

          {/* Tags catégories */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategorieActive(cat)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${categorieActive === cat ? 'bg-[#241512] text-white border-[#241512]' : 'border-[#e7e5e1] bg-white text-[#a89b8c] hover:border-[#e7e5e1] hover:text-[#241512]'}`}>
                  {cat}
                  {cat !== 'Voir tout' && (
                    <span className={`ml-1.5 text-[10px] font-semibold ${categorieActive === cat ? 'opacity-80' : 'opacity-50'}`}>
                      {questions.filter(q => q.categorie === cat).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Questions groupées par catégorie */}
          {(() => {
            if (categorieActive !== 'Voir tout') {
              return questionsFiltrees.map((q, idx) => {
                const globalIdx = questions.indexOf(q)
                return (
                  <div key={globalIdx} className="rounded-2xl border border-[#e7e5e1] overflow-hidden">
                    <div className="px-4 py-3 bg-[#f5f4f1] border-b border-[#e7e5e1]">
                      <p className="text-sm font-semibold text-[#241512] leading-snug">{q.texte}</p>
                    </div>
                    <div className="px-3 py-2">
                      <textarea
                        className="w-full text-sm text-[#241512] bg-transparent outline-none resize-none placeholder-[#d5cfc4] leading-relaxed"
                        rows={3}
                        placeholder="Réponse..."
                        value={reponses[globalIdx] || ''}
                        onFocus={() => { focusedField.current = `rep_${globalIdx}` }}
                        onBlur={() => { focusedField.current = null }}
                        onChange={e => handleReponse(globalIdx, e.target.value)}
                      />
                    </div>
                  </div>
                )
              })
            }

            // "Voir tout" : groupement par catégorie avec titres
            const groupes = {}
            const sansCat = []
            questions.forEach((q, idx) => {
              if (q.categorie) {
                if (!groupes[q.categorie]) groupes[q.categorie] = []
                groupes[q.categorie].push({ ...q, idx })
              } else {
                sansCat.push({ ...q, idx })
              }
            })

            const sections = []
            Object.entries(groupes).forEach(([cat, qs]) => {
              sections.push(
                <div key={`cat-${cat}`} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#a89b8c] bg-[#f5f4f1] px-3 py-1 rounded-full border border-[#e7e5e1]">
                      {cat}
                    </span>
                    <div className="flex-1 h-px bg-[#f5f4f1]" />
                  </div>
                  {qs.map(({ texte, idx }) => (
                    <div key={idx} className="rounded-2xl border border-[#e7e5e1] overflow-hidden">
                      <div className="px-4 py-3 bg-[#f5f4f1] border-b border-[#e7e5e1]">
                        <p className="text-sm font-semibold text-[#241512] leading-snug">{texte}</p>
                      </div>
                      <div className="px-3 py-2">
                        <textarea
                          className="w-full text-sm text-[#241512] bg-transparent outline-none resize-none placeholder-[#d5cfc4] leading-relaxed"
                          rows={3}
                          placeholder="Réponse..."
                          value={reponses[idx] || ''}
                          onFocus={() => { focusedField.current = `rep_${idx}` }}
                          onBlur={() => { focusedField.current = null }}
                          onChange={e => handleReponse(idx, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })

            if (sansCat.length > 0) {
              sections.push(
                <div key="cat-autres" className="space-y-3">
                  {Object.keys(groupes).length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#a89b8c] bg-[#f5f4f1] px-3 py-1 rounded-full border border-[#e7e5e1]">
                        Autres
                      </span>
                      <div className="flex-1 h-px bg-[#f5f4f1]" />
                    </div>
                  )}
                  {sansCat.map(({ texte, idx }) => (
                    <div key={idx} className="rounded-2xl border border-[#e7e5e1] overflow-hidden">
                      <div className="px-4 py-3 bg-[#f5f4f1] border-b border-[#e7e5e1]">
                        <p className="text-sm font-semibold text-[#241512] leading-snug">{texte}</p>
                      </div>
                      <div className="px-3 py-2">
                        <textarea
                          className="w-full text-sm text-[#241512] bg-transparent outline-none resize-none placeholder-[#d5cfc4] leading-relaxed"
                          rows={3}
                          placeholder="Réponse..."
                          value={reponses[idx] || ''}
                          onFocus={() => { focusedField.current = `rep_${idx}` }}
                          onBlur={() => { focusedField.current = null }}
                          onChange={e => handleReponse(idx, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
            }

            return sections
          })()}

          {/* Notes libres */}
          <div>
            <p className="text-xs font-bold text-[#a89b8c] uppercase tracking-wider mb-2">Notes libres pendant l'appel</p>
            <textarea
              className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all resize-none" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }}
              rows={5}
              placeholder="Tout ce qui vient pendant l'appel..."
              value={notesLibres}
              onFocus={() => { focusedField.current = 'notes' }}
              onBlur={() => { focusedField.current = null }}
              onChange={e => handleNotes(e.target.value)}
            />
          </div>

          {/* À demander au client */}
          <div className="pt-1">
            <div className="flex items-center gap-2 mb-3">
              <PackageOpen size={13} className="text-[#241512]" />
              <p className="text-xs font-bold text-[#a89b8c] uppercase tracking-wider">À demander au client</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {TAGS_DEMANDE.map(({ id, label }) => {
                const active = selectedTags.includes(label)
                return (
                  <button key={id} onClick={() => toggleTag(label)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${active ? 'border-[#241512] bg-[#f5f4f1] text-[#241512]' : 'border-[#e7e5e1] bg-white text-[#a89b8c] hover:border-[#241512] hover:text-[#241512]'}`}>
                    {active && <span className="mr-1">✓</span>}{label}
                  </button>
                )
              })}
            </div>

            {/* Autres champs ajoutés */}
            {autresChamps.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {autresChamps.map(val => (
                  <span key={val} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-[#241512] bg-[#f5f4f1] text-[#241512]">
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
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-[#e7e5e1] bg-white focus:outline-none focus:ring-2 focus:ring-[#241512]/30 placeholder-[#d5cfc4]"
              />
              <button onClick={ajouterAutre}
                disabled={!autreInput.trim()}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-[#f5f4f1] text-[#241512] hover:bg-[#eeece7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                + Ajouter
              </button>
            </div>

            {tousLesElements.length > 0 && (
              <button onClick={() => setDemandeModal(true)}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl text-white w-full justify-center"
                style={{ background: '#241512' }}>
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
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7e5e1]"
                style={{ background: '#f5f4f1' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#241512' }}>
                    <PackageOpen size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#241512]">Demande d'éléments</p>
                    <p className="text-[11px] text-[#a89b8c]">{clientEmail || 'Aucun email renseigné'}</p>
                  </div>
                </div>
                <button onClick={() => setDemandeModal(false)} className="w-8 h-8 rounded-lg bg-[#f5f4f1] flex items-center justify-center hover:bg-[#eeece7] transition-colors">
                  <X size={14} className="text-[#a89b8c]" />
                </button>
              </div>

              {/* Toggle vouvoiement / tutoiement */}
              <div className="flex gap-2 px-6 pt-4">
                <button onClick={() => setTutoiement(false)}
                  className={`flex-1 text-xs font-bold py-2 rounded-xl border transition-all ${!tutoiement ? 'border-[#241512] bg-[#f5f4f1] text-[#241512]' : 'border-[#e7e5e1] text-[#a89b8c] hover:border-[#241512]'}`}>
                  Vouvoiement
                </button>
                <button onClick={() => setTutoiement(true)}
                  className={`flex-1 text-xs font-bold py-2 rounded-xl border transition-all ${tutoiement ? 'border-[#241512] bg-[#f5f4f1] text-[#241512]' : 'border-[#e7e5e1] text-[#a89b8c] hover:border-[#241512]'}`}>
                  Tutoiement
                </button>
              </div>

              <div className="px-6 py-4">
                <div className="bg-[#f5f4f1] rounded-xl p-4 text-[#241512] whitespace-pre-wrap font-mono leading-relaxed border border-[#e7e5e1]" style={{ fontSize: '11.5px', maxHeight: '320px', overflowY: 'auto' }}>
                  {demandeCorps}
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                {clientEmail ? (
                  <a href={`mailto:${clientEmail}?subject=${encodeURIComponent('SC Création — Éléments à nous transmettre pour votre projet')}&body=${encodeURIComponent(buildCorps(tutoiement))}`}
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl text-white"
                    style={{ background: '#241512' }}
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
                  <div className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl bg-[#f5f4f1] text-[#a89b8c]">
                    Aucun email client renseigné
                  </div>
                )}
                <button onClick={() => { navigator.clipboard.writeText(buildCorps(tutoiement)); setMailCopied(true); setTimeout(() => setMailCopied(false), 2000) }}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#f5f4f1] text-[#241512] hover:bg-[#eeece7] transition-colors">
                  {mailCopied ? <><Check size={14} className="text-emerald-600" />Copié !</> : <><Copy size={14} />Copier</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-[#e7e5e1] bg-[#f5f4f1] flex-shrink-0">
          <p className="text-[11px] text-[#a89b8c] text-center">
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
      <div className="flex-1 bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7e5e1]">
          <button onClick={prevMois} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f5f4f1] transition-colors">
            <ChevronLeft size={16} className="text-[#a89b8c]" />
          </button>
          <h2 className="font-bold text-[#241512]">{MOIS[mois]} {annee}</h2>
          <button onClick={nextMois} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f5f4f1] transition-colors">
            <ChevronRight size={16} className="text-[#a89b8c]" />
          </button>
        </div>
        <div className="grid grid-cols-7 border-b border-[#e7e5e1]">
          {JOURS.map(j => (
            <div key={j} className="py-2 text-center text-[11px] font-bold text-[#a89b8c] uppercase tracking-wide">{j}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cellules.map((jour, i) => {
            if (!jour) return <div key={`empty-${i}`} className="min-h-[72px] border-b border-r border-[#eeece7]" />
            const rdvsJour = rdvParJour[jour] || []
            const selectionne = jourSelectionne === jour
            const aujd = isToday(jour)
            return (
              <button key={jour} onClick={() => setJourSelectionne(selectionne ? null : jour)}
                className={`min-h-[72px] p-2 border-b border-r border-[#eeece7] text-left transition-all hover:bg-[#f5f4f1]/50 ${selectionne ? 'bg-[#f5f4f1] border-[#e7e5e1]' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${aujd ? 'bg-[#241512] text-white' : selectionne ? 'bg-[#f5f4f1] text-[#241512]' : 'text-[#241512]'}`}>
                  {jour}
                </div>
                <div className="space-y-0.5">
                  {rdvsJour.slice(0, 2).map(r => (
                    <div key={r.id} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate"
                      style={{ background: '#f5f4f1', color: '#241512' }}>
                      {r.heure ? r.heure.slice(0, 5) + ' ' : ''}{r.sujet || 'RDV'}
                    </div>
                  ))}
                  {rdvsJour.length > 2 && (
                    <div className="text-[10px] text-[#a89b8c] font-medium pl-1">+{rdvsJour.length - 2} autre{rdvsJour.length - 2 > 1 ? 's' : ''}</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="w-full lg:w-72 flex-shrink-0">
        {jourSelectionne ? (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
            <div className="px-5 py-4 border-b border-[#e7e5e1] flex items-center justify-between"
              style={{ background: '#f5f4f1' }}>
              <div>
                <p className="font-bold text-[#241512] text-sm">{jourSelectionne} {MOIS[mois].toLowerCase()}</p>
                <p className="text-[11px] text-[#a89b8c]">{rdvJourSelectionne.length} rendez-vous</p>
              </div>
              <button onClick={() => onNewRDV(dateJourStr)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ background: '#241512' }}>
                <Plus size={14} />
              </button>
            </div>
            <div className="divide-y divide-[#eeece7]">
              {rdvJourSelectionne.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <Calendar size={24} className="text-[#a89b8c] mx-auto mb-2" />
                  <p className="text-sm text-[#a89b8c]">Aucun RDV ce jour</p>
                  <button onClick={() => onNewRDV(dateJourStr)} className="mt-3 text-xs font-semibold text-[#241512] hover:text-[#241512]">
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
                        <p className="font-semibold text-sm text-[#241512] truncate">{r.sujet || 'Rendez-vous'}</p>
                        {client && <p className="text-xs text-[#a89b8c] mt-0.5">{client.nom}</p>}
                        {r.heure && (
                          <p className="text-xs text-[#241512] font-medium mt-1 flex items-center gap-1">
                            <Clock size={10} />{r.heure}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {r.questionsPreparees && (
                          <button onClick={() => onQuestions(r)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#f5f4f1] text-[#241512] hover:bg-[#f5f4f1] transition-colors"
                            title="Questions d'appel">
                            <MessageSquare size={12} />
                          </button>
                        )}
                        {r.lienMeet && (
                          <a href={r.lienMeet} target="_blank" rel="noreferrer"
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#f5f4f1] text-[#241512] hover:bg-[#f5f4f1] transition-colors">
                            <Video size={12} />
                          </a>
                        )}
                        <button onClick={() => onEdit(r)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#f5f4f1] transition-colors">
                          <Edit size={12} className="text-[#a89b8c]" />
                        </button>
                        <button onClick={() => { if (confirm('Supprimer ce RDV ?')) onDelete(r.id) }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                          <Trash2 size={12} className="text-[#a89b8c]" />
                        </button>
                      </div>
                    </div>
                    {r.notes && <p className="text-xs text-[#a89b8c] mt-2 line-clamp-2">{r.notes}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center" style={{ border: '1px solid #e7e5e1' }}>
            <Calendar size={28} className="text-[#a89b8c] mx-auto mb-3" />
            <p className="text-sm text-[#a89b8c] font-medium">Sélectionne un jour</p>
            <p className="text-xs text-[#a89b8c] mt-1">pour voir les RDV de la journée</p>
            <div className="mt-5 pt-4 border-t border-[#e7e5e1] text-left">
              <p className="text-[11px] font-bold text-[#a89b8c] uppercase tracking-wide mb-3">Ce mois-ci</p>
              {rdvDuMois.length === 0 ? (
                <p className="text-xs text-[#a89b8c]">Aucun RDV ce mois</p>
              ) : (
                <div className="space-y-2">
                  {rdvDuMois.slice(0, 5).map(r => {
                    const client = getClient(r.clientId)
                    return (
                      <div key={r.id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#f5f4f1] flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-[#241512]">
                          {r.date?.split('-')[2]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#241512] truncate">{r.sujet || 'RDV'}</p>
                          {client && <p className="text-[10px] text-[#a89b8c] truncate">{client.nom}</p>}
                        </div>
                      </div>
                    )
                  })}
                  {rdvDuMois.length > 5 && <p className="text-[11px] text-[#a89b8c]">+{rdvDuMois.length - 5} autres</p>}
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
export function RecapFormulaire({ formReponse }) {
  const [open, setOpen] = useState(true)
  if (!formReponse) return null

  function badge(val) {
    if (!val || val === 'Non' || val === 'Non souhaité') return { icon: '✕', cls: 'text-red-500' }
    if (val === 'Oui' || val === 'Disponible') return { icon: '✓', cls: 'text-emerald-600' }
    return { icon: null, cls: 'text-[#241512]' }
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
    <div className="mb-5 rounded-2xl border border-[#e7e5e1] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ background: '#f5f4f1' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#241512] flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">F</span>
          </div>
          <span className="text-xs font-bold text-[#241512] uppercase tracking-wider">Récap formulaire — {formReponse.nomEntreprise}</span>
        </div>
        <span className="text-[#a89b8c] text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="grid grid-cols-2 divide-x divide-y divide-[#eeece7] border-t border-[#e7e5e1]">
          {champs.map(({ label, val }) => {
            const b = badge(val)
            return (
              <div key={label} className="px-4 py-3 bg-white">
                <p className="text-[10px] font-bold text-[#a89b8c] uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-xs font-medium leading-snug ${b.icon ? b.cls : 'text-[#241512]'}`}>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Rendez-vous</h1>
          <p className="text-sm text-[#a89b8c] mt-1">{aVenir.length} à venir · {passes.length} passé{passes.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 p-1 bg-white border border-[#e7e5e1] rounded-lg">
            <button onClick={() => setVue('liste')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${vue === 'liste' ? 'bg-[#241512] text-white' : 'text-[#a89b8c] hover:bg-[#f5f4f1]'}`}>
              <List size={13} /> Liste
            </button>
            <button onClick={() => setVue('calendrier')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${vue === 'calendrier' ? 'bg-[#241512] text-white' : 'text-[#a89b8c] hover:bg-[#f5f4f1]'}`}>
              <Calendar size={13} /> Calendrier
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }} onClick={() => setModal(true)}>
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
          <div className="flex gap-1 mb-5 bg-white border border-[#e7e5e1] rounded-lg p-1 w-fit">
            {[['a_venir', `À venir (${aVenir.length})`], ['passes', `Passés (${passes.length})`]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${tab === k ? 'bg-[#241512] text-white' : 'text-[#a89b8c] hover:bg-[#f5f4f1]'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {displayed.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center text-[#a89b8c]" style={{ border: '1px solid #e7e5e1' }}>Aucun rendez-vous {tab === 'a_venir' ? 'à venir' : 'passé'}</div>
            )}
            {displayed.map(r => {
              const client = getClient(r.clientId)
              const isToday = r.date === today
              return (
                <div key={r.id} className={`card p-5 ${isToday ? 'border-[#e7e5e1] bg-[#f5f4f1]/30' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex gap-4">
                      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-[#241512] text-white' : 'bg-[#f5f4f1]'}`}>
                        <span className={`text-lg font-bold leading-none ${isToday ? 'text-white' : 'text-[#241512]'}`}>
                          {r.date ? new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit' }) : '?'}
                        </span>
                        <span className={`text-[10px] uppercase font-semibold ${isToday ? 'text-[#a89b8c]' : 'text-[#a89b8c]'}`}>
                          {r.date ? new Date(r.date).toLocaleDateString('fr-FR', { month: 'short' }) : ''}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-[#241512]">{r.sujet || 'Rendez-vous'}</p>
                          {isToday && <span className="text-[10px] font-bold bg-[#241512] text-white px-2 py-0.5 rounded-full">AUJOURD'HUI</span>}
                          {r.documentDemande
                            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ Document demandé</span>
                            : tab === 'passes' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Document à fournir</span>
                          }
                        </div>
                        {client && <p className="text-sm text-[#a89b8c] mb-1">{client.nom}</p>}
                        <div className="flex items-center gap-3 text-xs text-[#a89b8c]">
                          {r.heure && <span className="flex items-center gap-1"><Clock size={11} />{r.heure}</span>}
                          {r.objectif && <span>{r.objectif}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                      {r.questionsPreparees && (
                        <button onClick={() => setPanneauRDV(r)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#f5f4f1] text-[#241512] hover:bg-[#f5f4f1] transition-colors border border-[#e7e5e1]">
                          <MessageSquare size={13} /> Questions
                        </button>
                      )}
                      {r.lienMeet ? (
                        <a href={r.lienMeet} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors"
                          style={{ background: '#241512' }}>
                          <Video size={13} /> Rejoindre
                        </a>
                      ) : (
                        <span
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-not-allowed"
                          style={{ background: '#f5f4f1', color: '#a89b8c' }}
                          title="Aucun lien de visio renseigné"
                        >
                          <Video size={13} /> Rejoindre
                        </span>
                      )}
                      <button onClick={() => openEdit(r)} className="p-1.5 text-[#a89b8c] hover:text-[#241512] rounded-lg hover:bg-[#f5f4f1]"><Edit size={15} /></button>
                      <button onClick={() => { if (confirm('Supprimer ce RDV ?')) deleteRDV(r.id) }} className="p-1.5 text-[#a89b8c] hover:text-red-500 rounded-lg hover:bg-[#f5f4f1]"><Trash2 size={15} /></button>
                    </div>
                  </div>

                  {(r.notes || r.compteRendu || r.prochainesActions?.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-[#e7e5e1] grid grid-cols-1 md:grid-cols-3 gap-4">
                      {r.notes && (
                        <div>
                          <p className="text-xs font-semibold text-[#a89b8c] mb-1">Notes</p>
                          <p className="text-sm text-[#241512]">{r.notes}</p>
                        </div>
                      )}
                      {r.compteRendu && (
                        <div>
                          <p className="text-xs font-semibold text-[#a89b8c] mb-1">Compte rendu</p>
                          <p className="text-sm text-[#241512]">{r.compteRendu}</p>
                        </div>
                      )}
                      {r.prochainesActions?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#a89b8c] mb-1">Prochaines actions</p>
                          <ul className="space-y-1">
                            {r.prochainesActions.map((a, i) => (
                              <li key={i} className="text-sm text-[#241512] flex items-start gap-1"><span className="text-[#a89b8c] mt-0.5">→</span>{a}</li>
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
                <select className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all mb-4" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required>
                  <option value="">— Choisir un client —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </FormField>
              <FormRow cols={2}>
                <FormField label="Date">
                  <input type="date" className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </FormField>
                <FormField label="Heure">
                  <input type="time" className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} />
                </FormField>
              </FormRow>
              <FormField label="Sujet">
                <input className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all mb-4" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} value={form.sujet} onChange={e => setForm({ ...form, sujet: e.target.value })} />
              </FormField>
              <FormField label="Lien Google Meet">
                <input className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all mb-4" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} value={form.lienMeet} onChange={e => setForm({ ...form, lienMeet: e.target.value })} placeholder="https://meet.google.com/..." />
              </FormField>
              <FormField label="Questions préparées pour l'appel">
                <textarea className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all resize-none" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} rows={5} value={form.questionsPreparees} onChange={e => setForm({ ...form, questionsPreparees: e.target.value })}
                  placeholder={"[Design] Quels sont tes couleurs préférées ?\n[Design] As-tu un logo existant ?\n[Marketing] Qui est ta cible ?\n[Marketing] Quel est ton budget ?\nUne question sans catégorie..."} />
                <p className="text-[11px] text-[#a89b8c] mt-1">Une question par ligne · Ajoute <span className="font-mono bg-[#f5f4f1] px-1 rounded">[Catégorie]</span> au début pour grouper par onglet</p>
              </FormField>
              <div className="flex justify-end gap-2 mt-5">
                <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => setModal(false)}>Annuler</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }}>Créer le RDV</button>
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
                    <input type="date" className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} value={editForm.date || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                  </FormField>
                  <FormField label="Heure">
                    <input type="time" className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} value={editForm.heure || ''} onChange={e => setEditForm({ ...editForm, heure: e.target.value })} />
                  </FormField>
                </FormRow>
                <FormField label="Sujet">
                  <input className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all mb-4" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} value={editForm.sujet || ''} onChange={e => setEditForm({ ...editForm, sujet: e.target.value })} />
                </FormField>
                <FormField label="Lien Meet">
                  <input className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all mb-4" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} value={editForm.lienMeet || ''} onChange={e => setEditForm({ ...editForm, lienMeet: e.target.value })} />
                </FormField>
                <FormField label="Notes">
                  <textarea className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all resize-none mb-4" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} rows={2} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                </FormField>
                <FormField label="Questions préparées pour l'appel">
                  <textarea className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all resize-none mb-4" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} rows={5} value={editForm.questionsPreparees || ''} onChange={e => setEditForm({ ...editForm, questionsPreparees: e.target.value })}
                    placeholder={"[Design] Quels sont tes couleurs ?\n[Marketing] Qui est ta cible ?\nUne question sans catégorie..."} />
                  <p className="text-[11px] text-[#a89b8c] -mt-3 mb-1">Une question par ligne · <span className="font-mono bg-[#f5f4f1] px-1 rounded">[Catégorie]</span> au début pour grouper</p>
                </FormField>
                <FormField label="Compte rendu">
                  <textarea className="w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all resize-none mb-4" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} rows={3} value={editForm.compteRendu || ''} onChange={e => setEditForm({ ...editForm, compteRendu: e.target.value })} />
                </FormField>
                <div className="flex justify-end gap-2 mt-5">
                  <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => setEditModal(null)}>Annuler</button>
                  <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }}>Enregistrer</button>
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
