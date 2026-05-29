import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy, Target, Percent } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { CARD, GLASS_BTN, SECTION_TITLE, PAGE_PADDING } from '../lib/styles'

const MEDAL = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    // Get all expired bets
    const { data: expiredBets } = await supabase
      .from('bets')
      .select('id')
      .lt('end_date', new Date().toISOString())

    if (!expiredBets?.length) { setLoading(false); return }

    const expiredIds = expiredBets.map(b => b.id)

    // Get all participants of expired bets
    const { data: allParticipants } = await supabase
      .from('participants')
      .select('nickname, is_eliminated, bet_id')
      .in('bet_id', expiredIds)

    if (!allParticipants?.length) { setLoading(false); return }

    // Build stats per nickname
    const map = {}
    for (const p of allParticipants) {
      if (!map[p.nickname]) map[p.nickname] = { nickname: p.nickname, wins: 0, total: 0 }
      map[p.nickname].total++
      if (!p.is_eliminated) map[p.nickname].wins++
    }

    const sorted = Object.values(map)
      .sort((a, b) => b.wins - a.wins || b.total - a.total)

    setStats(sorted)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="app-bg" />

      <div style={{ ...PAGE_PADDING, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button style={GLASS_BTN} onClick={() => navigate('/')}>
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: 28, textTransform: 'uppercase', margin: 0, letterSpacing: '-0.5px', lineHeight: 1 }}>
              Leaderboard
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>
              Basado en apuestas terminadas
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #f97316', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : stats.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Aún no hay apuestas terminadas</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, marginTop: 6 }}>Los resultados aparecerán cuando venzan las apuestas</p>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {stats.length >= 1 && (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
                {/* 2nd */}
                {stats[1] && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                    <span style={{ fontSize: 28 }}>🥈</span>
                    <div style={{ ...CARD, width: '100%', textAlign: 'center', padding: '16px 8px', borderRadius: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(192,192,192,0.15)', border: '2px solid rgba(192,192,192,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: 'silver', margin: '0 auto 8px' }}>
                        {stats[1].nickname[0].toUpperCase()}
                      </div>
                      <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stats[1].nickname}</p>
                      <p style={{ color: '#f97316', fontWeight: 800, fontSize: 20, margin: 0 }}>{stats[1].wins}</p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>victorias</p>
                    </div>
                  </div>
                )}

                {/* 1st */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span style={{ fontSize: 36 }}>🥇</span>
                  <div style={{
                    width: '100%', textAlign: 'center', padding: '20px 8px', borderRadius: 20,
                    background: 'linear-gradient(145deg, rgba(249,115,22,0.2), rgba(234,88,12,0.1))',
                    border: '1.5px solid rgba(249,115,22,0.35)',
                    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                  }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(234,88,12,0.2))', border: '2px solid rgba(249,115,22,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, color: '#fdba74', margin: '0 auto 8px' }}>
                      {stats[0].nickname[0].toUpperCase()}
                    </div>
                    <p style={{ color: 'white', fontWeight: 800, fontSize: 14, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stats[0].nickname}</p>
                    <p style={{ color: '#f97316', fontWeight: 900, fontSize: 26, margin: 0 }}>{stats[0].wins}</p>
                    <p style={{ color: 'rgba(249,115,22,0.6)', fontSize: 11, margin: 0 }}>victorias</p>
                  </div>
                </div>

                {/* 3rd */}
                {stats[2] && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                    <span style={{ fontSize: 24 }}>🥉</span>
                    <div style={{ ...CARD, width: '100%', textAlign: 'center', padding: '12px 8px', borderRadius: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(205,127,50,0.15)', border: '2px solid rgba(205,127,50,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#cd7f32', margin: '0 auto 8px' }}>
                        {stats[2].nickname[0].toUpperCase()}
                      </div>
                      <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stats[2].nickname}</p>
                      <p style={{ color: '#f97316', fontWeight: 800, fontSize: 18, margin: 0 }}>{stats[2].wins}</p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>victorias</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Full ranking list */}
            {stats.length > 3 && (
              <div>
                <p style={SECTION_TITLE}>Todos los jugadores</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stats.slice(3).map((s, i) => {
                    const pct = s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0
                    return (
                      <div key={s.nickname} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 700, fontSize: 14, width: 24, textAlign: 'center', flexShrink: 0 }}>
                          {i + 4}
                        </span>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
                          {s.nickname[0].toUpperCase()}
                        </div>
                        <span style={{ color: 'white', fontWeight: 600, fontSize: 15, flex: 1 }}>{s.nickname}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ color: '#f97316', fontWeight: 800, fontSize: 16, margin: 0 }}>{s.wins}</p>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>wins</p>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 14, margin: 0 }}>{pct}%</p>
                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, margin: 0 }}>ratio</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
