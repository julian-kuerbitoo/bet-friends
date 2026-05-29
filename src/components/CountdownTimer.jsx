import { useState, useEffect } from 'react'
import { formatTimeRemaining } from '../lib/utils'

export default function CountdownTimer({ endDate, onExpire }) {
  const [time, setTime] = useState(formatTimeRemaining(endDate))

  useEffect(() => {
    if (time.expired) {
      onExpire?.()
      return
    }
    const interval = setInterval(() => {
      const next = formatTimeRemaining(endDate)
      setTime(next)
      if (next.expired) {
        onExpire?.()
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [endDate])

  return (
    <span className={time.expired ? 'text-red-400' : 'text-violet-300'}>
      {time.label}
    </span>
  )
}
