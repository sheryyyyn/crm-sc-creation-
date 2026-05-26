import { useState } from 'react'
import { Plus, Video, Calendar, Clock, Edit, Trash2, ExternalLink } from 'lucide-react'
import useStore from '../store/useStore'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const emptyRDV = { clientId: '', date: '', heure: '', lienMeet: '', sujet: '', objectif: '', notes: '', compteRendu: '', prochainesActions: [] }

export default function RDV() {
  const { rdvs, clients, addRDV, updateRDV, deleteRDV } = useStore()
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState(emptyRDV)
  const [editForm, setEditForm] = useState(null)
  const [tab, setTab] = useState('a_venir')

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rendez-vous</h1>
          <p className="text-sm text-gray-500 mt-1">{aVenir.length} à venir · {passes.length} passé{passes.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> Nouveau RDV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {[['a_venir', `À venir (${aVenir.length})`], ['passes', `Passés (${passes.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${tab === k ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* RDV cards */}
      <div className="space-y-3">
        {displayed.length === 0 && (
          <div className="card p-12 text-center text-gray-400">Aucun rendez-vous {tab === 'a_venir' ? 'à venir' : 'passé'}</div>
        )}
        {displayed.map(r => {
          const client = getClient(r.clientId)
          const isToday = r.date === today
          return (
            <div key={r.id} className={`card p-5 ${isToday ? 'border-indigo-300 bg-indigo-50/30' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  {/* Date block */}
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
                    <span className={`text-lg font-bold leading-none ${isToday ? 'text-white' : 'text-gray-800'}`}>
                      {r.date ? new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit' }) : '?'}
                    </span>
                    <span className={`text-[10px] uppercase font-semibold ${isToday ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {r.date ? new Date(r.date).toLocaleDateString('fr-FR', { month: 'short' }) : ''}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{r.sujet || 'Rendez-vous'}</p>
                      {isToday && <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">AUJOURD'HUI</span>}
                    </div>
                    {client && <p className="text-sm text-gray-600 mb-1">{client.nom}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {r.heure && <span className="flex items-center gap-1"><Clock size={11} />{r.heure}</span>}
                      {r.objectif && <span>{r.objectif}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
            <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
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
    </div>
  )
}
