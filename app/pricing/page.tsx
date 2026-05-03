'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const FREE_FEATURES = [
  '3 units per day',
  'All Tenses units (A1-B1)',
  'Core Grammar units',
  'Basic Vocabulary units',
  'Travel & everyday topics',
  'Progress tracking',
  'Leaderboard access',
]

const PREMIUM_FEATURES = [
  'Unlimited units per day',
  'Everything in Free',
  '👨‍💻 IT English for developers',
  '💼 Business English',
  '🎓 IELTS / TOEFL preparation',
  '🏥 Medical English',
  'Advanced grammar (B2-C1)',
  'Detailed analytics',
  'Priority AI responses',
  'Cancel anytime',
]

export default function PricingPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(data)
      }
    })
  }, [])

  const handleCheckout = async () => {
    setLoading(true)
    // LemonSqueezy checkout URL
    // Replace with your actual LemonSqueezy checkout URL
    const storeId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID || 'YOUR_STORE'
    const variantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID || 'YOUR_VARIANT'

    const checkoutUrl = `https://englishai.lemonsqueezy.com/checkout/buy/${variantId}?checkout[email]=${encodeURIComponent(profile?.email || '')}&checkout[custom][user_id]=${profile?.id || ''}`

    window.location.href = checkoutUrl
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0C0F1A' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(12,15,26,0.9)', backdropFilter: 'blur(20px)' }}>
        <Link href="/" style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, background: 'linear-gradient(135deg,#7C6AF7,#4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
          EnglishAI
        </Link>
        <Link href={profile ? '/dashboard' : '/auth'} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', fontSize: 14 }}>
          {profile ? '← Dashboard' : 'Sign in'}
        </Link>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 48, fontWeight: 800, marginBottom: 16 }}>
            Simple, honest pricing
          </h1>
          <p style={{ color: '#8892B0', fontSize: 18 }}>
            Start free · Upgrade when you need more
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 780, margin: '0 auto' }}>
          {/* Free */}
          <div style={{ background: '#141829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 36 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Free</div>
              <div style={{ fontFamily: 'Syne', fontSize: 48, fontWeight: 800, marginBottom: 4 }}>$0</div>
              <div style={{ color: '#8892B0', fontSize: 15 }}>3 units / day · Forever free</div>
            </div>

            <div style={{ marginBottom: 32 }}>
              {FREE_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: '#4ADE80', fontSize: 16 }}>✓</span>
                  <span style={{ fontSize: 15 }}>{f}</span>
                </div>
              ))}
            </div>

            <Link href={profile ? '/dashboard' : '/auth?signup=true'} style={{
              display: 'block', padding: '14px', borderRadius: 14, textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none',
              fontFamily: 'Syne', fontWeight: 700, fontSize: 16
            }}>
              {profile ? 'Your current plan' : 'Get Started Free'}
            </Link>
          </div>

          {/* Premium */}
          <div style={{
            background: 'linear-gradient(160deg, #1a1535, #141829)',
            border: '1px solid rgba(124,106,247,0.4)', borderRadius: 24, padding: 36,
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Glow */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(124,106,247,0.12)', filter: 'blur(40px)', pointerEvents: 'none' }} />

            <div style={{ position: 'absolute', top: 16, right: 16, padding: '4px 12px', borderRadius: 20, background: 'rgba(124,106,247,0.2)', border: '1px solid rgba(124,106,247,0.4)', color: '#7C6AF7', fontSize: 12, fontWeight: 700, fontFamily: 'Syne' }}>
              POPULAR
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Premium</div>
              <div style={{ fontFamily: 'Syne', fontSize: 48, fontWeight: 800, marginBottom: 4 }}>
                $10
                <span style={{ fontSize: 18, fontWeight: 400, color: '#8892B0' }}>/mo</span>
              </div>
              <div style={{ color: '#8892B0', fontSize: 15 }}>Unlimited access · Cancel anytime</div>
            </div>

            <div style={{ marginBottom: 32 }}>
              {PREMIUM_FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: '#7C6AF7', fontSize: 16 }}>✓</span>
                  <span style={{ fontSize: 15 }}>{f}</span>
                </div>
              ))}
            </div>

            {profile?.is_premium ? (
              <div style={{ padding: '14px', borderRadius: 14, textAlign: 'center', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ADE80', fontFamily: 'Syne', fontWeight: 700, fontSize: 16 }}>
                ✓ You're on Premium
              </div>
            ) : (
              <button onClick={handleCheckout} disabled={loading} style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#7C6AF7,#5a4de8)', color: 'white',
                fontFamily: 'Syne', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 32px rgba(124,106,247,0.3)', opacity: loading ? 0.7 : 1
              }}>
                {loading ? 'Redirecting…' : profile ? 'Upgrade to Premium →' : 'Start Free Trial →'}
              </button>
            )}
          </div>
        </div>

        {/* Payment info */}
        <div style={{ textAlign: 'center', marginTop: 40, color: '#8892B0', fontSize: 14 }}>
          <p>🔒 Secure payment via LemonSqueezy · Visa, Mastercard, PayPal accepted</p>
          <p style={{ marginTop: 8 }}>Works with Ukrainian bank cards (Monobank, PrivatBank, etc.)</p>
        </div>
      </main>
    </div>
  )
}
