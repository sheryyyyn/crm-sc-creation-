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
        fixed left-0 top-0 h-screen w-60 bg-white flex flex-col z-30
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
      style={{ boxShadow: '2px 0 20px rgba(0,0,0,0.06)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
            <Hexagon size={15} className="text-white" fill="white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 leading-tight">SC Création</p>
            <p className="text-[10px] text-gray-400 font-medium">CRM 360</p>
          </div>
          {/* Bouton fermer — mobile uniquement */}
          <button
            onClick={onClose}
            className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <div className="space-y-4">
          {navCategories.map(({ label: catLabel, items }) => (
            <div key={catLabel}>
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-3 mb-1">{catLabel}</p>
              <div className="space-y-0.5">
                {items.map(({ label, icon: Icon, to }) => {
                  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
                  return (
                    <NavLink key={to} to={to} onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'text-white shadow-md'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                      style={isActive ? { background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 4px 12px rgba(99,102,241,0.30)' } : {}}
                    >
                      <Icon size={16} className={isActive ? 'text-white' : 'text-gray-400'} />
                      <span className="flex-1">{label}</span>
                      {label === 'Tâches' && urgentCount > 0 && (
                        <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none ${isActive ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
                          {urgentCount}
                        </span>
                      )}
                      {label === 'Formulaires' && newFormCount > 0 && (
                        <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none ${isActive ? 'bg-white/25 text-white' : 'bg-amber-500 text-white'}`}>
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
      <div className="px-4 py-4">
        <div className="rounded-2xl p-3 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }}>
            <span className="text-xs font-bold text-white">{(localStorage.getItem('sc-crm-profil') || 'Sheryn')[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-800">{localStorage.getItem('sc-crm-profil') || 'Sheryn'}</p>
            <p className="text-[10px] text-gray-500">Administratrice</p>
          </div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full shadow shadow-emerald-200" />
        </div>
        <button
          onClick={logout}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={13} />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
