import { useState, useRef } from 'react'
import { Plus, Check, Paperclip, Trash2, ExternalLink, Info, Upload, FileText } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase'
import useStore from '../store/useStore'
import Modal from '../components/ui/Modal'
import { taskInputCls, taskInputStyle, TaskField } from '../components/ui/TaskField'
import { TYPES_ECHEANCE, DEMARCHES, LIEN_CALENDRIER_FISCAL } from '../data/fiscalConfig'
import {
  useToday, todayLocalStr, getEtatEcheance, getType, getPeriode, libelleEcheance, moisAttendu, formatDateCourte,
} from '../utils/echeancesFiscales'

// ─── Échéances fiscales ───────────────────────────────────────────────────────
// Suivi des déclarations / paiements (TVA trimestrielle CA3 pour l'instant).
// Collection Firestore dédiée "echeancesFiscales", indépendante de /echeances
// (qui affiche les deadlines des tâches). Justificatifs dans Storage sous fiscal/<id>/.

const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
const ordrePeriode = (e) => getType(e).periodes.findIndex(p => p.id === e.periode)

function DemarcheChip({ e, demarcheId, onToggle }) {
  const d = DEMARCHES[demarcheId]
  const fait = !!e[d.doneField]
  return (
    <button
      onClick={(ev) => { ev.stopPropagation(); onToggle(e, demarcheId) }}
      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
      style={fait ? { background: '#e6f6ee', color: '#1a9a5b' } : { background: '#f5f4f1', color: '#7e7e7e', border: '1px solid #e7e5e1' }}
      title={fait ? `${d.fait} le ${formatDateCourte(e[d.doneDateField])} — cliquer pour annuler` : `Marquer comme ${d.fait.toLowerCase()}`}
    >
      <span className="w-3.5 h-3.5 rounded-[4px] flex items-center justify-center"
        style={fait ? { background: '#1a9a5b' } : { border: '1.5px solid #c9c4ba', background: '#fff' }}>
        {fait && <Check size={10} color="#fff" strokeWidth={3} />}
      </span>
      {fait ? d.fait : d.label}
    </button>
  )
}

