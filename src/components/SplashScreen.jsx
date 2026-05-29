import { useEffect, useState } from 'react'
import { useConfig } from '../context/ConfigContext'

export default function SplashScreen({ onDone }) {
  const { app_name, splash_emoji, accent_1, accent_2 } = useConfig()
  const [phase, setPhase] = useState('in') // in → visible → out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'), 1800)
    const t2 = setTimeout(() => onDone(), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const accentGrad = `linear-gradient(135deg, ${accent_1}, ${accent_2})`

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, var(--bg-top) 0%, #1a0f30 50%, var(--bg-bottom) 100%)',
      opacity: phase === 'out' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.6s ease' : 'opacity 0.4s ease',
    }}>
      {/* Glow blob */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent_1}40 0%, transparent 70%)`,
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        opacity: phase === 'in' ? 0 : 1,
        transform: phase === 'in' ? 'scale(0.85)' : 'scale(1)',
        transition: 'opacity 0.5s ease 0.1s, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s',
      }}>
        {/* Icon */}
        <div style={{
          width: 88, height: 88, borderRadius: 28,
          background: accentGrad,
          boxShadow: `0 16px 48px ${accent_1}70`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40,
        }}>
          {splash_emoji}
        </div>

        {/* Wordmark */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            color: 'white', fontSize: 38, fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '-0.5px',
            margin: 0, lineHeight: 1,
          }}>
            {app_name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 8 }}>
            Apuestas amistosas
          </p>
        </div>
      </div>

      {/* Loading dots */}
      <div style={{
        position: 'absolute', bottom: 60,
        display: 'flex', gap: 6,
        opacity: phase === 'in' ? 0 : 1,
        transition: 'opacity 0.4s ease 0.4s',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: `${accent_1}99`,
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
