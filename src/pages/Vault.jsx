import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Archive, Trophy, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getNickname } from '../lib/utils'
import { CARD, PAGE_PADDING, SECTION_TITLE } from '../lib/styles'

function getVaultedIds() {
  try { return JSON.parse(localStorage.getItem('bf_vaulted') || '[]') } catch { return [] }
}

export default function Vault() {
  const navigate = useNavigate()
  const nickname = getNickname()
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVault()
  }, [])

  async function fetchVault() {
    const { data } = await supabase
      .from('bets')
      .select('*, participants(*)')
      .order('created_at', { ascending: false })
    setBets(data ?? [])
    setLoading(false)
  }

  const vaultedIds = getVaultedIds()

  // Bets to show: expired ones I participated in + manually vaulted
  const myBets = (bets).filter(b => b.participants?.some(p => p.nickname === nickname))
  const expiredBets = myBets.filter(b => new Date(b.end_date) <= new Date())
  const manuallyVaulted = myBets.filter(b =>
    new Date(b.end_date) > new Date() && vaultedIds.includes(b.id)
  )
  const vaultBets = [...expiredBets, ...manuallyVaulted]

  // Stats
  const won = vaultBets.filter(b => {
    const me = b.participants?.find(p => p.nickname === nickname)
    if (!me || me.is_eliminated) return false
    const active = b.participants?.filter(p => !p.is_eliminated) ?? []
    return active.length === 1 && active[0].nickname === nickname
  })

  const lost = vaultBets.filter(b => {
    const me = b.participants?.find(p => p.nickname === nickname)
    return me?.is_eliminated
  })

  const prizes = won
    .filter(b => b.prize_text)
    .map(b => ({ id: b.id, title: b.title, prize: b.prize_text, prize_image: b.prize_image }))

  const total = vaultBets.length
  const winRate = total > 0 ? Math.round((won.length / total) * 100) : 0

  return (
    <div style={{ minHeight: '100svh', position: 'relative' }}>
      <div className="app-bg" />
      <div style={{ ...PAGE_PADDING, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '50%', width: 40, height: 40,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.7)', flexShrink: 0,
            }}
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: 26, textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>
              Vault
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 4 }}>
              Historial de apuestas
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #f97316', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Stats row */}
            {total > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ ...CARD, padding: '16px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>{total}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>Total</div>
                </div>
                <div style={{ ...CARD, padding: '16px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#86efac' }}>{won.length}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>Ganadas</div>
                </div>
                <div style={{ ...CARD, padding: '16px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fca5a5' }}>{lost.length}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>Perdidas</div>
                </div>
              </div>
            )}

            {/* Win rate bar */}
            {total > 0 && (
              <div style={{ ...CARD, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {winRate >= 50
                      ? <TrendingUp size={15} color="#86efac" />
                      : <TrendingDown size={15} color="#fca5a5" />}
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>Win rate</span>
                  </div>
                  <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>{winRate}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${winRate}%`,
                    background: winRate >= 50
                      ? 'linear-gradient(90deg, #86efac, #22c55e)'
                      : 'linear-gradient(90deg, #fca5a5, #ef4444)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Prizes */}
            {prizes.length > 0 && (
              <div>
                <p style={SECTION_TITLE}>🏆 Premios ganados</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {prizes.map(p => (
                    <div key={p.id} style={{ ...CARD, padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
                      {p.prize_image && (
                        <img src={p.prize_image} alt="prize" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                          {p.title}
                        </div>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{p.prize}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bet history */}
            {vaultBets.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🗄️</div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>El vault está vacío</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 6 }}>
                  Las apuestas terminadas y las que muevas aquí aparecerán acá
                </p>
              </div>
            ) : (
              <div>
                <p style={SECTION_TITLE}>Historial</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {vaultBets.map(bet => {
                    const me = bet.participants?.find(p => p.nickname === nickname)
                    const active = bet.participants?.filter(p => !p.is_eliminated) ?? []
                    const didWin = !me?.is_eliminated && active.length === 1 && active[0].nickname === nickname
                    const didLose = me?.is_eliminated

                    return (
                      <button
                        key={bet.id}
                        onClick={() => navigate(`/bet/${bet.id}`)}
                        style={{
                          ...CARD, padding: 16,
                          display: 'flex', alignItems: 'center', gap: 14,
                          border: didWin
                            ? '1px solid rgba(134,239,172,0.25)'
                            : didLose
                            ? '1px solid rgba(252,165,165,0.2)'
                            : '1px solid rgba(255,255,255,0.14)',
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                          background: didWin ? 'rgba(134,239,172,0.15)' : didLose ? 'rgba(252,165,165,0.12)' : 'rgba(255,255,255,0.07)',
                        }}>
                          {didWin ? '🏆' : didLose ? '💀' : '⚡'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'white', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {bet.title}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
                            {bet.participants?.length ?? 0} participantes
                          </div>
                        </div>
                        <div style={{
                          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, flexShrink: 0,
                          background: didWin ? 'rgba(134,239,172,0.15)' : didLose ? 'rgba(252,165,165,0.12)' : 'rgba(255,255,255,0.08)',
                          color: didWin ? '#86efac' : didLose ? '#fca5a5' : 'rgba(255,255,255,0.5)',
                        }}>
                          {didWin ? 'Ganada' : didLose ? 'Perdida' : 'Terminada'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
