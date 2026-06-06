import { useState } from 'react'
import { Plus, FileText, Receipt, BookOpen, Trash2, Printer, ClipboardList } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

// ─── Auto-numérotation ────────────────────────────────────────────────────────
function generateNumero(type, documents) {
  const year = new Date().getFullYear()
  const prefix = type === 'devis' ? 'DEV' : type === 'contrat' ? 'CTR' : 'FAC'
  const count = documents.filter(d => d.type === type && String(d.numero).includes(String(year))).length + 1
  return `${prefix}-${year}-${String(count).padStart(3, '0')}`
}

// ─── Templates pré-remplis ────────────────────────────────────────────────────
const TEMPLATES = {
  devis: {
    lignes: [
      { description: 'Audit & cadrage stratégique', quantite: 1, prixUnitaire: 0 },
      { description: 'Design UI/UX — maquettes', quantite: 1, prixUnitaire: 0 },
      { description: 'Intégration & développement', quantite: 1, prixUnitaire: 0 },
      { description: 'Formation & livraison', quantite: 1, prixUnitaire: 0 },
    ],
  },
  facture: {
    lignes: [
      { description: 'Prestation web design', quantite: 1, prixUnitaire: 0 },
    ],
  },
  contrat: {
    lignes: [],
    objet: '',
    delai: '',
    acompte: 30,
  },
}

function makeEmptyDoc(type, documents) {
  return {
    type,
    clientId: '',
    numero: generateNumero(type, documents),
    statut: 'en_attente',
    montantHT: 0,
    tva: 20,
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    notes: '',
    objet: '',
    delai: '',
    acompte: 30,
    lignes: TEMPLATES[type].lignes.map(l => ({ ...l })),
  }
}

