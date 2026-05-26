import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp, Calendar,
  Users, FileText, Euro, ArrowRight, AlertCircle,
  Sparkles, ChevronLeft, ChevronRight, Video, Circle, ClipboardList, Bell,
} from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge, assigneeBadge, prioriteBadge } from '../components/ui/Badge'

// ─── Mini Calendar ───────────────────────────────────────────────────────────
function MiniCalendar({ rdvs }) {
  const [current, setCurrent] = useState(new Date())

  const year = current.getFullYear()
  const month = current.getMonth()
  const today = new Date()

  const firstDay = new Date(year, month, 1).getDay()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const rdvDays = new Set(
    rdvs
      .filter(r => {
        const d = new Date(r.date)
        return d.getFullYear() === year && d.getMonth() === month
      })
      .map(r => new Date(r.date).getDate())
  )

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const monthName = current.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1))

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-gray-800 capitalize">{monthName}</p>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <button onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {days.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const hasRDV = rdvDays.has(day)
          return (
            <div key={day} className="flex flex-col items-center py-0.5">
              <div className={`w-7 h-7 flex items-center justify-center rounded-xl text-xs font-medium transition-colors cursor-default
                ${isToday ? 'text-white font-bold' : 'text-gray-600 hover:bg-gray-100'}
              `} style={isToday ? { background: 'linear-gradient(135deg,#6366f1,#4f46e5)' } : {}}>
                {day}
              </div>
              {hasRDV && (
                <div className="flex gap-0.5 mt-0.5">
                  <div className="w-1 h-1 rounded-full bg-indigo-400" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircleProgress({ value, max, color, size = 44 }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  const r = 16
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#f0f2f8" strokeWidth="3.5" />
      <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 20 20)" />
      <text x="20" y="24" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e293b">{pct}%</text>
    </svg>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { taches, clients, projets, rdvs, documents, contenus, leads, formReponses } = useStore()

  const today = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const tachesTotal = taches.length
  const tachesTerminees = taches.filter(t => t.statut === 'termine').length
  const tachesUrgentes = taches.filter(t => t.statut === 'urgent' || t.priorite === 'urgente').length
  const tachesRetard = taches.filter(t => t.deadline && t.deadline < today && t.statut !== 'termine').length
  const projetsActifs = projets.filter(p => p.statut === 'en_cours').length
  const projetsTotal = projets.length
  const caTotal = documents.filter(d => d.type === 'facture' && d.statut === 'paye').reduce((s, d) => s + (d.montantHT || 0), 0)
  const caCible = 10000

  const upcomingRDVs = rdvs.filter(r => r.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5)
  const recentTaches = [...taches].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6)
  const recentClients = [...clients].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5)
  const newFormReponses = formReponses.filter(r => !r.lu)
  const newFormCount = newFormReponses.length

  const getClient = (id) => clients.find(c => c.id === id)

  const statCards = [
    { label: 'Tâches terminées', value: tachesTerminees, total: tachesTotal, color: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: CheckSquare, to: '/taches' },
    { label: 'Projets actifs', value: projetsActifs, total: projetsTotal, color: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-700', icon: TrendingUp, to: '/projets' },
    { label: 'Tâches urgentes', value: tachesUrgentes, total: tachesTotal, color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', icon: AlertTriangle, to: '/taches' },
    { label: 'CA objectif', value: caTotal, total: caCible, color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Euro, to: '/finances', money: true },
  ]

  return (
    <div className="flex gap-6">
      {/* ── Left / Main column ── */}
      <div className="w-[55%] min-w-0">

        {/* Welcome banner */}
        <div className="relative rounded-3xl mb-6 overflow-hidden" style={{
          background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 55%, #818cf8 100%)',
          minHeight: '140px',
          boxShadow: '0 8px 32px rgba(99,102,241,0.32)',
        }}>
          <div className="absolute right-0 top-0 w-72 h-72 rounded-full opacity-[0.07]" style={{ background: 'white', transform: 'translate(25%,-35%)' }} />
          <div className="absolute right-24 bottom-0 w-44 h-44 rounded-full opacity-[0.07]" style={{ background: 'white', transform: 'translateY(55%)' }} />
          <div className="absolute right-10 top-6 w-28 h-28 rounded-full opacity-[0.07]" style={{ background: 'white' }} />

          <div className="relative px-8 py-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-indigo-300" />
                <span className="text-indigo-200 text-xs font-semibold tracking-wide uppercase">SC Création · CRM 360</span>
              </div>
              <h1 className="text-[1.6rem] font-bold text-white leading-tight mb-1">{greeting}, Sheryn ! 👋</h1>
              <p className="text-indigo-200 text-sm">
                {tachesUrgentes > 0
                  ? `Vous avez ${tachesUrgentes} tâche${tachesUrgentes > 1 ? 's' : ''} urgente${tachesUrgentes > 1 ? 's' : ''} en attente.`
                  : upcomingRDVs.length > 0
                  ? `Prochain RDV : ${upcomingRDVs[0].sujet || 'Rendez-vous'} · ${new Date(upcomingRDVs[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                  : 'Tout est sous contrôle. Bonne journée !'}
              </p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => navigate('/taches')} className="text-xs font-semibold px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors">
                  Mes tâches
                </button>
                <button onClick={() => navigate('/clients')} className="text-xs font-semibold px-4 py-2 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
                  Mes clients
                </button>
              </div>
            </div>
            {/* Quick numbers */}
            <div className="hidden xl:flex items-center gap-3">
              {[
                { l: 'Projets', v: projetsActifs },
                { l: 'Clients', v: clients.filter(c => c.statut === 'actif').length },
                { l: 'Leads', v: leads.length },
              ].map(({ l, v }) => (
                <div key={l} className="text-center px-5 py-3 rounded-2xl backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.14)' }}>
                  <p className="text-xl font-bold text-white">{v}</p>
                  <p className="text-[11px] text-indigo-200 font-medium">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerte nouvelles demandes formulaire */}
        {newFormCount > 0 && (
          <div className="mb-6 rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => navigate('/formulaires')}
            style={{ boxShadow: '0 4px 20px rgba(245,158,11,0.25)' }}>
            <div className="flex items-center gap-4 px-6 py-4"
              style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderLeft: '4px solid #f59e0b' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.4)' }}>
                <Bell size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-900">
                  {newFormCount === 1
                    ? '1 nouvelle demande de projet reçue !'
                    : `${newFormCount} nouvelles demandes de projet reçues !`}
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {newFormReponses.map(r => r.nomEntreprise).join(', ')} · Ne faites pas attendre votre client — répondez rapidement !
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white group-hover:opacity-90 transition-opacity whitespace-nowrap flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                <ClipboardList size={13} />
                Voir les demandes
                <ArrowRight size={12} />
              </div>
            </div>
          </div>
        )}

        {/* Stat cards 2×2 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {statCards.map(({ label, value, total, color, bg, text, icon: Icon, to, money }) => (
            <button key={label} onClick={() => navigate(to)}
              className="bg-white rounded-2xl p-5 flex items-center justify-between hover:shadow-lg transition-all duration-200 text-left group"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div>
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={18} className={text} />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {money ? `${(value / 1000).toFixed(1)}k €` : value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
                <p className="text-[10px] text-gray-400 mt-1">sur {money ? `${(total / 1000).toFixed(0)}k € objectif` : `${total} au total`}</p>
              </div>
              <CircleProgress value={value} max={total} color={color} size={52} />
            </button>
          ))}
        </div>

        {/* Tâches récentes — style table */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <CheckSquare size={13} className="text-white" />
              </div>
              <span className="text-sm font-bold text-gray-800">Suivi des tâches</span>
            </div>
            <button onClick={() => navigate('/taches')} className="text-xs text-indigo-500 font-semibold flex items-center gap-1 hover:text-indigo-700">
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Tâche</th>
                <th className="table-header">Client</th>
                <th className="table-header">Assignée</th>
                <th className="table-header">Priorité</th>
                <th className="table-header">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentTaches.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Aucune tâche</td></tr>
              )}
              {recentTaches.map(t => {
                const client = getClient(t.clientId)
                const isLate = t.deadline && t.deadline < today && t.statut !== 'termine'
                return (
                  <tr key={t.id} className="table-row cursor-pointer" onClick={() => navigate('/taches')}>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          t.statut === 'termine' ? 'bg-emerald-400' :
                          t.statut === 'urgent' ? 'bg-red-400' :
                          t.statut === 'en_cours' ? 'bg-indigo-400' : 'bg-gray-300'
                        }`} />
                        <span className="font-medium text-gray-800 truncate max-w-[180px]">{t.titre}</span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">{client?.nom || '—'}</td>
                    <td className="table-cell">{assigneeBadge(t.assignee)}</td>
                    <td className="table-cell">{prioriteBadge(t.priorite)}</td>
                    <td className="table-cell">{statutBadge(t.statut)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── Right column ── */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Calendar */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <MiniCalendar rdvs={rdvs} />
        </div>

        {/* Prochains RDV */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar size={12} className="text-white" />
              </div>
              <span className="text-sm font-bold text-gray-800">Prochains RDV</span>
            </div>
            <button onClick={() => navigate('/rdv')} className="text-xs text-indigo-500 font-semibold flex items-center gap-1 hover:text-indigo-700">
              Voir tout <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingRDVs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Aucun RDV à venir</p>
            )}
            {upcomingRDVs.map(r => {
              const client = getClient(r.clientId)
              const isToday = r.date === today
              return (
                <div key={r.id} onClick={() => navigate('/rdv')}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                    style={isToday ? { background: 'linear-gradient(135deg,#6366f1,#4f46e5)' } : { background: '#f0f2f8' }}>
                    <span className={`text-xs font-bold leading-none ${isToday ? 'text-white' : 'text-gray-700'}`}>
                      {r.date ? new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit' }) : '?'}
                    </span>
                    <span className={`text-[8px] uppercase font-semibold leading-none mt-0.5 ${isToday ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {r.date ? new Date(r.date).toLocaleDateString('fr-FR', { month: 'short' }) : ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{r.sujet || 'Rendez-vous'}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{client?.nom} · {r.heure}</p>
                  </div>
                  {r.lienMeet && (
                    <a href={r.lienMeet} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                      className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-colors flex-shrink-0">
                      <Video size={12} className="text-indigo-600" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Clients récents */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Users size={12} className="text-white" />
              </div>
              <span className="text-sm font-bold text-gray-800">Clients récents</span>
            </div>
            <button onClick={() => navigate('/clients')} className="text-xs text-indigo-500 font-semibold flex items-center gap-1 hover:text-indigo-700">
              Voir tout <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentClients.map(c => (
              <div key={c.id} onClick={() => navigate(`/clients/${c.id}`)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs"
                  style={{ background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', color: '#4f46e5' }}>
                  {c.nom[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{c.nom}</p>
                  <p className="text-[11px] text-gray-400 truncate">{c.secteur || c.typeProjet || 'Client'}</p>
                </div>
                {statutBadge(c.statut)}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
