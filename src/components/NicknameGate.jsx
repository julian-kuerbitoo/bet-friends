import { useState } from 'react'
import { setNickname } from '../lib/utils'
import { CARD, ORANGE_BTN, INPUT, LABEL } from '../lib/styles'

export default function NicknameGate({ onSet }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const nick = value.trim()
    if (!nick) return setError('Ingresá un nickname')
    if (nick.length < 2) return setError('Mínimo 2 caracteres')
    if (nick.length > 20) return setError('Máximo 20 caracteres')
    setNickname(nick)
    onSet(nick)
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', position: 'relative', overflow: 'hidden' }}>
      <div className="app-bg" />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: 'white', fontSize: 36, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', margin: 0, lineHeight: 1 }}>
            BetFriends
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 8 }}>
            Apuestas amistosas, sin dinero de por medio
          </p>
        </div>

        {/* Card */}
        <div style={{ ...CARD, padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={LABEL}>¿Cómo te llaman?</label>
              <input
                type="text"
                value={value}
                onChange={e => { setValue(e.target.value); setError('') }}
                placeholder="Tu nickname..."
                style={{ ...INPUT, fontSize: 16 }}
                autoFocus
                autoComplete="off"
                maxLength={20}
              />
              {error && <p style={{ color: '#fb923c', fontSize: 12, marginTop: 6 }}>{error}</p>}
            </div>

            <button type="submit" style={{ ...ORANGE_BTN, padding: '14px 24px', width: '100%', fontSize: 15 }}>
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
