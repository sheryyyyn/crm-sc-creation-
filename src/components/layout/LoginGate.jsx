import { useEffect } from 'react'
import { registerFCMToken, setupForegroundMessages } from '../../utils/fcm'
import { requestNotificationPermission } from '../../utils/notify'

const PROFIL_KEY = 'sc-crm-profil'

export function getProfil() {
  return localStorage.getItem(PROFIL_KEY) || 'Sheryn'
}

// Plus d'écran "Qui est-ce ?" — l'app s'ouvre directement, interface partagée.
export default function LoginGate({ children }) {
  useEffect(() => {
    const profil = getProfil()
    requestNotificationPermission().then(granted => {
      if (granted) registerFCMToken(profil)
    })
    setupForegroundMessages()
  }, [])

  return children
}
