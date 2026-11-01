// ─── Types d'échéances fiscales ───────────────────────────────────────────────
// Chaque type décrit ses périodes et les démarches à suivre. Les dates limites ne
// sont volontairement PAS calculées : elles dépendent de l'entreprise et doivent
// être renseignées / vérifiées à partir du calendrier fiscal officiel
// (impots.gouv.fr → espace professionnel). `moisEcheance` sert uniquement d'indication.
//
// Pour ajouter un type (IS, CFE…) : ajouter une entrée ici avec ses périodes et
// ses démarches — la page, les rappels et le dashboard s'adaptent automatiquement.
export const TYPES_ECHEANCE = {
  tva: {
    id: 'tva',
    label: 'TVA',
    formulaire: 'CA3',
    description: 'Déclaration trimestrielle de TVA (CA3)',
    demarches: ['declaration', 'paiement'],
    periodes: [
      { id: 'T1', label: 'T1', mois: 'janvier – mars', moisEcheance: 4, decalageAnnee: 0 },
      { id: 'T2', label: 'T2', mois: 'avril – juin', moisEcheance: 7, decalageAnnee: 0 },
      { id: 'T3', label: 'T3', mois: 'juillet – septembre', moisEcheance: 10, decalageAnnee: 0 },
      { id: 'T4', label: 'T4', mois: 'octobre – décembre', moisEcheance: 1, decalageAnnee: 1 },
    ],
  },
  // is: { id: 'is', label: 'IS', demarches: ['paiement'], periodes: [{ id: 'A1', label: '1er acompte', … }] },
  // cfe: { id: 'cfe', label: 'CFE', demarches: ['paiement'], periodes: [{ id: 'AN', label: 'Annuelle', … }] },
}

export const DEMARCHES = {
  declaration: { label: 'Déclaration', fait: 'Déclarée', dateField: 'dateDeclaration', doneField: 'declaree', doneDateField: 'declareeLe' },
  paiement: { label: 'Paiement', fait: 'Payée', dateField: 'datePaiement', doneField: 'payee', doneDateField: 'payeeLe' },
}

export const LIEN_CALENDRIER_FISCAL = 'https://www.impots.gouv.fr/professionnel/calendrier-fiscal'
