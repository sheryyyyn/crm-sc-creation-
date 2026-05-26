import { useState } from 'react'
import { Plus, Trash2, Edit, Wallet, TrendingDown, Calendar } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge, assigneeBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const CATEGORIES = ['Outil', 'Publicité', 'Hébergement', 'Prestataire', 'Formation', 'Matériel', 'IA / SaaS', 'Transport', 'Autre']
const FREQUENCES = ['ponctuel', 'mensuel', 'annuel', 'trimestriel']

const emptyDep = { nom: '', categorie: '', montant: '', date: new Date().toISOString().split('T')[0], frequence: 'mensuel', statut: 'paye', responsable: 'Sheryn', notes: '' }

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
    'IA / SaaS': 'bg-indigo-100 text-indigo-700',
    'Prestataire': 'bg-orange-100 text-orange-700',
    'Formation': 'bg-green-100 text-green-700',
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dépenses</h1>
          <p className="text-sm text-gray-500 mt-1">{depenses.length} dépense{depenses.length > 1 ? 's' : ''} enregistrée{depenses.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> Nouvelle dépense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3"><Wallet size={16} className="text-red-500" /></div>
          <p className="text-2xl font-bold text-gray-900">{total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
          <p className="text-xs text-gray-500 mt-1">Total dépenses (filtrées)</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3"><TrendingDown size={16} className="text-orange-500" /></div>
          <p className="text-2xl font-bold text-gray-900">{mensuel.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
          <p className="text-xs text-gray-500 mt-1">Charges mensuelles fixes</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3"><Calendar size={16} className="text-blue-500" /></div>
          <p className="text-2xl font-bold text-gray-900">{aVenir.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
          <p className="text-xs text-gray-500 mt-1">Dépenses à venir</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <button onClick={() => setFilterCat('tous')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterCat === 'tous' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          Toutes
        </button>
        {cats.map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterCat === cat ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Dépense</th>
              <th className="table-header">Catégorie</th>
              <th className="table-header">Montant</th>
              <th className="table-header">Date</th>
              <th className="table-header">Fréquence</th>
              <th className="table-header">Statut</th>
              <th className="table-header">Responsable</th>
              <th className="table-header w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-400">Aucune dépense</td></tr>}
            {filtered.map(d => (
              <tr key={d.id} className="table-row">
                <td className="table-cell">
                  <p className="font-medium text-gray-900">{d.nom}</p>
                  {d.notes && <p className="text-xs text-gray-400 truncate max-w-xs">{d.notes}</p>}
                </td>
                <td className="table-cell">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColors[d.categorie] || 'bg-gray-100 text-gray-600'}`}>
                    {d.categorie || '—'}
                  </span>
                </td>
                <td className="table-cell font-semibold text-red-700">
                  -{Number(d.montant || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </td>
                <td className="table-cell text-xs text-gray-500">{d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="table-cell">
                  <span className="text-xs capitalize text-gray-600">{d.frequence}</span>
                </td>
                <td className="table-cell">{statutBadge(d.statut === 'paye' ? 'paye' : d.statut === 'a_venir' ? 'a_venir' : 'en_attente')}</td>
                <td className="table-cell">{assigneeBadge(d.responsable)}</td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(d)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit size={14} /></button>
                    <button onClick={() => { if (confirm('Supprimer ?')) deleteDepense(d.id) }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="flex justify-end px-5 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-600">Total : <strong className="text-red-600">-{total.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</strong></p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouvelle dépense" size="lg">
        <form onSubmit={handleSubmit}>
          <FormRow cols={2}>
            <FormField label="Nom de la dépense" required>
              <input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
            </FormField>
            <FormField label="Catégorie">
              <select className="select" value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}>
                <option value="">— Choisir —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormRow cols={3}>
            <FormField label="Montant (€)" required>
              <input type="number" step="0.01" className="input" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} required />
            </FormField>
            <FormField label="Date">
              <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </FormField>
            <FormField label="Fréquence">
              <select className="select" value={form.frequence} onChange={e => setForm({ ...form, frequence: e.target.value })}>
                {FREQUENCES.map(f => <option key={f} value={f} className="capitalize">{f}</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Statut">
              <select className="select" value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                <option value="paye">Payé</option>
                <option value="a_venir">À venir</option>
                <option value="en_attente">En attente</option>
              </select>
            </FormField>
            <FormField label="Responsable">
              <select className="select" value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })}>
                <option value="Sheryn">Sheryn</option>
                <option value="Chainez">Chainez</option>
              </select>
            </FormField>
          </FormRow>
          <FormField label="Notes">
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editForm && (
        <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Modifier la dépense" size="lg">
          <form onSubmit={handleEditSubmit}>
            <FormRow cols={2}>
              <FormField label="Nom"><input className="input" value={editForm.nom} onChange={e => setEditForm({ ...editForm, nom: e.target.value })} /></FormField>
              <FormField label="Montant (€)"><input type="number" step="0.01" className="input" value={editForm.montant || ''} onChange={e => setEditForm({ ...editForm, montant: e.target.value })} /></FormField>
            </FormRow>
            <FormRow cols={2}>
              <FormField label="Statut">
                <select className="select" value={editForm.statut} onChange={e => setEditForm({ ...editForm, statut: e.target.value })}>
                  <option value="paye">Payé</option>
                  <option value="a_venir">À venir</option>
                  <option value="en_attente">En attente</option>
                </select>
              </FormField>
              <FormField label="Responsable">
                <select className="select" value={editForm.responsable} onChange={e => setEditForm({ ...editForm, responsable: e.target.value })}>
                  <option value="Sheryn">Sheryn</option>
                  <option value="Chainez">Chainez</option>
                </select>
              </FormField>
            </FormRow>
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
