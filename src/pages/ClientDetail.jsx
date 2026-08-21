import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Globe, Instagram, Edit, Trash2, Plus, ExternalLink } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge, prioriteBadge, assigneeBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const TABS = ['Infos', 'Projet', 'Tâches', 'RDV', 'Documents', 'Historique']

const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
const inputStyle = { background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }

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
      <p className="text-[#a89b8c] mb-4">Client introuvable</p>
      <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => navigate('/clients')}><ArrowLeft size={16} />Retour</button>
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
        <button onClick={() => navigate('/clients')} className="p-2 rounded-lg hover:bg-[#f5f4f1] text-[#a89b8c] flex-shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f5f4f1' }}>
            <span className="text-sm font-bold" style={{ color: '#241512' }}>{client.nom[0]}</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-bold truncate" style={{ color: '#241512' }}>{client.nom}</h1>
            {client.contact && <p className="text-sm text-[#a89b8c] truncate">{client.contact}</p>}
          </div>
          <div className="flex-shrink-0">{statutBadge(client.statut)}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={openEdit}><Edit size={15} /><span className="hidden sm:inline">Modifier</span></button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-red-50 text-red-600 hover:bg-red-100" onClick={handleDelete}><Trash2 size={15} /><span className="hidden sm:inline">Supprimer</span></button>
        </div>
      </div>

      {/* Quick contact */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
        {client.email && (
          <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-sm text-[#a89b8c] hover:text-[#241512] transition-colors">
            <Mail size={14} />{client.email}
          </a>
        )}
        {client.telephone && (
          <a href={`tel:${client.telephone}`} className="flex items-center gap-1.5 text-sm text-[#a89b8c] hover:text-[#241512] transition-colors">
            <Phone size={14} />{client.telephone}
          </a>
        )}
        {client.siteWeb && (
          <a href={`https://${client.siteWeb}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-[#a89b8c] hover:text-[#241512] transition-colors">
            <Globe size={14} />{client.siteWeb}
          </a>
        )}
        {client.instagram && (
          <span className="flex items-center gap-1.5 text-sm text-[#a89b8c]">
            <Instagram size={14} />{client.instagram}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 rounded-xl p-1 overflow-x-auto" style={{ background: '#f5f4f1' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === t ? 'bg-[#241512] text-white' : 'text-[#a89b8c] hover:text-[#241512]'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Infos */}
      {tab === 'Infos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
            <p className="text-xs font-bold text-[#a89b8c] uppercase tracking-wider mb-3">Informations générales</p>
            <dl className="space-y-3">
              {[
                { label: 'Secteur', value: client.secteur },
                { label: 'Source', value: client.source },
                { label: 'Statut', value: statutBadge(client.statut) },
                { label: 'Client depuis', value: client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR') : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start">
                  <dt className="text-xs font-semibold text-[#a89b8c] uppercase tracking-wide">{label}</dt>
                  <dd className="text-sm text-[#241512] text-right">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
          {client.notes && (
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
              <p className="text-xs font-bold text-[#a89b8c] uppercase tracking-wider mb-3">Notes</p>
              <p className="text-sm text-[#241512] whitespace-pre-line">{client.notes}</p>
            </div>
          )}
          {client.objectifs && (
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
              <p className="text-xs font-bold text-[#a89b8c] uppercase tracking-wider mb-3">Objectifs</p>
              <p className="text-sm text-[#241512]">{client.objectifs}</p>
            </div>
          )}
        </div>
      )}

      {/* Projet */}
      {tab === 'Projet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
            <p className="text-xs font-bold text-[#a89b8c] uppercase tracking-wider mb-3">Détails du projet</p>
            <dl className="space-y-3">
              {[
                { label: 'Type de projet', value: client.typeProjet },
                { label: 'Offre choisie', value: client.offre },
                { label: 'Budget', value: client.budget ? `${Number(client.budget).toLocaleString('fr-FR')} €` : null },
                { label: 'Deadline', value: client.deadline ? new Date(client.deadline).toLocaleDateString('fr-FR') : null },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start">
                  <dt className="text-xs font-semibold text-[#a89b8c] uppercase tracking-wide">{label}</dt>
                  <dd className="text-sm font-medium text-[#241512]">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
          {projetClient && (
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
              <p className="text-xs font-bold text-[#a89b8c] uppercase tracking-wider mb-3">Projet lié</p>
              <p className="font-semibold text-[#241512] mb-2">{projetClient.nom}</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#a89b8c]">Progression</span>
                <span className="text-xs font-semibold text-[#241512]">{projetClient.progression}%</span>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: '#f5f4f1' }}>
                <div className="h-2 rounded-full" style={{ width: `${projetClient.progression}%`, background: '#241512' }} />
              </div>
              <p className="text-xs text-[#a89b8c] mt-2">Étape : {projetClient.etapeActuelle}</p>
            </div>
          )}
        </div>
      )}

      {/* Tâches */}
      {tab === 'Tâches' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr style={{ background: '#f5f4f1' }}>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Tâche</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Assignée</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Priorité</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Deadline</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeece7]">
              {taches.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[#a89b8c] text-sm">Aucune tâche</td></tr>}
              {taches.map(t => (
                <tr key={t.id} className="hover:bg-[#f5f4f1]/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[#241512]">{t.titre}</td>
                  <td className="px-4 py-3 text-sm">{assigneeBadge(t.assignee)}</td>
                  <td className="px-4 py-3 text-sm">{prioriteBadge(t.priorite)}</td>
                  <td className="px-4 py-3 text-sm">
                    {t.deadline ? (
                      <span className={t.deadline < today ? 'text-red-600 font-semibold text-xs' : 'text-xs text-[#a89b8c]'}>
                        {new Date(t.deadline).toLocaleDateString('fr-FR')}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">{statutBadge(t.statut)}</td>
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
          {rdvs.length === 0 && <div className="bg-white rounded-2xl p-8 text-center text-[#a89b8c] text-sm" style={{ border: '1px solid #e7e5e1' }}>Aucun rendez-vous</div>}
          {rdvs.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[#241512]">{r.sujet || 'Rendez-vous'}</p>
                  <p className="text-sm text-[#a89b8c] mt-1">{r.date && new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {r.heure}</p>
                  {r.objectif && <p className="text-sm text-[#241512] mt-2">{r.objectif}</p>}
                </div>
                {r.lienMeet && (
                  <a href={r.lienMeet} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }}>
                    <ExternalLink size={12} /> Rejoindre
                  </a>
                )}
              </div>
              {r.notes && <div className="mt-3 pt-3 border-t border-[#e7e5e1]"><p className="text-xs text-[#a89b8c] font-semibold mb-1">Notes</p><p className="text-sm text-[#241512]">{r.notes}</p></div>}
            </div>
          ))}
        </div>
      )}

      {/* Documents */}
      {tab === 'Documents' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[420px]">
            <thead>
              <tr style={{ background: '#f5f4f1' }}>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Numéro</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Montant HT</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Date</th>
                <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeece7]">
              {docs.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[#a89b8c] text-sm">Aucun document</td></tr>}
              {docs.map(d => (
                <tr key={d.id} className="hover:bg-[#f5f4f1]/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[#241512]">{d.numero}</td>
                  <td className="px-4 py-3 text-sm capitalize text-[#241512]">{d.type}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#241512]">{(d.montantHT || 0).toLocaleString('fr-FR')} €</td>
                  <td className="px-4 py-3 text-xs text-[#a89b8c]">{d.dateEmission && new Date(d.dateEmission).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-sm">{statutBadge(d.statut)}</td>
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
          {[...taches.map(t => ({ type: 'Tâche', label: t.titre, date: t.createdAt, color: 'bg-[#f5f4f1] text-[#241512]' })),
            ...rdvs.map(r => ({ type: 'RDV', label: r.sujet || 'Rendez-vous', date: r.date, color: 'bg-[#f5f4f1] text-[#241512]' })),
            ...docs.map(d => ({ type: 'Document', label: d.numero, date: d.dateEmission, color: 'bg-[#f5f4f1] text-[#241512]' })),
          ].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ border: '1px solid #e7e5e1' }}>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${item.color}`}>{item.type}</span>
              <span className="text-sm text-[#241512] flex-1">{item.label}</span>
              <span className="text-xs text-[#a89b8c]">{item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '—'}</span>
            </div>
          ))}
          {taches.length + rdvs.length + docs.length === 0 && <div className="bg-white rounded-2xl p-8 text-center text-[#a89b8c] text-sm" style={{ border: '1px solid #e7e5e1' }}>Aucun historique</div>}
        </div>
      )}

      {/* Edit Modal */}
      {form && (
        <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Modifier le client" size="lg">
          <form onSubmit={handleUpdate}>
            <FormRow cols={2}>
              <FormField label="Nom entreprise" required>
                <input className={inputCls} style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
              </FormField>
              <FormField label="Contact">
                <input className={inputCls} style={inputStyle} value={form.contact || ''} onChange={e => setForm({ ...form, contact: e.target.value })} />
              </FormField>
            </FormRow>
            <FormRow cols={2}>
              <FormField label="Email">
                <input type="email" className={inputCls} style={inputStyle} value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
              </FormField>
              <FormField label="Téléphone">
                <input className={inputCls} style={inputStyle} value={form.telephone || ''} onChange={e => setForm({ ...form, telephone: e.target.value })} />
              </FormField>
            </FormRow>
            <FormRow cols={2}>
              <FormField label="Statut">
                <select className={inputCls} style={inputStyle} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                  <option value="prospect">Prospect</option>
                  <option value="actif">Actif</option>
                  <option value="ancien">Ancien</option>
                </select>
              </FormField>
              <FormField label="Budget (€)">
                <input type="number" className={inputCls} style={inputStyle} value={form.budget || ''} onChange={e => setForm({ ...form, budget: e.target.value })} />
              </FormField>
            </FormRow>
            <FormField label="Notes">
              <textarea className={`${inputCls} resize-none`} style={inputStyle} rows={3} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </FormField>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => setEditModal(false)}>Annuler</button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }}>Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
