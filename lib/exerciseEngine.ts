/**
 * EnglishAI — Exercise Engine
 *
 * Architecture:
 * 1. Check Supabase pool for unseen exercises for this user/unit
 * 2. If pool has enough → return from cache (free, instant)
 * 3. If pool is short → call Claude with a "diversity seed" prompt
 *    so new exercises never repeat topics/sentences already generated
 * 4. Save new exercises to pool + mark all returned as seen
 *
 * Fingerprint = SHA-256(sentence + "|" + correct_answer)
 * This uniquely identifies an exercise without storing full text globally.
 */

import { createClient } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────

export type ExerciseType = 'multiple_choice' | 'fill_blank' | 'error_correction' | 'reorder'

export type Exercise = {
  type: ExerciseType
  question: string
  sentence: string
  hint?: string
  options?: string[]
  correct: string | number
  explanation: string
  difficulty: 1 | 2 | 3
  fingerprint?: string
}

type Unit = {
  id: string
  title: string
  description: string
  level: string
  category_id: string
}

// ─── Fingerprint ──────────────────────────────────────────────

async function fingerprint(sentence: string, correct: string | number): Promise<string> {
  const raw = `${sentence.toLowerCase().trim()}|${String(correct).toLowerCase().trim()}`
  // Browser-compatible SHA-256
  const encoder = new TextEncoder()
  const data = encoder.encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

async function fingerprintExercises(exercises: Exercise[]): Promise<Exercise[]> {
  return Promise.all(
    exercises.map(async (ex) => ({
      ...ex,
      fingerprint: await fingerprint(ex.sentence, String(ex.correct))
    }))
  )
}

// ─── Prompt Builder ───────────────────────────────────────────

function buildPrompt(
  unit: Unit,
  count: number,
  seenSentences: string[],
  difficulty: 1 | 2 | 3
): string {
  const diffLabel = { 1: 'beginner', 2: 'intermediate', 3: 'advanced' }[difficulty]

  const avoidBlock = seenSentences.length > 0
    ? `\nAVOID these sentence starters/topics (already used for this user):\n${seenSentences.slice(-30).map(s => `- ${s}`).join('\n')}\n`
    : ''

  const categoryContext: Record<string, string> = {
    'it-english': 'Use realistic software development context: code reviews, pull requests, standups, debugging, deployment, APIs, databases, agile ceremonies.',
    'business': 'Use professional workplace context: meetings, emails, negotiations, presentations, reports, client calls.',
    'ielts-toefl': 'Use academic English: essays, reports, formal discussions, complex vocabulary, IELTS/TOEFL style questions.',
    'travel': 'Use travel scenarios: airports, hotels, restaurants, directions, transport, tourist attractions.',
    'medical': 'Use medical/healthcare context: doctor-patient conversations, symptoms, diagnoses, procedures, hospital settings.',
    'tenses': 'Focus on time expressions, adverbs, and context clues that determine the correct tense.',
    'grammar': 'Use varied, realistic everyday English sentences.',
    'vocabulary': 'Include word-in-context exercises testing precise meaning.',
  }

  const context = categoryContext[unit.category_id] || 'Use natural, realistic English sentences.'

  return `Generate exactly ${count} unique English exercises for the topic: "${unit.title}" (${unit.description}, CEFR level ${unit.level}, difficulty: ${diffLabel}).

CATEGORY CONTEXT: ${context}
${avoidBlock}
EXERCISE TYPES to mix (use all 4 types across the ${count} exercises):

1. multiple_choice — 4 options, only one correct
2. fill_blank — user types the answer (accept minor spelling variants)
3. error_correction — show a sentence with ONE grammar error, user writes the corrected version
4. reorder — give 4-6 words/phrases scrambled, user types them in correct order

RULES:
- Every sentence must be UNIQUE — different topic/subject/context from the avoid list
- Difficulty ${difficulty}/3: ${difficulty === 1 ? 'short simple sentences, common vocabulary' : difficulty === 2 ? 'compound sentences, some complex grammar' : 'complex sentences, formal register, nuanced grammar'}
- Explanations must be specific to the error, not generic (bad: "use present simple", good: "She is a doctor — stative verbs like 'be' don't use continuous")
- For multiple_choice: make distractors plausible (common learner mistakes)
- For error_correction: the error must be clear and have one definitive fix

Return ONLY a valid JSON array, no markdown, no extra text:
[
  {
    "type": "multiple_choice",
    "question": "Choose the correct verb form:",
    "sentence": "By the time we arrived, she ___ already ___ dinner.",
    "options": ["has / cooked", "had / cooked", "was / cooking", "have / cooked"],
    "correct": 1,
    "explanation": "Past Perfect (had + past participle) is used for an action completed before another past action.",
    "difficulty": ${difficulty}
  },
  {
    "type": "fill_blank",
    "question": "Complete the sentence:",
    "sentence": "The pull request ___ (merge) into main branch yesterday.",
    "hint": "Passive voice, past simple",
    "correct": "was merged",
    "explanation": "Passive voice in Past Simple: was/were + past participle. The subject receives the action.",
    "difficulty": ${difficulty}
  },
  {
    "type": "error_correction",
    "question": "Find and correct the grammar mistake:",
    "sentence": "She don't understand the requirements of the project.",
    "correct": "She doesn't understand the requirements of the project.",
    "explanation": "Third person singular (she/he/it) uses 'doesn't' in negative sentences, not 'don't'.",
    "difficulty": ${difficulty}
  },
  {
    "type": "reorder",
    "question": "Put the words in the correct order:",
    "sentence": "been / has / the / reviewed / code / already",
    "correct": "the code has already been reviewed",
    "explanation": "Present Perfect Passive: subject + has/have + been + past participle. 'Already' goes before the past participle.",
    "difficulty": ${difficulty}
  }
]`
}

// ─── Main Engine ──────────────────────────────────────────────

export async function getExercisesForUser(
  userId: string,
  unit: Unit,
  count: number = 5,
  difficulty: 1 | 2 | 3 = 2
): Promise<{ exercises: Exercise[]; fromCache: number; generated: number }> {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Try to get unseen exercises from the pool
  const { data: poolExercises } = await supabase
    .rpc('get_unseen_exercises', {
      p_user_id: userId,
      p_unit_id: unit.id,
      p_count: count,
    })

  const fromPool: Exercise[] = (poolExercises || []).map((row: any) => ({
    ...row.data,
    fingerprint: row.fingerprint,
  }))

  const needed = count - fromPool.length
  let generated: Exercise[] = []

  if (needed > 0) {
    // 2. Get sentences user has already seen (for diversity prompt)
    const { data: seenRows } = await supabase
      .from('seen_exercises')
      .select('fingerprint')
      .eq('user_id', userId)
      .eq('unit_id', unit.id)
      .limit(50)

    // Also get recent pool sentences for this unit (avoid reuse globally)
    const { data: recentPool } = await supabase
      .from('exercise_pool')
      .select('data')
      .eq('unit_id', unit.id)
      .order('created_at', { ascending: false })
      .limit(40)

    const recentSentences = (recentPool || [])
      .map((r: any) => r.data?.sentence?.split(' ').slice(0, 6).join(' '))
      .filter(Boolean)

    // 3. Call Claude
    const prompt = buildPrompt(unit, needed + 2, recentSentences, difficulty) // +2 buffer

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const aiData = await response.json()
    const text = aiData.content?.map((c: any) => c.text || '').join('') || '[]'
    const clean = text.replace(/```json|```/g, '').trim()

    let parsed: Exercise[] = []
    try { parsed = JSON.parse(clean) } catch { parsed = [] }

    // 4. Fingerprint all generated exercises
    const withFP = await fingerprintExercises(parsed)

    // 5. Deduplicate against what's already in pool
    const { data: existingFPs } = await supabase
      .from('exercise_pool')
      .select('fingerprint')
      .eq('unit_id', unit.id)
      .in('fingerprint', withFP.map(e => e.fingerprint!))

    const existingSet = new Set((existingFPs || []).map((r: any) => r.fingerprint))
    const trulyNew = withFP.filter(e => !existingSet.has(e.fingerprint!))

    // 6. Save new exercises to pool
    if (trulyNew.length > 0) {
      await supabase.from('exercise_pool').insert(
        trulyNew.map(ex => ({
          unit_id: unit.id,
          fingerprint: ex.fingerprint,
          type: ex.type,
          difficulty: ex.difficulty || difficulty,
          data: ex,
        }))
      )
    }

    generated = trulyNew.slice(0, needed)
  }

  // 7. Combine pool + generated, limit to count
  const allExercises = [...fromPool, ...generated].slice(0, count)

  // 8. Mark all as seen for this user
  const fingerprints = allExercises.map(e => e.fingerprint!).filter(Boolean)
  if (fingerprints.length > 0) {
    await supabase.rpc('mark_exercises_seen', {
      p_user_id: userId,
      p_unit_id: unit.id,
      p_fingerprints: fingerprints,
    })

    // Increment use_count in pool
    await supabase
      .from('exercise_pool')
      .update({ use_count: supabase.rpc('use_count') })
      .in('fingerprint', fingerprints)
  }

  return {
    exercises: allExercises,
    fromCache: fromPool.length,
    generated: generated.length,
  }
}

// ─── AI Feedback (per wrong answer) ──────────────────────────

export async function getWrongAnswerFeedback(
  unit: Unit,
  exercise: Exercise,
  userAnswer: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `English grammar feedback. Topic: ${unit.title}.
Sentence: "${exercise.sentence}"
Student answered: "${userAnswer}"
Correct answer: "${exercise.correct}"

Write 2-3 sentences explaining WHY the correct answer is right and what rule applies.
Be encouraging, specific, and use an example if helpful. Plain text only, no markdown.`
      }]
    })
  })

  const data = await response.json()
  return data.content?.map((c: any) => c.text || '').join('') || exercise.explanation
}

// ─── Stats: how many exercises does the user have left ────────

export async function getUserExerciseStats(userId: string, unitId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .rpc('get_user_unit_progress', { p_user_id: userId, p_unit_id: unitId })
    .single()

  return {
    seen: Number(data?.seen_count || 0),
    poolAvailable: Number(data?.pool_count || 0),
    theoreticalMax: Number(data?.theoretical_max || 24000),
  }
}
