import { useState } from 'react'
import { Handshake, Plus, X, ArrowRight, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'

const empty = { titre: '', description: '', partenaire: 'Cheïma' }

export default function EspacePartenaire() {
  const { partenaireItems, addPartenaireItem, updatePartenaireItem, deletePartenaireItem, markPartenaireItemRead } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)

  const items = [...partenaireItems].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.titre.trim()) return
    addPartenaireItem(form)
    setForm(empty)
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold" style={{ color: '#241512' }}>Espace partenaire</h1>
          <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>Contacts et projets transmis par nos partenaires — pas encore transformés en projet.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
          style={{ background: '#241512', color: '#FDFCF8' }}
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #e7e5e1' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#f5f4f1' }}>
            <Handshake size={24} style={{ color: '#a89b8c' }} />
          </div>
          <p className="font-display text-xl font-bold" style={{ color: '#241512' }}>Aucun élément transmis</p>
          <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map(item => (
            <div key={item.id}
              onClick={() => !item.lu && markPartenaireItemRead(item.id)}
              className="bg-white rounded-2xl p-5 flex items-start justify-between gap-4 cursor-pointer hover:border-[#241512]/20 transition-colors"
              style={{ border: '1px solid #e7e5e1' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!item.lu && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#f5e6e3', color: '#a1402d' }}>
                      Nouveau
                    </span>
                  )}
                  <p className="text-sm font-bold" style={{ color: '#241512' }}>{item.titre}</p>
                </div>
                {item.description && <p className="text-xs mt-1" style={{ color: '#a89b8c' }}>{item.description}</p>}
                <p className="text-[11px] mt-2" style={{ color: '#a89b8c' }}>Transmis par {item.partenaire || 'Cheïma'} · {new Date(item.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deletePartenaireItem(item.id) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                style={{ color: '#a89b8c' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" style={{ border: '1px solid #e7e5e1' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold" style={{ color: '#241512' }}>Nouvel élément transmis</p>
              <button onClick={() => setShowForm(false)} className="hover:text-[#241512]" style={{ color: '#a89b8c' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input autoFocus placeholder="Titre (ex : Nouveau projet — Maison Alba)" value={form.titre}
                onChange={e => setForm({ ...form, titre: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} />
              <textarea placeholder="Détails (optionnel)" rows={3} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} />
              <input placeholder="Transmis par" value={form.partenaire}
                onChange={e => setForm({ ...form, partenaire: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: '#f5f4f1', border: '1px solid #e7e5e1', color: '#241512' }} />
              <button type="submit" className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl"
                style={{ background: '#241512', color: '#FDFCF8' }}>
                Ajouter <ArrowRight size={13} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
