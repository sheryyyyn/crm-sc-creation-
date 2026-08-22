import { useState, useRef, useEffect, useMemo } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, MessageCircle, Mail } from 'lucide-react'
import useStore from '../store/useStore'
import { buildClientFromForm } from '../utils/buildClientFromForm'

// ─── Options de l'objectif principal, selon l'existence d'un site ──────────
const OBJECTIF_OPTIONS_SANS_SITE = [
  { value: 'Présenter mon entreprise et mes services', title: 'Présenter mon entreprise et mes services', desc: 'Faire découvrir mon activité, mon histoire, mes services ou mes réalisations.' },
  { value: 'Vendre mes produits en ligne', title: 'Vendre mes produits en ligne', desc: 'Permettre aux visiteurs de consulter, commander et payer mes produits sur le site.' },
  { value: 'Mettre en avant une offre ou un événement précis', title: 'Mettre en avant une offre ou un événement précis', desc: 'Présenter une offre et guider les visiteurs vers une action principale.' },
  { value: 'Recueillir des inscriptions avant un lancement', title: 'Recueillir des inscriptions avant un lancement', desc: 'Faire découvrir un futur projet et constituer une liste de personnes intéressées.' },
]
const OBJECTIF_OPTIONS_AVEC_SITE = [
  { value: 'Refaire ou améliorer mon site actuel', title: 'Refaire ou améliorer mon site actuel' },
  ...OBJECTIF_OPTIONS_SANS_SITE,
]

// ─── Champs "contenu & identité" génériques (tous les parcours sauf refonte) ─
function champsContenuGeneriques(hasSite) {
  const base = [
    { label: 'Avez-vous du contenu prêt ? (textes, photos, vidéos)', name: 'contenuPret', type: 'tags', options: ['Oui, tout est prêt', 'Partiellement', 'Non, pas encore'] },
    { label: 'Avez-vous déjà une charte graphique (logo, couleurs, typographies) ?', name: 'logoCharte', type: 'tags', options: ["Oui", 'Non, pas encore', 'En cours'] },
  ]
  if (!hasSite) {
    base.push({ label: 'Avez-vous déjà un nom de domaine ?', name: 'nomDomaine', type: 'tags', options: ['Oui', 'Non'] })
  }
  base.push({ label: 'Qui sont vos principaux concurrents qui vous inspirent (direct ou indirect)', name: 'concurrents', type: 'textarea', placeholder: 'Ex : marque A, marque B…' })
  return base
}

// ─── Champs "contenu & identité" spécifiques au parcours refonte ────────────
const CHAMPS_CONTENU_REFONTE = [
  { label: 'Souhaitez-vous conserver les contenus de votre site actuel ?', name: 'refonteContenuConserver', type: 'tags', options: ['Oui, en grande partie', 'Seulement certains textes ou visuels', 'Non, je souhaite repartir sur de nouveaux contenus', 'Je ne sais pas encore'] },
  { label: 'Souhaitez-vous conserver votre identité visuelle actuelle ?', name: 'refonteIdentiteConserver', type: 'tags', options: ['Oui, je souhaite la conserver', 'Je souhaite la faire évoluer', 'Je souhaite la changer complètement', "Je n'ai pas de charte graphique définie", 'Je ne sais pas encore'] },
  { label: 'Que souhaitez-vous principalement améliorer ?', name: 'refonteAmeliorations', type: 'multitags', options: ['Le design', 'La clarté des informations', "L'expérience sur mobile", 'Le parcours utilisateur', 'Les performances', 'Les ventes ou les prises de contact', 'Les fonctionnalités', 'Autre'] },
  { label: 'Précisez', name: 'refonteAmeliorationsAutre', type: 'text', placeholder: 'Précisez ce que vous souhaitez améliorer…', showIf: v => (v.refonteAmeliorations || []).includes('Autre') },
]

