'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function AuthPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [isSignup, setIsSignup] = useState(params.get('signup') === 'true')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/dashboard')
    })
  }, [])

  const handleAuth = async () => {
    setLoading(true)
    setError('')
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0C0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, background: 'linear-gradient(135deg,#7C6AF7,#4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
            EnglishAI
          </Link>
          <div style={{ color: '#8892B0', marginTop: 8, fontSize: 15 }}>
            {isSignup ? 'Create your account' : 'Welcome back'}
          </div>
        </div>

        <div style={{ background: '#141829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 32 }}>
          {/* Google */}
          <button onClick={handleGoogle} style={{
            width: '100%', padding: '14px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)', background: '#1E2438',
            color: 'white', fontSize: 15, cursor: 'pointer', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: '#8892B0', fontSize: 13 }}>or with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Fields */}
          {[
            { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'your@email.com' },
            { label: 'Password', value: password, set: setPassword, type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#8892B0', fontSize: 13, marginBottom: 6 }}>{f.label}</label>
              <input
                type={f.type}
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder}
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)', background: '#1E2438',
                  color: 'white', fontSize: 15, outline: 'none',
                }}
              />
            </div>
          ))}

          {error && <div style={{ color: '#FF6B6B', fontSize: 14, marginBottom: 12, padding: '10px 14px', background: 'rgba(255,107,107,0.1)', borderRadius: 8 }}>{error}</div>}
          {success && <div style={{ color: '#4ADE80', fontSize: 14, marginBottom: 12, padding: '10px 14px', background: 'rgba(74,222,128,0.1)', borderRadius: 8 }}>{success}</div>}

          <button onClick={handleAuth} disabled={loading} style={{
            width: '100%', padding: '14px', borderRadius: 12,
            border: 'none', background: loading ? '#555' : 'linear-gradient(135deg,#7C6AF7,#5a4de8)',
            color: 'white', fontFamily: 'Syne', fontWeight: 700, fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8
          }}>
            {loading ? 'Loading…' : isSignup ? 'Create Account' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, color: '#8892B0', fontSize: 14 }}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <button onClick={() => { setIsSignup(!isSignup); setError(''); setSuccess('') }} style={{ background: 'none', border: 'none', color: '#7C6AF7', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
