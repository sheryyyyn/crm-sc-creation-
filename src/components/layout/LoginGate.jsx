import { useState } from 'react'

const STORAGE_KEY = 'sc-crm-auth'
const PROFIL_KEY = 'sc-crm-profil'

const PROFILS = [
  { nom: 'Sheryn', initiale: 'S', couleur: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
  { nom: 'Chainez', initiale: 'C', couleur: 'linear-gradient(135deg,#ec4899,#db2777)' },
]

export function isAuthenticated() {
  return localStorage.getItem(STORAGE_KEY) === 'ok'
}

export function getProfil() {
  return localStorage.getItem(PROFIL_KEY) || 'Sheryn'
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(PROFIL_KEY)
  window.location.reload()
}

export default function LoginGate({ children }) {
  const [auth, setAuth] = useState(isAuthenticated)

  function choisirProfil(p) {
    localStorage.setItem(STORAGE_KEY, 'ok')
    localStorage.setItem(PROFIL_KEY, p.nom)
    setAuth(true)
  }

  if (auth) return children

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#f8f9ff 0%,#eef2ff 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
            <span className="text-white font-bold text-2xl">⬡</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SC Création</h1>
          <p className="text-sm text-gray-500 mt-1">CRM 360</p>
        </div>

        <div className="bg-white rounded-3xl p-8" style={{ boxShadow: '0 8px 40px rgba(99,102,241,0.15)' }}>
          <p className="text-sm font-semibold text-gray-700 mb-4 text-center">Qui est-ce ?</p>
          <div className="flex gap-4">
            {PROFILS.map(p => (
              <button key={p.nom} onClick={() => choisirProfil(p)}
                className="flex-1 flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-transparent hover:border-indigo-200 hover:bg-indigo-50 transition-all">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                  style={{ background: p.couleur }}>
                  {p.initiale}
                </div>
                <span className="text-sm font-bold text-gray-800">{p.nom}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
