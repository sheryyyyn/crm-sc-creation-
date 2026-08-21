// Statuts de tâche partagés entre la page Tâches et les modals d'ajout rapide
// (Dashboard, QuickCreate…) pour ne pas dupliquer la liste à plusieurs endroits.
export const STATUTS_TACHE = [
  { id: 'pas_commence', label: 'Pas commencé' },
  { id: 'a_faire', label: 'À faire' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'en_attente', label: 'Attente client' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'termine', label: 'Terminé' },
]