// ─── Construit dynamiquement le parcours selon les réponses du prospect ─────
// (existence d'un site, avancement du projet, objectif principal). Chaque
// étape porte une `key` stable — c'est elle qui sert de repère de navigation,
// pas un index numérique, pour que "Précédent"/"Continuer" retombent toujours
// sur la bonne étape même quand des pages apparaissent ou disparaissent.
function getSteps(values) {
  const hasSite = values.aSiteWeb === "Oui, j'en ai un"
  const isIdee = values.etatProjet === "Je suis encore au stade de l'idée"
  const isRefonte = values.objectif === 'Refaire ou améliorer mon site actuel'
  const showContenu = isRefonte || !isIdee

  const steps = [
    {
      key: 'entreprise', section: 'Votre entreprise', mobileTitle: 'Vous', short: 'Qui vous êtes',
      subtitle: 'Quelques informations pour vous identifier et vous recontacter.',
      fields: [
        { label: 'Nom de votre entreprise / marque *', name: 'nomEntreprise', type: 'text', placeholder: 'Ex : SC Création', required: true },
        { label: 'Adresse e-mail *', name: 'email', type: 'email', placeholder: 'contact@votreentreprise.fr', required: true },
        { label: 'Numéro de téléphone *', name: 'telephone', type: 'tel', placeholder: '06 00 00 00 00', required: true },
        { label: "Quel est votre secteur d'activité ? *", name: 'secteurActivite', type: 'select', required: true, options: ['Mode & Vêtements', 'Beauté & Cosmétiques', 'Alimentation & Restauration', 'Sport & Bien-être', 'Maison & Décoration', 'Art & Artisanat', 'High-Tech & Informatique', 'Services aux entreprises (B2B)', 'Santé & Médical', 'Éducation & Formation', 'Immobilier', 'Événementiel', 'Conseil & Coaching', 'Autre'] },
        { label: 'Avez-vous déjà un site web ?', name: 'aSiteWeb', type: 'tags', options: ['Non, pas encore', "Oui, j'en ai un"] },
        { label: 'Quelle est l\'adresse de votre site actuel ? *', name: 'siteActuel', type: 'text', placeholder: 'https://www.votresite.fr', showIf: v => v.aSiteWeb === "Oui, j'en ai un", required: v => v.aSiteWeb === "Oui, j'en ai un" },
      ],
    },
  ]

  // La question d'avancement ("stade de l'idée" / "activité déjà lancée"...)
  // n'a de sens que pour un projet qui n'existe pas encore — un prospect qui
  // a déjà un site est par définition à un stade avancé, on ne la pose pas.
  if (!hasSite) {
    steps.push({
      key: 'avancement', section: 'Votre projet', mobileTitle: 'Projet', short: 'Où vous en êtes',
      subtitle: "Parlez-nous de l'avancement de votre projet.",
      fields: [
        {
          label: 'Où en est concrètement votre projet aujourd\'hui ? *', name: 'etatProjet', type: 'cards', required: true,
          options: [
            { value: "Je suis encore au stade de l'idée", title: "Je suis encore au stade de l'idée", desc: "Mon offre et mon positionnement ne sont pas encore définis." },
            { value: 'Mon projet est en cours de préparation', title: 'Mon projet est en cours de préparation', desc: 'Mon offre est définie et je prépare mon identité, mes contenus ou mes produits.' },
            { value: 'Mon lancement approche', title: 'Mon lancement approche', desc: 'Les éléments principaux sont validés et mon lancement est en préparation.' },
            { value: 'Mon activité est déjà lancée', title: 'Mon activité est déjà lancée', desc: 'Je commercialise déjà mes produits ou mes services.' },
            { value: 'Autre', title: 'Autre' },
          ],
        },
        { label: 'Précisez', name: 'etatProjetAutre', type: 'text', placeholder: 'Décrivez où en est votre projet…', nestUnder: 'etatProjet', nestOptionValue: 'Autre' },
      ],
    })
  }

  steps.push(
    {
      key: 'presentation', section: 'Votre projet', mobileTitle: 'Projet', short: 'Votre vision',
      subtitle: 'Parlez-nous de votre projet et de vos objectifs.',
      fields: [
        { label: "Racontez-nous l'histoire de votre marque *", name: 'histoire', type: 'textarea', placeholder: "Comment est né votre projet ?\nQui se cache derrière la marque ?", required: true },
        { label: 'Quels sont vos produits ou services ? *', name: 'produits', type: 'textarea', placeholder: 'Décrivez vos produits / services', required: true },
        { label: 'Quelle est votre cible ?', name: 'cible', type: 'text', placeholder: 'Ex : 18-24 ans, femmes, professionnels…' },
        {
          label: hasSite ? 'À quelle période souhaitez-vous que votre nouveau site soit en ligne ?' : 'À quelle période souhaitez-vous que votre site soit mis en ligne ?',
          name: 'periodeMiseEnLigne', type: 'tags', options: ['Dès que possible', 'Dans 1 à 3 mois', 'Dans plus de 3 mois', "Je n'ai pas encore de date précise"],
        },
      ],
    },
    {
      key: 'objectif', section: 'Votre projet', mobileTitle: 'Projet', short: 'Votre objectif',
      fields: [
        {
          label: "Quel est l'objectif principal de votre projet ? *", name: 'objectif', type: 'cards', required: true,
          options: hasSite ? OBJECTIF_OPTIONS_AVEC_SITE : OBJECTIF_OPTIONS_SANS_SITE,
        },
        {
          label: 'Combien de produits souhaitez-vous vendre au lancement ? *', name: 'nombreProduits', type: 'select',
          options: ['1 à 10', '11 à 30', '31 à 50', 'Plus de 50', 'Je ne sais pas encore'],
          nestUnder: 'objectif', nestOptionValue: 'Vendre mes produits en ligne',
          required: v => v.objectif === 'Vendre mes produits en ligne',
        },
      ],
    },
  )

  if (showContenu) {
    steps.push({
      key: 'contenu', section: 'Votre contenu et identité', mobileTitle: 'Contenu et identité', short: 'Contenu et marque',
      subtitle: 'Votre contenu et votre identité visuelle actuels.',
      fields: isRefonte ? CHAMPS_CONTENU_REFONTE : champsContenuGeneriques(hasSite),
    })
  }

  steps.push({
    key: 'analyse', section: 'Analyse', mobileTitle: 'Analyse', short: 'Recommandation',
    title: 'Voici la prestation que nous vous recommandons',
    subtitle: "D'après vos réponses, cette solution semble être la plus adaptée à vos besoins.",
    fields: [
      { label: 'Des demandes spécifiques ou fonctionnalités souhaitées ?', name: 'demandesSpecifiques', type: 'textarea', placeholder: 'Multilingue, blog, réservation en ligne…' },
    ],
  })

  steps.push({
    key: 'finir', section: 'Pour finir', short: 'Derniers détails', title: 'Un dernier mot ?',
    subtitle: 'Tout élément qui nous aiderait à mieux préparer notre échange.',
    fields: [
      { label: 'Sur quel réseau nous avez-vous contactés ? *', name: 'reseauContact', type: 'tags', required: true, options: ['Instagram', 'TikTok', 'Bouche à oreille', 'Google', 'Autre'] },
      { label: 'Votre pseudo sur ce réseau', name: 'pseudoReseau', type: 'text', placeholder: 'Ex : @votrepseudo', showIf: v => v.reseauContact === 'Instagram' || v.reseauContact === 'TikTok' },
      { label: 'Remarques ou précisions', name: 'remarques', type: 'textarea', placeholder: 'Toute information utile à partager avant notre appel de découverte…' },
    ],
  })

  return steps
}

// Catalogue complet des champs (pour l'initialisation de l'état — toutes les
// valeurs existent dès le départ, même celles des parcours non empruntés).
const ARRAY_FIELDS = new Set(['refonteAmeliorations'])
const ALL_FIELD_NAMES = [
  'nomEntreprise', 'email', 'telephone', 'secteurActivite', 'aSiteWeb', 'siteActuel',
  'etatProjet', 'etatProjetAutre',
  'histoire', 'produits', 'cible', 'periodeMiseEnLigne',
  'objectif', 'nombreProduits',
  'contenuPret', 'nomDomaine', 'logoCharte', 'concurrents',
  'refonteContenuConserver', 'refonteIdentiteConserver', 'refonteAmeliorations', 'refonteAmeliorationsAutre',
  'demandesSpecifiques',
  'reseauContact', 'pseudoReseau', 'remarques',
]

