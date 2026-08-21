import { useState } from 'react'
import { Pencil, Plus, X, Trash2, Copy, Check, Inbox, ExternalLink } from 'lucide-react'
import useStore from '../store/useStore'
import { ROADMAP_STATUTS } from '../data/saasConfig'
import Modal from '../components/ui/Modal'

const label = { color: '#a89b8c' }
const dark = { color: '#241512' }

// ─── Modal édition des infos générales ────────────────────────────────────
function EditModal({ produit, onClose, onSave }) {
  const [form, setForm] = useState({
    statut: produit.statut || '',
    modeleTarifaire: produit.modeleTarifaire || '',
    prix: produit.prix || '',
    responsable: produit.responsable || '',
    publicCible: produit.publicCible || '',
    lancement: produit.lancement || '',
    description: produit.description || '',
  })

  return (
    <Modal isOpen onClose={onClose} title="Modifier le produit" size="md">
      <form onSubmit={e => { e.preventDefault(); onSave(form); onClose() }} className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={label}>Statut</label>
            <select className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: '1px solid #e7e5e1' }}
              value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
              {['Idée', 'Conception', 'Développement', 'Test', 'Lancé'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={label}>Modèle tarifaire</label>
            <input className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: '1px solid #e7e5e1' }}
              value={form.modeleTarifaire} onChange={e => setForm({ ...form, modeleTarifaire: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={label}>Prix</label>
            <input className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: '1px solid #e7e5e1' }}
              value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={label}>Responsable</label>
            <input className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: '1px solid #e7e5e1' }}
              value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold mb-1.5" style={label}>Public cible</label>
            <input className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: '1px solid #e7e5e1' }}
              value={form.publicCible} onChange={e => setForm({ ...form, publicCible: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold mb-1.5" style={label}>Lancement</label>
            <input type="text" placeholder="Ex : Q1 2027" className="w-full px-3 py-2 rounded-xl text-sm" style={{ border: '1px solid #e7e5e1' }}
              value={form.lancement} onChange={e => setForm({ ...form, lancement: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold mb-1.5" style={label}>Description</label>
            <textarea rows={3} className="w-full px-3 py-2 rounded-xl text-sm resize-none" style={{ border: '1px solid #e7e5e1' }}
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <button type="submit" className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#241512' }}>
          Enregistrer
        </button>
      </form>
    </Modal>
  )
}

// ─── Modal réponse de prospection (détail) ────────────────────────────────
function ProspectDetailModal({ prospect, fields, onClose }) {
  return (
    <Modal isOpen onClose={onClose} title={prospect.nomEtablissement || 'Réponse'} size="md">
      <div className="px-6 py-5 space-y-4">
        {fields.map(f => {
          const v = prospect[f.name]
          if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return null
          return (
            <div key={f.name}>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={label}>{f.label}</p>
              <p className="text-sm" style={dark}>{Array.isArray(v) ? v.join(', ') : v}</p>
            </div>
          )
        })}
        {prospect.email && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={label}>Email</p>
            <p className="text-sm" style={dark}>{prospect.email}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

const TABS = [
  { key: 'apercu', label: 'Aperçu' },
  { key: 'fonctionnalites', label: 'Fonctionnalités & Roadmap' },
  { key: 'prospection', label: 'Prospection' },
]

export default function SaasProduit({ config }) {
  const { saasProduits, saasProspects, updateSaasProduit, addSaasFonctionnalite, updateSaasFonctionnaliteStatut, deleteSaasFonctionnalite, markSaasProspectRead, deleteSaasProspect } = useStore()
  const [tab, setTab] = useState('apercu')
  const [editing, setEditing] = useState(false)
  const [addingFeature, setAddingFeature] = useState(false)
  const [featureLabel, setFeatureLabel] = useState('')
  const [openProspectId, setOpenProspectId] = useState(null)
  const [copied, setCopied] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const produit = saasProduits.find(p => p.id === config.id) || { id: config.id, ...config.defaults }
  const fonctionnalites = produit.fonctionnalites || []
  const prospects = [...saasProspects.filter(p => p.produitId === config.id)].sort((a, b) => b.horodateur.localeCompare(a.horodateur))
  const newProspectCount = prospects.filter(p => !p.lu).length
  const formUrl = typeof window !== 'undefined' ? `${window.location.origin}/saas/${config.slug}/prospection` : ''

  function handleCopyLink() {
    navigator.clipboard.writeText(formUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  function handleAddFeature(e) {
    e.preventDefault()
    if (!featureLabel.trim()) return
    addSaasFonctionnalite(config.id, featureLabel.trim())
    setFeatureLabel('')
    setAddingFeature(false)
  }

  const infoItems = [
    { k: 'Statut', v: produit.statut || '—' },
    { k: 'Modèle tarifaire', v: produit.modeleTarifaire || '—' },
    { k: 'Prix', v: produit.prix || '—' },
    { k: 'Responsable', v: produit.responsable || '—' },
    { k: 'Public cible', v: produit.publicCible || '—' },
    { k: 'Lancement', v: produit.lancement || '—' },
  ]

  return (
    <div>
      {editing && <EditModal produit={produit} onClose={() => setEditing(false)} onSave={data => updateSaasProduit(config.id, data)} />}
      {openProspectId && (
        <ProspectDetailModal
          prospect={prospects.find(p => p.id === openProspectId)}
          fields={config.prospectFields}
          onClose={() => setOpenProspectId(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: config.dotColor }} />
            <h1 className="font-display text-4xl font-bold" style={dark}>{produit.titre || config.titre}</h1>
          </div>
          <p className="text-sm mt-1" style={label}>{config.sousTitre}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#eeece7] transition-colors" style={{ background: '#f5f4f1', color: '#241512' }}>
            <Pencil size={14} />
            Modifier
          </button>
          {tab === 'fonctionnalites' && (
            <button onClick={() => setAddingFeature(true)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity" style={{ background: '#241512' }}>
              <Plus size={14} />
              Fonctionnalité
            </button>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-1.5 mb-6 flex-wrap">
        {TABS.map(t => {
          const active = tab === t.key
          const count = t.key === 'prospection' && newProspectCount > 0 ? newProspectCount : 0
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold transition-colors"
              style={active ? { background: '#241512', color: '#FDFCF8' } : { background: '#f5f4f1', color: '#241512' }}>
              {t.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[16px] text-center leading-none ${active ? 'bg-[#FDFCF8] text-[#241512]' : 'bg-[#a1402d] text-white'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'apercu' && (
        <div>
          {/* Info grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {infoItems.map(({ k, v }) => (
              <div key={k} className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e7e5e1' }}>
                <p className="text-xs mb-1" style={label}>{k}</p>
                <p className="text-sm font-bold" style={dark}>{v}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed" style={label}>{produit.description}</p>
        </div>
      )}

      {tab === 'fonctionnalites' && (
        <div>
          {/* Fonctionnalités clés */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={label}>Fonctionnalités clés</p>
            {addingFeature && (
              <form onSubmit={handleAddFeature} className="flex items-center gap-2 mb-3">
                <input autoFocus placeholder="Nouvelle fonctionnalité…" value={featureLabel} onChange={e => setFeatureLabel(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl text-sm" style={{ border: '1px solid #e7e5e1' }} />
                <button type="submit" className="text-xs font-semibold px-3 py-2 rounded-lg text-white" style={{ background: '#241512' }}>Ajouter</button>
                <button type="button" onClick={() => { setAddingFeature(false); setFeatureLabel('') }} className="text-xs px-2 py-2 rounded-lg" style={{ background: '#f5f4f1', color: '#a89b8c' }}><X size={12} /></button>
              </form>
            )}
            <div className="space-y-1.5">
              {fonctionnalites.map(f => (
                <div key={f.id} className="flex items-center gap-2 group">
                  <select value={f.statut} onChange={e => updateSaasFonctionnaliteStatut(config.id, f.id, e.target.value)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: '#f5f4f1', color: ROADMAP_STATUTS.find(s => s.key === f.statut)?.color || '#a89b8c', border: 'none' }}>
                    {ROADMAP_STATUTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                  <p className="text-sm flex-1" style={dark}>{f.label}</p>
                  <button onClick={() => deleteSaasFonctionnalite(config.id, f.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-300 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Roadmap */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={label}>Roadmap</p>
            <div className="flex items-center gap-8 flex-wrap">
              {ROADMAP_STATUTS.map(s => (
                <div key={s.key} className="flex items-center gap-2">
                  <span className="text-sm" style={label}>{fonctionnalites.filter(f => f.statut === s.key).length}</span>
                  <span className="text-sm font-bold" style={{ color: s.color }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'prospection' && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={label}>Réponses reçues ({prospects.length})</p>
            <div className="flex items-center gap-2">
              <a href={`/saas/${config.slug}/prospection`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#eeece7] transition-colors" style={{ background: '#f5f4f1', color: '#241512' }}>
                <ExternalLink size={12} />
                Voir le formulaire
              </a>
              <button onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#eeece7] transition-colors" style={{ background: '#f5f4f1', color: '#241512' }}>
                {copied ? <><Check size={12} className="text-emerald-600" />Copié</> : <><Copy size={12} />Copier le lien</>}
              </button>
            </div>
          </div>

          {prospects.length === 0 ? (
            <div className="bg-white rounded-2xl px-7 py-12 text-center flex flex-col items-center" style={{ border: '1px solid #e7e5e1' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: '#f5f4f1' }}>
                <Inbox size={20} style={{ color: '#a89b8c' }} />
              </div>
              <p className="text-sm" style={label}>Aucune réponse pour l'instant.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
              {prospects.map(p => (
                <div key={p.id}>
                  <div
                    onClick={() => { if (!p.lu) markSaasProspectRead(p.id); setOpenProspectId(p.id) }}
                    className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-[#faf9f6] transition-colors"
                    style={{ borderBottom: '1px solid #f0eee9' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={dark}>{p.nomEtablissement || p.email || 'Réponse anonyme'}</p>
                      <p className="text-[11px] mt-0.5" style={label}>
                        {new Date(p.horodateur).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {!p.lu && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#f5e6e3', color: '#a1402d' }}>Nouveau</span>
                      )}
                      {confirmDeleteId === p.id ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { deleteSaasProspect(p.id); setConfirmDeleteId(null) }}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">Confirmer</button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }}>Annuler</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(p.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
