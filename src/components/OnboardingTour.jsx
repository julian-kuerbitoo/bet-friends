import { useState, useEffect } from 'react'

const STEPS = [
  {
    title: '¡Bienvenido! 🎉',
    desc: 'Te mostramos rápidamente qué hace cada botón. Podés saltear en cualquier momento.',
    spot: null, // no spotlight on first step
    tipPos: 'center',
  },
  {
    title: 'Unirse a una apuesta',
    desc: 'Tocá ··· e ingresá el código que te compartieron para unirte a una apuesta.',
    spot: 'top-right',
    tipPos: 'below',
  },
  {
    title: 'Crear apuesta ✨',
    desc: 'Tocá + para crear una nueva apuesta. Definís el título, la fecha límite y el premio.',
    spot: 'bottom-right',
    tipPos: 'above',
  },
  {
    title: 'Home 🏠',
    desc: 'Tus apuestas activas. Deslizá una tarjeta a la derecha para enviarla al Vault, o a la izquierda para eliminarla del feed.',
    spot: 'bottom-left-1',
    tipPos: 'above',
  },
  {
    title: 'Vault 🗄️',
    desc: 'Tu historial: apuestas terminadas, estadísticas de victorias y premios ganados.',
    spot: 'bottom-left-2',
    tipPos: 'above',
  },
  {
    title: 'Leaderboard 🏆',
    desc: 'Ranking de quién ha ganado más apuestas entre todos los jugadores.',
    spot: 'bottom-left-3',
    tipPos: 'above',
  },
]

function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const fn = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return size
}

function getSpotCoords(spot, w, h) {
  const B = 32 // bottom offset
  const S = 48 // button size
  const FAB = 56 // fab size
  const GAP = 10

  switch (spot) {
    case 'top-right':    return { x: w - 38, y: 64 }
    case 'bottom-right': return { x: w - 24 - FAB / 2, y: h - B - FAB / 2 }
    case 'bottom-left-1': return { x: 24 + S / 2, y: h - B - S / 2 }
    case 'bottom-left-2': return { x: 24 + S + GAP + S / 2, y: h - B - S / 2 }
    case 'bottom-left-3': return { x: 24 + (S + GAP) * 2 + S / 2, y: h - B - S / 2 }
    default: return null
  }
}

export default function OnboardingTour({ onDone }) {
  const [step, setStep] = useState(0)
  const { w, h } = useWindowSize()

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const coords = current.spot ? getSpotCoords(current.spot, w, h) : null
  const RING = 36

  function next() {
    if (isLast) {
      localStorage.setItem('bf_tour_done', '1')
      onDone()
    } else {
      setStep(s => s + 1)
    }
  }

  function skip() {
    localStorage.setItem('bf_tour_done', '1')
    onDone()
  }

  // Tooltip position
  function getTipStyle() {
    const base = {
      position: 'fixed', zIndex: 202,
      background: 'rgba(18,14,32,0.97)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 20, padding: '20px 20px 16px',
      width: 'min(320px, calc(100vw - 40px))',
    }

    if (!coords || current.tipPos === 'center') {
      return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }

    if (current.tipPos === 'above') {
      return {
        ...base,
        bottom: h - coords.y + RING + 16,
        left: '50%', transform: 'translateX(-50%)',
      }
    }

    if (current.tipPos === 'below') {
      return {
        ...base,
        top: coords.y + RING + 16,
        left: '50%', transform: 'translateX(-50%)',
      }
    }

    return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  return (
    <>
      {/* Dark overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.78)', pointerEvents: 'none' }} />

      {/* Spotlight ring */}
      {coords && (
        <div style={{
          position: 'fixed',
          left: coords.x - RING,
          top: coords.y - RING,
          width: RING * 2, height: RING * 2,
          borderRadius: '50%',
          zIndex: 201,
          boxShadow: '0 0 0 3px rgba(249,115,22,0.9), 0 0 0 8px rgba(249,115,22,0.25), 0 0 32px rgba(249,115,22,0.4)',
          animation: 'tour-pulse 1.6s ease-in-out infinite',
          pointerEvents: 'none',
          background: 'rgba(249,115,22,0.08)',
        }} />
      )}

      {/* Tooltip card */}
      <div style={getTipStyle()}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: 4, borderRadius: 99,
              width: i === step ? 20 : 4,
              background: i <= step ? '#f97316' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        <h3 style={{ color: 'white', fontWeight: 900, fontSize: 17, margin: '0 0 8px' }}>
          {current.title}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>
          {current.desc}
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={next} style={{
            flex: 1,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
            border: 'none', borderRadius: 12, padding: '12px 16px',
            color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>
            {isLast ? '¡Listo!' : 'Siguiente →'}
          </button>
          {!isLast && (
            <button onClick={skip} style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '12px 14px',
              color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>
              Saltar
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes tour-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(249,115,22,0.9), 0 0 0 8px rgba(249,115,22,0.25), 0 0 32px rgba(249,115,22,0.4); }
          50% { box-shadow: 0 0 0 3px rgba(249,115,22,1), 0 0 0 14px rgba(249,115,22,0.15), 0 0 48px rgba(249,115,22,0.5); }
        }
      `}</style>
    </>
  )
}
