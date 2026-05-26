import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, AlertTriangle, Calendar, FileText, TrendingUp, X } from 'lucide-react'
import useStore from '../../store/useStore'
import QuickCreate from '../ui/QuickCreate'

function NotifIcon({ type }) {
  const map = {
    urgent: <AlertTriangle size={13} className="text-red-500" />,
    rdv: <Calendar size={13} className="text-blue-500" />,
    facture: <FileText size={13} className="text-orange-500" />,
    lead: <TrendingUp size={13} className="text-green-500" />,
  }
  return map[type] || <Bell size={13} className="text-gray-500" />
}

export default function Topbar() {
  const navigate = useNavigate()
  const { notifications, clients, projets, taches, markNotifRead, markAllNotifRead, getUnreadCount } = useStore()
  const [searchQ, setSearchQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const searchRef = useRef(null)
  const unread = getUnreadCount()

  useEffect(() => {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const searchResults = searchQ.trim().length > 1 ? [
    ...clients.filter(c => c.nom.toLowerCase().includes(searchQ.toLowerCase())).map(c => ({ type: 'Client', label: c.nom, to: `/clients/${c.id}`, color: 'text-blue-600 bg-blue-50' })),
    ...projets.filter(p => p.nom.toLowerCase().includes(searchQ.toLowerCase())).map(p => ({ type: 'Projet', label: p.nom, to: '/projets', color: 'text-purple-600 bg-purple-50' })),
    ...taches.filter(t => t.titre.toLowerCase().includes(searchQ.toLowerCase())).map(t => ({ type: 'Tâche', label: t.titre, to: '/taches', color: 'text-indigo-600 bg-indigo-50' })),
  ].slice(0, 8) : []

  return (
    <>
      <header className="fixed top-0 left-60 right-0 h-14 bg-white/80 backdrop-blur-md flex items-center px-7 gap-4 z-20" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        {/* Search */}
        <button
          onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }}
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm text-gray-400 transition-colors"
          style={{ background: '#f4f5f7', minWidth: '220px' }}
        >
          <Search size={14} className="text-gray-400" />
          <span className="flex-1 text-left">Recherche globale...</span>
          <span className="text-xs bg-white text-gray-400 px-1.5 py-0.5 rounded-lg border border-gray-200">⌘K</span>
        </button>

        <div className="flex-1" />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                {unread > 0 && <button onClick={markAllNotifRead} className="text-xs text-indigo-600 hover:underline font-medium">Tout marquer lu</button>}
              </div>
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {notifications.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Aucune notification</p>}
                {notifications.map(n => (
                  <div key={n.id} onClick={() => { markNotifRead(n.id); navigate(n.lien); setNotifOpen(false) }}
                    className={`flex gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!n.lu ? 'bg-indigo-50/40' : ''}`}>
                    <div className="mt-0.5 w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <NotifIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.lu ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    {!n.lu && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Create */}
        <QuickCreate />
      </header>

      {/* Global Search */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl overflow-hidden" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <input ref={searchRef} value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Rechercher clients, projets, tâches..." className="flex-1 text-sm outline-none placeholder-gray-400" />
              {searchQ && <button onClick={() => setSearchQ('')}><X size={14} className="text-gray-400" /></button>}
            </div>
            {searchResults.length > 0 && (
              <div className="divide-y divide-gray-50">
                {searchResults.map((r, i) => (
                  <div key={i} onClick={() => { navigate(r.to); setSearchOpen(false); setSearchQ('') }}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 cursor-pointer">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${r.color}`}>{r.type}</span>
                    <span className="text-sm text-gray-800">{r.label}</span>
                  </div>
                ))}
              </div>
            )}
            {searchQ.trim().length > 1 && searchResults.length === 0 && (
              <div className="px-5 py-8 text-center"><p className="text-sm text-gray-400">Aucun résultat pour « {searchQ} »</p></div>
            )}
            {!searchQ && (
              <div className="px-5 py-4">
                <p className="text-xs text-gray-400 mb-3 font-medium">Accès rapide</p>
                <div className="grid grid-cols-3 gap-2">
                  {[['Clients', '/clients', 'bg-blue-50 text-blue-700'], ['Projets', '/projets', 'bg-purple-50 text-purple-700'], ['Tâches', '/taches', 'bg-indigo-50 text-indigo-700']].map(([l, to, cls]) => (
                    <button key={l} onClick={() => { navigate(to); setSearchOpen(false) }} className={`p-2.5 rounded-xl text-sm font-semibold ${cls} hover:opacity-80 transition-opacity`}>{l}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
