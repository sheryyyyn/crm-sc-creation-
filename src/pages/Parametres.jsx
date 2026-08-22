import { useState, useEffect } from 'react'
import { Settings, Users, Palette, Globe, Link2, Save, Trash2, Bell } from 'lucide-react'
import useStore from '../store/useStore'
import { notify, requestNotificationPermission } from '../utils/notify'
import { registerFCMToken } from '../utils/fcm'

export const getCalendlyUrl = () => localStorage.getItem('sc_calendly_url') || 'https://cal.eu/sc.creation/45min'
export const setCalendlyUrl = (url) => localStorage.setItem('sc_calendly_url', url)

const INTEGRATIONS = [
  { name: 'Google Calendar', icon: '📅', statut: 'Bientôt disponible' },
  { name: 'Google Meet', icon: '📹', statut: 'Bientôt disponible' },
  { name: 'Gmail', icon: '📧', statut: 'Bientôt disponible' },
  { name: 'Stripe', icon: '💳', statut: 'Bientôt disponible' },
  { name: 'Google Drive', icon: '📁', statut: 'Bientôt disponible' },
  { name: 'Shopify', icon: '🛒', statut: 'Bientôt disponible' },
]

const TABS = ['Agence', 'Utilisateurs', 'Apparence', 'Données', 'Intégrations']

