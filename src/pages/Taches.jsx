import { useState, useRef } from 'react'
import { Plus, List, Columns, Check, X, Trash2, Edit } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge, prioriteBadge, assigneeBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const COLUMNS = [
  { id: 'pas_commence', label: 'Pas commencé', color: 'bg-gray-400' },
  { id: 'a_faire', label: 'À faire', color: 'bg-blue-500' },
  { id: 'en_cours', label: 'En cours', color: 'bg-indigo-500' },
  { id: 'en_attente', label: 'Attente client', color: 'bg-amber-500' },
  { id: 'urgent', label: 'Urgent', color: 'bg-red-500' },
  { id: 'termine', label: 'Terminé', color: 'bg-emerald-500' },
]

const emptyTache = { titre: '', description: '', clientId: '', projetId: '', assignee: 'Sheryn', deadline: '', priorite: 'moyenne', statut: 'a_faire', notes: '' }

export default function Taches() {
  const { taches, clients, projets, addTache, updateTache, deleteTache, moveTache } = useStore()
  const [view, setView] = useState('kanban')
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState(emptyTache)
  const [editForm, setEditForm] = useState(null)
  const [filterAssignee, setFilterAssignee] = useState('tous')
  const [filterPriorite, setFilterPriorite] = useState('tous')
  const [dragId, setDragId] = useState(null)

  const today = new Date().toISOString().split('T')[0]
  const getClient = (id) => clients.find(c => c.id === id)
  const getProjets = (clientId) => projets.filter(p => p.clientId === clientId)

  const filtered = taches.filter(t => {
    const a = filterAssignee === 'tous' || t.assignee === filterAssignee
    const p = filterPriorite === 'tous' || t.priorite === filterPriorite
    return a && p
  })

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

  function handleDragStart(e, id) {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e, colId) {
    e.preventDefault()
    if (dragId && dragId !== colId) {
      moveTache(dragId, colId)
    }
    setDragId(null)
  }

  function TacheCard({ t }) {
    const client = getClient(t.clientId)
    const isLate = t.deadline && t.deadline < today && t.statut !== 'termine'
    return (
      <div
        draggable
        onDragStart={e => handleDragStart(e, t.id)}
        className="kanban-card group"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-medium text-gray-800 leading-snug flex-1">{t.titre}</p>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openEdit(t)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit size={12} /></button>
            <button onClick={() => { if (confirm('Supprimer ?')) deleteTache(t.id) }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
          </div>
        </div>
        {client && <p className="text-xs text-gray-400 mb-2">{client.nom}</p>}
        <div className="flex flex-wrap gap-1 mb-2">
          {prioriteBadge(t.priorite)}
          {assigneeBadge(t.assignee)}
        </div>
        {t.deadline && (
          <p className={`text-xs ${isLate ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
            {isLate ? '⚠ ' : ''}📅 {new Date(t.deadline).toLocaleDateString('fr-FR')}
          </p>
        )}
        {t.checklist?.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Checklist</span>
              <span>{t.checklist.filter(c => c.fait).length}/{t.checklist.length}</span>
            </div>
            <div className="w-full bg-gray-100 rounded h-1 mt-1">
              <div className="bg-indigo-400 h-1 rounded" style={{ width: `${t.checklist.length ? (t.checklist.filter(c => c.fait).length / t.checklist.length) * 100 : 0}%` }} />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tâches</h1>
          <p className="text-sm text-gray-500 mt-1">{taches.length} tâche{taches.length > 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setView('kanban')} className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${view === 'kanban' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Columns size={14} /> Kanban
            </button>
            <button onClick={() => setView('liste')} className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${view === 'liste' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <List size={14} /> Liste
            </button>
          </div>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select className="select w-auto text-xs" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
          <option value="tous">Toutes assignées</option>
          <option value="Sheryn">Sheryn</option>
          <option value="Chainez">Chainez</option>
          <option value="Les deux">Les deux</option>
        </select>
        <select className="select w-auto text-xs" value={filterPriorite} onChange={e => setFilterPriorite(e.target.value)}>
          <option value="tous">Toutes priorités</option>
          <option value="urgente">Urgente</option>
          <option value="haute">Haute</option>
          <option value="moyenne">Moyenne</option>
          <option value="basse">Basse</option>
        </select>
        <div className="hidden sm:flex items-center gap-3 ml-2 text-xs text-gray-500">
          {COLUMNS.map(col => (
            <span key={col.id} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${col.color}`} />
              {filtered.filter(t => t.statut === col.id).length} {col.label.toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colTaches = filtered.filter(t => t.statut === col.id)
            return (
              <div
                key={col.id}
                className="kanban-col w-72 sm:w-64 flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, col.id)}
              >
                <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                    <span className="text-xs font-semibold text-gray-700">{col.label}</span>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">{colTaches.length}</span>
                </div>
                <div className="p-2 space-y-2 flex-1">
                  {colTaches.map(t => <TacheCard key={t.id} t={t} />)}
                  <button
                    onClick={() => { setForm({ ...emptyTache, statut: col.id }); setModal(true) }}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={12} /> Ajouter
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Liste view */}
      {view === 'liste' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="table-header">Tâche</th>
                <th className="table-header">Client</th>
                <th className="table-header">Assignée</th>
                <th className="table-header">Priorité</th>
                <th className="table-header">Deadline</th>
                <th className="table-header">Statut</th>
                <th className="table-header w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Aucune tâche</td></tr>}
              {filtered.map(t => {
                const client = getClient(t.clientId)
                const isLate = t.deadline && t.deadline < today && t.statut !== 'termine'
                return (
                  <tr key={t.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-medium text-gray-900">{t.titre}</p>
                      {t.description && <p className="text-xs text-gray-400 truncate max-w-xs">{t.description}</p>}
                    </td>
                    <td className="table-cell text-sm text-gray-600">{client?.nom || '—'}</td>
                    <td className="table-cell">{assigneeBadge(t.assignee)}</td>
                    <td className="table-cell">{prioriteBadge(t.priorite)}</td>
                    <td className="table-cell">
                      <span className={`text-xs ${isLate ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                        {t.deadline ? new Date(t.deadline).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </td>
                    <td className="table-cell">{statutBadge(t.statut)}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit size={14} /></button>
                        <button onClick={() => { if (confirm('Supprimer ?')) deleteTache(t.id) }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouvelle tâche" size="lg">
        <form onSubmit={handleSubmit}>
          <FormField label="Titre" required>
            <input className="input mb-4" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required />
          </FormField>
          <FormField label="Description">
            <textarea className="input resize-none mb-4" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </FormField>
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
          <FormRow cols={2}>
            <FormField label="Assignée">
              <select className="select" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })}>
                <option value="Sheryn">Sheryn</option>
                <option value="Chainez">Chainez</option>
                <option value="Les deux">Les deux</option>
              </select>
            </FormField>
            <FormField label="Priorité">
              <select className="select" value={form.priorite} onChange={e => setForm({ ...form, priorite: e.target.value })}>
                <option value="basse">Basse</option>
                <option value="moyenne">Moyenne</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Deadline">
              <input type="date" className="input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </FormField>
            <FormField label="Statut">
              <select className="select" value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormField label="Notes">
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="btn-primary">Créer la tâche</button>
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
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="btn-secondary" onClick={() => setEditModal(null)}>Annuler</button>
              <button type="submit" className="btn-primary">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
