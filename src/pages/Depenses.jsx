import { useState } from 'react'
import { Plus, Trash2, Edit, Wallet, TrendingDown, Calendar } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge, assigneeBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const CATEGORIES = ['Outil', 'Publicité', 'Hébergement', 'Prestataire', 'Formation', 'Matériel', 'IA / SaaS', 'Transport', 'Autre']
const FREQUENCES = ['ponctuel', 'mensuel', 'annuel', 'trimestriel']

const emptyDep = { nom: '', categorie: '', montant: '', date: new Date().toISOString().split('T')[0], frequence: 'mensuel', statut: 'paye', responsable: 'Sheryn', notes: '' }

const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
const inputStyle = { background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }

export default function Depenses() {
  const { depenses, addDepense, updateDepense, deleteDepense } = useStore()
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState(emptyDep)
  const [editForm, setEditForm] = useState(null)
  const [filterCat, setFilterCat] = useState('tous')

  const filtered = filterCat === 'tous' ? depenses : depenses.filter(d => d.categorie === filterCat)

  const total = filtered.reduce((s, d) => s + (Number(d.montant) || 0), 0)
  const mensuel = depenses.filter(d => d.frequence === 'mensuel').reduce((s, d) => s + (Number(d.montant) || 0), 0)
  const aVenir = depenses.filter(d => d.statut === 'a_venir').reduce((s, d) => s + (Number(d.montant) || 0), 0)

  const cats = [...new Set(depenses.map(d => d.categorie).filter(Boolean))]

  function handleSubmit(e) {
    e.preventDefault()
    addDepense(form)
    setModal(false)
    setForm(emptyDep)
  }

  function openEdit(d) {
    setEditForm({ ...d })
    setEditModal(d.id)
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    updateDepense(editModal, editForm)
    setEditModal(null)
  }

  const catColors = {
    'Outil': 'bg-blue-100 text-blue-700',
    'Publicité': 'bg-pink-100 text-pink-700',
    'Hébergement': 'bg-purple-100 text-purple-700',
    'IA / SaaS': 'bg-violet-100 text-violet-700',
    'Prestataire': 'bg-orange-100 text-orange-700',
    'Formation': 'bg-green-100 text-green-700',
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Dépenses</h1>
          <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>{depenses.length} dépense{depenses.length > 1 ? 's' : ''} enregistrée{depenses.length > 1 ? 's' : ''}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }} onClick={() => setModal(true)}>
          <Plus size={16} /> Nouvelle dépense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
          <div className="flex items-center gap-2 mb-3"><Wallet size={16} className="text-red-500" /></div>
          <p className="text-2xl font-bold" style={{ color: '#241512' }}>{total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
          <p className="text-xs mt-1" style={{ color: '#a89b8c' }}>Total dépenses (filtrées)</p>
        </div>
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
          <div className="flex items-center gap-2 mb-3"><TrendingDown size={16} className="text-orange-500" /></div>
          <p className="text-2xl font-bold" style={{ color: '#241512' }}>{mensuel.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
          <p className="text-xs mt-1" style={{ color: '#a89b8c' }}>Charges mensuelles fixes</p>
        </div>
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
          <div className="flex items-center gap-2 mb-3"><Calendar size={16} className="text-blue-500" /></div>
          <p className="text-2xl font-bold" style={{ color: '#241512' }}>{aVenir.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
          <p className="text-xs mt-1" style={{ color: '#a89b8c' }}>Dépenses à venir</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <button onClick={() => setFilterCat('tous')}
          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
          style={filterCat === 'tous' ? { background: '#241512', color: '#FDFCF8' } : { background: '#fff', border: '1px solid #e7e5e1', color: '#241512' }}>
          Toutes
        </button>
        {cats.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={filterCat === cat ? { background: '#241512', color: '#FDFCF8' } : { background: '#fff', border: '1px solid #e7e5e1', color: '#241512' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <thead>
            <tr style={{ background: '#f5f4f1' }}>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Dépense</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Catégorie</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Montant</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Date</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Fréquence</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Statut</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Responsable</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide w-16" style={{ color: '#a89b8c' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10" style={{ color: '#a89b8c' }}>Aucune dépense</td></tr>}
            {filtered.map(d => (
              <tr key={d.id} className="border-t border-[#e7e5e1] hover:bg-[#f5f4f1] transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium" style={{ color: '#241512' }}>{d.nom}</p>
                  {d.notes && <p className="text-xs truncate max-w-xs" style={{ color: '#a89b8c' }}>{d.notes}</p>}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColors[d.categorie] || 'bg-[#f5f4f1] text-[#a89b8c]'}`}>
                    {d.categorie || '—'}
                  </span>
                </td>
                <td className="px-5 py-3 font-semibold text-red-700">
                  -{Number(d.montant || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </td>
                <td className="px-5 py-3 text-xs" style={{ color: '#a89b8c' }}>{d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="px-5 py-3">
                  <span className="text-xs capitalize" style={{ color: '#241512' }}>{d.frequence}</span>
                </td>
                <td className="px-5 py-3">{statutBadge(d.statut === 'paye' ? 'paye' : d.statut === 'a_venir' ? 'a_venir' : 'en_attente')}</td>
                <td className="px-5 py-3">{assigneeBadge(d.responsable)}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(d)} className="p-1 hover:text-[#241512]" style={{ color: '#a89b8c' }}><Edit size={14} /></button>
                    <button onClick={() => { if (confirm('Supprimer ?')) deleteDepense(d.id) }} className="p-1 hover:text-red-500" style={{ color: '#a89b8c' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length > 0 && (
          <div className="flex justify-end px-5 py-3 border-t border-[#e7e5e1]" style={{ background: '#f5f4f1' }}>
            <p className="text-sm" style={{ color: '#241512' }}>Total : <strong className="text-red-600">-{total.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</strong></p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouvelle dépense" size="lg">
        <form onSubmit={handleSubmit}>
          <FormRow cols={2}>
            <FormField label="Nom de la dépense" required>
              <input className={inputCls} style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
            </FormField>
            <FormField label="Catégorie">
              <select className={inputCls} style={inputStyle} value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}>
                <option value="">— Choisir —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormRow cols={3}>
            <FormField label="Montant (€)" required>
              <input type="number" step="0.01" className={inputCls} style={inputStyle} value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} required />
            </FormField>
            <FormField label="Date">
              <input type="date" className={inputCls} style={inputStyle} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </FormField>
            <FormField label="Fréquence">
              <select className={inputCls} style={inputStyle} value={form.frequence} onChange={e => setForm({ ...form, frequence: e.target.value })}>
                {FREQUENCES.map(f => <option key={f} value={f} className="capitalize">{f}</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Statut">
              <select className={inputCls} style={inputStyle} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                <option value="paye">Payé</option>
                <option value="a_venir">À venir</option>
                <option value="en_attente">En attente</option>
              </select>
            </FormField>
            <FormField label="Responsable">
              <select className={inputCls} style={inputStyle} value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })}>
                <option value="Sheryn">Sheryn</option>
                <option value="Chainez">Chainez</option>
              </select>
            </FormField>
          </FormRow>
          <FormField label="Notes">
            <textarea className={`${inputCls} resize-none`} style={inputStyle} rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }}>Enregistrer</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editForm && (
        <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Modifier la dépense" size="lg">
          <form onSubmit={handleEditSubmit}>
            <FormRow cols={2}>
              <FormField label="Nom"><input className={inputCls} style={inputStyle} value={editForm.nom} onChange={e => setEditForm({ ...editForm, nom: e.target.value })} /></FormField>
              <FormField label="Montant (€)"><input type="number" step="0.01" className={inputCls} style={inputStyle} value={editForm.montant || ''} onChange={e => setEditForm({ ...editForm, montant: e.target.value })} /></FormField>
            </FormRow>
            <FormRow cols={2}>
              <FormField label="Statut">
                <select className={inputCls} style={inputStyle} value={editForm.statut} onChange={e => setEditForm({ ...editForm, statut: e.target.value })}>
                  <option value="paye">Payé</option>
                  <option value="a_venir">À venir</option>
                  <option value="en_attente">En attente</option>
                </select>
              </FormField>
              <FormField label="Responsable">
                <select className={inputCls} style={inputStyle} value={editForm.responsable} onChange={e => setEditForm({ ...editForm, responsable: e.target.value })}>
                  <option value="Sheryn">Sheryn</option>
                  <option value="Chainez">Chainez</option>
                </select>
              </FormField>
            </FormRow>
            <FormField label="Notes">
              <textarea className={`${inputCls} resize-none`} style={inputStyle} rows={2} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
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
