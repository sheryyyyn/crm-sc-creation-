import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: '#f0f2f8' }}>
      <Sidebar />
      <Topbar />
      <main className="ml-60 pt-14 min-h-screen">
        <div className="p-7 max-w-screen-2xl">
          {children}
        </div>
      </main>
    </div>
  )
}
