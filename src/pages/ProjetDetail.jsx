import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Calendar, ExternalLink, Check } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge, prioriteBadge, assigneeBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const ETAPES = ['Appel', 'Devis', 'Signature', 'Paiement', 'Brief', 'Maquettes', 'Validation', 'Développement', 'Mise en ligne', 'Suivi 1 mois', 'Terminé']
const TABS = ['Aperçu', 'Tâches', 'Client']

const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
const inputStyle = { background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }

const statutColor = {
  en_cours: '#241512',
  devis: '#d9a441',
  livre: '#10b981',
  pause: '#a89b8c',
  annule: '#ef4444',
}

export default function ProjetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projets, clients, updateProjet, deleteProjet, getTachesByProjet } = useStore()
  const [tab, setTab] = useState('Aperçu')
  const [editModal, setEditModal] = useState(false)
  const [form, setForm] = useState(null)

  const projet = projets.find(p => p.id === id)
  if (!projet) return (
    <div className="flex flex-col items-center justify-center h-96">
      <p className="text-[#a89b8c] mb-4">Projet introuvable</p>
      <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => navigate('/projets')}><ArrowLeft size={16} />Retour</button>
    </div>
  )

  const client = clients.find(c => c.id === projet.clientId)
  const taches = getTachesByProjet(id)
  const today = new Date().toISOString().split('T')[0]
  const idxEtape = ETAPES.indexOf(projet.etapeActuelle)

  function openEdit() {
    setForm({ ...projet, timeline: { debut: projet.timeline?.debut || '', fin: projet.timeline?.fin || '' } })
    setEditModal(true)
  }

  function handleUpdate(e) {
    e.preventDefault()
    updateProjet(id, form)
    setEditModal(false)
  }

  function handleDelete() {
    if (confirm(`Supprimer le projet "${projet.nom}" ?`)) {
      deleteProjet(id)
      navigate('/projets')
    }
  }

  function jumpToEtape(etape) {
    updateProjet(id, { etapeActuelle: etape })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={() => navigate('/projets')} className="p-2 rounded-lg hover:bg-[#f5f4f1] text-[#a89b8c] flex-shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-bold truncate" style={{ color: '#241512' }}>{projet.nom}</h1>
            {client && (
              <button onClick={() => navigate(`/clients/${client.id}`)} className="text-sm text-[#a89b8c] hover:text-[#241512] hover:underline transition-colors truncate">{client.nom}</button>
            )}
          </div>
          <div className="flex-shrink-0">{statutBadge(projet.statut)}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={openEdit}><Edit size={15} /><span className="hidden sm:inline">Modifier</span></button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-red-50 text-red-600 hover:bg-red-100" onClick={handleDelete}><Trash2 size={15} /><span className="hidden sm:inline">Supprimer</span></button>
        </div>
      </div>

      {/* Progression */}
      <div className="bg-white rounded-2xl p-5 mb-5" style={{ border: '1px solid #e7e5e1' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Progression</span>
          <span className="text-sm font-bold" style={{ color: '#241512' }}>{projet.progression}%</span>
        </div>
        <div className="w-full rounded-full h-2 mb-4" style={{ background: '#f5f4f1' }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${projet.progression}%`, background: statutColor[projet.statut] || '#241512' }} />
        </div>

        {/* Étapes cliquables */}
        <div className="flex flex-wrap gap-1.5">
          {ETAPES.map((etape, i) => {
            const done = i < idxEtape
            const current = i === idxEtape
            return (
              <button key={etape} onClick={() => jumpToEtape(etape)}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors"
                style={current
                  ? { background: '#241512', color: '#FDFCF8' }
                  : done
                    ? { background: '#f5f4f1', color: '#241512' }
                    : { background: '#faf9f6', color: '#a89b8c', border: '1px solid #eeece7' }}>
                {done && <Check size={10} />}
                {etape}
              </button>
            )
          })}
        </div>

        {(projet.timeline?.debut || projet.timeline?.fin) && (
          <div className="flex items-center gap-2 text-xs mt-4 pt-4" style={{ borderTop: '1px solid #eeece7', color: '#a89b8c' }}>
            <Calendar size={12} />
            {projet.timeline.debut && <span>{new Date(projet.timeline.debut).toLocaleDateString('fr-FR')}</span>}
            <span>→</span>
            {projet.timeline.fin && <span>{new Date(projet.timeline.fin).toLocaleDateString('fr-FR')}</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 rounded-xl p-1 overflow-x-auto" style={{ background: '#f5f4f1' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === t ? 'bg-[#241512] text-white' : 'text-[#a89b8c] hover:text-[#241512]'}`}>
            {t}{t === 'Tâches' && taches.length > 0 ? ` (${taches.length})` : ''}
          </button>
        ))}
      </div>

      {/* Aperçu */}
      {tab === 'Aperçu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#a89b8c' }}>Détails</p>
            <dl className="space-y-3">
              {[
                { label: 'Statut', value: statutBadge(projet.statut) },
                { label: 'Étape actuelle', value: projet.etapeActuelle },
                { label: 'Progression', value: `${projet.progression}%` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start">
                  <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#a89b8c' }}>{label}</dt>
                  <dd className="text-sm text-right" style={{ color: '#241512' }}>{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
          {projet.notes && (
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#a89b8c' }}>Notes</p>
              <p className="text-sm whitespace-pre-line" style={{ color: '#241512' }}>{projet.notes}</p>
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
                  <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Tâche</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Assignée</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Priorité</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Deadline</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#eeece7' }}>
                {taches.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-sm" style={{ color: '#a89b8c' }}>Aucune tâche liée à ce projet</td></tr>}
                {taches.map(t => (
                  <tr key={t.id} className="hover:bg-[#faf9f6] transition-colors cursor-pointer" onClick={() => navigate('/taches')}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: '#241512' }}>{t.titre}</td>
                    <td className="px-4 py-3 text-sm">{assigneeBadge(t.assignee)}</td>
                    <td className="px-4 py-3 text-sm">{prioriteBadge(t.priorite)}</td>
                    <td className="px-4 py-3 text-sm">
                      {t.deadline ? (
                        <span className={t.deadline < today ? 'text-red-600 font-semibold text-xs' : 'text-xs'} style={t.deadline < today ? {} : { color: '#a89b8c' }}>
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

      {/* Client */}
      {tab === 'Client' && (
        client ? (
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold" style={{ color: '#241512' }}>{client.nom}</p>
              <button onClick={() => navigate(`/clients/${client.id}`)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }}>
                <ExternalLink size={12} /> Voir la fiche client
              </button>
            </div>
            <dl className="space-y-2.5">
              {[
                { label: 'Contact', value: client.contact },
                { label: 'Email', value: client.email },
                { label: 'Téléphone', value: client.telephone },
                { label: 'Statut', value: statutBadge(client.statut) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start">
                  <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#a89b8c' }}>{label}</dt>
                  <dd className="text-sm text-right" style={{ color: '#241512' }}>{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-sm" style={{ border: '1px solid #e7e5e1', color: '#a89b8c' }}>Aucun client lié à ce projet</div>
        )
      )}

      {/* Edit Modal */}
      {form && (
        <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Modifier le projet" size="lg">
          <form onSubmit={handleUpdate}>
            <FormRow cols={2}>
              <FormField label="Nom du projet" required>
                <input className={inputCls} style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
              </FormField>
              <FormField label="Client">
                <select className={inputCls} style={inputStyle} value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                  <option value="">— Aucun —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </FormField>
            </FormRow>
            <FormRow cols={2}>
              <FormField label="Statut">
                <select className={inputCls} style={inputStyle} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                  <option value="en_cours">En cours</option>
                  <option value="devis">Devis</option>
                  <option value="livre">Livré</option>
                  <option value="pause">En pause</option>
                  <option value="annule">Annulé</option>
                </select>
              </FormField>
              <FormField label="Étape actuelle">
                <select className={inputCls} style={inputStyle} value={form.etapeActuelle} onChange={e => setForm({ ...form, etapeActuelle: e.target.value })}>
                  {ETAPES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </FormField>
            </FormRow>
            <FormRow cols={2}>
              <FormField label="Date de début">
                <input type="date" className={inputCls} style={inputStyle} value={form.timeline.debut} onChange={e => setForm({ ...form, timeline: { ...form.timeline, debut: e.target.value } })} />
              </FormField>
              <FormField label="Date de fin">
                <input type="date" className={inputCls} style={inputStyle} value={form.timeline.fin} onChange={e => setForm({ ...form, timeline: { ...form.timeline, fin: e.target.value } })} />
              </FormField>
            </FormRow>
            <FormField label="Progression (%)">
              <input type="range" min={0} max={100} value={form.progression} onChange={e => setForm({ ...form, progression: Number(e.target.value) })} className="w-full mb-1" />
              <div className="text-xs text-center" style={{ color: '#a89b8c' }}>{form.progression}%</div>
            </FormField>
            <FormField label="Notes">
              <textarea className={`${inputCls} resize-none mt-4`} style={inputStyle} rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
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
