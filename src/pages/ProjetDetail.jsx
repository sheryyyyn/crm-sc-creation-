import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Calendar, ExternalLink, Check, Plus, Copy, Eye, EyeOff, KeyRound } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge, prioriteBadge, assigneeBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'
import { RecapFormulaire } from './RDV'
import { getJoursRestants } from '../utils/joursRestants'

const ETAPES = ['Appel', 'Devis', 'Signature', 'Paiement', 'Brief', 'Maquettes', 'Validation', 'Développement', 'Mise en ligne', 'Suivi 1 mois', 'Terminé']
const TABS = ['Aperçu', 'Tâches', 'Documents', 'Accès', 'Formulaire', 'Client']

const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
const inputStyle = { background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }

const statutColor = {
  en_cours: '#241512',
  devis: '#d9a441',
  livre: '#10b981',
  pause: '#a89b8c',
  annule: '#ef4444',
}

const genId = () => `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
const emptyAcces = { service: '', identifiant: '', motDePasse: '', url: '', notes: '' }

// ─── Carte "code d'accès" (Shopify, hébergeur, etc.) ────────────────────────
function AccesCard({ acces, onEdit, onDelete }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState('')

  function copy(text, field) {
    navigator.clipboard.writeText(text).then(() => { setCopied(field); setTimeout(() => setCopied(''), 1500) })
  }

  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e7e5e1' }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#241512' }}>
            <KeyRound size={15} color="#FDFCF8" />
          </div>
          <p className="font-semibold text-sm truncate" style={{ color: '#241512' }}>{acces.service}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {acces.url && (
            <a href={/^https?:\/\//.test(acces.url) ? acces.url : `https://${acces.url}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-[#f5f4f1]" style={{ color: '#a89b8c' }}><ExternalLink size={13} /></a>
          )}
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-[#f5f4f1]" style={{ color: '#a89b8c' }}><Edit size={13} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500" style={{ color: '#a89b8c' }}><Trash2 size={13} /></button>
        </div>
      </div>

      {acces.identifiant && (
        <div className="flex items-center justify-between rounded-xl px-3 py-2 mb-2" style={{ background: '#f5f4f1' }}>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#a89b8c' }}>Identifiant</p>
            <p className="text-xs font-medium mt-0.5 truncate" style={{ color: '#241512' }}>{acces.identifiant}</p>
          </div>
          <button onClick={() => copy(acces.identifiant, 'id')} className="p-1.5 rounded-lg flex-shrink-0" style={copied === 'id' ? { color: '#10b981' } : { color: '#a89b8c' }}>
            {copied === 'id' ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      )}

      {acces.motDePasse && (
        <div className="flex items-center justify-between rounded-xl px-3 py-2 mb-2" style={{ background: '#f5f4f1' }}>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#a89b8c' }}>Mot de passe</p>
            <p className="text-xs font-mono font-medium mt-0.5 truncate" style={{ color: '#241512' }}>
              {show ? acces.motDePasse : '•'.repeat(Math.min(acces.motDePasse.length, 16))}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0 ml-2">
            <button onClick={() => setShow(s => !s)} className="p-1.5 rounded-lg" style={{ color: '#a89b8c' }}>{show ? <EyeOff size={13} /> : <Eye size={13} />}</button>
            <button onClick={() => copy(acces.motDePasse, 'pwd')} className="p-1.5 rounded-lg" style={copied === 'pwd' ? { color: '#10b981' } : { color: '#a89b8c' }}>
              {copied === 'pwd' ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      )}

      {acces.notes && <p className="text-xs mt-1 pt-2" style={{ color: '#a89b8c', borderTop: '1px solid #eeece7' }}>{acces.notes}</p>}
    </div>
  )
}

export default function ProjetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projets, clients, documents, formReponses, updateProjet, deleteProjet, getTachesByProjet } = useStore()
  const [tab, setTab] = useState('Aperçu')
  const [editModal, setEditModal] = useState(false)
  const [form, setForm] = useState(null)
  const [accesModal, setAccesModal] = useState(false)
  const [accesForm, setAccesForm] = useState(null)

  const projet = projets.find(p => p.id === id)
  if (!projet) return (
    <div className="flex flex-col items-center justify-center h-96">
      <p className="text-[#a89b8c] mb-4">Projet introuvable</p>
      <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => navigate('/projets')}><ArrowLeft size={16} />Retour</button>
    </div>
  )

  const client = clients.find(c => c.id === projet.clientId)
  const taches = getTachesByProjet(id)
  const docs = documents.filter(d => d.clientId === projet.clientId)
  const formReponse = client?.formReponseId ? formReponses.find(r => r.id === client.formReponseId) : null
  const acces = projet.acces || []
  const today = new Date().toISOString().split('T')[0]
  const idxEtape = ETAPES.indexOf(projet.etapeActuelle)

  function openAccesAdd() {
    setAccesForm({ ...emptyAcces, id: genId() })
    setAccesModal(true)
  }
  function openAccesEdit(a) {
    setAccesForm({ ...a })
    setAccesModal(true)
  }
  function handleAccesSubmit(e) {
    e.preventDefault()
    const exists = acces.some(a => a.id === accesForm.id)
    const next = exists ? acces.map(a => a.id === accesForm.id ? accesForm : a) : [...acces, accesForm]
    updateProjet(id, { acces: next })
    setAccesModal(false)
  }
  function handleAccesDelete(accesId) {
    if (confirm('Supprimer ce code d\'accès ?')) {
      updateProjet(id, { acces: acces.filter(a => a.id !== accesId) })
    }
  }

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
          <div className="flex items-center gap-2 flex-shrink-0">
            {statutBadge(projet.statut)}
            {(() => {
              const jr = getJoursRestants(projet.timeline?.fin)
              return jr ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: jr.bg, color: jr.color }}>
                  {jr.label}
                </span>
              ) : null
            })()}
          </div>
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

      {/* Documents */}
      {tab === 'Documents' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead>
                <tr style={{ background: '#f5f4f1' }}>
                  <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Numéro</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Type</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Montant HT</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Date</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#eeece7' }}>
                {docs.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-sm" style={{ color: '#a89b8c' }}>Aucun document lié à ce client</td></tr>}
                {docs.map(d => (
                  <tr key={d.id} className="hover:bg-[#faf9f6] transition-colors cursor-pointer" onClick={() => navigate('/documents')}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: '#241512' }}>{d.numero}</td>
                    <td className="px-4 py-3 text-sm capitalize" style={{ color: '#241512' }}>{d.type}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#241512' }}>{(d.montantHT || 0).toLocaleString('fr-FR')} €</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#a89b8c' }}>{d.dateEmission && new Date(d.dateEmission).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-sm">{statutBadge(d.statut)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accès (codes d'accès Shopify, hébergeur...) */}
      {tab === 'Accès' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openAccesAdd} className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90 transition-opacity" style={{ background: '#241512' }}>
              <Plus size={14} /> Ajouter un accès
            </button>
          </div>
          {acces.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-sm" style={{ border: '1px solid #e7e5e1', color: '#a89b8c' }}>
              Aucun code d'accès enregistré (Shopify, hébergeur, nom de domaine…)
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acces.map(a => (
                <AccesCard key={a.id} acces={a} onEdit={() => openAccesEdit(a)} onDelete={() => handleAccesDelete(a.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulaire de contact */}
      {tab === 'Formulaire' && (
        formReponse ? (
          <RecapFormulaire formReponse={formReponse} />
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-sm" style={{ border: '1px solid #e7e5e1', color: '#a89b8c' }}>
            Aucun formulaire de contact lié à ce client.
          </div>
        )
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

      {/* Accès Modal */}
      {accesForm && (
        <Modal isOpen={accesModal} onClose={() => setAccesModal(false)} title="Code d'accès" size="md">
          <form onSubmit={handleAccesSubmit}>
            <FormField label="Service" required>
              <input className={`${inputCls} mb-4`} style={inputStyle} placeholder="Ex : Shopify, OVH, Nom de domaine…" value={accesForm.service} onChange={e => setAccesForm({ ...accesForm, service: e.target.value })} required />
            </FormField>
            <FormRow cols={2}>
              <FormField label="Identifiant">
                <input className={inputCls} style={inputStyle} value={accesForm.identifiant} onChange={e => setAccesForm({ ...accesForm, identifiant: e.target.value })} />
              </FormField>
              <FormField label="Mot de passe">
                <input className={inputCls} style={inputStyle} value={accesForm.motDePasse} onChange={e => setAccesForm({ ...accesForm, motDePasse: e.target.value })} />
              </FormField>
            </FormRow>
            <FormField label="Lien (optionnel)">
              <input className={`${inputCls} mb-4`} style={inputStyle} placeholder="https://..." value={accesForm.url} onChange={e => setAccesForm({ ...accesForm, url: e.target.value })} />
            </FormField>
            <FormField label="Notes">
              <textarea className={`${inputCls} resize-none`} style={inputStyle} rows={2} value={accesForm.notes} onChange={e => setAccesForm({ ...accesForm, notes: e.target.value })} />
            </FormField>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => setAccesModal(false)}>Annuler</button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }}>Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
