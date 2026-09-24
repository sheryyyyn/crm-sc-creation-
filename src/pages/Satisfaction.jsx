import { useState } from 'react'
import { Trash2, Inbox, AlertTriangle, ExternalLink } from 'lucide-react'
import useStore from '../store/useStore'
import Modal from '../components/ui/Modal'

const label = { color: '#a89b8c' }
const dark = { color: '#241512' }

// Le formulaire public (formulairedesatisfaction.netlify.app) envoie ces
// intitulés complets comme valeurs — on les réutilise tels quels ici pour
// que les réponses reçues via /api/satisfaction s'alignent avec les
// graphiques de répartition ci-dessous. Si le questionnaire est modifié un
// jour, ces listes doivent être mises à jour en même temps.
const NOTE_LABELS = { 1: 'Pas à la hauteur', 2: 'À améliorer', 3: 'Correcte', 4: 'Très satisfaisante', 5: 'Excellente' }
const NOTE_ORDER = [1, 2, 3, 4, 5]

const COMMUNICATION_OPTIONS = [
  "Un sans-faute : échanges fluides, réponses rapides, processus clair !",
  "Bien dans l'ensemble, malgré quelques petits délais de réponse",
  "Mitigé : j'ai parfois manqué d'informations",
  "Compliqué : difficile de savoir où en était le projet",
]

const RESULTAT_OPTIONS = [
  "Oui, totalement — le résultat correspond parfaitement à ce qu'on imaginait",
  "Oui, et certains éléments ont même dépassé nos attentes",
  "Globalement oui, mais quelques points auraient pu être mieux travaillés",
  "Partiellement — le résultat ne correspond pas totalement à ce qu'on avait en tête",
  "Non — il y avait un vrai écart entre nos attentes et le résultat final",
]

const MARQUANT_OPTIONS = ['Écoute & communication', 'Créativité & design', 'Rapidité', 'Accompagnement humain', 'Résultat final', 'Autre']

const FORM_URL = 'https://formulairedesatisfaction.netlify.app/'

function computeStats(reponses) {
  const count = reponses.length
  const notes = reponses.map(r => r.note).filter(n => typeof n === 'number')
  const npsScores = reponses.map(r => r.nps).filter(n => typeof n === 'number')

  const avgNote = notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null
  const avgNps = npsScores.length ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length : null

  const promoters = npsScores.filter(n => n >= 9).length
  const passives = npsScores.filter(n => n >= 7 && n <= 8).length
  const detractors = npsScores.filter(n => n <= 6).length
  const npsScore = npsScores.length ? Math.round(((promoters - detractors) / npsScores.length) * 100) : null

  const noteDist = NOTE_ORDER.map(n => ({ option: NOTE_LABELS[n], count: reponses.filter(r => r.note === n).length }))
  const commDist = COMMUNICATION_OPTIONS.map(o => ({ option: o, count: reponses.filter(r => r.communication === o).length }))
  const resultatDist = RESULTAT_OPTIONS.map(o => ({ option: o, count: reponses.filter(r => r.resultat === o).length }))
  const marquantDist = MARQUANT_OPTIONS.map(o => ({ option: o, count: reponses.filter(r => (r.marquant || []).includes(o)).length }))

  return { count, avgNote, avgNps, npsScore, promoters, passives, detractors, noteDist, commDist, resultatDist, marquantDist }
}

const PIE_COLORS = ['#c9a06a', '#c98fae', '#8fa8c9', '#8fc9a0', '#e3b98f', '#b8a89c']

