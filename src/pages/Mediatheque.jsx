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
  Document: 'bg-[#f5f4f1] text-[#241512]',
  Dossier: 'bg-yellow-100 text-yellow-700',
  Autre: 'bg-[#f5f4f1] text-[#a89b8c]',
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
  const colorClass = TYPE_COLORS[category] || 'bg-[#f5f4f1] text-[#a89b8c]'

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
  const size = formatSize(file.size)

  return (
    <a
      href={file.webViewLink}
      target="_blank"
      rel="noreferrer"
      className="bg-white rounded-2xl p-3 flex flex-col gap-2 transition-all hover:-translate-y-0.5 group cursor-pointer"
      style={{ border: '1px solid #e7e5e1' }}
    >
      <Thumbnail file={file} />

      <div className="flex items-start justify-between gap-1 mt-1">
        <p className="text-xs font-semibold text-[#241512] line-clamp-2 flex-1">{file.name}</p>
        <ExternalLink size={11} className="flex-shrink-0 text-[#e7e5e1] group-hover:text-[#241512] mt-0.5 transition-colors" />
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[category] || 'bg-[#f5f4f1] text-[#a89b8c]'}`}>{category}</span>
        {size && <span className="text-[10px] text-[#a89b8c]">{size}</span>}
      </div>

      {file.createdTime && (
        <p className="text-[10px] text-[#a89b8c]">
          {new Date(file.createdTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </a>
  )
}

function FileRow({ file }) {
  const category = getMimeCategory(file.mimeType)
  const Icon = TYPE_ICONS[category] || FileText
  const colorClass = TYPE_COLORS[category] || 'bg-[#f5f4f1] text-[#a89b8c]'
  const size = formatSize(file.size)

  return (
    <tr className="hover:bg-[#f5f4f1]/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
            <Icon size={13} />
          </div>
          <p className="font-medium text-[#241512] text-sm truncate max-w-xs">{file.name}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>{category}</span>
      </td>
      <td className="px-4 py-3 text-xs text-[#a89b8c]">{size || '—'}</td>
      <td className="px-4 py-3 text-xs text-[#a89b8c]">
        {file.createdTime ? new Date(file.createdTime).toLocaleDateString('fr-FR') : '—'}
      </td>
      <td className="px-4 py-3">
        <a href={file.webViewLink} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#241512] hover:opacity-70">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Médiathèque</h1>
          <p className="text-sm text-[#a89b8c] mt-1">
            {loading ? 'Chargement…' : `${stats.total} fichier${stats.total > 1 ? 's' : ''} · ${stats.videos} vidéo${stats.videos > 1 ? 's' : ''} · ${stats.photos} photo${stats.photos > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: '#e7e5e1' }}>
            <button onClick={() => setView('grille')} className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${view === 'grille' ? 'bg-[#241512] text-white' : 'bg-white text-[#a89b8c] hover:bg-[#f5f4f1]'}`}>
              <Grid size={14} /> Grille
            </button>
            <button onClick={() => setView('liste')} className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${view === 'liste' ? 'bg-[#241512] text-white' : 'bg-white text-[#a89b8c] hover:bg-[#f5f4f1]'}`}>
              <List size={14} /> Liste
            </button>
          </div>
          <button onClick={fetchFiles} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} title="Actualiser">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
          <a
            href={`https://drive.google.com/drive/folders/${FOLDER_ID}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#241512', color: '#FDFCF8' }}
          >
            <ExternalLink size={14} /> Ouvrir Drive
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total', val: stats.total, color: '#241512', bg: '#f5f4f1' },
          { label: 'Vidéos', val: stats.videos, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Photos', val: stats.photos, color: 'text-pink-700', bg: 'bg-pink-50' },
          { label: 'Graphiques', val: stats.graphiques, color: 'text-orange-700', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl px-5 py-4 ${s.bg && s.bg.startsWith('bg-') ? s.bg : ''}`} style={!s.bg?.startsWith('bg-') ? { background: s.bg } : undefined}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#a89b8c' }}>{s.label}</p>
            <p className={`text-2xl font-bold ${s.color?.startsWith('text-') ? s.color : ''}`} style={!s.color?.startsWith('text-') ? { color: s.color } : undefined}>{loading ? '—' : s.val}</p>
          </div>
        ))}
      </div>

      {/* Recherche + filtres */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a89b8c]" />
          <input
            className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
            style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }}
            placeholder="Rechercher un fichier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89b8c] hover:text-[#241512]">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterType === t ? 'bg-[#241512] text-white' : 'bg-white border text-[#a89b8c] hover:bg-[#f5f4f1]'}`}
              style={filterType !== t ? { borderColor: '#e7e5e1' } : undefined}>
              {t === 'tous' ? 'Tous types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-white rounded-2xl p-4 mb-5 flex items-center gap-3 border border-red-200 bg-red-50">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Impossible de charger les fichiers Drive</p>
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          </div>
          <button onClick={fetchFiles} className="ml-auto text-xs px-4 py-2 rounded-xl font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }}>Réessayer</button>
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 animate-pulse" style={{ border: '1px solid #e7e5e1' }}>
              <div className="w-full h-36 rounded-xl mb-2" style={{ background: '#f5f4f1' }} />
              <div className="h-3 rounded w-3/4 mb-1" style={{ background: '#f5f4f1' }} />
              <div className="h-3 rounded w-1/2" style={{ background: '#eeece7' }} />
            </div>
          ))}
        </div>
      )}

      {/* Grille */}
      {!loading && !error && view === 'grille' && (
        filtered.length === 0
          ? <div className="bg-white rounded-2xl py-16 text-center text-[#a89b8c]" style={{ border: '1px solid #e7e5e1' }}>
              <Image size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{search ? 'Aucun fichier trouvé' : 'Aucun fichier dans ce dossier Drive'}</p>
            </div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(f => <FileCard key={f.id} file={f} />)}
            </div>
      )}

      {/* Liste */}
      {!loading && !error && view === 'liste' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr style={{ background: '#f5f4f1' }}>
                  <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Nom</th>
                  <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Type</th>
                  <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Taille</th>
                  <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left text-xs font-bold text-[#a89b8c] uppercase tracking-wider px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeece7]">
                {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-[#a89b8c]">Aucun fichier</td></tr>}
                {filtered.map(f => <FileRow key={f.id} file={f} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
