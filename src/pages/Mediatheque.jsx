import { useState } from 'react'
import { Plus, Edit, Trash2, ExternalLink, Search, Grid, List, Image, Video, Music, FileText, Layers, X } from 'lucide-react'
import useStore from '../store/useStore'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const TYPES = ['Photo', 'Vidéo', 'Graphique', 'Audio', 'Autre']
const SOURCES = ['Google Drive', 'Canva', 'Dropbox', 'Notion', 'Autre']
const PLATEFORMES = ['TikTok', 'Instagram', 'Les deux', 'Général']

const TYPE_ICONS = {
  Photo: Image,
  Vidéo: Video,
  Audio: Music,
  Graphique: Layers,
  Autre: FileText,
}
const TYPE_COLORS = {
  Photo: 'bg-pink-100 text-pink-700',
  Vidéo: 'bg-purple-100 text-purple-700',
  Audio: 'bg-blue-100 text-blue-700',
  Graphique: 'bg-orange-100 text-orange-700',
  Autre: 'bg-gray-100 text-gray-600',
}
const SOURCE_COLORS = {
  'Google Drive': 'bg-emerald-100 text-emerald-700',
  Canva: 'bg-indigo-100 text-indigo-700',
  Dropbox: 'bg-blue-100 text-blue-700',
  Notion: 'bg-gray-100 text-gray-700',
  Autre: 'bg-gray-100 text-gray-500',
}
const PLAT_COLORS = {
  TikTok: 'bg-gray-100 text-gray-700',
  Instagram: 'bg-pink-100 text-pink-700',
  'Les deux': 'bg-violet-100 text-violet-700',
  Général: 'bg-slate-100 text-slate-600',
}

const empty = {
  nom: '',
  type: 'Photo',
  source: 'Google Drive',
  plateforme: 'Général',
  lien: '',
  description: '',
  tags: '',
}

function MediaForm({ form, setForm, onSubmit, onCancel, label }) {
  return (
    <form onSubmit={onSubmit}>
      <FormField label="Nom du fichier / asset *">
        <input className="input mb-4" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required placeholder="Ex: Vidéo tuto Reels Juin 2025" />
      </FormField>
      <FormRow cols={3}>
        <FormField label="Type">
          <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </FormField>
        <FormField label="Source">
          <select className="select" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Plateforme">
          <select className="select" value={form.plateforme} onChange={e => setForm({ ...form, plateforme: e.target.value })}>
            {PLATEFORMES.map(p => <option key={p}>{p}</option>)}
          </select>
        </FormField>
      </FormRow>
      <FormField label="Lien *">
        <input className="input mb-4" value={form.lien} onChange={e => setForm({ ...form, lien: e.target.value })} required placeholder="https://drive.google.com/..." />
      </FormField>
      <FormField label="Description">
        <textarea className="input resize-none mb-4" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Contexte, utilisation prévue..." />
      </FormField>
      <FormField label="Tags">
        <input className="input mb-4" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="tuto, reel, juin, coulisses..." />
      </FormField>
      <div className="flex justify-end gap-2 mt-5">
        <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn-primary">{label}</button>
      </div>
    </form>
  )
}

function MediaCard({ m, onEdit, onDelete }) {
  const Icon = TYPE_ICONS[m.type] || FileText
  return (
    <div className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[m.type] || 'bg-gray-100'}`}>
            <Icon size={15} />
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">{m.nom}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => onEdit(m)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"><Edit size={13} /></button>
          <button onClick={() => onDelete(m.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={13} /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[m.type] || 'bg-gray-100 text-gray-600'}`}>{m.type}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SOURCE_COLORS[m.source] || 'bg-gray-100 text-gray-500'}`}>{m.source}</span>
        {m.plateforme && m.plateforme !== 'Général' && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PLAT_COLORS[m.plateforme] || 'bg-gray-100 text-gray-600'}`}>{m.plateforme}</span>
        )}
      </div>

      {m.description && <p className="text-xs text-gray-500 line-clamp-2">{m.description}</p>}

      {m.tags && (
        <div className="flex flex-wrap gap-1">
          {m.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
            <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#{tag}</span>
          ))}
        </div>
      )}

      <a
        href={m.lien}
        target="_blank"
        rel="noreferrer"
        className="mt-auto flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 truncate group"
      >
        <ExternalLink size={12} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
        <span className="truncate">Ouvrir dans {m.source}</span>
      </a>
    </div>
  )
}

