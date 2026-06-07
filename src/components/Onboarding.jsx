import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { setNickname } from '../lib/utils'
import { CARD, ORANGE_BTN, INPUT, LABEL } from '../lib/styles'
import { useConfig } from '../context/ConfigContext'
import { Camera, Check, RefreshCw } from 'lucide-react'

const AVATAR_COLORS = [
  '#7c3aed', '#f97316', '#06b6d4', '#10b981',
  '#f43f5e', '#eab308', '#8b5cf6', '#ec4899',
]

// ── Step dots ────────────────────────────────────────────────────────────────
function Dots({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 6, borderRadius: 99,
          width: i === step ? 24 : 6,
          background: i === step ? '#f97316' : 'rgba(255,255,255,0.2)',
          transition: 'all 0.3s ease',
        }} />
      ))}
    </div>
  )
}

// ── Avatar preview ────────────────────────────────────────────────────────────
export function AvatarCircle({ nickname, avatarUrl, color = '#7c3aed', size = 64 }) {
  const initials = (nickname || '?').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatarUrl ? 'transparent' : color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
      border: '2px solid rgba(255,255,255,0.15)',
      fontSize: size * 0.35, fontWeight: 900, color: 'white',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials
      }
    </div>
  )
}

// ── Main onboarding ───────────────────────────────────────────────────────────
export default function Onboarding({ onDone }) {
  const { app_name, accent_1, accent_2 } = useConfig()
  const [step, setStep] = useState(0) // 0=welcome, 1=nickname, 2=avatar
  const [nickname, setNick] = useState('')
  const [nickError, setNickError] = useState('')
  const [checking, setChecking] = useState(false)
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0])
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const accentGrad = `linear-gradient(135deg, ${accent_1}, ${accent_2})`

  async function handleNicknameNext() {
    const nick = nickname.trim()
    if (!nick) return setNickError('Ingresá un nickname')
    if (nick.length < 2) return setNickError('Mínimo 2 caracteres')
    if (nick.length > 20) return setNickError('Máximo 20 caracteres')
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(nick)) return setNickError('Solo letras, números y _ - .')

    setChecking(true)
    const { data } = await supabase.from('users').select('id').eq('nickname', nick).single()
    setChecking(false)
    if (data) return setNickError('Ese nickname ya está en uso')
    setStep(2)
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) return alert('Máximo 3MB')
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${nickname}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('bet-images').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('bet-images').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
    }
    setUploading(false)
  }

  async function handleFinish() {
    setSaving(true)
    const nick = nickname.trim()
    const { data, error } = await supabase
      .from('users')
      .insert({ nickname: nick, avatar_url: avatarUrl, avatar_color: avatarColor })
      .select('id')
      .single()

    if (error) {
      setSaving(false)
      setSaveError('Error al guardar: ' + (error.message || 'intentá de nuevo'))
      return
    }

    setNickname(nick)
    localStorage.setItem('bf_user_id', data.id)
    localStorage.setItem('bf_avatar_color', avatarColor)
    if (avatarUrl) localStorage.setItem('bf_avatar_url', avatarUrl)
    onDone(nick)
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', position: 'relative', overflow: 'hidden' }}>
      <div className="app-bg" />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 96, height: 96, borderRadius: 28, background: accentGrad,
              boxShadow: `0 20px 60px ${accent_1}60`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', overflow: 'hidden',
            }}>
              <img src="/icon-192.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h1 style={{ color: 'white', fontSize: 36, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', margin: '0 0 8px' }}>
              {app_name}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: '0 0 48px', lineHeight: 1.5 }}>
              Apuestas amistosas entre amigos,{'\n'}sin dinero de por medio
            </p>
            <button onClick={() => setStep(1)} style={{ ...ORANGE_BTN, padding: '16px 40px', width: '100%', fontSize: 16, borderRadius: 99 }}>
              Empezar 🎯
            </button>
          </div>
        )}

        {/* ── Step 1: Nickname ── */}
        {step === 1 && (
          <div>
            <Dots step={0} total={2} />
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 26, textTransform: 'uppercase', margin: '0 0 6px' }}>
              ¿Cómo te llaman?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 24px' }}>
              Tu nickname es único y visible para todos
            </p>
            <div style={{ ...CARD, padding: 24, marginBottom: 16 }}>
              <label style={LABEL}>Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={e => { setNick(e.target.value); setNickError('') }}
                onKeyDown={e => e.key === 'Enter' && handleNicknameNext()}
                placeholder="ej: kuerbito, julian_k"
                autoFocus
                autoComplete="off"
                maxLength={20}
                style={{ ...INPUT, fontSize: 18, fontWeight: 700 }}
              />
              {nickError && <p style={{ color: '#fb923c', fontSize: 12, marginTop: 8 }}>{nickError}</p>}
            </div>
            <button
              onClick={handleNicknameNext}
              disabled={checking}
              style={{ ...ORANGE_BTN, padding: '15px 24px', width: '100%', fontSize: 15, borderRadius: 99, opacity: checking ? 0.7 : 1 }}
            >
              {checking ? <RefreshCw size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Siguiente →'}
            </button>
          </div>
        )}

        {/* ── Step 2: Avatar ── */}
        {step === 2 && (
          <div>
            <Dots step={1} total={2} />
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 26, textTransform: 'uppercase', margin: '0 0 6px' }}>
              Tu perfil
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 24px' }}>
              Elegí un color o subí una foto
            </p>

            {/* Preview */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <div style={{ position: 'relative' }}>
                <AvatarCircle nickname={nickname} avatarUrl={avatarUrl} color={avatarColor} size={96} />
                <label style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 32, height: 32, borderRadius: '50%',
                  background: accentGrad, border: '2px solid rgba(10,8,20,1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  {uploading
                    ? <RefreshCw size={13} color="white" style={{ animation: 'spin 0.7s linear infinite' }} />
                    : <Camera size={13} color="white" />
                  }
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Nickname display */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>@{nickname}</span>
            </div>

            {/* Color picker */}
            {!avatarUrl && (
              <div style={{ ...CARD, padding: 20, marginBottom: 16 }}>
                <label style={LABEL}>Color de avatar</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setAvatarColor(c)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: c, border: 'none', cursor: 'pointer',
                        boxShadow: avatarColor === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none',
                        transition: 'box-shadow 0.15s',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {avatarUrl && (
              <button
                onClick={() => setAvatarUrl(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, width: '100%', marginBottom: 16 }}
              >
                Quitar foto y usar color
              </button>
            )}

            <button
              onClick={handleFinish}
              disabled={saving}
              style={{ ...ORANGE_BTN, padding: '15px 24px', width: '100%', fontSize: 15, borderRadius: 99, opacity: saving ? 0.7 : 1 }}
            >
              {saving
                ? <RefreshCw size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                : <><Check size={16} /> Listo, entrar</>
              }
            </button>
            {saveError && (
              <p style={{ color: '#fb923c', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                ⚠️ {saveError}
              </p>
            )}
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
