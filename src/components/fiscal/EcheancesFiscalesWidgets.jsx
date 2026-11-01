import { useNavigate } from 'react-router-dom'
import { Landmark, ArrowRight, AlertTriangle, Bell } from 'lucide-react'
import useStore from '../../store/useStore'
import {
  useToday, getRappelsActifs, trierParUrgence, libelleEcheance, formatDateCourte,
} from '../../utils/echeancesFiscales'

// ─── Rappels fiscaux du Dashboard ─────────────────────────────────────────────
// Bandeaux J-15 / J-7 / J-3 / jour J / retard, recalculés à chaque rendu à partir
// de Firestore — visibles dès l'arrivée sur le Dashboard après connexion.
export function RappelsFiscaux({ className = '' }) {
  const navigate = useNavigate()
  const echeancesFiscales = useStore((s) => s.echeancesFiscales)
  const today = useToday()
  const rappels = getRappelsActifs(echeancesFiscales, today)

  if (rappels.length === 0) return null

  return (
    <div className={`flex flex-col gap-2.5 lg:gap-4 ${className}`}>
      {rappels.map(({ e, etat }) => {
        const fort = etat.niveau === 'retard'
        const Icon = fort || etat.niveau === 'jour_j' ? AlertTriangle : Bell
        return (
          <button
            key={e.id}
            onClick={() => navigate('/echeances-fiscales')}
            className="w-full flex items-center gap-3 lg:gap-4 px-5 py-4 lg:px-8 lg:py-5 rounded-2xl lg:rounded-[20px] text-left transition-opacity hover:opacity-90 active:opacity-80"
            style={{ background: fort ? '#241512' : etat.bg }}
          >
            <Icon size={20} className="flex-shrink-0" style={{ color: fort ? '#fca5a5' : etat.color }} />
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] lg:text-[17px] font-bold lg:font-semibold" style={{ color: fort ? '#FDFCF8' : '#241512' }}>
                {etat.message}
              </span>
              <span className="block text-xs lg:text-[13px] mt-0.5" style={{ color: fort ? 'rgba(253,251,244,.6)' : '#8a7a6c' }}>
                {libelleEcheance(e)} · {etat.prochaine.label} le {formatDateCourte(etat.date)}
              </span>
            </span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
              style={fort ? { background: '#ef4444', color: '#fff' } : { background: '#fff', color: etat.color }}>
              {etat.badge}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Encart "Prochaines échéances fiscales" ───────────────────────────────────
export function EcheancesFiscalesCard({ className = '' }) {
  const navigate = useNavigate()
  const echeancesFiscales = useStore((s) => s.echeancesFiscales)
  const today = useToday()
  const prochaines = trierParUrgence(echeancesFiscales, today)
    .filter(({ etat }) => etat.niveau !== 'terminee')
    .slice(0, 3)

  return (
    <div className={`bg-white rounded-2xl overflow-hidden flex-col ${className}`} style={{ border: '1px solid #e7e5e1' }}>
      <div className="px-5 lg:px-7 pt-5 lg:pt-6 pb-2 flex items-center justify-between gap-3">
        <span className="font-display text-[21px] lg:text-lg font-bold" style={{ color: '#241512' }}>Prochaines échéances fiscales</span>
        <button onClick={() => navigate('/echeances-fiscales')}
          className="flex items-center gap-1 text-xs font-bold flex-shrink-0" style={{ color: '#8a7a1f' }}>
          Tout voir <ArrowRight size={13} />
        </button>
      </div>

      {echeancesFiscales.length === 0 ? (
        <div className="px-5 lg:px-7 pt-1 pb-6">
          <p className="text-sm mb-3" style={{ color: '#a89b8c' }}>Aucune échéance configurée.</p>
          <button onClick={() => navigate('/echeances-fiscales')}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl"
            style={{ background: '#241512', color: '#FDFCF8' }}>
            <Landmark size={14} /> Configurer la TVA
          </button>
        </div>
      ) : prochaines.length === 0 ? (
        <p className="text-sm px-5 lg:px-7 pt-1 pb-6" style={{ color: '#a89b8c' }}>Toutes les échéances sont à jour ✓</p>
      ) : (
        <div className="px-5 lg:px-7 pb-5 lg:pb-6 pt-2">
          {prochaines.map(({ e, etat }) => (
            <div key={e.id} onClick={() => navigate('/echeances-fiscales')}
              className="flex items-center gap-3.5 py-3 cursor-pointer">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: etat.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold truncate" style={{ color: '#241512' }}>{libelleEcheance(e)}</p>
                <p className="text-xs truncate" style={{ color: '#a89b8c' }}>
                  {etat.date ? `${etat.prochaine.label} · ${formatDateCourte(etat.date)}` : 'Dates limites à renseigner'}
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 whitespace-nowrap"
                style={{ background: etat.bg, color: etat.color }}>
                {etat.badge}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
