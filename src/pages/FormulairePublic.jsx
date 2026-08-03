import { useState, useRef } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import useStore from '../store/useStore'
import { buildClientFromForm } from '../utils/buildClientFromForm'

const FORM_FIELDS = [
  { section: 'Votre entreprise', mobileTitle: 'Vous', short: 'Qui vous êtes', subtitle: 'Quelques informations pour vous identifier et vous recontacter.', fields: [
    { label: 'Nom de votre entreprise / marque *', name: 'nomEntreprise', type: 'text', placeholder: 'Ex : SC Création', required: true },
    { label: 'Adresse e-mail *', name: 'email', type: 'email', placeholder: 'contact@votreentreprise.fr', required: true },
    { label: 'Numéro de téléphone *', name: 'telephone', type: 'tel', placeholder: '06 00 00 00 00', required: true },
    { label: "Quel est votre secteur d'activité ? *", name: 'secteurActivite', type: 'select', required: true, options: ['Mode & Vêtements', 'Beauté & Cosmétiques', 'Alimentation & Restauration', 'Sport & Bien-être', 'Maison & Décoration', 'Art & Artisanat', 'High-Tech & Informatique', 'Services aux entreprises (B2B)', 'Santé & Médical', 'Éducation & Formation', 'Immobilier', 'Événementiel', 'Conseil & Coaching', 'Autre'] },
    { label: 'Avez-vous déjà un site web ?', name: 'aSiteWeb', type: 'tags', options: ['Non, pas encore', "Oui, j'en ai un"] },
    { label: 'Adresse de votre site actuel', name: 'siteActuel', type: 'text', placeholder: 'https://... — adresse de votre site actuel', showIf: v => v.aSiteWeb === "Oui, j'en ai un" },
  ]},
  { section: 'Votre projet', mobileTitle: 'Projet', short: 'Votre vision', subtitle: 'Parlez-nous de votre projet et de vos objectifs.', fields: [
    { label: "Racontez-nous l'histoire de votre marque *", name: 'histoire', type: 'textarea', placeholder: "D'où vient votre idée ? Quelle est votre histoire ?", required: true },
    { label: 'Quels sont vos produits ou services ? *', name: 'produits', type: 'textarea', placeholder: 'Décrivez vos produits / services', required: true },
    { label: 'Quel est votre objectif principal pour ce site ? *', name: 'objectif', type: 'tags', required: true, options: ['Vente en ligne (e-commerce)', 'Vitrine / présentation', 'Prise de rendez-vous', 'Portfolio', 'Autre'] },
    { label: 'Qui sont vos principaux concurrents (direct ou indirect)', name: 'concurrents', type: 'textarea', placeholder: 'Ex : marque A, marque B…' },
  ]},
  { section: 'Votre contenu & identité', mobileTitle: 'Contenu & identité', short: 'Contenu & marque', subtitle: 'Votre contenu et votre identité visuelle actuels.', fields: [
    { label: 'Avez-vous du contenu prêt ? (textes, photos, vidéos)', name: 'contenuPret', type: 'tags', options: ['Oui, tout est prêt', 'Partiellement', 'Non, pas encore'] },
    { label: 'Souhaitez-vous un formulaire de contact sur votre site ?', name: 'formulaireContact', type: 'tags', options: ['Oui', 'Non', 'Je ne sais pas encore'] },
    { label: 'Quelle est votre cible ?', name: 'cible', type: 'text', placeholder: 'Ex : 18-24 ans, femmes, professionnels…' },
    { label: 'Avez-vous déjà un nom de domaine ?', name: 'nomDomaine', type: 'tags', options: ['Oui', 'Non'] },
    { label: 'Avez-vous déjà un logo / charte graphique ?', name: 'logoCharte', type: 'tags', options: ["Oui", 'Non, pas encore', 'En cours'] },
    { label: 'Des sites qui vous inspirent ?', name: 'sitesInspirants', type: 'textarea', placeholder: 'Liens ou noms de sites que vous aimez' },
  ]},
  {
    section: 'Budget & délais',
    mobileTitle: 'Budget',
    short: 'Budget',
    subtitle: 'Pour vous proposer un accompagnement réaliste et adapté.',
    banner: "Nos tarifs démarrent à partir d'un montant selon le type de prestation — le prix final dépend toujours de votre besoin réel.",
    fields: [
      {
        label: 'Vers quelle prestation vous orientez-vous ? *', name: 'budget', type: 'cards', required: true,
        options: [
          { value: 'Landing page', title: 'Landing page', price: 'à partir de 950 € HT', desc: "Une page unique, jusqu'à 7 sections" },
          { value: 'Site vitrine', title: 'Site vitrine', price: 'à partir de 1 900 € HT', desc: "Jusqu'à 5 pages, univers visuel personnalisé" },
          { value: 'E-commerce Shopify', title: 'E-commerce Shopify', price: 'à partir de 2 500 € HT', desc: "Boutique sur mesure, jusqu'à 10 produits" },
          { value: 'Je ne sais pas encore', title: 'Je ne sais pas encore précisément', desc: "On identifie le bon format ensemble lors de l'appel de découverte" },
        ],
      },
      { label: 'Date de lancement souhaitée', name: 'dateButoir', type: 'text', placeholder: 'Ex : dans 1 mois' },
      { label: 'Des demandes spécifiques ou fonctionnalités souhaitées ?', name: 'demandesSpecifiques', type: 'textarea', placeholder: 'Multilingue, blog, réservation en ligne…' },
    ],
  },
  {
    section: 'Pour finir',
    short: 'Derniers détails',
    title: 'Un dernier mot ?',
    subtitle: 'Tout élément qui nous aiderait à mieux préparer notre échange.',
    fields: [
      { label: 'Sur quel réseau nous avez-vous contactés ? *', name: 'reseauContact', type: 'tags', required: true, options: ['Instagram', 'TikTok', 'Bouche à oreille', 'Google', 'Autre'] },
      { label: 'Votre pseudo sur ce réseau', name: 'pseudoReseau', type: 'text', placeholder: 'Ex : @votrepseudo', showIf: v => v.reseauContact === 'Instagram' || v.reseauContact === 'TikTok' },
      { label: 'Remarques ou précisions', name: 'remarques', type: 'textarea', placeholder: 'Toute information utile à partager avant notre appel de découverte…' },
    ],
  },
]