const initialValues = {
  ...Object.fromEntries(ALL_FIELD_NAMES.map(name => [name, ARRAY_FIELDS.has(name) ? [] : ''])),
  moyenContact: '',
  // Prestation + tarif de départ recommandés (recalculés automatiquement,
  // voir l'effet sur values.objectif plus bas).
  budget: '',
  tarifRecommande: '',
}

// Champs conditionnels : dès qu'ils ne sont plus pertinents pour le parcours
// courant, on efface leur valeur pour ne jamais transmettre une réponse
// devenue incompatible avec le nouveau parcours (voir l'effet dédié plus bas).
function isFieldRelevant(name, values) {
  const hasSite = values.aSiteWeb === "Oui, j'en ai un"
  const isIdee = values.etatProjet === "Je suis encore au stade de l'idée"
  const isRefonte = values.objectif === 'Refaire ou améliorer mon site actuel'
  const showContenu = isRefonte || !isIdee
  switch (name) {
    case 'siteActuel': return hasSite
    case 'etatProjetAutre': return values.etatProjet === 'Autre'
    case 'nombreProduits': return values.objectif === 'Vendre mes produits en ligne'
    case 'contenuPret':
    case 'logoCharte':
    case 'concurrents':
      return showContenu && !isRefonte
    case 'nomDomaine':
      return showContenu && !isRefonte && !hasSite
    case 'refonteContenuConserver':
    case 'refonteIdentiteConserver':
    case 'refonteAmeliorations':
      return showContenu && isRefonte
    case 'refonteAmeliorationsAutre':
      return showContenu && isRefonte && (values.refonteAmeliorations || []).includes('Autre')
    case 'pseudoReseau':
      return values.reseauContact === 'Instagram' || values.reseauContact === 'TikTok'
    default:
      return true
  }
}
const CONDITIONAL_FIELDS = [
  'siteActuel', 'etatProjetAutre', 'nombreProduits',
  'contenuPret', 'logoCharte', 'concurrents', 'nomDomaine',
  'refonteContenuConserver', 'refonteIdentiteConserver', 'refonteAmeliorations', 'refonteAmeliorationsAutre',
  'pseudoReseau',
]

// Recommande une prestation à partir de la réponse à "Quel est l'objectif
// principal de votre projet ?" — `key` est stocké dans values.budget,
// exactement les valeurs déjà attendues par le CRM (voir BUDGET_INDICATIF
// dans src/pages/Formulaires.jsx).
function getRecommandation(objectif) {
  if (objectif === 'Présenter mon entreprise et mes services') {
    return {
      key: 'Site vitrine',
      titre: 'Site vitrine',
      prix: 'À partir de 1 900 € HT',
      texte: "Votre projet nécessite de présenter votre entreprise, vos services et votre univers. Le site vitrine permettra à vos visiteurs de comprendre ce que vous proposez, de découvrir vos réalisations et de vous contacter facilement.",
    }
  }
  if (objectif === 'Vendre mes produits en ligne') {
    return {
      key: 'E-commerce Shopify',
      titre: 'Site e-commerce Shopify',
      prix: 'À partir de 2 500 € HT',
      precision: 'Ce tarif est un point de départ. Le montant final dépendra notamment du volume du catalogue, du nombre de variantes et des fonctionnalités nécessaires.',
      texte: "Votre projet nécessite de présenter et de vendre vos produits en ligne. Le site e-commerce permettra à vos visiteurs de découvrir votre catalogue, de commander et de payer directement sur votre boutique.",
    }
  }
  if (objectif === 'Mettre en avant une offre ou un événement précis') {
    return {
      key: 'Landing page',
      titre: 'Landing page',
      prix: 'À partir de 950 € HT',
      texte: "Votre projet est centré sur une offre ou un événement précis. La landing page permettra de présenter clairement votre offre et de guider vos visiteurs vers une action principale.",
    }
  }
  if (objectif === 'Recueillir des inscriptions avant un lancement') {
    return {
      key: 'Landing page',
      titre: 'Landing page',
      prix: 'À partir de 950 € HT',
      texte: "Votre projet nécessite une page dédiée pour présenter votre futur lancement et recueillir les coordonnées des personnes intéressées.",
    }
  }
  if (objectif === 'Refaire ou améliorer mon site actuel') {
    return {
      key: 'Refonte de site existant',
      titre: 'Refonte de site existant',
      prix: 'Sur devis',
      texte: "Votre projet part d'un site existant qui a besoin d'être amélioré. La refonte permettra de retravailler son design, sa structure et son parcours pour mieux répondre à vos objectifs actuels.",
    }
  }
  return {
    key: 'Je ne sais pas encore',
    titre: 'Votre projet nécessite une analyse personnalisée',
    prix: null,
    texte: "Certaines informations nécessitent d'être approfondies afin de vous proposer la prestation la plus adaptée. Nous pourrons préciser votre besoin ensemble lors de l'appel découverte.",
  }
}

const ANALYSIS_STEPS = ['Analyse de votre besoin', 'Identification du format adapté', 'Préparation de votre recommandation']

// Styles injectés une fois : responsive mobile (cartes, stepper, conteneurs)
// sans toucher à la direction artistique ni au responsive desktop/tablette.
const RESPONSIVE_STYLES = `
  @media (max-width: 480px) {
    .sc-page-wrap { padding: 24px 12px 64px !important; }
    .sc-form-card { padding: 20px 16px !important; }
    .sc-card-inner { padding: 14px 14px !important; gap: 12px !important; }
    .sc-card-title { font-size: 15px !important; }
    .sc-card-desc { font-size: 12.5px !important; margin-top: 3px !important; line-height: 1.45 !important; }
    .sc-card-radio { width: 17px !important; height: 17px !important; }
    .sc-cards-wrap { gap: 9px !important; }
    .sc-step-circle-mobile { width: 20px !important; height: 20px !important; font-size: 10px !important; }
    .sc-step-label-mobile { font-size: 9.5px !important; }
    .sc-tag-btn { padding: 8px 13px !important; font-size: 12.5px !important; }
    .sc-h2-title { font-size: 21px !important; }
  }
`

