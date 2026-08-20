import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Video, ClipboardList, Handshake, ArrowRight, ChevronDown, ChevronUp, Plus, Check,
} from 'lucide-react'
import useStore from '../store/useStore'
import { notify } from '../utils/notify'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

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

// ─── Carte to-do mobile : mêmes groupes repliables URGENTES/SECONDAIRES que le desktop ──
function MobileTodoCard({ profil, taches, clients, projets, moveTache, addNotification, todayStr, currentProfil, navigate }) {
  const [openUrgentes, setOpenUrgentes] = useState(true)
  const [openSecondaires, setOpenSecondaires] = useState(false)

  const mine = taches.filter(t => t.statut !== 'termine' && (t.assignee === profil || t.assignee === 'Les deux'))
  const urgentes = sortTaches(mine.filter(t => groupForPriorite(t.priorite) === 'urgentes'), todayStr)
  const secondaires = sortTaches(mine.filter(t => groupForPriorite(t.priorite) === 'secondaires'), todayStr)

  const getAssocLabel = (t) => {
    const client = clients.find(c => c.id === t.clientId)
    if (client) return client.nom
    const projet = projets.find(p => p.id === t.projetId)
    return projet?.nom || null
  }

  const handleDone = (e, t) => {
    e.stopPropagation()
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
    <div className="mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide bg-white"
        style={{ color: '#241512', border: '1px solid #eeece7' }}
      >
        <span>{title} · {items.length}</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && items.length > 0 && (
        <div className="mt-1">
          {items.map(t => {
            const overdue = t.deadline && t.deadline < todayStr
            const assoc = getAssocLabel(t)
            return (
              <div key={t.id} onClick={() => navigate('/taches')}
                className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer active:bg-[#f7f6f3] transition-colors rounded-lg">
                <button
                  onClick={(e) => handleDone(e, t)}
                  className="mt-0.5 w-[16px] h-[16px] rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                  style={{ borderColor: '#d4c9b0', background: '#fff' }}
                  title="Marquer comme terminée"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: '#241512' }}>{t.titre}</p>
                  <p className="text-[10.5px] mt-0.5 truncate" style={{ color: '#a89b8c' }}>
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
    <div className="rounded-2xl overflow-hidden" style={{ background: '#F4F2EC', border: '1px solid #e7e5e1' }}>
      <div className="flex items-center gap-2.5 px-4 py-3.5" style={{ borderBottom: '1px solid #eeece7' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: profil === 'Chainez' ? '#6f4e3d' : '#241512', color: '#FDFCF8' }}>
          {profil[0]}
        </div>
        <span className="font-display text-[15px] font-bold flex-1" style={{ color: '#241512' }}>
          To-do {profil === 'Chainez' ? 'Chaïnez' : profil}
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#ffffff', color: '#a89b8c', border: '1px solid #e7e5e1' }}>
          {urgentes.length + secondaires.length}
        </span>
      </div>

      <div className="p-3">
        <Group title="Urgentes" items={urgentes} open={openUrgentes} setOpen={setOpenUrgentes} />
        <Group title="Secondaires" items={secondaires} open={openSecondaires} setOpen={setOpenSecondaires} />
      </div>

      <button onClick={() => navigate('/taches')}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-3"
        style={{ color: '#8a7a1f', borderTop: '1px solid #eeece7' }}>
        Ouvrir la to-do <ArrowRight size={12} />
      </button>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { taches, clients, projets, rdvs, formReponses, partenaireItems, moveTache, addTache, addNotification } = useStore()
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
      <div className="mb-3 lg:hidden">
        <h1 className="font-display text-2xl sm:text-[1.7rem] font-bold" style={{ color: '#241512' }}>Dashboard</h1>
        <p className="text-sm capitalize" style={{ color: '#a89b8c' }}>{dateLabelCap}</p>
      </div>

      {/* Notifications — au-dessus de la to-do sur mobile (la colonne gauche n'existe pas encore) */}
      {(newPartnerCount > 0 || newFormCount > 0) && (
        <div className="lg:hidden flex flex-col gap-2.5 mb-4">
          {newPartnerCount > 0 && (
            <button
              onClick={() => navigate('/espace-partenaire')}
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-left transition-opacity hover:opacity-90"
              style={{ background: '#241512' }}
            >
              <Handshake size={16} style={{ color: '#b8a508' }} className="flex-shrink-0" />
              <span className="text-sm font-semibold flex-1" style={{ color: '#FDFCF8' }}>
                {newPartnerCount === 1 ? '1 nouveau projet' : `${newPartnerCount} nouveaux projets`} transmis par {partnerName}
              </span>
              <ArrowRight size={14} style={{ color: 'rgba(253,251,244,.5)' }} />
            </button>
          )}
          {newFormCount > 0 && (
            <button
              onClick={() => navigate('/formulaires')}
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-left transition-opacity hover:opacity-90"
              style={{ background: '#fcf7cf' }}
            >
              <ClipboardList size={16} style={{ color: '#8a7a1f' }} className="flex-shrink-0" />
              <span className="text-sm font-semibold flex-1" style={{ color: '#241512' }}>
                {newFormCount === 1 ? '1 nouveau formulaire' : `${newFormCount} nouveaux formulaires`}
              </span>
              <ArrowRight size={14} style={{ color: '#8a7a1f' }} />
            </button>
          )}
        </div>
      )}

    {/* ── Mobile : to-do de chacune (aperçu) ── */}
    <div className="lg:hidden flex flex-col gap-3 mb-5">
      <MobileTodoCard profil="Sheryn" taches={taches} clients={clients} projets={projets}
        moveTache={moveTache} addNotification={addNotification} todayStr={today} currentProfil={profil} navigate={navigate} />
      <MobileTodoCard profil="Chainez" taches={taches} clients={clients} projets={projets}
        moveTache={moveTache} addNotification={addNotification} todayStr={today} currentProfil={profil} navigate={navigate} />
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

        {/* Prochaines échéances */}
        <div className="bg-white rounded-2xl overflow-hidden flex flex-col" style={{ border: '1px solid #e7e5e1' }}>
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

        {/* Prochains rendez-vous */}
        <div className="bg-white rounded-2xl overflow-hidden flex flex-col" style={{ border: '1px solid #e7e5e1' }}>
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