const initialValues = Object.fromEntries(
  FORM_FIELDS.flatMap(s => s.fields).map(f => [f.name, ''])
)

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

function CardSelect({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {options.map(o => {
        const selected = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(selected ? '' : o.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              width: '100%',
              textAlign: 'left',
              padding: '18px 20px',
              borderRadius: '16px',
              border: selected ? '1.5px solid #1b0b09' : '1.5px solid #e8e0cc',
              background: selected ? '#fcf7cf' : '#fdfbf4',
              cursor: 'pointer',
              transition: 'all .15s ease',
            }}
          >
            <div>
              <p style={{ margin: 0, fontFamily: '"Playfair Display", "Times New Roman", serif', fontSize: '18px', fontWeight: 700, color: '#1b0b09' }}>
                {o.title}
                {o.price && <span style={{ marginLeft: '10px', fontFamily: '"DM Sans", sans-serif', fontWeight: 500, fontSize: '14px', color: '#7e7e7e' }}>{o.price}</span>}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#7e7e7e' }}>{o.desc}</p>
            </div>
            <div
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
          </button>
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
  fontSize: '14px',
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
  const [step, setStep] = useState(0)
  const progressRef = useRef(null)

  const isLastStep = step === FORM_FIELDS.length - 1

  const scrollToProgress = () => {
    progressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const set = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }))
  }

  const validateFields = (fields) => {
    const newErrors = {}
    fields.forEach(f => {
      if (f.required && !values[f.name]?.trim()) newErrors[f.name] = true
    })
    return newErrors
  }

  const handleNext = () => {
    const stepErrors = validateFields(FORM_FIELDS[step].fields)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...stepErrors }))
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setStep(s => s + 1)
    scrollToProgress()
  }

  const handlePrevious = () => {
    setStep(s => s - 1)
    scrollToProgress()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const stepErrors = validateFields(FORM_FIELDS[step].fields)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...stepErrors }))
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    addFormReponse(values)
    addClient(buildClientFromForm(values))
    setSubmitted(true)
    setLoading(false)
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
            Merci pour votre demande
          </h2>
          <p style={{ fontSize: '14px', color: '#5a4a46', lineHeight: 1.7 }}>
            Nous avons bien reçu votre formulaire. L'équipe SC Création vous recontactera
            dans les <strong>24 heures</strong> pour discuter de votre projet.
          </p>
          <div style={{ marginTop: '32px', padding: '16px', background: '#fcf7cf', borderRadius: '2px' }}>
            <p style={{ fontSize: '11px', fontFamily: '"Anton", sans-serif', letterSpacing: '.08em', color: '#1b0b09', marginBottom: '2px' }}>SC CRÉATION</p>
            <p style={{ fontSize: '12px', color: '#7e7e7e' }}>Création de sites web</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fdfbf4', fontFamily: '"DM Sans", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: '48px 16px 32px', textAlign: 'center', borderBottom: '1px solid rgba(27,11,9,.07)' }}>
        <p style={{ fontFamily: '"Anton", sans-serif', fontSize: '11px', letterSpacing: '.14em', color: '#b8a508', marginBottom: '12px' }}>SC CRÉATION</p>
        <h1 style={{ fontFamily: '"Playfair Display", "Times New Roman", serif', fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 700, color: '#1b0b09', lineHeight: 1.2, marginBottom: '10px' }}>
          Formulaire de prise en charge
        </h1>
        <p style={{ fontSize: '14px', color: '#7e7e7e' }}>Création de site web sur mesure</p>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 16px 80px' }}>
        {/* Intro */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: '#fff', border: '1px solid #e8e0cc', borderRadius: '14px', padding: '20px 24px', marginBottom: '32px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1.5px solid #b8a508', color: '#b8a508', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>!</div>
          <p style={{ fontSize: '14px', color: '#5a4a46', lineHeight: 1.8, margin: 0 }}>
            Bienvenue ! Pour mieux comprendre votre projet et vous proposer un accompagnement personnalisé,
            merci de remplir ce formulaire — <strong style={{ color: '#1b0b09' }}>ça prend environ 5 minutes</strong>. Les champs marqués d'un <strong style={{ color: '#1b0b09' }}>*</strong> sont obligatoires.
          </p>
        </div>

        {/* Mobile horizontal stepper */}
        <div className="flex lg:hidden" style={{ flexDirection: 'column', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {FORM_FIELDS.map((s, i) => {
              const isDone = i < step
              const isActive = i === step
              return (
                <div key={s.section} style={{ display: 'flex', alignItems: 'center', flex: i < FORM_FIELDS.length - 1 ? 1 : 'none' }}>
                  <div
                    style={{
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
                    {isDone ? <CheckCircle2 size={12} /> : i + 1}
                  </div>
                  {i < FORM_FIELDS.length - 1 && (
                    <div style={{ height: '1.5px', flex: 1, background: isDone ? '#1b0b09' : '#e8e0cc', transition: 'background .25s ease' }} />
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '6px' }}>
            {FORM_FIELDS.map((s, i) => {
              const isDone = i < step
              const isActive = i === step
              return (
                <div key={s.section} style={{ flex: i < FORM_FIELDS.length - 1 ? 1 : 'none', width: i === FORM_FIELDS.length - 1 ? '24px' : undefined, textAlign: 'center' }}>
                  <p style={{ fontSize: '10.5px', fontWeight: 600, color: isActive || isDone ? '#1b0b09' : '#a89b8c', margin: 0, padding: '0 1px', lineHeight: 1.25, transition: 'color .2s ease' }}>
                    {s.mobileTitle || s.section}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div ref={progressRef} className="lg:flex lg:items-start lg:gap-12" style={{ scrollMarginTop: '16px' }}>
          {/* Desktop step list */}
          <div className="hidden lg:flex" style={{ flexDirection: 'column', width: '230px', flexShrink: 0, paddingTop: '4px' }}>
            {FORM_FIELDS.map((s, i) => {
              const isDone = i < step
              const isActive = i === step
              return (
                <div key={s.section} style={{ display: 'flex', gap: '14px' }}>
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
                      {isDone ? <CheckCircle2 size={16} /> : i + 1}
                    </div>
                    {i < FORM_FIELDS.length - 1 && (
                      <div style={{ width: '1.5px', flex: 1, minHeight: '38px', background: isDone ? '#1b0b09' : '#e8e0cc', transition: 'background .25s ease' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: '30px' }}>
                    <p style={{ fontSize: '14.5px', fontWeight: 700, color: isActive || isDone ? '#1b0b09' : '#a89b8c', margin: 0, transition: 'color .2s ease' }}>
                      {s.section}
                    </p>
                    <p style={{ fontSize: '12.5px', color: '#a89b8c', margin: '2px 0 0' }}>{s.short}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ flex: 1, minWidth: 0 }}>
            {(() => {
              const { section, title, subtitle, banner, fields } = FORM_FIELDS[step]
              return (
                <div style={{ background: '#fff', border: '1px solid #e8e0cc', borderRadius: '18px', padding: '32px', boxShadow: '0 1px 4px rgba(27,11,9,.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <p style={{ fontFamily: '"Anton", sans-serif', fontSize: '11px', letterSpacing: '.12em', color: '#b8a508', margin: 0, textTransform: 'uppercase' }}>
                      Étape {step + 1} / {FORM_FIELDS.length}
                    </p>
                    <p className="hidden lg:block" style={{ fontSize: '12.5px', color: '#a89b8c', margin: 0 }}>{section}</p>
                  </div>
                  <h2 style={{ fontFamily: '"Playfair Display", "Times New Roman", serif', fontSize: '26px', fontWeight: 700, color: '#1b0b09', margin: '0 0 6px' }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {fields.filter(f => !f.showIf || f.showIf(values)).map(({ label, name, type, placeholder, options, required }) => (
                      <div key={name} data-error={errors[name] ? 'true' : 'false'}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1b0b09', marginBottom: '8px' }}>
                          {label}
                          {errors[name] && <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 400, color: '#b8a508' }}>Champ requis</span>}
                        </label>
                        {type === 'tags' ? (
                          <TagSelect
                            options={options}
                            value={values[name]}
                            onChange={v => set(name, v)}
                            hasError={!!errors[name]}
                          />
                        ) : type === 'cards' ? (
                          <CardSelect
                            options={options}
                            value={values[name]}
                            onChange={v => set(name, v)}
                          />
                        ) : type === 'textarea' ? (
                          <textarea
                            rows={3}
                            placeholder={placeholder}
                            value={values[name]}
                            onChange={e => set(name, e.target.value)}
                            style={{ ...(errors[name] ? textareaError : textareaBase), resize: 'vertical' }}
                            onFocus={e => { e.target.style.borderColor = '#b8a508'; e.target.style.boxShadow = '0 0 0 4px rgba(184,165,8,.15)' }}
                            onBlur={e => { e.target.style.borderColor = errors[name] ? '#b8a508' : '#e8e0cc'; e.target.style.boxShadow = 'none' }}
                          />
                        ) : type === 'select' ? (
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
                        ) : (
                          <input
                            type={type}
                            placeholder={placeholder}
                            value={values[name]}
                            onChange={e => set(name, e.target.value)}
                            style={errors[name] ? inputError : inputBase}
                            onFocus={e => { e.target.style.borderColor = '#b8a508'; e.target.style.boxShadow = '0 0 0 4px rgba(184,165,8,.15)' }}
                            onBlur={e => { e.target.style.borderColor = errors[name] ? '#b8a508' : '#e8e0cc'; e.target.style.boxShadow = 'none' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {isLastStep && (
                    <p style={{ fontSize: '12.5px', color: '#7e7e7e', margin: '20px 0 0' }}>
                      ✓ Réponse sous 24h &nbsp;·&nbsp; ✓ Sans engagement &nbsp;·&nbsp; ✓ Vos données restent confidentielles
                    </p>
                  )}

                  <div style={{ height: '1px', background: '#e8e0cc', margin: '30px 0 24px' }} />

                  {/* Navigation */}
                  <div style={{ display: 'flex', justifyContent: step > 0 ? 'space-between' : 'flex-end', gap: '12px' }}>
                    {step > 0 && (
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
              )
            })()}
          </form>
        </div>
      </div>
    </div>
  )
}