const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
const inputStyle = { background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }
const labelCls = "block text-xs font-semibold mb-1.5"
const labelStyle = { color: '#a89b8c' }

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
  const [purging, setPurging] = useState(false)
  const [purged, setPurged] = useState(false)
  const [confirmPurge, setConfirmPurge] = useState(false)
  const { purgeDemoData } = useStore()
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )
  const [profil, setProfil] = useState(() => localStorage.getItem('sc-crm-profil') || 'Sheryn')

  async function handleActiverNotifs() {
    const granted = await requestNotificationPermission()
    setNotifPermission(granted ? 'granted' : 'denied')
    if (granted) {
      await registerFCMToken(profil)
      notify('🔔 Notifications activées !', 'Vous recevrez des alertes pour vos RDV, formulaires et tâches urgentes.')
    }
  }

  // Déclare à qui appartient cet appareil, pour que les notifications (dont le
  // rappel quotidien des tâches) soient envoyées à la bonne personne uniquement.
  async function handleChangeProfil(p) {
    setProfil(p)
    localStorage.setItem('sc-crm-profil', p)
    if (notifPermission === 'granted') await registerFCMToken(p)
  }

  async function handlePurge() {
    setPurging(true)
    await purgeDemoData()
    setPurging(false)
    setPurged(true)
    setConfirmPurge(false)
    setTimeout(() => setPurged(false), 3000)
  }

  function handleSave() {
    setCalendlyUrl(calendlyUrl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Paramètres</h1>
      </div>

      {notifPermission === 'default' && (
        <div className="mb-5 rounded-2xl overflow-hidden" style={{ background: '#fcf7cf', border: '1px solid #e8dfa8' }}>
          <div className="flex items-center gap-3 px-5 py-3">
            <Bell size={18} style={{ color: '#8a7a1f' }} />
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: '#1b0b09' }}>Activer les notifications</p>
              <p className="text-xs mt-0.5" style={{ color: '#8a7a1f' }}>Soyez alertée en temps réel des nouveaux formulaires, RDV à venir et tâches urgentes.</p>
            </div>
            <button onClick={handleActiverNotifs}
              className="text-xs font-bold px-4 py-2 rounded-xl flex-shrink-0"
              style={{ background: '#241512', color: '#FDFCF8' }}>
              Activer
            </button>
          </div>
        </div>
      )}

      <div className="mb-5 rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e7e5e1' }}>
        <p className="text-sm font-bold mb-3" style={{ color: '#241512' }}>Cet appareil est celui de…</p>
        <div className="flex gap-2">
          {['Sheryn', 'Chainez'].map(p => (
            <button key={p} onClick={() => handleChangeProfil(p)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={profil === p ? { background: '#241512', color: '#FDFCF8' } : { background: '#f5f4f1', color: '#241512' }}>
              {p === 'Chainez' ? 'Chaïnez' : p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-5">
        {/* Sidebar tabs */}
        <div className="sm:w-48 sm:flex-shrink-0">
          <nav className="flex sm:flex-col gap-1 overflow-x-auto pb-1 sm:pb-0">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-shrink-0 sm:w-full text-left px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                style={tab === t ? { background: '#f5f4f1', color: '#241512' } : { color: '#a89b8c' }}>
                {t}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === 'Agence' && (
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e7e5e1' }}>
              <h2 className="text-base font-semibold mb-5" style={{ color: '#241512' }}>Informations de l'agence</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <label className={labelCls} style={labelStyle}>{label}</label>
                    <input type={type} className={inputCls} style={inputStyle} value={agence[key]} onChange={e => setAgence({ ...agence, [key]: e.target.value })} />
                  </div>
                ))}
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelCls} style={labelStyle}>Adresse</label>
                  <textarea className={`${inputCls} resize-none`} style={inputStyle} rows={2} value={agence.adresse} onChange={e => setAgence({ ...agence, adresse: e.target.value })} />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelCls} style={labelStyle}>Lien de réservation (Calendly)</label>
                  <input type="url" className={inputCls} style={inputStyle} placeholder="https://calendly.com/sc-creation/30min" value={calendlyUrl} onChange={e => setCalendlyUrlState(e.target.value)} />
                  <p className="text-[11px] mt-1" style={{ color: '#a89b8c' }}>Ce lien sera intégré automatiquement dans les mails d'intérêt envoyés depuis les formulaires.</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }}>
                  <Save size={15} /> Enregistrer
                </button>
                {saved && <span className="text-sm text-emerald-600 font-medium">✓ Enregistré !</span>}
              </div>
            </div>
          )}

          {tab === 'Utilisateurs' && (
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e7e5e1' }}>
              <h2 className="text-base font-semibold mb-5" style={{ color: '#241512' }}>Membres de l'équipe</h2>
              <div className="space-y-3">
                {[
                  { nom: 'Sheryn', role: 'Administratrice', email: 'sheryn@sc-creation.fr' },
                  { nom: 'Chainez', role: 'Designer', email: 'chainez@sc-creation.fr' },
                ].map(u => (
                  <div key={u.nom} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: '#f5f4f1' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: '#241512', color: '#FDFCF8' }}>
                      {u.nom[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: '#241512' }}>{u.nom}</p>
                      <p className="text-xs" style={{ color: '#a89b8c' }}>{u.email}</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#eeece7', color: '#241512' }}>{u.role}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-xl" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1' }}>
                <p className="text-xs font-medium" style={{ color: '#241512' }}>Gestion multi-utilisateurs avec rôles et permissions — disponible dans la prochaine version.</p>
              </div>
            </div>
          )}

          {tab === 'Apparence' && (
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e7e5e1' }}>
              <h2 className="text-base font-semibold mb-5" style={{ color: '#241512' }}>Apparence</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls} style={labelStyle}>Couleur principale</label>
                  <div className="flex gap-3 mt-2">
                    {['#241512', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                      <button key={color} className="w-8 h-8 rounded-full border-2 border-white shadow-md transition-transform hover:scale-110"
                        style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Thème</label>
                  <div className="flex gap-3 mt-2">
                    {['Light (actuel)', 'Dark (bientôt)'].map(t => (
                      <div key={t} className="px-4 py-2 rounded-lg border text-sm font-medium"
                        style={t.includes('actuel') ? { borderColor: '#241512', background: '#f5f4f1', color: '#241512' } : { borderColor: '#e7e5e1', color: '#a89b8c' }}>{t}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'Données' && (
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e7e5e1' }}>
              <h2 className="text-base font-semibold mb-2" style={{ color: '#241512' }}>Données</h2>
              <p className="text-sm mb-6" style={{ color: '#a89b8c' }}>Supprime toutes les données de démonstration (clients, projets, tâches, RDVs, documents, leads, contenus, dépenses). Les formulaires clients ne seront pas supprimés.</p>
              {purged ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-sm font-semibold text-emerald-700">✓ Données de démo supprimées avec succès.</p>
                </div>
              ) : confirmPurge ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-semibold text-red-700 mb-3">Cette action est irréversible. Toutes les fausses données seront supprimées de Firebase.</p>
                  <div className="flex gap-3">
                    <button onClick={handlePurge} disabled={purging}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60">
                      <Trash2 size={14} />
                      {purging ? 'Suppression...' : 'Confirmer la suppression'}
                    </button>
                    <button onClick={() => setConfirmPurge(false)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-[#e7e5e1] hover:bg-[#f5f4f1] transition-colors" style={{ color: '#241512' }}>
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmPurge(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
                  <Trash2 size={15} />
                  Supprimer les données de démo
                </button>
              )}
            </div>
          )}

          {tab === 'Intégrations' && (
            <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #e7e5e1' }}>
              <h2 className="text-base font-semibold mb-5" style={{ color: '#241512' }}>Intégrations</h2>
              <div className="grid grid-cols-2 gap-3">
                {INTEGRATIONS.map(integ => (
                  <div key={integ.name} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1' }}>
                    <span className="text-2xl">{integ.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: '#241512' }}>{integ.name}</p>
                      <p className="text-xs" style={{ color: '#a89b8c' }}>{integ.statut}</p>
                    </div>
                    <button className="text-xs bg-white border border-[#e7e5e1] px-2.5 py-1 rounded-lg" style={{ color: '#a89b8c' }} disabled>
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
