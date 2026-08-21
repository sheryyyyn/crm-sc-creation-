import { useState } from 'react'
import { TrendingUp, CreditCard, AlertCircle, CheckCircle, Euro, ArrowUpRight } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge } from '../components/ui/Badge'

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}><Icon size={18} /></div>
        {sub && <span className="text-xs" style={{ color: '#a89b8c' }}>{sub}</span>}
      </div>
      <p className="text-2xl font-bold" style={{ color: '#241512' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: '#a89b8c' }}>{label}</p>
    </div>
  )
}

export default function Finances() {
  const { documents, clients, depenses } = useStore()
  const [moisFilter, setMoisFilter] = useState('')

  const getClient = (id) => clients.find(c => c.id === id)

  const factures = documents.filter(d => d.type === 'facture')
  const devis = documents.filter(d => d.type === 'devis')

  const caTotal = factures.filter(d => d.statut === 'paye').reduce((s, d) => s + (d.montantHT || 0), 0)
  const enAttente = factures.filter(d => d.statut !== 'paye').reduce((s, d) => s + (d.montantHT || 0), 0)
  const devisEnCours = devis.filter(d => d.statut !== 'paye').reduce((s, d) => s + (d.montantHT || 0), 0)
  const depensesTotal = depenses.reduce((s, d) => s + (d.montant || 0), 0)

  const now = new Date()
  const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const caMoisActuel = factures
    .filter(d => d.statut === 'paye' && d.dateEmission?.startsWith(moisActuel))
    .reduce((s, d) => s + (d.montantHT || 0), 0)

  const filteredFactures = moisFilter
    ? factures.filter(d => d.dateEmission?.startsWith(moisFilter))
    : factures

  const moisDispos = [...new Set(factures.map(d => d.dateEmission?.slice(0, 7)).filter(Boolean))].sort().reverse()

  // Revenue by client
  const revenueByClient = clients.map(c => {
    const total = factures.filter(d => d.clientId === c.id && d.statut === 'paye').reduce((s, d) => s + (d.montantHT || 0), 0)
    return { client: c, total }
  }).filter(r => r.total > 0).sort((a, b) => b.total - a.total)

  const inputClass = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
  const inputStyle = { background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Finances</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="CA total encaissé" value={`${caTotal.toLocaleString('fr-FR')} €`} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
        <StatCard label={`CA ${new Date().toLocaleDateString('fr-FR', { month: 'long' })}`} value={`${caMoisActuel.toLocaleString('fr-FR')} €`} icon={Euro} color="text-[#241512]" />
        <StatCard label="En attente paiement" value={`${enAttente.toLocaleString('fr-FR')} €`} icon={AlertCircle} color="bg-amber-50 text-amber-600" />
        <StatCard label="Pipeline devis" value={`${devisEnCours.toLocaleString('fr-FR')} €`} icon={CreditCard} color="bg-[#f5f4f1] text-[#241512]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Factures list */}
        <div className="lg:col-span-2 bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e7e5e1' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#e7e5e1' }}>
            <p className="text-sm font-semibold" style={{ color: '#241512' }}>Toutes les factures</p>
            <select className={`${inputClass} w-auto text-xs`} style={inputStyle} value={moisFilter} onChange={e => setMoisFilter(e.target.value)}>
              <option value="">Tous les mois</option>
              {moisDispos.map(m => (
                <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</option>
              ))}
            </select>
          </div>
          {filteredFactures.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: '#a89b8c' }}>Aucune facture</p>
          ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead>
              <tr>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3" style={{ color: '#a89b8c', background: '#f5f4f1' }}>Numéro</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3" style={{ color: '#a89b8c', background: '#f5f4f1' }}>Client</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3" style={{ color: '#a89b8c', background: '#f5f4f1' }}>Montant HT</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3" style={{ color: '#a89b8c', background: '#f5f4f1' }}>TTC</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3" style={{ color: '#a89b8c', background: '#f5f4f1' }}>Date</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3" style={{ color: '#a89b8c', background: '#f5f4f1' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredFactures.map(d => {
                const client = getClient(d.clientId)
                const ttc = (d.montantHT || 0) * (1 + (d.tva || 20) / 100)
                return (
                  <tr key={d.id} className="border-b hover:bg-[#f5f4f1] transition-colors" style={{ borderColor: '#eeece7' }}>
                    <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#241512' }}>{d.numero}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: '#241512' }}>{client?.nom || '—'}</td>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: '#241512' }}>{(d.montantHT || 0).toLocaleString('fr-FR')} €</td>
                    <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#241512' }}>{ttc.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#a89b8c' }}>{d.dateEmission ? new Date(d.dateEmission).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-5 py-3">{statutBadge(d.statut)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
          )}
          {filteredFactures.length > 0 && (
            <div className="flex justify-end px-5 py-3 border-t" style={{ borderColor: '#e7e5e1', background: '#f5f4f1' }}>
              <div className="text-sm" style={{ color: '#a89b8c' }}>
                Total HT : <strong style={{ color: '#241512' }}>{filteredFactures.reduce((s, d) => s + (d.montantHT || 0), 0).toLocaleString('fr-FR')} €</strong>
                {' '}· Payé : <strong className="text-emerald-600">{filteredFactures.filter(d => d.statut === 'paye').reduce((s, d) => s + (d.montantHT || 0), 0).toLocaleString('fr-FR')} €</strong>
              </div>
            </div>
          )}
        </div>

        {/* Revenue by client */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
            <p className="text-sm font-semibold mb-4" style={{ color: '#241512' }}>CA par client</p>
            {revenueByClient.length === 0 && <p className="text-xs text-center py-4" style={{ color: '#a89b8c' }}>Aucune donnée</p>}
            <div className="space-y-3">
              {revenueByClient.map(({ client, total }) => (
                <div key={client.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate flex-1" style={{ color: '#241512' }}>{client.nom}</span>
                    <span className="font-semibold ml-2" style={{ color: '#241512' }}>{total.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: '#f5f4f1' }}>
                    <div className="h-1.5 rounded-full" style={{ background: '#241512', width: `${caTotal ? (total / caTotal) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e7e5e1' }}>
            <p className="text-sm font-semibold mb-4" style={{ color: '#241512' }}>Récapitulatif</p>
            <div className="space-y-3">
              {[
                { label: 'CA encaissé', value: caTotal, color: 'text-emerald-600' },
                { label: 'En attente', value: enAttente, color: 'text-amber-600' },
                { label: 'Dépenses', value: depensesTotal, color: 'text-red-600' },
                { label: 'Bénéfice net', value: caTotal - depensesTotal, color: caTotal - depensesTotal >= 0 ? '' : 'text-red-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span style={{ color: '#a89b8c' }}>{label}</span>
                  <span className={`font-bold ${color}`} style={!color ? { color: '#241512' } : undefined}>{value.toLocaleString('fr-FR')} €</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
