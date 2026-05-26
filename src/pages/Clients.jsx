import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Users, ExternalLink, Instagram, Mail, Phone, ChevronRight, Filter } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const STATUTS = ['tous', 'actif', 'prospect', 'ancien']
const SOURCES = ['Instagram', 'LinkedIn', 'Bouche à oreille', 'Site web', 'Google', 'Recommandation', 'Autre']
const SECTEURS = ['Mode & Lifestyle', 'Photographie', 'Conseil & Consulting', 'Restauration', 'Artisanat & Création', 'Santé & Bien-être', 'Immobilier', 'E-commerce', 'Services B2B', 'Autre']

const emptyClient = { nom: '', contact: '', email: '', telephone: '', instagram: '', siteWeb: '', secteur: '', statut: 'prospect', source: '', typeProjet: '', offre: '', budget: '', deadline: '', objectifs: '', notes: '' }

export default function Clients() {
  const navigate = useNavigate()
  const { clients, addClient } = useStore()
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('tous')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyClient)

  const filtered = clients.filter(c => {
    const matchSearch = c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.contact?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatut = statut === 'tous' || c.statut === statut
    return matchSearch && matchStatut
  })

  function handleSubmit(e) {
    e.preventDefault()
    addClient(form)
    setModal(false)
    setForm(emptyClient)
  }

  const counts = {
    tous: clients.length,
    actif: clients.filter(c => c.statut === 'actif').length,
    prospect: clients.filter(c => c.statut === 'prospect').length,
    ancien: clients.filter(c => c.statut === 'ancien').length,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} client{clients.length > 1 ? 's' : ''} dans votre base</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Rechercher..." />
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-1">
          {STATUTS.map(s => (
            <button
              key={s}
              onClick={() => setStatut(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${statut === s ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {s} {counts[s] > 0 && <span className={`ml-1 ${statut === s ? 'opacity-70' : 'text-gray-400'}`}>({counts[s]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Client</th>
              <th className="table-header">Contact</th>
              <th className="table-header">Secteur</th>
              <th className="table-header">Statut</th>
              <th className="table-header">Budget</th>
              <th className="table-header">Projet</th>
              <th className="table-header w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">Aucun client trouvé</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} className="table-row cursor-pointer" onClick={() => navigate(`/clients/${c.id}`)}>
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-700">{c.nom[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{c.nom}</p>
                      {c.siteWeb && <p className="text-xs text-gray-400">{c.siteWeb}</p>}
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="space-y-0.5">
                    {c.contact && <p className="text-sm font-medium text-gray-700">{c.contact}</p>}
                    {c.email && <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={10} />{c.email}</p>}
                    {c.telephone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{c.telephone}</p>}
                  </div>
                </td>
                <td className="table-cell">
                  <p className="text-sm text-gray-600">{c.secteur || '—'}</p>
                  {c.source && <p className="text-xs text-gray-400">via {c.source}</p>}
                </td>
                <td className="table-cell">{statutBadge(c.statut)}</td>
                <td className="table-cell">
                  <p className="text-sm font-semibold text-gray-900">{c.budget ? `${Number(c.budget).toLocaleString('fr-FR')} €` : '—'}</p>
                </td>
                <td className="table-cell">
                  <p className="text-sm text-gray-600 max-w-[140px] truncate">{c.typeProjet || '—'}</p>
                </td>
                <td className="table-cell">
                  <ChevronRight size={16} className="text-gray-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouveau client" size="lg">
        <form onSubmit={handleSubmit}>
          <p className="section-title">Informations générales</p>
          <FormRow cols={2}>
            <FormField label="Nom entreprise" required>
              <input className="input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
            </FormField>
            <FormField label="Contact (prénom nom)">
              <input className="input" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Email">
              <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </FormField>
            <FormField label="Téléphone">
              <input className="input" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Instagram">
              <input className="input" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@handle" />
            </FormField>
            <FormField label="Site web">
              <input className="input" value={form.siteWeb} onChange={e => setForm({ ...form, siteWeb: e.target.value })} placeholder="monsite.fr" />
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Secteur">
              <select className="select" value={form.secteur} onChange={e => setForm({ ...form, secteur: e.target.value })}>
                <option value="">— Choisir —</option>
                {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Source d'acquisition">
              <select className="select" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                <option value="">— Choisir —</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Statut">
              <select className="select" value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                <option value="prospect">Prospect</option>
                <option value="actif">Actif</option>
                <option value="ancien">Ancien</option>
              </select>
            </FormField>
            <FormField label="Budget (€)">
              <input type="number" className="input" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </FormField>
          </FormRow>
          <p className="section-title mt-5">Projet</p>
          <FormRow cols={2}>
            <FormField label="Type de projet">
              <input className="input" value={form.typeProjet} onChange={e => setForm({ ...form, typeProjet: e.target.value })} placeholder="Site vitrine, E-commerce..." />
            </FormField>
            <FormField label="Offre choisie">
              <input className="input" value={form.offre} onChange={e => setForm({ ...form, offre: e.target.value })} placeholder="Pack Premium, Essentiel..." />
            </FormField>
          </FormRow>
          <FormField label="Deadline">
            <input type="date" className="input mb-4" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </FormField>
          <FormField label="Objectifs">
            <textarea className="input resize-none" rows={2} value={form.objectifs} onChange={e => setForm({ ...form, objectifs: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="btn-primary">Créer le client</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
