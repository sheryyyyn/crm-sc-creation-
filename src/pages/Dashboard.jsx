import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Video, ClipboardList, Handshake, ArrowRight,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import useStore from '../store/useStore'
import { notify } from '../utils/notify'

// ─── Correspondance priorités existantes → groupes d'affichage ───────────────
// Centralisé ici pour pouvoir faire évoluer la correspondance plus tard
// sans toucher aux anciennes valeurs stockées en base.
function groupForPriorite(priorite) {
  if (priorite === 'urgente' || priorite === 'haute') return 'urgentes'
  return 'secondaires' // moyenne, normale, basse, ou valeur inconnue
}

function sortTaches(list, todayStr) {
  return [...list].sort((a, b) => {
    const rank = (t) => {
      const overdue = t.deadline && t.deadline < todayStr
      if (overdue) return 0
      if (groupForPriorite(t.priorite) === 'urgentes' && t.deadline === todayStr) return 1
      if (groupForPriorite(t.priorite) === 'urgentes') return 2
      return 3
    }
    return rank(a) - rank(b) || (a.deadline || '').localeCompare(b.deadline || '')
  })
}

// ─── Une colonne de to-do (Sheryn ou Chaïnez) ────────────────────────────────
function TodoColumn({ profil, taches, clients, projets, moveTache, addNotification, todayStr, currentProfil, navigate }) {
  const [openUrgentes, setOpenUrgentes] = useState(true)
  const [openSecondaires, setOpenSecondaires] = useState(true)

  const mine = taches.filter(t => t.statut !== 'termine' && (t.assignee === profil || t.assignee === 'Les deux'))
  const urgentes = sortTaches(mine.filter(t => groupForPriorite(t.priorite) === 'urgentes'), todayStr)
  const secondaires = sortTaches(mine.filter(t => groupForPriorite(t.priorite) === 'secondaires'), todayStr)

  const getAssocLabel = (t) => {
    const client = clients.find(c => c.id === t.clientId)
    if (client) return client.nom
    const projet = projets.find(p => p.id === t.projetId)
    return projet?.nom || null
  }

  const handleDone = (t) => {
    moveTache(t.id, 'termine')
    if (currentProfil === 'Chainez' && (t.assignee === 'Sheryn' || t.assignee === 'Les deux')) {
      addNotification({
        type: 'tache',
        titre: 'Tâche terminée par Chainez',
        message: `"${t.titre}" a été marquée comme terminée.`,
        lien: '/taches',
      })
    }
  }

  const Group = ({ title, items, open, setOpen }) => (
    <div className="mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide mb-1.5"
        style={{ background: '#fdfbf4', color: '#7e7e7e', border: '1px solid #e8e0cc' }}
      >
        <span>{title} · {items.length}</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="space-y-1">
          {items.length === 0 && (
            <p className="text-xs px-3 py-2" style={{ color: '#a89b8c' }}>Aucune tâche</p>
          )}
          {items.map(t => {
            const overdue = t.deadline && t.deadline < todayStr
            const assoc = getAssocLabel(t)
            return (
              <div key={t.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-[#fdfbf4] transition-colors group">
                <button
                  onClick={() => handleDone(t)}
                  className="mt-0.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
                  style={{ borderColor: '#d4c9b0' }}
                  title="Marquer comme terminée"
                >
                  <div className="w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: '#b8a508' }} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: '#1b0b09' }}>{t.titre}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#a89b8c' }}>
                    {assoc || '—'}
                    {t.deadline && (
                      <span style={{ color: overdue ? '#8a5a2b' : '#a89b8c' }}>
                        {' '}· {overdue ? 'En retard · ' : ''}{new Date(t.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: '#1b0b09', color: '#fdfbf4' }}>
          {profil[0]}
        </div>
        <span className="text-sm font-bold uppercase tracking-wide" style={{ color: '#1b0b09' }}>{profil === 'Chainez' ? 'Chaïnez' : profil}</span>
      </div>
      <Group title="Urgentes" items={urgentes} open={openUrgentes} setOpen={setOpenUrgentes} />
      <Group title="Secondaires" items={secondaires} open={openSecondaires} setOpen={setOpenSecondaires} />
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { taches, clients, projets, rdvs, formReponses, partenaireItems, moveTache, addNotification } = useStore()
  const profil = localStorage.getItem('sc-crm-profil') || 'Sheryn'

  const today = new Date().toISOString().split('T')[0]
  const dateLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateLabelCap = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  const nowStr = new Date().toISOString()
  const upcomingRDVs = rdvs.filter(r => {
    if (!r.date) return false
    if (r.date > today) return true
    if (r.date < today) return false
    if (!r.heure) return true
    return `${r.date}T${r.heure}` > nowStr.slice(0, 16)
  }).sort((a, b) => a.date.localeCompare(b.date) || (a.heure || '').localeCompare(b.heure || '')).slice(0, 3)

  const upcomingEcheances = taches
    .filter(t => t.deadline && t.statut !== 'termine')
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 3)

  const newFormReponses = formReponses.filter(r => !r.lu)
  const newFormCount = newFormReponses.length
  const newPartnerItems = partenaireItems.filter(p => !p.lu)
  const newPartnerCount = newPartnerItems.length
  const partnerName = newPartnerItems[0]?.partenaire || 'Cheïma'

  const getClient = (id) => clients.find(c => c.id === id)
  const getAssoc = (t) => getClient(t.clientId)?.nom || projets.find(p => p.id === t.projetId)?.nom || null

  const totalTodoCount = taches.filter(t => t.statut !== 'termine' && (t.assignee === 'Sheryn' || t.assignee === 'Chainez' || t.assignee === 'Les deux')).length

  // Rappels RDV : veille, 1h avant, 30 min avant (fonctionnalité conservée, sans bannière dédiée)
  const notifiedRdvs = useRef(new Set())
  useEffect(() => {
    function checkRdvs() {
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0]

      rdvs.forEach(r => {
        if (!r.date || !r.heure) return
        const rdvTime = new Date(`${r.date}T${r.heure}`)
        const diffMin = (rdvTime - now) / 60000
        const client = getClient(r.clientId)
        const label = `${r.sujet || 'Rendez-vous'}${client ? ` · ${client.nom}` : ''}`

        const veilleKey = `${r.id}_veille`
        if (r.date === tomorrowStr && now.getHours() === 18 && !notifiedRdvs.current.has(veilleKey)) {
          notify('📅 RDV demain', `${label} à ${r.heure}`)
          notifiedRdvs.current.add(veilleKey)
        }

        const h1Key = `${r.id}_1h`
        if (diffMin > 55 && diffMin <= 65 && !notifiedRdvs.current.has(h1Key)) {
          notify('⏰ RDV dans 1 heure', `${label} à ${r.heure}`)
          notifiedRdvs.current.add(h1Key)
        }

        const m30Key = `${r.id}_30m`
        if (diffMin > 25 && diffMin <= 35 && !notifiedRdvs.current.has(m30Key)) {
          notify(`📅 RDV dans 30 min`, `${label} à ${r.heure}`)
          notifiedRdvs.current.add(m30Key)
        }
      })
    }
    checkRdvs()
    const interval = setInterval(checkRdvs, 60000)
    return () => clearInterval(interval)
  }, [rdvs])

  return (
    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
      {/* ── Colonne gauche ── */}
      <div className="w-full lg:w-[40%] xl:w-[36%] min-w-0 flex flex-col gap-4">

        <div>
          <h1 className="font-display text-2xl sm:text-[1.7rem] font-bold" style={{ color: '#1b0b09' }}>Dashboard</h1>
          <p className="text-sm capitalize" style={{ color: '#a89b8c' }}>{dateLabelCap}</p>
        </div>

        {/* Notifications */}
        {(newPartnerCount > 0 || newFormCount > 0) && (
          <div className="flex flex-col gap-2.5">
            {newPartnerCount > 0 && (
              <button
                onClick={() => navigate('/espace-partenaire')}
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-left transition-opacity hover:opacity-90"
                style={{ background: '#1b0b09' }}
              >
                <Handshake size={16} style={{ color: '#b8a508' }} className="flex-shrink-0" />
                <span className="text-sm font-semibold flex-1" style={{ color: '#fdfbf4' }}>
                  {newPartnerCount === 1 ? '1 nouveau projet' : `${newPartnerCount} nouveaux projets`} transmis par {partnerName}
                </span>
                <ArrowRight size={14} style={{ color: 'rgba(253,251,244,.5)' }} />
              </button>
            )}
            {newFormCount > 0 && (
              <button
                onClick={() => navigate('/formulaires')}
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-left transition-opacity hover:opacity-90"
                style={{ background: '#fcf7cf' }}
              >
                <ClipboardList size={16} style={{ color: '#8a7a1f' }} className="flex-shrink-0" />
                <span className="text-sm font-semibold flex-1" style={{ color: '#1b0b09' }}>
                  {newFormCount === 1 ? '1 nouveau formulaire' : `${newFormCount} nouveaux formulaires`}
                </span>
                <ArrowRight size={14} style={{ color: '#8a7a1f' }} />
              </button>
            )}
          </div>
        )}

        {/* Prochaines échéances */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e0cc' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #f2ecda' }}>
            <span className="text-sm font-bold" style={{ color: '#1b0b09' }}>Prochaines échéances</span>
          </div>
          {upcomingEcheances.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#a89b8c' }}>Aucune échéance à venir</p>
          ) : (
            <div>
              {upcomingEcheances.map(t => {
                const overdue = t.deadline < today
                const isToday = t.deadline === today
                const jours = Math.round((new Date(t.deadline) - new Date(today)) / 86400000)
                return (
                  <div key={t.id} onClick={() => navigate('/taches')}
                    className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-[#fdfbf4] transition-colors" style={{ borderBottom: '1px solid #f2ecda' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#8a7a1f' }}>
                        {isToday ? "Aujourd'hui" : new Date(t.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-sm font-semibold truncate" style={{ color: '#1b0b09' }}>{t.titre}</p>
                      {getAssoc(t) && <p className="text-xs truncate" style={{ color: '#a89b8c' }}>{getAssoc(t)}</p>}
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{ background: overdue ? '#f2ecda' : '#fdfbf4', color: overdue ? '#8a5a2b' : '#7e7e7e', border: '1px solid #e8e0cc' }}>
                      {overdue ? 'En retard' : isToday ? "J-0" : `J-${jours}`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Prochains rendez-vous */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e0cc' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #f2ecda' }}>
            <span className="text-sm font-bold" style={{ color: '#1b0b09' }}>Prochains rendez-vous</span>
          </div>
          {upcomingRDVs.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#a89b8c' }}>Aucun rendez-vous à venir</p>
          ) : (
            <div>
              {upcomingRDVs.map(r => {
                const client = getClient(r.clientId)
                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid #f2ecda' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ color: '#a89b8c' }}>
                        {r.date ? new Date(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}{r.heure ? ` · ${r.heure}` : ''}
                      </p>
                      <p className="text-sm font-semibold truncate" style={{ color: '#1b0b09' }}>{r.sujet || 'Rendez-vous'}</p>
                      {client && <p className="text-xs truncate" style={{ color: '#a89b8c' }}>{client.nom}</p>}
                    </div>
                    {r.lienMeet && (
                      <a href={r.lienMeet} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0"
                        style={{ background: '#1b0b09', color: '#fdfbf4' }}>
                        <Video size={12} /> Rejoindre
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Colonne droite : To-do du jour ── */}
      <div className="w-full lg:flex-1 min-w-0">
        <div className="bg-white rounded-2xl p-5 sm:p-6 h-full" style={{ border: '1px solid #e8e0cc' }}>
          <div className="flex items-center gap-2.5 mb-6">
            <span className="font-display text-lg font-bold" style={{ color: '#1b0b09' }}>TO-DO DU JOUR</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#fdfbf4', color: '#a89b8c', border: '1px solid #e8e0cc' }}>
              {totalTodoCount} tâche{totalTodoCount > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <TodoColumn profil="Sheryn" taches={taches} clients={clients} projets={projets}
              moveTache={moveTache} addNotification={addNotification} todayStr={today} currentProfil={profil} navigate={navigate} />
            <div className="hidden sm:block w-px" style={{ background: '#f2ecda' }} />
            <TodoColumn profil="Chainez" taches={taches} clients={clients} projets={projets}
              moveTache={moveTache} addNotification={addNotification} todayStr={today} currentProfil={profil} navigate={navigate} />
          </div>

          <button onClick={() => navigate('/taches')}
            className="mt-6 pt-4 w-full flex items-center gap-1.5 text-sm font-semibold"
            style={{ borderTop: '1px solid #f2ecda', color: '#8a7a1f' }}>
            Ouvrir toute la to-do <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
