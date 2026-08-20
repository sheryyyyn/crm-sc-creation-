import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import useStore from '../store/useStore'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

// ─── Échéances = les tâches qui ont une deadline ──────────────────────────────
// Pas de collection séparée : mêmes données que la carte "Prochaines échéances"
// du Dashboard, juste présentées en pleine page avec des filtres. Ajouter une
// échéance ici crée une tâche normale (via addTache), visible aussi sur /taches.
const emptyEcheance = { titre: '', description: '', clientId: '', projetId: '', assignee: 'Sheryn', deadline: '', priorite: 'moyenne', statut: 'a_faire', notes: '' }

const assigneeLabel = (a) => (a === 'Chainez' ? 'Chaïnez' : a === 'Les deux' ? 'Communes' : a)

export default function Echeances() {
  const navigate = useNavigate()
  const { taches, clients, projets, addTache } = useStore()
  const [filter, setFilter] = useState('toutes')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyEcheance)

  const today = new Date().toISOString().split('T')[0]
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const endOfMonth = (() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
  })()

  const getAssoc = (t) => clients.find(c => c.id === t.clientId)?.nom || projets.find(p => p.id === t.projetId)?.nom || null
  const getProjetsForClient = (clientId) => projets.filter(p => p.clientId === clientId)

  const withDeadline = taches.filter(t => t.deadline && t.statut !== 'termine')

  const filtered = withDeadline.filter(t => {
    if (filter === 'semaine') return t.deadline >= today && t.deadline <= in7
    if (filter === 'mois') return t.deadline >= today && t.deadline <= endOfMonth
    if (filter === 'retard') return t.deadline < today
    return true
  }).sort((a, b) => a.deadline.localeCompare(b.deadline))

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.deadline) return
    addTache(form)
    setModal(false)
    setForm(emptyEcheance)
  }

  function dateInfo(deadline) {
    const diffDays = Math.round((new Date(deadline) - new Date(today)) / 86400000)
    const label = new Date(deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    let relative
    if (diffDays < 0) relative = `en retard de ${Math.abs(diffDays)} j`
    else if (diffDays === 0) relative = "aujourd'hui"
    else relative = `dans ${diffDays} j`
    return { label, relative, overdue: diffDays < 0 }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Échéances</h1>
          <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>Dates structurantes des projets</p>
        </div>
        <button
          onClick={() => { setForm(emptyEcheance); setModal(true) }}
          className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-colors flex-shrink-0"
          style={{ background: '#241512', color: '#FDFCF8' }}
          onMouseEnter={e => e.currentTarget.style.background = '#3a2620'}
          onMouseLeave={e => e.currentTarget.style.background = '#241512'}
        >
          <Plus size={16} /> Nouvelle échéance
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {[
          { id: 'semaine', label: 'Cette semaine' },
          { id: 'mois', label: 'Ce mois' },
          { id: 'toutes', label: 'Toutes' },
          { id: 'retard', label: 'En retard' },
        ].map(f => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-4 py-2.5 rounded-full text-sm font-bold transition-colors"
              style={active ? { background: '#241512', color: '#FDFCF8' } : { background: '#f5f4f1', color: '#241512' }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl px-7 py-10 text-center" style={{ border: '1px solid #e7e5e1' }}>
          <p className="text-sm" style={{ color: '#a89b8c' }}>Aucune échéance</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute top-0 bottom-0 w-px" style={{ left: '5px', background: '#e7e5e1' }} />
          <div className="flex flex-col gap-3">
            {filtered.map(t => {
              const { label, relative, overdue } = dateInfo(t.deadline)
              const assoc = getAssoc(t)
              return (
                <div key={t.id} className="relative flex items-center gap-5 pl-8">
                  <span className="absolute rounded-full flex-shrink-0" style={{ left: '0px', top: '50%', transform: 'translateY(-50%)', width: '11px', height: '11px', background: '#241512' }} />
                  <button
                    onClick={() => navigate('/taches')}
                    className="flex-1 flex items-center justify-between gap-4 px-7 py-5 rounded-2xl text-left bg-white hover:bg-[#faf9f6] transition-colors"
                    style={{ border: '1px solid #e7e5e1' }}
                  >
                    <div className="min-w-0">
                      <p className="text-[16px] font-bold" style={{ color: '#241512' }}>{t.titre}</p>
                      <p className="text-sm mt-0.5" style={{ color: '#a89b8c' }}>
                        {[assoc, assigneeLabel(t.assignee)].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[15px] font-bold" style={{ color: '#241512' }}>{label}</p>
                      <p className="text-sm mt-0.5" style={{ color: overdue ? '#a1402d' : '#a89b8c' }}>{relative}</p>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouvelle échéance" size="lg">
        <form onSubmit={handleSubmit}>
          <FormField label="Titre" required>
            <input className="input mb-4" autoFocus value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required />
          </FormField>
          <FormRow cols={2}>
            <FormField label="Client">
              <select className="select" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value, projetId: '' })}>
                <option value="">— Aucun —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </FormField>
            <FormField label="Projet">
              <select className="select" value={form.projetId} onChange={e => setForm({ ...form, projetId: e.target.value })}>
                <option value="">— Aucun —</option>
                {getProjetsForClient(form.clientId).map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="Assignée">
              <select className="select" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })}>
                <option value="Sheryn">Sheryn</option>
                <option value="Chainez">Chaïnez</option>
                <option value="Les deux">Les deux</option>
              </select>
            </FormField>
            <FormField label="Date" required>
              <input type="date" className="input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
            </FormField>
          </FormRow>
          <FormField label="Notes">
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="btn-primary">Créer l'échéance</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
