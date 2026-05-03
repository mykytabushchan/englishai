'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Profile, Unit, Category, UserProgress } from '@/lib/supabase'
import Link from 'next/link'

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1']
const FREE_DAILY_LIMIT = 3

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [progress, setProgress] = useState<Record<string, UserProgress[]>>({})
  const [dailyUsed, setDailyUsed] = useState(0)
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeLevel, setActiveLevel] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }

      const [{ data: prof }, { data: cats }, { data: us }, { data: daily }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('units').select('*').order('sort_order'),
        supabase.from('daily_usage').select('*').eq('user_id', session.user.id).eq('date', new Date().toISOString().split('T')[0]).single(),
      ])

      setProfile(prof)
      setCategories(cats || [])
      setUnits(us || [])
      setDailyUsed(daily?.units_completed || 0)

      // Load progress grouped by unit
      const { data: prog } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', session.user.id)

      const grouped: Record<string, UserProgress[]> = {}
      prog?.forEach(p => {
        if (!grouped[p.unit_id]) grouped[p.unit_id] = []
        grouped[p.unit_id].push(p)
      })
      setProgress(grouped)
      setLoading(false)
    }
    init()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const canStartUnit = (unit: Unit) => {
    if (profile?.is_premium) return true
    if (unit.is_premium) return false
    return dailyUsed < FREE_DAILY_LIMIT
  }

  const filteredUnits = units.filter(u => {
    const catOk = activeCategory === 'all' || u.category_id === activeCategory
    const lvlOk = activeLevel === 'All' || u.level === activeLevel
    return catOk && lvlOk
  })

  const totalSessions = Object.values(progress).flat().length
  const totalXP = profile?.total_xp || 0

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0C0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700 }}>Loading your dashboard…</div>
        </div>
      </div>
    )
  }

  const isPremium = profile?.is_premium
  const remainingFree = Math.max(0, FREE_DAILY_LIMIT - dailyUsed)

  return (
    <div style={{ minHeight: '100vh', background: '#0C0F1A' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, background: 'rgba(12,15,26,0.9)',
        backdropFilter: 'blur(20px)', zIndex: 100
      }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, background: 'linear-gradient(135deg,#7C6AF7,#4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          EnglishAI
        </div>
        <nav style={{ display: 'flex', gap: 4, background: '#141829', borderRadius: 12, padding: 4 }}>
          {[
            { href: '/dashboard', label: 'Units' },
            { href: '/leaderboard', label: '🏆 Leaderboard' },
            { href: '/pricing', label: '💎 Premium' },
          ].map(n => (
            <Link key={n.href} href={n.href} style={{
              padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
              color: n.href === '/dashboard' ? 'white' : '#8892B0',
              background: n.href === '/dashboard' ? '#7C6AF7' : 'transparent',
              fontSize: 14, fontWeight: 500
            }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#8892B0' }}>{profile?.username}</div>
            <div style={{ fontSize: 12, color: '#FFD93D' }}>🔥 {profile?.streak_days}d streak</div>
          </div>
          <button onClick={handleSignOut} style={{
            padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: '#8892B0', cursor: 'pointer', fontSize: 13
          }}>
            Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 36 }}>
          {[
            { label: 'Total XP', val: totalXP.toLocaleString(), icon: '⚡', color: '#FFD93D' },
            { label: 'Sessions', val: totalSessions, icon: '📚', color: '#4ECDC4' },
            { label: 'Streak', val: `${profile?.streak_days}d`, icon: '🔥', color: '#FF8B94' },
            isPremium
              ? { label: 'Plan', val: 'Premium', icon: '💎', color: '#7C6AF7' }
              : { label: 'Free today', val: `${remainingFree}/${FREE_DAILY_LIMIT}`, icon: '🎯', color: remainingFree > 0 ? '#4ADE80' : '#FF6B6B' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#141829', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '20px 20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#8892B0', fontSize: 13 }}>{s.label}</span>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
              </div>
              <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Free limit warning */}
        {!isPremium && remainingFree === 0 && (
          <div style={{
            background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.3)',
            borderRadius: 16, padding: '16px 24px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
          }}>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 4 }}>Daily limit reached 🎯</div>
              <div style={{ color: '#8892B0', fontSize: 14 }}>You've used your 3 free units today. Upgrade for unlimited access.</div>
            </div>
            <Link href="/pricing" style={{
              padding: '10px 24px', borderRadius: 10, background: '#7C6AF7',
              color: 'white', textDecoration: 'none', fontFamily: 'Syne', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap'
            }}>
              Upgrade — $10/mo →
            </Link>
          </div>
        )}

        {/* Filters */}
        <div style={{ marginBottom: 24 }}>
          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                padding: '8px 16px', borderRadius: 20, border: '1px solid',
                borderColor: activeCategory === 'all' ? '#7C6AF7' : 'rgba(255,255,255,0.08)',
                background: activeCategory === 'all' ? 'rgba(124,106,247,0.1)' : 'transparent',
                color: activeCategory === 'all' ? '#7C6AF7' : '#8892B0',
                cursor: 'pointer', fontSize: 14, fontFamily: 'DM Sans'
              }}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '8px 16px', borderRadius: 20, border: '1px solid',
                  borderColor: activeCategory === cat.id ? cat.color : 'rgba(255,255,255,0.08)',
                  background: activeCategory === cat.id ? `${cat.color}18` : 'transparent',
                  color: activeCategory === cat.id ? cat.color : '#8892B0',
                  cursor: 'pointer', fontSize: 14, fontFamily: 'DM Sans',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                {cat.emoji} {cat.title}
                {cat.is_premium && !isPremium && <span style={{ fontSize: 11, opacity: 0.7 }}>💎</span>}
              </button>
            ))}
          </div>
          {/* Level pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {LEVELS.map(l => (
              <button
                key={l}
                onClick={() => setActiveLevel(l)}
                style={{
                  padding: '5px 12px', borderRadius: 8, border: '1px solid',
                  borderColor: activeLevel === l ? '#4ECDC4' : 'rgba(255,255,255,0.08)',
                  background: activeLevel === l ? 'rgba(78,205,196,0.1)' : 'transparent',
                  color: activeLevel === l ? '#4ECDC4' : '#8892B0',
                  cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans'
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Units grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filteredUnits.map(unit => {
            const unitProgress = progress[unit.id] || []
            const attempts = unitProgress.length
            const bestScore = attempts > 0 ? Math.max(...unitProgress.map(p => p.score / p.total * 100)) : 0
            const canStart = canStartUnit(unit)
            const isLocked = unit.is_premium && !isPremium
            const isDailyLocked = !isPremium && !unit.is_premium && remainingFree === 0

            return (
              <div
                key={unit.id}
                onClick={() => canStart && !isDailyLocked && router.push(`/learn/${unit.id}`)}
                style={{
                  background: '#141829', border: '1px solid',
                  borderColor: attempts > 0 && bestScore >= 80 ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)',
                  borderRadius: 16, padding: '20px', cursor: canStart && !isDailyLocked ? 'pointer' : 'default',
                  transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                  opacity: isLocked || isDailyLocked ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (canStart && !isDailyLocked) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
              >
                {/* Color bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: unit.color, opacity: 0.8 }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 28 }}>{isLocked ? '🔒' : unit.emoji}</span>
                  <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: '#8892B0', fontFamily: 'Syne' }}>
                      {unit.level}
                    </span>
                  </div>
                </div>

                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{unit.title}</div>
                <div style={{ color: '#8892B0', fontSize: 13, marginBottom: 16 }}>{unit.description}</div>

                {/* Progress bar */}
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${bestScore}%`, background: unit.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#8892B0' }}>
                    {attempts > 0 ? `Best: ${Math.round(bestScore)}% · ${attempts} ${attempts === 1 ? 'session' : 'sessions'}` : 'Not started'}
                  </span>
                  {isLocked ? (
                    <Link href="/pricing" onClick={e => e.stopPropagation()} style={{
                      fontSize: 12, padding: '4px 10px', borderRadius: 8,
                      border: '1px solid #FFD93D', color: '#FFD93D', textDecoration: 'none',
                      background: 'rgba(255,217,61,0.08)'
                    }}>
                      Upgrade
                    </Link>
                  ) : (
                    <span style={{ fontSize: 12, color: unit.color, fontWeight: 600 }}>
                      {attempts === 0 ? 'Start →' : 'Practice →'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
