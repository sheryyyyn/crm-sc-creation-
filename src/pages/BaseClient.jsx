import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Palette, ClipboardCheck, KeyRound, ExternalLink, Eye, EyeOff,
  Copy, Check, Trash2, ChevronRight, Link2,
} from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const emptyClient = { nom: '', contact: '', email: '', telephone: '', statut: 'actif', charteUrl: '' }
const emptyAcces = { nom: '', identifiant: '', motDePasse: '', url: '' }

// ─── Ligne d'accès logiciel (mot de passe masqué par défaut) ─────────────────
function AccesRow({ acces, onDelete }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyPwd() {
    navigator.clipboard.writeText(acces.motDePasse || '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold text-gray-800 truncate">{acces.nom}</p>
          {acces.url && (
            <a href={acces.url.startsWith('http') ? acces.url : `https://${acces.url}`} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()} className="text-gray-400 hover:text-indigo-600 flex-shrink-0">
              <ExternalLink size={11} />
            </a>
          )}
        </div>
        {acces.identifiant && <p className="text-[11px] text-gray-500 truncate">{acces.identifiant}</p>}
      </div>
      {acces.motDePasse && (
        <>
          <span className="text-[11px] font-mono text-gray-600">{show ? acces.motDePasse : '••••••••'}</span>
          <button onClick={(e) => { e.stopPropagation(); setShow(s => !s) }} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
            {show ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); copyPwd() }} className="p-1 text-gray-400 hover:text-indigo-600 flex-shrink-0">
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          </button>
        </>
      )}
      <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1 text-gray-300 hover:text-red-500 flex-shrink-0">
        <Trash2 size={12} />
      </button>
    </div>
  )
}

