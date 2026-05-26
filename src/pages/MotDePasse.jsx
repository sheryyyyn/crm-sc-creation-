import { useState } from 'react'
import { Plus, Eye, EyeOff, Copy, Edit, Trash2, Lock, Search, Check, ExternalLink, RefreshCw } from 'lucide-react'
import useStore from '../store/useStore'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const CATEGORIES = ['Réseaux sociaux', 'Outils & SaaS', 'Clients', 'Hébergement', 'Email', 'Banque & Paiement', 'Création', 'Autre']

const CAT_COLORS = {
  'Réseaux sociaux': 'bg-pink-100 text-pink-700',
  'Outils & SaaS': 'bg-indigo-100 text-indigo-700',
  'Clients': 'bg-blue-100 text-blue-700',
  'Hébergement': 'bg-orange-100 text-orange-700',
  'Email': 'bg-sky-100 text-sky-700',
  'Banque & Paiement': 'bg-emerald-100 text-emerald-700',
  'Création': 'bg-purple-100 text-purple-700',
  'Autre': 'bg-gray-100 text-gray-600',
}

const emptyMdp = {
  nom: '', categorie: 'Outils & SaaS', identifiant: '', motDePasse: '',
  url: '', notes: '', email: '',
}

function generatePassword(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-='
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

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
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${textColors[score - 1] || 'text-gray-400'}`}>
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
          <input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required placeholder="Ex: Instagram, Canva..." />
        </FormField>
        <FormField label="Catégorie">
          <select className="select" value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </FormField>
      </FormRow>
      <FormRow cols={2}>
        <FormField label="Identifiant / Email">
          <input className="input" value={form.identifiant} onChange={e => setForm({ ...form, identifiant: e.target.value })} placeholder="nom@exemple.com" />
        </FormField>
        <FormField label="Email associé">
          <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@icloud.com" />
        </FormField>
      </FormRow>
      <FormField label="Mot de passe *">
        <div className="relative">
          <input
            className="input pr-20"
            type={showPwd ? 'text' : 'password'}
            value={form.motDePasse}
            onChange={e => setForm({ ...form, motDePasse: e.target.value })}
            required
            placeholder="••••••••••••"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button type="button" onClick={() => setShowPwd(s => !s)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button type="button" title="Générer un mot de passe"
              onClick={() => setForm({ ...form, motDePasse: generatePassword() })}
              className="p-1 text-gray-400 hover:text-indigo-600 rounded">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <PasswordStrength password={form.motDePasse} />
      </FormField>
      <FormField label="URL du site">
        <input className="input mb-4" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://exemple.com" />
      </FormField>
      <FormField label="Notes">
        <textarea className="input resize-none mb-4" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Infos supplémentaires..." />
      </FormField>
      <div className="flex justify-end gap-2 mt-5">
        <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn-primary">{label}</button>
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
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">{mdp.nom.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{mdp.nom}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${CAT_COLORS[mdp.categorie] || 'bg-gray-100 text-gray-500'}`}>{mdp.categorie}</span>
          </div>
        </div>
        <div className="flex gap-1">
          {mdp.url && (
            <a href={mdp.url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50" title="Ouvrir le site">
              <ExternalLink size={13} />
            </a>
          )}
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"><Edit size={13} /></button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={13} /></button>
        </div>
      </div>

      {mdp.identifiant && (
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 mb-2">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Identifiant</p>
            <p className="text-xs font-medium text-gray-700 mt-0.5">{mdp.identifiant}</p>
          </div>
          <button onClick={() => copy(mdp.identifiant, 'id')} className={`p-1.5 rounded-lg transition-colors ${copied === 'id' ? 'text-emerald-500 bg-emerald-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
            {copied === 'id' ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mot de passe</p>
          <p className="text-xs font-mono font-medium text-gray-700 mt-0.5 truncate">
            {show ? mdp.motDePasse : '•'.repeat(Math.min(mdp.motDePasse.length, 16))}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0 ml-2">
          <button onClick={() => setShow(s => !s)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button onClick={() => copy(mdp.motDePasse, 'pwd')} className={`p-1.5 rounded-lg transition-colors ${copied === 'pwd' ? 'text-emerald-500 bg-emerald-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
            {copied === 'pwd' ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {mdp.email && (
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 mb-2">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</p>
            <p className="text-xs font-medium text-gray-700 mt-0.5">{mdp.email}</p>
          </div>
          <button onClick={() => copy(mdp.email, 'email')} className={`p-1.5 rounded-lg transition-colors ${copied === 'email' ? 'text-emerald-500 bg-emerald-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
            {copied === 'email' ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      )}

      {mdp.notes && (
        <p className="text-xs text-gray-500 mt-2 italic border-t border-gray-100 pt-2">{mdp.notes}</p>
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Mots de passe</h1>
          <p className="text-sm text-gray-500 mt-1">{(motsDePasse || []).length} entrée{(motsDePasse || []).length > 1 ? 's' : ''} enregistrée{(motsDePasse || []).length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
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
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 py-2 text-sm" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterCat('toutes')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterCat === 'toutes' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Toutes
          </button>
          {usedCats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterCat === c ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Lock size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">Aucun mot de passe enregistré</p>
          <p className="text-sm mt-1">Clique sur "Nouveau" pour en ajouter un.</p>
        </div>
      )}

      {/* Grouped cards */}
      {filterCat === 'toutes' ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CAT_COLORS[cat] || 'bg-gray-100 text-gray-600'}`}>{cat}</span>
                <span className="text-xs text-gray-400">{items.length} entrée{items.length > 1 ? 's' : ''}</span>
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
