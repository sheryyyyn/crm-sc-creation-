import { useState, useEffect } from 'react'
import {
  Copy, Check, ChevronDown, ChevronUp,
  Mail, Phone, Globe, Calendar, Euro, Target, Users, Star, MessageSquare,
  Building2, Inbox, CheckCircle2, Clock, Send, X, CalendarPlus, Trash2, UserPlus, PackageOpen,
} from 'lucide-react'
import useStore from '../store/useStore'
import { getCalendlyUrl } from './Parametres'
import { buildClientFromForm } from '../utils/buildClientFromForm'
import Modal from '../components/ui/Modal'

// Même grille tarifaire indicative que celle affichée aux visiteurs sur le
// formulaire public (src/pages/FormulairePublic.jsx) — pas de nouveau champ,
// juste réaffichée ici en face du type de prestation choisi.
const BUDGET_INDICATIF = {
  'Landing page': 'à partir de 950 € HT',
  'Site vitrine': 'à partir de 1 900 € HT',
  'E-commerce Shopify': 'à partir de 2 500 € HT',
  'Refonte de site existant': 'sur devis uniquement',
  'Je ne sais pas encore': '—',
}


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

// ─── Modal demande de documents ──────────────────────────────────────────────
const TAGS_DEMANDE = [
  { id: 'charte', label: 'Charte graphique' },
  { id: 'moodboard', label: 'Mood board' },
  { id: 'photos', label: 'Photos' },
  { id: 'textes', label: 'Textes' },
  { id: 'logo', label: 'Logo' },
  { id: 'couleurs', label: 'Palette de couleurs' },
  { id: 'police', label: 'Police / typo' },
  { id: 'autre', label: 'Autre' },
]

