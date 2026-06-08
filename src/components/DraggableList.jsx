import { useState, useRef, useCallback } from 'react'

function loadOrder(key, items) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null')
    if (Array.isArray(saved)) return saved
  } catch {}
  return items.map(i => i.id)
}

function saveOrder(key, order) {
  localStorage.setItem(key, JSON.stringify(order))
}

function sortByOrder(items, order) {
  return [...items].sort((a, b) => {
    const ai = order.indexOf(a.id)
    const bi = order.indexOf(b.id)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}

const LONG_PRESS_MS = 450

export default function DraggableList({ items, renderItem, storageKey, gap = 10 }) {
  const [order, setOrder] = useState(() => loadOrder(storageKey, items))
  const [dragId, setDragId] = useState(null)
  const [insertIdx, setInsertIdx] = useState(null)
  const [dragY, setDragY] = useState(0)
  const [cardHeight, setCardHeight] = useState(0)

  const itemRefs = useRef({})
  const longPressRef = useRef(null)
  const touchStartRef = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)

  const sorted = sortByOrder(items, order)

  // ── Long press start ──────────────────────────────────────────────────────
  const handleTouchStart = useCallback((id, e) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    isDragging.current = false

    longPressRef.current = setTimeout(() => {
      isDragging.current = true
      const el = itemRefs.current[id]
      if (el) setCardHeight(el.getBoundingClientRect().height)
      setDragId(id)
      setDragY(touch.clientY)
      navigator.vibrate?.(40)
    }, LONG_PRESS_MS)
  }, [])

  // ── Move ──────────────────────────────────────────────────────────────────
  const handleTouchMove = useCallback((id, e) => {
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - touchStartRef.current.x)
    const dy = Math.abs(touch.clientY - touchStartRef.current.y)

    // Cancel long press if user starts swiping horizontally
    if (!isDragging.current && dx > 12) {
      clearTimeout(longPressRef.current)
      return
    }

    if (!isDragging.current) return
    e.preventDefault()
    setDragY(touch.clientY)

    // Find insert index based on pointer Y
    let newInsert = sorted.length - 1
    for (let i = 0; i < sorted.length; i++) {
      const el = itemRefs.current[sorted[i].id]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (touch.clientY < rect.top + rect.height / 2) {
        newInsert = i
        break
      }
    }
    setInsertIdx(newInsert)
  }, [sorted])

  // ── Drop ─────────────────────────────────────────────────────────────────
  const handleTouchEnd = useCallback(() => {
    clearTimeout(longPressRef.current)

    if (isDragging.current && dragId !== null && insertIdx !== null) {
      setOrder(prev => {
        const arr = [...prev]
        const fromIdx = arr.indexOf(dragId)
        if (fromIdx !== -1) arr.splice(fromIdx, 1)
        // recalculate insert after removal
        const toIdx = Math.min(insertIdx, arr.length)
        arr.splice(toIdx, 0, dragId)
        saveOrder(storageKey, arr)
        return arr
      })
    }

    isDragging.current = false
    setDragId(null)
    setInsertIdx(null)
  }, [dragId, insertIdx, storageKey])

  // ── Current drag ghost position ───────────────────────────────────────────
  const dragging = dragId !== null
  const dragCardIdx = sorted.findIndex(i => i.id === dragId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, userSelect: 'none' }}>
      {sorted.map((item, idx) => {
        const isBeingDragged = item.id === dragId

        return (
          <div key={item.id}>
            {/* Insert indicator above */}
            {dragging && insertIdx === idx && !isBeingDragged && (
              <div style={{
                height: 3, borderRadius: 99, marginBottom: gap,
                background: 'linear-gradient(90deg, #f97316, #ea580c)',
                boxShadow: '0 0 8px rgba(249,115,22,0.5)',
                transition: 'opacity 0.15s',
              }} />
            )}

            <div
              ref={el => { if (el) itemRefs.current[item.id] = el }}
              onTouchStart={e => handleTouchStart(item.id, e)}
              onTouchMove={e => handleTouchMove(item.id, e)}
              onTouchEnd={handleTouchEnd}
              style={{
                transform: isBeingDragged ? 'scale(1.03)' : 'scale(1)',
                opacity: isBeingDragged ? 0.5 : 1,
                transition: isBeingDragged ? 'none' : 'transform 0.2s, opacity 0.2s',
                zIndex: isBeingDragged ? 10 : 1,
                position: 'relative',
                touchAction: dragging ? 'none' : 'pan-y',
              }}
            >
              {renderItem(item, isBeingDragged, idx)}
            </div>

            {/* Insert indicator below last */}
            {dragging && insertIdx >= sorted.length && idx === sorted.length - 1 && !isBeingDragged && (
              <div style={{
                height: 3, borderRadius: 99, marginTop: gap,
                background: 'linear-gradient(90deg, #f97316, #ea580c)',
                boxShadow: '0 0 8px rgba(249,115,22,0.5)',
              }} />
            )}
          </div>
        )
      })}

      {/* Floating ghost */}
      {dragging && dragId && (
        <div style={{
          position: 'fixed',
          top: dragY - cardHeight / 2,
          left: 20, right: 20,
          zIndex: 50,
          pointerEvents: 'none',
          transform: 'scale(1.05)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          borderRadius: 20,
          opacity: 0.95,
          filter: 'brightness(1.1)',
        }}>
          {renderItem(sorted[dragCardIdx], false, dragCardIdx)}
        </div>
      )}

      <style>{`@keyframes drag-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </div>
  )
}