function GenererModal({ isOpen, onClose, echeances, onGenerer }) {
  const anneeCourante = new Date().getFullYear()
  const [type, setType] = useState('tva')
  const [annee, setAnnee] = useState(anneeCourante)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const config = TYPES_ECHEANCE[type]
  const existantes = new Set(echeances.filter(e => e.type === type && Number(e.annee) === Number(annee)).map(e => e.periode))
  const aCreer = config.periodes.filter(p => !existantes.has(p.id))

  async function handleSubmit(ev) {
    ev.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onGenerer(type, annee)
      onClose()
    } catch (err) {
      setError("Impossible de créer les échéances. Vérifie ta connexion et réessaie.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une année" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TaskField label="Type d'échéance">
            <select className={taskInputCls} style={taskInputStyle} value={type} onChange={ev => setType(ev.target.value)}>
              {Object.values(TYPES_ECHEANCE).map(t => <option key={t.id} value={t.id}>{t.label}{t.formulaire ? ` (${t.formulaire})` : ''}</option>)}
            </select>
          </TaskField>
          <TaskField label="Année">
            <select className={taskInputCls} style={taskInputStyle} value={annee} onChange={ev => setAnnee(Number(ev.target.value))}>
              {[anneeCourante - 1, anneeCourante, anneeCourante + 1].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </TaskField>
        </div>
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#faf9f6', border: '1px solid #e7e5e1', color: '#241512' }}>
          {aCreer.length === 0
            ? <p style={{ color: '#a89b8c' }}>Toutes les périodes {annee} existent déjà.</p>
            : <p>Périodes créées : <strong>{aCreer.map(p => p.label).join(', ')}</strong>. Les dates limites seront ensuite à renseigner pour chaque période.</p>}
        </div>
        {error && <p className="text-sm" style={{ color: '#a1402d' }}>{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-bold" style={{ background: '#f5f4f1', color: '#241512' }}>Annuler</button>
          <button type="submit" disabled={saving || aCreer.length === 0}
            className="px-5 py-2.5 rounded-full text-sm font-bold"
            style={{ background: '#241512', color: '#FDFCF8', opacity: saving || aCreer.length === 0 ? 0.5 : 1 }}>
            {saving ? 'Création…' : 'Créer les échéances'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EditModal({ echeance, onClose, updateEcheanceFiscale, deleteEcheanceFiscale }) {
  const [form, setForm] = useState(() => ({ ...echeance }))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  // Les justificatifs sont enregistrés immédiatement : on lit la version du store.
  const live = useStore((s) => s.echeancesFiscales.find(e => e.id === echeance.id)) || echeance
  const justificatifs = live.justificatifs || []
  const demarches = getType(echeance).demarches.map(id => ({ id, ...DEMARCHES[id] }))
  const indication = moisAttendu(echeance)

  // La date de paiement suit la date de déclaration tant qu'elle n'a pas été modifiée à part.
  function setDateDeclaration(v) {
    setForm(f => ({ ...f, dateDeclaration: v, datePaiement: !f.datePaiement || f.datePaiement === f.dateDeclaration ? v : f.datePaiement }))
  }

  function toggleDone(d, checked) {
    setForm(f => ({ ...f, [d.doneField]: checked, [d.doneDateField]: checked ? (f[d.doneDateField] || todayLocalStr()) : '' }))
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { justificatifs: _ignored, ...data } = form
      await updateEcheanceFiscale(echeance.id, data)
      onClose()
    } catch (err) {
      setError("Impossible d'enregistrer. Vérifie ta connexion et réessaie.")
    } finally {
      setSaving(false)
    }
  }

  async function handleFilesSelected(ev) {
    const files = Array.from(ev.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    setError('')
    try {
      const uploaded = []
      for (const file of files) {
        const fileId = genId()
        const storageRef = ref(storage, `fiscal/${echeance.id}/${fileId}_${file.name}`)
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)
        uploaded.push({ id: fileId, nom: file.name, url, taille: file.size, type: file.type, storagePath: storageRef.fullPath, dateAjout: new Date().toISOString() })
      }
      await updateEcheanceFiscale(echeance.id, { justificatifs: [...justificatifs, ...uploaded] })
    } catch (err) {
      console.error('Upload justificatif échoué :', err)
      setError(`Échec de l'import (${err.code || err.message || 'erreur inconnue'}).`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleFileDelete(fichier) {
    if (!confirm(`Supprimer "${fichier.nom}" ?`)) return
    await updateEcheanceFiscale(echeance.id, { justificatifs: justificatifs.filter(f => f.id !== fichier.id) })
    if (fichier.storagePath) {
      try { await deleteObject(ref(storage, fichier.storagePath)) } catch { /* fichier déjà absent du storage, on ignore */ }
    }
  }

  async function handleDelete() {
    if (!confirm(`Supprimer l'échéance ${libelleEcheance(echeance)} et ses justificatifs ?`)) return
    for (const f of justificatifs) {
      if (f.storagePath) {
        try { await deleteObject(ref(storage, f.storagePath)) } catch { /* déjà absent */ }
      }
    }
    await deleteEcheanceFiscale(echeance.id)
    onClose()
  }

  return (
    <Modal isOpen onClose={onClose} title={libelleEcheance(echeance)} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm -mt-1" style={{ color: '#a89b8c' }}>
          Période : {getPeriode(echeance).mois} {echeance.annee}
          {getType(echeance).formulaire ? ` · formulaire ${getType(echeance).formulaire}` : ''}
        </p>

        <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13px]" style={{ background: '#fcf7cf', color: '#5A352D' }}>
          <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#8a7a1f' }} />
          <p>
            {indication ? <>Échéance attendue courant <strong>{indication}</strong>. </> : null}
            Renseignez la date exacte depuis le{' '}
            <a href={LIEN_CALENDRIER_FISCAL} target="_blank" rel="noreferrer" className="underline font-semibold">calendrier fiscal officiel</a>
            {' '}ou votre espace professionnel impots.gouv.fr.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {demarches.map(d => (
            <TaskField key={d.id} label={`Date limite de ${d.label.toLowerCase()}`}>
              <input type="date" className={taskInputCls} style={taskInputStyle}
                value={form[d.dateField] || ''}
                onChange={ev => d.id === 'declaration' ? setDateDeclaration(ev.target.value) : setForm({ ...form, [d.dateField]: ev.target.value })} />
            </TaskField>
          ))}
        </div>
        <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: '#241512' }}>
          <input type="checkbox" checked={!!form.datesVerifiees} onChange={ev => setForm({ ...form, datesVerifiees: ev.target.checked })} />
          Dates vérifiées sur le calendrier fiscal officiel
        </label>

        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: '#241512' }}>Statut</p>
          <div className="space-y-2">
            {demarches.map(d => (
              <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#faf9f6', border: '1px solid #e7e5e1' }}>
                <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer flex-1 min-w-[160px]" style={{ color: '#241512' }}>
                  <input type="checkbox" checked={!!form[d.doneField]} onChange={ev => toggleDone(d, ev.target.checked)} />
                  {d.fait}
                </label>
                {form[d.doneField] && (
                  <span className="flex items-center gap-2 text-xs" style={{ color: '#a89b8c' }}>
                    le
                    <input type="date" className="px-2.5 py-1.5 text-xs rounded-lg" style={taskInputStyle}
                      value={form[d.doneDateField] || ''} onChange={ev => setForm({ ...form, [d.doneDateField]: ev.target.value })} />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TaskField label="Montant (€)">
            <input type="number" step="0.01" inputMode="decimal" className={taskInputCls} style={taskInputStyle}
              value={form.montant || ''} onChange={ev => setForm({ ...form, montant: ev.target.value })} placeholder="Optionnel" />
          </TaskField>
          <TaskField label="Notes">
            <input className={taskInputCls} style={taskInputStyle}
              value={form.notes || ''} onChange={ev => setForm({ ...form, notes: ev.target.value })} placeholder="Référence, crédit de TVA…" />
          </TaskField>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ color: '#241512' }}>Justificatifs</p>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg"
              style={{ background: '#f5f4f1', color: '#241512', border: '1px solid #e7e5e1', opacity: uploading ? 0.6 : 1 }}>
              <Upload size={13} /> {uploading ? 'Import…' : 'Ajouter'}
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesSelected} />
          </div>
          {justificatifs.length === 0 ? (
            <p className="text-xs" style={{ color: '#a89b8c' }}>Accusé de dépôt, preuve de paiement… (PDF, images)</p>
          ) : (
            <div className="space-y-1.5">
              {justificatifs.map(f => (
                <div key={f.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: '#faf9f6', border: '1px solid #e7e5e1' }}>
                  <FileText size={15} style={{ color: '#8a7a1f' }} className="flex-shrink-0" />
                  <a href={f.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0 text-sm truncate hover:underline" style={{ color: '#241512' }}>{f.nom}</a>
                  <span className="text-[11px] flex-shrink-0" style={{ color: '#a89b8c' }}>{new Date(f.dateAjout).toLocaleDateString('fr-FR')}</span>
                  <button type="button" onClick={() => handleFileDelete(f)} className="p-1 rounded hover:bg-black/5" title="Supprimer">
                    <Trash2 size={13} style={{ color: '#a1402d' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm" style={{ color: '#a1402d' }}>{error}</p>}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button type="button" onClick={handleDelete} className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#a1402d' }}>
            <Trash2 size={14} /> Supprimer
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-bold" style={{ background: '#f5f4f1', color: '#241512' }}>Annuler</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-full text-sm font-bold"
              style={{ background: '#241512', color: '#FDFCF8', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default function EcheancesFiscales() {
  const { echeancesFiscales, genererEcheancesFiscales, updateEcheanceFiscale, deleteEcheanceFiscale } = useStore()
  const today = useToday()
  const [filter, setFilter] = useState('toutes')
  const [genererOpen, setGenererOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const items = echeancesFiscales.map(e => ({ e, etat: getEtatEcheance(e, today) }))
  const counts = {
    a_venir: items.filter(i => i.etat.niveau !== 'terminee' && i.etat.niveau !== 'retard').length,
    retard: items.filter(i => i.etat.niveau === 'retard').length,
    terminees: items.filter(i => i.etat.niveau === 'terminee').length,
  }

  const filtered = items.filter(({ etat }) => {
    if (filter === 'a_venir') return etat.niveau !== 'terminee' && etat.niveau !== 'retard'
    if (filter === 'retard') return etat.niveau === 'retard'
    if (filter === 'terminees') return etat.niveau === 'terminee'
    return true
  })

  // Regroupement par année, périodes dans l'ordre (T1 → T4)
  const annees = [...new Set(filtered.map(i => Number(i.e.annee)))].sort((a, b) => b - a)
  const parAnnee = annees.map(a => ({
    annee: a,
    items: filtered.filter(i => Number(i.e.annee) === a)
      .sort((x, y) => (x.e.type || '').localeCompare(y.e.type || '') || ordrePeriode(x.e) - ordrePeriode(y.e)),
  }))

  function toggleDemarche(e, demarcheId) {
    const d = DEMARCHES[demarcheId]
    const fait = !e[d.doneField]
    updateEcheanceFiscale(e.id, { [d.doneField]: fait, [d.doneDateField]: fait ? todayLocalStr() : '' })
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold" style={{ color: '#241512' }}>Échéances fiscales</h1>
          <p className="text-sm mt-1" style={{ color: '#a89b8c' }}>TVA trimestrielle (CA3) · déclarations, paiements et justificatifs</p>
        </div>
        <button
          onClick={() => setGenererOpen(true)}
          className="flex items-center gap-2 px-4 sm:px-5 py-3 rounded-full font-bold text-sm transition-colors flex-shrink-0"
          style={{ background: '#241512', color: '#FDFCF8' }}
          onMouseEnter={ev => ev.currentTarget.style.background = '#3a2620'}
          onMouseLeave={ev => ev.currentTarget.style.background = '#241512'}
        >
          <Plus size={16} /> <span className="hidden sm:inline">Ajouter une année</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: 'toutes', label: 'Toutes' },
          { id: 'a_venir', label: `À venir${counts.a_venir ? ` · ${counts.a_venir}` : ''}` },
          { id: 'retard', label: `En retard${counts.retard ? ` · ${counts.retard}` : ''}` },
          { id: 'terminees', label: `Terminées${counts.terminees ? ` · ${counts.terminees}` : ''}` },
        ].map(f => {
          const active = filter === f.id
          return (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="px-4 py-2.5 rounded-full text-sm font-bold transition-colors whitespace-nowrap"
              style={active ? { background: '#241512', color: '#FDFCF8' } : { background: '#f5f4f1', color: '#241512' }}>
              {f.label}
            </button>
          )
        })}
      </div>

      {echeancesFiscales.length === 0 ? (
        <div className="bg-white rounded-2xl px-7 py-10 text-center" style={{ border: '1px solid #e7e5e1' }}>
          <p className="font-display text-lg font-bold mb-1" style={{ color: '#241512' }}>Aucune échéance fiscale</p>
          <p className="text-sm mb-5" style={{ color: '#a89b8c' }}>Créez les 4 trimestres de TVA de l'année, puis renseignez leurs dates limites.</p>
          <button onClick={() => setGenererOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm"
            style={{ background: '#241512', color: '#FDFCF8' }}>
            <Plus size={16} /> Ajouter une année
          </button>
        </div>
      ) : parAnnee.length === 0 ? (
        <div className="bg-white rounded-2xl px-7 py-10 text-center" style={{ border: '1px solid #e7e5e1' }}>
          <p className="text-sm" style={{ color: '#a89b8c' }}>Aucune échéance dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-8">
          {parAnnee.map(({ annee, items: lignes }) => (
            <div key={annee}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#a89b8c' }}>{annee}</p>
              <div className="flex flex-col gap-3">
                {lignes.map(({ e, etat }) => {
                  const type = getType(e)
                  const nbJustif = (e.justificatifs || []).length
                  const datesDifferentes = e.dateDeclaration && e.datePaiement && e.dateDeclaration !== e.datePaiement
                  return (
                    <div key={e.id} onClick={() => setEditing(e)}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 px-5 sm:px-7 py-5 rounded-2xl bg-white hover:bg-[#faf9f6] transition-colors cursor-pointer"
                      style={{ border: '1px solid #e7e5e1', borderLeft: `4px solid ${etat.color}` }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[16px] font-bold" style={{ color: '#241512' }}>{libelleEcheance(e)}</p>
                          {(e.dateDeclaration || e.datePaiement) && !e.datesVerifiees && etat.niveau !== 'terminee' && (
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: '#fdf4dc', color: '#b8860b' }}>Date à vérifier</span>
                          )}
                        </div>
                        <p className="text-sm mt-0.5" style={{ color: '#a89b8c' }}>
                          {getPeriode(e).mois}{type.formulaire ? ` · ${type.formulaire}` : ''}
                          {' · '}
                          {!e.dateDeclaration && !e.datePaiement
                            ? `attendue courant ${moisAttendu(e) || '—'}`
                            : datesDifferentes
                              ? `déclaration ${formatDateCourte(e.dateDeclaration)} · paiement ${formatDateCourte(e.datePaiement)}`
                              : `limite ${formatDateCourte(e.dateDeclaration || e.datePaiement)}`}
                        </p>
                        {etat.message && (
                          <p className="text-[13px] font-semibold mt-1.5" style={{ color: etat.color }}>{etat.message}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                        {type.demarches.map(id => <DemarcheChip key={id} e={e} demarcheId={id} onToggle={toggleDemarche} />)}
                        {nbJustif > 0 && (
                          <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5" style={{ color: '#a89b8c' }} title="Justificatifs">
                            <Paperclip size={13} /> {nbJustif}
                          </span>
                        )}
                        <span className="text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap" style={{ background: etat.bg, color: etat.color }}>
                          {etat.badge}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <a href={LIEN_CALENDRIER_FISCAL} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold mt-8" style={{ color: '#8a7a1f' }}>
        Calendrier fiscal officiel (impots.gouv.fr) <ExternalLink size={12} />
      </a>

      <GenererModal isOpen={genererOpen} onClose={() => setGenererOpen(false)} echeances={echeancesFiscales} onGenerer={genererEcheancesFiscales} />
      {editing && (
        <EditModal key={editing.id} echeance={editing} onClose={() => setEditing(null)}
          updateEcheanceFiscale={updateEcheanceFiscale} deleteEcheanceFiscale={deleteEcheanceFiscale} />
      )}
    </div>
  )
}
