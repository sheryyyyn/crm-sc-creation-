import { Menu } from 'lucide-react'

export default function Topbar({ onMenuToggle }) {
  return (
    <header className="fixed top-0 left-0 right-0 lg:hidden h-14 flex items-center px-4 z-20" style={{ background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #ece9e4' }}>
      <button
        onClick={onMenuToggle}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
        style={{ color: '#7e7e7e' }}
      >
        <Menu size={20} />
      </button>
    </header>
  )
}
