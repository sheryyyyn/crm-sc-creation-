import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { registerFCMToken, setupForegroundMessages } from '../../utils/fcm'
import { requestNotificationPermission } from '../../utils/notify'
import { getProfil } from './LoginGate'

const DISMISS_KEY = 'sc-crm-notif-banner-dismissed'

// iOS/Safari ignore silencieusement toute demande de permission de notification
// qui ne vient pas directement d'un tap utilisateur (pas de useEffect au chargement).
// Cette bannière fournit ce geste explicite, sur toutes les pages.
export default function NotificationBanner() {
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState('idle') // idle | asking | granted | denied

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'default') return
    if (localStorage.getItem(DISMISS_KEY) === '1') return
    setVisible(true)
  }, [])

  async function handleEnable() {
    setStatus('asking')
    const granted = await requestNotificationPermission()
    if (granted) {
      await registerFCMToken(getProfil())
      setupForegroundMessages()
      setStatus('granted')
      setTimeout(() => setVisible(false), 2000)
    } else {
      setStatus('denied')
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="mb-4 flex items-start gap-3 px-4 py-3.5 rounded-2xl" style={{ background: '#fcf7cf', border: '1px solid #eee6b0' }}>
      <Bell size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#8a7a1f' }} />
      <div className="flex-1 min-w-0">
        {status === 'granted' ? (
          <p className="text-sm font-semibold" style={{ color: '#241512' }}>Notifications activées ✅</p>
        ) : status === 'denied' ? (
          <>
            <p className="text-sm font-semibold" style={{ color: '#241512' }}>Notifications refusées</p>
            <p className="text-xs mt-1" style={{ color: '#8a7a1f' }}>
              Va dans Réglages iOS → SC Création → Notifications pour les autoriser manuellement.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold" style={{ color: '#241512' }}>Activer les notifications sur cet appareil ?</p>
            <p className="text-xs mt-1" style={{ color: '#8a7a1f' }}>Reçois une alerte dès qu'un nouveau formulaire arrive.</p>
            <button
              onClick={handleEnable}
              disabled={status === 'asking'}
              className="mt-2.5 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors"
              style={{ background: '#241512', color: '#FDFCF8', opacity: status === 'asking' ? 0.6 : 1 }}
            >
              {status === 'asking' ? 'Activation…' : 'Activer les notifications'}
            </button>
          </>
        )}
      </div>
      <button onClick={dismiss} className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5" title="Fermer">
        <X size={15} style={{ color: '#8a7a1f' }} />
      </button>
    </div>
  )
}
