import { useState, useMemo, useRef } from 'react'
import { Plus, Edit, Trash2, Calendar, List, Columns, ChevronLeft, ChevronRight, Eye, Instagram } from 'lucide-react'
import useStore from '../store/useStore'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const STATUTS = ['idee', 'a_faire', 'en_cours', 'planifie', 'publie', 'archive']
const STATUTS_KANBAN = [
  { id: 'idee', label: 'Idées', color: '#a89b8c' },
  { id: 'a_faire', label: 'À faire', color: '#3b82f6' },
  { id: 'en_cours', label: 'En cours', color: '#241512' },
  { id: 'planifie', label: 'Planifié', color: '#a1402d' },
  { id: 'publie', label: 'Publié', color: '#10b981' },
  { id: 'archive', label: 'Archivé', color: '#d5cfc4' },
]
const PLATEFORMES = ['TikTok', 'Instagram']
const TYPES = ['Reel', 'Carrousel', 'Story', 'Post', 'Article', 'Vidéo', 'Newsletter', 'Infographie', 'Podcast']
const PRIORITES = ['basse', 'normale', 'haute', 'urgente']
const THEMES_DEFAULT = ['Éducatif', 'Témoignage', 'Coulisses', 'Conseil']

function loadThemes() {
  try { return JSON.parse(localStorage.getItem('sc_themes') || 'null') || THEMES_DEFAULT } catch { return THEMES_DEFAULT }
}
function saveThemes(list) {
  localStorage.setItem('sc_themes', JSON.stringify(list))
}

const empty = {
  titre: '', plateforme: 'TikTok', type: 'Post', statut: 'idee',
  datePublication: '', heurePublication: '',
  hook: '', script: '', description: '', hashtags: '', cta: '',
  priorite: 'normale', theme: 'Éducatif', visuel: '', notes: '', client: '',
}

const PLAT_COLORS = {
  TikTok: 'bg-[#f5f4f1] text-[#241512]',
  Instagram: 'bg-pink-100 text-pink-700',
}
const STATUT_COLORS = {
  idee: 'bg-[#f5f4f1] text-[#a89b8c]',
  a_faire: 'bg-blue-100 text-blue-700',
  en_cours: 'bg-[#f5f4f1] text-[#241512]',
  planifie: 'bg-[#f5e6e3] text-[#a1402d]',
  publie: 'bg-emerald-100 text-emerald-700',
  archive: 'bg-[#f5f4f1] text-[#a89b8c]',
}
const PRIORITE_COLORS = {
  basse: 'bg-[#f5f4f1] text-[#a89b8c]',
  normale: 'bg-blue-100 text-blue-600',
  haute: 'bg-orange-100 text-orange-600',
  urgente: 'bg-red-100 text-red-600',
}

// Filtre "format" affiché sur la vue calendrier (par plateforme uniquement)
const FORMATS = ['TikTok', 'Instagram']
function matchesFormat(c, f) {
  if (f === 'tous') return true
  return c.plateforme === f
}

// Logo TikTok (absent de lucide-react) en SVG inline
function TikTokIcon({ size = 12, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-3.05-3.05h-3.1v13.4a2.6 2.6 0 1 1-1.83-2.48V10.6a5.7 5.7 0 1 0 4.93 5.65V9.3a7.2 7.2 0 0 0 4.15 1.3V7.5a4.26 4.26 0 0 1-1.1-1.68z" />
    </svg>
  )
}

function PlatformIcon({ plateforme, size = 12, color }) {
  if (plateforme === 'TikTok') return <TikTokIcon size={size} color={color} />
  if (plateforme === 'Instagram') return <Instagram size={size} color={color} />
  return null
}

// Palette des pastilles d'événement du calendrier, attribuée par thème
const THEME_PALETTE = [
  { bg: '#fbe3cf', text: '#a1622a' },
  { bg: '#d7eef0', text: '#2f7a80' },
  { bg: '#f7dbe6', text: '#a1467a' },
  { bg: '#e6def7', text: '#5b4a9e' },
  { bg: '#e2efd6', text: '#4a7a2f' },
]
function themeColor(theme, themes) {
  if (!theme) return { bg: '#f5f4f1', text: '#241512' }
  const i = themes.indexOf(theme)
  return THEME_PALETTE[(i < 0 ? 0 : i) % THEME_PALETTE.length]
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1)
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
const inputStyle = { background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }
const btnPrimary = { background: '#241512', color: '#FDFCF8' }
const btnSecondary = { background: '#f5f4f1', color: '#241512' }

