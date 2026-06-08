// Reusable avatar — shows photo if available, else initial with chosen color
export default function UserAvatar({ nickname, avatarUrl, avatarColor, size = 34 }) {
  const initial = (nickname || '?')[0].toUpperCase()
  const color = avatarColor || '#7c3aed'

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: avatarUrl ? 'transparent' : color,
      border: '1.5px solid rgba(255,255,255,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      fontSize: size * 0.38, fontWeight: 800, color: 'white',
      letterSpacing: '-0.5px',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initial
      }
    </div>
  )
}
