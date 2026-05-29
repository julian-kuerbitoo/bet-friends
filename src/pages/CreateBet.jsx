import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Image, X, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getNickname, generateInviteCode } from '../lib/utils'
import { CARD, ORANGE_BTN, GLASS_BTN, INPUT, LABEL, PAGE_PADDING, SECTION_TITLE } from '../lib/styles'

const STEPS = [
  { id: 1, emoji: '🎯', label: 'La apuesta' },
  { id: 2, emoji: '⏰', label: 'Cuándo termina' },
  { id: 3, emoji: '🏆', label: 'El premio' },
]

function StepDots({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
      {STEPS.map((s, i) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            height: 8,
            width: current === s.id ? 28 : 8,
            borderRadius: 99,
            transition: 'all 0.3s',
            background: current >= s.id
              ? 'linear-gradient(135deg, #f97316, #ea580c)'
              : 'rgba(255,255,255,0.15)',
          }} />
          {i < STEPS.length - 1 && (
            <div style={{ width: 12, height: 2, borderRadius: 99, background: current > s.id ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.1)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function CreateBet() {
  const navigate = useNavigate()
  const nickname = getNickname()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ title: '', description: '', end_date: '', end_time: '23:59', prize_text: '' })
  const [prizeImage, setPrizeImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleField(field, value) { setForm(f => ({ ...f, [field]: value })); setError('') }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return setError('Máximo 5MB')
    setPrizeImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleNext() {
    if (step === 1 && !form.title.trim()) return setError('El título es obligatorio')
    if (step === 2) {
      if (!form.end_date) return setError('La fecha es obligatoria')
      if (new Date(`${form.end_date}T${form.end_time}:00`) <= new Date()) return setError('La fecha debe ser en el futuro')
    }
    setError('')
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const endDateTime = new Date(`${form.end_date}T${form.end_time}:00`)
      let prize_image_url = null
      if (prizeImage) {
        const ext = prizeImage.name.split('.').pop()
        const path = `prizes/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('bet-images').upload(path, prizeImage)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('bet-images').getPublicUrl(path)
          prize_image_url = urlData.publicUrl
        }
      }
      const { data: bet, error: betError } = await supabase.from('bets').insert({
        title: form.title.trim(), description: form.description.trim() || null,
        prize_text: form.prize_text.trim() || null, prize_image_url,
        end_date: endDateTime.toISOString(), invite_code: generateInviteCode(),
        created_by: nickname, status: 'active',
      }).select().single()
      if (betError) throw betError
      await supabase.from('participants').insert({ bet_id: bet.id, nickname, is_eliminated: false })
      navigate(`/bet/${bet.id}`)
    } catch {
      setError('Error al crear. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="app-bg" />

      <div style={{ ...PAGE_PADDING, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button style={GLASS_BTN} onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}>
            <ArrowLeft size={17} />
          </button>
          <div>
            <p style={{ ...SECTION_TITLE, marginBottom: 2 }}>Paso {step} de {STEPS.length}</p>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: 22, margin: 0, textTransform: 'uppercase' }}>
              {STEPS[step - 1].emoji} {STEPS[step - 1].label}
            </h1>
          </div>
        </div>

        <StepDots current={step} />

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...CARD, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LABEL}>¿De qué va?</label>
                <input type="text" value={form.title} onChange={e => handleField('title', e.target.value)}
                  placeholder="Ej: ¿Cuántos goles mete Messi este mes?" style={INPUT} maxLength={100} autoFocus />
              </div>
              <div>
                <label style={LABEL}>Reglas / Contexto</label>
                <textarea value={form.description} onChange={e => handleField('description', e.target.value)}
                  placeholder="Aclaraciones, condiciones..."
                  style={{ ...INPUT, resize: 'none', height: 100, fontFamily: 'inherit' }}
                  maxLength={500} />
              </div>
            </div>
            {form.title && (
              <div style={{ ...CARD, padding: 20, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: 12, bottom: 4, fontSize: 72, opacity: 0.05, pointerEvents: 'none' }}>🏆</div>
                <p style={SECTION_TITLE}>Preview</p>
                <p style={{ color: 'white', fontWeight: 700, margin: 0 }}>{form.title}</p>
                {form.description && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 }}>{form.description}</p>}
              </div>
            )}
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...CARD, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LABEL}>Fecha de vencimiento</label>
                <input type="date" value={form.end_date} min={new Date().toISOString().split('T')[0]}
                  onChange={e => handleField('end_date', e.target.value)} style={INPUT} />
              </div>
              <div>
                <label style={LABEL}>Hora límite</label>
                <input type="time" value={form.end_time} onChange={e => handleField('end_time', e.target.value)} style={INPUT} />
              </div>
            </div>
            {form.end_date && (
              <div style={{ ...CARD, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 32 }}>⏳</span>
                <div>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>
                    {new Date(`${form.end_date}T${form.end_time}:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>a las {form.end_time}hs</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...CARD, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LABEL}>¿Qué se gana?</label>
                <input type="text" value={form.prize_text} onChange={e => handleField('prize_text', e.target.value)}
                  placeholder="Ej: El perdedor invita la cena" style={INPUT} maxLength={200} autoFocus />
              </div>
              {imagePreview ? (
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                  <img src={imagePreview} alt="Premio" style={{ width: '100%', height: 176, objectFit: 'cover', display: 'block' }} />
                  <button type="button" onClick={() => { setPrizeImage(null); setImagePreview(null) }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', borderRadius: 12, padding: '32px 0', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
                  <Image size={22} color="rgba(255,255,255,0.2)" />
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Agregar imagen del premio</span>
                  <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            {(form.prize_text || imagePreview) && (
              <div style={{ ...CARD, overflow: 'hidden' }}>
                {imagePreview && <img src={imagePreview} alt="Premio" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />}
                <div style={{ padding: 16 }}>
                  <p style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>🏆 Premio</p>
                  {form.prize_text && <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>{form.prize_text}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {error && <p style={{ color: '#fb923c', fontSize: 13, marginTop: 16 }}>{error}</p>}
      </div>

      {/* Fixed bottom button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, display: 'flex', justifyContent: 'center', padding: '20px 20px 36px', background: 'linear-gradient(to top, rgba(11,30,45,0.98) 60%, transparent)' }}>
        <button
          onClick={step < 3 ? handleNext : handleSubmit}
          disabled={loading}
          style={{ ...ORANGE_BTN, padding: '15px 40px', fontSize: 15, opacity: loading ? 0.5 : 1 }}
        >
          {step < 3 ? <><span>Siguiente</span><ArrowRight size={17} /></> : loading ? 'Creando...' : <><Check size={17} /><span>Crear apuesta</span></>}
        </button>
      </div>
    </div>
  )
}
