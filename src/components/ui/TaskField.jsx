// Style partagé pour les formulaires "tâche" (nouvelle DA) — utilisé par la page
// Tâches et par les modals d'ajout rapide (Dashboard, QuickCreate…) pour que
// tous les points d'entrée de création de tâche se ressemblent.
export const taskInputCls = "w-full px-3.5 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all"
export const taskInputStyle = { background: '#faf9f6', border: '1px solid #e7e5e1', color: '#241512' }

export function TaskField({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#241512' }}>
        {label}{required && <span style={{ color: '#a1402d' }} className="ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
