import { useState } from 'react'
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import useStore from '../store/useStore'
import { buildClientFromForm } from '../utils/buildClientFromForm'

const FORM_FIELDS = [
  { section: 'Votre entreprise', fields: [
    { label: 'Nom de votre entreprise / marque *', name: 'nomEntreprise', type: 'text', placeholder: 'Ex : SC Création', required: true },
    { label: 'Adresse e-mail *', name: 'email', type: 'email', placeholder: 'contact@votreentreprise.fr', required: true },
    { label: 'Numéro de téléphone *', name: 'telephone', type: 'tel', placeholder: '06 00 00 00 00', required: true },
    { label: "Quel est votre secteur d'activité ? *", name: 'secteurActivite', type: 'select', required: true, options: ['Mode & Vêtements', 'Beauté & Cosmétiques', 'Alimentation & Restauration', 'Sport & Bien-être', 'Maison & Décoration', 'Art & Artisanat', 'High-Tech & Informatique', 'Services aux entreprises (B2B)', 'Santé & Médical', 'Éducation & Formation', 'Immobilier', 'Événementiel', 'Conseil & Coaching', 'Autre'] },
    { label: 'Avez-vous déjà un site web ?', name: 'siteActuel', type: 'text', placeholder: 'https://... (laisser vide si non)' },
  ]},
  { section: 'Votre projet', fields: [
    { label: "Racontez-nous l'histoire de votre marque *", name: 'histoire', type: 'textarea', placeholder: "D'où vient votre idée ? Quelle est votre histoire ?", required: true },
    { label: 'Quels sont vos produits ou services ? *', name: 'produits', type: 'textarea', placeholder: 'Décrivez vos produits / services', required: true },
    { label: 'Quel est votre objectif principal pour ce site ? *', name: 'objectif', type: 'select', required: true, options: ['Vente en ligne (e-commerce)', 'Vitrine / présentation', 'Prise de rendez-vous', 'Portfolio', 'Autre'] },
    { label: 'Qui sont vos concurrents (sites que vous connaissez) ?', name: 'concurrents', type: 'textarea', placeholder: 'Ex : marque A, marque B…' },
  ]},
  { section: 'Votre contenu & identité', fields: [
    { label: 'Avez-vous du contenu prêt ? (textes, photos, vidéos)', name: 'contenuPret', type: 'select', options: ['Oui, tout est prêt', 'Partiellement', 'Non, pas encore'] },
    { label: 'Souhaitez-vous un formulaire de contact sur votre site ?', name: 'formulaireContact', type: 'select', options: ['Oui', 'Non', 'Je ne sais pas encore'] },
    { label: 'Quelle est votre cible ?', name: 'cible', type: 'text', placeholder: 'Ex : 18-24 ans, femmes, professionnels…' },
    { label: 'Avez-vous déjà un nom de domaine ?', name: 'nomDomaine', type: 'select', options: ['Oui', 'Non', 'Je ne sais pas'] },
    { label: 'Avez-vous déjà un logo / charte graphique ?', name: 'logoCharte', type: 'select', options: ["Oui", "Non, j'ai besoin d'aide", 'En cours'] },
    { label: 'Des sites qui vous inspirent ?', name: 'sitesInspirants', type: 'textarea', placeholder: 'Liens ou noms de sites que vous aimez' },
  ]},
  { section: 'Comment nous avez-vous trouvés ?', fields: [
    { label: 'Sur quel réseau nous avez-vous contactés ? *', name: 'reseauContact', type: 'select', required: true, options: ['Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'Pinterest', 'Bouche à oreille', 'Google', 'Autre'] },
    { label: 'Votre pseudo sur ce réseau *', name: 'pseudoReseau', type: 'text', placeholder: 'Ex : @votrepseudo', required: true },
  ]},
  { section: 'Budget & délais', fields: [
    { label: 'Quel est votre budget estimé ? *', name: 'budget', type: 'select', required: true, options: ['Moins de 300€', '300€ – 500€', '500€ – 800€', '800€ – 1200€', 'Plus de 1200€', 'À définir'] },
    { label: 'Avez-vous une date butoir ?', name: 'dateButoir', type: 'text', placeholder: 'Ex : fin juillet 2026, ou "pas de contrainte"' },
    { label: 'Des demandes spécifiques ou fonctionnalités souhaitées ?', name: 'demandesSpecifiques', type: 'textarea', placeholder: 'Multilingue, blog, réservation en ligne…' },
    { label: 'Remarques libres', name: 'remarques', type: 'textarea', placeholder: 'Tout ce que vous souhaitez nous dire…' },
  ]},
]

const initialValues = Object.fromEntries(
  FORM_FIELDS.flatMap(s => s.fields).map(f => [f.name, ''])
)

const inputBase = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '4px',
  border: '1px solid #d4c9b0',
  background: '#fdfbf4',
  color: '#1b0b09',
  fontSize: '14px',
  fontFamily: '"DM Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
  outline: 'none',
  transition: 'border-color .2s ease',
}

const inputError = {
  ...inputBase,
  border: '1px solid #b8a508',
  background: '#fefce8',
}

export default function FormulairePublic() {
  const { addFormReponse, addClient } = useStore()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }))
  }

  const validate = () => {
    const newErrors = {}
    FORM_FIELDS.flatMap(s => s.fields).forEach(f => {
      if (f.required && !values[f.name]?.trim()) newErrors[f.name] = true
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
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
        <div style={{ maxWidth: '440px', width: '100%', background: '#fff', border: '1px solid #e8e0cc', borderRadius: '2px', padding: '48px 40px', textAlign: 'center', boxShadow: '0 4px 32px rgba(27,11,9,.06)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1b0b09', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={26} color="#fcf7cf" />
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
            <p style={{ fontSize: '12px', color: '#7e7e7e' }}>Création de sites web & identité visuelle</p>
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

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 16px 80px' }}>
        {/* Intro */}
        <div style={{ background: '#fff', border: '1px solid #e8e0cc', borderRadius: '2px', padding: '24px 28px', marginBottom: '32px' }}>
          <p style={{ fontSize: '14px', color: '#5a4a46', lineHeight: 1.8, margin: 0 }}>
            Bienvenue ! Pour mieux comprendre votre projet et vous proposer un accompagnement personnalisé,
            merci de remplir ce formulaire. Les champs marqués d'un <strong style={{ color: '#1b0b09' }}>*</strong> sont obligatoires.
            Nous vous recontacterons sous <strong style={{ color: '#1b0b09' }}>24h</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {FORM_FIELDS.map(({ section, fields }) => (
              <div key={section} style={{ background: '#fff', border: '1px solid #e8e0cc', borderRadius: '2px', padding: '28px', boxShadow: '0 1px 4px rgba(27,11,9,.04)' }}>
                <h3 style={{ fontFamily: '"Anton", sans-serif', fontSize: '11px', letterSpacing: '.12em', color: '#b8a508', marginBottom: '24px', textTransform: 'uppercase' }}>
                  {section}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {fields.map(({ label, name, type, placeholder, options, required }) => (
                    <div key={name} data-error={errors[name] ? 'true' : 'false'}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1b0b09', marginBottom: '6px' }}>
                        {label}
                        {errors[name] && <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 400, color: '#b8a508' }}>Champ requis</span>}
                      </label>
                      {type === 'textarea' ? (
                        <textarea
                          rows={3}
                          placeholder={placeholder}
                          value={values[name]}
                          onChange={e => set(name, e.target.value)}
                          style={{ ...(errors[name] ? inputError : inputBase), resize: 'vertical' }}
                          onFocus={e => { e.target.style.borderColor = '#1b0b09' }}
                          onBlur={e => { e.target.style.borderColor = errors[name] ? '#b8a508' : '#d4c9b0' }}
                        />
                      ) : type === 'select' ? (
                        <select
                          value={values[name]}
                          onChange={e => set(name, e.target.value)}
                          style={{ ...(errors[name] ? inputError : inputBase), appearance: 'auto' }}
                          onFocus={e => { e.target.style.borderColor = '#1b0b09' }}
                          onBlur={e => { e.target.style.borderColor = errors[name] ? '#b8a508' : '#d4c9b0' }}
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
                          onFocus={e => { e.target.style.borderColor = '#1b0b09' }}
                          onBlur={e => { e.target.style.borderColor = errors[name] ? '#b8a508' : '#d4c9b0' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div style={{ marginTop: '32px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: '#1b0b09',
                color: '#fcf7cf',
                border: 'none',
                borderRadius: '2px',
                fontFamily: '"Anton", sans-serif',
                fontSize: '13px',
                letterSpacing: '.1em',
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
                <><Loader2 size={15} className="animate-spin" />ENVOI EN COURS…</>
              ) : (
                <>ENVOYER MA DEMANDE <ChevronRight size={15} /></>
              )}
            </button>
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#7e7e7e', marginTop: '12px' }}>
              Vos données sont confidentielles et utilisées uniquement pour votre projet.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
