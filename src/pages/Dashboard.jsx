import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp, Calendar,
  Users, FileText, Euro, ArrowRight, AlertCircle,
  Sparkles, ChevronLeft, ChevronRight, Video, Circle, ClipboardList, Bell, CheckCircle2, X,
} from 'lucide-react'
import useStore from '../store/useStore'
import { notify, requestNotificationPermission } from '../utils/notify'
import { statutBadge, assigneeBadge, prioriteBadge } from '../components/ui/Badge'

// ─── Mes Tâches ───────────────────────────────────────────────────────────────
function MesTaches({ taches, profil, moveTache, addNotification }) {
  const mesTaches = taches
    .filter(t => t.assignee === profil && t.statut !== 'termine')
    .sort((a, b) => {
      const prio = { urgente: 0, haute: 1, normale: 2, basse: 3 }
      return (prio[a.priorite] ?? 2) - (prio[b.priorite] ?? 2)
    })

  const terminees = taches.filter(t => t.assignee === profil && t.statut === 'termine')

  const handleDone = (t) => {
    moveTache(t.id, 'termine')
    if (profil === 'Chainez') {
      addNotification({
        type: 'tache',
        titre: 'Tâche terminée par Chainez',
        message: `"${t.titre}" a été marquée comme terminée.`,
        lien: '/taches',
      })
    }
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: profil === 'Chainez' ? 'linear-gradient(135deg,#ec4899,#db2777)' : 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
            <CheckSquare size={12} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-800">Mes tâches</span>
          {mesTaches.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: profil === 'Chainez' ? '#ec4899' : '#6366f1' }}>
              {mesTaches.length}
            </span>
          )}
        </div>
        <span className="text-[11px] text-gray-400">{terminees.length} terminée{terminees.length > 1 ? 's' : ''}</span>
      </div>

      <div className="divide-y divide-gray-50">
        {mesTaches.length === 0 && (
          <div className="flex flex-col items-center py-6 gap-2">
            <CheckCircle2 size={24} className="text-emerald-300" />
            <p className="text-xs text-gray-400">Toutes les tâches sont terminées 🎉</p>
          </div>
        )}
        {mesTaches.map(t => (
          <div key={t.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
            <button
              onClick={() => handleDone(t)}
              className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
              style={{ borderColor: t.priorite === 'urgente' ? '#ef4444' : t.priorite === 'haute' ? '#f59e0b' : '#d1d5db' }}
              title="Marquer comme terminée"
            >
              <div className="w-2 h-2 rounded-full opacity-0 group-hover:opacity-40 transition-opacity"
                style={{ background: t.priorite === 'urgente' ? '#ef4444' : '#6366f1' }} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{t.titre}</p>
              {t.deadline && (
                <p className={`text-[10px] mt-0.5 ${t.deadline < new Date().toISOString().split('T')[0] ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                  {t.deadline < new Date().toISOString().split('T')[0] ? '⚠ En retard · ' : ''}
                  {new Date(t.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              )}
            </div>
            {t.priorite === 'urgente' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 flex-shrink-0">URGENT</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Mini Calendar ───────────────────────────────────────────────────────────
function MiniCalendar({ rdvs, clients }) {
  const [current, setCurrent] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  const year = current.getFullYear()
  const month = current.getMonth()
  const today = new Date()

  const firstDay = new Date(year, month, 1).getDay()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const pad = n => String(n).padStart(2, '0')
  const dateStr = day => `${year}-${pad(month + 1)}-${pad(day)}`

  const rdvsByDay = {}
  rdvs.forEach(r => {
    if (!r.date) return
    const d = new Date(r.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!rdvsByDay[day]) rdvsByDay[day] = []
      rdvsByDay[day].push(r)
    }
  })

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const monthName = current.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const prevMonth = () => { setCurrent(new Date(year, month - 1, 1)); setSelectedDay(null) }
  const nextMonth = () => { setCurrent(new Date(year, month + 1, 1)); setSelectedDay(null) }
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  const selectedRdvs = selectedDay ? (rdvsByDay[selectedDay] || []) : []
  const selectedDateLabel = selectedDay
    ? new Date(dateStr(selectedDay)).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''

  return (
    <div className="relative">
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
          const isSelected = selectedDay === day
          const hasRDV = !!rdvsByDay[day]
          const count = rdvsByDay[day]?.length || 0
          return (
            <div key={day} className="flex flex-col items-center py-0.5">
              <button
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`w-7 h-7 flex items-center justify-center rounded-xl text-xs font-medium transition-all
                  ${isToday ? 'text-white font-bold' : isSelected ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}
                `}
                style={isToday ? { background: 'linear-gradient(135deg,#6366f1,#4f46e5)' } : {}}>
                {day}
              </button>
              {hasRDV && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, k) => (
                    <div key={k} className="w-1 h-1 rounded-full bg-indigo-400" />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Popup événements du jour */}
      {selectedDay && (
        <div className="absolute left-0 right-0 top-full mt-3 z-20 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.13)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg,#f8f9ff,#eef2ff)' }}>
            <p className="text-xs font-bold text-gray-800 capitalize">{selectedDateLabel}</p>
            <button onClick={() => setSelectedDay(null)} className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X size={12} className="text-gray-500" />
            </button>
          </div>
          {selectedRdvs.length === 0 ? (
            <div className="px-4 py-5 text-center">
              <p className="text-xs text-gray-400">Aucun événement ce jour</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {selectedRdvs.sort((a, b) => (a.heure || '').localeCompare(b.heure || '')).map(r => {
                const client = clients?.find(c => c.id === r.clientId)
                return (
                  <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-indigo-600"
                      style={{ background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)' }}>
                      {r.heure ? r.heure.slice(0, 5) : '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.sujet || 'Rendez-vous'}</p>
                      {client && <p className="text-xs text-gray-400 mt-0.5">{client.nom}</p>}
                      {r.objectif && <p className="text-xs text-gray-400 truncate">{r.objectif}</p>}
                    </div>
                    {r.lienMeet && (
                      <a href={r.lienMeet} target="_blank" rel="noreferrer"
                        className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 hover:bg-indigo-100 transition-colors flex-shrink-0">
                        <Video size={12} />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
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
  const { taches, clients, projets, rdvs, documents, leads, formReponses, contenus, moveTache, addNotification } = useStore()
  const profil = localStorage.getItem('sc-crm-profil') || 'Sheryn'

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

  const nowStr = new Date().toISOString()
  const upcomingRDVs = rdvs.filter(r => {
    if (!r.date) return false
    if (r.date > today) return true
    if (r.date < today) return false
    if (!r.heure) return true
    return `${r.date}T${r.heure}` > nowStr.slice(0, 16)
  }).sort((a, b) => a.date.localeCompare(b.date) || (a.heure || '').localeCompare(b.heure || '')).slice(0, 5)
  const recentTaches = [...taches].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6)
  const endOfWeek = (() => { const d = new Date(); d.setDate(d.getDate() + (7 - d.getDay())); return d.toISOString().split('T')[0] })()
  const postsSemaine = [...(contenus || [])].filter(c => c.datePublication && c.datePublication >= today && c.datePublication <= endOfWeek && c.statut !== 'publie' && c.statut !== 'archive').sort((a, b) => a.datePublication.localeCompare(b.datePublication))

  const newFormReponses = formReponses.filter(r => !r.lu)
  const newFormCount = newFormReponses.length

  const getClient = (id) => clients.find(c => c.id === id)

  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  async function handleActiverNotifs() {
    const granted = await requestNotificationPermission()
    setNotifPermission(granted ? 'granted' : 'denied')
    if (granted) notify('🔔 Notifications activées !', 'Vous recevrez des alertes pour vos RDV, formulaires et tâches urgentes.')
  }

  // Rappel RDV — vérifie toutes les minutes si un RDV commence dans 30 min
  const notifiedRdvs = useRef(new Set())
  useEffect(() => {
    function checkRdvs() {
      const now = new Date()
      rdvs.forEach(r => {
        if (!r.date || !r.heure) return
        if (notifiedRdvs.current.has(r.id)) return
        const rdvTime = new Date(`${r.date}T${r.heure}`)
        const diffMin = (rdvTime - now) / 60000
        if (diffMin > 0 && diffMin <= 30) {
          const client = getClient(r.clientId)
          notify(
            `📅 RDV dans ${Math.round(diffMin)} min`,
            `${r.sujet || 'Rendez-vous'}${client ? ` · ${client.nom}` : ''} à ${r.heure}`
          )
          notifiedRdvs.current.add(r.id)
        }
      })
    }
    checkRdvs()
    const interval = setInterval(checkRdvs, 60000)
    return () => clearInterval(interval)
  }, [rdvs])

  const statCards = [
    { label: 'Tâches terminées', value: tachesTerminees, total: tachesTotal, color: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: CheckSquare, to: '/taches' },
    { label: 'Projets actifs', value: projetsActifs, total: projetsTotal, color: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-700', icon: TrendingUp, to: '/projets' },
    { label: 'Tâches urgentes', value: tachesUrgentes, total: tachesTotal, color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', icon: AlertTriangle, to: '/taches' },
    { label: 'CA objectif', value: caTotal, total: caCible, color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Euro, to: '/finances', money: true },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* ── Left / Main column ── */}
      <div className="w-full lg:w-[55%] min-w-0">

        {/* Welcome banner */}
        <div className="relative rounded-2xl lg:rounded-3xl mb-4 lg:mb-6 overflow-hidden" style={{
          background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 55%, #818cf8 100%)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.32)',
        }}>
          <div className="absolute right-0 top-0 w-72 h-72 rounded-full opacity-[0.07]" style={{ background: 'white', transform: 'translate(25%,-35%)' }} />
          <div className="absolute right-24 bottom-0 w-44 h-44 rounded-full opacity-[0.07]" style={{ background: 'white', transform: 'translateY(55%)' }} />
          <div className="absolute right-10 top-6 w-28 h-28 rounded-full opacity-[0.07]" style={{ background: 'white' }} />

          <div className="relative px-5 py-5 sm:px-8 sm:py-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-indigo-300" />
                <span className="text-indigo-200 text-xs font-semibold tracking-wide uppercase">SC Création · CRM 360</span>
              </div>
              <h1 className="text-xl sm:text-[1.6rem] font-bold text-white leading-tight mb-1">{greeting}, {localStorage.getItem('sc-crm-profil') || 'Sheryn'} ! 👋</h1>
              <p className="text-indigo-200 text-sm">
                {tachesUrgentes > 0
                  ? `Vous avez ${tachesUrgentes} tâche${tachesUrgentes > 1 ? 's' : ''} urgente${tachesUrgentes > 1 ? 's' : ''} en attente.`
                  : upcomingRDVs.length > 0
                  ? `Prochain RDV : ${upcomingRDVs[0].sujet || 'Rendez-vous'} · ${new Date(upcomingRDVs[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                  : 'Tout est sous contrôle. Bonne journée !'}
              </p>
              <div className="flex gap-2 mt-4 flex-wrap">
                <button onClick={() => navigate('/taches')} className="text-xs font-semibold px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors">
                  Mes tâches
                </button>
                <button onClick={() => navigate('/clients')} className="text-xs font-semibold px-4 py-2 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
                  Mes clients
                </button>
              </div>
            </div>
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

        {/* Bannière activation notifications */}
        {notifPermission === 'default' && (
          <div className="mb-4 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', border: '1px solid #c7d2fe' }}>
            <div className="flex items-center gap-3 px-5 py-3">
              <span className="text-2xl">🔔</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-indigo-900">Activer les notifications</p>
                <p className="text-xs text-indigo-600 mt-0.5">Soyez alertées en temps réel des nouveaux formulaires, RDV à venir et tâches urgentes.</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={handleActiverNotifs}
                  className="text-xs font-bold px-4 py-2 rounded-xl text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                  Activer
                </button>
                <button onClick={() => setNotifPermission('denied')}
                  className="text-xs font-medium px-3 py-2 rounded-xl bg-white/60 text-indigo-400 hover:bg-white transition-colors">
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alerte nouvelles demandes formulaire */}
        {newFormCount > 0 && (
          <div className="mb-6 rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => navigate('/formulaires')}
            style={{ boxShadow: '0 4px 20px rgba(245,158,11,0.25)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4"
              style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderLeft: '4px solid #f59e0b' }}>
              <div className="flex items-start gap-3 sm:contents">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.4)' }}>
                  <Bell size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-900">
                    {newFormCount === 1 ? '1 nouvelle demande de projet reçue !' : `${newFormCount} nouvelles demandes de projet reçues !`}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {newFormReponses.map(r => r.nomEntreprise).join(', ')} · Ne faites pas attendre votre client !
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white group-hover:opacity-90 transition-opacity sm:whitespace-nowrap sm:flex-shrink-0 self-stretch sm:self-auto justify-center"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                <ClipboardList size={13} />Voir les demandes<ArrowRight size={12} />
              </div>
            </div>
          </div>
        )}

        {/* Stat cards — ligne compacte */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 lg:mb-6">
          {statCards.map(({ label, value, total, color, bg, text, icon: Icon, to, money }) => (
            <button key={label} onClick={() => navigate(to)}
              className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 hover:shadow-md transition-all duration-200 text-left group"
              style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={15} className={text} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-gray-900 leading-none">
                  {money ? `${(value / 1000).toFixed(1)}k` : value}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium truncate">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Tâches récentes */}
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
          {/* Mobile : liste cards */}
          <div className="sm:hidden divide-y divide-gray-50">
            {recentTaches.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Aucune tâche</p>}
            {recentTaches.map(t => {
              const client = getClient(t.clientId)
              return (
                <div key={t.id} onClick={() => navigate('/taches')} className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.statut === 'termine' ? 'bg-emerald-400' : t.priorite === 'urgente' ? 'bg-red-400' : t.statut === 'en_cours' ? 'bg-indigo-400' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{t.titre}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{client?.nom || '—'} · {t.assignee}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {prioriteBadge(t.priorite)}
                    {statutBadge(t.statut)}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Desktop : table */}
          <div className="hidden sm:block overflow-x-auto"><table className="w-full min-w-[500px]">
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
                return (
                  <tr key={t.id} className="table-row cursor-pointer" onClick={() => navigate('/taches')}>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.statut === 'termine' ? 'bg-emerald-400' : t.statut === 'urgent' ? 'bg-red-400' : t.statut === 'en_cours' ? 'bg-indigo-400' : 'bg-gray-300'}`} />
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
          </table></div>
        </div>

        <div className="mt-4 lg:mt-6">
          <MesTaches taches={taches} profil={profil} moveTache={moveTache} addNotification={addNotification} />
        </div>

      </div>

      {/* ── Right column ── */}
      <div className="w-full lg:flex-1 min-w-0 space-y-4 lg:space-y-5">

        {/* RDV + Posts côte à côte sur tablette, empilés sur mobile et desktop droit */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5">

        {/* Prochains RDV — mis en avant sur mobile */}
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

        </div>{/* fin grid md:2cols */}

        {/* Calendrier */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <MiniCalendar rdvs={rdvs} clients={clients} />
        </div>

        {/* Posts de la semaine */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#ec4899,#a855f7)' }}>
                <FileText size={12} className="text-white" />
              </div>
              <span className="text-sm font-bold text-gray-800">Posts cette semaine</span>
              {postsSemaine.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600">{postsSemaine.length}</span>
              )}
            </div>
            <button onClick={() => navigate('/calendrier-editorial')} className="text-xs text-indigo-500 font-semibold flex items-center gap-1 hover:text-indigo-700">
              Voir tout <ArrowRight size={11} />
            </button>
          </div>
          {postsSemaine.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucun post prévu cette semaine</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {postsSemaine.map(c => {
                const isIG = c.plateforme === 'Instagram'
                return (
                  <div key={c.id} onClick={() => navigate('/calendrier-editorial')}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
                      style={{ background: isIG ? 'linear-gradient(135deg,#ec4899,#f97316)' : 'linear-gradient(135deg,#111,#333)' }}>
                      {isIG ? 'IG' : 'TK'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{c.titre}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(c.datePublication).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {c.heurePublication && ` · ${c.heurePublication}`}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      c.statut === 'planifie' ? 'bg-purple-100 text-purple-700' :
                      c.statut === 'en_cours' ? 'bg-indigo-100 text-indigo-700' :
                      c.statut === 'a_faire' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{c.statut.replace('_', ' ')}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
