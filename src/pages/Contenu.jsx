import { useState } from 'react'
import { Plus, Rss, Trash2, Edit, Calendar, List, Columns } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const STATUTS = ['idee', 'a_faire', 'en_cours', 'planifie', 'publie']
const STATUTS_KANBAN = [
  { id: 'idee', label: 'Idées', color: 'bg-[#a89b8c]' },
  { id: 'a_faire', label: 'À faire', color: 'bg-blue-500' },
  { id: 'en_cours', label: 'En cours', color: 'bg-[#241512]' },
  { id: 'planifie', label: 'Planifié', color: 'bg-purple-500' },
  { id: 'publie', label: 'Publié', color: 'bg-emerald-500' },
]
const PLATEFORMES = ['Instagram', 'LinkedIn', 'TikTok', 'YouTube', 'Facebook', 'Pinterest', 'Blog', 'Newsletter']
const TYPES = ['Reel', 'Carrousel', 'Story', 'Post', 'Article', 'Vidéo', 'Newsletter', 'Infographie']

const emptyContenu = { titre: '', plateforme: 'Instagram', type: 'Post', statut: 'idee', datePublication: '', hook: '', script: '', description: '', hashtags: '', cta: '' }

const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
const inputStyle = { background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }

export default function Contenu() {
  const { contenus, addContenu, updateContenu, deleteContenu } = useStore()
  const [view, setView] = useState('liste')
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState(emptyContenu)
  const [editForm, setEditForm] = useState(null)
  const [filterPlat, setFilterPlat] = useState('tous')
  const [dragId, setDragId] = useState(null)

  const filtered = filterPlat === 'tous' ? contenus : contenus.filter(c => c.plateforme === filterPlat)

  function handleSubmit(e) {
    e.preventDefault()
    addContenu(form)
    setModal(false)
    setForm(emptyContenu)
  }

  function openEdit(c) {
    setEditForm({ ...c })
    setEditModal(c.id)
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    updateContenu(editModal, editForm)
    setEditModal(null)
  }

  function handleDrop(e, statutId) {
    e.preventDefault()
    if (dragId) updateContenu(dragId, { statut: statutId })
    setDragId(null)
  }

  const platColors = { Instagram: 'bg-pink-100 text-pink-700', LinkedIn: 'bg-blue-100 text-blue-700', TikTok: 'bg-[#f5f4f1] text-[#241512]', YouTube: 'bg-red-100 text-red-700' }
  const typeColors = { Reel: 'bg-purple-100 text-purple-700', Carrousel: 'bg-[#f5f4f1] text-[#241512]', Story: 'bg-orange-100 text-orange-700', Article: 'bg-green-100 text-green-700' }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Calendrier éditorial</h1>
          <p className="text-sm text-[#a89b8c] mt-1">{contenus.length} contenu{contenus.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: '#e7e5e1' }}>
            {[['liste', List, 'Liste'], ['kanban', Columns, 'Kanban']].map(([v, Icon, l]) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${view === v ? 'bg-[#241512] text-white' : 'bg-white text-[#a89b8c] hover:bg-[#f5f4f1]'}`}>
                <Icon size={14} />{l}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }} onClick={() => setModal(true)}>
            <Plus size={16} /> Nouveau contenu
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {['tous', ...PLATEFORMES].map(p => (
          <button key={p} onClick={() => setFilterPlat(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterPlat === p ? 'bg-[#241512] text-white' : 'bg-white border text-[#a89b8c] hover:bg-[#f5f4f1]'}`}
            style={filterPlat !== p ? { borderColor: '#e7e5e1' } : undefined}>
            {p === 'tous' ? 'Toutes plateformes' : p}
          </button>
        ))}
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUTS_KANBAN.map(statut => {
            const col = filtered.filter(c => c.statut === statut.id)
            return (
              <div key={statut.id} className="rounded-2xl min-h-[400px] flex flex-col w-60 flex-shrink-0" style={{ background: '#f5f4f1' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, statut.id)}>
                <div className="flex items-center justify-between px-3 py-3 border-b" style={{ borderColor: '#e7e5e1' }}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statut.color}`} />
                    <span className="text-xs font-semibold text-[#241512]">{statut.label}</span>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#eeece7', color: '#241512' }}>{col.length}</span>
                </div>
                <div className="p-2 space-y-2">
                  {col.map(c => (
                    <div key={c.id} draggable onDragStart={() => setDragId(c.id)}
                      className="bg-white rounded-xl p-3.5 transition-all cursor-grab active:cursor-grabbing group"
                      style={{ border: '1px solid #e7e5e1' }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-[#241512] leading-snug">{c.titre}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                          <button onClick={() => openEdit(c)} className="p-0.5 text-[#a89b8c] hover:text-[#241512]"><Edit size={11} /></button>
                          <button onClick={() => { if (confirm('Supprimer ?')) deleteContenu(c.id) }} className="p-0.5 text-[#a89b8c] hover:text-red-500"><Trash2 size={11} /></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${platColors[c.plateforme] || 'bg-[#f5f4f1] text-[#241512]'}`}>{c.plateforme}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeColors[c.type] || 'bg-[#f5f4f1] text-[#241512]'}`}>{c.type}</span>
                      </div>
                      {c.datePublication && <p className="text-xs text-[#a89b8c]">📅 {new Date(c.datePublication).toLocaleDateString('fr-FR')}</p>}
                      {c.hook && <p className="text-xs text-[#a89b8c] mt-1 italic truncate">"{c.hook}"</p>}
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
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Contenu</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Plateforme</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Date publication</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeece7]">
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-[#a89b8c]">Aucun contenu</td></tr>}
              {filtered.sort((a, b) => (a.datePublication || '').localeCompare(b.datePublication || '')).map(c => (
                <tr key={c.id} className="hover:bg-[#f5f4f1]/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#241512]">{c.titre}</p>
                    {c.hook && <p className="text-xs text-[#a89b8c] truncate max-w-xs italic">"{c.hook}"</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${platColors[c.plateforme] || 'bg-[#f5f4f1] text-[#241512]'}`}>{c.plateforme}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColors[c.type] || 'bg-[#f5f4f1] text-[#241512]'}`}>{c.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#a89b8c]">{c.datePublication ? new Date(c.datePublication).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-4 py-3">
                    <select className="text-xs w-auto rounded-lg px-2 py-1 focus:outline-none" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} value={c.statut} onChange={e => updateContenu(c.id, { statut: e.target.value })}>
                      {STATUTS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1 text-[#a89b8c] hover:text-[#241512]"><Edit size={14} /></button>
                      <button onClick={() => { if (confirm('Supprimer ?')) deleteContenu(c.id) }} className="p-1 text-[#a89b8c] hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouveau contenu" size="lg">
        <form onSubmit={handleSubmit}>
          <FormField label="Titre" required>
            <input className={`${inputCls} mb-4`} style={inputStyle} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required />
          </FormField>
          <FormRow cols={3}>
            <FormField label="Plateforme">
              <select className={inputCls} style={inputStyle} value={form.plateforme} onChange={e => setForm({ ...form, plateforme: e.target.value })}>
                {PLATEFORMES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
            <FormField label="Type">
              <select className={inputCls} style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Date publication">
              <input type="date" className={inputCls} style={inputStyle} value={form.datePublication} onChange={e => setForm({ ...form, datePublication: e.target.value })} />
            </FormField>
          </FormRow>
          <FormField label="Statut">
            <select className={`${inputCls} mb-4`} style={inputStyle} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
              {STATUTS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </FormField>
          <FormField label="Hook (accroche)">
            <input className={`${inputCls} mb-4`} style={inputStyle} value={form.hook} onChange={e => setForm({ ...form, hook: e.target.value })} placeholder="La phrase qui accroche..." />
          </FormField>
          <FormField label="Script / Contenu">
            <textarea className={`${inputCls} resize-none mb-4`} style={inputStyle} rows={3} value={form.script} onChange={e => setForm({ ...form, script: e.target.value })} />
          </FormField>
          <FormRow cols={2}>
            <FormField label="Hashtags">
              <input className={inputCls} style={inputStyle} value={form.hashtags} onChange={e => setForm({ ...form, hashtags: e.target.value })} placeholder="#webdesign #sccreation" />
            </FormField>
            <FormField label="CTA">
              <input className={inputCls} style={inputStyle} value={form.cta} onChange={e => setForm({ ...form, cta: e.target.value })} placeholder="Lien en bio..." />
            </FormField>
          </FormRow>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }}>Créer</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editForm && (
        <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Modifier le contenu" size="lg">
          <form onSubmit={handleEditSubmit}>
            <FormField label="Titre">
              <input className={`${inputCls} mb-4`} style={inputStyle} value={editForm.titre} onChange={e => setEditForm({ ...editForm, titre: e.target.value })} />
            </FormField>
            <FormRow cols={2}>
              <FormField label="Statut">
                <select className={inputCls} style={inputStyle} value={editForm.statut} onChange={e => setEditForm({ ...editForm, statut: e.target.value })}>
                  {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Date publication">
                <input type="date" className={inputCls} style={inputStyle} value={editForm.datePublication || ''} onChange={e => setEditForm({ ...editForm, datePublication: e.target.value })} />
              </FormField>
            </FormRow>
            <FormField label="Hook">
              <input className={`${inputCls} mb-4`} style={inputStyle} value={editForm.hook || ''} onChange={e => setEditForm({ ...editForm, hook: e.target.value })} />
            </FormField>
            <FormField label="Script">
              <textarea className={`${inputCls} resize-none mb-4`} style={inputStyle} rows={3} value={editForm.script || ''} onChange={e => setEditForm({ ...editForm, script: e.target.value })} />
            </FormField>
            <FormField label="Hashtags">
              <input className={`${inputCls} mb-4`} style={inputStyle} value={editForm.hashtags || ''} onChange={e => setEditForm({ ...editForm, hashtags: e.target.value })} />
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
