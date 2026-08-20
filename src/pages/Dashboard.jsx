import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Video, ClipboardList, Handshake, ArrowRight, ChevronDown, ChevronUp, ChevronRight, Plus, Check,
  CheckSquare, Clock, Calendar, Instagram, Music2,
} from 'lucide-react'
import useStore from '../store/useStore'
import { notify } from '../utils/notify'
import Modal, { FormRow, FormField } from '../components/ui/Modal'
import { statutBadge } from '../components/ui/Badge'

// ─── Ajout rapide de tâche depuis le Dashboard ────────────────────────────────
// Réutilise exactement le même store.addTache() et les mêmes valeurs que la page
// complète des tâches (src/pages/Taches.jsx) — aucune structure de données parallèle.
const emptyQuickTache = { titre: '', description: '', clientId: '', projetId: '', assignee: 'Sheryn', deadline: '', priorite: 'moyenne', statut: 'a_faire', notes: '' }

function QuickAddTaskModal({ isOpen, onClose, clients, projets, addTache, onAdded }) {
  const [form, setForm] = useState(emptyQuickTache)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const getProjets = (clientId) => projets.filter(p => p.clientId === clientId)
  const canSubmit = form.titre.trim().length > 0 && !saving

  function close() {
    setForm(emptyQuickTache)
    setError('')
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError('')
    try {
      await addTache(form)
      setForm(emptyQuickTache)
      onAdded()
      onClose()
    } catch (err) {
      setError("Impossible d'ajouter la tâche. Vérifie ta connexion et réessaie.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Ajouter une tâche" size="lg">
      <form onSubmit={handleSubmit}>
        <FormField label="Titre" required>
          <input className="input mb-4" autoFocus value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required />
        </FormField>
        <FormRow cols={2}>
          <FormField label="Assignée">
            <select className="select" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })}>
              <option value="Sheryn">Sheryn</option>
              <option value="Chainez">Chaïnez</option>
              <option value="Les deux">Les deux</option>
            </select>
          </FormField>
          <FormField label="Priorité">
            <select className="select" value={form.priorite} onChange={e => setForm({ ...form, priorite: e.target.value })}>
              <option value="urgente">Urgente</option>
              <option value="moyenne">Secondaire</option>
            </select>
          </FormField>
        </FormRow>
        <FormRow cols={2}>
          <FormField label="Client">
            <select className="select" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value, projetId: '' })}>
              <option value="">— Aucun —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </FormField>
          <FormField label="Projet">
            <select className="select" value={form.projetId} onChange={e => setForm({ ...form, projetId: e.target.value })}>
              <option value="">— Aucun —</option>
              {getProjets(form.clientId).map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </FormField>
        </FormRow>
        <FormField label="Deadline">
          <input type="date" className="input mb-4" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
        </FormField>
        <FormField label="Notes (facultatif)">
          <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </FormField>

        {error && (
          <p className="text-sm font-medium mt-3" style={{ color: '#b3261e' }}>{error}</p>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" className="btn-secondary" onClick={close}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={!canSubmit}
            style={!canSubmit ? { opacity: .5, cursor: 'not-allowed' } : undefined}>
            {saving ? 'Ajout…' : 'Ajouter la tâche'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Correspondance priorités existantes → groupes d'affichage ───────────────
// Centralisé ici pour pouvoir faire évoluer la correspondance plus tard
// sans toucher aux anciennes valeurs stockées en base.
function groupForPriorite(priorite) {
  if (priorite === 'urgente' || priorite === 'haute') return 'urgentes'
  return 'secondaires' // moyenne, normale, basse, ou valeur inconnue
}

function sortTaches(list, todayStr) {
  return [...list].sort((a, b) => {
    const rank = (t) => {
      const overdue = t.deadline && t.deadline < todayStr
      if (overdue) return 0
      if (groupForPriorite(t.priorite) === 'urgentes' && t.deadline === todayStr) return 1
      if (groupForPriorite(t.priorite) === 'urgentes') return 2
      return 3
    }
    return rank(a) - rank(b) || (a.deadline || '').localeCompare(b.deadline || '')
  })
}

// ─── Une colonne de to-do (Sheryn ou Chaïnez) ────────────────────────────────
function TodoColumn({ profil, taches, clients, projets, moveTache, addNotification, todayStr, currentProfil }) {
  const [openUrgentes, setOpenUrgentes] = useState(true)
  const [openSecondaires, setOpenSecondaires] = useState(true)

  const mine = taches.filter(t => t.statut !== 'termine' && (t.assignee === profil || t.assignee === 'Les deux'))
  const urgentes = sortTaches(mine.filter(t => groupForPriorite(t.priorite) === 'urgentes'), todayStr)
  const secondaires = sortTaches(mine.filter(t => groupForPriorite(t.priorite) === 'secondaires'), todayStr)

  const getAssocLabel = (t) => {
    const client = clients.find(c => c.id === t.clientId)
    if (client) return client.nom
    const projet = projets.find(p => p.id === t.projetId)
    return projet?.nom || null
  }

  const handleDone = (t) => {
    moveTache(t.id, 'termine')
    if (currentProfil === 'Chainez' && (t.assignee === 'Sheryn' || t.assignee === 'Les deux')) {
      addNotification({
        type: 'tache',
        titre: 'Tâche terminée par Chainez',
        message: `"${t.titre}" a été marquée comme terminée.`,
        lien: '/taches',
      })
    }
  }

  const Group = ({ title, items, open, setOpen }) => (
    <div className="mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide mb-1.5 bg-white"
        style={{ color: '#241512', border: '1px solid #eeece7', boxShadow: '0 1px 2px rgba(36,21,18,.04)' }}
      >
        <span>{title} · {items.length}</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="space-y-1">
          {items.length === 0 && (
            <p className="text-xs px-3 py-2" style={{ color: '#a89b8c' }}>Aucune tâche</p>
          )}
          {items.map(t => {
            const overdue = t.deadline && t.deadline < todayStr
            const assoc = getAssocLabel(t)
            return (
              <div key={t.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f7f6f3] transition-colors group">
                <button
                  onClick={() => handleDone(t)}
                  className="mt-0.5 w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
                  style={{ borderColor: '#d4c9b0', background: '#fff' }}
                  title="Marquer comme terminée"
                >
                  <div className="w-2 h-2 rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: '#b8a508' }} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold truncate" style={{ color: '#241512' }}>{t.titre}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#a89b8c' }}>
                    {assoc || '—'}
                    {t.deadline && (
                      <span style={{ color: overdue ? '#8a5a2b' : '#a89b8c' }}>
                        {' '}· {overdue ? 'En retard · ' : ''}{new Date(t.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: profil === 'Chainez' ? '#6f4e3d' : '#241512', color: '#FDFCF8' }}>
          {profil[0]}
        </div>
        <span className="text-sm font-bold tracking-wide uppercase" style={{ color: '#241512' }}>{profil === 'Chainez' ? 'Chaïnez' : profil}</span>
      </div>

      <Group title="Urgentes" items={urgentes} open={openUrgentes} setOpen={setOpenUrgentes} />
      <Group title="Secondaires" items={secondaires} open={openSecondaires} setOpen={setOpenSecondaires} />
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { taches, clients, projets, rdvs, formReponses, partenaireItems, contenus, moveTache, addTache, addNotification } = useStore()
  const profil = localStorage.getItem('sc-crm-profil') || 'Sheryn'

  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [taskAddedToast, setTaskAddedToast] = useState(false)
  const taskAddedTimer = useRef(null)

  function handleTaskAdded() {
    setTaskAddedToast(true)
    if (taskAddedTimer.current) clearTimeout(taskAddedTimer.current)
    taskAddedTimer.current = setTimeout(() => setTaskAddedToast(false), 3000)
  }

  const today = new Date().toISOString().split('T')[0]
  const dateLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateLabelCap = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  const nowStr = new Date().toISOString()
  const allUpcomingRDVs = rdvs.filter(r => {
    if (!r.date) return false
    if (r.date > today) return true
    if (r.date < today) return false
    if (!r.heure) return true
    return `${r.date}T${r.heure}` > nowStr.slice(0, 16)
  }).sort((a, b) => a.date.localeCompare(b.date) || (a.heure || '').localeCompare(b.heure || ''))
  const upcomingRDVs = allUpcomingRDVs.slice(0, 3)

  const allUpcomingEcheances = taches
    .filter(t => t.deadline && t.statut !== 'termine')
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
  const upcomingEcheances = allUpcomingEcheances.slice(0, 3)

  const newFormReponses = formReponses.filter(r => !r.lu)
  const newFormCount = newFormReponses.length
  const newPartnerItems = partenaireItems.filter(p => !p.lu)
  const newPartnerCount = newPartnerItems.length
  const partnerName = newPartnerItems[0]?.partenaire || 'Cheïma'

  const getClient = (id) => clients.find(c => c.id === id)
  const getAssoc = (t) => getClient(t.clientId)?.nom || projets.find(p => p.id === t.projetId)?.nom || null

  const totalTodoCount = taches.filter(t => t.statut !== 'termine' && (t.assignee === 'Sheryn' || t.assignee === 'Chainez' || t.assignee === 'Les deux')).length

  // Projets en cours (mobile) — exclut les projets livrés/annulés, triés par date de
  // création (le CRM ne suit pas de date de "dernière modification" séparée).
  const projetsEnCours = projets
    .filter(p => p.statut !== 'livre' && p.statut !== 'annule')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 3)

  // Prochains posts de la semaine (mobile) — calendrier éditorial réel, non publiés,
  // avec une date de publication future ou du jour, triés du plus proche au plus loin.
  const upcomingContenus = (contenus || [])
    .filter(c => c.datePublication && c.datePublication >= today && c.statut !== 'publie' && c.statut !== 'archive')
    .sort((a, b) => a.datePublication.localeCompare(b.datePublication))
    .slice(0, 3)
  const jourLabel = (dateStr) => {
    const d = new Date(dateStr)
    const label = d.toLocaleDateString('fr-FR', { weekday: 'long' })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  // Rappels RDV : veille, 1h avant, 30 min avant (fonctionnalité conservée, sans bannière dédiée)
  const notifiedRdvs = useRef(new Set())
  useEffect(() => {
    function checkRdvs() {
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0]

      rdvs.forEach(r => {
        if (!r.date || !r.heure) return
        const rdvTime = new Date(`${r.date}T${r.heure}`)
        const diffMin = (rdvTime - now) / 60000
        const client = getClient(r.clientId)
        const label = `${r.sujet || 'Rendez-vous'}${client ? ` · ${client.nom}` : ''}`

        const veilleKey = `${r.id}_veille`
        if (r.date === tomorrowStr && now.getHours() === 18 && !notifiedRdvs.current.has(veilleKey)) {
          notify('📅 RDV demain', `${label} à ${r.heure}`)
          notifiedRdvs.current.add(veilleKey)
        }

        const h1Key = `${r.id}_1h`
        if (diffMin > 55 && diffMin <= 65 && !notifiedRdvs.current.has(h1Key)) {
          notify('⏰ RDV dans 1 heure', `${label} à ${r.heure}`)
          notifiedRdvs.current.add(h1Key)
        }

        const m30Key = `${r.id}_30m`
        if (diffMin > 25 && diffMin <= 35 && !notifiedRdvs.current.has(m30Key)) {
          notify(`📅 RDV dans 30 min`, `${label} à ${r.heure}`)
          notifiedRdvs.current.add(m30Key)
        }
      })
    }
    checkRdvs()
    const interval = setInterval(checkRdvs, 60000)
    return () => clearInterval(interval)
  }, [rdvs])

  return (
    <div>
      {/* Titre — mobile uniquement ici ; sur desktop il vit dans la colonne gauche pour aligner son sommet avec celui de la to-do */}
      <div className="mb-4 lg:hidden">
        <h1 className="font-display font-bold" style={{ color: '#241512', fontSize: '40px', lineHeight: 1.1 }}>Dashboard</h1>
        <p className="capitalize mt-1" style={{ color: '#a89b8c', fontFamily: 'Inter, sans-serif', fontSize: '16px' }}>{dateLabelCap}</p>
      </div>

      {/* Notifications — au-dessus de la to-do sur mobile, formulaires puis partenaire, en puce discrète */}
      {(newFormCount > 0 || newPartnerCount > 0) && (
        <div className="lg:hidden flex flex-col gap-2.5 mb-4">
          {newFormCount > 0 && (
            <button
              onClick={() => navigate('/formulaires')}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-opacity active:opacity-80"
              style={{ background: '#fcf7cf' }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#8a5a2b' }} />
              <span className="text-[15px] font-bold flex-1" style={{ color: '#5A352D' }}>
                {newFormCount === 1 ? '1 nouveau formulaire' : `${newFormCount} nouveaux formulaires`}
              </span>
            </button>
          )}
          {newPartnerCount > 0 && (
            <button
              onClick={() => navigate('/espace-partenaire')}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-opacity active:opacity-80"
              style={{ background: '#241512' }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#fcf7cf' }} />
              <span className="text-[15px] font-bold flex-1" style={{ color: '#FDFCF8' }}>
                {newPartnerCount === 1 ? '1 nouveau projet' : `${newPartnerCount} nouveaux projets`} transmis par {partnerName}
              </span>
            </button>
          )}
        </div>
      )}

    {/* ── Mobile : widgets raccourcis (pas de scroll) ── */}
    <div className="lg:hidden grid grid-cols-2 gap-3 mb-5">
      <button onClick={() => navigate('/taches')}
        className="col-span-2 flex items-center gap-3 p-4 rounded-2xl text-left" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#241512' }}>
          <CheckSquare size={17} style={{ color: '#FDFCF8' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14.5px', fontWeight: 800, textTransform: 'uppercase', color: '#5A352D', letterSpacing: '0.02em', lineHeight: 1.2 }}>TO-DO DU JOUR</p>
          <p className="text-xs mt-1" style={{ color: '#a89b8c' }}>{totalTodoCount} tâche{totalTodoCount > 1 ? 's' : ''}</p>
        </div>
        <ChevronRight size={16} style={{ color: '#a89b8c' }} className="flex-shrink-0" />
      </button>

      <button onClick={() => navigate('/taches')}
        className="flex flex-col gap-2 p-4 rounded-2xl text-left bg-white" style={{ border: '1px solid #e7e5e1' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fcf7cf' }}>
          <Clock size={16} style={{ color: '#8a7a1f' }} />
        </div>
        <p className="text-[16px] font-bold" style={{ color: '#241512' }}>Échéances</p>
        <p className="text-[13px]" style={{ color: '#a89b8c' }}>{allUpcomingEcheances.length} à venir</p>
      </button>

      <button onClick={() => navigate('/rdv')}
        className="flex flex-col gap-2 p-4 rounded-2xl text-left bg-white" style={{ border: '1px solid #e7e5e1' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fcf7cf' }}>
          <Calendar size={16} style={{ color: '#8a7a1f' }} />
        </div>
        <p className="text-[16px] font-bold" style={{ color: '#241512' }}>Rendez-vous</p>
        <p className="text-[13px]" style={{ color: '#a89b8c' }}>{allUpcomingRDVs.length} à venir</p>
      </button>
    </div>

    {/* Prochains posts de la semaine (mobile) */}
    <div className="lg:hidden bg-white rounded-2xl p-5 mb-5" style={{ border: '1px solid #e7e5e1' }}>
      <p className="font-display text-[21px] font-bold mb-4" style={{ color: '#241512' }}>Prochains posts de la semaine</p>
      {upcomingContenus.length === 0 ? (
        <p className="text-sm" style={{ color: '#a89b8c' }}>Aucun post prévu cette semaine</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {upcomingContenus.map(c => {
            const Icon = c.plateforme === 'Instagram' ? Instagram : Music2
            return (
              <button key={c.id} onClick={() => navigate('/calendrier-editorial')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left" style={{ background: '#fcf7cf' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fff' }}>
                  <Icon size={15} style={{ color: '#8a7a1f' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-bold truncate" style={{ color: '#241512' }}>{c.titre}</p>
                  <p className="text-[13px] truncate" style={{ color: '#a89b8c' }}>
                    {c.client || 'SC Création'} · {jourLabel(c.datePublication)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>

    {/* Projets en cours (mobile) */}
    <div className="lg:hidden bg-white rounded-2xl p-5 mb-5" style={{ border: '1px solid #e7e5e1' }}>
      <p className="font-display text-[21px] font-bold mb-4" style={{ color: '#241512' }}>Projets en cours</p>
      {projetsEnCours.length === 0 ? (
        <p className="text-sm" style={{ color: '#a89b8c' }}>Aucun projet en cours</p>
      ) : (
        <div className="flex flex-col gap-4">
          {projetsEnCours.map(p => (
            <div key={p.id}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[14.5px] font-bold truncate" style={{ color: '#241512' }}>{p.nom}</span>
                <span className="flex-shrink-0">{statutBadge(p.statut)}</span>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ background: '#eeece7' }}>
                <div className="h-1.5 rounded-full" style={{ width: `${p.progression || 0}%`, background: '#241512' }} />
              </div>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => navigate('/projets')}
        className="w-full mt-5 py-3 rounded-xl text-sm font-bold text-center"
        style={{ background: '#f5f4f1', color: '#241512', border: '1px solid #e7e5e1' }}>
        Voir tous les projets
      </button>
    </div>

    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* ── Colonne gauche : titre (desktop), notifications, échéances, rendez-vous ── */}
      <div className="order-2 lg:order-1 w-full lg:w-[40%] xl:w-[38%] min-w-0 flex flex-col gap-5">

        {/* Titre — desktop uniquement, pour que son sommet s'aligne avec celui de la to-do */}
        <div className="hidden lg:block">
          <h1 className="font-display text-2xl sm:text-[1.7rem] font-bold" style={{ color: '#241512' }}>Dashboard</h1>
          <p className="text-sm capitalize" style={{ color: '#a89b8c' }}>{dateLabelCap}</p>
        </div>

        {/* Notifications — desktop uniquement, en haut de la colonne gauche */}
        {(newPartnerCount > 0 || newFormCount > 0) && (
          <div className="hidden lg:flex flex-col gap-4">
            {newPartnerCount > 0 && (
              <button
                onClick={() => navigate('/espace-partenaire')}
                className="flex items-center gap-4 px-8 py-5 rounded-[20px] text-left transition-opacity hover:opacity-90"
                style={{ background: '#241512', minHeight: '74px' }}
              >
                <Handshake size={20} style={{ color: '#b8a508' }} className="flex-shrink-0" />
                <span className="text-[19px] font-semibold flex-1" style={{ color: '#FDFCF8' }}>
                  {newPartnerCount === 1 ? '1 nouveau projet' : `${newPartnerCount} nouveaux projets`} transmis par {partnerName}
                </span>
                <ArrowRight size={18} style={{ color: 'rgba(253,251,244,.5)' }} />
              </button>
            )}
            {newFormCount > 0 && (
              <button
                onClick={() => navigate('/formulaires')}
                className="flex items-center gap-4 px-8 py-5 rounded-[20px] text-left transition-opacity hover:opacity-90"
                style={{ background: '#fcf7cf', minHeight: '74px' }}
              >
                <ClipboardList size={20} style={{ color: '#8a7a1f' }} className="flex-shrink-0" />
                <span className="text-[19px] font-semibold flex-1" style={{ color: '#241512' }}>
                  {newFormCount === 1 ? '1 nouveau formulaire' : `${newFormCount} nouveaux formulaires`}
                </span>
                <ArrowRight size={18} style={{ color: '#8a7a1f' }} />
              </button>
            )}
          </div>
        )}

        {/* Prochaines échéances — desktop uniquement (raccourci équivalent sur mobile) */}
        <div className="hidden lg:flex bg-white rounded-2xl overflow-hidden flex-col" style={{ border: '1px solid #e7e5e1' }}>
          <div className="px-7 pt-6 pb-2">
            <span className="font-display text-lg font-bold" style={{ color: '#241512' }}>Prochaines échéances</span>
          </div>
          {upcomingEcheances.length === 0 ? (
            <p className="text-sm text-center px-7 pt-1 pb-6" style={{ color: '#a89b8c' }}>Aucune échéance à venir</p>
          ) : (
            <div className="px-7 pb-6 pt-2">
              {upcomingEcheances.map((t, i) => {
                const overdue = t.deadline < today
                const isToday = t.deadline === today
                const jours = Math.round((new Date(t.deadline) - new Date(today)) / 86400000)
                return (
                  <div key={t.id} onClick={() => navigate('/taches')}
                    className="flex items-start gap-3.5 py-3.5 cursor-pointer">
                    <div className="flex flex-col items-center pt-2 flex-shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#8a5a2b' }} />
                      {i < upcomingEcheances.length - 1 && (
                        <span className="w-px flex-1 mt-1" style={{ background: '#eeece7', minHeight: '24px' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#8a7a1f' }}>
                          {isToday ? "Aujourd'hui" : new Date(t.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-[15px] font-semibold truncate" style={{ color: '#241512' }}>{t.titre}</p>
                      </div>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
                        style={{ background: overdue ? '#eeece7' : '#FDFCF8', color: overdue ? '#8a5a2b' : '#7e7e7e', border: '1px solid #e7e5e1' }}>
                        {overdue ? 'En retard' : isToday ? "J-0" : `J-${jours}`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Prochains rendez-vous — desktop uniquement (raccourci équivalent sur mobile) */}
        <div className="hidden lg:flex bg-white rounded-2xl overflow-hidden flex-col" style={{ border: '1px solid #e7e5e1' }}>
          <div className="px-7 pt-6 pb-2">
            <span className="font-display text-lg font-bold" style={{ color: '#241512' }}>Prochains rendez-vous</span>
          </div>
          {upcomingRDVs.length === 0 ? (
            <p className="text-sm text-center px-7 pt-1 pb-6" style={{ color: '#a89b8c' }}>Aucun rendez-vous à venir</p>
          ) : (
            <div className="px-7 pb-6 pt-2 flex flex-col gap-3.5">
              {upcomingRDVs.map(r => {
                const client = getClient(r.clientId)
                return (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-4 rounded-xl" style={{ background: '#F4F2EC' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: '#a89b8c' }}>
                        {r.date ? new Date(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}{r.heure ? ` · ${r.heure}` : ''}
                      </p>
                      <p className="text-[15px] font-semibold truncate" style={{ color: '#241512' }}>{r.sujet || 'Rendez-vous'}</p>
                      {client && <p className="text-xs truncate" style={{ color: '#a89b8c' }}>{client.nom}</p>}
                    </div>
                    {r.lienMeet && (
                      <a href={r.lienMeet} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl flex-shrink-0"
                        style={{ background: '#241512', color: '#FDFCF8' }}>
                        <Video size={13} /> Rejoindre
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Projets en cours — desktop uniquement (même carte que sur mobile) */}
        <div className="hidden lg:flex bg-white rounded-2xl p-7 flex-col" style={{ border: '1px solid #e7e5e1' }}>
          <span className="font-display text-lg font-bold mb-4" style={{ color: '#241512' }}>Projets en cours</span>
          {projetsEnCours.length === 0 ? (
            <p className="text-sm" style={{ color: '#a89b8c' }}>Aucun projet en cours</p>
          ) : (
            <div className="flex flex-col gap-4">
              {projetsEnCours.map(p => (
                <div key={p.id}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[14.5px] font-bold truncate" style={{ color: '#241512' }}>{p.nom}</span>
                    <span className="flex-shrink-0">{statutBadge(p.statut)}</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: '#eeece7' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${p.progression || 0}%`, background: '#241512' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/projets')}
            className="w-full mt-5 py-3 rounded-xl text-sm font-bold text-center"
            style={{ background: '#f5f4f1', color: '#241512', border: '1px solid #e7e5e1' }}>
            Voir tous les projets
          </button>
        </div>

        {/* Prochains posts de la semaine — desktop uniquement (même carte que sur mobile) */}
        <div className="hidden lg:flex bg-white rounded-2xl p-7 flex-col" style={{ border: '1px solid #e7e5e1' }}>
          <span className="font-display text-lg font-bold mb-4" style={{ color: '#241512' }}>Prochains posts de la semaine</span>
          {upcomingContenus.length === 0 ? (
            <p className="text-sm" style={{ color: '#a89b8c' }}>Aucun post prévu cette semaine</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {upcomingContenus.map(c => {
                const Icon = c.plateforme === 'Instagram' ? Instagram : Music2
                return (
                  <button key={c.id} onClick={() => navigate('/calendrier-editorial')}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left" style={{ background: '#fcf7cf' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fff' }}>
                      <Icon size={15} style={{ color: '#8a7a1f' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-bold truncate" style={{ color: '#241512' }}>{c.titre}</p>
                      <p className="text-[13px] truncate" style={{ color: '#a89b8c' }}>
                        {c.client || 'SC Création'} · {jourLabel(c.datePublication)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Colonne droite : To-do du jour (desktop uniquement, remplacée par MobileTodoCard sur mobile) ──
           Colonne indépendante : commence au niveau du titre et descend presque jusqu'en bas du viewport,
           quel que soit le nombre de tâches affichées. */}
      <div className="hidden lg:flex lg:flex-col order-1 lg:order-2 w-full lg:flex-1 min-w-0">
        <div className="rounded-3xl p-8 flex flex-col lg:min-h-[calc(100vh-64px)]" style={{ background: '#F4F2EC', border: '1px solid #e7e5e1' }}>
          <div className="flex items-center justify-between gap-2.5 mb-8 flex-shrink-0">
            <span className="font-display text-xl font-bold" style={{ color: '#241512' }}>TO-DO DU JOUR</span>
            <button
              onClick={() => setQuickAddOpen(true)}
              className="flex items-center gap-1.5 font-bold rounded-full transition-colors flex-shrink-0 px-2.5 py-2.5 sm:px-4"
              style={{ background: '#241512', color: '#FDFCF8' }}
              onMouseEnter={e => e.currentTarget.style.background = '#3a2620'}
              onMouseLeave={e => e.currentTarget.style.background = '#241512'}
              title="Ajouter une tâche"
            >
              <Plus size={15} />
              <span className="hidden sm:inline text-sm">Ajouter une tâche</span>
            </button>
          </div>

          {taskAddedToast && (
            <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0" style={{ background: '#e6f6ee', color: '#1a9a5b' }}>
              <Check size={15} /> Tâche ajoutée avec succès
            </div>
          )}

          <div className="flex-1 flex flex-col sm:flex-row gap-8 sm:gap-10">
            <TodoColumn profil="Sheryn" taches={taches} clients={clients} projets={projets}
              moveTache={moveTache} addNotification={addNotification} todayStr={today} currentProfil={profil} navigate={navigate} />
            <div className="hidden sm:block w-px" style={{ background: '#eeece7' }} />
            <TodoColumn profil="Chainez" taches={taches} clients={clients} projets={projets}
              moveTache={moveTache} addNotification={addNotification} todayStr={today} currentProfil={profil} navigate={navigate} />
          </div>

          <button onClick={() => navigate('/taches')}
            className="mt-auto pt-4 w-full flex items-center gap-1.5 text-sm font-semibold flex-shrink-0"
            style={{ borderTop: '1px solid #eeece7', color: '#8a7a1f' }}>
            Ouvrir toute la to-do <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>

    <QuickAddTaskModal
      isOpen={quickAddOpen}
      onClose={() => setQuickAddOpen(false)}
      clients={clients}
      projets={projets}
      addTache={addTache}
      onAdded={handleTaskAdded}
    />
    </div>
  )
}
