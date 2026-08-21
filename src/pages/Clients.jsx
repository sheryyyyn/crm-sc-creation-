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

const inputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
const inputStyle = { background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }

export default function Clients() {
  const navigate = useNavigate()
  const { clients, addClient, rdvs } = useStore()
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Clients</h1>
          <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>{clients.length} client{clients.length > 1 ? 's' : ''} dans votre base</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }} onClick={() => setModal(true)}>
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative w-full sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#a89b8c' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} className={`${inputCls} pl-9`} style={inputStyle} placeholder="Rechercher..." />
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-[#e7e5e1] rounded-lg p-1 flex-wrap">
          {STATUTS.map(s => (
            <button
              key={s}
              onClick={() => setStatut(s)}
              className="px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all"
              style={statut === s ? { background: '#241512', color: '#FDFCF8' } : { color: '#241512' }}
            >
              {s} {counts[s] > 0 && <span className="ml-1" style={statut === s ? { opacity: 0.7 } : { color: '#a89b8c' }}>({counts[s]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Cards (mobile) */}
      <div className="sm:hidden space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-sm" style={{ border: '1px solid #e7e5e1', color: '#a89b8c' }}>Aucun client trouvé</div>
        )}
        {filtered.map(c => {
          const clientRdvs = rdvs.filter(r => r.clientId === c.id)
          const today = new Date().toISOString().split('T')[0]
          const aDocumentDemande = clientRdvs.some(r => r.documentDemande)
          const aRdvPasse = clientRdvs.some(r => r.date && r.date < today)
          return (
            <div key={c.id} className="bg-white rounded-2xl p-4 cursor-pointer" style={{ border: '1px solid #e7e5e1' }} onClick={() => navigate(`/clients/${c.id}`)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f5f4f1' }}>
                    <span className="text-xs font-bold text-[#241512]">{c.nom[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#241512' }}>{c.nom}</p>
                    {c.contact && <p className="text-xs" style={{ color: '#a89b8c' }}>{c.contact}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statutBadge(c.statut)}
                  <ChevronRight size={14} style={{ color: '#a89b8c' }} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: '#a89b8c' }}>
                {c.email && <span className="flex items-center gap-1"><Mail size={10} />{c.email}</span>}
                {c.budget && <span className="font-semibold" style={{ color: '#241512' }}>{Number(c.budget).toLocaleString('fr-FR')} €</span>}
                {c.typeProjet && <span className="truncate max-w-[140px]">{c.typeProjet}</span>}
              </div>
              {(aDocumentDemande || aRdvPasse) && (
                <div className="mt-2">
                  {aDocumentDemande
                    ? <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ Document demandé</span>
                    : <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Document à fournir</span>
                  }
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Table (desktop) */}
      <div className="hidden sm:block bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr style={{ background: '#f5f4f1' }}>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Client</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Contact</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Documents</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Statut</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Budget</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#a89b8c' }}>Projet</th>
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wide w-12" style={{ color: '#a89b8c' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: '#a89b8c' }}>Aucun client trouvé</td></tr>
            )}
            {filtered.map(c => {
              const clientRdvs = rdvs.filter(r => r.clientId === c.id)
              const today = new Date().toISOString().split('T')[0]
              const aDocumentDemande = clientRdvs.some(r => r.documentDemande)
              const aRdvPasse = clientRdvs.some(r => r.date && r.date < today)
              return (
              <tr key={c.id} className="cursor-pointer hover:bg-[#f5f4f1] transition-colors border-t border-[#e7e5e1]" onClick={() => navigate(`/clients/${c.id}`)}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f5f4f1' }}>
                      <span className="text-xs font-bold text-[#241512]">{c.nom[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#241512' }}>{c.nom}</p>
                      {c.siteWeb && <p className="text-xs" style={{ color: '#a89b8c' }}>{c.siteWeb}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="space-y-0.5">
                    {c.contact && <p className="text-sm font-medium" style={{ color: '#241512' }}>{c.contact}</p>}
                    {c.email && <p className="text-xs flex items-center gap-1" style={{ color: '#a89b8c' }}><Mail size={10} />{c.email}</p>}
                    {c.telephone && <p className="text-xs flex items-center gap-1" style={{ color: '#a89b8c' }}><Phone size={10} />{c.telephone}</p>}
                  </div>
                </td>
                <td className="px-5 py-3">
                  {aDocumentDemande
                    ? <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">✓ Document demandé</span>
                    : aRdvPasse
                      ? <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">Document à fournir</span>
                      : <span className="text-xs" style={{ color: '#e7e5e1' }}>—</span>
                  }
                </td>
                <td className="px-5 py-3">{statutBadge(c.statut)}</td>
                <td className="px-5 py-3">
                  <p className="text-sm font-semibold" style={{ color: '#241512' }}>{c.budget ? `${Number(c.budget).toLocaleString('fr-FR')} €` : '—'}</p>
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm max-w-[140px] truncate" style={{ color: '#a89b8c' }}>{c.typeProjet || '—'}</p>
                </td>
                <td className="px-5 py-3">
                  <ChevronRight size={16} style={{ color: '#a89b8c' }} />
                </td>
              </tr>
            )})}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouveau client" size="lg">
        <form onSubmit={handleSubmit}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#a89b8c' }}>Informations générales</p>
          <FormRow cols={2}>
            <FormField label="Nom entreprise" required>
              <input className={inputCls} style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
            </FormField>
            <FormField label="Contact (prénom nom)">
              <input className={inputCls} style={inputStyle} value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Email">
              <input type="email" className={inputCls} style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </FormField>
            <FormField label="Téléphone">
              <input className={inputCls} style={inputStyle} value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Instagram">
              <input className={inputCls} style={inputStyle} value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@handle" />
            </FormField>
            <FormField label="Site web">
              <input className={inputCls} style={inputStyle} value={form.siteWeb} onChange={e => setForm({ ...form, siteWeb: e.target.value })} placeholder="monsite.fr" />
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Secteur">
              <select className={inputCls} style={inputStyle} value={form.secteur} onChange={e => setForm({ ...form, secteur: e.target.value })}>
                <option value="">— Choisir —</option>
                {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Source d'acquisition">
              <select className={inputCls} style={inputStyle} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                <option value="">— Choisir —</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Statut">
              <select className={inputCls} style={inputStyle} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                <option value="prospect">Prospect</option>
                <option value="actif">Actif</option>
                <option value="ancien">Ancien</option>
              </select>
            </FormField>
            <FormField label="Budget (€)">
              <input type="number" className={inputCls} style={inputStyle} value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </FormField>
          </FormRow>
          <p className="text-xs font-bold uppercase tracking-wider mt-5 mb-3" style={{ color: '#a89b8c' }}>Projet</p>
          <FormRow cols={2}>
            <FormField label="Type de projet">
              <input className={inputCls} style={inputStyle} value={form.typeProjet} onChange={e => setForm({ ...form, typeProjet: e.target.value })} placeholder="Site vitrine, E-commerce..." />
            </FormField>
            <FormField label="Offre choisie">
              <input className={inputCls} style={inputStyle} value={form.offre} onChange={e => setForm({ ...form, offre: e.target.value })} placeholder="Pack Premium, Essentiel..." />
            </FormField>
          </FormRow>
          <FormField label="Deadline">
            <input type="date" className={`${inputCls} mb-4`} style={inputStyle} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </FormField>
          <FormField label="Objectifs">
            <textarea className={`${inputCls} resize-none`} style={inputStyle} rows={2} value={form.objectifs} onChange={e => setForm({ ...form, objectifs: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }}>Créer le client</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