// Camembert (en anneau, plus lisible qu'un vrai camembert plein) — pour les
// questions à réponse UNIQUE, comme dans le résumé Google Forms. Chaque
// tranche = un pourcentage du total de réponses ; la légende donne aussi le
// nombre de personnes, pas seulement le %.
function DonutChart({ title, data, total }) {
  const r = 58
  const strokeWidth = 28
  const circumference = 2 * Math.PI * r
  let cumulative = 0

  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
      <p className="text-sm font-bold mb-4" style={dark}>{title}</p>
      <div className="flex items-center gap-6 flex-wrap">
        <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <circle cx="75" cy="75" r={r} fill="none" stroke="#f5f4f1" strokeWidth={strokeWidth} />
          {total > 0 && data.map((d, i) => {
            if (d.count === 0) return null
            const length = (d.count / total) * circumference
            const dashoffset = -cumulative
            cumulative += length
            return (
              <circle key={d.option} cx="75" cy="75" r={r} fill="none" stroke={PIE_COLORS[i % PIE_COLORS.length]}
                strokeWidth={strokeWidth} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={dashoffset} />
            )
          })}
        </svg>
        <div className="flex-1 min-w-[190px] space-y-2">
          {data.map(({ option, count }, i) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={option} className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-xs flex-1" style={label}>{option}</span>
                <span className="text-xs font-bold flex-shrink-0 whitespace-nowrap" style={dark}>{count} · {pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Barres — gardées pour la question à choix MULTIPLE ("ce qui a marqué") :
// un camembert n'a pas de sens ici puisqu'une même personne peut cocher
// plusieurs cases, les pourcentages ne se résument donc pas à 100 %.
function DistributionCard({ title, data, barColor, total }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
      <p className="text-sm font-bold mb-4" style={dark}>{title}</p>
      <div className="space-y-2.5">
        {data.map(({ option, count }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={option} className="flex items-center gap-3">
              <span className="text-xs w-48 flex-shrink-0" style={label}>{option}</span>
              <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: '#f5f4f1' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <span className="text-xs font-bold w-10 text-right flex-shrink-0" style={dark}>{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReponseDetailModal({ reponse, onClose }) {
  const rows = [
    { k: 'Satisfaction globale', v: reponse.note != null ? `${NOTE_LABELS[reponse.note] || reponse.note} (${reponse.note}/5)` : null },
    { k: "Ce qui empêchait une note excellente", v: reponse.noteJustif },
    { k: 'Ce qui a marqué', v: (reponse.marquant || []).join(', ') },
    { k: 'Précision ("Autre")', v: reponse.autre },
    { k: 'Communication', v: reponse.communication },
    { k: 'Précision communication', v: reponse.communicationJustif },
    { k: 'Résultat final', v: reponse.resultat },
    { k: 'Précision résultat', v: reponse.resultatJustif },
    { k: "Une chose à changer pour le prochain client", v: reponse.progres },
    { k: 'Commentaire libre', v: reponse.libre },
    { k: 'Recommandation (NPS)', v: reponse.nps != null ? `${reponse.nps}/10` : null },
    { k: 'Précision NPS', v: reponse.npsJustif },
    { k: 'Témoignage', v: reponse.temoignage },
    { k: 'Email', v: reponse.email },
  ]
  return (
    <Modal isOpen onClose={onClose} title="Réponse de satisfaction" size="md">
      <div className="space-y-4">
        {rows.filter(r => r.v).map(r => (
          <div key={r.k}>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={label}>{r.k}</p>
            <p className="text-sm whitespace-pre-wrap" style={dark}>{r.v}</p>
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default function Satisfaction() {
  const { satisfactionReponses, markSatisfactionReponseRead, deleteSatisfactionReponse } = useStore()
  const [view, setView] = useState('resume')
  const [openId, setOpenId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const reponses = [...satisfactionReponses].sort((a, b) => (b.horodateur || '').localeCompare(a.horodateur || ''))
  const newCount = reponses.filter(r => !r.lu).length
  const stats = computeStats(reponses)
  const actionables = reponses.filter(r => (r.note != null && r.note <= 3) || (r.nps != null && r.nps <= 6))

  const npsColor = stats.npsScore == null ? '#a89b8c' : stats.npsScore >= 50 ? '#1e7a4c' : stats.npsScore >= 0 ? '#b8860b' : '#a1402d'

  return (
    <div>
      {openId && (
        <ReponseDetailModal reponse={reponses.find(r => r.id === openId)} onClose={() => setOpenId(null)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl font-bold" style={dark}>Satisfaction client</h1>
          <p className="text-sm mt-1" style={label}>Retours du questionnaire envoyé en fin de projet</p>
        </div>
        <a href={FORM_URL} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#eeece7] transition-colors" style={{ background: '#f5f4f1', color: '#241512' }}>
          <ExternalLink size={12} />
          Voir le formulaire
        </a>
      </div>

      {reponses.length === 0 ? (
        <div className="bg-white rounded-2xl px-7 py-12 text-center flex flex-col items-center" style={{ border: '1px solid #e7e5e1' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: '#f5f4f1' }}>
            <Inbox size={20} style={{ color: '#a89b8c' }} />
          </div>
          <p className="text-sm" style={label}>Aucune réponse reçue pour l'instant.</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e7e5e1' }}>
              <p className="text-xs mb-1" style={label}>Réponses reçues</p>
              <p className="text-2xl font-bold" style={dark}>{stats.count}</p>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e7e5e1' }}>
              <p className="text-xs mb-1" style={label}>Note moyenne</p>
              <p className="text-2xl font-bold" style={dark}>{stats.avgNote != null ? stats.avgNote.toFixed(1) : '—'} <span className="text-sm font-medium" style={label}>/ 5</span></p>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e7e5e1' }}
              title="Net Promoter Score : mesure la probabilité de recommandation. On retire le % de détracteurs (note 0-6) au % de promoteurs (note 9-10) — les notes 7-8 (passifs) ne comptent pas. Le résultat va de -100 (personne ne recommande) à +100 (tout le monde recommande).">
              <p className="text-xs mb-1" style={label}>Score NPS <span style={{ opacity: .6 }}>ⓘ</span></p>
              <p className="text-2xl font-bold" style={{ color: npsColor }}>{stats.npsScore != null ? stats.npsScore : '—'}</p>
              <p className="text-[11px] mt-0.5" style={label}>{stats.promoters} promoteurs · {stats.passives} passifs · {stats.detractors} détracteurs</p>
            </div>
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #e7e5e1' }}>
              <p className="text-xs mb-1" style={label}>Recommandation moyenne</p>
              <p className="text-2xl font-bold" style={dark}>{stats.avgNps != null ? stats.avgNps.toFixed(1) : '—'} <span className="text-sm font-medium" style={label}>/ 10</span></p>
            </div>
          </div>

          {/* Alerte retours à suivre */}
          {actionables.length > 0 && (
            <div className="rounded-2xl p-4 mb-6 flex items-start gap-3" style={{ background: '#fdf3ee', border: '1px solid #f0d9cc' }}>
              <AlertTriangle size={16} style={{ color: '#a1402d' }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold" style={{ color: '#a1402d' }}>{actionables.length} retour{actionables.length > 1 ? 's' : ''} à surveiller</p>
                <p className="text-xs mt-0.5" style={{ color: '#a1402d' }}>Note ≤ 3/5 ou NPS ≤ 6 — une tâche de suivi a été créée automatiquement dans la to-do pour chacun.</p>
              </div>
            </div>
          )}

          {/* Toggle résumé / individuel */}
          <div className="flex items-center gap-1.5 mb-4">
            {[['resume', 'Résumé'], ['individuel', 'Réponses individuelles']].map(([k, l]) => (
              <button key={k} onClick={() => setView(k)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors"
                style={view === k ? { background: '#241512', color: '#FDFCF8' } : { background: '#f5f4f1', color: '#241512' }}>
                {l}
                {k === 'individuel' && newCount > 0 && (
                  <span className={`ml-1.5 text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[16px] text-center leading-none ${view === k ? 'bg-[#FDFCF8] text-[#241512]' : 'bg-[#a1402d] text-white'}`}>
                    {newCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {view === 'resume' ? (
            <div className="space-y-4">
              <DonutChart title="Comment évalueriez-vous votre expérience avec SC Création ?" data={stats.noteDist} total={stats.count} />
              <DonutChart title="Communication" data={stats.commDist} total={stats.count} />
              <DonutChart title="Le résultat final correspond-il aux attentes ?" data={stats.resultatDist} total={stats.count} />
              <DistributionCard title="Ce qui a le plus marqué (plusieurs choix possibles)" data={stats.marquantDist} barColor="#c98fae" total={stats.count} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
              {reponses.map(r => {
                const isActionable = (r.note != null && r.note <= 3) || (r.nps != null && r.nps <= 6)
                return (
                  <div
                    key={r.id}
                    onClick={() => { if (!r.lu) markSatisfactionReponseRead(r.id); setOpenId(r.id) }}
                    className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-[#faf9f6] transition-colors"
                    style={{ borderBottom: '1px solid #f0eee9' }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={dark}>
                        {r.email || 'Réponse anonyme'}
                        {r.note != null && <span className="font-normal" style={label}> · {NOTE_LABELS[r.note] || r.note}</span>}
                        {r.nps != null && <span className="font-normal" style={label}> · NPS {r.nps}/10</span>}
                      </p>
                      <p className="text-[11px] mt-0.5" style={label}>
                        {r.horodateur ? new Date(r.horodateur).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {isActionable && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fdf3ee', color: '#a1402d' }}>À suivre</span>
                      )}
                      {!r.lu && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#f5e6e3', color: '#a1402d' }}>Nouveau</span>
                      )}
                      {confirmDeleteId === r.id ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { deleteSatisfactionReponse(r.id); setConfirmDeleteId(null) }}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">Confirmer</button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-[#eeece7]" style={{ background: '#f5f4f1', color: '#241512' }}>Annuler</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(r.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
