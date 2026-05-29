import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getNickname } from '../lib/utils'
import BetCard from '../components/BetCard'

export default function Home() {
  const navigate = useNavigate()
  const nickname = getNickname()
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [showJoin, setShowJoin] = useState(false)

  useEffect(() => {
    fetchBets()
    const channel = supabase
      .channel('bets-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, fetchBets)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, fetchBets)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchBets() {
    const { data } = await supabase
      .from('bets')
      .select('*, participants(*)')
      .order('created_at', { ascending: false })
    setBets(data ?? [])
    setLoading(false)
  }

  async function handleJoin(e) {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    const { data: bet } = await supabase.from('bets').select('id').eq('invite_code', code).single()
    if (!bet) return setJoinError('Código inválido')
    const { data: existing } = await supabase.from('participants').select('id').eq('bet_id', bet.id).eq('nickname', nickname).single()
    if (!existing) {
      await supabase.from('participants').insert({ bet_id: bet.id, nickname, is_eliminated: false })
    }
    navigate(`/bet/${bet.id}`)
  }

  const myBets = bets.filter(b => b.participants?.some(p => p.nickname === nickname))
  const otherBets = bets.filter(b => !b.participants?.some(p => p.nickname === nickname))

  return (
    <div className="min-h-svh flex flex-col relative">
      <div className="app-bg" />

      <div className="relative z-10 flex flex-col flex-1" style={{ padding: '48px 20px 100px' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
              Mis apuestas
            </h1>
            <p className="text-sm mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
              @{nickname}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Leaderboard button */}
          <button
            onClick={() => navigate('/leaderboard')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 6,
              padding: '4px 8px',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 36,
              minHeight: 32,
            }}
          >
            <Trophy size={16} />
          </button>

          {/* *** button */}
          <button
            onClick={() => setShowJoin(v => !v)}
            style={{
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
              borderRadius: '6px',
              padding: '4px 8px',
              color: 'white',
              fontWeight: 700,
              fontSize: 18,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 36,
              minHeight: 32,
            }}
          >
            {showJoin ? <X size={18} /> : '···'}
          </button>
          </div>
        </div>

        {/* Code join popup */}
        {showJoin && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => { setShowJoin(false); setJoinError('') }}
              style={{
                position: 'fixed', inset: 0, zIndex: 30,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
            />
            {/* Popup */}
            <div style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 31,
              width: 'calc(100% - 40px)',
              maxWidth: 480,
              background: 'rgba(20, 16, 35, 0.92)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20,
              padding: '20px 20px 20px 20px',
              boxSizing: 'border-box',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                Código de invitación
              </p>
              <form onSubmit={handleJoin} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
                  placeholder="XCSAD65"
                  maxLength={6}
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(249,115,22,0.45)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '4px 16px',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Join Bet
                </button>
              </form>
              {joinError && (
                <p style={{ color: '#fb923c', fontSize: 12, marginTop: 8 }}>{joinError}</p>
              )}
            </div>
          </>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full border-2 animate-spin"
              style={{ borderColor: '#f97316', borderTopColor: 'transparent' }} />
          </div>
        ) : bets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-white font-semibold">No hay apuestas todavía</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Tocá + para crear una nueva
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {myBets.length > 0 && (
              <section>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {myBets.map(bet => <BetCard key={bet.id} bet={bet} />)}
                </div>
              </section>
            )}

            {otherBets.length > 0 && (
              <section>
                <p className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Otras apuestas
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {otherBets.map(bet => <BetCard key={bet.id} bet={bet} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/create')}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 24,
          zIndex: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          boxShadow: '0 8px 32px rgba(249,115,22,0.45)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <Plus size={26} />
      </button>
    </div>
  )
}
