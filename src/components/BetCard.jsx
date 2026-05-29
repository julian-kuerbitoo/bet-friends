import { useNavigate } from 'react-router-dom'
import { Users, Clock } from 'lucide-react'
import CountdownTimer from './CountdownTimer'

const CARD_STYLE = {
  background: 'rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  borderRadius: '20px',
  overflow: 'hidden',
  width: '100%',
  maxWidth: '460px',
  textAlign: 'left',
  transition: 'transform 0.15s',
  position: 'relative',
  display: 'block',
  cursor: 'pointer',
}

export default function BetCard({ bet }) {
  const navigate = useNavigate()
  const active = bet.participants?.filter(p => !p.is_eliminated) ?? []
  const total = bet.participants?.length ?? 0
  const isExpired = new Date(bet.end_date) <= new Date()

  return (
    <button
      onClick={() => navigate(`/bet/${bet.id}`)}
      style={CARD_STYLE}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Watermark */}
      <div style={{
        position: 'absolute', right: 12, bottom: 4,
        fontSize: 80, opacity: 0.05, pointerEvents: 'none', lineHeight: 1,
      }}>🏆</div>

      <div style={{ padding: '20px', position: 'relative', zIndex: 1 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: 16, lineHeight: 1.3, margin: 0 }}>
            {bet.title}
          </h3>
          <span style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 99,
            background: isExpired ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.15)',
            color: isExpired ? '#fca5a5' : 'rgba(255,255,255,0.9)',
            border: isExpired ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.2)',
            whiteSpace: 'nowrap',
          }}>
            {isExpired ? 'Terminada' : `${active.length} active`}
          </span>
        </div>

        {/* Created by */}
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 8px' }}>
          Created by: {bet.created_by}
        </p>

        {/* Description */}
        {bet.description && (
          <p style={{
            color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: '0 0 16px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {bet.description}
          </p>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)',
          marginTop: bet.description ? 0 : 12,
        }}>
          <div style={{ display: 'flex', gap: 16, color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} />
              <CountdownTimer endDate={bet.end_date} />
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Users size={12} />
              {total}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
