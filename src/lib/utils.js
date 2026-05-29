export function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function formatTimeRemaining(endDate) {
  const now = new Date()
  const end = new Date(endDate)
  const diff = end - now

  if (diff <= 0) return { label: 'Terminada', expired: true }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (days > 0) return { label: `${days}d ${hours}h`, expired: false }
  if (hours > 0) return { label: `${hours}h ${minutes}m`, expired: false }
  if (minutes > 0) return { label: `${minutes}m ${seconds}s`, expired: false }
  return { label: `${seconds}s`, expired: false }
}

export function getNickname() {
  return localStorage.getItem('bf_nickname')
}

export function setNickname(nickname) {
  localStorage.setItem('bf_nickname', nickname)
}
