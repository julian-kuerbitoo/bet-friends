import { useState } from 'react'
import { X } from 'lucide-react'
import { ORANGE_BTN, INPUT } from '../lib/styles'

const PRESET_REASONS = [
  'Se fue demasiado lejos',
  'Claramente perdió',
  'Por consenso del grupo',
]

export default function EliminationModal({ participant, onConfirm, onClose }) {
  const [selected, setSelected] = useState('')
  const [custom, setCustom] = useState('')
  const reason = selected === 'otro' ? custom.trim() : selected

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 24px' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      />

      {/* Sheet */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 480,
        background: 'rgba(14,10,28,0.95)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 24,
        padding: 24,
        boxSizing: 'border-box',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}
        >
          <X size={16} />
        </button>

        <h2 style={{ color: 'white', fontWeight: 800, fontSize: 18, margin: '0 0 4px' }}>Descartar participante</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 20px' }}>
          ¿Por qué descartás a <strong style={{ color: 'white' }}>{participant}</strong>?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {PRESET_REASONS.map(r => (
            <button
              key={r}
              onClick={() => { setSelected(r); setCustom('') }}
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: 12,
                border: selected === r ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.08)',
                background: selected === r ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
                color: selected === r ? '#fdba74' : 'rgba(255,255,255,0.6)',
                fontSize: 14,
                cursor: 'pointer',
                fontWeight: selected === r ? 600 : 400,
              }}
            >
              {r}
            </button>
          ))}
          <button
            onClick={() => setSelected('otro')}
            style={{
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: 12,
              border: selected === 'otro' ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(255,255,255,0.08)',
              background: selected === 'otro' ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
              color: selected === 'otro' ? '#fdba74' : 'rgba(255,255,255,0.6)',
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: selected === 'otro' ? 600 : 400,
            }}
          >
            Otro motivo...
          </button>
        </div>

        {selected === 'otro' && (
          <input
            autoFocus
            type="text"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Escribí el motivo..."
            style={{ ...INPUT, marginBottom: 16 }}
          />
        )}

        <button
          onClick={() => reason && onConfirm(reason)}
          disabled={!reason}
          style={{
            ...ORANGE_BTN,
            width: '100%',
            padding: '14px 24px',
            opacity: reason ? 1 : 0.35,
            background: reason ? 'linear-gradient(135deg, #dc2626, #db2777)' : 'rgba(255,255,255,0.07)',
            boxShadow: reason ? '0 4px 20px rgba(220,38,38,0.35)' : 'none',
            cursor: reason ? 'pointer' : 'not-allowed',
          }}
        >
          Descartar
        </button>
      </div>
    </div>
  )
}
