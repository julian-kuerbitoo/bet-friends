import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Trophy, Home as HomeIcon, Archive } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getNickname } from '../lib/utils'
import BetCard from '../components/BetCard'
import SwipeCard from '../components/SwipeCard'
import DraggableList from '../components/DraggableList'

function getHiddenIds() {
  try { return JSON.parse(localStorage.getItem('bf_hidden') || '[]') } catch { return [] }
}
function getVaultedIds() {
  try { return JSON.parse(localStorage.getItem('bf_vaulted') || '[]') } catch { return [] }
}
function addHidden(id) {
  const arr = getHiddenIds()
  if (!arr.includes(id)) localStorage.setItem('bf_hidden', JSON.stringify([...arr, id]))
}
function addVaulted(id) {
  const arr = getVaultedIds()
  if (!arr.includes(id)) localStorage.setItem('bf_vaulted', JSON.stringify([...arr, id]))
}

// ── Confirmation popup ──────────────────────────────────────────────────────
function ConfirmPopup({ type, bet, onConfirm, onCancel }) {
  const isVault = type === 'vault'
  return (
    <>
      <div onClick={onCancel} style={{
        position: 'fixed', inset: 0, zIndex: 40,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 41,
        background: 'rgba(18,14,32,0.96)',
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px 24px 0 0',
        padding: '28px 24px 40px',
      }}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>
          {isVault ? '🗄️' : '🗑️'}
        </div>
        <h3 style={{ color: 'white', fontWeight: 900, fontSize: 18, textAlign: 'center', margin: '0 0 8px' }}>
          {isVault ? 'Mover al Vault' : 'Eliminar del feed'}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center', margin: '0 0 24px' }}>
          {isVault
            ? `"${bet.title}" se moverá al Vault. Podrás verla en tu historial.`
            : `"${bet.title}" desaparecerá de tu feed. Siempre podrás verla en el Vault.`}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onConfirm} style={{
            background: isVault
              ? 'linear-gradient(135deg, #7c3aed, #4c1d95)'
              : 'linear-gradient(135deg, #ef4444, #b91c1c)',
            border: 'none', borderRadius: 14, padding: '15px 24px',
            color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>
            {isVault ? 'Sí, mover al Vault' : 'Sí, eliminar'}
          </button>
          <button onClick={onCancel} style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14, padding: '14px 24px',
            color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}

// ── Bottom Nav ──────────────────────────────────────────────────────────────
function BottomNav({ onVault, onLeaderboard }) {
  const navigate = useNavigate()
  const btnStyle = {
    width: 48, height: 48, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  }
  return (
    <>
      {/* Left buttons */}
      <div style={{
        position: 'fixed', bottom: 32, left: 24, zIndex: 20,
        display: 'flex', gap: 10,
      }}>
        <button style={btnStyle} onClick={() => navigate('/')}>
          <HomeIcon size={20} />
        </button>
        <button style={btnStyle} onClick={() => navigate('/vault')}>
          <Archive size={20} />
        </button>
        <button style={btnStyle} onClick={() => navigate('/leaderboard')}>
          <Trophy size={20} />
        </button>
      </div>
      {/* FAB right */}
      <button
        onClick={() => navigate('/create')}
        style={{
          position: 'fixed', bottom: 32, right: 24, zIndex: 20,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          boxShadow: '0 8px 32px rgba(249,115,22,0.45)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
        }}
      >
        <Plus size={26} />
      </button>
    </>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const nickname = getNickname()
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [confirm, setConfirm] = useState(null) // { type: 'vault'|'delete', bet }
  const [hiddenIds, setHiddenIds] = useState(getHiddenIds)
  const [vaultedIds, setVaultedIds] = useState(getVaultedIds)

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

  function handleConfirm() {
    if (!confirm) return
    if (confirm.type === 'delete') {
      addHidden(confirm.bet.id)
      setHiddenIds(getHiddenIds())
    } else {
      addVaulted(confirm.bet.id)
      setVaultedIds(getVaultedIds())
    }
    setConfirm(null)
  }

  // Active = not expired, I'm a participant, not hidden, not vaulted
  const myActiveBets = bets.filter(b =>
    b.participants?.some(p => p.nickname === nickname) &&
    new Date(b.end_date) > new Date() &&
    !hiddenIds.includes(b.id) &&
    !vaultedIds.includes(b.id)
  )

  // Other bets = active, I'm not a participant, not hidden
  const otherBets = bets.filter(b =>
    !b.participants?.some(p => p.nickname === nickname) &&
    new Date(b.end_date) > new Date() &&
    !hiddenIds.includes(b.id)
  )

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="app-bg" />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1, padding: '48px 20px 120px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ color: 'white', fontSize: 30, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', lineHeight: 1, margin: 0 }}>
              Mis apuestas
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 500, marginTop: 4 }}>
              @{nickname}
            </p>
          </div>

          <button
            onClick={() => setShowJoin(v => !v)}
            style={{
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
              borderRadius: '6px', padding: '4px 8px',
              color: 'white', fontWeight: 700, fontSize: 18,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 36, minHeight: 32,
            }}
          >
            {showJoin ? <X size={18} /> : '···'}
          </button>
        </div>

        {/* Join popup */}
        {showJoin && (
          <>
            <div onClick={() => { setShowJoin(false); setJoinError('') }} style={{
              position: 'fixed', inset: 0, zIndex: 30,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            }} />
            <div style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', zIndex: 31,
              width: 'calc(100% - 40px)', maxWidth: 480,
              background: 'rgba(20,16,35,0.92)',
              backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20, padding: '20px', boxSizing: 'border-box',
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
                    flex: 1, background: 'rgba(255,255,255,0.07)',
                    border: '1.5px solid rgba(249,115,22,0.45)',
                    borderRadius: 10, padding: '12px 16px',
                    color: 'white', fontWeight: 700, fontSize: 14,
                    letterSpacing: '0.15em', textTransform: 'uppercase', outline: 'none',
                  }}
                />
                <button type="submit" style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                  border: 'none', borderRadius: 10, padding: '4px 16px',
                  color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  Join Bet
                </button>
              </form>
              {joinError && <p style={{ color: '#fb923c', fontSize: 12, marginTop: 8 }}>{joinError}</p>}
            </div>
          </>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #f97316', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* My active bets */}
            {myActiveBets.length === 0 && otherBets.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>No hay apuestas activas</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 6 }}>
                  Tocá + para crear una nueva
                </p>
              </div>
            ) : (
              <>
                {myActiveBets.length > 0 && (
                  <section>
                    <DraggableList
                      items={myActiveBets}
                      storageKey={`bf_order_${nickname}`}
                      gap={10}
                      renderItem={(bet) => (
                        <SwipeCard
                          onSwipeLeft={() => setConfirm({ type: 'delete', bet })}
                          onSwipeRight={() => setConfirm({ type: 'vault', bet })}
                        >
                          <BetCard bet={bet} />
                        </SwipeCard>
                      )}
                    />
                  </section>
                )}

                {otherBets.length > 0 && (
                  <section>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                      Otras apuestas
                    </p>
                    <DraggableList
                      items={otherBets}
                      storageKey={`bf_order_other_${nickname}`}
                      gap={10}
                      renderItem={(bet) => (
                        <SwipeCard
                          onSwipeLeft={() => setConfirm({ type: 'delete', bet })}
                          onSwipeRight={() => setConfirm({ type: 'vault', bet })}
                        >
                          <BetCard bet={bet} />
                        </SwipeCard>
                      )}
                    />
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <BottomNav />

      {/* Confirm popup */}
      {confirm && (
        <ConfirmPopup
          type={confirm.type}
          bet={confirm.bet}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