// ─── Carte fiche client ───────────────────────────────────────────────────────
function ClientCard({ client, formReponse, acces, onOpenCharte, onAddAcces, onDeleteAcces, navigate }) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between cursor-pointer" onClick={() => navigate(`/clients/${client.id}`)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-indigo-700">{client.nom[0]}</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{client.nom}</p>
            {client.contact && <p className="text-xs text-gray-500 truncate">{client.contact}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {statutBadge(client.statut)}
          <ChevronRight size={15} className="text-gray-300" />
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: formReponse ? '#e6f6ee' : '#f3f3f1' }}>
          <ClipboardCheck size={13} style={{ color: formReponse ? '#1a9a5b' : '#a3a3a3' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-700">Formulaire client</p>
          {formReponse ? (
            <button onClick={() => navigate('/formulaires')} className="text-[11px] text-emerald-600 hover:underline">
              Reçu le {new Date(formReponse.horodateur).toLocaleDateString('fr-FR')}
            </button>
          ) : (
            <p className="text-[11px] text-gray-400">Pas encore reçu</p>
          )}
        </div>
      </div>

      {/* Charte graphique */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: client.charteUrl ? '#f2e9fc' : '#f3f3f1' }}>
          <Palette size={13} style={{ color: client.charteUrl ? '#8b3fd6' : '#a3a3a3' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-700">Charte graphique</p>
          {client.charteUrl ? (
            <a href={client.charteUrl.startsWith('http') ? client.charteUrl : `https://${client.charteUrl}`}
              target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-1">
              Voir la charte <ExternalLink size={9} />
            </a>
          ) : (
            <p className="text-[11px] text-gray-400">Aucune charte</p>
          )}
        </div>
        <button onClick={() => onOpenCharte(client)} className="p-1.5 text-gray-300 hover:text-indigo-600 flex-shrink-0" title="Lien de la charte">
          <Link2 size={13} />
        </button>
      </div>

      {/* Accès logiciels */}
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: acces.length ? '#fef3d6' : '#f3f3f1' }}>
            <KeyRound size={13} style={{ color: acces.length ? '#b8860b' : '#a3a3a3' }} />
          </div>
          <p className="text-xs font-semibold text-gray-700 flex-1">Accès logiciels</p>
          <button onClick={() => onAddAcces(client)} className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1">
            <Plus size={11} /> Ajouter
          </button>
        </div>
        {acces.length === 0 ? (
          <p className="text-[11px] text-gray-400 pl-9">Aucun accès enregistré</p>
        ) : (
          <div className="space-y-1.5">
            {acces.map(a => <AccesRow key={a.id} acces={a} onDelete={() => onDeleteAcces(a.id)} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BaseClient() {
  const navigate = useNavigate()
  const { clients, addClient, updateClient, formReponses, motsDePasse, addMotDePasse, deleteMotDePasse } = useStore()
  const [filter, setFilter] = useState('actif')
  const [clientModal, setClientModal] = useState(false)
  const [clientForm, setClientForm] = useState(emptyClient)
  const [charteModal, setCharteModal] = useState(null)
  const [charteUrl, setCharteUrl] = useState('')
  const [accesModal, setAccesModal] = useState(null)
  const [accesForm, setAccesForm] = useState(emptyAcces)

  const filtered = clients.filter(c => filter === 'tous' || c.statut === filter)

  const getFormReponse = (client) =>
    formReponses.find(r => r.nomEntreprise?.toLowerCase().trim() === client.nom?.toLowerCase().trim())

  const getAcces = (client) => motsDePasse.filter(m => m.clientId === client.id)

  function handleAddClient(e) {
    e.preventDefault()
    addClient(clientForm)
    setClientModal(false)
    setClientForm(emptyClient)
  }

  function handleSaveCharte(e) {
    e.preventDefault()
    updateClient(charteModal.id, { charteUrl })
    setCharteModal(null)
  }

  function handleAddAcces(e) {
    e.preventDefault()
    addMotDePasse({ ...accesForm, categorie: 'Clients', clientId: accesModal.id })
    setAccesModal(null)
    setAccesForm(emptyAcces)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Base client</h1>
          <p className="text-sm text-gray-500 mt-1">Fiches complètes des clients — formulaire, charte graphique, accès</p>
        </div>
        <button className="btn-primary" onClick={() => setClientModal(true)}>
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-1.5 mb-5 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {['actif', 'prospect', 'ancien', 'tous'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${filter === s ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {s === 'tous' ? 'Tous' : s} ({clients.filter(c => s === 'tous' || c.statut === s).length})
          </button>
        ))}
      </div>

      {/* Cartes clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full card p-12 text-center text-gray-400">Aucun client dans cette catégorie</div>
        )}
        {filtered.map(client => (
          <ClientCard
            key={client.id}
            client={client}
            formReponse={getFormReponse(client)}
            acces={getAcces(client)}
            navigate={navigate}
            onOpenCharte={(c) => { setCharteModal(c); setCharteUrl(c.charteUrl || '') }}
            onAddAcces={(c) => { setAccesModal(c); setAccesForm(emptyAcces) }}
            onDeleteAcces={deleteMotDePasse}
          />
        ))}
      </div>

      {/* Modal nouveau client */}
      <Modal isOpen={clientModal} onClose={() => setClientModal(false)} title="Nouveau client">
        <form onSubmit={handleAddClient}>
          <FormRow cols={2}>
            <FormField label="Nom entreprise" required>
              <input className="input" value={clientForm.nom} onChange={e => setClientForm({ ...clientForm, nom: e.target.value })} required />
            </FormField>
            <FormField label="Contact">
              <input className="input" value={clientForm.contact} onChange={e => setClientForm({ ...clientForm, contact: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Email">
              <input type="email" className="input" value={clientForm.email} onChange={e => setClientForm({ ...clientForm, email: e.target.value })} />
            </FormField>
            <FormField label="Téléphone">
              <input className="input" value={clientForm.telephone} onChange={e => setClientForm({ ...clientForm, telephone: e.target.value })} />
            </FormField>
          </FormRow>
          <FormField label="Statut">
            <select className="select" value={clientForm.statut} onChange={e => setClientForm({ ...clientForm, statut: e.target.value })}>
              <option value="prospect">Prospect</option>
              <option value="actif">Actif</option>
              <option value="ancien">Ancien</option>
            </select>
          </FormField>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="btn-secondary" onClick={() => setClientModal(false)}>Annuler</button>
            <button type="submit" className="btn-primary">Créer</button>
          </div>
        </form>
      </Modal>

      {/* Modal charte graphique */}
      <Modal isOpen={!!charteModal} onClose={() => setCharteModal(null)} title={`Charte graphique — ${charteModal?.nom || ''}`} size="sm">
        <form onSubmit={handleSaveCharte}>
          <FormField label="Lien vers la charte (Drive, Figma, PDF...)">
            <input className="input" value={charteUrl} onChange={e => setCharteUrl(e.target.value)} placeholder="https://..." autoFocus />
          </FormField>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="btn-secondary" onClick={() => setCharteModal(null)}>Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer</button>
          </div>
        </form>
      </Modal>

      {/* Modal accès logiciel */}
      <Modal isOpen={!!accesModal} onClose={() => setAccesModal(null)} title={`Ajouter un accès — ${accesModal?.nom || ''}`} size="sm">
        <form onSubmit={handleAddAcces}>
          <FormField label="Logiciel / service" required>
            <input className="input" value={accesForm.nom} onChange={e => setAccesForm({ ...accesForm, nom: e.target.value })} required placeholder="Ex: Shopify, Canva..." />
          </FormField>
          <FormRow cols={2}>
            <FormField label="Identifiant / email">
              <input className="input" value={accesForm.identifiant} onChange={e => setAccesForm({ ...accesForm, identifiant: e.target.value })} />
            </FormField>
            <FormField label="Mot de passe">
              <input className="input" value={accesForm.motDePasse} onChange={e => setAccesForm({ ...accesForm, motDePasse: e.target.value })} />
            </FormField>
          </FormRow>
          <FormField label="URL">
            <input className="input" value={accesForm.url} onChange={e => setAccesForm({ ...accesForm, url: e.target.value })} placeholder="https://..." />
          </FormField>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="btn-secondary" onClick={() => setAccesModal(null)}>Annuler</button>
            <button type="submit" className="btn-primary">Ajouter</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
