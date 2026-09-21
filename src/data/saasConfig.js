// Configuration des mini-produits SaaS internes (Cake Design Manager, Boulangerie Manager…)
// Chaque entrée alimente à la fois la page de suivi (SaasProduit) et le formulaire
// public de prospection associé (SaasProspectionForm).

export const SAAS_PRODUITS = {
  'cake-design': {
    id: 'cake-design',
    slug: 'cake-design',
    titre: 'Cake Design Manager',
    sousTitre: "L'outil de gestion pour cake designers",
    dotColor: '#c98fae',
    defaults: {
      statut: 'Conception',
      modeleTarifaire: 'Abonnement mensuel',
      prix: '29 €',
      responsable: 'Sheryn & Chaïnez',
      publicCible: 'Cake designers et ateliers de gâteaux sur mesure',
      lancement: '',
      description: "Plateforme SaaS dédiée aux cake designers : gestion des commandes personnalisées, suivi des clients, planning de production et devis automatisés.",
      fonctionnalites: [
        { id: 'f1', label: 'Gestion des commandes personnalisées', statut: 'idee' },
        { id: 'f2', label: 'Devis automatisés', statut: 'idee' },
        { id: 'f3', label: 'Planning de production', statut: 'idee' },
        { id: 'f4', label: 'Suivi clients', statut: 'idee' },
        { id: 'f5', label: 'Galerie de créations', statut: 'idee' },
      ],
    },
    prospectFields: [
      { name: 'role', label: 'Quel est votre rôle ?', type: 'single', options: ['Cake designer', 'Assistant(e) / apprenti(e)', "Gérant(e) d'atelier"] },
      { name: 'appareils', label: 'Sur quels appareils travaillez-vous au quotidien ?', type: 'multi', options: ['Téléphone', 'Tablette', 'Ordinateur'] },
      { name: 'receptionCommandes', label: 'Comment recevez-vous vos commandes aujourd\'hui ?', type: 'multi', options: ['En atelier', 'Téléphone', 'SMS / WhatsApp', 'Réseaux sociaux', 'Site web / formulaire'] },
      { name: 'complexitePersonnalisation', label: 'Vos commandes sont-elles très personnalisées (forme, parts, garnitures) ?', type: 'single', options: ['Oui, presque toujours', 'Parfois', 'Rarement'] },
      { name: 'acompteRequis', label: 'Demandez-vous un acompte à la commande ?', type: 'single', options: ['Oui', 'Non'] },
      { name: 'delaiCommande', label: "Délai moyen entre la commande et la réalisation ?", type: 'single', options: ['Moins de 3 jours', '3 à 7 jours', '1 à 2 semaines', 'Plus de 2 semaines'] },
      { name: 'volumeHebdo', label: 'Combien de commandes gérez-vous par semaine en moyenne ?', type: 'single', options: ['Moins de 5', '5 à 15', '15 à 30', 'Plus de 30'] },
      { name: 'pointsDouleur', label: 'Quelles sont vos principales difficultés aujourd\'hui ?', type: 'multi', options: ['Calcul du prix / devis', 'Suivi des commandes en cours', 'Oublis de détails client', 'Planning de production', 'Relances clients', 'Autre'] },
      { name: 'infosEssentielles', label: 'Quelles infos sont indispensables sur une commande ?', type: 'multi', options: ['Nom / contact client', 'Date & heure de retrait', 'Détails du gâteau (forme, parts, saveurs)', 'Prix / acompte', 'Allergies', 'Photo de référence'] },
      { name: 'fonctionnalitesPrioritaires', label: 'Quelles fonctionnalités seraient prioritaires pour vous ? (max 3)', type: 'multi', options: ['Devis automatisé', 'Planning de production visuel', 'Galerie de créations', 'Rappels automatiques', 'Suivi client / historique', 'Autre'] },
      { name: 'nomEtablissement', label: 'Nom de votre atelier / marque', type: 'text', placeholder: 'Ex : Sucre & Sentiments' },
      { name: 'email', label: 'Email pour être recontacté(e)', type: 'email', placeholder: 'contact@votreatelier.fr' },
      { name: 'remarques', label: 'Une remarque à ajouter ?', type: 'textarea', placeholder: 'Tout élément utile…' },
    ],
  },
  boulangerie: {
    id: 'boulangerie',
    slug: 'boulangerie',
    titre: 'Boulangerie Manager',
    sousTitre: "L'outil de gestion pour boulangers",
    dotColor: '#c9a06a',
    defaults: {
      statut: 'Idée',
      modeleTarifaire: 'Abonnement mensuel',
      prix: '35 €',
      responsable: 'Sheryn & Chaïnez',
      publicCible: 'Boulangeries et pâtisseries artisanales',
      lancement: '',
      description: "Plateforme SaaS dédiée aux boulangeries : gestion des commandes, suivi de production, gestion des stocks et réservation en ligne.",
      fonctionnalites: [
        { id: 'f1', label: 'Gestion des commandes', statut: 'idee' },
        { id: 'f2', label: 'Suivi de production', statut: 'idee' },
        { id: 'f3', label: 'Gestion des stocks', statut: 'idee' },
        { id: 'f4', label: 'Réservation en ligne', statut: 'idee' },
        { id: 'f5', label: 'Programme de fidélité', statut: 'idee' },
      ],
    },
    // Ces champs reflètent EXACTEMENT les questions et valeurs du vrai
    // questionnaire envoyé aux boulangeries (formulaire-besoins-boulangeries.html,
    // déployé séparément sur Vercel) — les noms et options doivent rester
    // synchronisés avec ce fichier pour que les réponses reçues via
    // /api/boulangerie-reponses s'affichent et se comptabilisent correctement
    // ici (onglet "Prospection").
    prospectFields: [
      { name: 'role', label: 'Votre rôle', type: 'single', options: ['Vendeuse', 'Pâtissier / production', 'Gérant·e'] },
      { name: 'appareil', label: 'Appareil principal utilisé pour les commandes', type: 'single', options: ['Téléphone', 'Tablette', 'Ordinateur'] },
      { name: 'canal_commande', label: "Comment une commande arrive-t-elle chez vous aujourd'hui ?", type: 'multi', options: ["En boutique à l'oral", 'Par téléphone', 'Par SMS / WhatsApp', 'Via réseaux sociaux ou site'] },
      { name: 'transmission_process', label: 'Comment la commande est-elle transmise à la production ?', type: 'single', options: ['Cahier papier', 'Message WhatsApp', 'Affichage papier en labo', 'De vive voix'] },
      { name: 'acompte', label: 'Un acompte est-il généralement demandé ?', type: 'single', options: ['Oui', 'Non'] },
      { name: 'delai_commande', label: 'Délai de commande habituel', type: 'single', options: ['Le jour même', '1 à 2 jours', '3 à 7 jours', "Plus d'une semaine", 'Ça varie beaucoup'] },
      { name: 'suivi_statut', label: 'Suivi fiable du statut des commandes ?', type: 'single', options: ['Oui, clairement', 'Oui, mais pas fiable', 'Non, pas de suivi'] },
      { name: 'suivi_statut_detail', label: '→ Précision sur le suivi', type: 'text' },
      { name: 'volume_commandes', label: 'Volume de commandes par semaine', type: 'single', options: ['Moins de 10', '10 à 30', '30 à 60', 'Plus de 60'] },
      { name: 'temps_perdu', label: 'Perd du temps à chercher une info sur une commande ?', type: 'single', options: ['Oui', 'Non'] },
      { name: 'temps_perdu_detail', label: '→ Exemple concret', type: 'text' },
      { name: 'commandes_oubliees', label: 'A déjà eu des commandes oubliées / découvertes trop tard ?', type: 'single', options: ['Oui', 'Non'] },
      { name: 'commandes_oubliees_detail', label: "→ Ce qui s'est passé", type: 'text' },
      { name: 'notifications', label: 'Des notifications automatiques seraient utiles ?', type: 'single', options: ['Oui', 'Non'] },
      { name: 'droits_role', label: 'Faut-il des droits différents selon les rôles ?', type: 'single', options: ['Oui', 'Non'] },
      { name: 'elements_essentiels', label: 'Informations indispensables sur une commande', type: 'multi', options: ['Nom & téléphone du client', 'Date & heure de retrait', 'Description précise du produit', 'Prix / acompte payé', 'Allergies ou consignes spéciales', 'Qui a pris la commande'] },
      { name: 'concept_reaction', label: 'Réaction au concept présenté', type: 'single', options: ['Oui, totalement', 'Plutôt oui', 'Pas vraiment', 'Il manque des choses importantes'] },
      { name: 'concept_avis', label: 'Ce qui est utile / ce qui manque', type: 'textarea' },
      { name: 'priorites', label: 'Fonctionnalités prioritaires (max 3)', type: 'multi', options: ["Vue d'ensemble en temps réel", 'Statut visuel des commandes', 'Historique client', 'Notifications', 'Recherche rapide', 'Statistiques'] },
      { name: 'fonctionnalite_ailleurs', label: "Fonctionnalité inspirée d'ailleurs", type: 'text' },
      { name: 'avis_libre', label: 'Remarque libre', type: 'textarea' },
      { name: 'test_partant', label: 'Partant·e pour tester une version ?', type: 'single', options: ['Oui', 'Peut-être', 'Non'] },
      { name: 'contact_nom', label: 'Nom', type: 'text' },
    ],
  },
}

export const ROADMAP_STATUTS = [
  { key: 'idee', label: 'Idée', color: '#a89b8c' },
  { key: 'a_faire', label: 'À faire', color: '#a89b8c' },
  { key: 'en_cours', label: 'En cours', color: '#241512' },
  { key: 'test', label: 'Test', color: '#b8860b' },
  { key: 'termine', label: 'Terminé', color: '#1e7a4c' },
]
