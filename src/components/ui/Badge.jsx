export function Badge({ children, color = 'gray', size = 'sm' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    yellow: 'bg-amber-50 text-amber-700',
    orange: 'bg-orange-50 text-orange-700',
    purple: 'bg-purple-50 text-purple-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    pink: 'bg-pink-50 text-pink-700',
  }
  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${colors[color] || colors.gray} ${sizes[size]}`}>
      {children}
    </span>
  )
}

export function statutBadge(statut) {
  const map = {
    actif: { label: 'Actif', color: 'green' },
    prospect: { label: 'Prospect', color: 'blue' },
    ancien: { label: 'Ancien', color: 'gray' },
    paye: { label: 'Payé', color: 'green' },
    envoye: { label: 'Envoyé', color: 'blue' },
    en_attente: { label: 'En attente', color: 'yellow' },
    signe: { label: 'Signé', color: 'purple' },
    impaye: { label: 'Impayé', color: 'red' },
    en_cours: { label: 'En cours', color: 'indigo' },
    livre: { label: 'Livré', color: 'green' },
    devis: { label: 'Devis', color: 'yellow' },
    termine: { label: 'Terminé', color: 'green' },
    annule: { label: 'Annulé', color: 'gray' },
    planifie: { label: 'Planifié', color: 'purple' },
    idee: { label: 'Idée', color: 'gray' },
    publie: { label: 'Publié', color: 'green' },
    a_faire: { label: 'À faire', color: 'blue' },
    pas_commence: { label: 'Pas commencé', color: 'gray' },
    en_attente_client: { label: 'Attente client', color: 'orange' },
    urgent: { label: 'Urgent', color: 'red' },
    basse: { label: 'Basse', color: 'gray' },
    moyenne: { label: 'Moyenne', color: 'blue' },
    haute: { label: 'Haute', color: 'orange' },
    urgente: { label: 'Urgente', color: 'red' },
    prospect_lead: { label: 'Prospect', color: 'gray' },
    contacte: { label: 'Contacté', color: 'blue' },
    appel: { label: 'Appel', color: 'purple' },
    devis_envoye: { label: 'Devis envoyé', color: 'yellow' },
    gagne: { label: 'Gagné', color: 'green' },
    perdu: { label: 'Perdu', color: 'red' },
    a_venir: { label: 'À venir', color: 'blue' },
  }
  const s = map[statut] || { label: statut, color: 'gray' }
  return <Badge color={s.color}>{s.label}</Badge>
}

export function prioriteBadge(p) {
  const map = {
    basse: { label: 'Basse', color: 'gray' },
    moyenne: { label: 'Moyenne', color: 'blue' },
    haute: { label: 'Haute', color: 'orange' },
    urgente: { label: 'Urgente', color: 'red' },
  }
  const s = map[p] || { label: p, color: 'gray' }
  return <Badge color={s.color}>{s.label}</Badge>
}

export function assigneeBadge(name) {
  const colors = { Sheryn: 'indigo', Chainez: 'pink' }
  return <Badge color={colors[name] || 'gray'}>{name}</Badge>
}
