import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, CheckSquare, FolderOpen, Calendar, FileText, Receipt, Video, X } from 'lucide-react'
import useStore from '../../store/useStore'
import Modal, { FormRow, FormField } from './Modal'

export default function QuickCreate() {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const navigate = useNavigate()
  const { addClient, addTache, addProjet, addRDV, addDocument, clients } = useStore()

  const actions = [
    { label: 'Client', icon: Users, color: 'text-blue-600 bg-blue-50', key: 'client' },
    { label: 'Tâche', icon: CheckSquare, color: 'text-indigo-600 bg-indigo-50', key: 'tache' },
    { label: 'Projet', icon: FolderOpen, color: 'text-purple-600 bg-purple-50', key: 'projet' },
    { label: 'RDV', icon: Calendar, color: 'text-orange-600 bg-orange-50', key: 'rdv' },
    { label: 'Devis', icon: FileText, color: 'text-emerald-600 bg-emerald-50', key: 'devis' },
    { label: 'Facture', icon: Receipt, color: 'text-pink-600 bg-pink-50', key: 'facture' },
  ]

  function handleAction(key) {
    setOpen(false)
    setModal(key)
  }

  function QuickClientForm() {
    const [f, setF] = useState({ nom: '', contact: '', email: '', telephone: '', statut: 'prospect' })
    function submit(e) {
      e.preventDefault()
      addClient(f)
      setModal(null)
      navigate('/clients')
    }
    return (
      <form onSubmit={submit}>
        <FormRow cols={2}>
          <FormField label="Nom entreprise" required>
            <input className="input" value={f.nom} onChange={e => setF({ ...f, nom: e.target.value })} required />
          </FormField>
          <FormField label="Contact">
            <input className="input" value={f.contact} onChange={e => setF({ ...f, contact: e.target.value })} />
          </FormField>
        </FormRow>
        <FormRow cols={2}>
          <FormField label="Email">
            <input type="email" className="input" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
          </FormField>
          <FormField label="Téléphone">
            <input className="input" value={f.telephone} onChange={e => setF({ ...f, telephone: e.target.value })} />
          </FormField>
        </FormRow>
        <FormField label="Statut">
          <select className="select" value={f.statut} onChange={e => setF({ ...f, statut: e.target.value })}>
            <option value="prospect">Prospect</option>
            <option value="actif">Actif</option>
            <option value="ancien">Ancien</option>
          </select>
        </FormField>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Annuler</button>
          <button type="submit" className="btn-primary">Créer le client</button>
        </div>
      </form>
    )
  }

  function QuickTacheForm() {
    const [f, setF] = useState({ titre: '', clientId: '', assignee: 'Sheryn', deadline: '', priorite: 'moyenne', statut: 'a_faire', description: '' })
    function submit(e) {
      e.preventDefault()
      addTache(f)
      setModal(null)
      navigate('/taches')
    }
    return (
      <form onSubmit={submit}>
        <FormField label="Titre" required>
          <input className="input mb-4" value={f.titre} onChange={e => setF({ ...f, titre: e.target.value })} required />
        </FormField>
        <FormRow cols={2}>
          <FormField label="Client">
            <select className="select" value={f.clientId} onChange={e => setF({ ...f, clientId: e.target.value })}>
              <option value="">— Aucun —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </FormField>
          <FormField label="Assignée">
            <select className="select" value={f.assignee} onChange={e => setF({ ...f, assignee: e.target.value })}>
              <option value="Sheryn">Sheryn</option>
              <option value="Chainez">Chainez</option>
            </select>
          </FormField>
        </FormRow>
        <FormRow cols={2}>
          <FormField label="Deadline">
            <input type="date" className="input" value={f.deadline} onChange={e => setF({ ...f, deadline: e.target.value })} />
          </FormField>
          <FormField label="Priorité">
            <select className="select" value={f.priorite} onChange={e => setF({ ...f, priorite: e.target.value })}>
              <option value="basse">Basse</option>
              <option value="moyenne">Moyenne</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
          </FormField>
        </FormRow>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Annuler</button>
          <button type="submit" className="btn-primary">Créer la tâche</button>
        </div>
      </form>
    )
  }

  function QuickRDVForm() {
    const [f, setF] = useState({ clientId: '', date: '', heure: '', sujet: '', lienMeet: '', objectif: '' })
    function submit(e) {
      e.preventDefault()
      addRDV(f)
      setModal(null)
      navigate('/rdv')
    }
    return (
      <form onSubmit={submit}>
        <FormField label="Client" required>
          <select className="select mb-4" value={f.clientId} onChange={e => setF({ ...f, clientId: e.target.value })} required>
            <option value="">— Choisir un client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </FormField>
        <FormRow cols={2}>
          <FormField label="Date">
            <input type="date" className="input" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
          </FormField>
          <FormField label="Heure">
            <input type="time" className="input" value={f.heure} onChange={e => setF({ ...f, heure: e.target.value })} />
          </FormField>
        </FormRow>
        <FormField label="Sujet">
          <input className="input mb-4" value={f.sujet} onChange={e => setF({ ...f, sujet: e.target.value })} />
        </FormField>
        <FormField label="Lien Google Meet">
          <input className="input" value={f.lienMeet} onChange={e => setF({ ...f, lienMeet: e.target.value })} placeholder="https://meet.google.com/..." />
        </FormField>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Annuler</button>
          <button type="submit" className="btn-primary">Créer le RDV</button>
        </div>
      </form>
    )
  }

  function QuickDocForm({ type }) {
    const [f, setF] = useState({ clientId: '', numero: type === 'devis' ? 'DEV-2024-' : 'FAC-2024-', montantHT: '', tva: 20, dateEmission: new Date().toISOString().split('T')[0], statut: 'en_attente', notes: '', lignes: [] })
    function submit(e) {
      e.preventDefault()
      addDocument({ ...f, type })
      setModal(null)
      navigate('/documents')
    }
    return (
      <form onSubmit={submit}>
        <FormRow cols={2}>
          <FormField label="Client" required>
            <select className="select" value={f.clientId} onChange={e => setF({ ...f, clientId: e.target.value })} required>
              <option value="">— Choisir —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </FormField>
          <FormField label="Numéro">
            <input className="input" value={f.numero} onChange={e => setF({ ...f, numero: e.target.value })} />
          </FormField>
        </FormRow>
        <FormRow cols={2}>
          <FormField label="Montant HT (€)">
            <input type="number" className="input" value={f.montantHT} onChange={e => setF({ ...f, montantHT: e.target.value })} />
          </FormField>
          <FormField label="Date d'émission">
            <input type="date" className="input" value={f.dateEmission} onChange={e => setF({ ...f, dateEmission: e.target.value })} />
          </FormField>
        </FormRow>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Annuler</button>
          <button type="submit" className="btn-primary">Créer le {type}</button>
        </div>
      </form>
    )
  }

  const modalMap = {
    client: { title: 'Nouveau client', content: <QuickClientForm /> },
    tache: { title: 'Nouvelle tâche', content: <QuickTacheForm /> },
    rdv: { title: 'Nouveau rendez-vous', content: <QuickRDVForm /> },
    devis: { title: 'Nouveau devis', content: <QuickDocForm type="devis" /> },
    facture: { title: 'Nouvelle facture', content: <QuickDocForm type="facture" /> },
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus size={16} />
        Créer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-modal border border-gray-100 w-72 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Création rapide</p>
            <div className="grid grid-cols-2 gap-2">
              {actions.map(({ label, icon: Icon, color, key }) => (
                <button
                  key={key}
                  onClick={() => handleAction(key)}
                  className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <span className={`p-1.5 rounded-lg ${color}`}>
                    <Icon size={14} />
                  </span>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {modal && modalMap[modal] && (
        <Modal isOpen={true} onClose={() => setModal(null)} title={modalMap[modal].title}>
          {modalMap[modal].content}
        </Modal>
      )}
    </>
  )
}
