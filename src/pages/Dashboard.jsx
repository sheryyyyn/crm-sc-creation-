import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Video, ClipboardList, Handshake, ArrowRight,
  CheckSquare, CalendarClock, Calendar, ChevronRight,
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
function TodoColumn({ profil, taches, clients, projets, moveTache, addNotification, todayStr, currentProfil }) {
  const mine = taches.filter(t => t.statut !== 'termine' && (t.assignee === profil || t.assignee === 'Les deux'))
  const items = sortTaches(mine, todayStr)

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

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: profil === 'Chainez' ? '#6f4e3d' : '#1b0b09', color: '#fdfbf4' }}>
          {profil[0]}
        </div>
        <span className="text-sm font-bold tracking-wide uppercase" style={{ color: '#1b0b09' }}>{profil === 'Chainez' ? 'Chaïnez' : profil}</span>
      </div>

      <div className="space-y-1">
        {items.length === 0 && (
          <p className="text-xs px-3 py-2" style={{ color: '#a89b8c' }}>Aucune tâche</p>
        )}
        {items.map(t => {
          const overdue = t.deadline && t.deadline < todayStr
          const assoc = getAssocLabel(t)
          const isUrgent = groupForPriorite(t.priorite) === 'urgentes'
          return (
            <div key={t.id} className="flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-[#f7f6f3] transition-colors group">
              <button
                onClick={() => handleDone(t)}
                className="mt-0.5 w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
                style={{ borderColor: '#d4c9b0', background: '#fff' }}
                title="Marquer comme terminée"
              >
                <div className="w-2 h-2 rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: '#b8a508' }} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-display text-[14px] font-bold truncate" style={{ color: '#1b0b09' }}>{t.titre}</p>
                  <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={isUrgent
                      ? { background: '#f2e4d8', color: '#8a5a2b' }
                      : { background: '#eeece7', color: '#8a8478' }}>
                    {isUrgent ? 'Urgent' : 'Secondaire'}
                  </span>
                </div>
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
  const allUpcomingRDVs = rdvs.filter(r => {
    if (!r.date) return false
    if (r.date > today) return true
    if (r.date < today) return false
    if (!r.heure) return true
    return `${r.date}T${r.heure}` > nowStr.slice(0, 16)
  }).sort((a, b) => a.date.localeCompare(b.date) || (a.heure || '').localeCompare(b.heure || ''))
  const upcomingRDVs = allUpcomingRDVs.slice(0, 3)

  const allUpcomingEcheances = taches
    .filter(t => t.deadline && t.statut !== 'termine')
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
  const upcomingEcheances = allUpcomingEcheances.slice(0, 3)

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
    <div>
      {/* Titre — toujours en tout premier */}
      <div className="mb-4">
        <h1 className="font-display text-2xl sm:text-[1.7rem] font-bold" style={{ color: '#1b0b09' }}>Dashboard</h1>
        <p className="text-sm capitalize" style={{ color: '#a89b8c' }}>{dateLabelCap}</p>
      </div>

      {/* Notifications — toujours au-dessus de la to-do */}
      {(newPartnerCount > 0 || newFormCount > 0) && (
        <div className="flex flex-col gap-2.5 mb-4">
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

    {/* ── Mobile : widgets raccourcis (pas de scroll) ── */}
    <div className="lg:hidden grid grid-cols-2 gap-3">
      <button onClick={() => navigate('/taches')}
        className="col-span-2 flex items-center gap-3 p-4 rounded-2xl text-left" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1b0b09' }}>
          <CheckSquare size={17} style={{ color: '#fdfbf4' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-base font-bold" style={{ color: '#1b0b09' }}>To-do du jour</p>
          <p className="text-xs" style={{ color: '#a89b8c' }}>{totalTodoCount} tâche{totalTodoCount > 1 ? 's' : ''} à faire</p>
        </div>
        <ChevronRight size={16} style={{ color: '#a89b8c' }} className="flex-shrink-0" />
      </button>

      <button onClick={() => navigate('/taches')}
        className="flex flex-col gap-2 p-4 rounded-2xl text-left bg-white" style={{ border: '1px solid #e7e5e1' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fcf7cf' }}>
          <CalendarClock size={16} style={{ color: '#8a7a1f' }} />
        </div>
        <p className="text-sm font-bold" style={{ color: '#1b0b09' }}>Échéances</p>
        <p className="text-xs" style={{ color: '#a89b8c' }}>{allUpcomingEcheances.length} à venir</p>
      </button>

      <button onClick={() => navigate('/rdv')}
        className="flex flex-col gap-2 p-4 rounded-2xl text-left bg-white" style={{ border: '1px solid #e7e5e1' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fcf7cf' }}>
          <Calendar size={16} style={{ color: '#8a7a1f' }} />
        </div>
        <p className="text-sm font-bold" style={{ color: '#1b0b09' }}>Rendez-vous</p>
        <p className="text-xs" style={{ color: '#a89b8c' }}>{allUpcomingRDVs.length} à venir</p>
      </button>
    </div>

    <div className="hidden lg:flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* ── Colonne gauche ── */}
      <div className="order-2 lg:order-1 w-full lg:w-[34%] xl:w-[30%] min-w-0 flex flex-col gap-5">

        {/* Prochaines échéances */}
        <div className="bg-white rounded-3xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
          <div className="px-6 py-5" style={{ borderBottom: '1px solid #eeece7' }}>
            <span className="font-display text-base font-bold" style={{ color: '#1b0b09' }}>Prochaines échéances</span>
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
                    className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-[#f7f6f3] transition-colors" style={{ borderBottom: '1px solid #eeece7' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#8a7a1f' }}>
                        {isToday ? "Aujourd'hui" : new Date(t.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="font-display text-[15px] font-bold truncate" style={{ color: '#1b0b09' }}>{t.titre}</p>
                      {getAssoc(t) && <p className="text-xs truncate" style={{ color: '#a89b8c' }}>{getAssoc(t)}</p>}
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{ background: overdue ? '#eeece7' : '#fdfbf4', color: overdue ? '#8a5a2b' : '#7e7e7e', border: '1px solid #e7e5e1' }}>
                      {overdue ? 'En retard' : isToday ? "J-0" : `J-${jours}`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Prochains rendez-vous */}
        <div className="bg-white rounded-3xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
          <div className="px-6 py-5" style={{ borderBottom: '1px solid #eeece7' }}>
            <span className="font-display text-base font-bold" style={{ color: '#1b0b09' }}>Prochains rendez-vous</span>
          </div>
          {upcomingRDVs.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#a89b8c' }}>Aucun rendez-vous à venir</p>
          ) : (
            <div>
              {upcomingRDVs.map(r => {
                const client = getClient(r.clientId)
                return (
                  <div key={r.id} className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #eeece7' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ color: '#a89b8c' }}>
                        {r.date ? new Date(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}{r.heure ? ` · ${r.heure}` : ''}
                      </p>
                      <p className="font-display text-[15px] font-bold truncate" style={{ color: '#1b0b09' }}>{r.sujet || 'Rendez-vous'}</p>
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
      <div className="order-1 lg:order-2 w-full lg:flex-1 min-w-0">
        <div className="rounded-3xl p-6 sm:p-8 h-full" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1' }}>
          <div className="flex items-center gap-2.5 mb-8">
            <span className="font-display text-xl font-bold" style={{ color: '#1b0b09' }}>TO-DO DU JOUR</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#ffffff', color: '#a89b8c', border: '1px solid #e7e5e1' }}>
              {totalTodoCount} tâche{totalTodoCount > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 sm:gap-10">
            <TodoColumn profil="Sheryn" taches={taches} clients={clients} projets={projets}
              moveTache={moveTache} addNotification={addNotification} todayStr={today} currentProfil={profil} navigate={navigate} />
            <div className="hidden sm:block w-px" style={{ background: '#eeece7' }} />
            <TodoColumn profil="Chainez" taches={taches} clients={clients} projets={projets}
              moveTache={moveTache} addNotification={addNotification} todayStr={today} currentProfil={profil} navigate={navigate} />
          </div>

          <button onClick={() => navigate('/taches')}
            className="mt-6 pt-4 w-full flex items-center gap-1.5 text-sm font-semibold"
            style={{ borderTop: '1px solid #eeece7', color: '#8a7a1f' }}>
            Ouvrir toute la to-do <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}
