import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Image, X, Check, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getNickname, generateInviteCode } from '../lib/utils'
import { CARD, ORANGE_BTN, GLASS_BTN, INPUT, LABEL, PAGE_PADDING, SECTION_TITLE } from '../lib/styles'

// ── Bet types ────────────────────────────────────────────────────────────────
const BET_TYPES = [
  {
    id: 'cuantitativa',
    emoji: '🔢',
    label: 'Cuantitativa',
    desc: 'Cada jugador predice una cantidad. Ej: cuántos goles, km, puntos.',
    placeholder: 'Ej: ¿Cuántos goles mete Messi hoy?',
    valuePlaceholder: 'Ej: 3 goles',
  },
  {
    id: 'ranking',
    emoji: '🏅',
    label: 'Ranking',
    desc: 'Cada jugador predice el orden en que ocurrirán las cosas.',
    placeholder: 'Ej: ¿En qué orden se dormirán en el viaje?',
    valuePlaceholder: null,
  },
  {
    id: 'tiempo',
    emoji: '⏱️',
    label: 'Tiempo',
    desc: 'Cada jugador predice cuánto tardará algo. Ej: llegar a un lugar.',
    placeholder: 'Ej: ¿Cuánto tarda el vuelo Buenos Aires → Miami?',
    valuePlaceholder: 'Ej: 1h 45min',
  },
]

