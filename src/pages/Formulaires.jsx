import { useState } from 'react'
import {
  ClipboardList, Eye, EyeOff, Copy, Check, ChevronDown, ChevronUp,
  Mail, Phone, Globe, Calendar, Euro, Target, Users, Star, MessageSquare,
  Building2, Inbox, ExternalLink, CheckCircle2, Clock, Send, X, CalendarPlus,
} from 'lucide-react'
import useStore from '../store/useStore'
import { getCalendlyUrl } from './Parametres'

// ─── Champs du formulaire (structure pour l'aperçu) ─────────────────────────
const FORM_FIELDS = [
  { section: 'Votre entreprise', fields: [
    { label: 'Nom de votre entreprise / marque *', name: 'nomEntreprise', type: 'text', placeholder: 'Ex : SC Création' },
    { label: 'Adresse e-mail *', name: 'email', type: 'email', placeholder: 'contact@votreentreprise.fr' },
    { label: 'Numéro de téléphone *', name: 'telephone', type: 'tel', placeholder: '06 00 00 00 00' },
    { label: "Quel est votre secteur d'activité ? *", name: 'secteurActivite', type: 'select', options: ['Mode & Vêtements', 'Beauté & Cosmétiques', 'Alimentation & Restauration', 'Sport & Bien-être', 'Maison & Décoration', 'Art & Artisanat', 'High-Tech & Informatique', 'Services aux entreprises (B2B)', 'Santé & Médical', 'Éducation & Formation', 'Immobilier', 'Événementiel', 'Conseil & Coaching', 'Autre'] },
    { label: 'Avez-vous déjà un site web ?', name: 'siteActuel', type: 'text', placeholder: 'https://... (laisser vide si non)' },
  ]},
  { section: 'Votre projet', fields: [
    { label: 'Racontez-nous l\'histoire de votre marque *', name: 'histoire', type: 'textarea', placeholder: 'D\'où vient votre idée ? Quelle est votre histoire ?' },
    { label: 'Quels sont vos produits ou services ? *', name: 'produits', type: 'textarea', placeholder: 'Décrivez vos produits / services' },
    { label: 'Quel est votre objectif principal pour ce site ? *', name: 'objectif', type: 'select', options: ['Vente en ligne (e-commerce)', 'Vitrine / présentation', 'Prise de rendez-vous', 'Portfolio', 'Autre'] },
    { label: 'Qui sont vos concurrents (sites que vous connaissez) ?', name: 'concurrents', type: 'textarea', placeholder: 'Ex : marque A, marque B…' },
  ]},
  { section: 'Votre contenu & identité', fields: [
    { label: 'Avez-vous du contenu prêt ? (textes, photos, vidéos)', name: 'contenuPret', type: 'select', options: ['Oui, tout est prêt', 'Partiellement', 'Non, j\'ai besoin d\'aide'] },
    { label: 'Souhaitez-vous un formulaire de contact sur votre site ?', name: 'formulaireContact', type: 'select', options: ['Oui', 'Non', 'Je ne sais pas encore'] },
    { label: 'Quelle est votre cible ? (cochez tout ce qui correspond)', name: 'cible', type: 'text', placeholder: 'Ex : 18-24 ans, femmes, professionnels…' },
    { label: 'Avez-vous déjà un nom de domaine ?', name: 'nomDomaine', type: 'select', options: ['Oui', 'Non', 'Je ne sais pas'] },
    { label: 'Avez-vous déjà un logo / charte graphique ?', name: 'logoCharte', type: 'select', options: ['Oui', 'Non, j\'ai besoin d\'aide', 'En cours'] },
    { label: 'Des sites qui vous inspirent ?', name: 'sitesInspirants', type: 'textarea', placeholder: 'Liens ou noms de sites que vous aimez' },
  ]},
  { section: 'Comment nous avez-vous trouvés ?', fields: [
    { label: 'Sur quel réseau nous avez-vous contactés ? *', name: 'reseauContact', type: 'select', options: ['Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'Pinterest', 'Bouche à oreille', 'Google', 'Autre'] },
    { label: 'Votre pseudo sur ce réseau *', name: 'pseudoReseau', type: 'text', placeholder: 'Ex : @votrepseudo' },
  ]},
  { section: 'Budget & délais', fields: [
    { label: 'Quel est votre budget estimé ? *', name: 'budget', type: 'select', options: ['Moins de 300€', '300€ – 500€', '500€ – 800€', '800€ – 1200€', 'Plus de 1200€', 'À définir'] },
    { label: 'Avez-vous une date butoir ?', name: 'dateButoir', type: 'text', placeholder: 'Ex : fin juillet 2026, ou "pas de contrainte"' },
    { label: 'Des demandes spécifiques ou fonctionnalités souhaitées ?', name: 'demandesSpecifiques', type: 'textarea', placeholder: 'Multilingue, blog, réservation en ligne…' },
    { label: 'Remarques libres', name: 'remarques', type: 'textarea', placeholder: 'Tout ce que vous souhaitez nous dire…' },
  ]},
]

const FORM_URL = typeof window !== 'undefined' ? `${window.location.origin}/formulaire` : '/formulaire'

// ─── Modal mail d'intérêt ─────────────────────────────────────────────────────
function MailInteretModal({ rep, onClose, onMailEnvoye }) {
  const [copied, setCopied] = useState(false)
  const calendlyUrl = getCalendlyUrl()

  const sujet = encodeURIComponent(`SC Création — Votre projet nous intéresse ! 🎉`)
  const corps = `Bonjour,

Merci d'avoir pris le temps de remplir notre formulaire !

Nous serions ravis de discuter de votre projet lors d'un appel découverte (45 min) afin de mieux cerner vos besoins et vous proposer la solution la plus adaptée.

Réservez votre créneau directement ici :
${calendlyUrl || '[Ajoutez votre lien Calendly dans les Paramètres]'}

N'hésitez pas à nous contacter si vous avez la moindre question.

À très vite,
L'équipe SC Création`

  const corpsEncode = encodeURIComponent(corps)
  const mailtoLink = `mailto:${rep.email}?subject=${sujet}&body=${corpsEncode}`

  function copier() {
    navigator.clipboard.writeText(corps).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg,#f8f9ff,#eef2ff)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
              <Send size={15} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">Mail d'intérêt</p>
              <p className="text-[11px] text-gray-400">{rep.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Corps */}
        <div className="px-6 py-5">
          {!calendlyUrl && (
            <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700 font-medium">⚠️ Aucun lien de réservation configuré — ajoutez votre lien Calendly dans <strong>Paramètres → Agence</strong>.</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed border border-gray-200" style={{ fontSize: '12px', maxHeight: '280px', overflowY: 'auto' }}>
            {corps}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <a href={mailtoLink}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl text-white transition-colors"
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
            onClick={() => { onMailEnvoye(); onClose() }}>
            <Mail size={14} />
            Ouvrir dans la messagerie
          </a>
          <button onClick={copier}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
            {copied ? <><Check size={14} className="text-emerald-600" />Copié !</> : <><Copy size={14} />Copier</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal calendrier de réservation ─────────────────────────────────────────
function CalendrierModal({ rep, onClose, onRdvAjoute }) {
  const { clients, addRDV } = useStore()
  const calendlyUrl = getCalendlyUrl()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    clientId: '',
    date: '',
    heure: '',
    lienMeet: '',
    sujet: `Appel découverte — ${rep.nomEntreprise}`,
    objectif: 'Présentation du projet et besoins',
    notes: `Budget client : ${rep.budget || '—'}`,
  })
  const [saved, setSaved] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    addRDV(form)
    setSaved(true)
    setTimeout(() => { setSaved(false); onRdvAjoute(); onClose() }, 1500)
  }

  const embedUrl = calendlyUrl
    ? `${calendlyUrl}?embed_type=Inline&hide_event_type_details=1&hide_gdpr_banner=1&name=${encodeURIComponent(rep.nomEntreprise || '')}&email=${encodeURIComponent(rep.email || '')}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg,#f8f9ff,#eef2ff)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
              <CalendarPlus size={15} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">Calendrier de réservation</p>
              <p className="text-[11px] text-gray-400">{rep.nomEntreprise}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowForm(f => !f)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5">
              <CalendarPlus size={12} />
              {showForm ? 'Voir le calendrier' : 'Ajouter au planning'}
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 70px)' }}>
          {!showForm ? (
            <div>
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="600"
                  frameBorder="0"
                  title="Calendrier de réservation"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                    <Calendar size={28} className="text-indigo-400" />
                  </div>
                  <p className="text-gray-700 font-semibold mb-2">Aucun lien de réservation configuré</p>
                  <p className="text-sm text-gray-400 mb-4">Ajoutez votre lien Calendly dans <strong>Paramètres → Agence</strong> pour afficher le calendrier ici.</p>
                  <p className="text-xs text-gray-400">En attendant, utilisez le bouton ci-dessous pour ajouter manuellement le RDV.</p>
                </div>
              )}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">Une fois le créneau réservé par le client, ajoutez-le manuellement à votre planning :</p>
                <button onClick={() => setShowForm(true)}
                  className="mt-3 flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white w-full justify-center"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                  <CalendarPlus size={14} />
                  Confirmer le RDV dans le planning
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500">Remplissez les détails du RDV pour l'ajouter directement dans votre planning.</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Client (optionnel)</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                    <option value="">— Aucun client lié —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date *</label>
                  <input required type="date" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Heure *</label>
                  <input required type="time" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Lien Google Meet</label>
                  <input type="url" placeholder="https://meet.google.com/..." className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.lienMeet} onChange={e => setForm({ ...form, lienMeet: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sujet</label>
                  <input type="text" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    value={form.sujet} onChange={e => setForm({ ...form, sujet: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes</label>
                  <textarea rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                    value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>

              <button type="submit"
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', opacity: saved ? 0.7 : 1 }}
                disabled={saved}>
                {saved ? '✓ RDV ajouté au planning !' : <><CalendarPlus size={15} />Ajouter au planning</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Badge lu/non-lu ──────────────────────────────────────────────────────────
function LuBadge({ lu }) {
  if (lu) return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400"><CheckCircle2 size={10} />Lu</span>
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Clock size={10} />Nouveau</span>
}

// ─── Carte réponse ─────────────────────────────────────────────────────────────
function CarteReponse({ rep, onToggle, open }) {
  const { markFormReponseRead, markFormReponseMailEnvoye } = useStore()
  const [mailModal, setMailModal] = useState(false)
  const [calModal, setCalModal] = useState(false)
  const [rdvAdded, setRdvAdded] = useState(false)

  const handleOpen = () => {
    if (!rep.lu) markFormReponseRead(rep.id)
    onToggle()
  }

  const date = new Date(rep.horodateur).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const rows = [
    { icon: Building2, label: 'Entreprise', value: rep.nomEntreprise },
    { icon: Mail, label: 'Email', value: rep.email },
    { icon: Phone, label: 'Téléphone', value: rep.telephone },
    { icon: Globe, label: 'Site actuel', value: rep.siteActuel || '—' },
    { icon: MessageSquare, label: 'Histoire de la marque', value: rep.histoire },
    { icon: Star, label: 'Produits / Services', value: rep.produits },
    { icon: Target, label: 'Objectif principal', value: rep.objectif },
    { icon: Users, label: 'Concurrents', value: rep.concurrents || '—' },
    { icon: Check, label: 'Contenu prêt', value: rep.contenuPret },
    { icon: MessageSquare, label: 'Formulaire de contact', value: rep.formulaireContact || '—' },
    { icon: Users, label: 'Cible', value: rep.cible },
    { icon: Globe, label: 'Nom de domaine', value: rep.nomDomaine },
    { icon: Euro, label: 'Budget', value: rep.budget },
    { icon: Calendar, label: 'Date butoir', value: rep.dateButoir || '—' },
    { icon: Star, label: 'Logo / Charte graphique', value: rep.logoCharte },
    { icon: ExternalLink, label: 'Sites inspirants', value: rep.sitesInspirants || '—' },
    { icon: MessageSquare, label: 'Demandes spécifiques', value: rep.demandesSpecifiques || '—' },
    { icon: MessageSquare, label: 'Remarques', value: rep.remarques || '—' },
  ]

  return (
    <>
    {mailModal && <MailInteretModal rep={rep} onClose={() => setMailModal(false)} onMailEnvoye={() => markFormReponseMailEnvoye(rep.id)} />}
    {calModal && <CalendrierModal rep={rep} onClose={() => setCalModal(false)} onRdvAjoute={() => setRdvAdded(true)} />}
    <div className={`bg-white rounded-2xl overflow-hidden transition-all duration-200 ${!rep.lu ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <button className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left" onClick={handleOpen}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', color: '#4f46e5' }}>
            {rep.nomEntreprise?.[0] || '?'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900">{rep.nomEntreprise}</p>
              <LuBadge lu={rep.lu} />
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">{date} · {rep.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ background: '#eef2ff', color: '#4f46e5' }}>
            {rep.budget}
          </span>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Détail */}
      {open && (
        <div className="border-t border-gray-100 px-6 py-5">
          <div className="grid grid-cols-1 gap-4">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={13} className="text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions rapides */}
          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-100">
            <button onClick={() => setMailModal(true)}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl text-white transition-colors"
              style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
              <Send size={13} />
              Envoyer mail d'intérêt
            </button>
            <button onClick={() => setCalModal(true)}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-colors ${rdvAdded ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
              <CalendarPlus size={13} />
              {rdvAdded ? 'RDV ajouté ✓' : 'Réserver un créneau'}
            </button>
            <a href={`mailto:${rep.email}`}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              <Mail size={13} />
              Email direct
            </a>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

// ─── Aperçu formulaire ─────────────────────────────────────────────────────────
function ApercuFormulaire() {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(FORM_URL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Bannière lien */}
      <div className="rounded-2xl p-5 mb-6 flex items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg,#4338ca,#6366f1)', boxShadow: '0 8px 24px rgba(99,102,241,0.28)' }}>
        <div>
          <p className="text-white font-bold text-sm mb-1">Lien du formulaire client</p>
          <p className="text-indigo-200 text-xs">Envoyez ce lien à vos prospects pour qu'ils remplissent le formulaire</p>
          <p className="text-indigo-100 text-[11px] font-mono mt-2 bg-white/10 px-3 py-1 rounded-lg inline-block">{FORM_URL}</p>
        </div>
        <button onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs whitespace-nowrap transition-all"
          style={{ background: copied ? '#10b981' : 'white', color: copied ? 'white' : '#4f46e5' }}>
          {copied ? <><Check size={13} />Copié !</> : <><Copy size={13} />Copier le lien</>}
        </button>
      </div>

      {/* Aperçu des champs */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="px-8 py-6 border-b border-gray-100" style={{ background: 'linear-gradient(135deg,#f8f9ff,#eef2ff)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
              <ClipboardList size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Formulaire de prise en charge</h2>
              <p className="text-xs text-gray-500">SC Création · Création de site web</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Bienvenue ! Pour mieux comprendre votre projet et vous proposer un accompagnement personnalisé,
            merci de remplir ce formulaire. Nous vous recontacterons sous 24h.
          </p>
        </div>

        <div className="px-8 py-6 space-y-8">
          {FORM_FIELDS.map(({ section, fields }) => (
            <div key={section}>
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">{section}</h3>
              <div className="space-y-4">
                {fields.map(({ label, name, type, placeholder, options }) => (
                  <div key={name}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                    {type === 'textarea' ? (
                      <textarea disabled rows={3} placeholder={placeholder}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400 resize-none cursor-not-allowed" />
                    ) : type === 'select' ? (
                      <select disabled className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400 cursor-not-allowed">
                        <option value="">— Choisir —</option>
                        {options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={type} disabled placeholder={placeholder}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400 cursor-not-allowed" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-2">
            <button disabled className="w-full py-3.5 rounded-xl font-bold text-sm text-white cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', opacity: 0.6 }}>
              Envoyer ma demande
            </button>
            <p className="text-center text-[11px] text-gray-400 mt-2">Aperçu uniquement · Les champs sont désactivés</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Formulaires() {
  const { formReponses } = useStore()
  const [tab, setTab] = useState('reponses')
  const [openId, setOpenId] = useState(null)
  const [filtre, setFiltre] = useState('tous')

  const nonLus = formReponses.filter(r => !r.lu).length
  const mailEnvoyes = formReponses.filter(r => r.mailEnvoye).length
  const filtered = filtre === 'nouveau'
    ? formReponses.filter(r => !r.lu)
    : filtre === 'mail_envoye'
      ? formReponses.filter(r => r.mailEnvoye)
      : formReponses
  const sorted = [...filtered].sort((a, b) => b.horodateur.localeCompare(a.horodateur))

  const toggle = (id) => setOpenId(prev => prev === id ? null : id)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formulaires</h1>
          <p className="text-sm text-gray-500 mt-0.5">Formulaire client & réponses reçues</p>
        </div>
        <div className="flex gap-1 p-1 bg-white rounded-xl" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <button onClick={() => setTab('reponses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'reponses' ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            style={tab === 'reponses' ? { background: 'linear-gradient(135deg,#6366f1,#4f46e5)' } : {}}>
            <Inbox size={14} />
            Réponses reçues
            {nonLus > 0 && (
              <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none ${tab === 'reponses' ? 'bg-white/25 text-white' : 'bg-amber-500 text-white'}`}>
                {nonLus}
              </span>
            )}
          </button>
          <button onClick={() => setTab('formulaire')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'formulaire' ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            style={tab === 'formulaire' ? { background: 'linear-gradient(135deg,#6366f1,#4f46e5)' } : {}}>
            <Eye size={14} />
            Aperçu formulaire
          </button>
        </div>
      </div>

      {tab === 'formulaire' && <ApercuFormulaire />}

      {tab === 'reponses' && (
        <div>
          {/* Filtres + stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {[
                { key: 'tous', label: `Toutes (${formReponses.length})` },
                { key: 'nouveau', label: `Non lues (${nonLus})` },
                { key: 'mail_envoye', label: `Mail envoyé (${mailEnvoyes})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setFiltre(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filtre === key ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  style={filtre === key ? {} : { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">{sorted.length} réponse{sorted.length > 1 ? 's' : ''}</p>
          </div>

          {/* Liste */}
          <div className="space-y-3">
            {sorted.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <Inbox size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Aucune réponse</p>
              </div>
            )}
            {sorted.map(rep => (
              <CarteReponse key={rep.id} rep={rep} open={openId === rep.id} onToggle={() => toggle(rep.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
