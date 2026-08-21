import { useState } from 'react'
import { Plus, Eye, EyeOff, Copy, Edit, Trash2, Lock, Search, Check, ExternalLink, RefreshCw } from 'lucide-react'
import useStore from '../store/useStore'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const CATEGORIES = ['Réseaux sociaux', 'Outils & SaaS', 'Clients', 'Hébergement', 'Email', 'Banque & Paiement', 'Création', 'Autre']

const CAT_COLORS = {
  'Réseaux sociaux': 'bg-pink-100 text-pink-700',
  'Outils & SaaS': 'bg-[#f5f4f1] text-[#241512]',
  'Clients': 'bg-blue-100 text-blue-700',
  'Hébergement': 'bg-orange-100 text-orange-700',
  'Email': 'bg-sky-100 text-sky-700',
  'Banque & Paiement': 'bg-emerald-100 text-emerald-700',
  'Création': 'bg-[#f5e6e3] text-[#a1402d]',
  'Autre': 'bg-[#f5f4f1] text-[#a89b8c]',
}

const emptyMdp = {
  nom: '', categorie: 'Outils & SaaS', identifiant: '', motDePasse: '',
  url: '', notes: '', email: '',
}

function generatePassword(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-='
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
const inputStyle = { background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }
const btnPrimary = { background: '#241512', color: '#FDFCF8' }
const btnSecondary = { background: '#f5f4f1', color: '#241512' }

function PasswordStrength({ password }) {
  if (!password) return null
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort']
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-500', 'bg-emerald-500']
  const textColors = ['text-red-600', 'text-orange-500', 'text-yellow-600', 'text-blue-600', 'text-emerald-600']

  return (
    <div className="mt-1">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : ''}`} style={i >= score ? { background: '#eeece7' } : undefined} />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${textColors[score - 1] || ''}`} style={!textColors[score - 1] ? { color: '#a89b8c' } : undefined}>
        {score > 0 ? labels[score - 1] : 'Trop court'}
      </p>
    </div>
  )
}