function TagSelect({ options, value, onChange, hasError }) {
  if (options.length <= 2) {
    return (
      <div
        style={{
          display: 'inline-flex',
          border: `1.5px solid ${hasError ? '#b8a508' : '#e8e0cc'}`,
          borderRadius: '999px',
          padding: '3px',
          background: '#fdfbf4',
        }}
      >
        {options.map(o => {
          const selected = value === o
          return (
            <button
              key={o}
              type="button"
              className="sc-tag-btn"
              onClick={() => onChange(selected ? '' : o)}
              style={{
                padding: '10px 20px',
                borderRadius: '999px',
                border: 'none',
                background: selected ? '#1b0b09' : 'transparent',
                color: selected ? '#fcf7cf' : '#1b0b09',
                fontSize: '13.5px',
                fontFamily: '"DM Sans", sans-serif',
                cursor: 'pointer',
                transition: 'all .18s ease',
                fontWeight: selected ? 600 : 500,
              }}
            >
              {o}
            </button>
          )
        })}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map(o => {
        const selected = value === o
        return (
          <button
            key={o}
            type="button"
            className="sc-tag-btn"
            onClick={() => onChange(selected ? '' : o)}
            style={{
              padding: '9px 16px',
              border: selected ? '1.5px solid #1b0b09' : `1.5px solid ${hasError ? '#b8a508' : '#e8e0cc'}`,
              background: selected ? '#1b0b09' : '#fdfbf4',
              color: selected ? '#fcf7cf' : '#1b0b09',
              fontSize: '13px',
              fontFamily: '"DM Sans", sans-serif',
              cursor: 'pointer',
              transition: 'all .15s ease',
              fontWeight: selected ? 600 : 500,
              borderRadius: '999px',
            }}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

// Variante à choix multiples (checkboxes visuelles) — même style que TagSelect
// mais la valeur est un tableau ; utilisée pour "Que souhaitez-vous améliorer ?"
function MultiTagSelect({ options, value = [], onChange, hasError }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter(v => v !== o) : [...value, o])
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map(o => {
        const selected = value.includes(o)
        return (
          <button
            key={o}
            type="button"
            className="sc-tag-btn"
            onClick={() => toggle(o)}
            style={{
              padding: '9px 16px',
              border: selected ? '1.5px solid #1b0b09' : `1.5px solid ${hasError ? '#b8a508' : '#e8e0cc'}`,
              background: selected ? '#1b0b09' : '#fdfbf4',
              color: selected ? '#fcf7cf' : '#1b0b09',
              fontSize: '13px',
              fontFamily: '"DM Sans", sans-serif',
              cursor: 'pointer',
              transition: 'all .15s ease',
              fontWeight: selected ? 600 : 500,
              borderRadius: '999px',
            }}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

function CardSelect({ options, value, onChange, renderExtra }) {
  return (
    <div className="sc-cards-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {options.map(o => {
        const selected = value === o.value
        const extra = renderExtra && renderExtra(o.value)
        return (
          <div
            key={o.value}
            role="button"
            tabIndex={0}
            onClick={() => onChange(selected ? '' : o.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(selected ? '' : o.value) } }}
            style={{
              borderRadius: '16px',
              border: selected ? '1.5px solid #1b0b09' : '1.5px solid #e8e0cc',
              background: selected ? '#fcf7cf' : '#fdfbf4',
              cursor: 'pointer',
              transition: 'border-color .15s ease, background .15s ease',
            }}
          >
            <div className="sc-card-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '18px 20px' }}>
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <div className="flex flex-col lg:flex-row lg:items-baseline lg:gap-2.5">
                  <p className="sc-card-title" style={{ margin: 0, fontFamily: '"Playfair Display", "Times New Roman", serif', fontSize: '18px', fontWeight: 700, color: '#1b0b09' }}>
                    {o.title}
                  </p>
                  {o.price && <p style={{ margin: 0, fontFamily: '"DM Sans", sans-serif', fontWeight: 500, fontSize: '14px', color: '#7e7e7e' }}>{o.price}</p>}
                </div>
                {o.desc && <p className="sc-card-desc" style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#7e7e7e' }}>{o.desc}</p>}
              </div>
              <div
                className="sc-card-radio"
                style={{
                  flexShrink: 0,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: selected ? '6px solid #1b0b09' : '1.5px solid #d4c9b0',
                  background: '#fdfbf4',
                  transition: 'all .15s ease',
                }}
              />
            </div>
            {extra && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: selected ? '1fr' : '0fr',
                  opacity: selected ? 1 : 0,
                  transition: 'grid-template-rows .35s ease, opacity .25s ease',
                }}
              >
                <div style={{ overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                  <div style={{ padding: '16px 20px 18px', borderTop: '1px solid #e8dfc8' }}>
                    {extra}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const inputBase = {
  width: '100%',
  padding: '13px 18px',
  borderRadius: '999px',
  border: '1.5px solid #e8e0cc',
  background: '#fdfbf4',
  color: '#1b0b09',
  // 16px minimum : en dessous, Safari iOS zoome automatiquement la page au focus.
  fontSize: '16px',
  fontFamily: '"DM Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
  outline: 'none',
  transition: 'border-color .2s ease, box-shadow .2s ease',
}

const textareaBase = {
  ...inputBase,
  borderRadius: '20px',
}

const inputError = {
  ...inputBase,
  border: '1.5px solid #b8a508',
  background: '#fefce8',
}

const textareaError = {
  ...inputError,
  borderRadius: '20px',
}

export default function FormulairePublic() {
  const { addFormReponse, addClient } = useStore()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('entreprise')
  const [showContactPopup, setShowContactPopup] = useState(false)
  const [contactError, setContactError] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const progressRef = useRef(null)

  // Parcours recalculé à chaque changement des réponses qui le déterminent
  // (site existant, avancement, objectif) — jamais reconstruit "en dur".
  const steps = useMemo(() => getSteps(values), [values.aSiteWeb, values.etatProjet, values.objectif])
  const currentIndex = steps.findIndex(s => s.key === step)
  const safeIndex = currentIndex === -1 ? 0 : currentIndex
  const current = steps[safeIndex]
  const isLastStep = safeIndex === steps.length - 1

  // Regroupe les étapes consécutives qui partagent la même section (ex :
  // "Votre projet" sur 3 pages) pour n'afficher qu'une seule entrée de nav.
  const stepGroups = useMemo(() => steps.reduce((groups, s) => {
    const last = groups[groups.length - 1]
    if (last && last.section === s.section) { last.keys.push(s.key); last.shorts.push(s.short) }
    else groups.push({ section: s.section, mobileTitle: s.mobileTitle, shorts: [s.short], keys: [s.key] })
    return groups
  }, []), [steps])

  // Recalcule automatiquement la prestation recommandée à chaque changement
  // de l'objectif principal — y compris après un retour en arrière — et
  // l'enregistre dans le même champ `budget` qu'utilisait l'ancien choix
  // manuel de prestation.
  useEffect(() => {
    const reco = getRecommandation(values.objectif)
    setValues(prev => (prev.budget === reco.key && prev.tarifRecommande === (reco.prix || '')
      ? prev
      : { ...prev, budget: reco.key, tarifRecommande: reco.prix || '' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.objectif])

  // Si le prospect indique ne plus posséder de site alors qu'il avait
  // sélectionné "Refaire ou améliorer mon site actuel", cette sélection n'a
  // plus de sens : on l'efface et on l'oblige à choisir un autre objectif.
  useEffect(() => {
    if (values.aSiteWeb !== "Oui, j'en ai un" && values.objectif === 'Refaire ou améliorer mon site actuel') {
      setValues(prev => ({ ...prev, objectif: '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.aSiteWeb])

  // Efface toute réponse devenue non pertinente pour le parcours courant
  // (jamais transmise ni bloquante) — recalculé à chaque changement des
  // réponses qui déterminent le parcours.
  useEffect(() => {
    setValues(prev => {
      let changed = false
      const next = { ...prev }
      CONDITIONAL_FIELDS.forEach(name => {
        if (!isFieldRelevant(name, prev)) {
          const empty = ARRAY_FIELDS.has(name) ? [] : ''
          const isEmptyAlready = ARRAY_FIELDS.has(name) ? (prev[name] || []).length === 0 : !prev[name]
          if (!isEmptyAlready) { next[name] = empty; changed = true }
        }
      })
      return changed ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.aSiteWeb, values.etatProjet, values.objectif, values.reseauContact, values.refonteAmeliorations])

  const scrollToProgress = () => {
    progressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Petite animation d'analyse (~2s) jouée uniquement en entrant dans l'étape
  // "Analyse" (juste après "Votre contenu et identité" quand elle est
  // affichée, ou directement après "Votre projet" quand elle est masquée).
  // Aucun envoi de formulaire ni changement de step n'a lieu tant qu'elle tourne.
  const runAnalysisThenAdvance = (nextKey) => {
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setStep(nextKey)
      scrollToProgress()
      return
    }
    setAnalysisStep(0)
    setAnalyzing(true)
    const stepDelay = 620
    ANALYSIS_STEPS.forEach((_, i) => {
      setTimeout(() => setAnalysisStep(i + 1), stepDelay * (i + 1))
    })
    setTimeout(() => {
      setAnalyzing(false)
      setStep(nextKey)
      scrollToProgress()
    }, stepDelay * ANALYSIS_STEPS.length + 300)
  }

  const set = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }))
  }

  const validateFields = (fields) => {
    const newErrors = {}
    fields.forEach(f => {
      const required = typeof f.required === 'function' ? f.required(values) : f.required
      if (!required) return
      const v = values[f.name]
      const isEmpty = Array.isArray(v) ? v.length === 0 : !v?.trim()
      if (isEmpty) newErrors[f.name] = true
    })
    return newErrors
  }

  const renderFieldLabel = ({ label, name }) => (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1b0b09', marginBottom: '8px' }}>
      {label}
      {errors[name] && <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 400, color: '#b8a508' }}>Champ requis</span>}
    </label>
  )

  const renderFieldControl = ({ name, type, placeholder, options }) => {
    if (type === 'tags') {
      return <TagSelect options={options} value={values[name]} onChange={v => set(name, v)} hasError={!!errors[name]} />
    }
    if (type === 'multitags') {
      return <MultiTagSelect options={options} value={values[name]} onChange={v => set(name, v)} hasError={!!errors[name]} />
    }
    if (type === 'textarea') {
      return (
        <textarea
          rows={3}
          placeholder={placeholder}
          value={values[name]}
          onChange={e => set(name, e.target.value)}
          style={{ ...(errors[name] ? textareaError : textareaBase), resize: 'vertical' }}
          onFocus={e => { e.target.style.borderColor = '#b8a508'; e.target.style.boxShadow = '0 0 0 4px rgba(184,165,8,.15)' }}
          onBlur={e => { e.target.style.borderColor = errors[name] ? '#b8a508' : '#e8e0cc'; e.target.style.boxShadow = 'none' }}
        />
      )
    }
    if (type === 'select') {
      return (
        <select
          value={values[name]}
          onChange={e => set(name, e.target.value)}
          style={{ ...(errors[name] ? inputError : inputBase), appearance: 'auto' }}
          onFocus={e => { e.target.style.borderColor = '#b8a508'; e.target.style.boxShadow = '0 0 0 4px rgba(184,165,8,.15)' }}
          onBlur={e => { e.target.style.borderColor = errors[name] ? '#b8a508' : '#e8e0cc'; e.target.style.boxShadow = 'none' }}
        >
          <option value="">— Choisir —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    }
    return (
      <input
        type={type}
        placeholder={placeholder}
        value={values[name]}
        onChange={e => set(name, e.target.value)}
        style={errors[name] ? inputError : inputBase}
        onFocus={e => { e.target.style.borderColor = '#b8a508'; e.target.style.boxShadow = '0 0 0 4px rgba(184,165,8,.15)' }}
        onBlur={e => { e.target.style.borderColor = errors[name] ? '#b8a508' : '#e8e0cc'; e.target.style.boxShadow = 'none' }}
      />
    )
  }

  const handleNext = () => {
    const stepErrors = validateFields(current.fields)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...stepErrors }))
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const next = steps[safeIndex + 1]
    if (!next) return
    if (next.key === 'analyse') {
      runAnalysisThenAdvance(next.key)
      return
    }
    setStep(next.key)
    scrollToProgress()
  }

  const handlePrevious = () => {
    const prev = steps[safeIndex - 1]
    if (prev) setStep(prev.key)
    scrollToProgress()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const stepErrors = validateFields(current.fields)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...stepErrors }))
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setShowContactPopup(true)
  }

  const handleConfirmContact = async () => {
    if (!values.moyenContact) {
      setContactError(true)
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const formReponseId = addFormReponse(values)
    addClient(buildClientFromForm(values, formReponseId))
    setSubmitted(true)
    setLoading(false)
    setShowContactPopup(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: '#fdfbf4', fontFamily: '"DM Sans", sans-serif' }}>
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes popIn {
            0%   { opacity: 0; transform: scale(0.5); }
            70%  { transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes drawCheck {
            from { stroke-dashoffset: 40; }
            to   { stroke-dashoffset: 0; }
          }
          .sc-success-card { animation: fadeUp .55s cubic-bezier(.22,1,.36,1) both; }
          .sc-success-icon { animation: popIn .5s cubic-bezier(.22,1,.36,1) .15s both; }
          .sc-check-path   { stroke-dasharray: 40; animation: drawCheck .4s ease .55s both; }
        `}</style>
        <div className="sc-success-card" style={{ maxWidth: '440px', width: '100%', background: '#fff', border: '1px solid #e8e0cc', borderRadius: '2px', padding: '48px 40px', textAlign: 'center', boxShadow: '0 4px 32px rgba(27,11,9,.06)' }}>
          <div className="sc-success-icon" style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#1b0b09', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path className="sc-check-path" d="M8 16.5l6 6 10-11" stroke="#fcf7cf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 style={{ fontFamily: '"Playfair Display", "Times New Roman", serif', fontSize: '22px', fontWeight: 700, color: '#1b0b09', marginBottom: '12px' }}>
            Le formulaire a bien été transmis à notre équipe, merci !
          </h2>
          <div style={{ marginTop: '32px', padding: '16px', background: '#fcf7cf', borderRadius: '2px' }}>
            <p style={{ fontSize: '11px', fontFamily: '"Anton", sans-serif', letterSpacing: '.08em', color: '#1b0b09', marginBottom: '2px' }}>SC CRÉATION</p>
            <p style={{ fontSize: '12px', color: '#7e7e7e' }}>Création de sites web</p>
          </div>
        </div>
      </div>
    )
  }

  const { section, title, subtitle, banner, fields } = current

  return (
    <div style={{ minHeight: '100vh', background: '#fdfbf4', fontFamily: '"DM Sans", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
      <style>{RESPONSIVE_STYLES}</style>

      {/* Header */}
      <div style={{ padding: '48px 16px 32px', textAlign: 'center', borderBottom: '1px solid rgba(27,11,9,.07)' }}>
        <p style={{ fontFamily: '"Anton", sans-serif', fontSize: '11px', letterSpacing: '.14em', color: '#b8a508', marginBottom: '12px' }}>SC CRÉATION</p>
        <h1 style={{ fontFamily: '"Playfair Display", "Times New Roman", serif', fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 700, color: '#1b0b09', lineHeight: 1.2, marginBottom: '10px' }}>
          Formulaire de prise en charge
        </h1>
        <p style={{ fontSize: '14px', color: '#7e7e7e' }}>Création de site web sur mesure</p>
      </div>

      <div className="sc-page-wrap" style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 16px 80px' }}>
        {/* Intro */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: '#fff', border: '1px solid #e8e0cc', borderRadius: '14px', padding: '20px 24px', marginBottom: '32px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1.5px solid #b8a508', color: '#b8a508', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>!</div>
          <p style={{ fontSize: '14px', color: '#5a4a46', lineHeight: 1.8, margin: 0 }}>
            Bienvenue ! Pour mieux comprendre votre projet et vous proposer un accompagnement personnalisé,
            merci de remplir ce formulaire — <strong style={{ color: '#1b0b09' }}>ça prend environ 5 minutes</strong>. Les champs marqués d'un <strong style={{ color: '#1b0b09' }}>*</strong> sont obligatoires.
          </p>
        </div>

        {/* Mobile horizontal stepper — une entrée par groupe de sections */}
        <div className="grid lg:hidden" style={{ gridTemplateColumns: `repeat(${stepGroups.length}, 1fr)`, marginBottom: '28px' }}>
          {stepGroups.map((g, gi) => {
            const lastKeyIdx = steps.findIndex(s => s.key === g.keys[g.keys.length - 1])
            const isDone = safeIndex > lastKeyIdx
            const isActive = g.keys.includes(current.key)
            return (
              <div key={g.section} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {gi < stepGroups.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '50%',
                      width: '100%',
                      height: '1.5px',
                      background: isDone ? '#1b0b09' : '#e8e0cc',
                      transition: 'background .25s ease',
                      zIndex: 0,
                    }}
                  />
                )}
                <div
                  className="sc-step-circle-mobile"
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: '"DM Sans", sans-serif',
                    transition: 'all .2s ease',
                    background: isDone || isActive ? '#1b0b09' : '#fdfbf4',
                    color: isDone || isActive ? '#fcf7cf' : '#a89b8c',
                    border: isDone || isActive ? 'none' : '1.5px solid #e8e0cc',
                  }}
                >
                  {isDone ? <CheckCircle2 size={12} /> : gi + 1}
                </div>
                <p className="sc-step-label-mobile" style={{ fontSize: '10.5px', fontWeight: 600, color: isActive || isDone ? '#1b0b09' : '#a89b8c', margin: '6px 0 0', padding: '0 2px', textAlign: 'center', lineHeight: 1.25, transition: 'color .2s ease' }}>
                  {g.mobileTitle || g.section}
                </p>
              </div>
            )
          })}
        </div>

        <div ref={progressRef} className="lg:flex lg:items-start lg:gap-12" style={{ scrollMarginTop: '16px' }}>
          {/* Desktop step list */}
          <div className="hidden lg:flex" style={{ flexDirection: 'column', width: '230px', flexShrink: 0, paddingTop: '4px' }}>
            {stepGroups.map((g, gi) => {
              const lastKeyIdx = steps.findIndex(s => s.key === g.keys[g.keys.length - 1])
              const isDone = safeIndex > lastKeyIdx
              const isActive = g.keys.includes(current.key)
              return (
                <div key={g.section} style={{ display: 'flex', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily: '"DM Sans", sans-serif',
                        transition: 'all .2s ease',
                        background: isDone || isActive ? '#1b0b09' : '#fdfbf4',
                        color: isDone || isActive ? '#fcf7cf' : '#a89b8c',
                        border: isDone || isActive ? 'none' : '1.5px solid #e8e0cc',
                      }}
                    >
                      {isDone ? <CheckCircle2 size={16} /> : gi + 1}
                    </div>
                    {gi < stepGroups.length - 1 && (
                      <div style={{ width: '1.5px', flex: 1, minHeight: '38px', background: isDone ? '#1b0b09' : '#e8e0cc', transition: 'background .25s ease' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: '30px' }}>
                    <p style={{ fontSize: '14.5px', fontWeight: 700, color: isActive || isDone ? '#1b0b09' : '#a89b8c', margin: 0, transition: 'color .2s ease' }}>
                      {g.section}
                    </p>
                    <p style={{ fontSize: '12.5px', color: '#a89b8c', margin: '2px 0 0' }}>{g.shorts.join(' · ')}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ flex: 1, minWidth: 0 }}>
            {analyzing ? (
              <div className="sc-form-card" style={{ background: '#fff', border: '1px solid #e8e0cc', borderRadius: '18px', padding: '56px 32px', boxShadow: '0 1px 4px rgba(27,11,9,.04)', textAlign: 'center' }}>
                <style>{`
                  @keyframes sc-analysis-fill { from { width: 0%; } to { width: 100%; } }
                  @keyframes sc-analysis-pulse { 0%, 100% { opacity: .35; transform: scale(.85); } 50% { opacity: 1; transform: scale(1); } }
                  .sc-analysis-bar-fill { animation: sc-analysis-fill ${ANALYSIS_STEPS.length * 620 + 300}ms linear forwards; }
                  .sc-analysis-dot { animation: sc-analysis-pulse 1s ease-in-out infinite; }
                `}</style>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fcf7cf', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: '#b8a508' }} />
                </div>
                <h2 style={{ fontFamily: '"Playfair Display", "Times New Roman", serif', fontSize: '22px', fontWeight: 700, color: '#1b0b09', margin: '0 0 30px' }}>
                  Nous analysons vos réponses…
                </h2>
                <div style={{ maxWidth: '320px', margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {ANALYSIS_STEPS.map((label, i) => {
                    const done = analysisStep > i
                    const active = analysisStep === i
                    return (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: analysisStep >= i ? 1 : 0.35, transition: 'opacity .3s ease' }}>
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#1b0b09' : '#fdfbf4', border: done ? 'none' : '1.5px solid #e8e0cc' }}>
                          {done ? <CheckCircle2 size={11} color="#fcf7cf" /> : active ? <span className="sc-analysis-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#b8a508', display: 'block' }} /> : null}
                        </span>
                        <span style={{ fontSize: '13.5px', color: '#1b0b09', fontWeight: done || active ? 600 : 500 }}>{label}</span>
                      </div>
                    )
                  })}
                </div>
                <div style={{ maxWidth: '320px', margin: '26px auto 0', height: '4px', borderRadius: '999px', background: '#eee7d5', overflow: 'hidden' }}>
                  <div className="sc-analysis-bar-fill" style={{ height: '100%', background: '#1b0b09', borderRadius: '999px' }} />
                </div>
              </div>
            ) : (
              <div className="sc-form-card" style={{ background: '#fff', border: '1px solid #e8e0cc', borderRadius: '18px', padding: '32px', boxShadow: '0 1px 4px rgba(27,11,9,.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <p style={{ fontFamily: '"Anton", sans-serif', fontSize: '11px', letterSpacing: '.12em', color: '#b8a508', margin: 0, textTransform: 'uppercase' }}>
                    {(() => {
                      const gi = stepGroups.findIndex(g => g.keys.includes(current.key))
                      const group = stepGroups[gi]
                      const pageInGroup = group.keys.indexOf(current.key)
                      return group.keys.length > 1
                        ? `Étape ${gi + 1} / ${stepGroups.length} — page ${pageInGroup + 1}/${group.keys.length}`
                        : `Étape ${gi + 1} / ${stepGroups.length}`
                    })()}
                  </p>
                  <p className="hidden lg:block" style={{ fontSize: '12.5px', color: '#a89b8c', margin: 0 }}>{section}</p>
                </div>
                <h2 className="sc-h2-title" style={{ fontFamily: '"Playfair Display", "Times New Roman", serif', fontSize: '26px', fontWeight: 700, color: '#1b0b09', margin: '0 0 6px' }}>
                  {title || section}
                </h2>
                {subtitle && (
                  <p style={{ fontSize: '14px', color: '#7e7e7e', margin: '0 0 26px' }}>{subtitle}</p>
                )}
                {banner && (
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: '#fcf7cf', border: '1px solid #e8dfa8', borderRadius: '14px', padding: '18px 20px', marginBottom: '26px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid #b8a508', color: '#b8a508', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>!</div>
                    <p style={{ fontSize: '13.5px', color: '#8a7a1f', lineHeight: 1.7, margin: 0, fontWeight: 600 }}>{banner}</p>
                  </div>
                )}
                {section === 'Analyse' && (() => {
                  const reco = getRecommandation(values.objectif)
                  return (
                    <div style={{ border: '1.5px solid #1b0b09', borderRadius: '16px', padding: '24px 26px', marginBottom: '26px', background: '#fcf7cf' }}>
                      <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#8a7a1f', background: '#fff', border: '1px solid #e8dfa8', borderRadius: '999px', padding: '4px 10px', marginBottom: '14px' }}>
                        Recommandé pour votre projet
                      </span>
                      <div className="flex flex-col lg:flex-row lg:items-baseline lg:gap-3">
                        <h3 style={{ fontFamily: '"Playfair Display", "Times New Roman", serif', fontSize: '21px', fontWeight: 700, color: '#1b0b09', margin: 0 }}>{reco.titre}</h3>
                        {reco.prix && <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#7e7e7e' }}>{reco.prix}</p>}
                      </div>
                      <p style={{ fontSize: '14px', color: '#5a4a46', lineHeight: 1.7, margin: '12px 0 0' }}>{reco.texte}</p>
                      {reco.prix && (
                        <p style={{ fontSize: '12px', color: '#8a7a1f', margin: '14px 0 0' }}>
                          {reco.precision || 'Ce tarif est un point de départ. Le montant final dépendra des besoins précis de votre projet.'}
                        </p>
                      )}
                    </div>
                  )
                })()}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {fields.filter(f => !f.nestUnder && (!f.showIf || f.showIf(values))).map(field => {
                    const { name, type } = field
                    const nested = type === 'cards' ? fields.find(f => f.nestUnder === name) : null
                    return (
                      <div key={name} data-error={errors[name] ? 'true' : 'false'}>
                        {renderFieldLabel(field)}
                        {type === 'cards' ? (
                          <CardSelect
                            options={field.options}
                            value={values[name]}
                            onChange={v => set(name, v)}
                            renderExtra={nested ? (optValue => optValue === nested.nestOptionValue ? (
                              <div>
                                {renderFieldLabel(nested)}
                                {renderFieldControl(nested)}
                              </div>
                            ) : null) : undefined}
                          />
                        ) : renderFieldControl(field)}
                      </div>
                    )
                  })}
                </div>


                <div style={{ height: '1px', background: '#e8e0cc', margin: '30px 0 24px' }} />

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: safeIndex > 0 ? 'space-between' : 'flex-end', gap: '12px' }}>
                  {safeIndex > 0 && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      style={{
                        padding: '15px 24px',
                        background: '#fdfbf4',
                        color: '#1b0b09',
                        border: '1.5px solid #e8e0cc',
                        borderRadius: '999px',
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 600,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background .2s ease',
                      }}
                      onMouseEnter={e => { e.target.style.background = '#f2ecda' }}
                      onMouseLeave={e => { e.target.style.background = '#fdfbf4' }}
                    >
                      <ChevronLeft size={15} /> Précédent
                    </button>
                  )}

                  {isLastStep ? (
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        padding: '15px 26px',
                        background: '#1b0b09',
                        color: '#fcf7cf',
                        border: 'none',
                        borderRadius: '999px',
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 600,
                        fontSize: '13.5px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'background .2s ease',
                      }}
                      onMouseEnter={e => { if (!loading) e.target.style.background = '#322624' }}
                      onMouseLeave={e => { if (!loading) e.target.style.background = '#1b0b09' }}
                    >
                      {loading ? (
                        <><Loader2 size={15} className="animate-spin" />Envoi en cours…</>
                      ) : (
                        <>Envoyer le formulaire ✓</>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      style={{
                        padding: '15px 26px',
                        background: '#1b0b09',
                        color: '#fcf7cf',
                        border: 'none',
                        borderRadius: '999px',
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 600,
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background .2s ease',
                      }}
                      onMouseEnter={e => { e.target.style.background = '#322624' }}
                      onMouseLeave={e => { e.target.style.background = '#1b0b09' }}
                    >
                      Continuer <ChevronRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {showContactPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(27,11,9,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100,
          }}
          onClick={() => !loading && setShowContactPopup(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              width: '100%',
              background: '#fff',
              border: '1px solid #e8e0cc',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: '0 12px 48px rgba(27,11,9,.18)',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontFamily: '"Playfair Display", "Times New Roman", serif', fontSize: '22px', fontWeight: 700, color: '#1b0b09', margin: '0 0 6px' }}>
              Comment aimeriez-vous être recontacté ? *
            </h2>
            <p style={{ fontSize: '13.5px', color: '#7e7e7e', margin: '0 0 22px' }}>
              Dernière étape avant l'envoi de votre demande.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { value: 'Par SMS', icon: MessageCircle },
                { value: 'Par e-mail', icon: Mail },
              ].map(({ value, icon: Icon }) => {
                const selected = values.moyenContact === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { set('moyenContact', selected ? '' : value); setContactError(false) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '15px 20px',
                      borderRadius: '999px',
                      border: selected ? '1.5px solid #1b0b09' : `1.5px solid ${contactError ? '#b8a508' : '#e8e0cc'}`,
                      background: selected ? '#1b0b09' : '#fdfbf4',
                      color: selected ? '#fcf7cf' : '#1b0b09',
                      fontSize: '14px',
                      fontFamily: '"DM Sans", sans-serif',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all .15s ease',
                    }}
                  >
                    <Icon size={17} />
                    {value}
                  </button>
                )
              })}
            </div>
            {contactError && (
              <p style={{ fontSize: '12px', color: '#b8a508', margin: '8px 0 0', fontWeight: 600 }}>Merci de choisir une option</p>
            )}

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', background: '#fcf7cf', border: '1px solid #e8dfa8', borderRadius: '14px', padding: '18px 20px', marginTop: '24px', textAlign: 'left' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid #b8a508', color: '#b8a508', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>!</div>
              <p style={{ fontSize: '13.5px', color: '#8a7a1f', lineHeight: 1.7, margin: 0, fontWeight: 600 }}>
                Vérifiez bien votre boîte de réception, vous serez recontacté(e) sous 24-48h par Sheryn et Chainez.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConfirmContact}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '15px 26px',
                background: '#1b0b09',
                color: '#fcf7cf',
                border: 'none',
                borderRadius: '999px',
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background .2s ease',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = '#322624' }}
              onMouseLeave={e => { if (!loading) e.target.style.background = '#1b0b09' }}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" />Envoi en cours…</>
              ) : (
                <>Confirmer et envoyer ✓</>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowContactPopup(false)}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '13px 26px',
                background: 'transparent',
                color: '#7e7e7e',
                border: 'none',
                borderRadius: '999px',
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 600,
                fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'color .2s ease',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.color = '#1b0b09' }}
              onMouseLeave={e => { if (!loading) e.target.style.color = '#7e7e7e' }}
            >
              <ChevronLeft size={15} /> Retour au formulaire
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
