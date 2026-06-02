import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, Search, Grid, List, Image, Video, Music, FileText, Layers, RefreshCw, X, FolderOpen, AlertCircle } from 'lucide-react'

const API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY
const FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID

function getMimeCategory(mimeType) {
  if (!mimeType) return 'Autre'
  if (mimeType.startsWith('image/')) return 'Photo'
  if (mimeType.startsWith('video/')) return 'Vidéo'
  if (mimeType.startsWith('audio/')) return 'Audio'
  if (mimeType === 'application/vnd.google-apps.presentation') return 'Graphique'
  if (mimeType === 'application/vnd.canva.design') return 'Graphique'
  if (
    mimeType === 'application/vnd.google-apps.document' ||
    mimeType === 'application/pdf' ||
    mimeType === 'application/vnd.google-apps.spreadsheet'
  ) return 'Document'
  if (mimeType === 'application/vnd.google-apps.folder') return 'Dossier'
  return 'Autre'
}

const TYPE_ICONS = {
  Photo: Image,
  Vidéo: Video,
  Audio: Music,
  Graphique: Layers,
  Document: FileText,
  Dossier: FolderOpen,
  Autre: FileText,
}
const TYPE_COLORS = {
  Photo: 'bg-pink-100 text-pink-700',
  Vidéo: 'bg-purple-100 text-purple-700',
  Audio: 'bg-blue-100 text-blue-700',
  Graphique: 'bg-orange-100 text-orange-700',
  Document: 'bg-slate-100 text-slate-600',
  Dossier: 'bg-yellow-100 text-yellow-700',
  Autre: 'bg-gray-100 text-gray-600',
}

