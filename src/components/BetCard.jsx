import { useNavigate } from 'react-router-dom'
import { Users, Clock } from 'lucide-react'
import CountdownTimer from './CountdownTimer'

// Convert hex to rgba for gradient
function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 7) return `rgba(0,0,0,${alpha})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const CARD_STYLE = {
  background: 'rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  borderRadius: '20px',
  overflow: 'hidden',
  width: '100%',
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
  const prizeImg = bet.prize_image_url
  const emoji = bet.watermark_emoji || '🏆'
  const hasTag = !!(bet.tag_name && bet.tag_color)

  return (
    <button
      onClick={() => navigate(`/bet/${bet.id}`)}
      style={CARD_STYLE}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Watermark — prize image or emoji */}
      {prizeImg ? (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url(${prizeImg})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.1, filter: 'blur(2px)', pointerEvents: 'none',
        }} />
      ) : (
        <div style={{
          position: 'absolute', right: 12, bottom: 4,
          fontSize: 80, opacity: 0.07, pointerEvents: 'none', lineHeight: 1, zIndex: 0,
        }}>
          {emoji}
        </div>
      )}

      {/* Tag color gradient — bottom to top */}
      {hasTag && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `linear-gradient(to top, ${hexToRgba(bet.tag_color, 0.28)} 0%, ${hexToRgba(bet.tag_color, 0.08)} 45%, transparent 100%)`,
        }} />
      )}

      <div style={{ padding: '20px', position: 'relative', zIndex: 1 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: 16, lineHeight: 1.3, margin: 0 }}>
            {bet.title}
          </h3>
          <span style={{
            flexShrink: 0, fontSize: 11, fontWeight: 600,
            padding: '4px 10px', borderRadius: 99,
            background: isExpired ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.15)',
            color: isExpired ? '#fca5a5' : 'rgba(255,255,255,0.9)',
            border: isExpired ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.2)',
            whiteSpace: 'nowrap',
          }}>
            {isExpired ? 'Terminada' : `${active.length} activos`}
          </span>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 8px' }}>
          {bet.created_by}
        </p>

        {bet.description && (
          <p style={{
            color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: '0 0 16px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {bet.description}
          </p>
        )}

        {/* Bottom row */}
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

          {/* Tag label — bottom right, no container */}
          {hasTag && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: bet.tag_color,
              letterSpacing: '0.03em',
              textShadow: `0 0 12px ${hexToRgba(bet.tag_color, 0.5)}`,
            }}>
              {bet.tag_name}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
