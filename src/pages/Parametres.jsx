import { useState, useEffect } from 'react'
import { Settings, Users, Palette, Globe, Link2, Save } from 'lucide-react'

export const getCalendlyUrl = () => localStorage.getItem('sc_calendly_url') || 'https://cal.eu/sc.creation/45min'
export const setCalendlyUrl = (url) => localStorage.setItem('sc_calendly_url', url)

const INTEGRATIONS = [
  { name: 'Google Calendar', icon: '📅', statut: 'Bientôt disponible', color: 'bg-blue-50 border-blue-100' },
  { name: 'Google Meet', icon: '📹', statut: 'Bientôt disponible', color: 'bg-indigo-50 border-indigo-100' },
  { name: 'Gmail', icon: '📧', statut: 'Bientôt disponible', color: 'bg-red-50 border-red-100' },
  { name: 'Stripe', icon: '💳', statut: 'Bientôt disponible', color: 'bg-purple-50 border-purple-100' },
  { name: 'Google Drive', icon: '📁', statut: 'Bientôt disponible', color: 'bg-yellow-50 border-yellow-100' },
  { name: 'Shopify', icon: '🛒', statut: 'Bientôt disponible', color: 'bg-green-50 border-green-100' },
]

const TABS = ['Agence', 'Utilisateurs', 'Apparence', 'Intégrations']

export default function Parametres() {
  const [tab, setTab] = useState('Agence')
  const [agence, setAgence] = useState({
    nom: 'SC Création',
    email: 'contact@sc-creation.fr',
    telephone: '06 XX XX XX XX',
    siteWeb: 'sc-creation.fr',
    instagram: '@sc_creation',
    siret: '',
    adresse: '',
    tva: '20',
  })
  const [saved, setSaved] = useState(false)
  const [calendlyUrl, setCalendlyUrlState] = useState(() => getCalendlyUrl() || 'https://cal.eu/sc.creation/45min')

  function handleSave() {
    setCalendlyUrl(calendlyUrl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Paramètres</h1>
      </div>

      <div className="flex gap-5">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                {t}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === 'Agence' && (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Informations de l'agence</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Nom de l'agence", key: 'nom' },
                  { label: 'Email', key: 'email', type: 'email' },
                  { label: 'Téléphone', key: 'telephone' },
                  { label: 'Site web', key: 'siteWeb' },
                  { label: 'Instagram', key: 'instagram' },
                  { label: 'SIRET', key: 'siret' },
                  { label: 'TVA par défaut (%)', key: 'tva', type: 'number' },
                ].map(({ label, key, type = 'text' }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input type={type} className="input" value={agence[key]} onChange={e => setAgence({ ...agence, [key]: e.target.value })} />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="label">Adresse</label>
                  <textarea className="input resize-none" rows={2} value={agence.adresse} onChange={e => setAgence({ ...agence, adresse: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="label">Lien de réservation (Calendly)</label>
                  <input type="url" className="input" placeholder="https://calendly.com/sc-creation/30min" value={calendlyUrl} onChange={e => setCalendlyUrlState(e.target.value)} />
                  <p className="text-[11px] text-gray-400 mt-1">Ce lien sera intégré automatiquement dans les mails d'intérêt envoyés depuis les formulaires.</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <button onClick={handleSave} className="btn-primary">
                  <Save size={15} /> Enregistrer
                </button>
                {saved && <span className="text-sm text-emerald-600 font-medium">✓ Enregistré !</span>}
              </div>
            </div>
          )}

          {tab === 'Utilisateurs' && (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Membres de l'équipe</h2>
              <div className="space-y-3">
                {[
                  { nom: 'Sheryn', role: 'Administratrice', email: 'sheryn@sc-creation.fr', color: 'bg-indigo-100 text-indigo-700' },
                  { nom: 'Chainez', role: 'Designer', email: 'chainez@sc-creation.fr', color: 'bg-pink-100 text-pink-700' },
                ].map(u => (
                  <div key={u.nom} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${u.color}`}>
                      {u.nom[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{u.nom}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.color}`}>{u.role}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-700 font-medium">Gestion multi-utilisateurs avec rôles et permissions — disponible dans la prochaine version.</p>
              </div>
            </div>
          )}

          {tab === 'Apparence' && (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Apparence</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Couleur principale</label>
                  <div className="flex gap-3 mt-2">
                    {['#4f46e5', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                      <button key={color} className="w-8 h-8 rounded-full border-2 border-white shadow-md transition-transform hover:scale-110"
                        style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Thème</label>
                  <div className="flex gap-3 mt-2">
                    {['Light (actuel)', 'Dark (bientôt)'].map(t => (
                      <div key={t} className={`px-4 py-2 rounded-lg border text-sm font-medium ${t.includes('actuel') ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-400'}`}>{t}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'Intégrations' && (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Intégrations</h2>
              <div className="grid grid-cols-2 gap-3">
                {INTEGRATIONS.map(integ => (
                  <div key={integ.name} className={`flex items-center gap-3 p-4 rounded-xl border ${integ.color}`}>
                    <span className="text-2xl">{integ.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{integ.name}</p>
                      <p className="text-xs text-gray-500">{integ.statut}</p>
                    </div>
                    <button className="text-xs bg-white border border-gray-200 text-gray-500 px-2.5 py-1 rounded-lg" disabled>
                      Connecter
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs text-amber-700 font-medium">🔌 Les intégrations natives arrivent dans la version 2.0 — restez connecté !</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
