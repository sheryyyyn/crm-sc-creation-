export function buildClientFromForm(values) {
  const pseudo = values.pseudoReseau || ''
  const instagram = values.reseauContact === 'Instagram' ? pseudo : ''

  return {
    nom: values.nomEntreprise || '',
    contact: values.nomEntreprise || '',
    email: values.email || '',
    telephone: values.telephone || '',
    instagram,
    siteWeb: values.siteActuel || '',
    secteur: values.secteurActivite || '',
    statut: 'prospect',
    source: values.reseauContact || '',
    typeProjet: values.objectif || '',
    offre: '',
    budget: values.budget || '',
    deadline: values.dateButoir || '',
    objectifs: values.objectif || '',
    notes: [
      values.histoire && `Histoire : ${values.histoire}`,
      values.produits && `Produits/services : ${values.produits}`,
      values.cible && `Cible : ${values.cible}`,
      values.demandesSpecifiques && `Demandes : ${values.demandesSpecifiques}`,
      values.remarques && `Remarques : ${values.remarques}`,
    ].filter(Boolean).join('\n\n'),
  }
}
