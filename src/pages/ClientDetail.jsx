import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Globe, Instagram, Edit, Trash2, Plus, ExternalLink } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge, prioriteBadge, assigneeBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const TABS = ['Infos', 'Projet', 'Tâches', 'RDV', 'Documents', 'Historique']

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { clients, updateClient, deleteClient, getTachesByClient, getRDVsByClient, getDocumentsByClient, projets } = useStore()
  const [tab, setTab] = useState('Infos')
  const [editModal, setEditModal] = useState(false)
  const [form, setForm] = useState(null)

  const client = clients.find(c => c.id === id)
  if (!client) return (
    <div className="flex flex-col items-center justify-center h-96">
      <p className="text-gray-500 mb-4">Client introuvable</p>
      <button className="btn-secondary" onClick={() => navigate('/clients')}><ArrowLeft size={16} />Retour</button>
    </div>
  )

  const taches = getTachesByClient(id)
  const rdvs = getRDVsByClient(id)
  const docs = getDocumentsByClient(id)
  const projetClient = projets.find(p => p.clientId === id)

  function openEdit() {
    setForm({ ...client })
    setEditModal(true)
  }

  function handleUpdate(e) {
    e.preventDefault()
    updateClient(id, form)
    setEditModal(false)
  }

  function handleDelete() {
    if (confirm(`Supprimer le client "${client.nom}" ?`)) {
      deleteClient(id)
      navigate('/clients')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={() => navigate('/clients')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-indigo-700">{client.nom[0]}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{client.nom}</h1>
            {client.contact && <p className="text-sm text-gray-500 truncate">{client.contact}</p>}
          </div>
          <div className="flex-shrink-0">{statutBadge(client.statut)}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="btn-secondary" onClick={openEdit}><Edit size={15} /><span className="hidden sm:inline">Modifier</span></button>
          <button className="btn-danger" onClick={handleDelete}><Trash2 size={15} /><span className="hidden sm:inline">Supprimer</span></button>
        </div>
      </div>

      {/* Quick contact */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
        {client.email && (
          <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
            <Mail size={14} />{client.email}
          </a>
        )}
        {client.telephone && (
          <a href={`tel:${client.telephone}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
            <Phone size={14} />{client.telephone}
          </a>
        )}
        {client.siteWeb && (
          <a href={`https://${client.siteWeb}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
            <Globe size={14} />{client.siteWeb}
          </a>
        )}
        {client.instagram && (
          <span className="flex items-center gap-1.5 text-sm text-gray-600">
            <Instagram size={14} />{client.instagram}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-gray-100/70 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab flex-shrink-0 ${tab === t ? 'active' : ''}`}>{t}</button>
        ))}
      </div>

      {/* Infos */}
      {tab === 'Infos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-5">
            <p className="section-title">Informations générales</p>
            <dl className="space-y-3">
              {[
                { label: 'Secteur', value: client.secteur },
                { label: 'Source', value: client.source },
                { label: 'Statut', value: statutBadge(client.statut) },
                { label: 'Client depuis', value: client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR') : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</dt>
                  <dd className="text-sm text-gray-800 text-right">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
          {client.notes && (
            <div className="card p-5">
              <p className="section-title">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{client.notes}</p>
            </div>
          )}
          {client.objectifs && (
            <div className="card p-5">
              <p className="section-title">Objectifs</p>
              <p className="text-sm text-gray-700">{client.objectifs}</p>
            </div>
          )}
        </div>
      )}

      {/* Projet */}
      {tab === 'Projet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-5">
            <p className="section-title">Détails du projet</p>
            <dl className="space-y-3">
              {[
                { label: 'Type de projet', value: client.typeProjet },
                { label: 'Offre choisie', value: client.offre },
                { label: 'Budget', value: client.budget ? `${Number(client.budget).toLocaleString('fr-FR')} €` : null },
                { label: 'Deadline', value: client.deadline ? new Date(client.deadline).toLocaleDateString('fr-FR') : null },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</dt>
                  <dd className="text-sm font-medium text-gray-800">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
          {projetClient && (
            <div className="card p-5">
              <p className="section-title">Projet lié</p>
              <p className="font-semibold text-gray-900 mb-2">{projetClient.nom}</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Progression</span>
                <span className="text-xs font-semibold">{projetClient.progression}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${projetClient.progression}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">Étape : {projetClient.etapeActuelle}</p>
            </div>
          )}
        </div>
      )}

      {/* Tâches */}
      {tab === 'Tâches' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr>
                <th className="table-header">Tâche</th>
                <th className="table-header">Assignée</th>
                <th className="table-header">Priorité</th>
                <th className="table-header">Deadline</th>
                <th className="table-header">Statut</th>
              </tr>
            </thead>
            <tbody>
              {taches.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Aucune tâche</td></tr>}
              {taches.map(t => (
                <tr key={t.id} className="table-row">
                  <td className="table-cell font-medium">{t.titre}</td>
                  <td className="table-cell">{assigneeBadge(t.assignee)}</td>
                  <td className="table-cell">{prioriteBadge(t.priorite)}</td>
                  <td className="table-cell">
                    {t.deadline ? (
                      <span className={t.deadline < today ? 'text-red-600 font-semibold text-xs' : 'text-xs text-gray-600'}>
                        {new Date(t.deadline).toLocaleDateString('fr-FR')}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="table-cell">{statutBadge(t.statut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* RDV */}
      {tab === 'RDV' && (
        <div className="space-y-3">
          {rdvs.length === 0 && <div className="card p-8 text-center text-gray-400 text-sm">Aucun rendez-vous</div>}
          {rdvs.map(r => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{r.sujet || 'Rendez-vous'}</p>
                  <p className="text-sm text-gray-500 mt-1">{r.date && new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {r.heure}</p>
                  {r.objectif && <p className="text-sm text-gray-600 mt-2">{r.objectif}</p>}
                </div>
                {r.lienMeet && (
                  <a href={r.lienMeet} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                    <ExternalLink size={12} /> Rejoindre
                  </a>
                )}
              </div>
              {r.notes && <div className="mt-3 pt-3 border-t border-gray-100"><p className="text-xs text-gray-400 font-semibold mb-1">Notes</p><p className="text-sm text-gray-700">{r.notes}</p></div>}
            </div>
          ))}
        </div>
      )}

      {/* Documents */}
      {tab === 'Documents' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[420px]">
            <thead>
              <tr>
                <th className="table-header">Numéro</th>
                <th className="table-header">Type</th>
                <th className="table-header">Montant HT</th>
                <th className="table-header">Date</th>
                <th className="table-header">Statut</th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Aucun document</td></tr>}
              {docs.map(d => (
                <tr key={d.id} className="table-row">
                  <td className="table-cell font-medium">{d.numero}</td>
                  <td className="table-cell capitalize">{d.type}</td>
                  <td className="table-cell font-semibold">{(d.montantHT || 0).toLocaleString('fr-FR')} €</td>
                  <td className="table-cell text-xs">{d.dateEmission && new Date(d.dateEmission).toLocaleDateString('fr-FR')}</td>
                  <td className="table-cell">{statutBadge(d.statut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Historique */}
      {tab === 'Historique' && (
        <div className="space-y-2">
          {[...taches.map(t => ({ type: 'Tâche', label: t.titre, date: t.createdAt, color: 'bg-indigo-100 text-indigo-700' })),
            ...rdvs.map(r => ({ type: 'RDV', label: r.sujet || 'Rendez-vous', date: r.date, color: 'bg-blue-100 text-blue-700' })),
            ...docs.map(d => ({ type: 'Document', label: d.numero, date: d.dateEmission, color: 'bg-purple-100 text-purple-700' })),
          ].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((item, i) => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${item.color}`}>{item.type}</span>
              <span className="text-sm text-gray-800 flex-1">{item.label}</span>
              <span className="text-xs text-gray-400">{item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '—'}</span>
            </div>
          ))}
          {taches.length + rdvs.length + docs.length === 0 && <div className="card p-8 text-center text-gray-400 text-sm">Aucun historique</div>}
        </div>
      )}

      {/* Edit Modal */}
      {form && (
        <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Modifier le client" size="lg">
          <form onSubmit={handleUpdate}>
            <FormRow cols={2}>
              <FormField label="Nom entreprise" required>
                <input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
              </FormField>
              <FormField label="Contact">
                <input className="input" value={form.contact || ''} onChange={e => setForm({ ...form, contact: e.target.value })} />
              </FormField>
            </FormRow>
            <FormRow cols={2}>
              <FormField label="Email">
                <input type="email" className="input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
              </FormField>
              <FormField label="Téléphone">
                <input className="input" value={form.telephone || ''} onChange={e => setForm({ ...form, telephone: e.target.value })} />
              </FormField>
            </FormRow>
            <FormRow cols={2}>
              <FormField label="Statut">
                <select className="select" value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                  <option value="prospect">Prospect</option>
                  <option value="actif">Actif</option>
                  <option value="ancien">Ancien</option>
                </select>
              </FormField>
              <FormField label="Budget (€)">
                <input type="number" className="input" value={form.budget || ''} onChange={e => setForm({ ...form, budget: e.target.value })} />
              </FormField>
            </FormRow>
            <FormField label="Notes">
              <textarea className="input resize-none" rows={3} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </FormField>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="btn-secondary" onClick={() => setEditModal(false)}>Annuler</button>
              <button type="submit" className="btn-primary">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