// ── Step dots ────────────────────────────────────────────────────────────────
function StepDots({ current, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            height: 8,
            width: current === i ? 28 : 8,
            borderRadius: 99, transition: 'all 0.3s',
            background: current >= i
              ? 'linear-gradient(135deg, #f97316, #ea580c)'
              : 'rgba(255,255,255,0.15)',
          }} />
          {i < total - 1 && (
            <div style={{ width: 12, height: 2, borderRadius: 99, background: current > i ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.1)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Ranking items editor ─────────────────────────────────────────────────────
function RankingEditor({ items, onChange }) {
  const [draft, setDraft] = useState('')

  function addItem() {
    const t = draft.trim()
    if (!t || items.includes(t)) return
    onChange([...items, t])
    setDraft('')
  }

  return (
    <div>
      <label style={LABEL}>Personas / cosas a ordenar</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Ej: Juan, María, Pedro..."
          style={{ ...INPUT, flex: 1 }}
          maxLength={30}
        />
        <button type="button" onClick={addItem} style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)',
          color: '#f97316', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Plus size={18} />
        </button>
      </div>
      {items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 99, padding: '6px 12px',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{item}</span>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      {items.length < 2 && (
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 8 }}>Agregá al menos 2 elementos</p>
      )}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function CreateBet() {
  const navigate = useNavigate()
  const nickname = getNickname()

  // step: 0=type, 1=details, 2=date, 3=prize
  const [step, setStep] = useState(0)
  const [betType, setBetType] = useState(null)
  const [form, setForm] = useState({
    title: '', description: '', bet_value: '',
    end_date: '', end_time: '23:59',
    prize_text: '', watermark_emoji: '🏆',
  })
  const [rankingItems, setRankingItems] = useState([])
  const [prizeImage, setPrizeImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const typeInfo = BET_TYPES.find(t => t.id === betType)
  const TOTAL_STEPS = 3 // steps 1-3 after type selection

  function handleField(field, value) { setForm(f => ({ ...f, [field]: value })); setError('') }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return setError('Máximo 5MB')
    setPrizeImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleNext() {
    if (step === 1) {
      if (!form.title.trim()) return setError('El título es obligatorio')
      if (betType === 'ranking' && rankingItems.length < 2) return setError('Agregá al menos 2 elementos al ranking')
    }
    if (step === 2) {
      if (!form.end_date) return setError('La fecha es obligatoria')
      if (new Date(`${form.end_date}T${form.end_time}:00`) <= new Date()) return setError('La hora ya pasó, elegí una hora futura')
    }
    setError('')
    setStep(s => s + 1)
  }

  function handleBack() {
    if (step === 1) { setStep(0); setBetType(null) }
    else if (step > 1) setStep(s => s - 1)
    else navigate(-1)
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
        title: form.title.trim(),
        description: form.description.trim() || null,
        bet_value: form.bet_value.trim() || null,
        bet_type: betType,
        ranking_items: betType === 'ranking' ? rankingItems : null,
        prize_text: form.prize_text.trim() || null,
        prize_image_url,
        watermark_emoji: form.watermark_emoji || '🏆',
        end_date: endDateTime.toISOString(),
        invite_code: generateInviteCode(),
        created_by: nickname, status: 'active',
      }).select().single()
      if (betError) throw betError
      await supabase.from('participants').insert({
        bet_id: bet.id, nickname, is_eliminated: false,
        bet_value: betType === 'ranking' ? null : (form.bet_value.trim() || null),
      })
      navigate(`/bet/${bet.id}`)
    } catch {
      setError('Error al crear. Intentá de nuevo.')
      setLoading(false)
    }
  }

  // ── Step 0: Type selection ──────────────────────────────────────────────
  if (step === 0) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div className="app-bg" />
        <div style={{ ...PAGE_PADDING, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
            <button style={GLASS_BTN} onClick={() => navigate(-1)}><ArrowLeft size={17} /></button>
            <div>
              <p style={{ ...SECTION_TITLE, marginBottom: 2 }}>Nueva apuesta</p>
              <h1 style={{ color: 'white', fontWeight: 900, fontSize: 22, margin: 0, textTransform: 'uppercase' }}>
                🎲 ¿Qué tipo?
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {BET_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => { setBetType(t.id); setStep(1) }}
                style={{
                  ...CARD,
                  padding: 20, textAlign: 'left', cursor: 'pointer',
                  border: betType === t.id ? '1.5px solid rgba(249,115,22,0.6)' : '1px solid rgba(255,255,255,0.14)',
                  background: betType === t.id ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', gap: 16, width: '100%',
                  transition: 'all 0.2s',
                }}
                className="btn-press"
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                }}>
                  {t.emoji}
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>{t.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 3, lineHeight: 1.4 }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Steps 1-3 ────────────────────────────────────────────────────────────
  const stepLabels = ['La apuesta', 'Cuándo termina', 'El premio']
  const stepEmojis = [typeInfo?.emoji || '🎯', '⏰', '🏆']

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="app-bg" />

      <div style={{ ...PAGE_PADDING, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button style={GLASS_BTN} onClick={handleBack}><ArrowLeft size={17} /></button>
          <div>
            <p style={{ ...SECTION_TITLE, marginBottom: 2 }}>
              {typeInfo?.label} · Paso {step} de {TOTAL_STEPS}
            </p>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: 22, margin: 0, textTransform: 'uppercase' }}>
              {stepEmojis[step - 1]} {stepLabels[step - 1]}
            </h1>
          </div>
        </div>

        <StepDots current={step - 1} total={TOTAL_STEPS} />

        {/* Step 1: Details */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...CARD, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LABEL}>¿De qué va?</label>
                <input type="text" value={form.title} onChange={e => handleField('title', e.target.value)}
                  placeholder={typeInfo?.placeholder || 'Título de la apuesta'}
                  style={INPUT} maxLength={100} autoFocus />
              </div>

              {/* Cuantitativa / Tiempo: valor objetivo */}
              {(betType === 'cuantitativa' || betType === 'tiempo') && (
                <div>
                  <label style={LABEL}>{betType === 'tiempo' ? 'Referencia de tiempo' : 'Valor objetivo'}</label>
                  <input type="text" value={form.bet_value} onChange={e => handleField('bet_value', e.target.value)}
                    placeholder={typeInfo?.valuePlaceholder} style={INPUT} maxLength={80} />
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 6 }}>
                    Cada jugador pondrá su propia predicción al unirse
                  </p>
                </div>
              )}

              {/* Ranking: items editor */}
              {betType === 'ranking' && (
                <RankingEditor items={rankingItems} onChange={setRankingItems} />
              )}

              <div>
                <label style={LABEL}>Reglas / Contexto</label>
                <textarea value={form.description} onChange={e => handleField('description', e.target.value)}
                  placeholder="Aclaraciones, condiciones..."
                  style={{ ...INPUT, resize: 'none', height: 90, fontFamily: 'inherit' }}
                  maxLength={500} />
              </div>
            </div>

            {/* Preview */}
            {form.title && (
              <div style={{ ...CARD, padding: 20, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: 12, bottom: 4, fontSize: 72, opacity: 0.05, pointerEvents: 'none' }}>
                  {typeInfo?.emoji}
                </div>
                <p style={SECTION_TITLE}>Preview</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(249,115,22,0.15)', color: '#fdba74', border: '1px solid rgba(249,115,22,0.25)' }}>
                    {typeInfo?.emoji} {typeInfo?.label}
                  </span>
                </div>
                <p style={{ color: 'white', fontWeight: 700, margin: 0 }}>{form.title}</p>
                {betType === 'ranking' && rankingItems.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {rankingItems.map((item, i) => (
                      <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 99 }}>
                        {i + 1}. {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...CARD, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LABEL}>Fecha de vencimiento</label>
                <input type="date" value={form.end_date}
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

        {/* Step 3: Prize */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...CARD, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LABEL}>¿Qué se gana?</label>
                <input type="text" value={form.prize_text} onChange={e => handleField('prize_text', e.target.value)}
                  placeholder="Ej: El perdedor invita la cena" style={INPUT} maxLength={200} autoFocus />
              </div>

              {/* Emoji watermark */}
              <div>
                <label style={LABEL}>Emoji de la tarjeta</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  }}>
                    {form.watermark_emoji || '🏆'}
                  </div>
                  <input type="text" value={form.watermark_emoji}
                    onChange={e => handleField('watermark_emoji', e.target.value)}
                    placeholder="🏆"
                    style={{ ...INPUT, fontSize: 22, textAlign: 'center', maxWidth: 80 }}
                    maxLength={4} />
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.4 }}>
                    Cualquier emoji de tu teclado
                  </span>
                </div>
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

      {/* Bottom button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, display: 'flex', justifyContent: 'center', padding: '20px 20px 36px', background: 'linear-gradient(to top, rgba(11,30,45,0.98) 60%, transparent)' }}>
        <button
          onClick={step < 3 ? handleNext : handleSubmit}
          disabled={loading}
          style={{ ...ORANGE_BTN, padding: '15px 40px', fontSize: 15, opacity: loading ? 0.5 : 1 }}
        >
          {step < 3
            ? <><span>Siguiente</span><ArrowRight size={17} /></>
            : loading ? 'Creando...' : <><Check size={17} /><span>Crear apuesta</span></>}
        </button>
      </div>
    </div>
  )
}
