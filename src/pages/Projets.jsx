import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderOpen, Calendar, BarChart2 } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge } from '../components/ui/Badge'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const ETAPES = ['Appel', 'Devis', 'Signature', 'Paiement', 'Brief', 'Maquettes', 'Validation', 'Développement', 'Mise en ligne', 'Suivi 1 mois', 'Terminé']
const STATUTS_PROJ = ['en_cours', 'devis', 'livre', 'pause', 'annule']

const emptyProjet = { nom: '', clientId: '', statut: 'en_cours', progression: 0, etapeActuelle: 'Appel', notes: '', timeline: { debut: '', fin: '' } }

export default function Projets() {
  const navigate = useNavigate()
  const { projets, clients, addProjet, updateProjet, deleteProjet } = useStore()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyProjet)
  const [filter, setFilter] = useState('tous')

  const getClient = (id) => clients.find(c => c.id === id)

  const filtered = projets.filter(p => filter === 'tous' || p.statut === filter)

  function handleSubmit(e) {
    e.preventDefault()
    addProjet(form)
    setModal(false)
    setForm(emptyProjet)
  }

  const statutColor = {
    en_cours: 'bg-[#241512]',
    devis: 'bg-amber-400',
    livre: 'bg-emerald-500',
    pause: 'bg-[#a89b8c]',
    annule: 'bg-red-400',
  }

  const inputClass = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
  const inputStyle = { background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Projets</h1>
          <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>{projets.length} projet{projets.length > 1 ? 's' : ''} au total</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }} onClick={() => setModal(true)}>
          <Plus size={16} /> Nouveau projet
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5 bg-white border border-[#e7e5e1] rounded-lg p-1 w-fit">
        {['tous', 'en_cours', 'devis', 'livre'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all"
            style={filter === s ? { background: '#241512', color: '#FDFCF8' } : { background: 'transparent', color: '#a89b8c' }}>
            {s === 'tous' ? 'Tous' : s === 'en_cours' ? 'En cours' : s === 'devis' ? 'Devis' : 'Livrés'}
            {' '}({projets.filter(p => s === 'tous' || p.statut === s).length})
          </button>
        ))}
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-3 bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid #e7e5e1', color: '#a89b8c' }}>Aucun projet trouvé</div>
        )}
        {filtered.map(p => {
          const client = getClient(p.clientId)
          return (
            <div key={p.id} className="bg-white rounded-2xl p-5 hover:border-[#241512]/20 transition-colors cursor-pointer"
              style={{ border: '1px solid #e7e5e1' }}
              onClick={() => {}}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold" style={{ color: '#241512' }}>{p.nom}</p>
                  {client && (
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`) }}
                      className="text-xs hover:underline mt-0.5" style={{ color: '#241512' }}>{client.nom}</button>
                  )}
                </div>
                {statutBadge(p.statut)}
              </div>

              {/* Progression */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: '#a89b8c' }}>
                  <span>Progression</span>
                  <span className="font-semibold">{p.progression}%</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ background: '#f5f4f1' }}>
                  <div className={`h-2 rounded-full ${statutColor[p.statut] || 'bg-[#241512]'} transition-all`}
                    style={{ width: `${p.progression}%` }} />
                </div>
              </div>

              {/* Étapes */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold" style={{ color: '#a89b8c' }}>Étape :</span>
                <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: '#f5f4f1', color: '#241512' }}>{p.etapeActuelle}</span>
              </div>

              {/* Timeline */}
              {(p.timeline?.debut || p.timeline?.fin) && (
                <div className="flex items-center gap-3 text-xs mb-3" style={{ color: '#a89b8c' }}>
                  <Calendar size={12} />
                  {p.timeline.debut && <span>{new Date(p.timeline.debut).toLocaleDateString('fr-FR')}</span>}
                  <span>→</span>
                  {p.timeline.fin && <span>{new Date(p.timeline.fin).toLocaleDateString('fr-FR')}</span>}
                </div>
              )}

              {/* Etapes stepper */}
              <div className="mt-3 pt-3 border-t" style={{ borderColor: '#e7e5e1' }}>
                <div className="flex gap-1 flex-wrap">
                  {ETAPES.slice(0, 7).map((etape, i) => {
                    const idx = ETAPES.indexOf(p.etapeActuelle)
                    const done = i < idx
                    const current = i === idx
                    return (
                      <div key={etape} title={etape}
                        className="h-1.5 flex-1 rounded-full transition-all"
                        style={{ background: done ? '#a89b8c' : current ? '#241512' : '#eeece7' }} />
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button className="flex-1 text-xs py-1.5 rounded-lg font-semibold transition-colors" style={{ background: '#f5f4f1', color: '#241512' }} onClick={(e) => {
                  e.stopPropagation()
                  const newProg = Math.min(100, (p.progression || 0) + 10)
                  updateProjet(p.id, { progression: newProg })
                }}>+10%</button>
                <button className="flex-1 text-xs py-1.5 rounded-lg font-semibold transition-colors" style={{ background: '#f5f4f1', color: '#241512' }} onClick={(e) => {
                  e.stopPropagation()
                  const idx = ETAPES.indexOf(p.etapeActuelle)
                  if (idx < ETAPES.length - 1) updateProjet(p.id, { etapeActuelle: ETAPES[idx + 1] })
                }}>Étape suivante →</button>
                <button className="p-1.5 rounded text-xs transition-colors hover:bg-red-50 hover:text-red-500" style={{ color: '#a89b8c' }} onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Supprimer ce projet ?')) deleteProjet(p.id)
                }}>✕</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouveau projet" size="lg">
        <form onSubmit={handleSubmit}>
          <FormRow cols={2}>
            <FormField label="Nom du projet" required>
              <input className={inputClass} style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
            </FormField>
            <FormField label="Client">
              <select className={inputClass} style={inputStyle} value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                <option value="">— Choisir —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Statut">
              <select className={inputClass} style={inputStyle} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                <option value="en_cours">En cours</option>
                <option value="devis">Devis</option>
                <option value="livre">Livré</option>
                <option value="pause">En pause</option>
              </select>
            </FormField>
            <FormField label="Étape actuelle">
              <select className={inputClass} style={inputStyle} value={form.etapeActuelle} onChange={e => setForm({ ...form, etapeActuelle: e.target.value })}>
                {ETAPES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Date de début">
              <input type="date" className={inputClass} style={inputStyle} value={form.timeline.debut} onChange={e => setForm({ ...form, timeline: { ...form.timeline, debut: e.target.value } })} />
            </FormField>
            <FormField label="Date de fin">
              <input type="date" className={inputClass} style={inputStyle} value={form.timeline.fin} onChange={e => setForm({ ...form, timeline: { ...form.timeline, fin: e.target.value } })} />
            </FormField>
          </FormRow>
          <FormField label="Progression (%)">
            <input type="range" min={0} max={100} value={form.progression} onChange={e => setForm({ ...form, progression: Number(e.target.value) })} className="w-full mb-1" />
            <div className="text-xs text-center" style={{ color: '#a89b8c' }}>{form.progression}%</div>
          </FormField>
          <FormField label="Notes">
            <textarea className={`${inputClass} resize-none mt-4`} style={inputStyle} rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }} onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: '#241512', color: '#FDFCF8' }}>Créer le projet</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
