import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Upload, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useConfig } from '../context/ConfigContext'
import { CARD, GLASS_BTN, PAGE_PADDING, LABEL, SECTION_TITLE } from '../lib/styles'

// ─── PIN Gate ────────────────────────────────────────────────────────────────
function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (pin === import.meta.env.VITE_ADMIN_PIN) {
      sessionStorage.setItem('bf_admin', '1')
      onUnlock()
    } else {
      setError('PIN incorrecto')
      setPin('')
    }
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', position: 'relative' }}>
      <div className="app-bg" />
      <div style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: 24, textTransform: 'uppercase', margin: 0 }}>Admin</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 6 }}>Acceso restringido</p>
        </div>
        <div style={{ ...CARD, padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={LABEL}>PIN de acceso</label>
              <input
                type="password"
                value={pin}
                onChange={e => { setPin(e.target.value); setError('') }}
                placeholder="••••••••"
                autoFocus
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '13px 16px', color: 'white', outline: 'none', fontSize: 18, width: '100%', boxSizing: 'border-box', letterSpacing: '0.2em' }}
              />
              {error && <p style={{ color: '#fb923c', fontSize: 12, marginTop: 6 }}>{error}</p>}
            </div>
            <button type="submit" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 4px 20px rgba(249,115,22,0.4)', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: 15, borderRadius: 99, padding: '14px 24px', width: '100%' }}>
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Color Picker Row ─────────────────────────────────────────────────────────
function ColorField({ label, configKey, value, onSave }) {
  const [local, setLocal] = useState(value)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    await onSave(configKey, local)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <label style={LABEL}>{label}</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="color"
            value={local}
            onChange={e => setLocal(e.target.value)}
            style={{ width: 44, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'none', cursor: 'pointer', padding: 2 }}
          />
          <input
            type="text"
            value={local}
            onChange={e => setLocal(e.target.value)}
            style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', color: 'white', outline: 'none', fontSize: 13, fontFamily: 'monospace' }}
            maxLength={7}
          />
          <button onClick={handleSave} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: saved ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', color: saved ? '#86efac' : 'rgba(255,255,255,0.5)', flexShrink: 0, transition: 'all 0.2s' }}>
            {saved ? <Check size={15} /> : <Check size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Text Field Row ───────────────────────────────────────────────────────────
function TextField({ label, configKey, value, onSave, placeholder, maxLength = 30 }) {
  const [local, setLocal] = useState(value)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    await onSave(configKey, local.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div>
      <label style={LABEL}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={local}
          onChange={e => setLocal(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '11px 14px', color: 'white', outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
        />
        <button onClick={handleSave} style={{ width: 42, borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: saved ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', color: saved ? '#86efac' : 'rgba(255,255,255,0.5)', flexShrink: 0, transition: 'all 0.2s' }}>
          <Check size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── Icon Upload ──────────────────────────────────────────────────────────────
function IconUpload({ label, configKey, currentUrl, onSave }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl || null)
  const [saved, setSaved] = useState(false)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return alert('Máximo 2MB')
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `icons/${configKey}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('bet-images').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('bet-images').getPublicUrl(path)
      setPreview(data.publicUrl)
      await onSave(configKey, data.publicUrl)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
    setUploading(false)
  }

  return (
    <div>
      <label style={LABEL}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {preview
            ? <img src={preview} alt="icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Sin imagen</span>
          }
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: uploading ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 16px', color: saved ? '#86efac' : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>
          {saved ? <Check size={15} /> : uploading ? <RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Upload size={15} />}
          {saved ? 'Guardado' : uploading ? 'Subiendo...' : 'Subir imagen'}
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
        </label>
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div>
      <p style={SECTION_TITLE}>{title}</p>
      <div style={{ ...CARD, padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {children}
      </div>
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function Admin() {
  const navigate = useNavigate()
  const config = useConfig()
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem('bf_admin') === '1')

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />

  const accentGradient = `linear-gradient(135deg, ${config.accent_1}, ${config.accent_2})`

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="app-bg" />
      <div style={{ ...PAGE_PADDING, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={GLASS_BTN} onClick={() => navigate('/')}>
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: 26, textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>
              Admin
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 4 }}>Panel de configuración</p>
          </div>
          {/* Preview badge */}
          <div style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 99, background: accentGradient, fontSize: 12, fontWeight: 700, color: 'white' }}>
            {config.app_name}
          </div>
        </div>

        {/* ── Identidad ── */}
        <Section title="Identidad">
          <TextField
            label="Nombre del app"
            configKey="app_name"
            value={config.app_name}
            onSave={config.updateConfig}
            placeholder="BetFriends"
          />
          <TextField
            label="Emoji del splash / icono"
            configKey="splash_emoji"
            value={config.splash_emoji}
            onSave={config.updateConfig}
            placeholder="🏆"
            maxLength={4}
          />
        </Section>

        {/* ── Colores ── */}
        <Section title="Colores de acento">
          <ColorField
            label="Color primario (inicio del degradado)"
            configKey="accent_1"
            value={config.accent_1}
            onSave={config.updateConfig}
          />
          <ColorField
            label="Color secundario (fin del degradado)"
            configKey="accent_2"
            value={config.accent_2}
            onSave={config.updateConfig}
          />

          {/* Live preview */}
          <div>
            <label style={LABEL}>Preview del botón</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ padding: '10px 24px', borderRadius: 99, background: accentGradient, color: 'white', fontWeight: 700, fontSize: 14 }}>
                Botón principal
              </div>
              <div style={{ padding: '10px 20px', borderRadius: 8, background: accentGradient, color: 'white', fontWeight: 700, fontSize: 13 }}>
                Botón ···
              </div>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 20 }}>
                +
              </div>
            </div>
          </div>
        </Section>

        {/* ── Fondo ── */}
        <Section title="Fondo">
          <ColorField
            label="Color superior del fondo"
            configKey="bg_top"
            value={config.bg_top}
            onSave={config.updateConfig}
          />
          <ColorField
            label="Color inferior del fondo"
            configKey="bg_bottom"
            value={config.bg_bottom}
            onSave={config.updateConfig}
          />
        </Section>

        {/* ── Íconos ── */}
        <Section title="Íconos PWA">
          <IconUpload
            label="Ícono de la app (192×192 recomendado)"
            configKey="pwa_icon_192"
            currentUrl={config.pwa_icon_192}
            onSave={config.updateConfig}
          />
          <IconUpload
            label="Ícono de la app (512×512 recomendado)"
            configKey="pwa_icon_512"
            currentUrl={config.pwa_icon_512}
            onSave={config.updateConfig}
          />
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, margin: 0 }}>
            * Los íconos PWA se usan cuando alguien agrega el app al Home Screen. Requieren reiniciar el servidor para actualizar el manifest.json.
          </p>
        </Section>

        {/* Logout */}
        <button
          onClick={() => { sessionStorage.removeItem('bf_admin'); navigate('/') }}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 20px', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%' }}
        >
          Cerrar sesión de admin
        </button>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
