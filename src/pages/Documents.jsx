import { useState, useRef } from 'react'
import { Plus, Download, FileText, Receipt, Edit, Trash2, Printer } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const emptyDoc = { type: 'devis', clientId: '', numero: '', statut: 'en_attente', montantHT: 0, tva: 20, dateEmission: new Date().toISOString().split('T')[0], dateEcheance: '', lignes: [], notes: '' }

function DocumentPreview({ doc, client }) {
  const montantTVA = (doc.montantHT || 0) * (doc.tva || 20) / 100
  const montantTTC = (doc.montantHT || 0) + montantTVA
  return (
    <div className="bg-white p-8 border border-gray-200 rounded-xl text-sm" id="doc-preview">
      {/* Header */}
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-indigo-700">SC Création</h1>
          <p className="text-xs text-gray-500 mt-1">Agence Web Design</p>
          <p className="text-xs text-gray-500">contact@sc-creation.fr</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900 uppercase">{doc.type}</p>
          <p className="text-sm text-gray-600 mt-1">N° {doc.numero}</p>
          <p className="text-xs text-gray-400">Émis le {doc.dateEmission ? new Date(doc.dateEmission).toLocaleDateString('fr-FR') : '—'}</p>
          {doc.dateEcheance && <p className="text-xs text-gray-400">Échéance : {new Date(doc.dateEcheance).toLocaleDateString('fr-FR')}</p>}
        </div>
      </div>
      {/* Client */}
      {client && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 mb-1">DESTINATAIRE</p>
          <p className="font-semibold text-gray-900">{client.nom}</p>
          {client.contact && <p className="text-sm text-gray-600">{client.contact}</p>}
          {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
        </div>
      )}
      {/* Lines */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-xs font-semibold text-gray-500 text-left pb-2">Description</th>
            <th className="text-xs font-semibold text-gray-500 text-right pb-2 w-16">Qté</th>
            <th className="text-xs font-semibold text-gray-500 text-right pb-2 w-24">P.U HT</th>
            <th className="text-xs font-semibold text-gray-500 text-right pb-2 w-24">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {(doc.lignes || []).map((l, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2 text-gray-800">{l.description}</td>
              <td className="py-2 text-right text-gray-600">{l.quantite}</td>
              <td className="py-2 text-right text-gray-600">{(l.prixUnitaire || 0).toLocaleString('fr-FR')} €</td>
              <td className="py-2 text-right font-medium text-gray-900">{((l.quantite || 0) * (l.prixUnitaire || 0)).toLocaleString('fr-FR')} €</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-56 space-y-1">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Total HT</span><span className="font-medium">{(doc.montantHT || 0).toLocaleString('fr-FR')} €</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">TVA ({doc.tva}%)</span><span className="font-medium">{montantTVA.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</span></div>
          <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-1 mt-1"><span>Total TTC</span><span className="text-indigo-700">{montantTTC.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</span></div>
        </div>
      </div>
      {doc.notes && <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-600"><span className="font-semibold">Notes : </span>{doc.notes}</div>}
      <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">SC Création — Merci pour votre confiance</div>
    </div>
  )
}

export default function Documents() {
  const { documents, clients, addDocument, updateDocument, deleteDocument } = useStore()
  const [modal, setModal] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [form, setForm] = useState(emptyDoc)
  const [filterType, setFilterType] = useState('tous')
  const [filterStatut, setFilterStatut] = useState('tous')

  const getClient = (id) => clients.find(c => c.id === id)

  const filtered = documents.filter(d => {
    const t = filterType === 'tous' || d.type === filterType
    const s = filterStatut === 'tous' || d.statut === filterStatut
    return t && s
  })

  function addLigne() {
    setForm({ ...form, lignes: [...form.lignes, { description: '', quantite: 1, prixUnitaire: 0 }] })
  }

  function updateLigne(i, field, value) {
    const lignes = [...form.lignes]
    lignes[i] = { ...lignes[i], [field]: field === 'description' ? value : Number(value) }
    const montantHT = lignes.reduce((s, l) => s + (l.quantite || 0) * (l.prixUnitaire || 0), 0)
    setForm({ ...form, lignes, montantHT })
  }

  function removeLigne(i) {
    const lignes = form.lignes.filter((_, j) => j !== i)
    const montantHT = lignes.reduce((s, l) => s + (l.quantite || 0) * (l.prixUnitaire || 0), 0)
    setForm({ ...form, lignes, montantHT })
  }

  function handleSubmit(e) {
    e.preventDefault()
    addDocument(form)
    setModal(false)
    setForm(emptyDoc)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">{documents.length} document{documents.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> Nouveau document
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {['tous', 'devis', 'facture', 'contrat'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${filterType === t ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {t === 'tous' ? 'Tous' : t}
            </button>
          ))}
        </div>
        <select className="select w-auto text-xs" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="tous">Tous statuts</option>
          <option value="en_attente">En attente</option>
          <option value="envoye">Envoyé</option>
          <option value="signe">Signé</option>
          <option value="paye">Payé</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden mb-6">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <thead>
            <tr>
              <th className="table-header">Numéro</th>
              <th className="table-header">Type</th>
              <th className="table-header">Client</th>
              <th className="table-header">Montant HT</th>
              <th className="table-header">TTC</th>
              <th className="table-header">Date</th>
              <th className="table-header">Statut</th>
              <th className="table-header w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-400">Aucun document</td></tr>}
            {filtered.map(d => {
              const client = getClient(d.clientId)
              const ttc = (d.montantHT || 0) * (1 + (d.tva || 20) / 100)
              return (
                <tr key={d.id} className="table-row">
                  <td className="table-cell font-semibold text-indigo-700">{d.numero}</td>
                  <td className="table-cell">
                    <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{d.type}</span>
                  </td>
                  <td className="table-cell">{client?.nom || '—'}</td>
                  <td className="table-cell font-medium">{(d.montantHT || 0).toLocaleString('fr-FR')} €</td>
                  <td className="table-cell font-semibold text-gray-900">{ttc.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</td>
                  <td className="table-cell text-xs text-gray-500">{d.dateEmission ? new Date(d.dateEmission).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {statutBadge(d.statut)}
                      <select
                        className="text-xs border border-gray-200 rounded px-1 py-0.5"
                        value={d.statut}
                        onChange={e => updateDocument(d.id, { statut: e.target.value })}
                        onClick={e => e.stopPropagation()}
                      >
                        <option value="en_attente">En attente</option>
                        <option value="envoye">Envoyé</option>
                        <option value="signe">Signé</option>
                        <option value="paye">Payé</option>
                      </select>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => setPreviewDoc(d)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded" title="Aperçu"><FileText size={14} /></button>
                      <button onClick={() => { if (confirm('Supprimer ?')) deleteDocument(d.id) }} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouveau document" size="xl">
        <form onSubmit={handleSubmit}>
          <FormRow cols={3}>
            <FormField label="Type">
              <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="devis">Devis</option>
                <option value="facture">Facture</option>
                <option value="contrat">Contrat</option>
              </select>
            </FormField>
            <FormField label="Client" required>
              <select className="select" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required>
                <option value="">— Choisir —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </FormField>
            <FormField label="Numéro">
              <input className="input" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="DEV-2024-001" />
            </FormField>
          </FormRow>
          <FormRow cols={3}>
            <FormField label="Date d'émission">
              <input type="date" className="input" value={form.dateEmission} onChange={e => setForm({ ...form, dateEmission: e.target.value })} />
            </FormField>
            <FormField label="Date d'échéance">
              <input type="date" className="input" value={form.dateEcheance} onChange={e => setForm({ ...form, dateEcheance: e.target.value })} />
            </FormField>
            <FormField label="TVA (%)">
              <input type="number" className="input" value={form.tva} onChange={e => setForm({ ...form, tva: Number(e.target.value) })} />
            </FormField>
          </FormRow>

          {/* Lignes */}
          <div className="mb-4">
            <label className="label">Lignes</label>
            <div className="space-y-2 mb-3">
              {form.lignes.map((l, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input className="input flex-1" placeholder="Description" value={l.description} onChange={e => updateLigne(i, 'description', e.target.value)} />
                  <input type="number" className="input w-16" placeholder="Qté" value={l.quantite} onChange={e => updateLigne(i, 'quantite', e.target.value)} />
                  <input type="number" className="input w-24" placeholder="P.U €" value={l.prixUnitaire} onChange={e => updateLigne(i, 'prixUnitaire', e.target.value)} />
                  <span className="text-sm font-semibold w-20 text-right text-gray-700">{((l.quantite || 0) * (l.prixUnitaire || 0)).toLocaleString('fr-FR')} €</span>
                  <button type="button" onClick={() => removeLigne(i)} className="text-gray-400 hover:text-red-500"><span>✕</span></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLigne} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              <Plus size={12} /> Ajouter une ligne
            </button>
            <div className="flex justify-end mt-3">
              <p className="text-sm font-bold text-gray-900">Total HT : {(form.montantHT || 0).toLocaleString('fr-FR')} €</p>
            </div>
          </div>

          <FormField label="Notes">
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="btn-primary">Créer</button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      {previewDoc && (
        <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={`Aperçu — ${previewDoc.numero}`} size="xl">
          <div className="mb-4 flex justify-end">
            <button onClick={handlePrint} className="btn-secondary"><Printer size={15} /> Imprimer / PDF</button>
          </div>
          <DocumentPreview doc={previewDoc} client={getClient(previewDoc.clientId)} />
        </Modal>
      )}
    </div>
  )
}
