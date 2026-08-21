import { useState } from 'react'
import { Plus, Phone, Mail, Euro, Trash2, Edit, ArrowRight } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const ETAPES = [
  { id: 'prospect', label: 'Prospect', color: 'bg-[#a89b8c]' },
  { id: 'contacte', label: 'Contacté', color: 'bg-blue-500' },
  { id: 'appel', label: 'Appel', color: 'bg-purple-500' },
  { id: 'devis_envoye', label: 'Devis envoyé', color: 'bg-amber-500' },
  { id: 'gagne', label: 'Gagné', color: 'bg-emerald-500' },
  { id: 'perdu', label: 'Perdu', color: 'bg-red-500' },
]

const emptyLead = { nom: '', contact: '', email: '', telephone: '', budget: '', source: '', etape: 'prospect', notes: '' }
const SOURCES = ['Instagram', 'LinkedIn', 'Site web', 'Google', 'Bouche à oreille', 'Recommandation', 'Autre']

const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
const inputStyle = { background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }

export default function CRM() {
  const { leads, addLead, updateLead, deleteLead } = useStore()
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState(emptyLead)
  const [editForm, setEditForm] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [view, setView] = useState('kanban')

  function handleSubmit(e) {
    e.preventDefault()
    addLead(form)
    setModal(false)
    setForm(emptyLead)
  }

  function openEdit(l) {
    setEditForm({ ...l })
    setEditModal(l.id)
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    updateLead(editModal, editForm)
    setEditModal(null)
  }

  function handleDragStart(e, id) {
    setDragId(id)
  }

  function handleDrop(e, etapeId) {
    e.preventDefault()
    if (dragId) updateLead(dragId, { etape: etapeId })
    setDragId(null)
  }

  const totalBudget = leads.filter(l => l.etape !== 'perdu').reduce((s, l) => s + (Number(l.budget) || 0), 0)
  const gagnes = leads.filter(l => l.etape === 'gagne').length
  const enCours = leads.filter(l => !['gagne', 'perdu'].includes(l.etape)).length

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>CRM Pipeline</h1>
          <p className="text-sm text-[#a89b8c] mt-1">{leads.length} leads · {enCours} en cours · {gagnes} gagnés</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: '#e7e5e1' }}>
            {['kanban', 'liste'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${view === v ? 'bg-[#241512] text-white' : 'bg-white text-[#a89b8c] hover:bg-[#f5f4f1]'}`}>
                {v}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }} onClick={() => setModal(true)}>
            <Plus size={16} /> Nouveau lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
          <p className="text-xs text-[#a89b8c] mb-1">Budget pipeline</p>
          <p className="text-xl font-bold text-[#241512]">{totalBudget.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
          <p className="text-xs text-[#a89b8c] mb-1">Leads en cours</p>
          <p className="text-xl font-bold text-[#241512]">{enCours}</p>
        </div>
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
          <p className="text-xs text-[#a89b8c] mb-1">Taux conversion</p>
          <p className="text-xl font-bold text-[#241512]">{leads.length ? Math.round((gagnes / leads.length) * 100) : 0}%</p>
        </div>
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ETAPES.map(etape => {
            const etapeLeads = leads.filter(l => l.etape === etape.id)
            return (
              <div
                key={etape.id}
                className="rounded-2xl min-h-[400px] flex flex-col w-60 flex-shrink-0"
                style={{ background: '#f5f4f1' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, etape.id)}
              >
                <div className="flex items-center justify-between px-3 py-3 border-b" style={{ borderColor: '#e7e5e1' }}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${etape.color}`} />
                    <span className="text-xs font-semibold text-[#241512]">{etape.label}</span>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#eeece7', color: '#241512' }}>{etapeLeads.length}</span>
                </div>
                <div className="p-2 space-y-2">
                  {etapeLeads.map(l => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={e => handleDragStart(e, l.id)}
                      className="bg-white rounded-xl p-3.5 transition-all cursor-grab active:cursor-grabbing group"
                      style={{ border: '1px solid #e7e5e1' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-semibold text-[#241512] leading-snug">{l.nom}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(l)} className="p-0.5 text-[#a89b8c] hover:text-[#241512]"><Edit size={11} /></button>
                          <button onClick={() => { if (confirm('Supprimer ?')) deleteLead(l.id) }} className="p-0.5 text-[#a89b8c] hover:text-red-500"><Trash2 size={11} /></button>
                        </div>
                      </div>
                      {l.contact && <p className="text-xs text-[#a89b8c] mb-1">{l.contact}</p>}
                      {l.budget && <p className="text-xs font-semibold text-[#241512] flex items-center gap-0.5"><Euro size={10} />{Number(l.budget).toLocaleString('fr-FR')}</p>}
                      {l.source && <p className="text-xs text-[#a89b8c] mt-1">via {l.source}</p>}
                      {l.relances?.length > 0 && (
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: '#e7e5e1' }}>
                          <p className="text-[10px] text-[#a89b8c]">{l.relances[l.relances.length - 1]}</p>
                        </div>
                      )}
                      {/* Move to next stage */}
                      {etape.id !== 'gagne' && etape.id !== 'perdu' && (
                        <button
                          onClick={() => {
                            const idx = ETAPES.findIndex(e => e.id === etape.id)
                            if (idx < ETAPES.length - 3) updateLead(l.id, { etape: ETAPES[idx + 1].id })
                          }}
                          className="w-full mt-2 text-[10px] text-[#241512] hover:bg-[#f5f4f1] py-1 rounded flex items-center justify-center gap-1 transition-colors"
                        >
                          Étape suivante <ArrowRight size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Liste */}
      {view === 'liste' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f5f4f1' }}>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Lead</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Contact</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Budget</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Source</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Étape</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeece7]">
              {leads.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-[#a89b8c]">Aucun lead</td></tr>}
              {leads.map(l => (
                <tr key={l.id} className="hover:bg-[#f5f4f1]/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#241512]">{l.nom}</p>
                    {l.notes && <p className="text-xs text-[#a89b8c] truncate max-w-xs">{l.notes}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[#241512]">{l.contact}</p>
                    {l.email && <p className="text-xs text-[#a89b8c]">{l.email}</p>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#241512]">{l.budget ? `${Number(l.budget).toLocaleString('fr-FR')} €` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#a89b8c]">{l.source || '—'}</td>
                  <td className="px-4 py-3">
                    <select className="text-xs w-auto rounded-lg px-2 py-1 focus:outline-none" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} value={l.etape} onChange={e => updateLead(l.id, { etape: e.target.value })}>
                      {ETAPES.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(l)} className="p-1 text-[#a89b8c] hover:text-[#241512]"><Edit size={14} /></button>
                      <button onClick={() => { if (confirm('Supprimer ?')) deleteLead(l.id) }} className="p-1 text-[#a89b8c] hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouveau lead" size="lg">
        <form onSubmit={handleSubmit}>
          <FormRow cols={2}>
            <FormField label="Nom entreprise / Lead" required>
              <input className={inputCls} style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
            </FormField>
            <FormField label="Contact">
              <input className={inputCls} style={inputStyle} value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Email">
              <input type="email" className={inputCls} style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </FormField>
            <FormField label="Téléphone">
              <input className={inputCls} style={inputStyle} value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Budget estimé (€)">
              <input type="number" className={inputCls} style={inputStyle} value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </FormField>
            <FormField label="Source">
              <select className={inputCls} style={inputStyle} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                <option value="">— Choisir —</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormField label="Étape">
            <select className={`${inputCls} mb-4`} style={inputStyle} value={form.etape} onChange={e => setForm({ ...form, etape: e.target.value })}>
              {ETAPES.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </FormField>
          <FormField label="Notes">
            <textarea className={`${inputCls} resize-none`} style={inputStyle} rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }}>Ajouter le lead</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editForm && (
        <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Modifier le lead" size="lg">
          <form onSubmit={handleEditSubmit}>
            <FormRow cols={2}>
              <FormField label="Nom"><input className={inputCls} style={inputStyle} value={editForm.nom} onChange={e => setEditForm({ ...editForm, nom: e.target.value })} /></FormField>
              <FormField label="Budget (€)"><input type="number" className={inputCls} style={inputStyle} value={editForm.budget || ''} onChange={e => setEditForm({ ...editForm, budget: e.target.value })} /></FormField>
            </FormRow>
            <FormField label="Étape">
              <select className={`${inputCls} mb-4`} style={inputStyle} value={editForm.etape} onChange={e => setEditForm({ ...editForm, etape: e.target.value })}>
                {ETAPES.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </FormField>
            <FormField label="Notes">
              <textarea className={`${inputCls} resize-none`} style={inputStyle} rows={3} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
            </FormField>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => setEditModal(null)}>Annuler</button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }}>Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
