'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { LeaderboardEntry } from '@/lib/supabase'
import Link from 'next/link'

const MEDAL = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'xp' | 'sessions' | 'streak'>('xp')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(100)

      setEntries(data || [])

      if (session) {
        const me = data?.find((e: LeaderboardEntry) => e.id === session.user.id)
        setMyRank(me || null)
      }
      setLoading(false)
    }
    load()
  }, [])

  const sorted = [...entries].sort((a, b) => {
    if (filter === 'xp') return b.total_xp - a.total_xp
    if (filter === 'sessions') return b.total_sessions - a.total_sessions
    return b.streak_days - a.streak_days
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0C0F1A' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(12,15,26,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/dashboard" style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, background: 'linear-gradient(135deg,#7C6AF7,#4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          EnglishAI
        </Link>
        <Link href="/dashboard" style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', fontSize: 14 }}>
          ← Dashboard
        </Link>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800, marginBottom: 8 }}>🏆 Leaderboard</h1>
        <p style={{ color: '#8892B0', marginBottom: 32 }}>Top English learners worldwide</p>

        {/* My rank */}
        {myRank && (
          <div style={{
            background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.3)',
            borderRadius: 16, padding: '16px 24px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ color: '#8892B0', fontSize: 13, marginBottom: 4 }}>Your ranking</div>
              <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700 }}>#{myRank.rank} · {myRank.username}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, color: '#FFD93D' }}>{myRank.total_xp} XP</div>
              <div style={{ color: '#8892B0', fontSize: 13 }}>{myRank.units_completed} units · {myRank.streak_days}d streak</div>
            </div>
          </div>
        )}

        {/* Sort filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {([['xp', '⚡ XP'], ['sessions', '📚 Sessions'], ['streak', '🔥 Streak']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: '8px 16px', borderRadius: 10, border: '1px solid',
              borderColor: filter === key ? '#7C6AF7' : 'rgba(255,255,255,0.08)',
              background: filter === key ? 'rgba(124,106,247,0.1)' : 'transparent',
              color: filter === key ? '#7C6AF7' : '#8892B0',
              cursor: 'pointer', fontSize: 14, fontFamily: 'DM Sans'
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#141829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 100px 100px', gap: 16, padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#8892B0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <span>Rank</span>
            <span>User</span>
            <span style={{ textAlign: 'right' }}>XP</span>
            <span style={{ textAlign: 'right' }}>Units</span>
            <span style={{ textAlign: 'right' }}>Streak</span>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8892B0' }}>Loading…</div>
          ) : sorted.slice(0, 50).map((entry, idx) => (
            <div key={entry.id} style={{
              display: 'grid', gridTemplateColumns: '60px 1fr 100px 100px 100px',
              gap: 16, padding: '16px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: myRank?.id === entry.id ? 'rgba(124,106,247,0.05)' : 'transparent',
              transition: 'background 0.15s'
            }}>
              <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>
                {idx < 3 ? MEDAL[idx] : `#${idx + 1}`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: `hsl(${entry.username?.charCodeAt(0) * 10 || 200}, 60%, 50%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'white', flexShrink: 0
                }}>
                  {entry.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{entry.username}</div>
                  <div style={{ fontSize: 12, color: '#8892B0' }}>Avg: {entry.avg_score}%</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'Syne', fontWeight: 700, color: '#FFD93D' }}>{entry.total_xp}</div>
              <div style={{ textAlign: 'right', color: '#4ECDC4' }}>{entry.units_completed}</div>
              <div style={{ textAlign: 'right', color: '#FF8B94' }}>{entry.streak_days}🔥</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