function MediaRow({ m, onEdit, onDelete }) {
  const Icon = TYPE_ICONS[m.type] || FileText
  return (
    <tr className="table-row">
      <td className="table-cell">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[m.type] || 'bg-gray-100'}`}>
            <Icon size={13} />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{m.nom}</p>
            {m.description && <p className="text-xs text-gray-400 truncate max-w-xs">{m.description}</p>}
          </div>
        </div>
      </td>
      <td className="table-cell">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[m.type] || 'bg-gray-100 text-gray-600'}`}>{m.type}</span>
      </td>
      <td className="table-cell">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SOURCE_COLORS[m.source] || 'bg-gray-100 text-gray-500'}`}>{m.source}</span>
      </td>
      <td className="table-cell">
        {m.plateforme && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAT_COLORS[m.plateforme] || 'bg-gray-100 text-gray-600'}`}>{m.plateforme}</span>}
      </td>
      <td className="table-cell">
        {m.tags && (
          <div className="flex flex-wrap gap-1">
            {m.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#{tag}</span>
            ))}
          </div>
        )}
      </td>
      <td className="table-cell">
        <div className="flex items-center gap-2">
          <a href={m.lien} target="_blank" rel="noreferrer" className="p-1 text-gray-400 hover:text-indigo-600" title="Ouvrir le lien">
            <ExternalLink size={13} />
          </a>
          <button onClick={() => onEdit(m)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit size={13} /></button>
          <button onClick={() => onDelete(m.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
        </div>
      </td>
    </tr>
  )
}

export default function Mediatheque() {
  const { medias, addMedia, updateMedia, deleteMedia } = useStore()
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('tous')
  const [filterSource, setFilterSource] = useState('tous')
  const [filterPlat, setFilterPlat] = useState('tous')
  const [view, setView] = useState('grille')

  const filtered = medias.filter(m => {
    if (filterType !== 'tous' && m.type !== filterType) return false
    if (filterSource !== 'tous' && m.source !== filterSource) return false
    if (filterPlat !== 'tous' && m.plateforme !== filterPlat) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        m.nom?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.tags?.toLowerCase().includes(q)
      )
    }
    return true
  })

  function handleSubmit(e) {
    e.preventDefault()
    addMedia(form)
    setModal(false)
    setForm(empty)
  }

  function openEdit(m) {
    setEditForm({ ...m })
    setEditId(m.id)
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    updateMedia(editId, editForm)
    setEditId(null)
    setEditForm(null)
  }

  function handleDelete(id) {
    if (confirm('Supprimer ce fichier de la médiathèque ?')) {
      deleteMedia(id)
    }
  }

  const stats = {
    total: medias.length,
    videos: medias.filter(m => m.type === 'Vidéo').length,
    photos: medias.filter(m => m.type === 'Photo').length,
    graphiques: medias.filter(m => m.type === 'Graphique').length,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Médiathèque</h1>
          <p className="text-sm text-gray-500 mt-1">{stats.total} asset{stats.total > 1 ? 's' : ''} · {stats.videos} vidéo{stats.videos > 1 ? 's' : ''} · {stats.photos} photo{stats.photos > 1 ? 's' : ''} · {stats.graphiques} graphique{stats.graphiques > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setView('grille')} className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${view === 'grille' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Grid size={14} />Grille
            </button>
            <button onClick={() => setView('liste')} className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${view === 'liste' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <List size={14} />Liste
            </button>
          </div>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Ajouter un asset
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total', val: stats.total, color: 'text-gray-800', bg: 'bg-gray-50' },
          { label: 'Vidéos', val: stats.videos, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Photos', val: stats.photos, color: 'text-pink-700', bg: 'bg-pink-50' },
          { label: 'Graphiques', val: stats.graphiques, color: 'text-orange-700', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-5 py-4`}>
            <p className="text-xs font-semibold text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Barre de recherche + filtres */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Rechercher par nom, description, tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {['tous', ...TYPES].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterType === t ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {t === 'tous' ? 'Tous types' : t}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-200 self-center" />
          <div className="flex gap-1.5 flex-wrap">
            {['tous', ...SOURCES].map(s => (
              <button key={s} onClick={() => setFilterSource(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterSource === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {s === 'tous' ? 'Toutes sources' : s}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-200 self-center" />
          <div className="flex gap-1.5 flex-wrap">
            {['tous', ...PLATEFORMES].map(p => (
              <button key={p} onClick={() => setFilterPlat(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterPlat === p ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {p === 'tous' ? 'Toutes plateformes' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grille */}
      {view === 'grille' && (
        filtered.length === 0
          ? <div className="card py-16 text-center text-gray-400">
              <Image size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun asset trouvé</p>
              <p className="text-xs mt-1">Ajoute des fichiers depuis Google Drive, Canva, Dropbox...</p>
            </div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(m => <MediaCard key={m.id} m={m} onEdit={openEdit} onDelete={handleDelete} />)}
            </div>
      )}

      {/* Liste */}
      {view === 'liste' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr>
                  <th className="table-header">Nom</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Source</th>
                  <th className="table-header">Plateforme</th>
                  <th className="table-header">Tags</th>
                  <th className="table-header w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">Aucun asset</td></tr>}
                {filtered.map(m => <MediaRow key={m.id} m={m} onEdit={openEdit} onDelete={handleDelete} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal création */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Ajouter un asset" size="lg">
        <MediaForm form={form} setForm={setForm} onSubmit={handleSubmit} onCancel={() => setModal(false)} label="Ajouter" />
      </Modal>

      {/* Modal édition */}
      {editForm && (
        <Modal isOpen={!!editId} onClose={() => { setEditId(null); setEditForm(null) }} title="Modifier l'asset" size="lg">
          <MediaForm form={editForm} setForm={setEditForm} onSubmit={handleEditSubmit} onCancel={() => { setEditId(null); setEditForm(null) }} label="Enregistrer" />
        </Modal>
      )}
    </div>
  )
}
