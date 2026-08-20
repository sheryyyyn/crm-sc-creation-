import { Menu } from 'lucide-react'

// Pas de cloche, pas de barre pleine largeur : uniquement le bouton hamburger,
// cercle blanc à bordure fine, aligné sur les marges de page (mobile only).
export default function Topbar({ onMenuToggle }) {
  return (
    <header
      className="fixed top-0 left-0 right-0 lg:hidden flex items-end px-4 pb-2 z-20 pointer-events-none"
      style={{ height: 'calc(56px + env(safe-area-inset-top))' }}
    >
      <button
        onClick={onMenuToggle}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0 pointer-events-auto"
        style={{ background: '#fff', border: '1px solid #e7e5e1', color: '#241512' }}
      >
        <Menu size={20} />
      </button>
    </header>
  )
}