function formatSize(bytes) {
  if (!bytes) return null
  const b = parseInt(bytes)
  if (b < 1024) return `${b} o`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} Ko`
  return `${(b / 1024 / 1024).toFixed(1)} Mo`
}

function Thumbnail({ file }) {
  const [imgOk, setImgOk] = useState(true)
  const category = getMimeCategory(file.mimeType)
  const Icon = TYPE_ICONS[category] || FileText
  const colorClass = TYPE_COLORS[category] || 'bg-gray-100 text-gray-500'

  const thumbUrl = file.thumbnailLink
    ? file.thumbnailLink.replace('=s220', '=s400')
    : null

  if (thumbUrl && imgOk) {
    return (
      <img
        src={thumbUrl}
        alt={file.name}
        className="w-full h-36 object-cover rounded-xl"
        onError={() => setImgOk(false)}
      />
    )
  }

  return (
    <div className={`w-full h-36 rounded-xl flex items-center justify-center ${colorClass}`}>
      <Icon size={32} className="opacity-60" />
    </div>
  )
}

function FileCard({ file }) {
  const category = getMimeCategory(file.mimeType)
  const Icon = TYPE_ICONS[category] || FileText
  const colorClass = TYPE_COLORS[category] || 'bg-gray-100 text-gray-600'
  const size = formatSize(file.size)

  return (
    <a
      href={file.webViewLink}
      target="_blank"
      rel="noreferrer"
      className="card p-3 flex flex-col gap-2 hover:shadow-md transition-all hover:-translate-y-0.5 group cursor-pointer"
    >
      <Thumbnail file={file} />

      <div className="flex items-start justify-between gap-1 mt-1">
        <p className="text-xs font-semibold text-gray-900 line-clamp-2 flex-1">{file.name}</p>
        <ExternalLink size={11} className="flex-shrink-0 text-gray-300 group-hover:text-indigo-500 mt-0.5 transition-colors" />
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>{category}</span>
        {size && <span className="text-[10px] text-gray-400">{size}</span>}
      </div>

      {file.createdTime && (
        <p className="text-[10px] text-gray-400">
          {new Date(file.createdTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </a>
  )
}

function FileRow({ file }) {
  const category = getMimeCategory(file.mimeType)
  const Icon = TYPE_ICONS[category] || FileText
  const colorClass = TYPE_COLORS[category] || 'bg-gray-100 text-gray-600'
  const size = formatSize(file.size)

  return (
    <tr className="table-row">
      <td className="table-cell">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
            <Icon size={13} />
          </div>
          <p className="font-medium text-gray-900 text-sm truncate max-w-xs">{file.name}</p>
        </div>
      </td>
      <td className="table-cell">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>{category}</span>
      </td>
      <td className="table-cell text-xs text-gray-500">{size || '—'}</td>
      <td className="table-cell text-xs text-gray-500">
        {file.createdTime ? new Date(file.createdTime).toLocaleDateString('fr-FR') : '—'}
      </td>
      <td className="table-cell">
        <a href={file.webViewLink} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">
          <ExternalLink size={12} /> Ouvrir
        </a>
      </td>
    </tr>
  )
}

export default function Mediatheque() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('tous')
  const [view, setView] = useState('grille')

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fields = 'files(id,name,mimeType,thumbnailLink,webViewLink,createdTime,size)'
      const q = encodeURIComponent(`'${FOLDER_ID}' in parents and trashed = false`)
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&key=${API_KEY}&fields=${fields}&pageSize=100&orderBy=createdTime desc`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Erreur API Drive (${res.status})`)
      const data = await res.json()
      setFiles(data.files || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const types = ['tous', ...Array.from(new Set(files.map(f => getMimeCategory(f.mimeType))))]

  const filtered = files.filter(f => {
    if (filterType !== 'tous' && getMimeCategory(f.mimeType) !== filterType) return false
    if (search) return f.name.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const stats = {
    total: files.length,
    videos: files.filter(f => getMimeCategory(f.mimeType) === 'Vidéo').length,
    photos: files.filter(f => getMimeCategory(f.mimeType) === 'Photo').length,
    graphiques: files.filter(f => getMimeCategory(f.mimeType) === 'Graphique').length,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Médiathèque</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Chargement…' : `${stats.total} fichier${stats.total > 1 ? 's' : ''} · ${stats.videos} vidéo${stats.videos > 1 ? 's' : ''} · ${stats.photos} photo${stats.photos > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setView('grille')} className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${view === 'grille' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Grid size={14} /> Grille
            </button>
            <button onClick={() => setView('liste')} className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${view === 'liste' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <List size={14} /> Liste
            </button>
          </div>
          <button onClick={fetchFiles} className="btn-secondary flex items-center gap-1.5" title="Actualiser">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
          <a
            href={`https://drive.google.com/drive/folders/${FOLDER_ID}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary flex items-center gap-1.5"
          >
            <ExternalLink size={14} /> Ouvrir Drive
          </a>
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
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? '—' : s.val}</p>
          </div>
        ))}
      </div>

      {/* Recherche + filtres */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Rechercher un fichier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterType === t ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t === 'tous' ? 'Tous types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="card p-4 mb-5 flex items-center gap-3 border border-red-200 bg-red-50">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Impossible de charger les fichiers Drive</p>
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          </div>
          <button onClick={fetchFiles} className="ml-auto btn-secondary text-xs">Réessayer</button>
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-3 animate-pulse">
              <div className="w-full h-36 bg-gray-200 rounded-xl mb-2" />
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Grille */}
      {!loading && !error && view === 'grille' && (
        filtered.length === 0
          ? <div className="card py-16 text-center text-gray-400">
              <Image size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{search ? 'Aucun fichier trouvé' : 'Aucun fichier dans ce dossier Drive'}</p>
            </div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(f => <FileCard key={f.id} file={f} />)}
            </div>
      )}

      {/* Liste */}
      {!loading && !error && view === 'liste' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="table-header">Nom</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Taille</th>
                  <th className="table-header">Date</th>
                  <th className="table-header w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">Aucun fichier</td></tr>}
                {filtered.map(f => <FileRow key={f.id} file={f} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
