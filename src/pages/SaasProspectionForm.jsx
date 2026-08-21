import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import useStore from '../store/useStore'

function SingleSelect({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map(o => {
        const selected = value === o
        return (
          <button key={o} type="button" onClick={() => onChange(selected ? '' : o)}
            style={{
              padding: '9px 16px', borderRadius: '999px',
              border: selected ? '1.5px solid #1b0b09' : '1.5px solid #e8e0cc',
              background: selected ? '#1b0b09' : '#fdfbf4',
              color: selected ? '#fcf7cf' : '#1b0b09',
              fontSize: '13px', fontFamily: '"DM Sans", sans-serif',
              cursor: 'pointer', fontWeight: selected ? 600 : 500,
            }}>
            {o}
          </button>
        )
      })}
    </div>
  )
}

function MultiSelect({ options, value = [], onChange }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter(v => v !== o) : [...value, o])
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map(o => {
        const selected = value.includes(o)
        return (
          <button key={o} type="button" onClick={() => toggle(o)}
            style={{
              padding: '9px 16px', borderRadius: '999px',
              border: selected ? '1.5px solid #1b0b09' : '1.5px solid #e8e0cc',
              background: selected ? '#1b0b09' : '#fdfbf4',
              color: selected ? '#fcf7cf' : '#1b0b09',
              fontSize: '13px', fontFamily: '"DM Sans", sans-serif',
              cursor: 'pointer', fontWeight: selected ? 600 : 500,
            }}>
            {o}
          </button>
        )
      })}
    </div>
  )
}

const inputBase = {
  width: '100%', padding: '13px 18px', borderRadius: '999px',
  border: '1.5px solid #e8e0cc', background: '#fdfbf4', color: '#1b0b09',
  fontSize: '14px', fontFamily: '"DM Sans", "Helvetica Neue", Helvetica, Arial, sans-serif', outline: 'none',
}
const textareaBase = { ...inputBase, borderRadius: '20px' }

export default function SaasProspectionForm({ config }) {
  const { addSaasProspect } = useStore()
  const initial = Object.fromEntries(config.prospectFields.map(f => [f.name, f.type === 'multi' ? [] : '']))
  const [values, setValues] = useState(initial)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (name, v) => setValues(prev => ({ ...prev, [name]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 500))
    addSaasProspect(config.id, values)
    setSubmitted(true)
    setLoading(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: '#fdfbf4', fontFamily: '"DM Sans", sans-serif' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: '#fff', border: '1px solid #e8e0cc', borderRadius: '20px', padding: '48px 40px', textAlign: 'center', boxShadow: '0 4px 32px rgba(27,11,9,.06)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#1b0b09', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={28} color="#fcf7cf" />
          </div>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '20px', fontWeight: 700, color: '#1b0b09', marginBottom: '8px' }}>
            Merci pour vos réponses !
          </h2>
          <p style={{ fontSize: '13.5px', color: '#7e7e7e' }}>Elles nous aident à construire {config.titre} au plus près de vos besoins.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fdfbf4', fontFamily: '"DM Sans", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />

      <div style={{ padding: '48px 16px 32px', textAlign: 'center', borderBottom: '1px solid rgba(27,11,9,.07)' }}>
        <p style={{ fontSize: '11px', letterSpacing: '.14em', color: '#b8a508', marginBottom: '12px', fontWeight: 700, textTransform: 'uppercase' }}>SC CRÉATION</p>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, color: '#1b0b09', marginBottom: '10px' }}>
          {config.titre} — étude terrain
        </h1>
        <p style={{ fontSize: '14px', color: '#7e7e7e', maxWidth: '480px', margin: '0 auto' }}>
          Quelques questions pour construire un outil vraiment utile à votre quotidien — 3 minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 16px 80px' }}>
        <div style={{ background: '#fff', border: '1px solid #e8e0cc', borderRadius: '18px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {config.prospectFields.map(f => (
            <div key={f.name}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1b0b09', marginBottom: '10px' }}>{f.label}</label>
              {f.type === 'single' && <SingleSelect options={f.options} value={values[f.name]} onChange={v => set(f.name, v)} />}
              {f.type === 'multi' && <MultiSelect options={f.options} value={values[f.name]} onChange={v => set(f.name, v)} />}
              {f.type === 'textarea' && (
                <textarea rows={3} placeholder={f.placeholder} value={values[f.name]} onChange={e => set(f.name, e.target.value)} style={{ ...textareaBase, resize: 'vertical' }} />
              )}
              {(f.type === 'text' || f.type === 'email') && (
                <input type={f.type} placeholder={f.placeholder} value={values[f.name]} onChange={e => set(f.name, e.target.value)} style={inputBase} />
              )}
            </div>
          ))}

          <button type="submit" disabled={loading}
            style={{
              padding: '15px 26px', background: '#1b0b09', color: '#fcf7cf', border: 'none', borderRadius: '999px',
              fontFamily: '"DM Sans", sans-serif', fontWeight: 600, fontSize: '13.5px',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
            {loading ? <><Loader2 size={15} className="animate-spin" />Envoi en cours…</> : <>Envoyer mes réponses ✓</>}
          </button>
        </div>
      </form>
    </div>
  )
}