function MailDemandeModal({ rep, tags, onClose }) {
  const [copied, setCopied] = useState(false)
  const liste = tags.map(t => `• ${t}`).join('\n')
  const sujet = encodeURIComponent(`SC Création — Éléments à nous transmettre pour votre projet`)
  const corps = `Bonjour ${rep.nomEntreprise},

Merci encore pour votre formulaire ! Afin de démarrer votre projet dans les meilleures conditions, nous avons besoin que vous nous transmettiez les éléments suivants :

${liste}

Vous pouvez nous les envoyer par réponse à ce mail ou via WeTransfer / Google Drive si les fichiers sont volumineux.

N'hésitez pas à nous contacter si vous avez des questions.

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg,#f8f9ff,#eef2ff)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
              <PackageOpen size={15} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">Demande d'éléments</p>
              <p className="text-[11px] text-gray-400">{rep.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X size={14} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed border border-gray-200" style={{ fontSize: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {corps}
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <a href={mailtoLink}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl text-white transition-colors"
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
            onClick={onClose}>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  if (lu) return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#f5f4f1', color: '#a89b8c' }}><CheckCircle2 size={10} />Lu</span>
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#f5e6e3', color: '#a1402d' }}><Clock size={10} />Nouveau</span>
}

// ─── Carte réponse ─────────────────────────────────────────────────────────────
function CarteReponse({ rep, onToggle, open }) {
  const { markFormReponseRead, markFormReponseMailEnvoye, markFormReponseRdvBooke, updateFormReponse, deleteFormReponse, addClient, clients } = useStore()
  const [mailModal, setMailModal] = useState(false)
  const [calModal, setCalModal] = useState(false)
  const [demandeModal, setDemandeModal] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])
  const [rdvAdded, setRdvAdded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [clientCree, setClientCree] = useState(false)
  const [editingNote, setEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState(rep.noteInterne || '')
  const [collapsedSections, setCollapsedSections] = useState({})

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  function toggleTag(label) {
    setSelectedTags(prev => prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label])
  }

  const clientExiste = clients.some(c => c.email === rep.email)

  function handleCreerClient() {
    addClient(buildClientFromForm(rep, rep.id))
    setClientCree(true)
  }

  const handleOpen = () => {
    if (!rep.lu) markFormReponseRead(rep.id)
    onToggle()
  }

  const date = new Date(rep.horodateur).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const rowGroups = [
    {
      section: 'Entreprise',
      rows: [
        { icon: Building2, label: 'Entreprise', value: rep.nomEntreprise || '—' },
        { icon: Mail, label: 'Email', value: rep.email || '—' },
        { icon: Phone, label: 'Téléphone', value: rep.telephone || '—' },
        { icon: Star, label: "Secteur d'activité", value: rep.secteurActivite || '—' },
        { icon: Globe, label: 'Site web actuel', value: rep.siteActuel || (rep.aSiteWeb ? rep.aSiteWeb : '—') },
      ],
    },
    {
      section: 'Projet',
      rows: [
        { icon: Target, label: 'État du projet', value: rep.etatProjet || '—' },
        { icon: MessageSquare, label: 'Histoire de la marque', value: rep.histoire || '—' },
        { icon: Star, label: 'Produits / Services', value: rep.produits || '—' },
        { icon: Target, label: 'Objectif principal du projet', value: rep.objectif || '—' },
        { icon: Users, label: 'Cible', value: rep.cible || '—' },
        { icon: Calendar, label: 'Période de mise en ligne souhaitée', value: rep.periodeMiseEnLigne || '—' },
      ],
    },
    {
      section: 'Contenu & identité',
      rows: [
        { icon: Check, label: 'Contenu prêt', value: rep.contenuPret || '—' },
        { icon: Globe, label: 'Nom de domaine', value: rep.nomDomaine || '—' },
        { icon: Star, label: 'Charte graphique', value: rep.logoCharte || '—' },
        { icon: Users, label: 'Concurrents qui inspirent', value: rep.concurrents || '—' },
      ],
    },
    {
      section: 'Budget & délais',
      rows: [
        { icon: Euro, label: 'Prestation souhaitée', value: rep.budget || '—' },
        ...(rep.tarifRecommande ? [{ icon: Euro, label: 'Tarif recommandé', value: rep.tarifRecommande }] : []),
        ...(rep.nombreProduits ? [{ icon: PackageOpen, label: 'Nombre de produits', value: rep.nombreProduits }] : []),
        { icon: Calendar, label: 'Date de lancement souhaitée', value: rep.dateButoir || '—' },
        { icon: MessageSquare, label: 'Demandes spécifiques', value: rep.demandesSpecifiques || '—' },
      ],
    },
    {
      section: 'Pour finir',
      rows: [
        { icon: Users, label: 'Réseau de contact', value: rep.reseauContact || '—' },
        { icon: MessageSquare, label: 'Pseudo sur le réseau', value: rep.pseudoReseau || '—' },
        { icon: Phone, label: 'Moyen de contact souhaité', value: rep.moyenContact || '—' },
        { icon: MessageSquare, label: 'Remarques', value: rep.remarques || '—' },
      ],
    },
  ]

  return (
    <>
    {mailModal && <MailInteretModal rep={rep} onClose={() => setMailModal(false)} onMailEnvoye={() => markFormReponseMailEnvoye(rep.id)} />}
    {calModal && <CalendrierModal rep={rep} onClose={() => setCalModal(false)} onRdvAjoute={() => { setRdvAdded(true); markFormReponseRdvBooke(rep.id) }} />}
    {demandeModal && <MailDemandeModal rep={rep} tags={selectedTags} onClose={() => setDemandeModal(false)} />}
    <div className="bg-white rounded-2xl overflow-hidden transition-all duration-200"
      style={{ border: `1px solid ${!rep.lu ? '#e7b3a6' : '#e7e5e1'}` }}>
      {/* Header */}
      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={handleOpen}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
              style={{ background: '#f5f4f1', color: '#241512' }}>
              {rep.nomEntreprise?.[0] || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: '#241512' }}>{rep.nomEntreprise}</p>
              <p className="text-[11px] mt-0.5 truncate" style={{ color: '#a89b8c' }}>{date}</p>
              <p className="text-[11px] truncate" style={{ color: '#a89b8c' }}>{rep.email}</p>
            </div>
          </button>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <LuBadge lu={rep.lu} />
            <button onClick={handleOpen} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f5f4f1] transition-colors">
              {open ? <ChevronUp size={16} style={{ color: '#a89b8c' }} /> : <ChevronDown size={16} style={{ color: '#a89b8c' }} />}
            </button>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: '#241512', color: '#FDFCF8' }}>
            {rep.budget}
          </span>
          {(rep.rdvBooke || rdvAdded) ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              <CalendarPlus size={11} />Rendez-vous bookté
            </span>
          ) : rep.mailEnvoye ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              <Send size={11} />Mail envoyé
            </span>
          ) : null}

          {/* Supprimer, poussé à droite */}
          <div className="ml-auto">
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button onClick={() => deleteFormReponse(rep.id)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
                  Confirmer
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-[#eeece7] transition-colors" style={{ background: '#f5f4f1', color: '#241512' }}>
                  Annuler
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                <Trash2 size={13} />
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Note interne */}
      <div className="px-4 pb-3 -mt-1">
        {editingNote ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={noteValue}
              onChange={e => setNoteValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  updateFormReponse(rep.id, { noteInterne: noteValue })
                  setEditingNote(false)
                }
                if (e.key === 'Escape') setEditingNote(false)
              }}
              placeholder="Ajouter une note interne…"
              className="flex-1 text-xs px-3 py-1.5 rounded-lg focus:outline-none"
              style={{ border: '1px solid #e7e5e1', background: '#f5f4f1', color: '#241512' }}
            />
            <button onClick={() => { updateFormReponse(rep.id, { noteInterne: noteValue }); setEditingNote(false) }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors hover:opacity-90" style={{ background: '#241512' }}>
              OK
            </button>
            <button onClick={() => setEditingNote(false)}
              className="text-xs px-2 py-1.5 rounded-lg hover:bg-[#eeece7] transition-colors" style={{ background: '#f5f4f1', color: '#a89b8c' }}>
              <X size={12} />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditingNote(true)}
            className="flex items-center gap-1.5 text-[11px] text-left w-full group">
            {rep.noteInterne || noteValue ? (
              <span className="transition-colors" style={{ color: '#a89b8c' }}>
                📝 {rep.noteInterne || noteValue}
              </span>
            ) : (
              <span className="italic transition-colors" style={{ color: '#d5cfc4' }}>
                + Ajouter une note interne…
              </span>
            )}
          </button>
        )}
      </div>

      {/* Détail */}
      {open && (
        <div className="px-4 py-5" style={{ borderTop: '1px solid #eeece7' }}>
          <div className="flex flex-col gap-2">
            {rowGroups.map(({ section, rows }) => {
              const isCollapsed = !!collapsedSections[section]
              return (
                <div key={section} className="rounded-xl overflow-hidden" style={{ border: '1px solid #eeece7' }}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#eeece7] transition-colors"
                    style={{ background: '#faf9f6' }}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>{section}</span>
                    {isCollapsed ? <ChevronDown size={14} style={{ color: '#a89b8c' }} /> : <ChevronUp size={14} style={{ color: '#a89b8c' }} />}
                  </button>
                  {!isCollapsed && (
                    <div className="grid grid-cols-1 gap-4 px-4 py-4">
                      {rows.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#f5f4f1' }}>
                            <Icon size={13} style={{ color: '#a1402d' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#a89b8c' }}>{label}</p>
                            <p className="text-sm whitespace-pre-wrap mt-0.5" style={{ color: '#241512' }}>{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Actions rapides */}
          <div className="flex flex-wrap gap-2 mt-5 pt-4" style={{ borderTop: '1px solid #eeece7' }}>
            <button onClick={() => setMailModal(true)}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl text-white transition-colors hover:opacity-90"
              style={{ background: '#241512' }}>
              <Send size={13} />
              Envoyer mail d'intérêt
            </button>
            <button onClick={() => setCalModal(true)}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-colors hover:bg-[#eeece7]"
              style={rdvAdded ? { background: '#e8f3ec', color: '#1e7a4c' } : { background: '#f5f4f1', color: '#241512' }}>
              <CalendarPlus size={13} />
              {rdvAdded ? 'RDV ajouté ✓' : 'Réserver un créneau'}
            </button>
            <a href={`mailto:${rep.email}`}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-colors hover:bg-[#eeece7]"
              style={{ background: '#f5f4f1', color: '#241512' }}>
              <Mail size={13} />
              Email direct
            </a>
            {clientExiste || clientCree ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={13} />
                Fiche client créée
              </span>
            ) : (
              <button onClick={handleCreerClient}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-colors hover:bg-[#eeece7]"
                style={{ background: '#f5f4f1', color: '#241512' }}>
                <UserPlus size={13} />
                Créer la fiche client
              </button>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Formulaires() {
  const { formReponses, taches, updateTache, markFormReponseRead, deleteFormReponse } = useStore()

  // Escalade en urgente si +24h sans mail envoyé
  useEffect(() => {
    const now = Date.now()
    taches.forEach(t => {
      if (!t.formReponseId || t.priorite === 'urgente') return
      const rep = formReponses.find(r => r.id === t.formReponseId)
      if (!rep || rep.mailEnvoye) return
      const age = now - new Date(rep.horodateur).getTime()
      if (age > 24 * 60 * 60 * 1000) {
        updateTache(t.id, { priorite: 'urgente' })
      }
    })
  }, [formReponses, taches])
  const [openId, setOpenId] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [filtre, setFiltre] = useState('tous')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const nonLus = formReponses.filter(r => !r.lu).length
  const lus = formReponses.filter(r => r.lu).length
  const filtered = filtre === 'nouveau'
    ? formReponses.filter(r => !r.lu)
    : filtre === 'lu'
      ? formReponses.filter(r => r.lu)
      : formReponses
  const sorted = [...filtered].sort((a, b) => b.horodateur.localeCompare(a.horodateur))

  const toggle = (id) => setOpenId(prev => prev === id ? null : id)

  const openDetail = (rep) => {
    if (!rep.lu) markFormReponseRead(rep.id)
    setDetailId(rep.id)
  }
  const detailRep = detailId ? formReponses.find(r => r.id === detailId) : null

  const emptyLabel = filtre === 'nouveau' ? 'Aucun nouveau formulaire' : filtre === 'lu' ? 'Aucun formulaire lu' : 'Aucun formulaire'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Formulaires</h1>
          <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>Formulaire client & réponses reçues</p>
        </div>
      </div>

      <div>
          {/* Filtres */}
          <div className="flex items-center gap-2 mb-6">
            {[
              { key: 'tous', label: 'Tous' },
              { key: 'nouveau', label: 'Nouveaux' },
              { key: 'lu', label: 'Lus' },
            ].map(({ key, label }) => {
              const active = filtre === key
              return (
                <button key={key} onClick={() => setFiltre(key)}
                  className="px-4 py-2.5 rounded-full text-sm font-bold transition-colors"
                  style={active ? { background: '#241512', color: '#FDFCF8' } : { background: '#f5f4f1', color: '#241512' }}>
                  {label}
                </button>
              )
            })}
          </div>

          {/* ── Desktop : tableau ── */}
          <div className="hidden lg:block">
            {sorted.length === 0 ? (
              <div className="bg-white rounded-2xl px-7 py-16 text-center flex flex-col items-center" style={{ border: '1px solid #e7e5e1' }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: '#f5f4f1' }}>
                  <Inbox size={22} style={{ color: '#a89b8c' }} />
                </div>
                <p className="font-display text-xl font-bold" style={{ color: '#241512' }}>{emptyLabel}</p>
                <p className="text-sm mt-1.5" style={{ color: '#a89b8c' }}>Les prochaines demandes reçues depuis votre site apparaîtront ici.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
                <div className="grid px-7 py-3.5" style={{ gridTemplateColumns: '1fr 1.3fr 1.1fr 1.3fr .8fr auto', borderBottom: '1px solid #eeece7' }}>
                  {['Date', 'Marque', 'Type', 'Budget', 'Statut', ''].map((h, i) => (
                    <span key={h || i} className="text-xs font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>{h}</span>
                  ))}
                </div>
                {sorted.map(rep => (
                  <div
                    key={rep.id}
                    onClick={() => openDetail(rep)}
                    className="grid items-center px-7 py-4 cursor-pointer hover:bg-[#faf9f6] transition-colors"
                    style={{ gridTemplateColumns: '1fr 1.3fr 1.1fr 1.3fr .8fr auto', borderBottom: '1px solid #f0eee9' }}
                  >
                    <span className="text-sm" style={{ color: '#a89b8c' }}>
                      {new Date(rep.horodateur).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-sm font-bold truncate pr-2" style={{ color: '#241512' }}>{rep.nomEntreprise || '—'}</span>
                    <span className="text-sm truncate pr-2" style={{ color: '#241512' }}>{rep.budget || '—'}</span>
                    <span className="text-sm" style={{ color: '#a89b8c' }}>{BUDGET_INDICATIF[rep.budget] || '—'}</span>
                    <span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={rep.lu ? { background: '#f5f4f1', color: '#241512' } : { background: '#f5e6e3', color: '#a1402d' }}>
                        {rep.lu ? 'Lu' : 'Nouveau'}
                      </span>
                    </span>
                    <span className="pl-3" onClick={e => e.stopPropagation()}>
                      {confirmDeleteId === rep.id ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { deleteFormReponse(rep.id); setConfirmDeleteId(null) }}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors whitespace-nowrap">
                            Confirmer
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-[#eeece7] transition-colors" style={{ background: '#f5f4f1', color: '#241512' }}>
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(rep.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Mobile : cartes ── */}
          <div className="lg:hidden space-y-3">
            {sorted.length === 0 && (
              <div className="bg-white rounded-2xl px-7 py-16 text-center flex flex-col items-center" style={{ border: '1px solid #e7e5e1' }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: '#f5f4f1' }}>
                  <Inbox size={22} style={{ color: '#a89b8c' }} />
                </div>
                <p className="font-display text-xl font-bold" style={{ color: '#241512' }}>{emptyLabel}</p>
                <p className="text-sm mt-1.5" style={{ color: '#a89b8c' }}>Les prochaines demandes reçues depuis votre site apparaîtront ici.</p>
              </div>
            )}
            {sorted.map(rep => (
              <CarteReponse key={rep.id} rep={rep} open={openId === rep.id} onToggle={() => toggle(rep.id)} />
            ))}
          </div>

          {/* ── Détail (desktop) : réutilise exactement le même contenu que la carte mobile ── */}
          {detailRep && (
            <Modal isOpen={!!detailRep} onClose={() => setDetailId(null)} title={detailRep.nomEntreprise || 'Formulaire'} size="lg">
              <CarteReponse rep={detailRep} open onToggle={() => setDetailId(null)} />
            </Modal>
          )}
        </div>
    </div>
  )
}