function ContentForm({ form, setForm, onSubmit, onCancel, label, themes, onAddTheme }) {
  const [newTheme, setNewTheme] = useState('')
  const inputRef = useRef(null)

  function handleAddTheme() {
    const val = newTheme.trim()
    if (!val || themes.includes(val)) return
    onAddTheme(val)
    setForm(f => ({ ...f, theme: val }))
    setNewTheme('')
  }

  return (
    <form onSubmit={onSubmit}>
      <FormField label="Titre *">
        <input className={`${inputCls} mb-4`} style={inputStyle} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required placeholder="Titre du contenu..." />
      </FormField>
      <FormRow cols={3}>
        <FormField label="Plateforme">
          <select className={inputCls} style={inputStyle} value={form.plateforme} onChange={e => setForm({ ...form, plateforme: e.target.value })}>
            {PLATEFORMES.map(p => <option key={p}>{p}</option>)}
          </select>
        </FormField>
        <FormField label="Type">
          <select className={inputCls} style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </FormField>
        <FormField label="Thème">
          <select className={`${inputCls} mb-1.5`} style={inputStyle} value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })}>
            {themes.map(t => <option key={t}>{t}</option>)}
          </select>
          <div className="flex gap-1">
            <input
              ref={inputRef}
              className={`${inputCls} text-xs py-1 flex-1`}
              style={inputStyle}
              placeholder="Nouveau thème..."
              value={newTheme}
              onChange={e => setNewTheme(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTheme() } }}
            />
            <button type="button" onClick={handleAddTheme} className="text-xs px-2 py-1 rounded-lg font-semibold hover:bg-[#eeece7] transition-colors" style={btnSecondary}>+ Ajouter</button>
          </div>
        </FormField>
      </FormRow>
      <FormRow cols={3}>
        <FormField label="Date publication">
          <input type="date" className={inputCls} style={inputStyle} value={form.datePublication} onChange={e => setForm({ ...form, datePublication: e.target.value })} />
        </FormField>
        <FormField label="Heure">
          <input type="time" className={inputCls} style={inputStyle} value={form.heurePublication} onChange={e => setForm({ ...form, heurePublication: e.target.value })} />
        </FormField>
        <FormField label="Statut">
          <select className={inputCls} style={inputStyle} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
            {STATUTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </FormField>
      </FormRow>
      <FormRow cols={2}>
        <FormField label="Priorité">
          <select className={inputCls} style={inputStyle} value={form.priorite} onChange={e => setForm({ ...form, priorite: e.target.value })}>
            {PRIORITES.map(p => <option key={p}>{p}</option>)}
          </select>
        </FormField>
        <FormField label="Client associé">
          <input className={inputCls} style={inputStyle} value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} placeholder="Nom du client (optionnel)" />
        </FormField>
      </FormRow>
      <FormField label="Hook (accroche)">
        <input className={`${inputCls} mb-4`} style={inputStyle} value={form.hook} onChange={e => setForm({ ...form, hook: e.target.value })} placeholder="La phrase d'accroche qui capte l'attention..." />
      </FormField>
      <FormField label="Script / Contenu">
        <textarea className={`${inputCls} resize-none mb-4`} style={inputStyle} rows={4} value={form.script} onChange={e => setForm({ ...form, script: e.target.value })} placeholder="Rédige le script ou le texte du contenu..." />
      </FormField>
      <FormRow cols={2}>
        <FormField label="Hashtags">
          <input className={inputCls} style={inputStyle} value={form.hashtags} onChange={e => setForm({ ...form, hashtags: e.target.value })} placeholder="#webdesign #sccreation" />
        </FormField>
        <FormField label="CTA (appel à l'action)">
          <input className={inputCls} style={inputStyle} value={form.cta} onChange={e => setForm({ ...form, cta: e.target.value })} placeholder="Lien en bio, contacte-moi..." />
        </FormField>
      </FormRow>
      <FormField label="Visuels / Assets">
        <input className={`${inputCls} mb-4`} style={inputStyle} value={form.visuel} onChange={e => setForm({ ...form, visuel: e.target.value })} placeholder="Lien Drive, Canva, Notion..." />
      </FormField>
      <FormField label="Notes internes">
        <textarea className={`${inputCls} resize-none mb-4`} style={inputStyle} rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes pour toi uniquement..." />
      </FormField>
      <div className="flex justify-end gap-2 mt-5">
        <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={btnSecondary} onClick={onCancel}>Annuler</button>
        <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={btnPrimary}>{label}</button>
      </div>
    </form>
  )
}

