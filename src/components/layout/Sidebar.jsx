import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, FolderOpen, CheckSquare, Calendar,
  FileText, CreditCard, Wallet, Settings, Hexagon, ClipboardList,
  CalendarDays, Lock, X, LogOut, Image,
} from 'lucide-react'
import useStore from '../../store/useStore'
import { logout } from './LoginGate'

const navCategories = [
  {
    label: 'Général',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
    ],
  },
  {
    label: 'Clients',
    items: [
      { label: 'Clients', icon: Users, to: '/clients' },
      { label: 'Projets', icon: FolderOpen, to: '/projets' },
      { label: 'Formulaires', icon: ClipboardList, to: '/formulaires' },
      { label: 'RDV', icon: Calendar, to: '/rdv' },
      { label: 'Documents', icon: FileText, to: '/documents' },
    ],
  },
  {
    label: 'Organisation',
    items: [
      { label: 'Tâches', icon: CheckSquare, to: '/taches' },
      { label: 'Calendrier Éditorial', icon: CalendarDays, to: '/calendrier-editorial' },
      { label: 'Médiathèque', icon: Image, to: '/mediatheque' },
    ],
  },
  {
    label: 'Finances',
    items: [
      { label: 'Finances', icon: CreditCard, to: '/finances' },
      { label: 'Dépenses', icon: Wallet, to: '/depenses' },
    ],
  },
  {
    label: 'Paramètres',
    items: [
      { label: 'Mots de passe', icon: Lock, to: '/mots-de-passe' },
      { label: 'Paramètres', icon: Settings, to: '/parametres' },
    ],
  },
]

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { taches, formReponses } = useStore()
  const urgentCount = taches.filter(t => t.statut === 'urgent' || t.priorite === 'urgente').length
  const newFormCount = formReponses.filter(r => !r.lu).length

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen w-60 flex flex-col z-30
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
      style={{ background: '#1b0b09' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(253,251,244,.08)' }}>
        <div className="flex items-center gap-3 pb-5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fdfbf4' }}>
            <span className="font-label text-[11px] tracking-wide" style={{ color: '#1b0b09' }}>SC</span>
          </div>
          <div className="flex-1">
            <p className="font-label text-[12px] tracking-wide leading-tight" style={{ color: '#fdfbf4' }}>SC CRÉATION</p>
            <p className="text-[10px] font-display italic" style={{ color: '#b8a508' }}>agence créative</p>
          </div>
          {/* Bouton fermer — mobile uniquement */}
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'rgba(253,251,244,.5)' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-5">
          {navCategories.map(({ label: catLabel, items }) => (
            <div key={catLabel}>
              <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5" style={{ color: 'rgba(253,251,244,.32)' }}>{catLabel}</p>
              <div className="space-y-0.5">
                {items.map(({ label, icon: Icon, to }) => {
                  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
                  return (
                    <NavLink key={to} to={to} onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer"
                      style={isActive
                        ? { background: '#fdfbf4', color: '#1b0b09' }
                        : { color: 'rgba(253,251,244,.62)' }}
                    >
                      <Icon size={16} style={{ color: isActive ? '#b8a508' : 'rgba(253,251,244,.4)' }} />
                      <span className="flex-1">{label}</span>
                      {label === 'Tâches' && urgentCount > 0 && (
                        <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none ${isActive ? 'bg-[#1b0b09] text-[#fdfbf4]' : 'bg-red-500 text-white'}`}>
                          {urgentCount}
                        </span>
                      )}
                      {label === 'Formulaires' && newFormCount > 0 && (
                        <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none ${isActive ? 'bg-[#1b0b09] text-[#fdfbf4]' : 'bg-amber-500 text-white'}`}>
                          {newFormCount}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(253,251,244,.08)' }}>
        <div className="rounded-2xl p-3 flex items-center gap-3" style={{ background: 'rgba(253,251,244,.06)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#b8a508' }}>
            <span className="text-xs font-bold" style={{ color: '#1b0b09' }}>{(localStorage.getItem('sc-crm-profil') || 'Sheryn')[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold" style={{ color: '#fdfbf4' }}>{localStorage.getItem('sc-crm-profil') || 'Sheryn'}</p>
            <p className="text-[10px]" style={{ color: 'rgba(253,251,244,.45)' }}>Administratrice</p>
          </div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full shadow shadow-emerald-200" />
        </div>
        <button
          onClick={logout}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors hover:text-red-400"
          style={{ color: 'rgba(253,251,244,.4)' }}
        >
          <LogOut size={13} />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