// ─── Aperçu Devis / Facture ───────────────────────────────────────────────────
function DocumentPreview({ doc, client }) {
  const montantTVA = (doc.montantHT || 0) * (doc.tva || 20) / 100
  const montantTTC = (doc.montantHT || 0) + montantTVA
  return (
    <div className="bg-white p-8 border border-gray-200 rounded-xl text-sm" id="doc-preview">
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
      {client && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 mb-1">DESTINATAIRE</p>
          <p className="font-semibold text-gray-900">{client.nom}</p>
          {client.contact && <p className="text-sm text-gray-600">{client.contact}</p>}
          {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
        </div>
      )}
      {doc.objet && (
        <div className="mb-6 p-3 bg-indigo-50 rounded-lg">
          <p className="text-xs font-semibold text-indigo-600 mb-1">OBJET</p>
          <p className="text-sm text-gray-800">{doc.objet}</p>
        </div>
      )}
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

// ─── Aperçu Contrat ───────────────────────────────────────────────────────────
function ContratPreview({ doc, client }) {
  const acompteHT = ((doc.montantHT || 0) * (doc.acompte || 30) / 100)
  const soldeHT = (doc.montantHT || 0) - acompteHT
  const today = doc.dateEmission ? new Date(doc.dateEmission).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  return (
    <div className="bg-white p-10 border border-gray-200 rounded-xl text-sm leading-relaxed" id="doc-preview">
      {/* En-tête */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-2xl font-bold text-indigo-700">SC Création</h1>
          <p className="text-xs text-gray-500">Agence Web Design</p>
          <p className="text-xs text-gray-500">contact@sc-creation.fr</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900 uppercase tracking-wide">Contrat de prestation</p>
          <p className="text-sm text-gray-600 mt-1">N° {doc.numero}</p>
          <p className="text-xs text-gray-400">Fait à Paris, le {today}</p>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="p-4 bg-indigo-50 rounded-lg">
          <p className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wide">Le Prestataire</p>
          <p className="font-semibold text-gray-900">SC Création</p>
          <p className="text-xs text-gray-600">Agence Web Design</p>
          <p className="text-xs text-gray-500">contact@sc-creation.fr</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Le Client</p>
          <p className="font-semibold text-gray-900">{client?.nom || '—'}</p>
          {client?.contact && <p className="text-xs text-gray-600">{client.contact}</p>}
          {client?.email && <p className="text-xs text-gray-500">{client.email}</p>}
        </div>
      </div>

      <div className="space-y-5 text-gray-700">
        {/* Art. 1 */}
        <div>
          <p className="font-bold text-gray-900 mb-1">Article 1 — Objet du contrat</p>
          <p className="text-xs leading-relaxed">
            Le présent contrat a pour objet de définir les conditions dans lesquelles SC Création
            réalisera la mission suivante pour le Client :{' '}
            <span className="font-medium text-gray-900">{doc.objet || '(à préciser)'}</span>.
          </p>
        </div>

        {/* Art. 2 */}
        <div>
          <p className="font-bold text-gray-900 mb-1">Article 2 — Durée et délai de réalisation</p>
          <p className="text-xs leading-relaxed">
            La mission débutera à compter de la réception de l'acompte et du brief complet du Client.
            Le délai estimé de réalisation est de{' '}
            <span className="font-medium text-gray-900">{doc.delai || '(à préciser)'}</span>.
            Ce délai est conditionné à la fourniture des éléments nécessaires par le Client dans les délais convenus.
          </p>
        </div>

        {/* Art. 3 */}
        <div>
          <p className="font-bold text-gray-900 mb-1">Article 3 — Conditions financières</p>
          <p className="text-xs leading-relaxed mb-2">
            Le montant total de la prestation est fixé à{' '}
            <span className="font-semibold text-indigo-700">{(doc.montantHT || 0).toLocaleString('fr-FR')} € HT</span> (TVA {doc.tva}% en sus).
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Acompte à la signature ({doc.acompte}%)</span>
              <span className="font-semibold">{acompteHT.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} € HT</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1">
              <span>Solde à la livraison ({100 - (doc.acompte || 30)}%)</span>
              <span className="font-semibold">{soldeHT.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} € HT</span>
            </div>
          </div>
        </div>

        {/* Art. 4 */}
        <div>
          <p className="font-bold text-gray-900 mb-1">Article 4 — Propriété intellectuelle</p>
          <p className="text-xs leading-relaxed">
            L'ensemble des créations réalisées dans le cadre de cette mission (design, code, visuels)
            reste la propriété de SC Création jusqu'au règlement intégral de la facture. À réception
            du solde, les droits d'exploitation sont cédés au Client pour une utilisation commerciale
            illimitée dans le cadre de son activité.
          </p>
        </div>

        {/* Art. 5 */}
        <div>
          <p className="font-bold text-gray-900 mb-1">Article 5 — Résiliation</p>
          <p className="text-xs leading-relaxed">
            En cas de résiliation à l'initiative du Client après le début des travaux, l'acompte versé
            reste acquis à SC Création. Si la résiliation intervient après livraison des maquettes,
            le Client devra régler 70% du montant total.
          </p>
        </div>

        {doc.notes && (
          <div>
            <p className="font-bold text-gray-900 mb-1">Conditions particulières</p>
            <p className="text-xs leading-relaxed">{doc.notes}</p>
          </div>
        )}
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-10 mt-12 pt-6 border-t border-gray-200">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Pour SC Création</p>
          <p className="text-xs text-gray-400 mb-8">Lu et approuvé — Signature :</p>
          <div className="border-b border-gray-300 h-10" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">Pour le Client — {client?.nom || '—'}</p>
          <p className="text-xs text-gray-400 mb-8">Lu et approuvé — Signature :</p>
          <div className="border-b border-gray-300 h-10" />
        </div>
      </div>
      <div className="mt-6 text-xs text-gray-400 text-center">SC Création — Merci pour votre confiance</div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Documents() {
  const { documents, clients, addDocument, updateDocument, deleteDocument } = useStore()
  const [modal, setModal] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [form, setForm] = useState(null)
  const [filterType, setFilterType] = useState('tous')
  const [filterStatut, setFilterStatut] = useState('tous')

  const getClient = (id) => clients.find(c => c.id === id)

  const filtered = documents.filter(d => {
    const t = filterType === 'tous' || d.type === filterType
    const s = filterStatut === 'tous' || d.statut === filterStatut
    return t && s
  })

  function openTemplate(type) {
    setForm(makeEmptyDoc(type, documents))
    setModal(true)
  }

  function addLigne() {
    const lignes = [...form.lignes, { description: '', quantite: 1, prixUnitaire: 0 }]
    setForm({ ...form, lignes })
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
    const saved = { ...form }
    addDocument(saved)
    setModal(false)
    setPreviewDoc(saved)
  }

  const typeLabel = { devis: 'Devis', contrat: 'Contrat', facture: 'Facture' }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">{documents.length} document{documents.length > 1 ? 's' : ''}</p>
        </div>
        {/* 3 boutons de génération */}
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={() => openTemplate('devis')}>
            <FileText size={15} className="text-indigo-600" /> Générer un devis
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={() => openTemplate('contrat')}>
            <BookOpen size={15} className="text-emerald-600" /> Générer un contrat
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={() => openTemplate('facture')}>
            <Receipt size={15} className="text-amber-600" /> Générer une facture
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {['tous', 'devis', 'contrat', 'facture'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${filterType === t ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {t === 'tous' ? 'Tous' : typeLabel[t]}
              {' '}({documents.filter(d => t === 'tous' || d.type === t).length})
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

      {/* Tableau */}
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
                      <span className={`capitalize text-xs font-semibold px-2 py-0.5 rounded-full ${
                        d.type === 'devis' ? 'bg-indigo-50 text-indigo-700' :
                        d.type === 'contrat' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>{typeLabel[d.type] || d.type}</span>
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

      {/* Modal de génération */}
      {form && (
        <Modal isOpen={modal} onClose={() => setModal(false)} title={`Générer un ${typeLabel[form.type]?.toLowerCase()}`} size="xl">
          <form onSubmit={handleSubmit}>
            <FormRow cols={2}>
              <FormField label="Client" required>
                <select className="select" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required>
                  <option value="">— Choisir un client —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </FormField>
              <FormField label="Numéro">
                <input className="input" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} />
              </FormField>
            </FormRow>

            <FormRow cols={form.type === 'contrat' ? 2 : 3}>
              <FormField label="Date d'émission">
                <input type="date" className="input" value={form.dateEmission} onChange={e => setForm({ ...form, dateEmission: e.target.value })} />
              </FormField>
              {form.type !== 'contrat' && (
                <FormField label="Date d'échéance">
                  <input type="date" className="input" value={form.dateEcheance} onChange={e => setForm({ ...form, dateEcheance: e.target.value })} />
                </FormField>
              )}
              <FormField label="TVA (%)">
                <input type="number" className="input" value={form.tva} onChange={e => setForm({ ...form, tva: Number(e.target.value) })} />
              </FormField>
            </FormRow>

            {/* Champs spécifiques contrat */}
            {form.type === 'contrat' && (
              <>
                <FormField label="Objet de la mission">
                  <textarea className="input resize-none" rows={2} placeholder="Ex : Création d'un site vitrine 5 pages avec intégration CMS" value={form.objet} onChange={e => setForm({ ...form, objet: e.target.value })} />
                </FormField>
                <FormRow cols={3}>
                  <FormField label="Délai de réalisation">
                    <input className="input" placeholder="Ex : 4 à 6 semaines" value={form.delai} onChange={e => setForm({ ...form, delai: e.target.value })} />
                  </FormField>
                  <FormField label="Montant HT (€)">
                    <input type="number" className="input" value={form.montantHT} onChange={e => setForm({ ...form, montantHT: Number(e.target.value) })} />
                  </FormField>
                  <FormField label="Acompte (%)">
                    <input type="number" className="input" min={0} max={100} value={form.acompte} onChange={e => setForm({ ...form, acompte: Number(e.target.value) })} />
                  </FormField>
                </FormRow>
              </>
            )}

            {/* Lignes — devis & facture */}
            {form.type !== 'contrat' && (
              <div className="mb-4">
                <label className="label">Prestations</label>
                <div className="space-y-2 mb-3">
                  {form.lignes.map((l, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className="input flex-1" placeholder="Description" value={l.description} onChange={e => updateLigne(i, 'description', e.target.value)} />
                      <input type="number" className="input w-16" placeholder="Qté" value={l.quantite} onChange={e => updateLigne(i, 'quantite', e.target.value)} />
                      <input type="number" className="input w-24" placeholder="P.U €" value={l.prixUnitaire} onChange={e => updateLigne(i, 'prixUnitaire', e.target.value)} />
                      <span className="text-sm font-semibold w-20 text-right text-gray-700">{((l.quantite || 0) * (l.prixUnitaire || 0)).toLocaleString('fr-FR')} €</span>
                      <button type="button" onClick={() => removeLigne(i)} className="text-gray-400 hover:text-red-500">✕</button>
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
            )}

            <FormField label={form.type === 'contrat' ? 'Conditions particulières' : 'Notes'}>
              <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </FormField>

            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
              <button type="submit" className="btn-primary">Générer →</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Aperçu après génération ou clic sur la liste */}
      {previewDoc && (
        <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={`Aperçu — ${previewDoc.numero}`} size="xl">
          <div className="mb-4 flex justify-end">
            <button onClick={() => window.print()} className="btn-secondary"><Printer size={15} /> Télécharger / Imprimer</button>
          </div>
          {previewDoc.type === 'contrat'
            ? <ContratPreview doc={previewDoc} client={getClient(previewDoc.clientId)} />
            : <DocumentPreview doc={previewDoc} client={getClient(previewDoc.clientId)} />
          }
        </Modal>
      )}
    </div>
  )
}
