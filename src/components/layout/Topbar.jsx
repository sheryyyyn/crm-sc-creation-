import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Plus } from 'lucide-react'
import useStore from '../../store/useStore'

export default function Topbar({ onMenuToggle }) {
  const navigate = useNavigate()
  const { formReponses, partenaireItems } = useStore()
  const [bellOpen, setBellOpen] = useState(false)

  const newForms = formReponses.filter(r => !r.lu)
  const newPartners = partenaireItems.filter(p => !p.lu)
  const notifCount = newForms.length + newPartners.length

  return (
    <>
      {/* Mobile — bouton menu seul */}
      <header className="fixed top-0 left-0 right-0 lg:hidden h-14 flex items-center px-4 z-20" style={{ background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #ece9e4' }}>
        <button
          onClick={onMenuToggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          style={{ color: '#7e7e7e' }}
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Desktop — recherche, notifications, avatars, +Créer */}
      <header className="hidden lg:flex items-center gap-4 px-8 py-5" style={{ background: '#FDFCF8' }}>
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#a89b8c' }} />
          <input
            placeholder="Rechercher un projet, un prospect…"
            className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm outline-none"
            style={{ background: '#F4F2EC', border: '1px solid #e7e5e1', color: '#241512' }}
          />
        </div>

        <div className="flex-1" />

        <div className="relative">
          <button
            onClick={() => setBellOpen(o => !o)}
            className="w-9 h-9 rounded-full flex items-center justify-center relative"
            style={{ background: '#F4F2EC', color: '#241512' }}
          >
            <Bell size={16} />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: '#8a5a2b' }} />
            )}
          </button>
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl overflow-hidden z-30" style={{ background: '#fff', border: '1px solid #e7e5e1', boxShadow: '0 12px 32px rgba(36,21,18,.14)' }}>
              {notifCount === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#a89b8c' }}>Aucune notification</p>
              ) : (
                <div>
                  {newPartners.length > 0 && (
                    <button onClick={() => { navigate('/espace-partenaire'); setBellOpen(false) }}
                      className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-[#f7f6f3]" style={{ color: '#241512', borderBottom: '1px solid #eeece7' }}>
                      {newPartners.length} nouveau{newPartners.length > 1 ? 'x' : ''} projet{newPartners.length > 1 ? 's' : ''} partenaire
                    </button>
                  )}
                  {newForms.length > 0 && (
                    <button onClick={() => { navigate('/formulaires'); setBellOpen(false) }}
                      className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-[#f7f6f3]" style={{ color: '#241512' }}>
                      {newForms.length} nouveau{newForms.length > 1 ? 'x' : ''} formulaire{newForms.length > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center -space-x-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: '#241512', color: '#FDFCF8', border: '2px solid #FDFCF8' }}>S</div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: '#6f4e3d', color: '#FDFCF8', border: '2px solid #FDFCF8' }}>C</div>
        </div>

        <button onClick={() => navigate('/taches')}
          className="flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-full"
          style={{ background: '#241512', color: '#FDFCF8' }}>
          <Plus size={15} /> Créer
        </button>
      </header>
    </>
  )
}
