import { useState } from 'react'
import { ClipboardList, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
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
    { label: 'Avez-vous du contenu prêt ? (textes, photos, vidéos)', name: 'contenuPret', type: 'select', options: ['Oui, tout est prêt', 'Partiellement', "Non, j'ai besoin d'aide"] },
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#f8f9ff 0%,#eef2ff 100%)' }}>
        <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 8px 40px rgba(99,102,241,0.15)' }}>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
            <CheckCircle2 size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Merci pour votre demande !</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Nous avons bien reçu votre formulaire. L'équipe SC Création vous recontactera
            dans les <strong>24 heures</strong> pour discuter de votre projet.
          </p>
          <div className="mt-8 p-4 rounded-2xl bg-indigo-50">
            <p className="text-xs text-indigo-600 font-semibold">SC Création</p>
            <p className="text-xs text-indigo-400 mt-0.5">Création de sites web & identité visuelle</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#f8f9ff 0%,#eef2ff 100%)' }}>
      {/* Header */}
      <div className="px-4 py-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
          <ClipboardList size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Formulaire de prise en charge</h1>
        <p className="text-sm text-gray-500 mt-1">SC Création · Création de site web</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">
        {/* Intro card */}
        <div className="bg-white rounded-2xl px-6 py-5 mb-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-sm text-gray-600 leading-relaxed">
            Bienvenue ! Pour mieux comprendre votre projet et vous proposer un accompagnement personnalisé,
            merci de remplir ce formulaire. Les champs marqués d'un <strong>*</strong> sont obligatoires.
            Nous vous recontacterons sous <strong>24h</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">
            {FORM_FIELDS.map(({ section, fields }) => (
              <div key={section} className="bg-white rounded-2xl px-6 py-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-5">{section}</h3>
                <div className="space-y-5">
                  {fields.map(({ label, name, type, placeholder, options, required }) => (
                    <div key={name} data-error={errors[name] ? 'true' : 'false'}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        {label}
                        {errors[name] && <span className="ml-2 text-xs font-normal text-red-500">Champ requis</span>}
                      </label>
                      {type === 'textarea' ? (
                        <textarea
                          rows={3}
                          placeholder={placeholder}
                          value={values[name]}
                          onChange={e => set(name, e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border text-sm resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors[name] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                        />
                      ) : type === 'select' ? (
                        <select
                          value={values[name]}
                          onChange={e => set(name, e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors[name] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
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
                          className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors[name] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" />Envoi en cours…</>
              ) : (
                <>Envoyer ma demande <ChevronRight size={16} /></>
              )}
            </button>
            <p className="text-center text-[11px] text-gray-400 mt-3">
              Vos données sont confidentielles et utilisées uniquement pour votre projet.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
