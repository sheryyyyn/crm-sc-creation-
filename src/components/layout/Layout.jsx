import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: '#EAE3D3' }}>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:p-7 lg:flex lg:justify-center">
        <div
          className="w-full min-h-screen lg:min-h-0 lg:max-w-[1520px] lg:flex lg:items-stretch lg:rounded-[26px] lg:overflow-hidden bg-white"
          style={{ boxShadow: '0 24px 60px rgba(36,21,18,.22)' }}
        >
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="lg:flex-1 lg:min-w-0 flex flex-col" style={{ background: '#FDFCF8' }}>
            <Topbar onMenuToggle={() => setSidebarOpen(o => !o)} />
            <main className="flex-1 pt-14 lg:pt-0">
              <div className="p-4 lg:p-8 max-w-screen-2xl">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
