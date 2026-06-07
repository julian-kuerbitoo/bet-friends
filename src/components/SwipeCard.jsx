import { useState, useRef } from 'react'
import { Trash2, Archive } from 'lucide-react'

const THRESHOLD = 80

export default function SwipeCard({ children, onSwipeLeft, onSwipeRight }) {
  const [tx, setTx] = useState(0)
  const dragging = useRef(false)
  const startX = useRef(null)

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX
    dragging.current = true
  }

  function onTouchMove(e) {
    if (!dragging.current) return
    const delta = e.touches[0].clientX - startX.current
    setTx(Math.max(-140, Math.min(140, delta)))
  }

  function onTouchEnd() {
    dragging.current = false
    if (tx < -THRESHOLD) onSwipeLeft?.()
    else if (tx > THRESHOLD) onSwipeRight?.()
    setTx(0)
    startX.current = null
  }

  const vaultOpacity = tx > 30 ? Math.min(1, tx / THRESHOLD) : 0
  const deleteOpacity = tx < -30 ? Math.min(1, -tx / THRESHOLD) : 0

  return (
    <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden' }}>
      {/* Vault bg (swipe right) */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 20,
        background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
        display: 'flex', alignItems: 'center', paddingLeft: 24,
        gap: 8, opacity: vaultOpacity,
        pointerEvents: 'none',
      }}>
        <Archive size={22} color="white" />
        <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>Vault</span>
      </div>

      {/* Delete bg (swipe left) */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 20,
        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 24,
        gap: 8, opacity: deleteOpacity,
        pointerEvents: 'none',
      }}>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>Eliminar</span>
        <Trash2 size={22} color="white" />
      </div>

      {/* Draggable card */}
      <div
        style={{
          transform: `translateX(${tx}px)`,
          transition: dragging.current ? 'none' : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          touchAction: 'pan-y',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
