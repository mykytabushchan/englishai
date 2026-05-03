'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getExercisesForUser, getWrongAnswerFeedback } from '@/lib/exerciseEngine'
import type { Exercise } from '@/lib/exerciseEngine'
import Link from 'next/link'

export default function LearnPage() {
  const router = useRouter()
  const params = useParams()
  const unitId = params.unitId as string
  const supabase = createClient()

  const [unit, setUnit] = useState<any>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState('Loading…')
  const [error, setError] = useState('')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, boolean>>({})
  const [revealed, setRevealed] = useState<Record<number, any>>({})
  const [inputVal, setInputVal] = useState('')
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cacheInfo, setCacheInfo] = useState({ fromCache: 0, generated: 0 })

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      setLoadingMsg('Loading unit…')
      const { data: u } = await supabase.from('units').select('*, categories(*)').eq('id', unitId).single()
      if (!u) { router.push('/dashboard'); return }
      setUnit(u)
      setLoadingMsg('Checking your exercise history…')
      try {
        setLoadingMsg('Generating unique exercises for you…')
        const { exercises: exs, fromCache, generated } = await getExercisesForUser(session.user.id, u, 5, 2)
        setExercises(exs)
        setCacheInfo({ fromCache, generated })
      } catch (e) {
        setError('Failed to load exercises. Please try again.')
      }
      setLoading(false)
    }
    init()
  }, [unitId])

  const ex = exercises[current]
  const isRevealed = !!revealed[current]
  const totalCorrect = Object.values(answers).filter(Boolean).length

  const handleSelect = async (optIdx: number) => {
    if (isRevealed) return
    const isCorrect = optIdx === ex.correct
    setAnswers(a => ({ ...a, [current]: isCorrect }))
    setRevealed(r => ({ ...r, [current]: { chosen: optIdx } }))
    setFeedback({ correct: isCorrect, text: isCorrect ? ex.explanation : '' })
    if (!isCorrect) {
      setFeedbackLoading(true)
      const text = await getWrongAnswerFeedback(unit, ex, (ex.options as string[])[optIdx])
      setFeedback({ correct: false, text })
      setFeedbackLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (isRevealed || !inputVal.trim()) return
    const val = inputVal.trim().toLowerCase()
    const correct = String(ex.correct).toLowerCase().trim()
    const isCorrect = val === correct || val.replace(/[.,!?]/g, '') === correct.replace(/[.,!?]/g, '')
    setAnswers(a => ({ ...a, [current]: isCorrect }))
    setRevealed(r => ({ ...r, [current]: { input: inputVal } }))
    setFeedback({ correct: isCorrect, text: isCorrect ? ex.explanation : '' })
    if (!isCorrect) {
      setFeedbackLoading(true)
      const text = await getWrongAnswerFeedback(unit, ex, inputVal)
      setFeedback({ correct: false, text })
      setFeedbackLoading(false)
    }
  }

  const handleNext = () => {
    if (current + 1 >= exercises.length) { setDone(true) }
    else { setCurrent(c => c + 1); setFeedback(null); setInputVal('') }
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('user_progress').insert({ user_id: session.user.id, unit_id: unitId, score: totalCorrect, total: exercises.length })
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase.from('daily_usage').select('*').eq('user_id', session.user.id).eq('date', today).single()
    if (existing) {
      await supabase.from('daily_usage').update({ units_completed: existing.units_completed + 1 }).eq('id', existing.id)
    } else {
      await supabase.from('daily_usage').insert({ user_id: session.user.id, date: today, units_completed: 1 })
    }
    await supabase.rpc('add_xp', { p_user_id: session.user.id, p_score: totalCorrect, p_total: exercises.length })
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0C0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>{unit?.emoji || '🧠'}</div>
          <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{loadingMsg}</div>
          <div style={{ color: '#8892B0', fontSize: 14, marginBottom: 24 }}>Checking your history to avoid repeats…</div>
          <div style={{ height: 4, background: '#1E2438', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#7C6AF7,#4ECDC4)', width: '60%', animation: 'slide 1.5s ease-in-out infinite alternate', borderRadius: 2 }} />
          </div>
          <style>{`@keyframes slide{from{margin-left:0}to{margin-left:40%}}`}</style>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0C0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ color: '#FF6B6B', marginBottom: 24 }}>{error}</div>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: '#7C6AF7', color: 'white', fontFamily: 'Syne', fontWeight: 700, cursor: 'pointer' }}>Back</button>
        </div>
      </div>
    )
  }

  if (done) {
    const score = Math.round((totalCorrect / exercises.length) * 100)
    return (
      <div style={{ minHeight: '100vh', background: '#0C0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 500, width: '100%', background: '#141829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>{score >= 80 ? '🎉' : score >= 50 ? '👍' : '💪'}</div>
          <div style={{ fontFamily: 'Syne', fontSize: 34, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg,#7C6AF7,#4ECDC4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {score >= 80 ? 'Excellent!' : score >= 50 ? 'Good job!' : 'Keep going!'}
          </div>
          <div style={{ color: '#8892B0', marginBottom: 12 }}>{unit?.title}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.2)', marginBottom: 32, fontSize: 13, color: '#4ECDC4' }}>
            ✦ All exercises were unique to you
            {cacheInfo.fromCache > 0 && ` · ${cacheInfo.fromCache} from pool`}
            {cacheInfo.generated > 0 && ` · ${cacheInfo.generated} freshly generated`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { val: `${score}%`, label: 'Score', color: score >= 80 ? '#4ADE80' : score >= 50 ? '#FFD93D' : '#FF6B6B' },
              { val: totalCorrect, label: 'Correct', color: '#4ADE80' },
              { val: exercises.length - totalCorrect, label: 'Mistakes', color: '#FF6B6B' },
            ].map(s => (
              <div key={s.label} style={{ background: '#1E2438', borderRadius: 14, padding: '20px 12px' }}>
                <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.val}</div>
                <div style={{ color: '#8892B0', fontSize: 13 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/dashboard" style={{ flex: 1, padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', textDecoration: 'none', fontFamily: 'Syne', fontWeight: 700, fontSize: 15, textAlign: 'center' }}>← Back</Link>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: 16, borderRadius: 14, border: 'none', background: saving ? '#555' : '#7C6AF7', color: 'white', fontFamily: 'Syne', fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : 'Save & Finish ✓'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!ex) return null

  return (
    <div style={{ minHeight: '100vh', background: '#0C0F1A' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(12,15,26,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/dashboard" style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: '#141829', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 18, flexShrink: 0 }}>←</Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16 }}>{unit?.emoji} {unit?.title}</div>
          <div style={{ color: '#8892B0', fontSize: 13 }}>Question {current + 1} of {exercises.length} · {totalCorrect} correct</div>
        </div>
        <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, background: 'rgba(78,205,196,0.1)', color: '#4ECDC4', border: '1px solid rgba(78,205,196,0.2)' }}>✦ Unique for you</div>
      </header>

      <div style={{ height: 4, background: '#1E2438' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg,#7C6AF7,#4ECDC4)', width: `${((current + (isRevealed ? 1 : 0)) / exercises.length) * 100}%`, transition: 'width 0.5s cubic-bezier(.4,0,.2,1)' }} />
      </div>

      <main style={{ maxWidth: 680, margin: '40px auto', padding: '0 24px' }}>
        <div style={{ background: '#141829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 36, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#4ECDC4', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
              {ex.type === 'multiple_choice' ? '🔤 Multiple Choice' : ex.type === 'fill_blank' ? '✏️ Fill in the Blank' : ex.type === 'error_correction' ? '🔍 Error Correction' : '🔀 Reorder'}
            </span>
            <span style={{ fontSize: 12, color: '#8892B0' }}>{'⭐'.repeat(ex.difficulty || 2)}</span>
          </div>
          <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, lineHeight: 1.4, marginBottom: 20 }}>{ex.question}</div>
          <div style={{ fontSize: 19, lineHeight: 1.7, marginBottom: 24, color: '#E8EAFF' }}>{ex.sentence.replace('___', '______')}</div>

          {ex.type === 'multiple_choice' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(ex.options as string[]).map((opt, i) => {
                let bg = '#1E2438', border = 'rgba(255,255,255,0.08)', color = 'white'
                if (isRevealed) {
                  if (i === ex.correct) { bg = 'rgba(74,222,128,0.1)'; border = '#4ADE80'; color = '#4ADE80' }
                  else if (i === revealed[current]?.chosen) { bg = 'rgba(255,107,107,0.1)'; border = '#FF6B6B'; color = '#FF6B6B' }
                }
                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={isRevealed} style={{ padding: '14px 18px', borderRadius: 14, border: `1px solid ${border}`, background: bg, color, fontFamily: 'DM Sans', fontSize: 15, cursor: isRevealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s', lineHeight: 1.4 }}>
                    <span style={{ opacity: 0.4, marginRight: 8, fontSize: 12 }}>{['A','B','C','D'][i]}</span>{opt}
                  </button>
                )
              })}
            </div>
          )}

          {(ex.type === 'fill_blank' || ex.type === 'error_correction' || ex.type === 'reorder') && (
            <>
              {ex.hint && <div style={{ fontSize: 13, color: '#8892B0', marginBottom: 10, fontStyle: 'italic' }}>💡 {ex.hint}</div>}
              {ex.type === 'error_correction' && <div style={{ fontSize: 13, color: '#FFD93D', marginBottom: 10 }}>✎ Type the full corrected sentence</div>}
              {ex.type === 'reorder' && <div style={{ fontSize: 13, color: '#4ECDC4', marginBottom: 10 }}>🔀 Rearrange into a correct sentence</div>}
              <input
                value={isRevealed ? (answers[current] ? inputVal : `✗ "${inputVal}"  →  ✓ "${ex.correct}"`) : inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isRevealed && inputVal.trim() && handleSubmit()}
                disabled={isRevealed}
                placeholder="Type your answer…"
                style={{ width: '100%', padding: '16px 20px', borderRadius: 14, border: `1px solid ${isRevealed ? (answers[current] ? '#4ADE80' : '#FF6B6B') : 'rgba(255,255,255,0.08)'}`, background: '#1E2438', color: 'white', fontFamily: 'DM Sans', fontSize: 16, outline: 'none', marginBottom: 16 }}
              />
              {!isRevealed && (
                <button onClick={handleSubmit} disabled={!inputVal.trim()} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: inputVal.trim() ? '#7C6AF7' : '#2a2a3a', color: 'white', fontFamily: 'Syne', fontWeight: 700, fontSize: 16, cursor: inputVal.trim() ? 'pointer' : 'not-allowed' }}>
                  Check Answer
                </button>
              )}
            </>
          )}
        </div>

        {feedbackLoading && (
          <div style={{ background: '#141829', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, color: '#8892B0', fontSize: 14 }}>
            🤖 Analysing your answer…
            <span className="dot-pulse"><span /><span /><span /></span>
          </div>
        )}

        {feedback && !feedbackLoading && (
          <div style={{ borderRadius: 16, padding: '20px 24px', marginBottom: 16, background: feedback.correct ? 'rgba(74,222,128,0.07)' : 'rgba(255,107,107,0.07)', border: `1px solid ${feedback.correct ? 'rgba(74,222,128,0.2)' : 'rgba(255,107,107,0.2)'}` }}>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: feedback.text ? 8 : 0, color: feedback.correct ? '#4ADE80' : '#FF6B6B' }}>
              {feedback.correct ? '✓ Correct!' : '✗ Not quite — here\'s why:'}
            </div>
            {feedback.text && <div style={{ color: '#AAB4D0', fontSize: 14, lineHeight: 1.7 }}>{feedback.text}</div>}
          </div>
        )}

        {isRevealed && !feedbackLoading && (
          <button onClick={handleNext} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#7C6AF7,#4ECDC4)', color: 'white', fontFamily: 'Syne', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
            {current + 1 >= exercises.length ? 'See Results →' : 'Next Question →'}
          </button>
        )}

        <style>{`.dot-pulse{display:inline-flex;gap:4px}.dot-pulse span{width:5px;height:5px;background:#7C6AF7;border-radius:50%;animation:dp 1s ease infinite}.dot-pulse span:nth-child(2){animation-delay:.15s}.dot-pulse span:nth-child(3){animation-delay:.3s}@keyframes dp{0%,60%,100%{opacity:.2;transform:scale(.8)}30%{opacity:1;transform:scale(1)}}`}</style>
      </main>
    </div>
  )
}