function DetailModal({ c, onClose, onEdit, onDelete }) {
  return (
    <Modal isOpen={!!c} onClose={onClose} title="Détail du contenu" size="lg">
      {c && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold" style={{ color: '#241512' }}>{c.titre}</h2>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-[#f5f4f1]" style={{ color: '#a89b8c' }}><Edit size={15} /></button>
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500" style={{ color: '#a89b8c' }}><Trash2 size={15} /></button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${PLAT_COLORS[c.plateforme] || 'bg-[#f5f4f1] text-[#a89b8c]'}`}><PlatformIcon plateforme={c.plateforme} size={11} />{c.plateforme}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f5f4f1] text-[#241512]">{c.type}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUT_COLORS[c.statut] || 'bg-[#f5f4f1] text-[#a89b8c]'}`}>{c.statut.replace('_', ' ')}</span>
            {c.priorite && c.priorite !== 'normale' && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITE_COLORS[c.priorite]}`}>{c.priorite}</span>}
            {c.theme && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f5f4f1] text-[#a89b8c]">{c.theme}</span>}
          </div>
          {(c.datePublication || c.heurePublication) && (
            <div className="flex items-center gap-2 text-sm rounded-xl px-3 py-2" style={{ background: '#f5f4f1', color: '#241512' }}>
              <Calendar size={14} style={{ color: '#241512' }} />
              {c.datePublication && <span>{new Date(c.datePublication).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              {c.heurePublication && <span className="font-medium">à {c.heurePublication}</span>}
            </div>
          )}
          {c.client && <p className="text-sm" style={{ color: '#241512' }}><span className="font-semibold">Client :</span> {c.client}</p>}
          {c.hook && (
            <div className="rounded-xl p-3" style={{ background: '#f5f4f1' }}>
              <p className="text-xs font-bold mb-1" style={{ color: '#241512' }}>HOOK</p>
              <p className="text-sm italic" style={{ color: '#241512' }}>"{c.hook}"</p>
            </div>
          )}
          {c.script && (
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: '#a89b8c' }}>SCRIPT / CONTENU</p>
              <p className="text-sm whitespace-pre-wrap rounded-xl p-3" style={{ background: '#f5f4f1', color: '#241512' }}>{c.script}</p>
            </div>
          )}
          {c.hashtags && (
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: '#a89b8c' }}>HASHTAGS</p>
              <p className="text-sm" style={{ color: '#241512' }}>{c.hashtags}</p>
            </div>
          )}
          {c.cta && (
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: '#a89b8c' }}>CTA</p>
              <p className="text-sm" style={{ color: '#241512' }}>{c.cta}</p>
            </div>
          )}
          {c.visuel && (
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: '#a89b8c' }}>VISUELS</p>
              <a href={c.visuel} target="_blank" rel="noreferrer" className="text-sm hover:underline break-all" style={{ color: '#241512' }}>{c.visuel}</a>
            </div>
          )}
          {c.notes && (
            <div className="rounded-xl p-3 bg-amber-50">
              <p className="text-xs font-bold text-amber-600 mb-1">DESCRIPTION</p>
              <p className="text-sm text-gray-700">{c.notes}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export default function CalendrierEditorial() {
  const { contenus, addContenu, updateContenu, deleteContenu } = useStore()
  const [themes, setThemes] = useState(loadThemes)
  const [view, setView] = useState('calendrier')
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [form, setForm] = useState(empty)
  const [editForm, setEditForm] = useState(null)
  const [filterPlat, setFilterPlat] = useState('tous')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [filterFormat, setFilterFormat] = useState('tous')
  const [dragId, setDragId] = useState(null)
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  const filtered = contenus.filter(c => {
    if (filterPlat !== 'tous' && c.plateforme !== filterPlat) return false
    if (filterStatut !== 'tous' && c.statut !== filterStatut) return false
    return true
  })

  const detail = contenus.find(c => c.id === detailId)

  const stats = useMemo(() => {
    const total = contenus.length
    const publie = contenus.filter(c => c.statut === 'publie').length
    const planifie = contenus.filter(c => c.statut === 'planifie').length
    const enCours = contenus.filter(c => c.statut === 'en_cours').length
    const byPlat = PLATEFORMES.map(p => ({ p, count: contenus.filter(c => c.plateforme === p).length })).filter(x => x.count > 0)
    return { total, publie, planifie, enCours, byPlat }
  }, [contenus])

  const monthDays = getMonthDays(calYear, calMonth)

  function contenusByDay(day) {
    if (!day) return []
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return contenus.filter(c => c.datePublication === dateStr && matchesFormat(c, filterFormat))
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }
  function goToday() {
    setCalYear(today.getFullYear())
    setCalMonth(today.getMonth())
  }

  function handleSubmit(e) {
    e.preventDefault()
    addContenu(form)
    setModal(false)
    setForm(empty)
  }

  function openEdit(c) {
    setEditForm({ ...c })
    setEditId(c.id)
    setDetailId(null)
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    updateContenu(editId, editForm)
    setEditId(null)
  }

  function handleDelete(id) {
    if (confirm('Supprimer ce contenu ?')) {
      deleteContenu(id)
      setDetailId(null)
    }
  }

  function handleDrop(e, statutId) {
    e.preventDefault()
    if (dragId) updateContenu(dragId, { statut: statutId })
    setDragId(null)
  }

  const isToday = (day) => {
    return day && calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Calendrier éditorial</h1>
          <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>
            {view === 'calendrier' ? 'Communication SC Création' : `${contenus.length} contenu${contenus.length > 1 ? 's' : ''} · ${stats.publie} publié${stats.publie > 1 ? 's' : ''} · ${stats.planifie} planifié${stats.planifie > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
            {[['calendrier', Calendar, 'Calendrier'], ['liste', List, 'Liste'], ['kanban', Columns, 'Kanban']].map(([v, Icon, l]) => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={view === v ? { background: '#241512', color: '#FDFCF8' } : { background: '#ffffff', color: '#241512' }}>
                <Icon size={14} />{l}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={btnPrimary} onClick={() => setModal(true)}>
            <Plus size={16} /> Nouvelle publication
          </button>
        </div>
      </div>

      {/* Stats — masquées sur la vue calendrier pour ne pas surcharger */}
      {view !== 'calendrier' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Total', val: stats.total, color: '#241512', bg: '#f5f4f1' },
            { label: 'En cours', val: stats.enCours, color: '#241512', bg: '#f5f4f1' },
            { label: 'Planifiés', val: stats.planifie, color: '#a1402d', bg: '#f5e6e3' },
            { label: 'Publiés', val: stats.publie, color: '#059669', bg: '#ecfdf5' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl px-5 py-4" style={{ background: s.bg }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#a89b8c' }}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtres — vue calendrier : un seul rang "format" */}
      {view === 'calendrier' ? (
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {['tous', ...FORMATS].map(f => (
            <button key={f} onClick={() => setFilterFormat(f)}
              className="px-4 py-2 text-sm font-semibold rounded-full transition-all"
              style={filterFormat === f ? { background: '#241512', color: '#FDFCF8' } : { background: '#f5f4f1', color: '#241512' }}>
              {f === 'tous' ? 'Toutes' : f}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-2 mb-5 flex-wrap items-center">
          <div className="flex gap-1.5 flex-wrap">
            {['tous', ...PLATEFORMES].map(p => (
              <button key={p} onClick={() => setFilterPlat(p)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={filterPlat === p ? { background: '#241512', color: '#FDFCF8' } : { background: '#ffffff', border: '1px solid #e7e5e1', color: '#241512' }}>
                {p === 'tous' ? 'Toutes plateformes' : p}
              </button>
            ))}
          </div>
          <div className="w-px h-5" style={{ background: '#e7e5e1' }} />
          <div className="flex gap-1.5 flex-wrap">
            {['tous', ...STATUTS].map(s => (
              <button key={s} onClick={() => setFilterStatut(s)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={filterStatut === s ? { background: '#241512', color: '#FDFCF8' } : { background: '#ffffff', border: '1px solid #e7e5e1', color: '#241512' }}>
                {s === 'tous' ? 'Tous statuts' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── CALENDRIER ── */}
      {view === 'calendrier' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[#f5f4f1]" style={{ color: '#241512' }}><ChevronLeft size={20} /></button>
              <h2 className="font-display text-2xl font-bold" style={{ color: '#241512' }}>{MOIS_FR[calMonth]} {calYear}</h2>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[#f5f4f1]" style={{ color: '#241512' }}><ChevronRight size={20} /></button>
            </div>
            <button onClick={goToday}
              className="px-4 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-[#eeece7]"
              style={{ background: '#ffffff', border: '1px solid #e7e5e1', color: '#241512' }}>
              Aujourd'hui
            </button>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
            <div className="grid grid-cols-7" style={{ borderBottom: '1px solid #e7e5e1' }}>
              {JOURS.map(j => (
                <div key={j} className="py-3 text-center text-sm font-medium" style={{ color: '#241512' }}>{j}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 divide-x divide-y" style={{ borderColor: '#eeece7' }}>
              {monthDays.map((day, i) => {
                const items = contenusByDay(day)
                return (
                  <div key={i} className="min-h-[130px] p-2.5" style={{ background: !day ? '#faf9f6' : undefined }}>
                    {day && (
                      <>
                        <div className="w-7 h-7 flex items-center justify-center rounded-full text-sm mb-2"
                          style={isToday(day) ? { background: '#241512', color: '#FDFCF8', fontWeight: 700 } : { color: '#241512' }}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {items.slice(0, 3).map(c => {
                            const tc = themeColor(c.theme, themes)
                            return (
                              <button key={c.id} onClick={() => setDetailId(c.id)}
                                className="w-full flex items-center gap-1 text-left px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
                                style={{ background: tc.bg, color: tc.text }}>
                                <PlatformIcon plateforme={c.plateforme} size={11} color={tc.text} />
                                <span className="truncate text-xs font-medium">
                                  {c.heurePublication && <span className="font-semibold">{c.heurePublication} </span>}
                                  {c.titre}
                                </span>
                              </button>
                            )
                          })}
                          {items.length > 3 && (
                            <p className="text-[10px] text-center" style={{ color: '#a89b8c' }}>+{items.length - 3} autres</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── LISTE ── */}
      {view === 'liste' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr style={{ background: '#f5f4f1' }}>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Contenu</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Plateforme</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Type</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Thème</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Date & Heure</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Priorité</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: '#a89b8c' }}>Statut</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3 w-20" style={{ color: '#a89b8c' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10" style={{ color: '#a89b8c' }}>Aucun contenu</td></tr>}
              {filtered.sort((a, b) => (a.datePublication || '').localeCompare(b.datePublication || '')).map(c => (
                <tr key={c.id} className="cursor-pointer hover:bg-[#f5f4f1]/40" style={{ borderTop: '1px solid #eeece7' }} onClick={() => setDetailId(c.id)}>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <p className="font-medium" style={{ color: '#241512' }}>{c.titre}</p>
                    {c.hook && <p className="text-xs truncate max-w-xs italic" style={{ color: '#a89b8c' }}>"{c.hook}"</p>}
                    {c.client && <p className="text-[10px]" style={{ color: '#a89b8c' }}>{c.client}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${PLAT_COLORS[c.plateforme] || 'bg-[#f5f4f1] text-[#a89b8c]'}`}><PlatformIcon plateforme={c.plateforme} size={11} />{c.plateforme}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium" style={{ color: '#241512' }}>{c.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: '#a89b8c' }}>{c.theme || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#241512' }}>
                    {c.datePublication ? new Date(c.datePublication).toLocaleDateString('fr-FR') : '—'}
                    {c.heurePublication && <span className="text-xs ml-1" style={{ color: '#a89b8c' }}>{c.heurePublication}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.priorite && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITE_COLORS[c.priorite] || ''}`}>{c.priorite}</span>}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <select className="text-xs w-auto rounded-lg px-2 py-1" style={inputStyle} value={c.statut} onChange={e => updateContenu(c.id, { statut: e.target.value })}>
                      {STATUTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => setDetailId(c.id)} className="p-1 hover:text-[#241512]" style={{ color: '#a89b8c' }}><Eye size={13} /></button>
                      <button onClick={() => openEdit(c)} className="p-1 hover:text-[#241512]" style={{ color: '#a89b8c' }}><Edit size={13} /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1 hover:text-red-500" style={{ color: '#a89b8c' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ── KANBAN ── */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUTS_KANBAN.map(statut => {
            const col = filtered.filter(c => c.statut === statut.id)
            return (
              <div key={statut.id} className="rounded-2xl bg-white w-72 sm:w-64 flex-shrink-0" style={{ border: '1px solid #e7e5e1' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, statut.id)}>
                <div className="flex items-center justify-between px-3 py-3" style={{ borderBottom: '1px solid #e7e5e1' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: statut.color }} />
                    <span className="text-xs font-semibold" style={{ color: '#241512' }}>{statut.label}</span>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#f5f4f1', color: '#241512' }}>{col.length}</span>
                </div>
                <div className="p-2 space-y-2">
                  {col.map(c => (
                    <div key={c.id} draggable onDragStart={() => setDragId(c.id)}
                      className="group cursor-pointer rounded-xl p-3" style={{ background: '#f5f4f1' }} onClick={() => setDetailId(c.id)}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium leading-snug" style={{ color: '#241512' }}>{c.titre}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEdit(c)} className="p-0.5 hover:text-[#241512]" style={{ color: '#a89b8c' }}><Edit size={11} /></button>
                          <button onClick={() => handleDelete(c.id)} className="p-0.5 hover:text-red-500" style={{ color: '#a89b8c' }}><Trash2 size={11} /></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${PLAT_COLORS[c.plateforme] || 'bg-[#eeece7] text-[#241512]'}`}><PlatformIcon plateforme={c.plateforme} size={9} />{c.plateforme}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#eeece7]" style={{ color: '#241512' }}>{c.type}</span>
                        {c.priorite && c.priorite !== 'normale' && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITE_COLORS[c.priorite]}`}>{c.priorite}</span>
                        )}
                      </div>
                      {c.datePublication && (
                        <p className="text-xs" style={{ color: '#a89b8c' }}>
                          {new Date(c.datePublication).toLocaleDateString('fr-FR')}
                          {c.heurePublication && ` · ${c.heurePublication}`}
                        </p>
                      )}
                      {c.hook && <p className="text-xs mt-1 italic truncate" style={{ color: '#241512' }}>"{c.hook}"</p>}
                      {c.client && <p className="text-[10px] mt-1" style={{ color: '#a89b8c' }}>{c.client}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouveau contenu" size="lg">
        <ContentForm form={form} setForm={setForm} onSubmit={handleSubmit} onCancel={() => setModal(false)} label="Créer" themes={themes} onAddTheme={t => { const next = [...themes, t]; setThemes(next); saveThemes(next) }} />
      </Modal>

      {/* Edit Modal */}
      {editForm && (
        <Modal isOpen={!!editId} onClose={() => setEditId(null)} title="Modifier le contenu" size="lg">
          <ContentForm form={editForm} setForm={setEditForm} onSubmit={handleEditSubmit} onCancel={() => setEditId(null)} label="Enregistrer" themes={themes} onAddTheme={t => { const next = [...themes, t]; setThemes(next); saveThemes(next) }} />
        </Modal>
      )}

      {/* Detail Modal */}
      <DetailModal
        c={detail}
        onClose={() => setDetailId(null)}
        onEdit={() => openEdit(detail)}
        onDelete={() => handleDelete(detailId)}
      />
    </div>
  )
}
