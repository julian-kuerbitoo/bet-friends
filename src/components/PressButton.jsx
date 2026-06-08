import { useState, useRef } from 'react'

const LONG_PRESS_MS = 450

export default function PressButton({
  label,        // tooltip text on long press
  onClick,
  style,
  className = '',
  children,
  disabled,
  type = 'button',
  tooltipPosition = 'above', // 'above' | 'below'
}) {
  const [showTip, setShowTip] = useState(false)
  const timer = useRef(null)

  function startPress() {
    if (disabled) return
    timer.current = setTimeout(() => setShowTip(true), LONG_PRESS_MS)
  }

  function endPress() {
    clearTimeout(timer.current)
    setShowTip(false)
  }

  const tipStyle = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    ...(tooltipPosition === 'above'
      ? { bottom: 'calc(100% + 10px)' }
      : { top: 'calc(100% + 10px)' }),
    background: 'rgba(10,8,20,0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: '6px 12px',
    color: 'white',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 100,
    animation: 'scaleIn 0.2s cubic-bezier(0.22,1,0.36,1) both',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  }

  // Small arrow
  const arrowStyle = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0, height: 0,
    border: '5px solid transparent',
    ...(tooltipPosition === 'above'
      ? { top: '100%', borderTopColor: 'rgba(10,8,20,0.95)' }
      : { bottom: '100%', borderBottomColor: 'rgba(10,8,20,0.95)' }),
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      {showTip && label && (
        <div style={tipStyle}>
          {label}
          <div style={arrowStyle} />
        </div>
      )}
      <button
        type={type}
        disabled={disabled}
        className={`btn-press ${className}`}
        style={{ ...style, cursor: disabled ? 'not-allowed' : 'pointer' }}
        onClick={endPress && onClick ? (e) => { endPress(); onClick(e) } : onClick}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onTouchCancel={endPress}
      >
        {children}
      </button>
    </div>
  )
}
