import { useState, useMemo, useRef } from 'react'
import { Plus, Edit, Trash2, Calendar, List, Columns, ChevronLeft, ChevronRight, Eye, BarChart2 } from 'lucide-react'
import useStore from '../store/useStore'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const STATUTS = ['idee', 'a_faire', 'en_cours', 'planifie', 'publie', 'archive']
const STATUTS_KANBAN = [
  { id: 'idee', label: 'Idées', color: 'bg-gray-400' },
  { id: 'a_faire', label: 'À faire', color: 'bg-blue-500' },
  { id: 'en_cours', label: 'En cours', color: 'bg-indigo-500' },
  { id: 'planifie', label: 'Planifié', color: 'bg-purple-500' },
  { id: 'publie', label: 'Publié', color: 'bg-emerald-500' },
  { id: 'archive', label: 'Archivé', color: 'bg-gray-300' },
]
const PLATEFORMES = ['TikTok', 'Instagram']
const TYPES = ['Reel', 'Carrousel', 'Story', 'Post', 'Article', 'Vidéo', 'Newsletter', 'Infographie', 'Podcast']
const PRIORITES = ['basse', 'normale', 'haute', 'urgente']
const THEMES_DEFAULT = ['Promotion', 'Éducatif', 'Divertissement', 'Témoignage', 'Coulisses', 'Conseil', 'Annonce', 'Saisonnier']

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
  TikTok: 'bg-gray-100 text-gray-700',
  Instagram: 'bg-pink-100 text-pink-700',
}
const PLAT_DOT = {
  TikTok: 'bg-gray-600',
  Instagram: 'bg-pink-500',
}
const STATUT_COLORS = {
  idee: 'bg-gray-100 text-gray-600',
  a_faire: 'bg-blue-100 text-blue-700',
  en_cours: 'bg-indigo-100 text-indigo-700',
  planifie: 'bg-purple-100 text-purple-700',
  publie: 'bg-emerald-100 text-emerald-700',
  archive: 'bg-gray-100 text-gray-400',
}
const PRIORITE_COLORS = {
  basse: 'bg-gray-100 text-gray-500',
  normale: 'bg-blue-100 text-blue-600',
  haute: 'bg-orange-100 text-orange-600',
  urgente: 'bg-red-100 text-red-600',
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

function ContentForm({ form, setForm, onSubmit, onCancel, label }) {
  return (
    <form onSubmit={onSubmit}>
      <FormField label="Titre *">
        <input className="input mb-4" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required placeholder="Titre du contenu..." />
      </FormField>
      <FormRow cols={3}>
        <FormField label="Plateforme">
          <select className="select" value={form.plateforme} onChange={e => setForm({ ...form, plateforme: e.target.value })}>
            {PLATEFORMES.map(p => <option key={p}>{p}</option>)}
          </select>
        </FormField>
        <FormField label="Type">
          <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </FormField>
        <FormField label="Thème">
          <select className="select" value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })}>
            {THEMES.map(t => <option key={t}>{t}</option>)}
          </select>
        </FormField>
      </FormRow>
      <FormRow cols={3}>
        <FormField label="Date publication">
          <input type="date" className="input" value={form.datePublication} onChange={e => setForm({ ...form, datePublication: e.target.value })} />
        </FormField>
        <FormField label="Heure">
          <input type="time" className="input" value={form.heurePublication} onChange={e => setForm({ ...form, heurePublication: e.target.value })} />
        </FormField>
        <FormField label="Statut">
          <select className="select" value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
            {STATUTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </FormField>
      </FormRow>
      <FormRow cols={2}>
        <FormField label="Priorité">
          <select className="select" value={form.priorite} onChange={e => setForm({ ...form, priorite: e.target.value })}>
            {PRIORITES.map(p => <option key={p}>{p}</option>)}
          </select>
        </FormField>
        <FormField label="Client associé">
          <input className="input" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} placeholder="Nom du client (optionnel)" />
        </FormField>
      </FormRow>
      <FormField label="Hook (accroche)">
        <input className="input mb-4" value={form.hook} onChange={e => setForm({ ...form, hook: e.target.value })} placeholder="La phrase d'accroche qui capte l'attention..." />
      </FormField>
      <FormField label="Script / Contenu">
        <textarea className="input resize-none mb-4" rows={4} value={form.script} onChange={e => setForm({ ...form, script: e.target.value })} placeholder="Rédige le script ou le texte du contenu..." />
      </FormField>
      <FormRow cols={2}>
        <FormField label="Hashtags">
          <input className="input" value={form.hashtags} onChange={e => setForm({ ...form, hashtags: e.target.value })} placeholder="#webdesign #sccreation" />
        </FormField>
        <FormField label="CTA (appel à l'action)">
          <input className="input" value={form.cta} onChange={e => setForm({ ...form, cta: e.target.value })} placeholder="Lien en bio, contacte-moi..." />
        </FormField>
      </FormRow>
      <FormField label="Visuels / Assets">
        <input className="input mb-4" value={form.visuel} onChange={e => setForm({ ...form, visuel: e.target.value })} placeholder="Lien Drive, Canva, Notion..." />
      </FormField>
      <FormField label="Notes internes">
        <textarea className="input resize-none mb-4" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes pour toi uniquement..." />
      </FormField>
      <div className="flex justify-end gap-2 mt-5">
        <button type="button" className="btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn-primary">{label}</button>
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
            <h2 className="text-lg font-bold text-gray-900">{c.titre}</h2>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"><Edit size={15} /></button>
              <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAT_COLORS[c.plateforme] || 'bg-gray-100 text-gray-600'}`}>{c.plateforme}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{c.type}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUT_COLORS[c.statut] || 'bg-gray-100 text-gray-500'}`}>{c.statut.replace('_', ' ')}</span>
            {c.priorite && c.priorite !== 'normale' && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITE_COLORS[c.priorite]}`}>{c.priorite}</span>}
            {c.theme && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{c.theme}</span>}
          </div>
          {(c.datePublication || c.heurePublication) && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
              <Calendar size={14} className="text-indigo-500" />
              {c.datePublication && <span>{new Date(c.datePublication).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              {c.heurePublication && <span className="font-medium">à {c.heurePublication}</span>}
            </div>
          )}
          {c.client && <p className="text-sm text-gray-600"><span className="font-semibold">Client :</span> {c.client}</p>}
          {c.hook && (
            <div className="bg-indigo-50 rounded-xl p-3">
              <p className="text-xs font-bold text-indigo-600 mb-1">HOOK</p>
              <p className="text-sm text-gray-800 italic">"{c.hook}"</p>
            </div>
          )}
          {c.script && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">SCRIPT / CONTENU</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-3">{c.script}</p>
            </div>
          )}
          {c.hashtags && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">HASHTAGS</p>
              <p className="text-sm text-indigo-600">{c.hashtags}</p>
            </div>
          )}
          {c.cta && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">CTA</p>
              <p className="text-sm text-gray-700">{c.cta}</p>
            </div>
          )}
          {c.visuel && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">VISUELS</p>
              <a href={c.visuel} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline break-all">{c.visuel}</a>
            </div>
          )}
          {c.notes && (
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-600 mb-1">NOTES INTERNES</p>
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
  const [view, setView] = useState('calendrier')
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [form, setForm] = useState(empty)
  const [editForm, setEditForm] = useState(null)
  const [filterPlat, setFilterPlat] = useState('tous')
  const [filterStatut, setFilterStatut] = useState('tous')
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
    return filtered.filter(c => c.datePublication === dateStr)
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendrier Éditorial</h1>
          <p className="text-sm text-gray-500 mt-1">{contenus.length} contenu{contenus.length > 1 ? 's' : ''} · {stats.publie} publié{stats.publie > 1 ? 's' : ''} · {stats.planifie} planifié{stats.planifie > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {[['calendrier', Calendar, 'Calendrier'], ['liste', List, 'Liste'], ['kanban', Columns, 'Kanban']].map(([v, Icon, l]) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${view === v ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                <Icon size={14} />{l}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Nouveau contenu
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total', val: stats.total, color: 'text-gray-800', bg: 'bg-gray-50' },
          { label: 'En cours', val: stats.enCours, color: 'text-indigo-700', bg: 'bg-indigo-50' },
          { label: 'Planifiés', val: stats.planifie, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Publiés', val: stats.publie, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-5 py-4`}>
            <p className="text-xs font-semibold text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <div className="flex gap-1.5 flex-wrap">
          {['tous', ...PLATEFORMES].map(p => (
            <button key={p} onClick={() => setFilterPlat(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterPlat === p ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p === 'tous' ? 'Toutes plateformes' : p}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex gap-1.5 flex-wrap">
          {['tous', ...STATUTS].map(s => (
            <button key={s} onClick={() => setFilterStatut(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filterStatut === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s === 'tous' ? 'Tous statuts' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── CALENDRIER ── */}
      {view === 'calendrier' && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={18} /></button>
            <h2 className="text-base font-bold text-gray-800">{MOIS_FR[calMonth]} {calYear}</h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 border-b border-gray-100">
            {JOURS.map(j => (
              <div key={j} className="py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{j}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {monthDays.map((day, i) => {
              const items = contenusByDay(day)
              return (
                <div key={i} className={`min-h-[100px] p-2 ${!day ? 'bg-gray-50/50' : 'hover:bg-gray-50/50'} ${isToday(day) ? 'bg-indigo-50/40' : ''}`}>
                  {day && (
                    <>
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1 ${isToday(day) ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {items.slice(0, 3).map(c => (
                          <button key={c.id} onClick={() => setDetailId(c.id)}
                            className="w-full text-left flex flex-col gap-0.5 px-1.5 py-1 rounded hover:opacity-80 transition-opacity"
                            style={{ background: c.statut === 'publie' ? '#d1fae5' : c.statut === 'planifie' ? '#ede9fe' : '#e0e7ff' }}>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${c.plateforme === 'TikTok' ? 'bg-gray-800 text-white' : 'bg-pink-500 text-white'}`}>
                                {c.plateforme}
                              </span>
                              {c.theme && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none bg-white/70 text-gray-600">
                                  {c.theme}
                                </span>
                              )}
                            </div>
                            <span className="truncate text-[10px] font-semibold text-gray-700">{c.titre}</span>
                          </button>
                        ))}
                        {items.length > 3 && (
                          <p className="text-[10px] text-gray-400 text-center">+{items.length - 3} autres</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LISTE ── */}
      {view === 'liste' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="table-header">Contenu</th>
                <th className="table-header">Plateforme</th>
                <th className="table-header">Type</th>
                <th className="table-header">Thème</th>
                <th className="table-header">Date & Heure</th>
                <th className="table-header">Priorité</th>
                <th className="table-header">Statut</th>
                <th className="table-header w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-400">Aucun contenu</td></tr>}
              {filtered.sort((a, b) => (a.datePublication || '').localeCompare(b.datePublication || '')).map(c => (
                <tr key={c.id} className="table-row cursor-pointer" onClick={() => setDetailId(c.id)}>
                  <td className="table-cell" onClick={e => e.stopPropagation()}>
                    <p className="font-medium text-gray-900">{c.titre}</p>
                    {c.hook && <p className="text-xs text-gray-400 truncate max-w-xs italic">"{c.hook}"</p>}
                    {c.client && <p className="text-[10px] text-gray-400">{c.client}</p>}
                  </td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAT_COLORS[c.plateforme] || 'bg-gray-100 text-gray-600'}`}>{c.plateforme}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-xs font-medium text-gray-600">{c.type}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-xs text-gray-500">{c.theme || '—'}</span>
                  </td>
                  <td className="table-cell text-sm text-gray-600">
                    {c.datePublication ? new Date(c.datePublication).toLocaleDateString('fr-FR') : '—'}
                    {c.heurePublication && <span className="text-xs text-gray-400 ml-1">{c.heurePublication}</span>}
                  </td>
                  <td className="table-cell">
                    {c.priorite && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITE_COLORS[c.priorite] || ''}`}>{c.priorite}</span>}
                  </td>
                  <td className="table-cell" onClick={e => e.stopPropagation()}>
                    <select className="select text-xs w-auto" value={c.statut} onChange={e => updateContenu(c.id, { statut: e.target.value })}>
                      {STATUTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="table-cell" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => setDetailId(c.id)} className="p-1 text-gray-400 hover:text-indigo-600"><Eye size={13} /></button>
                      <button onClick={() => openEdit(c)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit size={13} /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
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
              <div key={statut.id} className="kanban-col w-72 sm:w-64 flex-shrink-0"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, statut.id)}>
                <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statut.color}`} />
                    <span className="text-xs font-semibold text-gray-700">{statut.label}</span>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{col.length}</span>
                </div>
                <div className="p-2 space-y-2">
                  {col.map(c => (
                    <div key={c.id} draggable onDragStart={() => setDragId(c.id)}
                      className="kanban-card group cursor-pointer" onClick={() => setDetailId(c.id)}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-gray-800 leading-snug">{c.titre}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEdit(c)} className="p-0.5 text-gray-400 hover:text-indigo-600"><Edit size={11} /></button>
                          <button onClick={() => handleDelete(c.id)} className="p-0.5 text-gray-400 hover:text-red-500"><Trash2 size={11} /></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PLAT_COLORS[c.plateforme] || 'bg-gray-100 text-gray-600'}`}>{c.plateforme}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{c.type}</span>
                        {c.priorite && c.priorite !== 'normale' && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITE_COLORS[c.priorite]}`}>{c.priorite}</span>
                        )}
                      </div>
                      {c.datePublication && (
                        <p className="text-xs text-gray-400">
                          {new Date(c.datePublication).toLocaleDateString('fr-FR')}
                          {c.heurePublication && ` · ${c.heurePublication}`}
                        </p>
                      )}
                      {c.hook && <p className="text-xs text-gray-500 mt-1 italic truncate">"{c.hook}"</p>}
                      {c.client && <p className="text-[10px] text-gray-400 mt-1">{c.client}</p>}
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
        <ContentForm form={form} setForm={setForm} onSubmit={handleSubmit} onCancel={() => setModal(false)} label="Créer" />
      </Modal>

      {/* Edit Modal */}
      {editForm && (
        <Modal isOpen={!!editId} onClose={() => setEditId(null)} title="Modifier le contenu" size="lg">
          <ContentForm form={editForm} setForm={setEditForm} onSubmit={handleEditSubmit} onCancel={() => setEditId(null)} label="Enregistrer" />
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
