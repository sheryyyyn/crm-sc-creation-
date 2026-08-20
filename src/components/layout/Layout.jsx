import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import NotificationBanner from './NotificationBanner'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen lg:flex lg:items-stretch" style={{ background: '#FDFCF8' }}>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:flex-1 lg:min-w-0 flex flex-col">
        <Topbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 pt-14 lg:pt-0">
          <div className="p-4 lg:p-8 max-w-screen-2xl">
            <NotificationBanner />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
