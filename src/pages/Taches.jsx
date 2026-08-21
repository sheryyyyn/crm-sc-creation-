import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, ChevronLeft, ChevronDown, ChevronUp, Search } from 'lucide-react'
import useStore from '../store/useStore'
import Modal, { FormRow, FormField } from '../components/ui/Modal'
import { taskInputCls, taskInputStyle, TaskField } from '../components/ui/TaskField'

const COLUMNS = [
  { id: 'pas_commence', label: 'Pas commencé', color: 'bg-gray-400' },
  { id: 'a_faire', label: 'À faire', color: 'bg-blue-500' },
  { id: 'en_cours', label: 'En cours', color: 'bg-indigo-500' },
  { id: 'en_attente', label: 'Attente client', color: 'bg-amber-500' },
  { id: 'urgent', label: 'Urgent', color: 'bg-red-500' },
  { id: 'termine', label: 'Terminé', color: 'bg-emerald-500' },
]

const emptyTache = { titre: '', description: '', clientId: '', projetId: '', assignee: 'Sheryn', deadline: '', priorite: 'moyenne', statut: 'a_faire', notes: '' }

// ─── Groupement priorités → Urgentes/Secondaires, réutilisé pour la vue mobile ──
function groupForPrioriteMobile(priorite) {
  if (priorite === 'urgente' || priorite === 'haute') return 'urgentes'
  return 'secondaires'
}
function sortTachesMobile(list, todayStr) {
  return [...list].sort((a, b) => {
    const rank = (t) => {
      const overdue = t.deadline && t.deadline < todayStr
      if (overdue) return 0
      if (groupForPrioriteMobile(t.priorite) === 'urgentes' && t.deadline === todayStr) return 1
      if (groupForPrioriteMobile(t.priorite) === 'urgentes') return 2
      return 3
    }
    return rank(a) - rank(b) || (a.deadline || '').localeCompare(b.deadline || '')
  })
}

