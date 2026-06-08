import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Clock, Users, Check, Skull, RotateCcw, Edit2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getNickname } from '../lib/utils'
import { showLocalNotification, sendPush } from '../lib/notifications'
import { CARD, ORANGE_BTN, GLASS_BTN, LABEL, PAGE_PADDING, SECTION_TITLE } from '../lib/styles'
import CountdownTimer from '../components/CountdownTimer'
import EliminationModal from '../components/EliminationModal'
import UserAvatar from '../components/UserAvatar'

// ── Type badge ────────────────────────────────────────────────────────────────
const TYPE_META = {
  cuantitativa: { emoji: '🔢', label: 'Cuantitativa' },
  ranking:      { emoji: '🏅', label: 'Ranking' },
  tiempo:       { emoji: '⏱️', label: 'Tiempo' },
}

// ── Ranking order selector ────────────────────────────────────────────────────
function RankingSelector({ items, value, onChange }) {
  // value = array of strings (ordered picks so far)
  const remaining = items.filter(item => !value.includes(item))

  function pick(item) { onChange([...value, item]) }
  function remove(idx) { onChange(value.filter((_, i) => i !== idx)) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Ordered picks so far */}
      {value.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {value.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 10, padding: '8px 12px' }}>
              <span style={{ color: '#f97316', fontWeight: 800, fontSize: 13, width: 18, textAlign: 'right', flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ color: 'white', fontWeight: 600, fontSize: 14, flex: 1 }}>{item}</span>
              <button type="button" onClick={() => remove(i)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Remaining items */}
      {remaining.length > 0 && (
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8 }}>Tocá para ordenar:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {remaining.map((item, i) => (
              <button key={i} type="button" onClick={() => pick(item)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 99, padding: '7px 14px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                className="btn-press">
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
      {remaining.length === 0 && value.length === items.length && (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>✅ Orden completo</p>
      )}
    </div>
  )
}

// ── Current value inline editor (creator only) ─────────────────────────────
function CurrentValueEditor({ bet, isCreator, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(bet.current_value || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.from('bets').update({ current_value: draft.trim() || null }).eq('id', bet.id)
    setSaving(false)
    setEditing(false)
    onSaved(draft.trim() || null)
  }

  const hasValue = !!bet.current_value

  return (
    <div style={{ ...CARD, padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasValue || editing ? 10 : 0 }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          📊 Valor actual
        </span>
        {isCreator && !editing && (
          <button onClick={() => { setDraft(bet.current_value || ''); setEditing(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 10px', color: 'rgba(255,255,255,0.45)', fontSize: 12, cursor: 'pointer' }}>
            <Edit2 size={11} /> {hasValue ? 'Editar' : 'Actualizar'}
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder={
              bet.bet_type === 'tiempo' ? 'Ej: Van 1h 20min...' :
              bet.bet_type === 'ranking' ? 'Ej: Juan ya pasó a María' :
              'Ej: 3 goles, 120 km...'
            }
            maxLength={120}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(249,115,22,0.4)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 14, fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={saving}
              style={{ ...ORANGE_BTN, flex: 1, padding: '10px 16px', fontSize: 13, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Guardando...' : <><Check size={13} /> Guardar</>}
            </button>
            <button onClick={() => setEditing(false)}
              style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : hasValue ? (
        <p style={{ color: 'white', fontWeight: 700, fontSize: 20, margin: 0, letterSpacing: '-0.3px' }}>{bet.current_value}</p>
      ) : isCreator ? (
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, margin: 0 }}>Sin valor actual — tocá "Actualizar" para informar el estado</p>
      ) : (
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, margin: 0 }}>El creador todavía no actualizó el valor</p>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const nickname = getNickname()

  const [bet, setBet] = useState(null)
  const [participants, setParticipants] = useState([])
  const [eliminations, setEliminations] = useState([])
  const [usersMap, setUsersMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [eliminating, setEliminating] = useState(null)
  const [expired, setExpired] = useState(false)
  const [copied, setCopied] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinValue, setJoinValue] = useState('')
  const [rankingPicks, setRankingPicks] = useState([]) // for ranking type join
  const [showJoinInput, setShowJoinInput] = useState(false)

  useEffect(() => {
    fetchAll()
    const channel = supabase.channel(`bet-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bets', filter: `id=eq.${id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `bet_id=eq.${id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eliminations', filter: `bet_id=eq.${id}` }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [id])

  async function fetchAll() {
    const [{ data: betData }, { data: parts }, { data: elims }] = await Promise.all([
      supabase.from('bets').select('*').eq('id', id).single(),
      supabase.from('participants').select('*').eq('bet_id', id).order('joined_at'),
      supabase.from('eliminations').select('*').eq('bet_id', id).order('created_at'),
    ])
    setBet(betData)
    setParticipants(parts ?? [])
    setEliminations(elims ?? [])

    if (parts?.length) {
      const nicknames = parts.map(p => p.nickname)
      const { data: users } = await supabase
        .from('users')
        .select('nickname, avatar_url, avatar_color')
        .in('nickname', nicknames)
      if (users) {
        const map = {}
        users.forEach(u => { map[u.nickname] = u })
        setUsersMap(map)
      }
    }
    setLoading(false)
  }

  const handleExpire = useCallback(() => {
    if (expired) return
    setExpired(true)
    const url = window.location.href
    showLocalNotification('¡Tiempo! ⏰', `La apuesta "${bet?.title}" terminó.`, url)
    const active = participants.filter(p => !p.is_eliminated)
    const winners = active.length === 1
    active.forEach(p => {
      sendPush({
        nickname: p.nickname,
        title: winners ? '🏆 ¡Ganaste!' : '⏰ ¡Apuesta terminada!',
        body: winners ? `Ganaste la apuesta "${bet?.title}"!` : `La apuesta "${bet?.title}" terminó.`,
        url,
      })
    })
  }, [expired, bet, participants])

  async function handleJoin() {
    setJoining(true)
    const isRanking = bet?.bet_type === 'ranking'
    const finalValue = isRanking
      ? (rankingPicks.length > 0 ? rankingPicks.map((item, i) => `${i + 1}. ${item}`).join(', ') : null)
      : (joinValue.trim() || null)
    await supabase.from('participants').insert({ bet_id: id, nickname, is_eliminated: false, bet_value: finalValue })
    setJoining(false)
    setShowJoinInput(false)
  }

  async function handleEliminate(reason) {
    const target = participants.find(p => p.nickname === eliminating)
    if (!target) return
    await supabase.from('participants').update({ is_eliminated: true, eliminated_at: new Date().toISOString(), eliminated_by: nickname }).eq('id', target.id)
    await supabase.from('eliminations').insert({ bet_id: id, participant_id: target.id, participant_nickname: target.nickname, eliminated_by: nickname, reason })
    sendPush({ nickname: target.nickname, title: '💀 Te eliminaron', body: `${nickname} te descartó de "${bet.title}": "${reason}"`, url: window.location.href })
    const stillActive = participants.filter(p => !p.is_eliminated && p.nickname !== target.nickname)
    if (stillActive.length === 1) {
      sendPush({ nickname: stillActive[0].nickname, title: '🏆 ¡Ganaste la apuesta!', body: `Sos el último en pie en "${bet.title}"!`, url: window.location.href })
    }
    setEliminating(null)
  }

  async function handleRestore(p) {
    await supabase.from('participants').update({ is_eliminated: false, eliminated_at: null, eliminated_by: null }).eq('id', p.id)
    await supabase.from('eliminations').delete().eq('participant_id', p.id)
  }

  function handleShare() {
    const text = `Unite a "${bet.title}" con el código: ${bet.invite_code}`
    if (navigator.share) navigator.share({ title: 'BetFriends', text, url: window.location.href })
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  if (loading) return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div className="app-bg" />
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #f97316', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', position: 'relative', zIndex: 1 }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!bet) return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div className="app-bg" />
      <p style={{ color: 'rgba(255,255,255,0.4)', position: 'relative', zIndex: 1 }}>Apuesta no encontrada</p>
      <button onClick={() => navigate('/')} style={{ color: '#fb923c', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, position: 'relative', zIndex: 1 }}>Volver</button>
    </div>
  )

  const active = participants.filter(p => !p.is_eliminated)
  const eliminated = participants.filter(p => p.is_eliminated)
  const isMember = participants.some(p => p.nickname === nickname)
  const isCreator = bet.created_by === nickname
  const isExpired = new Date(bet.end_date) <= new Date() || expired
  const typeMeta = TYPE_META[bet.bet_type] || TYPE_META.cuantitativa
  const rankingItems = bet.ranking_items || []
  const isRanking = bet.bet_type === 'ranking'

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="app-bg" />
      <div style={{ ...PAGE_PADDING, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Header */}
        <div className="anim-slide-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, animationDelay: '0.05s' }}>
          <button style={GLASS_BTN} onClick={() => navigate('/')}>
            <ArrowLeft size={17} />
          </button>
          <button onClick={handleShare} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontWeight: 700, fontSize: 13, letterSpacing: '0.12em',
            padding: '8px 18px', borderRadius: 99, cursor: 'pointer',
            background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)',
            border: copied ? '1.5px solid rgba(34,197,94,0.35)' : '1.5px solid rgba(249,115,22,0.4)',
            color: copied ? '#86efac' : '#fdba74',
          }}>
            {copied ? <Check size={13} /> : <Share2 size={13} />}
            {copied ? 'Copiado' : bet.invite_code}
          </button>
          <div style={{ width: 40 }} />
        </div>

        {/* Title + type */}
        <div className="anim-slide-up" style={{ marginBottom: 20, animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(249,115,22,0.12)', color: '#fdba74', border: '1px solid rgba(249,115,22,0.25)' }}>
              {typeMeta.emoji} {typeMeta.label}
            </span>
            {isExpired && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                Terminada
              </span>
            )}
          </div>
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: 24, textTransform: 'uppercase', margin: '0 0 4px', lineHeight: 1.2 }}>{bet.title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 6px' }}>Creada por {bet.created_by}</p>
          {bet.description && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>{bet.description}</p>}

          {/* Ranking items list */}
          {isRanking && rankingItems.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {rankingItems.map((item, i) => (
                <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)' }}>
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="anim-slide-up" style={{ display: 'flex', gap: 12, marginBottom: 20, animationDelay: '0.15s' }}>
          {[
            { label: 'Tiempo', icon: <Clock size={11} />, value: isExpired ? <span style={{ color: '#fca5a5' }}>Terminada</span> : <CountdownTimer endDate={bet.end_date} onExpire={handleExpire} /> },
            { label: 'Activos', icon: <Users size={11} />, value: `${active.length} / ${participants.length}` },
          ].map(s => (
            <div key={s.label} style={{ ...CARD, flex: 1, padding: 16, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 6 }}>
                {s.icon} {s.label}
              </div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Current value ── */}
        <div className="anim-slide-up" style={{ animationDelay: '0.18s' }}>
          <CurrentValueEditor
            bet={bet}
            isCreator={isCreator}
            onSaved={val => setBet(b => ({ ...b, current_value: val }))}
          />
        </div>

        {/* Prize */}
        {(bet.prize_text || bet.prize_image_url) && (
          <div style={{ ...CARD, overflow: 'hidden', marginBottom: 20 }}>
            {bet.prize_image_url && <img src={bet.prize_image_url} alt="Premio" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />}
            <div style={{ padding: 16 }}>
              <p style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>🏆 Premio</p>
              {bet.prize_text && <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{bet.prize_text}</p>}
            </div>
          </div>
        )}

        {/* Winners */}
        {isExpired && active.length > 0 && (
          <div style={{ borderRadius: 20, padding: 20, marginBottom: 20, background: 'rgba(250,204,21,0.08)', border: '1.5px solid rgba(250,204,21,0.22)' }}>
            <p style={{ color: '#fde68a', fontWeight: 800, fontSize: 16, marginBottom: 12 }}>🏆 {active.length === 1 ? '¡Ganador!' : '¡Ganadores!'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {active.map(p => (
                <span key={p.id} style={{ fontSize: 14, fontWeight: 700, padding: '6px 14px', borderRadius: 99, background: 'rgba(250,204,21,0.15)', color: '#fde68a' }}>
                  {p.nickname}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Join */}
        {!isMember && !isExpired && (
          <div style={{ marginBottom: 20 }}>
            {showJoinInput ? (
              <div className="anim-scale-in" style={{ ...CARD, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
                  {isRanking ? '¿En qué orden creés que va a quedar?' : '¿Cuál es tu predicción?'}
                </p>

                {isRanking ? (
                  <RankingSelector items={rankingItems} value={rankingPicks} onChange={setRankingPicks} />
                ) : (
                  <input
                    autoFocus type="text" value={joinValue}
                    onChange={e => setJoinValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    placeholder={bet.bet_value ? `Ej: ${bet.bet_value}` : 'Tu predicción...'}
                    maxLength={80}
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(249,115,22,0.4)', borderRadius: 10, padding: '12px 14px', color: 'white', fontSize: 15, fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                  />
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleJoin} disabled={joining || (isRanking && rankingPicks.length < rankingItems.length)}
                    style={{ ...ORANGE_BTN, flex: 1, padding: '13px 16px', opacity: (joining || (isRanking && rankingPicks.length < rankingItems.length)) ? 0.5 : 1 }}>
                    {joining ? 'Uniéndose...' : 'Confirmar y unirse'}
                  </button>
                  <button onClick={() => { setShowJoinInput(false); setRankingPicks([]) }}
                    style={{ padding: '13px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowJoinInput(true)}
                style={{ ...ORANGE_BTN, padding: '15px 24px', width: '100%' }}>
                Unirse a la apuesta
              </button>
            )}
          </div>
        )}

        {/* Active participants */}
        <div className="anim-slide-up" style={{ marginBottom: 20, animationDelay: '0.2s' }}>
          <p style={SECTION_TITLE}>En juego ({active.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {active.map(p => (
              <div key={p.id} style={{ ...CARD, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <UserAvatar
                    nickname={p.nickname}
                    avatarUrl={usersMap[p.nickname]?.avatar_url}
                    avatarColor={usersMap[p.nickname]?.avatar_color}
                    size={36}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{p.nickname}</span>
                      {p.nickname === nickname && <span style={{ color: '#fdba74', fontSize: 11 }}>(tú)</span>}
                    </div>
                    {p.bet_value && (
                      <span style={{ fontSize: 12, color: 'rgba(249,115,22,0.85)', fontWeight: 600, marginTop: 2, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                        {p.bet_value}
                      </span>
                    )}
                  </div>
                </div>
                {!isExpired && isMember && active.length > 1 && (
                  <button onClick={() => setEliminating(p.nickname)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 10, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', color: 'rgba(252,165,165,0.8)', border: '1px solid rgba(239,68,68,0.2)', marginLeft: 8 }}>
                    <Skull size={12} /> Descartar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Eliminated */}
        {eliminated.length > 0 && (
          <div style={{ paddingBottom: 40 }}>
            <p style={SECTION_TITLE}>Descartados ({eliminated.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {eliminated.map(p => {
                const elim = eliminations.filter(e => e.participant_id === p.id).pop()
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ opacity: 0.35, flexShrink: 0 }}>
                        <UserAvatar nickname={p.nickname} avatarUrl={usersMap[p.nickname]?.avatar_url} avatarColor={usersMap[p.nickname]?.avatar_color} size={36} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 600, fontSize: 14, textDecoration: 'line-through' }}>{p.nickname}</span>
                          {p.bet_value && <span style={{ fontSize: 11, color: 'rgba(249,115,22,0.3)', fontWeight: 600 }}>{p.bet_value}</span>}
                        </div>
                        {elim && <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12, margin: '2px 0 0' }}>Por {elim.eliminated_by}: "{elim.reason}"</p>}
                      </div>
                    </div>
                    {!isExpired && isMember && (
                      <button onClick={() => handleRestore(p)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(253,186,116,0.5)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}>
                        <RotateCcw size={11} /> Restaurar
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {eliminating && <EliminationModal participant={eliminating} onConfirm={handleEliminate} onClose={() => setEliminating(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
