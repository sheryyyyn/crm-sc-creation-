import { useState } from 'react'
import { TrendingUp, CreditCard, AlertCircle, CheckCircle, Euro, ArrowUpRight } from 'lucide-react'
import useStore from '../store/useStore'
import { statutBadge } from '../components/ui/Badge'

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}><Icon size={18} /></div>
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Finances</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="CA total encaissé" value={`${caTotal.toLocaleString('fr-FR')} €`} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
        <StatCard label={`CA ${new Date().toLocaleDateString('fr-FR', { month: 'long' })}`} value={`${caMoisActuel.toLocaleString('fr-FR')} €`} icon={Euro} color="bg-indigo-50 text-indigo-600" />
        <StatCard label="En attente paiement" value={`${enAttente.toLocaleString('fr-FR')} €`} icon={AlertCircle} color="bg-amber-50 text-amber-600" />
        <StatCard label="Pipeline devis" value={`${devisEnCours.toLocaleString('fr-FR')} €`} icon={CreditCard} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Factures list */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Toutes les factures</p>
            <select className="select w-auto text-xs" value={moisFilter} onChange={e => setMoisFilter(e.target.value)}>
              <option value="">Tous les mois</option>
              {moisDispos.map(m => (
                <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead>
              <tr>
                <th className="table-header">Numéro</th>
                <th className="table-header">Client</th>
                <th className="table-header">Montant HT</th>
                <th className="table-header">TTC</th>
                <th className="table-header">Date</th>
                <th className="table-header">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredFactures.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Aucune facture</td></tr>}
              {filteredFactures.map(d => {
                const client = getClient(d.clientId)
                const ttc = (d.montantHT || 0) * (1 + (d.tva || 20) / 100)
                return (
                  <tr key={d.id} className="table-row">
                    <td className="table-cell font-semibold text-indigo-700">{d.numero}</td>
                    <td className="table-cell">{client?.nom || '—'}</td>
                    <td className="table-cell font-medium">{(d.montantHT || 0).toLocaleString('fr-FR')} €</td>
                    <td className="table-cell font-semibold">{ttc.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</td>
                    <td className="table-cell text-xs text-gray-500">{d.dateEmission ? new Date(d.dateEmission).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="table-cell">{statutBadge(d.statut)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
          {filteredFactures.length > 0 && (
            <div className="flex justify-end px-5 py-3 border-t border-gray-100 bg-gray-50">
              <div className="text-sm text-gray-600">
                Total HT : <strong>{filteredFactures.reduce((s, d) => s + (d.montantHT || 0), 0).toLocaleString('fr-FR')} €</strong>
                {' '}· Payé : <strong className="text-emerald-600">{filteredFactures.filter(d => d.statut === 'paye').reduce((s, d) => s + (d.montantHT || 0), 0).toLocaleString('fr-FR')} €</strong>
              </div>
            </div>
          )}
        </div>

        {/* Revenue by client */}
        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">CA par client</p>
            {revenueByClient.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Aucune donnée</p>}
            <div className="space-y-3">
              {revenueByClient.map(({ client, total }) => (
                <div key={client.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 truncate flex-1">{client.nom}</span>
                    <span className="font-semibold ml-2">{total.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${caTotal ? (total / caTotal) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">Récapitulatif</p>
            <div className="space-y-3">
              {[
                { label: 'CA encaissé', value: caTotal, color: 'text-emerald-600' },
                { label: 'En attente', value: enAttente, color: 'text-amber-600' },
                { label: 'Dépenses', value: depensesTotal, color: 'text-red-600' },
                { label: 'Bénéfice net', value: caTotal - depensesTotal, color: caTotal - depensesTotal >= 0 ? 'text-indigo-700' : 'text-red-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className={`font-bold ${color}`}>{value.toLocaleString('fr-FR')} €</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