// ─── Section repliable Urgentes/Secondaires (vue mobile) ────────────────────────
function MobileGroup({ title, items, open, setOpen, bg, fg, today, getAssoc, onDone, onOpen }) {
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3.5 rounded-2xl"
        style={{ background: bg }}
      >
        {open ? <ChevronUp size={16} style={{ color: fg }} /> : <ChevronDown size={16} style={{ color: fg }} />}
        <span className="text-sm font-bold uppercase tracking-wide flex-1 text-left" style={{ color: fg }}>{title}</span>
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: '#fff', color: fg }}
        >
          {items.length}
        </span>
      </button>
      {open && (
        <div className="bg-white rounded-2xl mt-1.5 overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
          {items.length === 0 ? (
            <p className="text-sm px-4 py-4" style={{ color: '#a89b8c' }}>Aucune tâche</p>
          ) : (
            items.map((t, i) => {
              const overdue = t.deadline && t.deadline < today
              const isToday = t.deadline === today
              const assoc = getAssoc(t)
              return (
                <div
                  key={t.id}
                  onClick={() => onOpen(t)}
                  className="flex items-start gap-3 px-4 py-3.5 cursor-pointer active:bg-[#faf9f6] transition-colors"
                  style={i > 0 ? { borderTop: '1px solid #f0eee9' } : undefined}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onDone(t) }}
                    className="mt-0.5 w-[22px] h-[22px] rounded-[6px] border-2 flex-shrink-0 active:scale-90 transition-transform"
                    style={{ borderColor: '#d4c9b0', background: '#fff' }}
                    title="Marquer comme terminée"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold" style={{ color: '#241512' }}>{t.titre}</p>
                    <p className="text-[13px] mt-0.5" style={{ color: '#a89b8c' }}>
                      {assoc || '—'}
                      {t.deadline && (
                        <span className="font-bold" style={{ color: overdue || isToday ? '#b3452e' : '#241512' }}>
                          {' '}· {overdue ? 'En retard' : isToday ? "Aujourd'hui" : new Date(t.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── Section repliable Urgentes/Secondaires (vue desktop) ───────────────────────
function DesktopGroup({ title, titleColor, items, open, setOpen, today, getAssoc, onDone, onOpen, onDoneAll, assigneeLabel }) {
  return (
    <div className="bg-white rounded-2xl mb-6 overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: open ? '1px solid #eeece7' : 'none' }}>
        <button
          onClick={() => onDoneAll()}
          className="w-[18px] h-[18px] rounded-[6px] border-2 flex-shrink-0"
          style={{ borderColor: '#d4c9b0' }}
          title="Tout marquer comme terminé"
        />
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 flex-1 text-left">
          <span className="text-sm font-bold uppercase tracking-wide" style={{ color: titleColor, fontFamily: 'Inter, sans-serif' }}>{title}</span>
        </button>
        <span className="text-sm" style={{ color: '#a89b8c' }}>{items.length}</span>
        <button onClick={() => setOpen(o => !o)}>
          {open ? <ChevronUp size={16} style={{ color: '#a89b8c' }} /> : <ChevronDown size={16} style={{ color: '#a89b8c' }} />}
        </button>
      </div>
      {open && (
        items.length === 0 ? (
          <p className="text-sm px-6 py-6" style={{ color: '#a89b8c' }}>Aucune tâche</p>
        ) : (
          items.map((t, i) => {
            const overdue = t.deadline && t.deadline < today
            const isToday = t.deadline === today
            const assoc = getAssoc(t)
            return (
              <div
                key={t.id}
                onClick={() => onOpen(t)}
                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[#faf9f6] transition-colors"
                style={i > 0 ? { borderTop: '1px solid #f0eee9' } : undefined}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onDone(t) }}
                  className="w-[18px] h-[18px] rounded-[5px] border-2 flex-shrink-0 transition-transform hover:scale-110"
                  style={{ borderColor: '#d4c9b0', background: '#fff' }}
                  title="Marquer comme terminée"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold" style={{ color: '#241512' }}>{t.titre}</p>
                  <div className="flex items-center flex-wrap gap-2 mt-1.5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#f5f4f1', color: '#241512' }}>
                      {assigneeLabel(t.assignee)}
                    </span>
                    {assoc && <span className="text-xs" style={{ color: '#a89b8c' }}>{assoc}</span>}
                    {t.deadline && (
                      <span className="text-xs font-bold" style={{ color: overdue ? '#a1402d' : isToday ? '#a1402d' : '#a89b8c' }}>
                        {overdue ? 'En retard · ' : isToday ? "Aujourd'hui · " : ''}
                        {new Date(t.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0" style={{ background: '#fcf7cf', color: '#8a7a1f' }}>
                  {statutLabel(t.statut)}
                </span>
              </div>
            )
          })
        )
      )}
    </div>
  )
}

function statutLabel(statut) {
  const found = COLUMNS.find(c => c.id === statut)
  return found ? found.label : statut
}

export default function Taches() {
  const navigate = useNavigate()
  const { taches, clients, projets, addTache, updateTache, deleteTache, moveTache } = useStore()
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState(emptyTache)
  const [editForm, setEditForm] = useState(null)
  const [mobileProfil, setMobileProfil] = useState('Sheryn')
  const [openUrgentes, setOpenUrgentes] = useState(true)
  const [openSecondaires, setOpenSecondaires] = useState(true)
  const [desktopWho, setDesktopWho] = useState('Toutes')
  const [desktopSearch, setDesktopSearch] = useState('')
  const [desktopProjetFilter, setDesktopProjetFilter] = useState('tous')
  const [desktopOpenUrgentes, setDesktopOpenUrgentes] = useState(true)
  const [desktopOpenSecondaires, setDesktopOpenSecondaires] = useState(true)

  const today = new Date().toISOString().split('T')[0]
  const getClient = (id) => clients.find(c => c.id === id)
  const getProjets = (clientId) => projets.filter(p => p.clientId === clientId)
  const getAssoc = (t) => getClient(t.clientId)?.nom || projets.find(p => p.id === t.projetId)?.nom || null

  // ── Vue mobile : tâches groupées par personne puis par priorité ──
  const mineFor = (profil) => taches.filter(t => t.statut !== 'termine' && (t.assignee === profil || t.assignee === 'Les deux'))
  const sherynCount = mineFor('Sheryn').length
  const chainezCount = mineFor('Chainez').length
  const mobileMine = mineFor(mobileProfil)
  const mobileUrgentes = sortTachesMobile(mobileMine.filter(t => groupForPrioriteMobile(t.priorite) === 'urgentes'), today)
  const mobileSecondaires = sortTachesMobile(mobileMine.filter(t => groupForPrioriteMobile(t.priorite) === 'secondaires'), today)
  const handleMobileDone = (t) => moveTache(t.id, 'termine')

  // ── Vue desktop : mêmes tâches, groupées globalement urgentes/secondaires ──
  const assigneeLabelDesktop = (a) => (a === 'Chainez' ? 'Chaïnez' : a === 'Les deux' ? 'Communes' : a)
  const desktopFiltered = taches.filter(t => {
    if (t.statut === 'termine') return false
    if (desktopWho === 'Sheryn' && t.assignee !== 'Sheryn') return false
    if (desktopWho === 'Chainez' && t.assignee !== 'Chainez') return false
    if (desktopWho === 'Communes' && t.assignee !== 'Les deux') return false
    if (desktopProjetFilter !== 'tous' && t.projetId !== desktopProjetFilter) return false
    if (desktopSearch.trim()) {
      const q = desktopSearch.trim().toLowerCase()
      const assoc = (getAssoc(t) || '').toLowerCase()
      if (!t.titre.toLowerCase().includes(q) && !assoc.includes(q)) return false
    }
    return true
  })
  const desktopUrgentes = sortTachesMobile(desktopFiltered.filter(t => groupForPrioriteMobile(t.priorite) === 'urgentes'), today)
  const desktopSecondaires = sortTachesMobile(desktopFiltered.filter(t => groupForPrioriteMobile(t.priorite) === 'secondaires'), today)
  const handleDoneAllDesktop = (items) => { items.forEach(t => moveTache(t.id, 'termine')) }

  function handleSubmit(e) {
    e.preventDefault()
    addTache(form)
    setModal(false)
    setForm(emptyTache)
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    updateTache(editModal, editForm)
    setEditModal(null)
  }

  function openEdit(t) {
    setEditForm({ ...t })
    setEditModal(t.id)
  }

  return (
    <div>
      {/* ── Mobile : back, aligné avec le hamburger global fixe (Topbar.jsx) ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-20 flex items-end px-4 pb-2 pointer-events-none"
        style={{ height: 'calc(56px + env(safe-area-inset-top))' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-full flex items-center justify-center pointer-events-auto flex-shrink-0"
          style={{ background: '#fff', border: '1px solid #e7e5e1', color: '#241512', marginLeft: '60px' }}
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* ── Mobile : to-do repensée, plus de kanban ── */}
      <div className="lg:hidden">
        <p className="font-display text-[26px] font-bold mb-4" style={{ color: '#241512' }}>To-do du jour</p>

        <div className="flex p-1 rounded-full mb-4" style={{ background: '#fff', border: '1px solid #e7e5e1' }}>
          {['Sheryn', 'Chainez'].map(p => {
            const active = mobileProfil === p
            const count = p === 'Sheryn' ? sherynCount : chainezCount
            return (
              <button
                key={p}
                onClick={() => setMobileProfil(p)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-colors"
                style={{ background: active ? '#241512' : 'transparent' }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: active ? 'rgba(253,251,244,.2)' : '#f5f4f1', color: active ? '#FDFCF8' : '#241512' }}
                >
                  {count}
                </span>
                <span className="text-sm font-bold" style={{ color: active ? '#FDFCF8' : '#241512' }}>
                  {p === 'Chainez' ? 'Chaïnez' : p}
                </span>
              </button>
            )
          })}
        </div>

        <MobileGroup title="Urgentes" items={mobileUrgentes} open={openUrgentes} setOpen={setOpenUrgentes}
          bg="#f5e6e3" fg="#a1402d" today={today} getAssoc={getAssoc} onDone={handleMobileDone} onOpen={openEdit} />
        <MobileGroup title="Secondaires" items={mobileSecondaires} open={openSecondaires} setOpen={setOpenSecondaires}
          bg="#eeece9" fg="#5c5c58" today={today} getAssoc={getAssoc} onDone={handleMobileDone} onOpen={openEdit} />

        <button
          onClick={() => { setForm({ ...emptyTache, assignee: mobileProfil }); setModal(true) }}
          className="fixed z-20 rounded-full flex items-center justify-center"
          style={{ width: '56px', height: '56px', background: '#241512', color: '#FDFCF8', right: '20px', bottom: 'calc(env(safe-area-inset-bottom) + 84px)', boxShadow: '0 4px 16px rgba(36,21,18,.25)' }}
          title="Ajouter une tâche"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* ── Desktop : to-do repensée, mêmes typos que le mobile ── */}
      <div className="hidden lg:block">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>To-do</h1>
            <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>Toutes les tâches de l'agence</p>
          </div>
          <button
            onClick={() => { setForm(emptyTache); setModal(true) }}
            className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-colors"
            style={{ background: '#241512', color: '#FDFCF8' }}
            onMouseEnter={e => e.currentTarget.style.background = '#3a2620'}
            onMouseLeave={e => e.currentTarget.style.background = '#241512'}
          >
            <Plus size={16} /> Nouvelle tâche
          </button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {['Toutes', 'Sheryn', 'Chainez', 'Communes'].map(w => {
            const active = desktopWho === w
            return (
              <button
                key={w}
                onClick={() => setDesktopWho(w)}
                className="px-4 py-2.5 rounded-full text-sm font-bold transition-colors"
                style={active ? { background: '#241512', color: '#FDFCF8' } : { background: '#f5f4f1', color: '#241512' }}
              >
                {w === 'Chainez' ? 'Chaïnez' : w}
              </button>
            )
          })}
        </div>

        <DesktopGroup title="Urgentes" titleColor="#a1402d" items={desktopUrgentes}
          open={desktopOpenUrgentes} setOpen={setDesktopOpenUrgentes}
          today={today} getAssoc={getAssoc} onDone={t => moveTache(t.id, 'termine')} onOpen={openEdit}
          onDoneAll={() => handleDoneAllDesktop(desktopUrgentes)} assigneeLabel={assigneeLabelDesktop} />
        <DesktopGroup title="Secondaires" titleColor="#5c5c58" items={desktopSecondaires}
          open={desktopOpenSecondaires} setOpen={setDesktopOpenSecondaires}
          today={today} getAssoc={getAssoc} onDone={t => moveTache(t.id, 'termine')} onOpen={openEdit}
          onDoneAll={() => handleDoneAllDesktop(desktopSecondaires)} assigneeLabel={assigneeLabelDesktop} />
      </div>

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouvelle tâche" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TaskField label="Titre" required>
            <input className={taskInputCls} style={taskInputStyle} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required placeholder="Ex. Finaliser la homepage" />
          </TaskField>
          <TaskField label="Client">
            <select className={taskInputCls} style={taskInputStyle} value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value, projetId: '' })}>
              <option value="">— Aucun —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </TaskField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TaskField label="Assignée à">
              <select className={taskInputCls} style={taskInputStyle} value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })}>
                <option value="Sheryn">Sheryn</option>
                <option value="Chainez">Chainez</option>
                <option value="Les deux">Les deux</option>
              </select>
            </TaskField>
            <TaskField label="Catégorie">
              <select className={taskInputCls} style={taskInputStyle} value={form.priorite === 'urgente' ? 'urgente' : 'moyenne'} onChange={e => setForm({ ...form, priorite: e.target.value })}>
                <option value="urgente">Urgentes</option>
                <option value="moyenne">Secondaires</option>
              </select>
            </TaskField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TaskField label="Date d'échéance">
              <input type="date" className={taskInputCls} style={taskInputStyle} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </TaskField>
            <TaskField label="Statut">
              <select className={taskInputCls} style={taskInputStyle} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </TaskField>
          </div>
          <TaskField label="Projet associé">
            <select className={taskInputCls} style={taskInputStyle} value={form.projetId} onChange={e => setForm({ ...form, projetId: e.target.value })}>
              <option value="">Aucun</option>
              {getProjets(form.clientId).map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </TaskField>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: '#241512', color: '#FDFCF8' }}>Créer la tâche</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editForm && (
        <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Modifier la tâche" size="lg">
          <form onSubmit={handleEditSubmit}>
            <FormField label="Titre" required>
              <input className="input mb-4" value={editForm.titre} onChange={e => setEditForm({ ...editForm, titre: e.target.value })} required />
            </FormField>
            <FormRow cols={2}>
              <FormField label="Assignée">
                <select className="select" value={editForm.assignee} onChange={e => setEditForm({ ...editForm, assignee: e.target.value })}>
                  <option value="Sheryn">Sheryn</option>
                  <option value="Chainez">Chainez</option>
                  <option value="Les deux">Les deux</option>
                </select>
              </FormField>
              <FormField label="Priorité">
                <select className="select" value={editForm.priorite} onChange={e => setEditForm({ ...editForm, priorite: e.target.value })}>
                  <option value="basse">Basse</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </FormField>
            </FormRow>
            <FormRow cols={2}>
              <FormField label="Deadline">
                <input type="date" className="input" value={editForm.deadline || ''} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} />
              </FormField>
              <FormField label="Statut">
                <select className="select" value={editForm.statut} onChange={e => setEditForm({ ...editForm, statut: e.target.value })}>
                  {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </FormField>
            </FormRow>

            {/* Checklist */}
            <div className="mb-4">
              <label className="label">Checklist</label>
              <div className="space-y-2 mb-2">
                {(editForm.checklist || []).map((item, i) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={item.fait} onChange={() => {
                      const cl = [...editForm.checklist]
                      cl[i] = { ...cl[i], fait: !cl[i].fait }
                      setEditForm({ ...editForm, checklist: cl })
                    }} className="rounded" />
                    <input className="input flex-1 py-1.5 text-sm" value={item.texte} onChange={e => {
                      const cl = [...editForm.checklist]
                      cl[i] = { ...cl[i], texte: e.target.value }
                      setEditForm({ ...editForm, checklist: cl })
                    }} />
                    <button type="button" onClick={() => setEditForm({ ...editForm, checklist: editForm.checklist.filter((_, j) => j !== i) })}
                      className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <button type="button" className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                onClick={() => setEditForm({ ...editForm, checklist: [...(editForm.checklist || []), { id: `ch_${Date.now()}`, texte: '', fait: false }] })}>
                <Plus size={12} /> Ajouter un item
              </button>
            </div>

            <FormField label="Notes">
              <textarea className="input resize-none" rows={2} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
            </FormField>
            <div className="flex justify-between items-center gap-2 mt-5">
              <button
                type="button"
                onClick={() => { if (confirm('Supprimer cette tâche ?')) { deleteTache(editModal); setEditModal(null) } }}
                className="text-sm font-medium"
                style={{ color: '#b3452e' }}
              >
                Supprimer
              </button>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={() => setEditModal(null)}>Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