function MdpForm({ form, setForm, onSubmit, onCancel, label }) {
  const [showPwd, setShowPwd] = useState(false)
  return (
    <form onSubmit={onSubmit}>
      <FormRow cols={2}>
        <FormField label="Nom du service *">
          <input className={inputCls} style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required placeholder="Ex: Instagram, Canva..." />
        </FormField>
        <FormField label="Catégorie">
          <select className={inputCls} style={inputStyle} value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </FormField>
      </FormRow>
      <FormRow cols={2}>
        <FormField label="Identifiant / Email">
          <input className={inputCls} style={inputStyle} value={form.identifiant} onChange={e => setForm({ ...form, identifiant: e.target.value })} placeholder="nom@exemple.com" />
        </FormField>
        <FormField label="Email associé">
          <input type="email" className={inputCls} style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@icloud.com" />
        </FormField>
      </FormRow>
      <FormField label="Mot de passe *">
        <div className="relative">
          <input
            className={`${inputCls} pr-20`}
            style={inputStyle}
            type={showPwd ? 'text' : 'password'}
            value={form.motDePasse}
            onChange={e => setForm({ ...form, motDePasse: e.target.value })}
            required
            placeholder="••••••••••••"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button type="button" onClick={() => setShowPwd(s => !s)} className="p-1 rounded hover:text-[#241512]" style={{ color: '#a89b8c' }}>
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button type="button" title="Générer un mot de passe"
              onClick={() => setForm({ ...form, motDePasse: generatePassword() })}
              className="p-1 rounded hover:text-[#241512]" style={{ color: '#a89b8c' }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <PasswordStrength password={form.motDePasse} />
      </FormField>
      <FormField label="URL du site">
        <input className={`${inputCls} mb-4`} style={inputStyle} value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://exemple.com" />
      </FormField>
      <FormField label="Notes">
        <textarea className={`${inputCls} resize-none mb-4`} style={inputStyle} rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Infos supplémentaires..." />
      </FormField>
      <div className="flex justify-end gap-2 mt-5">
        <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={btnSecondary} onClick={onCancel}>Annuler</button>
        <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={btnPrimary}>{label}</button>
      </div>
    </form>
  )
}

function MdpCard({ mdp, onEdit, onDelete }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState('')

  function copy(text, field) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field)
      setTimeout(() => setCopied(''), 1500)
    })
  }

  return (
    <div className="bg-white rounded-2xl p-4 hover:shadow-md transition-shadow" style={{ border: '1px solid #e7e5e1' }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#241512' }}>
            <span className="text-sm font-bold text-white">{mdp.nom.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#241512' }}>{mdp.nom}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${CAT_COLORS[mdp.categorie] || 'bg-[#f5f4f1] text-[#a89b8c]'}`}>{mdp.categorie}</span>
          </div>
        </div>
        <div className="flex gap-1">
          {mdp.url && (
            <a href={mdp.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-[#f5f4f1] hover:text-[#241512]" style={{ color: '#a89b8c' }} title="Ouvrir le site">
              <ExternalLink size={13} />
            </a>
          )}
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-[#f5f4f1] hover:text-[#241512]" style={{ color: '#a89b8c' }}><Edit size={13} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500" style={{ color: '#a89b8c' }}><Trash2 size={13} /></button>
        </div>
      </div>

      {mdp.identifiant && (
        <div className="flex items-center justify-between rounded-xl px-3 py-2 mb-2" style={{ background: '#f5f4f1' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#a89b8c' }}>Identifiant</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#241512' }}>{mdp.identifiant}</p>
          </div>
          <button onClick={() => copy(mdp.identifiant, 'id')} className="p-1.5 rounded-lg transition-colors" style={copied === 'id' ? { color: '#10b981', background: '#ecfdf5' } : { color: '#a89b8c' }}>
            {copied === 'id' ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl px-3 py-2 mb-2" style={{ background: '#f5f4f1' }}>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#a89b8c' }}>Mot de passe</p>
          <p className="text-xs font-mono font-medium mt-0.5 truncate" style={{ color: '#241512' }}>
            {show ? mdp.motDePasse : '•'.repeat(Math.min(mdp.motDePasse.length, 16))}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0 ml-2">
          <button onClick={() => setShow(s => !s)} className="p-1.5 rounded-lg hover:bg-[#eeece7] hover:text-[#241512]" style={{ color: '#a89b8c' }}>
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button onClick={() => copy(mdp.motDePasse, 'pwd')} className="p-1.5 rounded-lg transition-colors" style={copied === 'pwd' ? { color: '#10b981', background: '#ecfdf5' } : { color: '#a89b8c' }}>
            {copied === 'pwd' ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {mdp.email && (
        <div className="flex items-center justify-between rounded-xl px-3 py-2 mb-2" style={{ background: '#f5f4f1' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#a89b8c' }}>Email</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#241512' }}>{mdp.email}</p>
          </div>
          <button onClick={() => copy(mdp.email, 'email')} className="p-1.5 rounded-lg transition-colors" style={copied === 'email' ? { color: '#10b981', background: '#ecfdf5' } : { color: '#a89b8c' }}>
            {copied === 'email' ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      )}

      {mdp.notes && (
        <p className="text-xs mt-2 italic pt-2" style={{ color: '#a89b8c', borderTop: '1px solid #eeece7' }}>{mdp.notes}</p>
      )}
    </div>
  )
}

export default function MotDePasse() {
  const { motsDePasse, addMotDePasse, updateMotDePasse, deleteMotDePasse } = useStore()
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyMdp)
  const [editForm, setEditForm] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('toutes')

  const filtered = (motsDePasse || []).filter(m => {
    if (filterCat !== 'toutes' && m.categorie !== filterCat) return false
    if (search && !m.nom.toLowerCase().includes(search.toLowerCase()) && !m.identifiant?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(m => m.categorie === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  function handleSubmit(e) {
    e.preventDefault()
    addMotDePasse(form)
    setModal(false)
    setForm(emptyMdp)
  }

  function openEdit(m) {
    setEditForm({ ...m })
    setEditId(m.id)
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    updateMotDePasse(editId, editForm)
    setEditId(null)
  }

  function handleDelete(id) {
    if (confirm('Supprimer ce mot de passe ?')) deleteMotDePasse(id)
  }

  const usedCats = CATEGORIES.filter(c => (motsDePasse || []).some(m => m.categorie === c))

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Mots de passe</h1>
          <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>{(motsDePasse || []).length} entrée{(motsDePasse || []).length > 1 ? 's' : ''} enregistrée{(motsDePasse || []).length > 1 ? 's' : ''}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={btnPrimary} onClick={() => setModal(true)}>
          <Plus size={16} /> Nouveau
        </button>
      </div>

      {/* Info */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5">
        <Lock size={16} className="text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-700">Les mots de passe sont stockés localement dans ton navigateur. Ne partage pas cet espace avec des personnes non autorisées.</p>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 mb-5 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#a89b8c' }} />
          <input className={`${inputCls} pl-9 py-2 text-sm`} style={inputStyle} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterCat('toutes')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={filterCat === 'toutes' ? { background: '#241512', color: '#FDFCF8' } : { background: '#ffffff', border: '1px solid #e7e5e1', color: '#241512' }}>
            Toutes
          </button>
          {usedCats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
              style={filterCat === c ? { background: '#241512', color: '#FDFCF8' } : { background: '#ffffff', border: '1px solid #e7e5e1', color: '#241512' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#f5f4f1' }}>
            <Lock size={22} style={{ color: '#a89b8c' }} />
          </div>
          <p className="font-display text-xl font-bold" style={{ color: '#241512' }}>Aucun mot de passe enregistré</p>
          <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>Clique sur "Nouveau" pour en ajouter un.</p>
        </div>
      )}

      {/* Grouped cards */}
      {filterCat === 'toutes' ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CAT_COLORS[cat] || 'bg-[#f5f4f1] text-[#a89b8c]'}`}>{cat}</span>
                <span className="text-xs" style={{ color: '#a89b8c' }}>{items.length} entrée{items.length > 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(m => (
                  <MdpCard key={m.id} mdp={m} onEdit={() => openEdit(m)} onDelete={() => handleDelete(m.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <MdpCard key={m.id} mdp={m} onEdit={() => openEdit(m)} onDelete={() => handleDelete(m.id)} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouveau mot de passe" size="md">
        <MdpForm form={form} setForm={setForm} onSubmit={handleSubmit} onCancel={() => setModal(false)} label="Enregistrer" />
      </Modal>

      {/* Edit Modal */}
      {editForm && (
        <Modal isOpen={!!editId} onClose={() => setEditId(null)} title="Modifier le mot de passe" size="md">
          <MdpForm form={editForm} setForm={setEditForm} onSubmit={handleEditSubmit} onCancel={() => setEditId(null)} label="Enregistrer" />
        </Modal>
      )}
    </div>
  )
}
