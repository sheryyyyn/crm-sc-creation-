import { useEffect } from 'react'
import { registerFCMToken, setupForegroundMessages } from '../../utils/fcm'

const PROFIL_KEY = 'sc-crm-profil'

export function getProfil() {
  return localStorage.getItem(PROFIL_KEY) || 'Sheryn'
}

// Plus d'écran "Qui est-ce ?" — l'app s'ouvre directement, interface partagée.
//
// La demande de permission de notification ne se fait PAS ici : iOS/Safari
// ignore silencieusement toute demande qui ne vient pas d'un tap utilisateur
// direct (voir components/layout/NotificationBanner.jsx). Ici on se contente
// de réenregistrer le token pour les appareils qui ont déjà donné leur accord
// lors d'une visite précédente.
export default function LoginGate({ children }) {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      registerFCMToken(getProfil())
    }
    setupForegroundMessages()
  }, [])

  return children
}
