import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const MOT_DE_PASSE = 'Iletaitunefoisdeuxsoeursvoiléesen2026?'
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
  const [profil, setProfil] = useState(null)
  const [input, setInput] = useState('')
  const [visible, setVisible] = useState(false)
  const [erreur, setErreur] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input === MOT_DE_PASSE) {
      localStorage.setItem(STORAGE_KEY, 'ok')
      localStorage.setItem(PROFIL_KEY, profil.nom)
      setAuth(true)
    } else {
      setErreur(true)
      setInput('')
      setTimeout(() => setErreur(false), 2000)
    }
  }

  if (auth) return children

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#f8f9ff 0%,#eef2ff 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
            <span className="text-white font-bold text-2xl">⬡</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SC Création</h1>
          <p className="text-sm text-gray-500 mt-1">CRM 360 · Accès privé</p>
        </div>

        <div className="bg-white rounded-3xl p-8" style={{ boxShadow: '0 8px 40px rgba(99,102,241,0.15)' }}>
          {!profil ? (
            /* Étape 1 — Choix du profil */
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-4 text-center">Qui est-ce ?</p>
              <div className="flex gap-4">
                {PROFILS.map(p => (
                  <button key={p.nom} onClick={() => setProfil(p)}
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
          ) : (
            /* Étape 2 — Mot de passe */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Profil sélectionné */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ background: profil.couleur }}>
                  {profil.initiale}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{profil.nom}</p>
                  <button type="button" onClick={() => { setProfil(null); setInput('') }}
                    className="text-xs text-indigo-500 hover:underline">
                    Changer de profil
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                <div className="relative">
                  <input
                    type={visible ? 'text' : 'password'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Entrez le mot de passe"
                    autoFocus
                    className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${erreur ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                  />
                  <button type="button" onClick={() => setVisible(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {erreur && <p className="text-xs text-red-500 mt-1.5">Mot de passe incorrect</p>}
              </div>

              <button type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: profil.couleur }}>
                Accéder au CRM
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
