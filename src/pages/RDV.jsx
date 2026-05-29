import { useState } from 'react'
import { Plus, Video, Calendar, Clock, Edit, Trash2, ExternalLink, List, ChevronLeft, ChevronRight } from 'lucide-react'
import useStore from '../store/useStore'
import Modal, { FormRow, FormField } from '../components/ui/Modal'

const emptyRDV = { clientId: '', date: '', heure: '', lienMeet: '', sujet: '', objectif: '', notes: '', compteRendu: '', prochainesActions: [] }

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function VueCalendrier({ rdvs, clients, today, onEdit, onDelete, onNewRDV }) {
  const now = new Date()
  const [annee, setAnnee] = useState(now.getFullYear())
  const [mois, setMois] = useState(now.getMonth())
  const [jourSelectionne, setJourSelectionne] = useState(null)

  const getClient = (id) => clients.find(c => c.id === id)

  function prevMois() {
    if (mois === 0) { setMois(11); setAnnee(a => a - 1) }
    else setMois(m => m - 1)
    setJourSelectionne(null)
  }
  function nextMois() {
    if (mois === 11) { setMois(0); setAnnee(a => a + 1) }
    else setMois(m => m + 1)
    setJourSelectionne(null)
  }

  // Calcul des jours du mois
  const premierJour = new Date(annee, mois, 1)
  const dernierJour = new Date(annee, mois + 1, 0)
  // Lundi = 0 dans notre grille
  const debutGrille = (premierJour.getDay() + 6) % 7
  const nbJours = dernierJour.getDate()

  const rdvDuMois = rdvs.filter(r => {
    if (!r.date) return false
    const [y, m] = r.date.split('-').map(Number)
    return y === annee && m === mois + 1
  })

  const rdvParJour = {}
  rdvDuMois.forEach(r => {
    const jour = parseInt(r.date.split('-')[2])
    if (!rdvParJour[jour]) rdvParJour[jour] = []
    rdvParJour[jour].push(r)
  })

  const rdvJourSelectionne = jourSelectionne ? (rdvParJour[jourSelectionne] || []) : []
  const dateJourStr = jourSelectionne ? `${annee}-${String(mois + 1).padStart(2, '0')}-${String(jourSelectionne).padStart(2, '0')}` : ''
  const isToday = (j) => `${annee}-${String(mois + 1).padStart(2, '0')}-${String(j).padStart(2, '0')}` === today

  const cellules = []
  for (let i = 0; i < debutGrille; i++) cellules.push(null)
  for (let j = 1; j <= nbJours; j++) cellules.push(j)

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Calendrier */}
      <div className="flex-1 bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {/* Navigation mois */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prevMois} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <h2 className="font-bold text-gray-900">{MOIS[mois]} {annee}</h2>
          <button onClick={nextMois} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>

        {/* En-têtes jours */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {JOURS.map(j => (
            <div key={j} className="py-2 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wide">{j}</div>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-7">
          {cellules.map((jour, i) => {
            if (!jour) return <div key={`empty-${i}`} className="min-h-[72px] border-b border-r border-gray-50" />
            const rdvsJour = rdvParJour[jour] || []
            const selectionne = jourSelectionne === jour
            const aujd = isToday(jour)
            return (
              <button key={jour} onClick={() => setJourSelectionne(selectionne ? null : jour)}
                className={`min-h-[72px] p-2 border-b border-r border-gray-50 text-left transition-all hover:bg-indigo-50/50 ${selectionne ? 'bg-indigo-50 border-indigo-200' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${aujd ? 'bg-indigo-600 text-white' : selectionne ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700'}`}>
                  {jour}
                </div>
                <div className="space-y-0.5">
                  {rdvsJour.slice(0, 2).map(r => (
                    <div key={r.id} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate"
                      style={{ background: '#eef2ff', color: '#4f46e5' }}>
                      {r.heure ? r.heure.slice(0,5) + ' ' : ''}{r.sujet || 'RDV'}
                    </div>
                  ))}
                  {rdvsJour.length > 2 && (
                    <div className="text-[10px] text-gray-400 font-medium pl-1">+{rdvsJour.length - 2} autre{rdvsJour.length - 2 > 1 ? 's' : ''}</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Panneau latéral */}
      <div className="w-full lg:w-72 flex-shrink-0">
        {jourSelectionne ? (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#f8f9ff,#eef2ff)' }}>
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  {jourSelectionne} {MOIS[mois].toLowerCase()}
                </p>
                <p className="text-[11px] text-gray-400">{rdvJourSelectionne.length} rendez-vous</p>
              </div>
              <button onClick={() => onNewRDV(dateJourStr)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                <Plus size={14} />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {rdvJourSelectionne.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <Calendar size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun RDV ce jour</p>
                  <button onClick={() => onNewRDV(dateJourStr)}
                    className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                    + Ajouter un RDV
                  </button>
                </div>
              )}
              {rdvJourSelectionne.map(r => {
                const client = getClient(r.clientId)
                return (
                  <div key={r.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{r.sujet || 'Rendez-vous'}</p>
                        {client && <p className="text-xs text-gray-500 mt-0.5">{client.nom}</p>}
                        {r.heure && (
                          <p className="text-xs text-indigo-600 font-medium mt-1 flex items-center gap-1">
                            <Clock size={10} />{r.heure}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {r.lienMeet && (
                          <a href={r.lienMeet} target="_blank" rel="noreferrer"
                            className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                            <Video size={12} />
                          </a>
                        )}
                        <button onClick={() => onEdit(r)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <Edit size={12} className="text-gray-400" />
                        </button>
                        <button onClick={() => { if (confirm('Supprimer ce RDV ?')) onDelete(r.id) }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                          <Trash2 size={12} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                    {r.notes && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{r.notes}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <Calendar size={28} className="text-indigo-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Sélectionne un jour</p>
            <p className="text-xs text-gray-400 mt-1">pour voir les RDV de la journée</p>
            <div className="mt-5 pt-4 border-t border-gray-100 text-left">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">Ce mois-ci</p>
              {rdvDuMois.length === 0 ? (
                <p className="text-xs text-gray-400">Aucun RDV ce mois</p>
              ) : (
                <div className="space-y-2">
                  {rdvDuMois.slice(0, 5).map(r => {
                    const client = getClient(r.clientId)
                    return (
                      <div key={r.id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-indigo-600">
                          {r.date?.split('-')[2]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate">{r.sujet || 'RDV'}</p>
                          {client && <p className="text-[10px] text-gray-400 truncate">{client.nom}</p>}
                        </div>
                      </div>
                    )
                  })}
                  {rdvDuMois.length > 5 && <p className="text-[11px] text-gray-400">+{rdvDuMois.length - 5} autres</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RDV() {
  const { rdvs, clients, addRDV, updateRDV, deleteRDV } = useStore()
  const [modal, setModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState(emptyRDV)
  const [editForm, setEditForm] = useState(null)
  const [tab, setTab] = useState('a_venir')
  const [vue, setVue] = useState('liste')

  const today = new Date().toISOString().split('T')[0]
  const getClient = (id) => clients.find(c => c.id === id)

  const sorted = [...rdvs].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const aVenir = sorted.filter(r => r.date >= today)
  const passes = sorted.filter(r => r.date < today).reverse()
  const displayed = tab === 'a_venir' ? aVenir : passes

  function handleSubmit(e) {
    e.preventDefault()
    addRDV(form)
    setModal(false)
    setForm(emptyRDV)
  }

  function openEdit(r) {
    setEditForm({ ...r })
    setEditModal(r.id)
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    updateRDV(editModal, editForm)
    setEditModal(null)
  }

  function openNewWithDate(date) {
    setForm({ ...emptyRDV, date })
    setModal(true)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rendez-vous</h1>
          <p className="text-sm text-gray-500 mt-1">{aVenir.length} à venir · {passes.length} passé{passes.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vue */}
          <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-lg">
            <button onClick={() => setVue('liste')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${vue === 'liste' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              <List size={13} /> Liste
            </button>
            <button onClick={() => setVue('calendrier')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${vue === 'calendrier' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Calendar size={13} /> Calendrier
            </button>
          </div>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Nouveau RDV
          </button>
        </div>
      </div>

      {/* Vue calendrier */}
      {vue === 'calendrier' && (
        <VueCalendrier
          rdvs={rdvs}
          clients={clients}
          today={today}
          onEdit={openEdit}
          onDelete={deleteRDV}
          onNewRDV={openNewWithDate}
        />
      )}

      {/* Vue liste */}
      {vue === 'liste' && (
        <>
        {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {[['a_venir', `À venir (${aVenir.length})`], ['passes', `Passés (${passes.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${tab === k ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* RDV cards */}
      <div className="space-y-3">
        {displayed.length === 0 && (
          <div className="card p-12 text-center text-gray-400">Aucun rendez-vous {tab === 'a_venir' ? 'à venir' : 'passé'}</div>
        )}
        {displayed.map(r => {
          const client = getClient(r.clientId)
          const isToday = r.date === today
          return (
            <div key={r.id} className={`card p-5 ${isToday ? 'border-indigo-300 bg-indigo-50/30' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  {/* Date block */}
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
                    <span className={`text-lg font-bold leading-none ${isToday ? 'text-white' : 'text-gray-800'}`}>
                      {r.date ? new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit' }) : '?'}
                    </span>
                    <span className={`text-[10px] uppercase font-semibold ${isToday ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {r.date ? new Date(r.date).toLocaleDateString('fr-FR', { month: 'short' }) : ''}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{r.sujet || 'Rendez-vous'}</p>
                      {isToday && <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">AUJOURD'HUI</span>}
                    </div>
                    {client && <p className="text-sm text-gray-600 mb-1">{client.nom}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {r.heure && <span className="flex items-center gap-1"><Clock size={11} />{r.heure}</span>}
                      {r.objectif && <span>{r.objectif}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {r.lienMeet && (
                    <a href={r.lienMeet} target="_blank" rel="noreferrer" className="btn-primary text-xs py-1.5">
                      <Video size={13} /> Rejoindre
                    </a>
                  )}
                  <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100"><Edit size={15} /></button>
                  <button onClick={() => { if (confirm('Supprimer ce RDV ?')) deleteRDV(r.id) }} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"><Trash2 size={15} /></button>
                </div>
              </div>

              {(r.notes || r.compteRendu || r.prochainesActions?.length > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {r.notes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{r.notes}</p>
                    </div>
                  )}
                  {r.compteRendu && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Compte rendu</p>
                      <p className="text-sm text-gray-700">{r.compteRendu}</p>
                    </div>
                  )}
                  {r.prochainesActions?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Prochaines actions</p>
                      <ul className="space-y-1">
                        {r.prochainesActions.map((a, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-1"><span className="text-indigo-400 mt-0.5">→</span>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nouveau rendez-vous" size="lg">
        <form onSubmit={handleSubmit}>
          <FormField label="Client" required>
            <select className="select mb-4" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required>
              <option value="">— Choisir un client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </FormField>
          <FormRow cols={2}>
            <FormField label="Date">
              <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </FormField>
            <FormField label="Heure">
              <input type="time" className="input" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} />
            </FormField>
          </FormRow>
          <FormField label="Sujet">
            <input className="input mb-4" value={form.sujet} onChange={e => setForm({ ...form, sujet: e.target.value })} />
          </FormField>
          <FormField label="Objectif">
            <input className="input mb-4" value={form.objectif} onChange={e => setForm({ ...form, objectif: e.target.value })} />
          </FormField>
          <FormField label="Lien Google Meet">
            <input className="input mb-4" value={form.lienMeet} onChange={e => setForm({ ...form, lienMeet: e.target.value })} placeholder="https://meet.google.com/..." />
          </FormField>
          <FormField label="Notes de préparation">
            <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Annuler</button>
            <button type="submit" className="btn-primary">Créer le RDV</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editForm && (
        <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Modifier le RDV" size="lg">
          <form onSubmit={handleEditSubmit}>
            <FormRow cols={2}>
              <FormField label="Date">
                <input type="date" className="input" value={editForm.date || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
              </FormField>
              <FormField label="Heure">
                <input type="time" className="input" value={editForm.heure || ''} onChange={e => setEditForm({ ...editForm, heure: e.target.value })} />
              </FormField>
            </FormRow>
            <FormField label="Sujet">
              <input className="input mb-4" value={editForm.sujet || ''} onChange={e => setEditForm({ ...editForm, sujet: e.target.value })} />
            </FormField>
            <FormField label="Lien Meet">
              <input className="input mb-4" value={editForm.lienMeet || ''} onChange={e => setEditForm({ ...editForm, lienMeet: e.target.value })} />
            </FormField>
            <FormField label="Notes">
              <textarea className="input resize-none mb-4" rows={2} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
            </FormField>
            <FormField label="Compte rendu">
              <textarea className="input resize-none mb-4" rows={3} value={editForm.compteRendu || ''} onChange={e => setEditForm({ ...editForm, compteRendu: e.target.value })} />
            </FormField>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="btn-secondary" onClick={() => setEditModal(null)}>Annuler</button>
              <button type="submit" className="btn-primary">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}
        </>
      )}
    </div>
  )
}
