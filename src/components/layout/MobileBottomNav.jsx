import { NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid, ListChecks, FileText, Folder } from 'lucide-react'
import useStore from '../../store/useStore'

const ITEMS = [
  { label: 'Dashboard', to: '/', icon: LayoutGrid },
  { label: 'To-do', to: '/taches', icon: ListChecks },
  { label: 'Formulaires', to: '/formulaires', icon: FileText },
  { label: 'Projets', to: '/projets', icon: Folder },
]

// Barre de navigation fixe mobile uniquement — desktop garde le menu latéral existant.
export default function MobileBottomNav() {
  const location = useLocation()
  const { formReponses } = useStore()
  const newFormCount = formReponses.filter(r => !r.lu).length

  const isActive = (to) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to))

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex"
      style={{ background: '#241512', borderTop: '1px solid rgba(253,251,244,.08)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 6px)' }}
    >
      {ITEMS.map(({ label, to, icon: Icon }) => {
        const active = isActive(to)
        const color = active ? '#FDFCF8' : 'rgba(253,251,244,.55)'
        return (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-1 pt-2.5 relative"
          >
            <div className="relative">
              <Icon size={20} style={{ color }} strokeWidth={active ? 2.4 : 2} />
              {label === 'Formulaires' && newFormCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: '#fcf7cf', color: '#241512' }}
                >
                  {newFormCount}
                </span>
              )}
            </div>
            <span style={{ color, fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: active ? 700 : 600 }}>
              {label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}
