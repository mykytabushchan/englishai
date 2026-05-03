'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

function AnimatedCounter({ target, duration = 2500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return <>{count.toLocaleString()}</>
}

const features = [
  { icon: '🧠', title: 'AI Never Repeats', desc: "Every exercise is unique to you. Claude tracks what you've seen and generates something new every single time." },
  { icon: '🔍', title: 'Smart Fingerprinting', desc: 'Each exercise gets a SHA-256 fingerprint. Millions of combinations stored — you will never see the same task twice.' },
  { icon: '📊', title: 'Progress Tracking', desc: 'See exactly how many exercises completed vs. remaining. Your full history is always saved.' },
  { icon: '🏆', title: 'Global Leaderboard', desc: 'Earn XP, build streaks, compete with learners worldwide. Rankings updated in real time.' },
  { icon: '👨‍💻', title: 'IT English', desc: 'Built for developers: code reviews, standups, technical writing, job interviews in English.' },
  { icon: '💳', title: 'Easy Payment', desc: 'Accepts Ukrainian bank cards via LemonSqueezy. Start free, upgrade for $10/month.' },
]

const categories = [
  { emoji: '🕐', label: 'Tenses', color: '#4ECDC4', count: '10 units' },
  { emoji: '📝', label: 'Grammar', color: '#DDA0DD', count: '8 units' },
  { emoji: '📚', label: 'Vocabulary', color: '#FFD93D', count: '4 units' },
  { emoji: '👨‍💻', label: 'IT English', color: '#4D96FF', count: '5 units' },
  { emoji: '💼', label: 'Business', color: '#20B2AA', count: '4 units' },
  { emoji: '🎓', label: 'IELTS/TOEFL', color: '#FF8B94', count: '3 units' },
  { emoji: '✈️', label: 'Travel', color: '#87CEEB', count: '3 units' },
  { emoji: '🏥', label: 'Medical', color: '#6BCB77', count: '2 units' },
]

export default function HomePage() {
  const [counted, setCounted] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setCounted(true), 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0C0F1A' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'rgba(12,15,26,0.9)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, background: 'linear-gradient(135deg,#7C6AF7,#4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EnglishAI</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/leaderboard" style={{ color: '#8892B0', textDecoration: 'none', fontSize: 15 }}>Leaderboard</Link>
          <Link href="/pricing" style={{ color: '#8892B0', textDecoration: 'none', fontSize: 15 }}>Pricing</Link>
          <Link href="/auth" style={{ color: '#8892B0', textDecoration: 'none', fontSize: 15 }}>Sign in</Link>
          <Link href="/auth?signup=true" style={{ padding: '10px 24px', borderRadius: 12, background: '#7C6AF7', color: 'white', textDecoration: 'none', fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>Start Free →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 24px 60px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 20, background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.3)', color: '#7C6AF7', fontSize: 13, fontWeight: 600, marginBottom: 28 }}>
          🤖 Powered by Claude AI · Never repeats exercises
        </div>
        <h1 style={{ fontFamily: 'Syne', fontSize: 'clamp(38px,6vw,70px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
          <span style={{ background: 'linear-gradient(135deg,#7C6AF7,#4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {counted ? <AnimatedCounter target={1400000} /> : '—'}+
          </span>{' '}unique English<br />exercises — just for you
        </h1>
        <p style={{ fontSize: 20, color: '#8892B0', lineHeight: 1.7, marginBottom: 40, maxWidth: 620, margin: '0 auto 40px' }}>
          AI generates every exercise fresh based on your personal history. You will never see the same task twice. From A1 grammar to C1 professional English.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth?signup=true" style={{ padding: '16px 36px', borderRadius: 14, background: 'linear-gradient(135deg,#7C6AF7,#5a4de8)', color: 'white', textDecoration: 'none', fontFamily: 'Syne', fontWeight: 700, fontSize: 17, boxShadow: '0 8px 32px rgba(124,106,247,0.3)' }}>Start for Free →</Link>
          <Link href="/pricing" style={{ padding: '16px 36px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', fontFamily: 'Syne', fontWeight: 700, fontSize: 17 }}>View Pricing</Link>
        </div>
        <p style={{ marginTop: 20, color: '#8892B0', fontSize: 14 }}>3 free units per day · No credit card</p>
      </section>

      {/* How uniqueness works */}
      <section style={{ padding: '40px 48px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: '#141829', border: '1px solid rgba(124,106,247,0.2)', borderRadius: 24, padding: '36px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
            {[
              { step: '01', icon: '🔍', title: 'Your history is checked', desc: "We fingerprint every exercise you've ever seen using a SHA-256 hash stored in your profile" },
              { step: '02', icon: '🤖', title: 'AI generates new ones', desc: "Claude receives your seen-topics list as context and creates exercises you've genuinely never encountered" },
              { step: '03', icon: '♾️', title: 'Infinite combinations', desc: '37 units × 4 types × 3 difficulties × 2,500 seeds = 1.1M+ base combinations, plus AI variation' },
            ].map((s, i) => (
              <div key={s.step} style={{ padding: '0 24px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7C6AF7', letterSpacing: 2, marginBottom: 12, fontFamily: 'Syne' }}>STEP {s.step}</div>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{s.title}</div>
                <div style={{ color: '#8892B0', fontSize: 13, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Math breakdown */}
      <section style={{ padding: '20px 48px 40px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: '#141829', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 28px' }}>
          <div style={{ color: '#8892B0', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>How we calculate 1,400,000+ exercises:</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', flexWrap: 'wrap', fontSize: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: '#4ECDC4' }}>37</div>
              <div style={{ color: '#8892B0', fontSize: 12 }}>units</div>
            </div>
            <div style={{ color: '#8892B0', fontSize: 22 }}>×</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: '#DDA0DD' }}>4</div>
              <div style={{ color: '#8892B0', fontSize: 12 }}>exercise types</div>
            </div>
            <div style={{ color: '#8892B0', fontSize: 22 }}>×</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: '#FFD93D' }}>3</div>
              <div style={{ color: '#8892B0', fontSize: 12 }}>difficulty levels</div>
            </div>
            <div style={{ color: '#8892B0', fontSize: 22 }}>×</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: '#FF8B94' }}>2,500</div>
              <div style={{ color: '#8892B0', fontSize: 12 }}>topic seeds</div>
            </div>
            <div style={{ color: '#8892B0', fontSize: 22 }}>=</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: '#7C6AF7' }}>1,110,000</div>
              <div style={{ color: '#8892B0', fontSize: 12 }}>base combinations</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, color: '#8892B0', fontSize: 13 }}>
            Plus AI language variation multiplies this further → over <strong style={{ color: 'white' }}>1.4 million</strong> effectively unique exercises
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '20px 48px 60px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Syne', textAlign: 'center', fontSize: 32, fontWeight: 800, marginBottom: 40 }}>8 Categories, 37 Units</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 14 }}>
          {categories.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 14, background: '#141829', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 24 }}>{c.emoji}</span>
              <div>
                <div style={{ fontWeight: 600, color: c.color, fontSize: 15 }}>{c.label}</div>
                <div style={{ fontSize: 12, color: '#8892B0' }}>{c.count}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '20px 48px 60px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Syne', textAlign: 'center', fontSize: 32, fontWeight: 800, marginBottom: 48 }}>Everything you need to progress</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: '#141829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{f.title}</div>
              <div style={{ color: '#8892B0', lineHeight: 1.6, fontSize: 15 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '40px 48px 80px', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(124,106,247,0.1),rgba(78,205,196,0.1))', border: '1px solid rgba(124,106,247,0.2)', borderRadius: 24, padding: '48px 40px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h2 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Ready to start?</h2>
          <p style={{ color: '#8892B0', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
            3 free units every day. No credit card. Upgrade anytime for unlimited access — $10/month, works with Ukrainian bank cards.
          </p>
          <Link href="/auth?signup=true" style={{ display: 'inline-block', padding: '18px 44px', borderRadius: 14, background: 'linear-gradient(135deg,#7C6AF7,#4ECDC4)', color: 'white', textDecoration: 'none', fontFamily: 'Syne', fontWeight: 700, fontSize: 18 }}>
            Create Free Account →
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 48px', textAlign: 'center', color: '#8892B0', fontSize: 14 }}>
        © 2025 EnglishAI · Built with Claude AI ·
        <Link href="/pricing" style={{ color: '#8892B0', textDecoration: 'none', margin: '0 12px' }}>Pricing</Link>·
        <Link href="/leaderboard" style={{ color: '#8892B0', textDecoration: 'none', margin: '0 12px' }}>Leaderboard</Link>
      </footer>
    </div>
  )
}
